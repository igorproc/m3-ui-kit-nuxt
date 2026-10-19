import type { Ref } from 'vue'

export type FileUploadStatus = 'queued' | 'uploading' | 'success' | 'error' | 'cancelled'

export interface FileUploadTaskContext {
  signal: AbortSignal
  reportProgress: (progress: number) => void
}

export interface FileUploadEntry<TResult = unknown> {
  id: string
  file: File
  status: FileUploadStatus
  progress: number | null
  result?: TResult
  error?: unknown
}

/** What happened to a row; `complete` — nothing is queued or uploading any more. */
export type FileUploadEvent = 'start' | 'progress' | 'success' | 'error' | 'cancel' | 'complete'

export type FileUploadListener<TResult> = (event: FileUploadEvent, entry?: FileUploadEntry<TResult>) => void

export interface FileUploadQueueOptions<TResult> {
  upload?: (file: File, context: FileUploadTaskContext) => Promise<TResult>
  concurrency: () => number
  onStart?: (entry: FileUploadEntry<TResult>) => void
  onProgress?: (entry: FileUploadEntry<TResult>) => void
  onSuccess?: (entry: FileUploadEntry<TResult>) => void
  onError?: (entry: FileUploadEntry<TResult>) => void
  onCancel?: (entry: FileUploadEntry<TResult>) => void
  onComplete?: () => void
}

export interface FileUploadQueue<TResult = unknown> {
  entries: Readonly<Ref<readonly FileUploadEntry<TResult>[]>>
  /** Whether the queue has an `upload` to run: without one, rows only wait. */
  canUpload: boolean
  /** Adds files not in the queue yet (same name, size, type and date = same file); returns the new rows. */
  add: (files: readonly File[]) => FileUploadEntry<TResult>[]
  /** Starts one row, or — without an id — every row still waiting to be started. */
  start: (id?: string) => void
  /** Stops an upload, or withdraws a row that was asked to go. */
  cancel: (id: string) => void
  retry: (id: string) => void
  /** Takes a row out; only a running upload is cancelled on the way. */
  remove: (id: string) => void
  /**
   * Hears every status change, whoever created the queue. Returns the
   * unsubscribe function; a component holding an outside queue calls it when
   * it unmounts.
   */
  subscribe: (listener: FileUploadListener<TResult>) => () => void
}

export function useFileUploadQueue<TResult = unknown>(options: FileUploadQueueOptions<TResult>): FileUploadQueue<TResult> {
  // Annotated rather than inferred: ref() would unwrap the generic TResult.
  const entries = ref([]) as Ref<FileUploadEntry<TResult>[]>
  const controllers = new Map<string, AbortController>()
  // `queued` covers two states: added, and asked to upload but waiting for a
  // slot. Only the asked ones are ever scheduled — a file nobody started is
  // never sent because a slot happened to free up.
  const requested = new Set<string>()
  const listeners = new Set<FileUploadListener<TResult>>()
  let sequence = 0

  const keyOf = (file: File) => `${file.name}:${file.size}:${file.type}:${file.lastModified}`
  const find = (id: string) => entries.value.find(entry => entry.id === id)

  const CALLBACKS = {
    start: options.onStart,
    progress: options.onProgress,
    success: options.onSuccess,
    error: options.onError,
    cancel: options.onCancel,
  } as const

  function notify(event: FileUploadEvent, entry?: FileUploadEntry<TResult>) {
    if (event === 'complete') options.onComplete?.()
    else if (entry) CALLBACKS[event]?.(entry)
    for (const listener of listeners) listener(event, entry)
  }

  function add(files: readonly File[]) {
    const known = new Set(entries.value.map(entry => keyOf(entry.file)))
    const added: FileUploadEntry<TResult>[] = []
    for (const file of files) {
      const key = keyOf(file)
      if (known.has(key)) continue
      known.add(key)
      const entry: FileUploadEntry<TResult> = {
        id: `upload-${sequence++}`,
        file,
        status: 'queued',
        progress: null,
      }
      entries.value.push(entry)
      added.push(entry)
    }
    return added
  }

  async function run(entry: FileUploadEntry<TResult>) {
    if (!options.upload || entry.status === 'uploading') return
    const controller = new AbortController()
    controllers.set(entry.id, controller)
    entry.status = 'uploading'
    entry.error = undefined
    entry.progress = null
    notify('start', entry)
    try {
      const result = await options.upload(entry.file, {
        signal: controller.signal,
        reportProgress: (progress) => {
          if (entry.status !== 'uploading') return
          entry.progress = Math.min(100, Math.max(0, progress))
          notify('progress', entry)
        },
      })
      if (controller.signal.aborted) return
      entry.result = result
      entry.progress = 100
      entry.status = 'success'
      notify('success', entry)
    } catch (error) {
      if (controller.signal.aborted) return
      entry.error = error
      entry.status = 'error'
      notify('error', entry)
    } finally {
      controllers.delete(entry.id)
      schedule()
      announceComplete()
    }
  }

  function schedule() {
    if (!options.upload) return
    const running = entries.value.filter(entry => entry.status === 'uploading').length
    const available = Math.max(0, Math.max(1, Math.floor(options.concurrency())) - running)
    entries.value
      .filter(entry => entry.status === 'queued' && requested.has(entry.id))
      .slice(0, available)
      .forEach((entry) => {
        requested.delete(entry.id)
        void run(entry)
      })
  }

  function start(id?: string) {
    if (id) {
      const entry = find(id)
      if (entry && (entry.status === 'queued' || entry.status === 'error' || entry.status === 'cancelled')) {
        entry.status = 'queued'
        requested.add(entry.id)
      }
    } else {
      entries.value.filter(entry => entry.status === 'queued').forEach(entry => requested.add(entry.id))
    }
    schedule()
  }

  function cancel(id: string) {
    const entry = find(id)
    if (!entry || !['queued', 'uploading'].includes(entry.status)) return
    const stoppedUpload = entry.status === 'uploading'
    controllers.get(id)?.abort()
    controllers.delete(id)
    requested.delete(id)
    entry.status = 'cancelled'
    notify('cancel', entry)
    // Only a stopped upload frees a slot for the next row asked to go.
    if (stoppedUpload) schedule()
    announceComplete()
  }

  function retry(id: string) {
    const entry = find(id)
    if (!entry || !['error', 'cancelled'].includes(entry.status)) return
    entry.status = 'queued'
    entry.error = undefined
    entry.progress = null
    requested.add(entry.id)
    schedule()
  }

  // Removing a file that never left is not a cancellation: no `cancel`, nothing
  // announced. Only an upload under way has something to stop.
  function remove(id: string) {
    const entry = find(id)
    if (!entry) return
    if (entry.status === 'uploading') cancel(id)
    const waiting = entry.status === 'queued'
    requested.delete(id)
    entries.value = entries.value.filter(row => row.id !== id)
    if (waiting) announceComplete()
  }

  function announceComplete() {
    if (entries.value.every(entry => !['queued', 'uploading'].includes(entry.status))) notify('complete')
  }

  function subscribe(listener: FileUploadListener<TResult>) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  onScopeDispose(() => {
    controllers.forEach(controller => controller.abort())
    controllers.clear()
    listeners.clear()
  })

  // DeepReadonly would freeze the File objects' own types; the rows are what is read-only.
  const view = readonly(entries) as Readonly<Ref<readonly FileUploadEntry<TResult>[]>>

  return { entries: view, canUpload: Boolean(options.upload), add, start, cancel, retry, remove, subscribe }
}
