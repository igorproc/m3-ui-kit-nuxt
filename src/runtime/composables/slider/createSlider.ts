/**
 * @module createSlider
 *
 * @remarks
 * Composable for managing slider state: value math, step snapping,
 * percentage conversion, and multi-thumb value operations.
 *
 * This composable acts as a pure State Machine. All DOM interaction
 * (pointer events, layout geometry) should be handled by the consumer
 * component to ensure architectural separation of concerns.
 *
 * Designed for single-thumb, range, and multi-thumb sliders.
 * Reusable for color picker tracks, media scrubbers, gradient editors,
 * and other 1D value-on-track controls.
 *
 * @example
 * ```ts
 *
 * const slider = useSlider(modelValue, props, emit)
 *
 * // Convert pointer coordinates to percentage, then to snapped value
 * const percent = 50
 * const targetValue = slider.fromPercent(percent)
 * slider.updateValue(0, targetValue)
 * ```
 */

export interface UseSliderProps {
  min: number
  max: number
  step: number
  disabled: boolean
  readonly: boolean
  orientation: 'horizontal' | 'vertical'
}

export function useSlider(
  modelValue: Ref<number | number[]>,
  props: UseSliderProps,
  emit: (event: 'update:modelValue', ...args: any[]) => void,
) {
  /**
   * Round a value to the nearest step, clamped to min/max.
   *
   * @param value Raw value to snap.
   * @returns Snapped value with float-point precision correction.
   *
   * @remarks Pure function — does not modify slider state.
   * When `step` is `0`, only clamps without snapping.
   */
  function snap(value: number): number {
    const range = props.max - props.min
    if (range <= 0) return props.min

    if (props.step <= 0) {
      return Math.max(props.min, Math.min(props.max, value))
    }

    const stepCount = Math.round((value - props.min) / props.step)
    const snappedValue = props.min + stepCount * props.step

    // Double precision float fixing (e.g. 0.1 + 0.2 = 0.3)
    const precision = (props.step.toString().split('.')[1] || '').length
    const fixedValue = precision > 0 ? Number(snappedValue.toFixed(precision)) : snappedValue

    return Math.max(props.min, Math.min(props.max, fixedValue))
  }

  /**
   * Convert an absolute value to a 0–100 percentage.
   *
   * @param val The slider value to convert.
   * @returns Percentage between 0 and 100.
   *
   * @remarks Pure function. Used to position thumbs visually.
   */
  function fromValue(val: number): number {
    const range = props.max - props.min
    if (range <= 0) return 0
    return ((val - props.min) / range) * 100
  }

  /**
   * Convert a 0–100 percentage to a snapped value.
   *
   * @param percent Percentage between 0 and 100.
   * @returns Snapped slider value.
   *
   * @remarks Pure function. The returned value is snapped to the nearest step
   * and clamped to min/max.
   */
  function fromPercent(percent: number): number {
    const range = props.max - props.min
    const rawValue = props.min + (percent / 100) * range
    return snap(rawValue)
  }

  /**
   * Normalized values list.
   * Ensures that we always operate on an array, regardless of single or multi-thumb.
   */
  const values = computed(() => {
    if (Array.isArray(modelValue.value)) {
      return modelValue.value
    }
    return [modelValue.value]
  })

  /**
   * Set the value at a thumb index with step snapping and neighbor constraints.
   *
   * @param index Zero-based thumb index.
   * @param val Raw value to set.
   *
   * @remarks
   * No-op when `readonly` or `disabled` is true. The value is snapped to step,
   * clamped to min/max, and constrained by adjacent thumbs to prevent crossover.
   *
   * Updates are optimized to prevent reactivity thrashing by mutating the array element
   * and emitting only when values actually change.
   */
  function updateValue(index: number, val: number) {
    if (props.readonly || props.disabled) return

    const snapped = snap(val)

    if (Array.isArray(modelValue.value)) {
      // Prevent crossover by clamping thumb value between neighbors
      const currentValues = modelValue.value
      const prev = currentValues[index - 1]
      const next = currentValues[index + 1]

      let constrained = snapped
      if (prev !== undefined) constrained = Math.max(constrained, prev)
      if (next !== undefined) constrained = Math.min(constrained, next)

      // Only update and emit if the value actually changed to prevent reactivity thrashing
      if (currentValues[index] !== constrained) {
        // Create a new array for Vue 3 defineModel tracking to trigger reactivity correctly
        // without causing a full DOM destroy/recreate if keys are mapped properly.
        const nextValues = [...currentValues]
        nextValues[index] = constrained
        modelValue.value = nextValues
        emit('update:modelValue', nextValues)
      }
    } else {
      if (modelValue.value !== snapped) {
        modelValue.value = snapped
        emit('update:modelValue', snapped)
      }
    }
  }

  /**
   * Find the closest thumb index for a given value.
   * Used when clicking on the track to determine which thumb should jump.
   */
  function getNearestThumbIndex(value: number): number {
    const currentValues = values.value
    if (currentValues.length === 0) return 0

    let closest = 0
    let minDiff = Infinity

    for (let idx = 0; idx < currentValues.length; idx++) {
      const diff = Math.abs((currentValues[idx] ?? 0) - value)

      if (diff < minDiff) {
        minDiff = diff
        closest = idx
      }
    }

    return closest
  }

  const percentages = computed(() => {
    return values.value.map(val => fromValue(val))
  })

  const activeRange = computed(() => {
    const pcts = percentages.value
    if (pcts.length === 0) return { start: 0, end: 0 }
    if (pcts.length === 1) return { start: 0, end: pcts[0] }
    return {
      start: Math.min(...pcts),
      end: Math.max(...pcts),
    }
  })

  const tickCount = computed(() => {
    if (props.step <= 0) return 0
    return (props.max - props.min) / props.step
  })

  return {
    values,
    percentages,
    activeRange,
    tickCount,
    snap,
    fromValue,
    fromPercent,
    updateValue,
    getNearestThumbIndex,
  }
}
