/**
 * @module slider/types
 *
 * Public shapes of the slider behavior layer (`useSliderControl`).
 */
import type { ComputedRef, MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import type { useSlider } from '#kit/composables/slider/createSlider'

export type SliderOrientation = 'horizontal' | 'vertical'

/** Where the active track starts: the minimum, or the middle of the scale (centered). */
export type SliderOrigin = 'start' | 'center'

/** Value math shared with {@link useSlider} and re-exported unchanged. */
type SliderMath = ReturnType<typeof useSlider>

export interface SliderRootAttrs {
  /** A range is a group of thumbs; a single slider needs no wrapper role. */
  role: 'group' | undefined
}

export interface SliderTrackAttrs {
  ref: (value: unknown) => void
  style: Record<string, string>
  onPointerdown: (event: PointerEvent) => void
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
  'style': Record<string, string | number>
  'onKeydown': (event: KeyboardEvent) => void
  'onPointerdown': (event: PointerEvent) => void
  'onBlur': () => void
}

export interface UseSliderControlReturn extends Pick<
  SliderMath,
  'values' | 'percentages' | 'activeRange' | 'tickCount' | 'snap' | 'fromValue' | 'fromPercent' | 'updateValue' | 'getNearestThumbIndex'
> {
  draggingIndex: Readonly<ShallowRef<number | null>>
  /**
   * The thumb whose value indicator shows: set by a press or a keyboard step,
   * cleared by release, blur and Escape (WCAG 1.4.13). Never by hover.
   */
  valueIndex: Readonly<ShallowRef<number | null>>
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
  /** Where a single thumb's active track starts. @default 'start' */
  origin?: MaybeRefOrGetter<SliderOrigin>
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
