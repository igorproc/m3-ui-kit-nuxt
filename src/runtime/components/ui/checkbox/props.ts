/**
 * Public prop surface for `<MCheckbox>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * `disabled` comes from the shared `makeStateProps` (single source of truth).
 */
import type { ExtractPublicPropTypes } from 'vue'
import { makeStateProps } from '#kit/shared/utils/props'

export const mCheckboxProps = {
  ...makeStateProps(),
  path: { type: String, default: undefined },
  label: { type: String, default: undefined },
}

export type MCheckboxProps = ExtractPublicPropTypes<typeof mCheckboxProps>
