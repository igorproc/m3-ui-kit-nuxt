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
 * Geometry reaches the markup as inline `inset-inline-start`/`bottom` percentages
 * (so a horizontal track mirrors itself in RTL) plus the
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
import { isRtl, percentAlong } from '#kit/utils/slider/geometry'

// Utilities
import { computed, onScopeDispose, readonly, shallowReadonly, shallowRef, toValue } from 'vue'

// Types
import type { Ref } from 'vue'
import type { DragState } from '#kit/composables/useDrag'
import type { UseSliderProps } from '#kit/composables/slider/createSlider'
import type {
  SliderModel,
  SliderRootAttrs,
  SliderThumbAttrs,
  UseSliderControlOptions,
  UseSliderControlReturn,
} from './types'

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
    get origin() { return toValue(options.origin) ?? 'start' },
  }

  const slider = useSlider(model, state, (_event, value) => options.onUpdate?.(value))

  const trackElement = shallowRef<HTMLElement | null>(null)
  const draggingIndex = shallowRef<number | null>(null)
  const valueIndex = shallowRef<number | null>(null)

  const isVertical = computed(() => state.orientation === 'vertical')
  const isInteractive = () => !state.disabled && !state.readonly

  let dragOffset = 0
  let rafId: number | null = null
  // Read once per press: the direction does not change mid-gesture.
  let rtl = false
  // A touch on the track jumps on release, not on contact: until then the
  // gesture may still turn out to be a page scroll (`pointercancel`).
  let pendingTouchJump = false
  let stopRelease: (() => void) | null = null
  let stopCancel: (() => void) | null = null

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

  const axis = () => ({ vertical: isVertical.value, rtl })

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
    valueIndex.value = index
    startRectTracking()

    // `useDrag` reports an end only after a move; a press that never moved —
    // a tap, a click on the thumb, a scroll the browser took — ends here.
    stopRelease ||= useGlobalListener('window', 'pointerup', onRelease)
    stopCancel ||= useGlobalListener('window', 'pointercancel', onDragEnd)
  }

  function onRelease(event: Event) {
    if (pendingTouchJump && cachedRect && draggingIndex.value !== null) {
      slider.updateValue(draggingIndex.value, slider.fromPercent(percentAlong(cachedRect, event as PointerEvent, axis())))
    }

    onDragEnd()
  }

  const onDragMove = (dragState: DragState) => {
    if (draggingIndex.value === null || !cachedRect || rafId) return

    // Moving along the track is a drag: the thumb follows from here on.
    pendingTouchJump = false
    const { clientX, clientY } = dragState.event

    rafId = requestAnimationFrame(() => {
      rafId = null

      if (draggingIndex.value === null || !cachedRect) return

      const percent = percentAlong(cachedRect, { clientX, clientY }, axis(), dragOffset)
      slider.updateValue(draggingIndex.value, slider.fromPercent(percent))
    })
  }

  function onDragEnd() {
    // A release hides the value; a keyboard step brings it back.
    if (draggingIndex.value !== null) valueIndex.value = null
    draggingIndex.value = null
    dragOffset = 0
    pendingTouchJump = false
    stopRelease?.()
    stopCancel?.()
    stopRelease = null
    stopCancel = null

    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    stopRectTracking()
  }

  // Safety net: drop a pending rAF and the press listeners if the consumer
  // unmounts mid-drag.
  onScopeDispose(onDragEnd)

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

    rtl = isRtl(trackElement.value)
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
    rtl = isRtl(el)
    const value = slider.fromPercent(percentAlong(el.getBoundingClientRect(), event, axis()))
    const index = slider.getNearestThumbIndex(value)

    event.preventDefault()
    if (event.pointerType === 'touch') pendingTouchJump = true
    else slider.updateValue(index, value)
    beginDrag(index, event, null)
  }

  function onThumbKeydown(index: number, event: KeyboardEvent) {
    if (!isInteractive()) return

    const current = slider.values.value[index] ?? state.min
    const step = state.step || 1
    const change = step * (event.shiftKey ? 10 : 1)
    // In RTL the value grows to the left, so the horizontal arrows swap.
    const inline = !isVertical.value && isRtl(event.currentTarget as Element | null) ? -change : change

    const actions: Record<string, () => void> = {
      ArrowRight: () => slider.updateValue(index, current + inline),
      ArrowUp: () => slider.updateValue(index, current + change),
      ArrowLeft: () => slider.updateValue(index, current - inline),
      ArrowDown: () => slider.updateValue(index, current - change),
      PageUp: () => slider.updateValue(index, current + step * 10),
      PageDown: () => slider.updateValue(index, current - step * 10),
      Home: () => slider.updateValue(index, state.min),
      End: () => slider.updateValue(index, state.max),
    }

    if (event.key === 'Escape') {
      valueIndex.value = null
      return
    }

    const action = actions[event.key]
    if (!action) return

    event.preventDefault()
    action()
    valueIndex.value = index
  }

  const isDragging = computed(() => draggingIndex.value !== null)

  // State reaches markup through BEM modifiers and `aria-*`, not `data-*` (W5-А).
  const rootAttrs = computed<SliderRootAttrs>(() => ({
    role: slider.values.value.length > 1 ? 'group' : undefined,
  }))

  const trackAttrs = computed(() => ({
    ref: setTrackElement,
    // The track only drags along its own axis; a swipe across it scrolls the page.
    style: { touchAction: isVertical.value ? 'pan-x' : 'pan-y' },
    onPointerdown: onTrackPointerdown,
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
          : { insetInlineStart: `${start}%`, width: `${span}%` }),
      },
    }
  })

  /**
   * Attrs for the thumb at `index`. Called during render so the reads below stay
   * tracked; neighbours clamp `aria-valuemin`/`aria-valuemax` in range mode.
   */
  function getThumbAttrs(index: number): SliderThumbAttrs {
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
      'style': {
        '--m-slider-percent': `${percent}%`,
        // Unitless twin of the percentage: a gauge needle or a bar meter needs
        // it inside `calc()`, where a `%` value cannot be multiplied.
        '--m-slider-progress': percent,
        '--m-slider-value': value,
        [isVertical.value ? 'bottom' : 'insetInlineStart']: `${percent}%`,
        'touchAction': 'none',
      },
      'onKeydown': (event: KeyboardEvent) => onThumbKeydown(index, event),
      'onPointerdown': (event: PointerEvent) => onThumbPointerdown(index, event),
      'onBlur': () => {
        if (valueIndex.value === index) valueIndex.value = null
      },
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
    valueIndex: readonly(valueIndex),
    isDragging,
    trackElement: shallowReadonly(trackElement),

    // Attr bags
    rootAttrs,
    trackAttrs,
    rangeAttrs,
    getThumbAttrs,
  }
}
