/**
 * Public prop surface for `<MSearch>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * `disabled` comes from the shared `makeStateProps` (single source of truth).
 */
import type { ExtractPublicPropTypes } from 'vue'
import { makeStateProps } from '#shared/utils/props'

export const mSearchProps = {
  ...makeStateProps(),
  placeholder: { type: String, default: 'Search' },
  ariaLabel: { type: String, default: undefined },
}

export type MSearchProps = ExtractPublicPropTypes<typeof mSearchProps>
