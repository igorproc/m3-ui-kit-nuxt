/**
 * @module usePopover
 *
 * @remarks
 * Shared floating-surface primitive. `useMenu` (and through it the dropdown)
 * runs on it; the tooltip is still hand-rolled and moves here next.
 *
 * Two responsibilities:
 * 1. **Lifecycle FSM** — `model` is the source of truth; `status`
 *    (`closed`/`opening`/`open`/`closing`) follows it as an animation guard so a
 *    surface can always close/re-open mid-transition. `isOpen` gates the
 *    teleport/v-if; `onAfterEnter`/`onAfterLeave` settle the FSM from Vue's
 *    `<transition>`.
 * 2. **Positioning** — preferred path uses native **CSS anchor positioning**
 *    (`position-anchor` + `position-area` + `position-try-fallbacks`); when
 *    unsupported it falls back to a JS-measured fixed position that flips and
 *    shifts the same way (see {@link computePopoverPosition}).
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
import { supportsAnchorPositioning } from '#kit/shared/utils/support'
import { useGlobalListener } from '../useGlobalListener'
import { computePopoverPosition, joinPlacement, observePlacement, parsePlacement, placementToArea } from './placement'
import type { PopoverDirection, PopoverPlacement, PopoverRect, PopoverSide } from './placement'

/** Lifecycle states. `opening`/`closing` are transient animation guards. */
export type PopoverStatus = 'closed' | 'opening' | 'open' | 'closing'

export interface UsePopoverOptions {
  /** Placement of the surface relative to the trigger. @default 'bottom' */
  placement?: MaybeRefOrGetter<PopoverPlacement>
  /**
   * Gap between trigger and surface along the main axis: pixels, or a CSS
   * length in `px` / `rem` (`'4rem'`), which follows the kit's root scale.
   * @default 0
   */
  offset?: MaybeRefOrGetter<number | string>
  /** Force the surface width to match the trigger. @default false */
  matchWidth?: MaybeRefOrGetter<boolean>
  /** Flip to the opposite side / alignment when the surface would overflow the viewport. @default true */
  flip?: MaybeRefOrGetter<boolean>
  /** `'auto'` uses CSS anchor when supported, else JS; `'anchor'`/`'fixed'` force a path. @default 'auto' */
  strategy?: MaybeRefOrGetter<'auto' | 'anchor' | 'fixed'>
  /** Trigger element — when provided, the composable measures it and owns repositioning. */
  trigger?: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** Surface element — when provided, its size feeds the JS flip/clamp math. */
  surface?: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** Minimum gap (px) kept from the viewport edges when clamping (JS path). @default 8 */
  margin?: MaybeRefOrGetter<number>
  /**
   * Stacking order for the surface; none by default. A surface in the top
   * layer needs none, and one outside it takes the order of its overlay stack.
   */
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
  /** Inline direction of the trigger, read when it is measured. */
  direction: Readonly<Ref<PopoverDirection>>
  /**
   * The placement the surface actually took after flipping: computed on the JS
   * path, read off the laid-out boxes on the native one once they are
   * measured. The requested placement until then.
   */
  placement: Readonly<Ref<PopoverPlacement>>
  /**
   * `dir` for the teleported surface: the trigger's direction where it differs
   * from the root's, so the surface reads the way its trigger does; otherwise
   * `undefined` (the surface inherits the root's).
   */
  surfaceDir: Readonly<Ref<PopoverDirection | undefined>>
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

const px = (value: string) => Number.parseFloat(value) || 0

/** A length for the JS path, in CSS pixels; `rem` reads the live root size. */
function toPixels(length: number | string): number {
  if (typeof length === 'number') return length
  const value = Number.parseFloat(length) || 0
  if (!length.endsWith('rem') || !IN_BROWSER) return value
  return value * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
}

/**
 * Border-box size of the laid-out surface, unrounded.
 *
 * Layout size, not the painted box: the surface is measured right after it
 * mounts, mid enter-transition, when a `scale()` would shrink the rect. Not
 * `offsetWidth/Height` either: they round to whole pixels, and at a fractional
 * rem that rounding opens a gap of up to half a pixel against the trigger.
 */
function measureLayoutSize(el: HTMLElement): { width: number, height: number } {
  const style = getComputedStyle(el)
  const width = Number.parseFloat(style.width)
  const height = Number.parseFloat(style.height)
  // `auto` (not laid out, e.g. `display: none`): only the rounded box is known.
  if (Number.isNaN(width) || Number.isNaN(height)) return { width: el.offsetWidth, height: el.offsetHeight }
  if (style.boxSizing === 'border-box') return { width, height }

  return {
    width: width + px(style.paddingLeft) + px(style.paddingRight) + px(style.borderLeftWidth) + px(style.borderRightWidth),
    height: height + px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth),
  }
}

/** The margin facing the trigger; logical, like the `position-area` it pairs with. */
const OFFSET_MARGIN: Record<PopoverSide, string> = {
  top: 'margin-block-end',
  bottom: 'margin-block-start',
  start: 'margin-inline-end',
  end: 'margin-inline-start',
}

/** Native flip tactics, tried in order when the preferred area overflows. */
const POSITION_TRY_FALLBACKS = 'flip-block, flip-inline, flip-block flip-inline'

export function usePopover(model: Ref<boolean>, options: UsePopoverOptions = {}): UsePopoverReturn {
  const anchorName = `--popover-anchor-${useId()}`

  const status = shallowRef<PopoverStatus>(model.value ? 'open' : 'closed')
  const rect = shallowRef<PopoverRect>({ ...EMPTY_RECT })
  const direction = shallowRef<PopoverDirection>('ltr')
  const rootDirection = shallowRef<PopoverDirection>('ltr')
  const surfaceDir = computed(() => direction.value === rootDirection.value ? undefined : direction.value)
  const surfaceSize = shallowRef<{ width: number, height: number }>({ width: 0, height: 0 })
  const observed = shallowRef<PopoverPlacement | null>(null)

  const isAnchorSupported = shallowRef(supportsAnchorPositioning())
  const requested = computed<PopoverPlacement>(() => toValue(options.placement) ?? 'bottom')

  watch(requested, () => {
    observed.value = null
  })

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

  const resolvedStrategy = computed<'anchor' | 'fixed'>(() => {
    const strategy = toValue(options.strategy) ?? 'auto'
    if (strategy === 'anchor') return 'anchor'
    if (strategy === 'fixed') return 'fixed'
    return isAnchorSupported.value ? 'anchor' : 'fixed'
  })

  function observe() {
    const triggerEl = toValue(options.trigger)
    const surfaceEl = toValue(options.surface)
    if (resolvedStrategy.value !== 'anchor' || !triggerEl || !surfaceEl) return
    observed.value = observePlacement(triggerEl.getBoundingClientRect(), surfaceEl.getBoundingClientRect(), requested.value, direction.value)
  }

  function reposition() {
    const dirBefore = surfaceDir.value
    const el = toValue(options.trigger)
    if (el) {
      const r = el.getBoundingClientRect()
      rect.value = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
      direction.value = getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr'
      rootDirection.value = getComputedStyle(document.documentElement).direction === 'rtl' ? 'rtl' : 'ltr'
    }

    const surfaceEl = toValue(options.surface)
    if (surfaceEl) surfaceSize.value = measureLayoutSize(surfaceEl)

    const areaMirrorsOnNextRender = surfaceDir.value !== dirBefore
    if (areaMirrorsOnNextRender) nextTick(observe)
    else observe()
  }

  const anchorStyle = computed<Record<string, string>>(() => ({ 'anchor-name': anchorName }))

  const offsetPx = computed(() => toPixels(toValue(options.offset) ?? 0))

  // JS fallback — a fixed position from the measured rects. The viewport
  // excludes the scrollbar, so a shifted surface never hides under it.
  const fixedPosition = computed(() => {
    if (resolvedStrategy.value !== 'fixed') return null
    return computePopoverPosition({
      anchor: rect.value,
      surface: surfaceSize.value,
      viewport: {
        width: IN_BROWSER ? document.documentElement.clientWidth : 0,
        height: IN_BROWSER ? document.documentElement.clientHeight : 0,
      },
      placement: requested.value,
      offset: offsetPx.value,
      margin: toValue(options.margin) ?? 8,
      flip: toValue(options.flip) ?? true,
      direction: direction.value,
    })
  })

  const placement = computed<PopoverPlacement>(() => {
    const position = fixedPosition.value
    if (position) return joinPlacement(position.side, position.align)
    return observed.value ?? requested.value
  })

  const popoverStyle = computed<Record<string, string>>(() => {
    const [side, align] = parsePlacement(requested.value)
    const offset = toValue(options.offset) ?? 0
    const matchWidth = toValue(options.matchWidth) ?? false
    const style: Record<string, string> = { position: 'fixed' }
    if (options.zIndex != null) style['z-index'] = String(options.zIndex)

    // Native CSS anchor path — let the browser keep the surface pinned.
    if (!fixedPosition.value) {
      Object.assign(style, {
        'inset': 'unset',
        'margin': 'unset',
        'position-anchor': anchorName,
        'position-area': placementToArea(side, align, surfaceDir.value !== undefined),
      })
      if (toValue(options.flip) ?? true) style['position-try-fallbacks'] = POSITION_TRY_FALLBACKS
      if (offsetPx.value) style[OFFSET_MARGIN[side]] = typeof offset === 'number' ? `${offset}px` : offset
      if (matchWidth) style.width = 'anchor-size(width)'
      return style
    }

    style.top = `${fixedPosition.value.top}px`
    style.left = `${fixedPosition.value.left}px`
    if (matchWidth) style.width = `${rect.value.width}px`
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
    direction,
    placement,
    surfaceDir,
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
