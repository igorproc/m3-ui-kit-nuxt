/**
 * @module useNumberScrub
 *
 * @remarks
 * Turns a horizontal drag on a handle into steps of a numeric value — the
 * design-tool gesture where the property label itself is draggable.
 *
 * The gesture is **absolute, not incremental**: the value at `pointerdown` is
 * snapshotted and every move recomputes `base + steps × step`. Dragging back to
 * where the pointer started therefore restores the original value exactly, and
 * a modifier pressed halfway through rescales the whole gesture instead of
 * leaving a seam at the point it was pressed.
 *
 * Accessibility: this composable adds no keyboard path of its own, and must not.
 * The handle is a `<label>` pointing at the input, so it is not a tab stop and
 * clicking it focuses the field; the keyboard equivalent of the gesture is the
 * input's own spinbutton stepping (ArrowUp/ArrowDown, PageUp/PageDown). Binding
 * ArrowLeft/ArrowRight on the input would take caret movement away from the
 * user, which costs more than it buys.
 *
 * @example
 * ```ts
 * const { handle, isScrubbing } = useNumberScrub(value, props)
 * ```
 * ```vue
 * <label ref="handle" :for="fieldId">W</label>
 * ```
 */
import { computed, shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import { useDrag } from '#kit/composables/useDrag'
import type { UseNumberValueReturn } from '#kit/composables/number-input/useNumberValue'

/**
 * Pointer travel that amounts to one step. Small enough that a value moves
 * under the finger, large enough that a shaky hand does not.
 * Raw CSS pixels on purpose — this is pointer distance, not a style length.
 */
const PIXELS_PER_STEP = 4

/** Travel before the gesture engages, so a click on the label stays a click. */
const DRAG_THRESHOLD = 3

const COARSE_MULTIPLIER = 10
const FINE_MULTIPLIER = 0.1

export interface NumberScrubProps {
  /**
   * The stepping axis. The gesture is live in `'scrub'` and inert in every
   * other mode. Spelled out rather than imported so this layer stays free of
   * the component; the public alias is `MNumberInputControls` in
   * `components/ui/number-input/props.ts`, and the two must agree.
   */
  controls?: 'split' | 'stacked' | 'scrub' | false
  disabled?: boolean
  readonly?: boolean
}

export interface UseNumberScrubReturn {
  /** Template ref for the drag handle. */
  handle: ShallowRef<HTMLElement | null>
  /** `true` from the moment the drag passes the threshold until pointerup. */
  isScrubbing: Readonly<Ref<boolean>>
}

/**
 * Binds a horizontal drag gesture on a handle to a numeric value.
 *
 * @param value The value layer to drive, from {@link useNumberValue}.
 * @param props Reactive props bag, see {@link NumberScrubProps}.
 */
export function useNumberScrub(
  value: UseNumberValueReturn,
  props: NumberScrubProps,
): UseNumberScrubReturn {
  const handle = shallowRef<HTMLElement | null>(null)
  const disabled = computed(() => props.controls !== 'scrub' || Boolean(props.disabled || props.readonly))

  let base = 0

  function multiplierFor(event: PointerEvent) {
    if (event.shiftKey) return COARSE_MULTIPLIER
    if (event.altKey) return FINE_MULTIPLIER
    return 1
  }

  const { isDragging } = useDrag(handle, {
    axis: 'x',
    threshold: DRAG_THRESHOLD,
    disabled,
    onStart: () => {
      base = value.currentValue.value
    },
    onMove: (state) => {
      const steps = Math.trunc(state.dx / PIXELS_PER_STEP)
      const distance = steps * value.safeStep.value * multiplierFor(state.event)

      value.set(base + distance)
    },
  })

  return {
    handle,
    isScrubbing: isDragging,
  }
}
