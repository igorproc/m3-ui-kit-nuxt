import type { Ref } from 'vue'
import { clonePlainData, equalPlainData } from '~~/shared/utils/object/cloneEqual'

export interface ConfirmEditTransactionOptions<T> {
  model: Ref<T>
  open: Ref<boolean>
  clone?: (value: T) => T
  compare?: (draft: T, committed: T) => boolean
  save?: (draft: T, committed: T) => T | undefined | Promise<T | undefined>
  onSave?: (value: T) => void
  onError?: (error: unknown) => void
  onConflict?: (external: T, draft: T) => void
}

export function useConfirmEditTransaction<T>(options: ConfirmEditTransactionOptions<T>) {
  const clone = options.clone ?? clonePlainData
  const compare = options.compare ?? equalPlainData
  const draft = shallowRef<T>(clone(options.model.value)) as Ref<T>
  const committed = shallowRef<T>(options.model.value) as Ref<T>
  const saving = ref(false)
  const conflicted = ref(false)
  const error = shallowRef<unknown>()
  let internalCommit = false

  const dirty = computed(() => !compare(draft.value, committed.value))

  function setDraft(value: T) {
    draft.value = clone(value)
  }

  function patchDraft(patch: Partial<T>) {
    if (!draft.value || typeof draft.value !== 'object' || Array.isArray(draft.value)) {
      throw new TypeError('[m-confirm-edit] patchDraft requires an object draft')
    }
    draft.value = { ...draft.value, ...patch }
  }

  function sync() {
    committed.value = options.model.value
    draft.value = clone(options.model.value)
    conflicted.value = false
    error.value = undefined
  }

  function reset() {
    draft.value = clone(committed.value)
    conflicted.value = false
    error.value = undefined
  }

  function cancel() {
    committed.value = options.model.value
    reset()
  }

  async function save() {
    if (saving.value || conflicted.value || !dirty.value) return false
    saving.value = true
    error.value = undefined
    try {
      const candidate = clone(draft.value)
      const result = await options.save?.(candidate, committed.value)
      const next = result === undefined ? candidate : result
      internalCommit = true
      options.model.value = next
      committed.value = next
      draft.value = clone(next)
      options.onSave?.(next)
      return true
    } catch (caught) {
      error.value = caught
      options.onError?.(caught)
      return false
    } finally {
      saving.value = false
      nextTick(() => {
        internalCommit = false
      })
    }
  }

  watch(options.model, (external) => {
    if (internalCommit) return
    if (!options.open.value || !dirty.value) {
      committed.value = external
      draft.value = clone(external)
      conflicted.value = false
      return
    }
    committed.value = external
    conflicted.value = true
    options.onConflict?.(external, draft.value)
  })

  watch(options.open, (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) sync()
  })

  return {
    draft: readonly(draft),
    committed: readonly(committed),
    dirty: readonly(dirty),
    saving: readonly(saving),
    conflicted: readonly(conflicted),
    error: readonly(error),
    setDraft,
    patchDraft,
    save,
    cancel,
    reset,
    sync,
  }
}
