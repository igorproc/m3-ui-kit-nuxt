/**
 * @module modal/useModalResult
 *
 * @remarks
 * The answer a modal surface (`MDialog`, `MSheet`) gives its caller. Its
 * slots get `confirm(payload)` and `cancel()`; a user dismissal of the layer
 * (scrim, Escape, swipe) is a cancel too, named by its reason. A close that
 * is neither — the parent setting `v-model` to `false`, the slot's `close()`
 * — gives no answer.
 *
 * One answer per opening: a second press while the surface animates out is
 * ignored.
 */
import { watch } from 'vue'
import type { Ref } from 'vue'
import type { MOverlayDismissReason } from '#kit/components/ui/overlay/props'

/** Why a modal surface was cancelled: its own Cancel, or a dismissal of the layer. */
export type MModalCancelReason = 'cancel' | MOverlayDismissReason

export interface MModalResultEmits {
  (event: 'confirm', payload?: unknown): void
  (event: 'cancel', reason: MModalCancelReason): void
}

export interface UseModalResultReturn {
  confirm: (payload?: unknown) => void
  cancel: () => void
  /** Bound to the overlay's `dismiss`: the layer closes itself, this only answers. */
  onDismiss: (reason: MOverlayDismissReason) => void
}

export function useModalResult(model: Ref<boolean>, emit: MModalResultEmits): UseModalResultReturn {
  let answered = false

  watch(model, (open) => {
    if (open) answered = false
  })

  function answer(send: () => void) {
    if (answered || !model.value) return
    answered = true
    send()
    model.value = false
  }

  return {
    confirm: payload => answer(() => emit('confirm', payload)),
    cancel: () => answer(() => emit('cancel', 'cancel')),
    onDismiss: reason => answer(() => emit('cancel', reason)),
  }
}
