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

export function useFileUploadQueue<TResult = unknown>(options: FileUploadQueueOptions<TResult>) {
  const entries = ref<FileUploadEntry<TResult>[]>([])
  const controllers = new Map<string, AbortController>()
  let sequence = 0

  const keyOf = (file: File) => `${file.name}:${file.size}:${file.type}:${file.lastModified}`
  const find = (id: string) => entries.value.find(entry => entry.id === id)

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
    options.onStart?.(entry)
    try {
      const result = await options.upload(entry.file, {
        signal: controller.signal,
        reportProgress: (progress) => {
          if (entry.status !== 'uploading') return
          entry.progress = Math.min(100, Math.max(0, progress))
          options.onProgress?.(entry)
        },
      })
      if (controller.signal.aborted) return
      entry.result = result
      entry.progress = 100
      entry.status = 'success'
      options.onSuccess?.(entry)
    } catch (error) {
      if (controller.signal.aborted) return
      entry.error = error
      entry.status = 'error'
      options.onError?.(entry)
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
    entries.value.filter(entry => entry.status === 'queued').slice(0, available).forEach(entry => void run(entry))
  }

  function start(id?: string) {
    if (id) {
      const entry = find(id)
      if (entry && (entry.status === 'queued' || entry.status === 'error' || entry.status === 'cancelled')) {
        entry.status = 'queued'
      }
    }
    schedule()
  }

  function cancel(id: string) {
    const entry = find(id)
    if (!entry || !['queued', 'uploading'].includes(entry.status)) return
    controllers.get(id)?.abort()
    controllers.delete(id)
    entry.status = 'cancelled'
    options.onCancel?.(entry)
    schedule()
    announceComplete()
  }

  function retry(id: string) {
    const entry = find(id)
    if (!entry || !['error', 'cancelled'].includes(entry.status)) return
    entry.status = 'queued'
    entry.error = undefined
    entry.progress = null
    schedule()
  }

  function remove(id: string) {
    cancel(id)
    entries.value = entries.value.filter(entry => entry.id !== id)
  }

  function announceComplete() {
    if (entries.value.every(entry => !['queued', 'uploading'].includes(entry.status))) options.onComplete?.()
  }

  onScopeDispose(() => {
    controllers.forEach(controller => controller.abort())
    controllers.clear()
  })

  return { entries: readonly(entries), add, start, cancel, retry, remove }
}
