import { computed } from 'vue'
import type { Ref } from 'vue'
import type { UiMenuOrigin } from '#kit/components/ui/menu/types'
import { usePopover } from '#kit/composables/popover/usePopover'
import type { PopoverStatus } from '#kit/composables/popover/usePopover'
import type { PopoverPlacement, PopoverRect } from '#kit/composables/popover/placement'

/**
 * @module useMenu
 *
 * @remarks
 * Thin adapter over the shared {@link usePopover} primitive. The FSM, anchor
 * detection and all placement math (native `position-try-fallbacks` flip, JS
 * flip + shift fallback) live in `usePopover`; this wrapper only translates the
 * menu's `origin` into a popover placement and adds the `--ui-menu-origin`
 * custom property the surface animation reads.
 *
 * Pass `trigger` and `surface` to let `usePopover` measure them and re-measure
 * on scroll/resize for the JS path; without them the composable stays DOM-free.
 *
 * @example
 * ```ts
 * const model = defineModel<boolean>()
 * const menu = useMenu(model, {
 *   absolute: () => props.absolute,
 *   origin: () => props.origin,
 *   matchWidth: () => props.matchWidth,
 *   trigger: () => anchorEl.value,
 *   surface: () => surfaceEl.value,
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
  /** Element the surface is positioned against (JS path measuring). */
  trigger?: () => HTMLElement | null | undefined
  /** Positioned element whose layout size feeds the JS flip/shift. */
  surface?: () => HTMLElement | null | undefined
}

const Z_INDEX = '999'

/**
 * Map a logical origin to a popover placement.
 *
 * @remarks
 * The menu always opens below its trigger (flipping above when it has to).
 * Default (left) origins align to the trigger's left edge, right origins to its
 * right edge, the rest center on it.
 */
function originToPlacement(origin: UiMenuOrigin): PopoverPlacement {
  if (origin.includes('right')) return 'bottom-end'
  if (origin === 'top' || origin === 'bottom' || origin === 'center') return 'bottom'
  return 'bottom-start'
}

export function useMenu(model: Ref<boolean>, options: UseMenuOptions) {
  const popover = usePopover(model, {
    placement: () => originToPlacement(options.origin()),
    matchWidth: options.matchWidth,
    trigger: options.trigger && (() => (options.absolute() ? options.trigger?.() : null)),
    surface: options.surface,
    zIndex: Z_INDEX,
  })

  const menuStyle = computed<Record<string, string>>(() => {
    const origin = options.origin()

    if (!options.absolute()) {
      return { '--ui-menu-origin': origin }
    }

    return { ...popover.popoverStyle.value, '--ui-menu-origin': origin }
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
    reposition: popover.reposition,
  }
}
