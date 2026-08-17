/**
 * Public prop surface for `<MRadioGroup>`.
 *
 * `disabled` comes from the shared state contract; `name`/`path` wire the group
 * to forms and `mandatory` enforces a non-empty selection.
 */
import type { ExtractPublicPropTypes } from 'vue'
import { makeStateProps } from '#kit/shared/utils/props'

const { disabled } = makeStateProps()

export const mRadioGroupProps = {
  disabled,
  name: { type: String, default: undefined },
  path: { type: String, default: undefined },
  mandatory: { type: Boolean, default: false },
}

export type MRadioGroupProps = ExtractPublicPropTypes<typeof mRadioGroupProps>
