/**
 * @module overlay/useOverlayLifecycle
 *
 * @remarks
 * Open/close state machine of a modal-layer surface. `model` is the source of
 * truth; `status` follows it through the transitions:
 *
 * - open: `beforeOpen` (stoppable) → `opening` → mount + `show()` → every
 *   transition part entered → `open` + `opened`.
 * - close: `beforeClose` (stoppable) → `closing` → `prepareClose()` (children
 *   first) → every part left → `hide()` → `closed` + `closed`.
 *
 * "Every part" is counted from Vue `<transition>` hooks, which fire even when a
 * part has no CSS transition or motion is reduced — so settling never waits on
 * a `transitionend` that will not come.
 */
import { nextTick, onMounted, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import type { OverlayStatus } from '#kit/composables/modal/useModalContext'

export interface StoppableEvent {
  stop: () => void
}

export interface OverlayLifecycleHooks {
  beforeOpen?: (event: StoppableEvent) => void
  beforeClose?: (event: StoppableEvent) => void
  opened?: () => void
  closed?: () => void
}

export interface UseOverlayLifecycleOptions {
  /** Number of transition parts (scrim, content) a phase waits for. */
  parts: () => number
  /** Keep the surface mounted after closing (`displayDirective: 'show'`). */
  keepMounted: () => boolean
  /** Promote the mounted surface (top layer, scroll lock, stack). */
  show: () => void
  /** Demote it once the leave transitions are done. */
  hide: () => void
  /** Runs before the leave transition; returning `false` aborts the close. */
  prepareClose?: () => Promise<boolean>
  hooks: OverlayLifecycleHooks
}

export interface UseOverlayLifecycleReturn {
  status: Readonly<Ref<OverlayStatus>>
  /** The surface is in the DOM (gates the teleport). */
  isRendered: Readonly<Ref<boolean>>
  /** Drives the `v-show` inside the transitions. */
  isVisible: Readonly<Ref<boolean>>
  onPartAfterEnter: () => void
  onPartAfterLeave: () => void
  /** Resolves when the current or next open attempt ends (open, stopped, or closed first). */
  whenOpenSettles: () => Promise<void>
  /** Resolves when the current or next close attempt ends (closed, or stopped). */
  whenCloseSettles: () => Promise<void>
}

export function useOverlayLifecycle(model: Ref<boolean>, options: UseOverlayLifecycleOptions): UseOverlayLifecycleReturn {
  const status = shallowRef<OverlayStatus>('closed')
  const isRendered = shallowRef(false)
  const isVisible = shallowRef(false)

  let settledParts = 0
  let openWaiters: Array<() => void> = []
  let closeWaiters: Array<() => void> = []

  function flush(waiters: Array<() => void>) {
    waiters.forEach(resolve => resolve())
  }

  function flushOpenWaiters() {
    const waiters = openWaiters
    openWaiters = []
    flush(waiters)
  }

  function flushCloseWaiters() {
    const waiters = closeWaiters
    closeWaiters = []
    flush(waiters)
  }

  function isStopped(hook?: (event: StoppableEvent) => void): boolean {
    let stopped = false
    hook?.({
      stop: () => {
        stopped = true
      },
    })
    return stopped
  }

  async function runOpen() {
    if (status.value === 'open' || status.value === 'opening') return
    if (isStopped(options.hooks.beforeOpen)) {
      model.value = false
      flushOpenWaiters()
      return
    }

    status.value = 'opening'
    settledParts = 0
    isRendered.value = true
    await nextTick()
    if (status.value !== 'opening') return

    options.show()
    isVisible.value = true
  }

  function finishClose() {
    options.hide()
    isVisible.value = false
    if (!options.keepMounted()) isRendered.value = false
    status.value = 'closed'
    options.hooks.closed?.()
    flushCloseWaiters()
  }

  function abortClose() {
    status.value = 'open'
    model.value = true
    flushCloseWaiters()
  }

  async function runClose() {
    if (status.value === 'closed' || status.value === 'closing') return
    if (isStopped(options.hooks.beforeClose)) {
      model.value = true
      flushCloseWaiters()
      return
    }

    status.value = 'closing'
    settledParts = 0
    flushOpenWaiters()

    const canClose = await (options.prepareClose?.() ?? Promise.resolve(true))
    if (status.value !== 'closing') return
    if (!canClose) {
      abortClose()
      return
    }

    // Closed before the surface ever became visible: nothing will animate out.
    if (!isVisible.value) {
      finishClose()
      return
    }
    isVisible.value = false
  }

  function onPartAfterEnter() {
    if (status.value !== 'opening') return
    if (++settledParts < options.parts()) return
    status.value = 'open'
    options.hooks.opened?.()
    flushOpenWaiters()
  }

  function onPartAfterLeave() {
    if (status.value !== 'closing') return
    if (++settledParts < options.parts()) return
    finishClose()
  }

  function whenOpenSettles(): Promise<void> {
    if (status.value === 'open') return Promise.resolve()
    return new Promise(resolve => openWaiters.push(resolve))
  }

  function whenCloseSettles(): Promise<void> {
    if (status.value === 'closed') return Promise.resolve()
    return new Promise(resolve => closeWaiters.push(resolve))
  }

  watch(model, value => (value ? runOpen() : runClose()))

  // The surface is client-only (teleported into the overlay host), so an
  // initially open overlay starts its lifecycle once mounted, never during SSR.
  onMounted(() => {
    if (model.value) runOpen()
  })

  return { status, isRendered, isVisible, onPartAfterEnter, onPartAfterLeave, whenOpenSettles, whenCloseSettles }
}
