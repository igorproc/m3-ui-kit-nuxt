/**
 * Public prop surface for `<MSlider>`.
 *
 * Shared `disabled` (state) and `readonly` come from the kit factories, the
 * field props (`path`, `name`, the support line) from the selection family;
 * the rest are slider-specific value / geometry / a11y props.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'
import type { SliderOrigin } from '#kit/composables/slider/types'
import { makeReadonlyProps, makeStateProps } from '#kit/shared/utils/props'
import { mChoiceFieldProps } from '#kit/utils/choice/props'
import type { MChoiceSupportSlots } from '#kit/utils/choice/props'

export type MSliderOrientation = 'horizontal' | 'vertical'

/** W1-А: `default` is M3 XS (track 16), `comfortable` M3 M (track 40, inset icon). */
export type MSliderDensity = Extract<MFieldDensity, 'default' | 'comfortable'>

export type { SliderOrigin as MSliderOrigin }

const { disabled } = makeStateProps()

export const mSliderProps = {
  disabled,
  ...makeReadonlyProps(),
  ...mChoiceFieldProps,
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  /** Visible name above the track; names the thumb (or the range group). */
  label: { type: String, default: '' },
  /** Show the value above the thumb while it is pressed, dragged or stepped. */
  showValue: { type: Boolean, default: false },
  /** Draw a tick at every step. */
  discrete: { type: Boolean, default: false },
  range: { type: Boolean, default: false },
  orientation: { type: String as PropType<MSliderOrientation>, default: 'horizontal' },
  /** Track thickness and handle length. */
  density: { type: String as PropType<MSliderDensity>, default: 'default' },
  /** Where a single thumb's active track starts: the minimum or the middle (centered). */
  origin: { type: String as PropType<SliderOrigin>, default: 'start' },
  /** Accessible name of the start thumb of a range. */
  ariaLabelStart: { type: String, default: '' },
  /** Accessible name of the end thumb of a range (or of the only thumb). */
  ariaLabelEnd: { type: String, default: '' },
  /**
   * Words a value — the label above the thumb and its `aria-valuetext`
   * (`v => `$${v}``). Without it both show the number.
   */
  formatValue: { type: Function as PropType<(value: number, index: number) => string>, default: undefined },
}

export type MSliderProps = ExtractPublicPropTypes<typeof mSliderProps>

export interface MSliderSlots extends MChoiceSupportSlots {
  /** The label above a thumb (with `showValue`); `text` is the formatted value. */
  value?: (scope: { value: number, index: number, text: string }) => unknown
  /** The inset icon at the track's start (`density="comfortable"`, single thumb). */
  icon?: () => unknown
  /** The visible name; replaces `label`. */
  label?: () => unknown
}
