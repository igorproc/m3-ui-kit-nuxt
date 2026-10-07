/**
 * Public prop surface for `<MButtonExtendedFab>`.
 *
 * Mirrors the FAB contract (colour role, M3 colour set, `density`, state) and
 * adds `expanded`: collapsed, the button folds into a FAB of the same step.
 */
import type { ExtractPublicPropTypes } from 'vue'
import { makeFabProps } from '../fab/props'

/** Extended FAB props — defaults to the tonal (role-container) set. */
export const mExtendedFabProps = {
  ...makeFabProps(),
  /**
   * Shows the label. When `false` the button folds to its icon; the label
   * stays as the accessible name. Needs a `#prepend` icon to fold to.
   */
  expanded: { type: Boolean, default: true },
}

export type MExtendedFabProps = ExtractPublicPropTypes<typeof mExtendedFabProps>
