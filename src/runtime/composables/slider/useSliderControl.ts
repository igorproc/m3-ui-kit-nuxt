/**
 * @module useSliderControl
 *
 * @remarks
 * Behavior layer of the slider. Turns a model value into ready-to-spread attr
 * bags — `rootAttrs`, `trackAttrs`, `rangeAttrs`, `getThumbAttrs(index)` —
 * carrying the whole interaction surface: pointer drag, click-to-jump, keyboard
 * stepping, ARIA and drag state. It renders nothing and assumes no markup.
 *
 * The slider is layered on purpose:
 * - {@link useSlider} — pure value math (snapping, percentages, crossover)
 * - `useSliderControl` — that math plus DOM behavior, markup-agnostic
 * - `<MSlider>` — one possible markup on top of this composable
 *
 * Because `<MSlider>` consumes exactly these bags, dropping the component keeps
 * every behavior it had — focus, swipe, arrow keys, `aria-value*`.
 *
 * Geometry reaches the markup as inline `left`/`bottom` percentages plus the
 * `--m-slider-percent`, `--m-slider-progress` (unitless) and `--m-slider-value`
 * custom properties, so a consumer whose thumb is not absolutely positioned —
 * a bar meter, a gauge — can drive itself from CSS instead.
 *
 * @example
 * ```vue
 * <div v-bind="trackAttrs" class="my-track">
 *   <span v-bind="getThumbAttrs(0)" class="my-thumb" />
 * </div>
 * ```
 * ```ts
 * const value = ref(40)
 * const { trackAttrs, getThumbAttrs } = useSliderControl(value, { max: 100 })
 * ```
 */

// Composables
import { useDrag } from '#kit/composables/useDrag'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import { useSlider } from '#kit/composables/slider/createSlider'

// Utilities
import { computed, onScopeDispose, readonly, shallowRef, toValue } from 'vue'

// Types
import type { ComputedRef, MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import type { DragState } from '#kit/composables/useDrag'
import type { UseSliderProps } from '#kit/composables/slider/createSlider'

export type SliderOrientation = 'horizontal' | 'vertical'

export type SliderInteractionState = 'idle' | 'dragging'

/** Value math shared with {@link useSlider} and re-exported unchanged. */
type SliderMath = ReturnType<typeof useSlider>

export interface SliderRootAttrs {
  'data-orientation': SliderOrientation
  'data-state': SliderInteractionState
  'data-disabled': string | undefined
  'data-readonly': string | undefined
}

export interface SliderTrackAttrs {
  'ref': (value: unknown) => void
  'data-orientation': SliderOrientation
  'style': Record<string, string>
  'onPointerdown': (event: PointerEvent) => void
}

export interface SliderRangeAttrs {
  style: Record<string, string>
}

export interface SliderThumbAttrs {
  'role': 'slider'
  'tabindex': number
  'aria-valuenow': number
  'aria-valuemin': number
  'aria-valuemax': number
  'aria-orientation': SliderOrientation
  'aria-disabled': string | undefined
  'aria-readonly': string | undefined
  'aria-label': string | undefined
  'aria-labelledby': string | undefined
  'aria-valuetext': string
  'data-state': SliderInteractionState
  'style': Record<string, string | number>
  'onKeydown': (event: KeyboardEvent) => void
  'onPointerdown': (event: PointerEvent) => void
}

export interface UseSliderControlReturn extends Pick<
  SliderMath,
  'values' | 'percentages' | 'activeRange' | 'tickCount' | 'snap' | 'fromValue' | 'fromPercent' | 'updateValue' | 'getNearestThumbIndex'
> {
  draggingIndex: Readonly<ShallowRef<number | null>>
  isDragging: ComputedRef<boolean>
  trackElement: Readonly<ShallowRef<HTMLElement | null>>
  rootAttrs: ComputedRef<SliderRootAttrs>
  trackAttrs: ComputedRef<SliderTrackAttrs>
  rangeAttrs: ComputedRef<SliderRangeAttrs>
  getThumbAttrs: (index: number) => SliderThumbAttrs
}

export interface UseSliderControlOptions {
  min?: MaybeRefOrGetter<number>
  max?: MaybeRefOrGetter<number>
  step?: MaybeRefOrGetter<number>
  disabled?: MaybeRefOrGetter<boolean>
  readonly?: MaybeRefOrGetter<boolean>
  orientation?: MaybeRefOrGetter<SliderOrientation>
  /** `aria-label` for the thumb at `index`. */
  ariaLabel?: (index: number) => string | undefined
  /** `aria-labelledby` for the thumb at `index`. */
  ariaLabelledby?: (index: number) => string | undefined
  /** Human-readable value announcement; defaults to the raw number. */
  ariaValuetext?: (value: number, index: number) => string | undefined
  /** Bridge to a component `emit` — fired after every committed change. */
  onUpdate?: (value: number | number[]) => void
}

/**
 * Single-thumb consumers hold a `Ref<number>` and range consumers a
 * `Ref<number[]>`; both are accepted so `defineModel<number>()` needs no cast at
 * the call site.
 */
export type SliderModel = Ref<number> | Ref<number[]> | Ref<number | number[]>

/** A thumb press bubbles to the track; both are matched by role, not by class. */
const THUMB_SELECTOR = '[role="slider"]'

/**
 * Template refs hand us an element for a plain node and a component instance for
 * a component — the attr bags are spreadable onto either.
 */
function resolveElement(value: unknown): HTMLElement | null {
  if (value instanceof HTMLElement) return value

  const el = (value as { $el?: unknown } | null)?.$el

  return el instanceof HTMLElement ? el : null
}

export function useSliderControl(
  modelValue: SliderModel,
  options: UseSliderControlOptions = {},
): UseSliderControlReturn {
  const model = modelValue as Ref<number | number[]>

  // Getter object rather than `reactive()`: the getters run inside the consuming
  // computed/effect, so `MaybeRefOrGetter` options stay tracked without copying
  // them into a second reactive source of truth.
  const state: UseSliderProps = {
    get min() { return toValue(options.min) ?? 0 },
    get max() { return toValue(options.max) ?? 100 },
    get step() { return toValue(options.step) ?? 1 },
    get disabled() { return toValue(options.disabled) ?? false },
    get readonly() { return toValue(options.readonly) ?? false },
    get orientation() { return toValue(options.orientation) ?? 'horizontal' },
  }

  const slider = useSlider(model, state, (_event, value) => options.onUpdate?.(value))

  const trackElement = shallowRef<HTMLElement | null>(null)
  const draggingIndex = shallowRef<number | null>(null)

  const isVertical = computed(() => state.orientation === 'vertical')
  const isInteractive = () => !state.disabled && !state.readonly

  let dragOffset = 0
  let rafId: number | null = null

  // Track rect cached at drag start to avoid a forced reflow
  // (`getBoundingClientRect`) on every pointermove frame. Refreshed only on
  // scroll/resize while a drag is active, so the "page scrolls mid-drag" case
  // stays correct without per-frame layout.
  let cachedRect: DOMRect | null = null
  let stopScroll: (() => void) | null = null
  let stopResize: (() => void) | null = null

  const setTrackElement = (value: unknown) => {
    trackElement.value = resolveElement(value)
  }

  const refreshRect = () => {
    cachedRect = trackElement.value?.getBoundingClientRect() ?? null
  }

  const startRectTracking = () => {
    refreshRect()
    stopScroll ||= useGlobalListener('window', 'scroll', refreshRect, { passive: true, capture: true })
    stopResize ||= useGlobalListener('window', 'resize', refreshRect, { passive: true })
  }

  const stopRectTracking = () => {
    stopScroll?.()
    stopResize?.()
    stopScroll = null
    stopResize = null
    cachedRect = null
  }

  const percentFromRect = (rect: DOMRect, clientX: number, clientY: number): number => {
    const rawPercent = isVertical.value
      ? ((rect.bottom - clientY + dragOffset) / rect.height) * 100
      : ((clientX - rect.left - dragOffset) / rect.width) * 100

    return Math.max(0, Math.min(100, rawPercent))
  }

  /**
   * Arm a drag for `index`. `thumbElement` is the pressed thumb when the press
   * started on one — the offset from its centre keeps the thumb from jumping
   * under the cursor on the first move.
   */
  const beginDrag = (index: number, event: PointerEvent, thumbElement: HTMLElement | null) => {
    if (thumbElement) {
      const rect = thumbElement.getBoundingClientRect()

      dragOffset = isVertical.value
        ? event.clientY - (rect.top + rect.height / 2)
        : event.clientX - (rect.left + rect.width / 2)
    } else {
      dragOffset = 0
    }

    draggingIndex.value = index
    startRectTracking()
  }

  const onDragMove = (dragState: DragState) => {
    if (draggingIndex.value === null || !cachedRect || rafId) return

    const { clientX, clientY } = dragState.event

    rafId = requestAnimationFrame(() => {
      rafId = null

      if (draggingIndex.value === null || !cachedRect) return

      const percent = percentFromRect(cachedRect, clientX, clientY)
      slider.updateValue(draggingIndex.value, slider.fromPercent(percent))
    })
  }

  const onDragEnd = () => {
    draggingIndex.value = null
    dragOffset = 0

    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    stopRectTracking()
  }

  // Safety net: drop a pending rAF if the consumer unmounts mid-drag.
  onScopeDispose(() => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    stopRectTracking()
  })

  // `useDrag` owns the window-level move/up/cancel subscriptions (only alive
  // while dragging) and their cleanup; the pointerdown handlers below own the
  // immediate jump.
  useDrag(() => trackElement.value, {
    axis: () => (isVertical.value ? 'y' : 'x'),
    disabled: () => !isInteractive(),
    onMove: onDragMove,
    onEnd: onDragEnd,
  })

  function onThumbPointerdown(index: number, event: PointerEvent) {
    if (!isInteractive() || event.button) return

    event.preventDefault()

    const target = event.currentTarget

    beginDrag(index, event, target instanceof HTMLElement ? target : null)
  }

  function onTrackPointerdown(event: PointerEvent) {
    if (!isInteractive() || event.button) return

    // Let `onThumbPointerdown` own a thumb press, otherwise the nearest thumb
    // would also jump to the press location.
    if ((event.target as HTMLElement | null)?.closest(THUMB_SELECTOR)) return

    const el = trackElement.value
    if (!el) return

    // Single rect read for the click-jump; `beginDrag` re-caches it for the drag
    // that follows (the offset is 0 here — no thumb was pressed).
    const rect = el.getBoundingClientRect()
    const percent = isVertical.value
      ? ((rect.bottom - event.clientY) / rect.height) * 100
      : ((event.clientX - rect.left) / rect.width) * 100

    const value = slider.fromPercent(percent)
    const index = slider.getNearestThumbIndex(value)

    event.preventDefault()
    slider.updateValue(index, value)
    beginDrag(index, event, null)
  }

  function onThumbKeydown(index: number, event: KeyboardEvent) {
    if (!isInteractive()) return

    const current = slider.values.value[index] ?? state.min
    const step = state.step || 1
    const change = step * (event.shiftKey ? 10 : 1)

    const actions: Record<string, () => void> = {
      ArrowRight: () => slider.updateValue(index, current + change),
      ArrowUp: () => slider.updateValue(index, current + change),
      ArrowLeft: () => slider.updateValue(index, current - change),
      ArrowDown: () => slider.updateValue(index, current - change),
      PageUp: () => slider.updateValue(index, current + step * 10),
      PageDown: () => slider.updateValue(index, current - step * 10),
      Home: () => slider.updateValue(index, state.min),
      End: () => slider.updateValue(index, state.max),
    }

    const action = actions[event.key]
    if (!action) return

    event.preventDefault()
    action()
  }

  const isDragging = computed(() => draggingIndex.value !== null)

  const rootAttrs = computed(() => ({
    'data-orientation': state.orientation,
    'data-state': isDragging.value ? 'dragging' : 'idle',
    'data-disabled': state.disabled ? '' : undefined,
    'data-readonly': state.readonly ? '' : undefined,
  }))

  const trackAttrs = computed(() => ({
    'ref': setTrackElement,
    'data-orientation': state.orientation,
    'style': { touchAction: 'none' },
    'onPointerdown': onTrackPointerdown,
  }))

  const rangeAttrs = computed(() => {
    const { start, end } = slider.activeRange.value
    const span = end - start

    return {
      style: {
        '--m-slider-range-start': `${start}%`,
        '--m-slider-range-span': `${span}%`,
        ...(isVertical.value
          ? { bottom: `${start}%`, height: `${span}%` }
          : { left: `${start}%`, width: `${span}%` }),
      },
    }
  })

  /**
   * Attrs for the thumb at `index`. Called during render so the reads below stay
   * tracked; neighbours clamp `aria-valuemin`/`aria-valuemax` in range mode.
   */
  function getThumbAttrs(index: number) {
    const values = slider.values.value
    const value = values[index] ?? state.min
    const percent = slider.percentages.value[index] ?? 0
    const previous = values[index - 1]
    const next = values[index + 1]

    return {
      'role': 'slider',
      'tabindex': state.disabled ? -1 : 0,
      'aria-valuenow': value,
      'aria-valuemin': previous ?? state.min,
      'aria-valuemax': next ?? state.max,
      'aria-orientation': state.orientation,
      'aria-disabled': state.disabled ? 'true' : undefined,
      'aria-readonly': state.readonly ? 'true' : undefined,
      'aria-label': options.ariaLabel?.(index),
      'aria-labelledby': options.ariaLabelledby?.(index),
      'aria-valuetext': options.ariaValuetext?.(value, index) ?? String(value),
      'data-state': draggingIndex.value === index ? 'dragging' : 'idle',
      'style': {
        '--m-slider-percent': `${percent}%`,
        // Unitless twin of the percentage: a gauge needle or a bar meter needs
        // it inside `calc()`, where a `%` value cannot be multiplied.
        '--m-slider-progress': percent,
        '--m-slider-value': value,
        [isVertical.value ? 'bottom' : 'left']: `${percent}%`,
        'touchAction': 'none',
      },
      'onKeydown': (event: KeyboardEvent) => onThumbKeydown(index, event),
      'onPointerdown': (event: PointerEvent) => onThumbPointerdown(index, event),
    }
  }

  return {
    // Value math, re-exported so one call covers the whole control
    values: slider.values,
    percentages: slider.percentages,
    activeRange: slider.activeRange,
    tickCount: slider.tickCount,
    snap: slider.snap,
    fromValue: slider.fromValue,
    fromPercent: slider.fromPercent,
    updateValue: slider.updateValue,
    getNearestThumbIndex: slider.getNearestThumbIndex,

    // Behavior
    draggingIndex: readonly(draggingIndex),
    isDragging,
    trackElement: readonly(trackElement),

    // Attr bags
    rootAttrs,
    trackAttrs,
    rangeAttrs,
    getThumbAttrs,
  }
}
