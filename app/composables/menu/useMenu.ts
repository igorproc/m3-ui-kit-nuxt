import { shallowRef, computed, watch, useId } from 'vue'
import type { Ref } from 'vue'
import type { UiMenuOrigin } from '~/components/ui/menu/types'

/**
 * @module useMenu
 *
 * @remarks
 * Finite State Machine for floating menu surfaces (menus, dropdowns,
 * split-button overflows). Acts as a pure state machine: it owns the
 * open/close lifecycle and the positioning math, but never touches the
 * DOM. All DOM interaction (measuring the trigger rect, scroll/resize
 * listeners, outside-click detection) is the responsibility of the
 * consumer component, mirroring the architectural split of `useSlider`.
 *
 * The `model` ref is the single source of truth. `status` follows it as
 * an animation guard, so a menu can always be closed (or re-opened)
 * mid-transition without getting stuck in a half-animated state.
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
export type MenuStatus = 'closed' | 'opening' | 'open' | 'closing'

/** Viewport-relative geometry of the trigger, measured by the component. */
export interface MenuRect {
  top: number
  bottom: number
  left: number
  right: number
  width: number
}

export interface UseMenuOptions {
  absolute: () => boolean
  origin: () => UiMenuOrigin
  matchWidth: () => boolean
}

const EMPTY_RECT: MenuRect = { top: 0, bottom: 0, left: 0, right: 0, width: 0 }

const Z_INDEX = '999'

/**
 * Map a logical origin to a CSS `position-area`.
 *
 * @remarks
 * Default (left) origins align the surface to the trigger's left edge and
 * span rightwards (`span-right`); right origins mirror that. The legacy
 * `bottom left` value pushed the surface off the trigger's left edge,
 * which is what made dropdowns render flush against the viewport edge.
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
  const anchorName = `--menu-anchor-${useId()}`

  const status = shallowRef<MenuStatus>(model.value ? 'open' : 'closed')
  const rect = shallowRef<MenuRect>({ ...EMPTY_RECT })

  const isAnchorSupported = shallowRef(false)
  if (import.meta.client) {
    isAnchorSupported.value = typeof CSS !== 'undefined'
      && typeof CSS.supports === 'function'
      && (CSS.supports('position-anchor: --a') || CSS.supports('anchor-name: --a'))
  }

  // Surface stays mounted for the whole non-closed window so the leave
  // transition can play; `isOpen` is the v-if/teleport gate.
  const isOpen = computed(() => status.value !== 'closed')

  // `model` is the source of truth; `status` is only an animation guard,
  // so transitions never block a close (or a re-open).
  watch(model, (val) => {
    status.value = val ? 'opening' : 'closing'
  })

  function open() {
    if (!model.value) {
      model.value = true
    }
  }

  function close() {
    if (model.value) {
      model.value = false
    }
  }

  function toggle() {
    if (model.value) {
      close()
    } else {
      open()
    }
  }

  // Settle the FSM once Vue's <transition> finishes, but only if the
  // model hasn't flipped again mid-animation.
  function onAfterEnter() {
    if (model.value) {
      status.value = 'open'
    }
  }

  function onAfterLeave() {
    if (!model.value) {
      status.value = 'closed'
    }
  }

  function setRect(next: MenuRect) {
    rect.value = next
  }

  /** Pure positioning math derived from the measured trigger rect. */
  const menuStyle = computed<Record<string, string>>(() => {
    const origin = options.origin()

    if (!options.absolute()) {
      return { '--ui-menu-origin': origin }
    }

    // Preferred path: let the browser anchor the surface natively, which
    // removes scroll re-positioning lag entirely.
    if (isAnchorSupported.value) {
      const style: Record<string, string> = {
        'position': 'fixed',
        'inset': 'unset',
        'margin': 'unset',
        'position-anchor': anchorName,
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
    const style: Record<string, string> = {
      'position': 'fixed',
      'top': `${rect.value.bottom}px`,
      'z-index': Z_INDEX,
      '--ui-menu-origin': origin,
    }

    if (origin.includes('right') && import.meta.client) {
      style.right = `${window.innerWidth - rect.value.right}px`
    } else {
      style.left = `${rect.value.left}px`
    }

    if (options.matchWidth()) {
      style.width = `${rect.value.width}px`
    }

    return style
  })

  return {
    anchorName,
    status,
    isOpen,
    isAnchorSupported,
    menuStyle,
    open,
    close,
    toggle,
    onAfterEnter,
    onAfterLeave,
    setRect,
  }
}
