import { computed, nextTick, readonly, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { clonePlainData, equalPlainData } from '#kit/shared/utils/object/cloneEqual'

/** How an edit ended. `conflict` and `error` leave the edit open to resolve. */
export type ConfirmEditOutcome = 'saved' | 'cancelled' | 'conflict' | 'error'

export interface ConfirmEditResult<T> {
  outcome: ConfirmEditOutcome
  /** The committed value after the edit. */
  value: T
  error?: unknown
}

export interface ConfirmEditSaveContext<T> {
  committed: T
  /** Aborts when the edit is cancelled while the save is in flight. */
  signal: AbortSignal
}

export interface ConfirmEditTransactionOptions<T> {
  /** The committed value. Written only by a save that succeeds. */
  model: Ref<T>
  /**
   * Stores the draft. Resolves to the stored value, or to `undefined` to keep
   * the draft as is; a rejection is the `error` outcome.
   */
  save?: (draft: T, context: ConfirmEditSaveContext<T>) => T | undefined | Promise<T | undefined>
  clone?: (value: T) => T
  compare?: (left: T, right: T) => boolean
}

/**
 * An edit as a transaction: a draft taken when the edit begins, a `commit()`
 * that saves it and resolves with an outcome, a `cancel()` that drops it and
 * aborts a save in flight. A change to the model from outside while the draft
 * is dirty is a conflict, never a silent overwrite: `keepDraft()` saves over
 * it on the next commit, `takeExternal()` takes it.
 *
 * Markup and copy belong to the app — the recipe is a field, two
 * `MButtonIcon`s and a live region that says the outcome.
 */
export function useConfirmEditTransaction<T>(options: ConfirmEditTransactionOptions<T>) {
  const clone = options.clone ?? clonePlainData
  const compare = options.compare ?? equalPlainData

  const editing = ref(false)
  const draft = shallowRef(clone(options.model.value)) as Ref<T>
  const committed = shallowRef(options.model.value) as Ref<T>
  const pending = ref(false)
  const conflicted = ref(false)
  const outcome = ref<ConfirmEditOutcome | null>(null)
  const error = shallowRef<unknown>()
  const dirty = computed(() => !compare(draft.value, committed.value))

  let controller: AbortController | null = null
  let inFlight: Promise<ConfirmEditResult<T>> | null = null
  // Our own write to the model is not someone else's change.
  let writing = false

  const result = (next: ConfirmEditOutcome, caught?: unknown): ConfirmEditResult<T> => {
    outcome.value = next
    return { outcome: next, value: committed.value, ...(caught === undefined ? {} : { error: caught }) }
  }

  function settle(value: T) {
    committed.value = value
    draft.value = clone(value)
    conflicted.value = false
    error.value = undefined
  }

  /** Opens the edit on a fresh draft of the committed value. */
  function begin() {
    settle(options.model.value)
    outcome.value = null
    editing.value = true
  }

  function setDraft(value: T) {
    draft.value = clone(value)
  }

  async function run(candidate: T, signal: AbortSignal): Promise<ConfirmEditResult<T>> {
    try {
      const stored = await options.save?.(candidate, { committed: committed.value, signal })
      if (signal.aborted) return result('cancelled')
      const next = stored === undefined ? candidate : stored
      writing = true
      options.model.value = next
      settle(next)
      editing.value = false
      return result('saved')
    } catch (caught) {
      if (signal.aborted) return result('cancelled')
      error.value = caught
      return result('error', caught)
    } finally {
      pending.value = false
      controller = null
      inFlight = null
      nextTick(() => {
        writing = false
      })
    }
  }

  /** Saves the draft. A second call while saving waits for the first. */
  function commit(): Promise<ConfirmEditResult<T>> {
    if (inFlight) return inFlight
    if (!editing.value) return Promise.resolve(result('cancelled'))
    if (conflicted.value) return Promise.resolve(result('conflict'))
    if (!dirty.value) {
      editing.value = false
      return Promise.resolve(result('saved'))
    }

    pending.value = true
    error.value = undefined
    controller = new AbortController()
    inFlight = run(clone(draft.value), controller.signal)
    return inFlight
  }

  /** Drops the draft and aborts a save in flight. */
  function cancel(): ConfirmEditResult<T> {
    controller?.abort()
    settle(options.model.value)
    editing.value = false
    return result('cancelled')
  }

  /** After a conflict: keep the draft and save it over the newer value. */
  function keepDraft() {
    committed.value = options.model.value
    conflicted.value = false
  }

  /** After a conflict: drop the draft for the newer value. */
  function takeExternal() {
    settle(options.model.value)
  }

  watch(options.model, (external) => {
    if (writing) return
    if (editing.value && dirty.value) {
      conflicted.value = true
      outcome.value = 'conflict'
      return
    }
    settle(external)
  })

  return {
    editing: readonly(editing),
    draft,
    committed: readonly(committed),
    dirty,
    pending: readonly(pending),
    conflicted: readonly(conflicted),
    outcome: readonly(outcome),
    error: readonly(error),
    begin,
    setDraft,
    commit,
    cancel,
    keepDraft,
    takeExternal,
  }
}
