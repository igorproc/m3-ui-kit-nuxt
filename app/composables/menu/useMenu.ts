import { computed } from 'vue'
import type { Ref } from 'vue'
import type { UiMenuOrigin } from '~/components/ui/menu/types'
import { usePopover } from '~/composables/popover/usePopover'
import type { PopoverRect, PopoverStatus } from '~/composables/popover/usePopover'

/**
 * @module useMenu
 *
 * @remarks
 * Thin adapter over the shared {@link usePopover} primitive, preserving the
 * menu's exact public surface and CSS output. The open/close FSM, trigger rect
 * and anchor-support detection now live in `usePopover` (shared with tooltip and
 * dropdown), while this wrapper keeps the menu-specific `menuStyle` math
 * (`origin → position-area`, the `--ui-menu-origin` custom property, the
 * `absolute` early-return and the right-edge JS fallback) byte-for-byte, so
 * `menu/index.vue` is unchanged.
 *
 * @example
 * ```ts
 * const model = defineModel<boolean>()
 * const menu = useMenu(model, {
 *   absolute: () => props.absolute,
 *   origin: () => props.origin,
 *   matchWidth: () => props.matchWidth,
 * })
 * ```
 */

/** Lifecycle states. `opening`/`closing` are transient animation guards. */
export type MenuStatus = PopoverStatus

/** Viewport-relative geometry of the trigger, measured by the component. */
export type MenuRect = PopoverRect

export interface UseMenuOptions {
  absolute: () => boolean
  origin: () => UiMenuOrigin
  matchWidth: () => boolean
}

const Z_INDEX = '999'

/**
 * Map a logical origin to a CSS `position-area`.
 *
 * @remarks
 * Default (left) origins align the surface to the trigger's left edge and
 * span rightwards (`span-right`); right origins mirror that.
 */
function originToArea(origin: UiMenuOrigin): string {
  if (origin.includes('right')) {
    return 'bottom span-left'
  }
  if (origin === 'top' || origin === 'bottom' || origin === 'center') {
    return 'bottom'
  }
  return 'bottom span-right'
}

export function useMenu(model: Ref<boolean>, options: UseMenuOptions) {
  const popover = usePopover(model)

  /** Pure positioning math derived from the measured trigger rect. */
  const menuStyle = computed<Record<string, string>>(() => {
    const origin = options.origin()

    if (!options.absolute()) {
      return { '--ui-menu-origin': origin }
    }

    // Preferred path: let the browser anchor the surface natively.
    if (popover.isAnchorSupported.value) {
      const style: Record<string, string> = {
        'position': 'fixed',
        'inset': 'unset',
        'margin': 'unset',
        'position-anchor': popover.anchorName,
        'position-area': originToArea(origin),
        'z-index': Z_INDEX,
        '--ui-menu-origin': origin,
      }
      if (options.matchWidth()) {
        style.width = 'anchor-size(width)'
      }
      return style
    }

    // JS fallback: pin to the measured rect, re-measured on scroll/resize.
    const rect = popover.rect.value
    const style: Record<string, string> = {
      'position': 'fixed',
      'top': `${rect.bottom}px`,
      'z-index': Z_INDEX,
      '--ui-menu-origin': origin,
    }

    if (origin.includes('right') && import.meta.client) {
      style.right = `${window.innerWidth - rect.right}px`
    } else {
      style.left = `${rect.left}px`
    }

    if (options.matchWidth()) {
      style.width = `${rect.width}px`
    }

    return style
  })

  return {
    anchorName: popover.anchorName,
    status: popover.status,
    isOpen: popover.isOpen,
    isAnchorSupported: popover.isAnchorSupported,
    menuStyle,
    open: popover.open,
    close: popover.close,
    toggle: popover.toggle,
    onAfterEnter: popover.onAfterEnter,
    onAfterLeave: popover.onAfterLeave,
    setRect: popover.setRect,
  }
}
