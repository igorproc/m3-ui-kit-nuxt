/**
 * Public prop surface for `<MRadio>`.
 *
 * `disabled` comes from the shared state contract; the rest are radio-specific
 * (form name/value/path + label).
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeStateProps } from '#shared/utils/props'

export type MRadioValue = string | number

const { disabled } = makeStateProps()

export const mRadioProps = {
  disabled,
  name: { type: String, default: undefined },
  value: { type: [String, Number] as PropType<MRadioValue>, required: true },
  label: { type: String, default: undefined },
  path: { type: String, default: undefined },
}

export type MRadioProps = ExtractPublicPropTypes<typeof mRadioProps>
