import { computed } from 'vue'
import type { Ref } from 'vue'
import { usePopover } from '#kit/composables/popover/usePopover'
import type { PopoverStatus } from '#kit/composables/popover/usePopover'
import { parsePlacement } from '#kit/composables/popover/placement'
import type { PopoverDirection, PopoverPlacement, PopoverRect } from '#kit/composables/popover/placement'

/**
 * @module useMenu
 *
 * @remarks
 * Thin adapter over the shared {@link usePopover} primitive. The FSM, anchor
 * detection and all placement math (native `position-try-fallbacks` flip, JS
 * flip + shift fallback) live in `usePopover`; this wrapper adds the
 * `--ui-menu-origin` custom property the surface animation reads: the menu
 * grows out of the corner that touches its anchor, on the side it actually
 * took after a flip.
 *
 * Pass `trigger` and `surface` to let `usePopover` measure them and re-measure
 * on scroll/resize for the JS path.
 *
 * @example
 * ```ts
 * const model = defineModel<boolean>()
 * const menu = useMenu(model, {
 *   placement: () => props.placement,
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
  placement: () => PopoverPlacement
  matchWidth: () => boolean
  /** Element the surface is positioned against (JS path measuring). */
  trigger?: () => HTMLElement | null | undefined
  /** Positioned element whose layout size feeds the JS flip/shift. */
  surface?: () => HTMLElement | null | undefined
}

/**
 * The corner of the surface that faces the anchor, as a `transform-origin`.
 * `transform-origin` has no logical keywords, so the inline edge is resolved
 * against the trigger's direction.
 */
export function placementOrigin(placement: PopoverPlacement, direction: PopoverDirection): string {
  const [side, align] = parsePlacement(placement)
  const inlineStart = direction === 'rtl' ? 'right' : 'left'
  const inlineEnd = direction === 'rtl' ? 'left' : 'right'

  if (side === 'top' || side === 'bottom') {
    const inline = align === 'center' ? 'center' : align === 'start' ? inlineStart : inlineEnd
    return `${side === 'bottom' ? 'top' : 'bottom'} ${inline}`
  }

  const block = align === 'center' ? 'center' : align === 'start' ? 'top' : 'bottom'
  return `${block} ${side === 'end' ? inlineStart : inlineEnd}`
}

export function useMenu(model: Ref<boolean>, options: UseMenuOptions) {
  const popover = usePopover(model, {
    placement: options.placement,
    matchWidth: options.matchWidth,
    trigger: options.trigger,
    surface: options.surface,
  })

  const menuStyle = computed<Record<string, string>>(() => ({
    ...popover.popoverStyle.value,
    '--ui-menu-origin': placementOrigin(popover.placement.value, popover.direction.value),
  }))

  return {
    anchorName: popover.anchorName,
    status: popover.status,
    isOpen: popover.isOpen,
    isAnchorSupported: popover.isAnchorSupported,
    menuStyle,
    surfaceDir: popover.surfaceDir,
    open: popover.open,
    close: popover.close,
    toggle: popover.toggle,
    onAfterEnter: popover.onAfterEnter,
    onAfterLeave: popover.onAfterLeave,
    setRect: popover.setRect,
    reposition: popover.reposition,
  }
}
