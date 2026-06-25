/**
 * Public prop surface for `<MSlider>`.
 *
 * Shared `disabled` (state) and `readonly` come from the kit factories; the rest
 * are slider-specific value/geometry/a11y props.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeReadonlyProps, makeStateProps } from '#shared/utils/props'

export type MSliderOrientation = 'horizontal' | 'vertical'

const { disabled } = makeStateProps()

export const mSliderProps = {
  disabled,
  ...makeReadonlyProps(),
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  label: { type: String, default: '' },
  showValue: { type: Boolean, default: false },
  discrete: { type: Boolean, default: false },
  range: { type: Boolean, default: false },
  orientation: { type: String as PropType<MSliderOrientation>, default: 'horizontal' },
  name: { type: String, default: undefined },
  ariaLabelStart: { type: String, default: '' },
  ariaLabelEnd: { type: String, default: '' },
}

export type MSliderProps = ExtractPublicPropTypes<typeof mSliderProps>
