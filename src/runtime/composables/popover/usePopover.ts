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
import { computePopoverPosition, parsePlacement, placementToArea } from './placement'
import type { PopoverPlacement, PopoverRect } from './placement'

/** Lifecycle states. `opening`/`closing` are transient animation guards. */
export type PopoverStatus = 'closed' | 'opening' | 'open' | 'closing'

export interface UsePopoverOptions {
  /** Placement of the surface relative to the trigger. @default 'bottom' */
  placement?: MaybeRefOrGetter<PopoverPlacement>
  /** Gap (px) between trigger and surface along the main axis. @default 0 */
  offset?: MaybeRefOrGetter<number>
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

/** Native flip tactics, tried in order when the preferred area overflows. */
const POSITION_TRY_FALLBACKS = 'flip-block, flip-inline, flip-block flip-inline'

export function usePopover(model: Ref<boolean>, options: UsePopoverOptions = {}): UsePopoverReturn {
  const anchorName = `--popover-anchor-${useId()}`

  const status = shallowRef<PopoverStatus>(model.value ? 'open' : 'closed')
  const rect = shallowRef<PopoverRect>({ ...EMPTY_RECT })
  const surfaceSize = shallowRef<{ width: number, height: number }>({ width: 0, height: 0 })

  const isAnchorSupported = shallowRef(supportsAnchorPositioning())

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

    // Layout size, not the painted box: the surface is measured right after it
    // mounts, mid enter-transition, when a `scale()` would shrink the rect.
    const surfaceEl = toValue(options.surface)
    if (surfaceEl) {
      surfaceSize.value = { width: surfaceEl.offsetWidth, height: surfaceEl.offsetHeight }
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
      if (toValue(options.flip) ?? true) style['position-try-fallbacks'] = POSITION_TRY_FALLBACKS
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

    // JS fallback — compute a fixed position from the measured rects. The
    // viewport excludes the scrollbar, so a shifted surface never hides under it.
    const r = rect.value
    const { top, left } = computePopoverPosition({
      anchor: r,
      surface: surfaceSize.value,
      viewport: {
        width: IN_BROWSER ? document.documentElement.clientWidth : 0,
        height: IN_BROWSER ? document.documentElement.clientHeight : 0,
      },
      placement: toValue(options.placement) ?? 'bottom',
      offset,
      margin: toValue(options.margin) ?? 8,
      flip: toValue(options.flip) ?? true,
    })

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
