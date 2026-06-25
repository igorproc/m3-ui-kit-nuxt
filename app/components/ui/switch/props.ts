/**
 * Public prop surface for `<MSwitch>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * `disabled` comes from the shared `makeStateProps` (single source of truth).
 */
import type { ExtractPublicPropTypes } from 'vue'
import { makeStateProps } from '#shared/utils/props'

export const mSwitchProps = {
  ...makeStateProps(),
  path: { type: String, default: undefined },
  label: { type: String, default: undefined },
}

export type MSwitchProps = ExtractPublicPropTypes<typeof mSwitchProps>
