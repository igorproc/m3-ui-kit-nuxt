/**
 * Public prop surface for `<MButtonExtendedFab>`.
 *
 * Mirrors the FAB contract: shared MD3 color role + surface variant + size +
 * state props. The legacy `surface` color-enum is expressed as `variant:
 * 'tonal'` instead.
 */
import type { ExtractPublicPropTypes } from 'vue'
import { makeColorProps, makeSizeProps, makeStateProps, makeVariantProps } from '~~/shared/utils/props'

/** Extended FAB props — defaults to the filled (role-container) surface. */
export const mExtendedFabProps = {
  ...makeColorProps(),
  ...makeVariantProps({ variant: 'filled' }),
  ...makeSizeProps(),
  ...makeStateProps(),
}

export type MExtendedFabProps = ExtractPublicPropTypes<typeof mExtendedFabProps>
