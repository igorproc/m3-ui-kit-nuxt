/**
 * Public prop surface for `<MRadio>`.
 *
 * `disabled` comes from the shared state contract, the field props (`path`,
 * `name`, the support line) from the selection family; the rest are the radio's
 * own. Inside `MRadioGroup` the group's name, field and support line win.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeStateProps } from '#kit/shared/utils/props'
import { mChoiceFieldProps } from '#kit/utils/choice/props'
import type { MChoiceSupportSlots } from '#kit/utils/choice/props'

export type MRadioValue = string | number

const { disabled } = makeStateProps()

export const mRadioProps = {
  disabled,
  ...mChoiceFieldProps,
  /** The value this radio stands for; the model equals it while checked. */
  value: { type: [String, Number] as PropType<MRadioValue>, required: true },
  /** Text beside the ring; the default slot replaces it. */
  label: { type: String, default: undefined },
}

export type MRadioProps = ExtractPublicPropTypes<typeof mRadioProps>

export interface MRadioSlots extends MChoiceSupportSlots {
  /** The label beside the ring; replaces `label`. */
  default?: () => unknown
}
