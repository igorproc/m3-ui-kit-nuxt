/**
 * @module overlay/useOverlayDismiss
 *
 * @remarks
 * How a user dismisses an `<MOverlay>`: the scrim or a press outside, Escape
 * (the browser's close request on a modal `<dialog>`, a key listener for the
 * rest) and the swipe. Only the topmost overlay answers; `persistent` and the
 * `closeOn*` props veto. An accepted dismissal is reported with its reason
 * before the overlay starts closing.
 */
import { onScopeDispose, watch } from 'vue'
import type { Ref } from 'vue'
import { useClickOutside } from '#kit/composables/useClickOutside'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import type { MOverlayDismissReason, MOverlaySwipeDirection } from '#kit/components/ui/overlay/props'

export interface OverlayDismissPolicy {
  persistent: boolean
  closeOnOutside: boolean
  closeOnEscape: boolean
  closeOnSwipe: MOverlaySwipeDirection
}

export interface UseOverlayDismissOptions {
  policy: () => OverlayDismissPolicy
  isOpen: () => boolean
  isTop: () => boolean
  /** The browser sends close requests to a modal `<dialog>` itself. */
  receivesCloseRequests: () => boolean
  /** With a scrim, the scrim click is the outside press. */
  hasScrim: () => boolean
  panel: Readonly<Ref<HTMLElement | null>>
  close: () => void
  onDismiss: (reason: MOverlayDismissReason) => void
  onClickOutside: () => void
}

export interface UseOverlayDismissReturn {
  canDismiss: (reason: MOverlayDismissReason) => boolean
  request: (reason: MOverlayDismissReason) => void
  onScrimClick: () => void
  /** The `cancel` event of a modal `<dialog>`. Always prevented: the kit decides. */
  onCancel: (event: Event) => void
}

export function useOverlayDismiss(options: UseOverlayDismissOptions): UseOverlayDismissReturn {
  function canDismiss(reason: MOverlayDismissReason): boolean {
    const policy = options.policy()
    if (policy.persistent) return false
    if (reason === 'outside') return policy.closeOnOutside
    if (reason === 'escape') return policy.closeOnEscape
    return policy.closeOnSwipe !== 'none'
  }

  function request(reason: MOverlayDismissReason) {
    if (!canDismiss(reason)) return
    options.onDismiss(reason)
    options.close()
  }

  function onScrimClick() {
    options.onClickOutside()
    request('outside')
  }

  // An overlay stacked above (menu, tooltip) handles its own Esc.
  function onCancel(event: Event) {
    event.preventDefault()
    if (options.isTop()) request('escape')
  }

  function onEscape(event: Event) {
    if (!options.isOpen() || !options.isTop() || options.receivesCloseRequests()) return
    if ((event as KeyboardEvent).key !== 'Escape') return
    event.preventDefault()
    request('escape')
  }

  const outside = useClickOutside(options.panel, () => {
    if (!options.isOpen() || !options.isTop() || options.hasScrim()) return
    options.onClickOutside()
    request('outside')
  })

  let stopEscape: (() => void) | undefined

  function listenWhileOpen(open: boolean) {
    stopEscape?.()
    stopEscape = open ? useGlobalListener('window', 'keydown', onEscape) : undefined
    if (open) outside.resume()
    else outside.pause()
  }

  watch(options.isOpen, listenWhileOpen, { immediate: true })
  onScopeDispose(() => stopEscape?.())

  return { canDismiss, request, onScrimClick, onCancel }
}
