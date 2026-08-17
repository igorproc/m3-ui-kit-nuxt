/**
 * @module usePopover
 *
 * @remarks
 * Shared floating-surface primitive for menu, tooltip and dropdown. Generalises
 * the kit's `useMenu` FSM into a reusable composable (rather than duplicating it)
 * and consolidates the anchor/positioning math those three components each
 * hand-rolled.
 *
 * Two responsibilities:
 * 1. **Lifecycle FSM** — `model` is the source of truth; `status`
 *    (`closed`/`opening`/`open`/`closing`) follows it as an animation guard so a
 *    surface can always close/re-open mid-transition. `isOpen` gates the
 *    teleport/v-if; `onAfterEnter`/`onAfterLeave` settle the FSM from Vue's
 *    `<transition>`.
 * 2. **Positioning** — preferred path uses native **CSS anchor positioning**
 *    (`position-anchor` + `position-area`); when unsupported it falls back to a
 *    JS-measured fixed position with viewport **flip** and **clamp** (the
 *    behaviour tooltip needs).
 *
 * DOM ownership is **opt-in**: pass `trigger` (and optionally `surface`) refs and
 * the composable measures them and re-positions on scroll/resize via the
 * sanctioned `useGlobalListener` wrapper. Omit them (as `useMenu` does) and it
 * stays a pure FSM + style calculator while the component drives `setRect`.
 *
 * @example
 * ```ts
 * const model = defineModel<boolean>()
 * const trigger = useTemplateRef<HTMLElement>('trigger')
 * const surface = useTemplateRef<HTMLElement>('surface')
 * const popover = usePopover(model, {
 *   trigger,
 *   surface,
 *   placement: () => 'bottom-start',
 *   offset: 8,
 * })
 * // bind :style="popover.popoverStyle.value" on the surface
 * ```
 */
import { computed, nextTick, shallowRef, toValue, useId, watch } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { clamp } from '#kit/shared/utils/helpers'
import { useGlobalListener } from '../useGlobalListener'

/** Lifecycle states. `opening`/`closing` are transient animation guards. */
export type PopoverStatus = 'closed' | 'opening' | 'open' | 'closing'

/** Primary side the surface is placed on, relative to the trigger. */
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right'

/** Cross-axis alignment against the trigger. */
export type PopoverAlign = 'start' | 'center' | 'end'

/** `'bottom'` (centered) or `'bottom-start'`/`'bottom-end'`, etc. */
export type PopoverPlacement = PopoverSide | `${PopoverSide}-${PopoverAlign}`

/** Viewport-relative geometry of the trigger. `height` is derived when omitted. */
export interface PopoverRect {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height?: number
}

export interface UsePopoverOptions {
  /** Placement of the surface relative to the trigger. @default 'bottom' */
  placement?: MaybeRefOrGetter<PopoverPlacement>
  /** Gap (px) between trigger and surface along the main axis. @default 0 */
  offset?: MaybeRefOrGetter<number>
  /** Force the surface width to match the trigger. @default false */
  matchWidth?: MaybeRefOrGetter<boolean>
  /** Flip to the opposite side when the surface would overflow the viewport (JS path). @default true */
  flip?: MaybeRefOrGetter<boolean>
  /** `'auto'` uses CSS anchor when supported, else JS; `'anchor'`/`'fixed'` force a path. @default 'auto' */
  strategy?: MaybeRefOrGetter<'auto' | 'anchor' | 'fixed'>
  /** Trigger element — when provided, the composable measures it and owns repositioning. */
  trigger?: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** Surface element — when provided, its size feeds the JS flip/clamp math. */
  surface?: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** Minimum gap (px) kept from the viewport edges when clamping (JS path). @default 8 */
  margin?: MaybeRefOrGetter<number>
  /** Stacking order for the surface. @default 999 */
  zIndex?: number | string
}

export interface UsePopoverReturn {
  /** CSS `anchor-name` to assign to the trigger for the native-anchor path. */
  anchorName: string
  status: Ref<PopoverStatus>
  /** `true` while the surface should stay mounted (`status !== 'closed'`). */
  isOpen: Ref<boolean>
  /** Whether the browser supports CSS anchor positioning. */
  isAnchorSupported: Ref<boolean>
  /** Last measured trigger rect (read-only). */
  rect: Readonly<Ref<PopoverRect>>
  /** Style object to spread on the surface. */
  popoverStyle: Ref<Record<string, string>>
  /** Style object to spread on the trigger (sets `anchor-name`). */
  anchorStyle: Ref<Record<string, string>>
  open: () => void
  close: () => void
  toggle: () => void
  onAfterEnter: () => void
  onAfterLeave: () => void
  /** Manually set the trigger rect (when the component owns measuring). */
  setRect: (next: PopoverRect) => void
  /** Re-measure the trigger/surface now (no-op without a `trigger` ref). */
  reposition: () => void
}

const EMPTY_RECT: PopoverRect = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }

const DEFAULT_Z_INDEX = '999'

/** Map a placement to a CSS `position-area` value. */
function placementToArea(side: PopoverSide, align: PopoverAlign): string {
  if (align === 'center') return side

  // For a vertical side the surface spans horizontally and vice-versa.
  const spanByAlign: Record<PopoverSide, Record<'start' | 'end', string>> = {
    top: { start: 'span-right', end: 'span-left' },
    bottom: { start: 'span-right', end: 'span-left' },
    left: { start: 'span-bottom', end: 'span-top' },
    right: { start: 'span-bottom', end: 'span-top' },
  }

  return `${side} ${spanByAlign[side][align]}`
}

/** Split a placement string into side + align (defaulting align to center). */
function parsePlacement(placement: PopoverPlacement): [PopoverSide, PopoverAlign] {
  const [side, align = 'center'] = placement.split('-') as [PopoverSide, PopoverAlign?]
  return [side, align ?? 'center']
}

export function usePopover(model: Ref<boolean>, options: UsePopoverOptions = {}): UsePopoverReturn {
  const anchorName = `--popover-anchor-${useId()}`

  const status = shallowRef<PopoverStatus>(model.value ? 'open' : 'closed')
  const rect = shallowRef<PopoverRect>({ ...EMPTY_RECT })
  const surfaceSize = shallowRef<{ width: number, height: number }>({ width: 0, height: 0 })

  const isAnchorSupported = shallowRef(false)
  if (IN_BROWSER) {
    isAnchorSupported.value = typeof CSS !== 'undefined'
      && typeof CSS.supports === 'function'
      && (CSS.supports('position-anchor: --a') || CSS.supports('anchor-name: --a'))
  }

  // Surface stays mounted for the whole non-closed window so the leave
  // transition can play; `isOpen` is the v-if/teleport gate.
  const isOpen = computed(() => status.value !== 'closed')

  // `model` is the source of truth; `status` is only an animation guard.
  watch(model, (val) => {
    status.value = val ? 'opening' : 'closing'
  })

  function open() {
    if (!model.value) model.value = true
  }

  function close() {
    if (model.value) model.value = false
  }

  function toggle() {
    if (model.value) close()
    else open()
  }

  function onAfterEnter() {
    if (model.value) status.value = 'open'
  }

  function onAfterLeave() {
    if (!model.value) status.value = 'closed'
  }

  function setRect(next: PopoverRect) {
    rect.value = next
  }

  function reposition() {
    const el = toValue(options.trigger)
    if (el) {
      const r = el.getBoundingClientRect()
      rect.value = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
    }

    const surfaceEl = toValue(options.surface)
    if (surfaceEl) {
      const s = surfaceEl.getBoundingClientRect()
      surfaceSize.value = { width: s.width, height: s.height }
    }
  }

  const resolvedStrategy = computed<'anchor' | 'fixed'>(() => {
    const strategy = toValue(options.strategy) ?? 'auto'
    if (strategy === 'anchor') return 'anchor'
    if (strategy === 'fixed') return 'fixed'
    return isAnchorSupported.value ? 'anchor' : 'fixed'
  })

  const anchorStyle = computed<Record<string, string>>(() => ({ 'anchor-name': anchorName }))

  const popoverStyle = computed<Record<string, string>>(() => {
    const [side, align] = parsePlacement(toValue(options.placement) ?? 'bottom')
    const offset = toValue(options.offset) ?? 0
    const matchWidth = toValue(options.matchWidth) ?? false
    const zIndex = String(options.zIndex ?? DEFAULT_Z_INDEX)

    // Native CSS anchor path — let the browser keep the surface pinned.
    if (resolvedStrategy.value === 'anchor') {
      const style: Record<string, string> = {
        'position': 'fixed',
        'inset': 'unset',
        'margin': 'unset',
        'position-anchor': anchorName,
        'position-area': placementToArea(side, align),
        'z-index': zIndex,
      }
      if (offset) {
        const marginSide = side === 'top'
          ? 'margin-bottom'
          : side === 'bottom'
            ? 'margin-top'
            : side === 'left'
              ? 'margin-right'
              : 'margin-left'
        style[marginSide] = `${offset}px`
      }
      if (matchWidth) style.width = 'anchor-size(width)'
      return style
    }

    // JS fallback — compute a fixed position from the measured rects.
    const r = rect.value
    const height = r.height ?? (r.bottom - r.top)
    const { width: sw, height: sh } = surfaceSize.value
    const margin = toValue(options.margin) ?? 8
    const flip = toValue(options.flip) ?? true
    const vw = IN_BROWSER ? window.innerWidth : 0
    const vh = IN_BROWSER ? window.innerHeight : 0

    let resolvedSide = side

    // Flip the main axis when the surface would overflow and the opposite side fits.
    if (flip && sh > 0 && sw > 0) {
      if (side === 'bottom' && r.bottom + offset + sh > vh - margin && r.top - offset - sh >= margin) {
        resolvedSide = 'top'
      } else if (side === 'top' && r.top - offset - sh < margin && r.bottom + offset + sh <= vh - margin) {
        resolvedSide = 'bottom'
      } else if (side === 'right' && r.right + offset + sw > vw - margin && r.left - offset - sw >= margin) {
        resolvedSide = 'left'
      } else if (side === 'left' && r.left - offset - sw < margin && r.right + offset + sw <= vw - margin) {
        resolvedSide = 'right'
      }
    }

    let top = 0
    let left = 0

    if (resolvedSide === 'top' || resolvedSide === 'bottom') {
      top = resolvedSide === 'bottom' ? r.bottom + offset : r.top - sh - offset
      left = align === 'start'
        ? r.left
        : align === 'end'
          ? r.right - sw
          : r.left + (r.width - sw) / 2
    } else {
      left = resolvedSide === 'right' ? r.right + offset : r.left - sw - offset
      top = align === 'start'
        ? r.top
        : align === 'end'
          ? r.bottom - sh
          : r.top + (height - sh) / 2
    }

    // Keep the surface inside the viewport.
    if (sw > 0 && vw > 0) left = clamp(left, margin, Math.max(margin, vw - sw - margin))
    if (sh > 0 && vh > 0) top = clamp(top, margin, Math.max(margin, vh - sh - margin))

    const style: Record<string, string> = {
      'position': 'fixed',
      'top': `${top}px`,
      'left': `${left}px`,
      'z-index': zIndex,
    }
    if (matchWidth) style.width = `${r.width}px`
    return style
  })

  // Opt-in DOM ownership: only when a trigger ref/getter is supplied (its
  // resolved element may still be null at setup, behind a v-if).
  if (options.trigger != null) {
    watch(isOpen, async (val) => {
      if (!val) return
      await nextTick()
      reposition()
    }, { immediate: model.value })

    const onViewportChange = () => {
      if (!isOpen.value) return
      // CSS anchor keeps itself pinned — only the JS path needs re-measuring.
      if (resolvedStrategy.value === 'anchor') return
      reposition()
    }

    useGlobalListener('window', 'scroll', onViewportChange, { capture: true, passive: true })
    useGlobalListener('window', 'resize', onViewportChange, { passive: true })
  }

  return {
    anchorName,
    status,
    isOpen,
    isAnchorSupported,
    rect,
    popoverStyle,
    anchorStyle,
    open,
    close,
    toggle,
    onAfterEnter,
    onAfterLeave,
    setRect,
    reposition,
  }
}
