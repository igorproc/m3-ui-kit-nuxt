/**
 * Public prop surface for `<MRadioGroup>`.
 *
 * `disabled` comes from the shared state contract and the field props (`path`,
 * `name`, the support line) from the selection family: the group is the form
 * field, its radios only hold values. `mandatory` enforces a non-empty selection.
 */
import type { ExtractPublicPropTypes } from 'vue'
import { makeStateProps } from '#kit/shared/utils/props'
import { mChoiceFieldProps } from '#kit/utils/choice/props'
import type { MChoiceSupportSlots } from '#kit/utils/choice/props'

const { disabled } = makeStateProps()

export const mRadioGroupProps = {
  disabled,
  ...mChoiceFieldProps,
  /** Visible name above the radios; names the radiogroup (`aria-labelledby`). */
  label: { type: String, default: undefined },
  /** Keep one radio selected once one is. */
  mandatory: { type: Boolean, default: false },
}

export type MRadioGroupProps = ExtractPublicPropTypes<typeof mRadioGroupProps>

export interface MRadioGroupSlots extends MChoiceSupportSlots {
  /** The group's visible name; replaces `label`. */
  label?: () => unknown
  /** The `MRadio`s of the group. */
  default?: () => unknown
}
