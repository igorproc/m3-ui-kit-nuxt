/**
 * @module overlay/useTopLayer
 *
 * @remarks
 * Moves an overlay root in and out of the browser top layer:
 *
 * - modal `<dialog>` → `showModal()` (top layer + `inert` page + close requests);
 * - `[popover]` root (non-modal overlays, `background: 'interactive'`) →
 *   `showPopover()` (top layer, page stays interactive);
 * - no Popover API → `<dialog>.show()` / nothing, and the caller's stack
 *   z-index keeps the order instead.
 *
 * Every call is idempotent, so a reopen during a leave transition is safe.
 */
import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { supportsPopover } from '#kit/shared/utils/support'

export interface UseTopLayerReturn {
  show: () => void
  hide: () => void
  /** `true` while `hide()` runs — lets a native `close` listener tell ours from the browser's. */
  isHiding: () => boolean
}

function isPopoverOpen(el: HTMLElement): boolean {
  return supportsPopover() && el.hasAttribute('popover') && el.matches(':popover-open')
}

export function useTopLayer(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  isModal: () => boolean,
): UseTopLayerReturn {
  let hiding = false

  function show() {
    const el = toValue(target)
    if (!el) return

    if (isModal() && el instanceof HTMLDialogElement) {
      if (!el.open) el.showModal()
      return
    }
    if (supportsPopover() && el.hasAttribute('popover')) {
      if (!isPopoverOpen(el)) el.showPopover()
      return
    }
    if (el instanceof HTMLDialogElement && !el.open) el.show()
  }

  function hide() {
    const el = toValue(target)
    if (!el) return

    hiding = true
    try {
      if (isPopoverOpen(el)) el.hidePopover()
      if (el instanceof HTMLDialogElement && el.open) el.close()
    } finally {
      hiding = false
    }
  }

  return { show, hide, isHiding: () => hiding }
}
