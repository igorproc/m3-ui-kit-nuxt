/**
 * Public prop surface for `<MCheckbox>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * Only `disabled` comes from the shared state contract: a checkbox commits
 * instantly, so it has no `loading`. `v-model` and `v-model:indeterminate` are
 * declared in the SFC.
 */
import type { ExtractPublicPropTypes } from 'vue'
import { makeStateProps } from '#kit/shared/utils/props'
import { mChoiceFieldProps } from '#kit/utils/choice/props'
import type { MChoiceSupportSlots } from '#kit/utils/choice/props'

const { disabled } = makeStateProps()

export const mCheckboxProps = {
  disabled,
  ...mChoiceFieldProps,
  /** Text beside the box; the default slot replaces it. */
  label: { type: String, default: undefined },
}

export type MCheckboxProps = ExtractPublicPropTypes<typeof mCheckboxProps>

export interface MCheckboxSlots extends MChoiceSupportSlots {
  /** The label beside the box; replaces `label`. */
  default?: () => unknown
}
