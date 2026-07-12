/**
 * Public prop surface for `<MButtonFab>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical `propsFactory` pattern. FAB exposes the shared MD3
 * color role + surface variant + size + state props. The legacy `surface`
 * color-enum is gone: the low-emphasis look is now `variant: 'tonal'`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps, makeSizeProps, makeStateProps, makeVariantProps } from '~~/shared/utils/props'

/** FAB props — defaults to the filled (role-container) surface. */
export const mFabProps = {
  ...makeColorProps(),
  ...makeVariantProps({ variant: 'filled' }),
  ...makeSizeProps(),
  ...makeStateProps(),
  /** Accessible name required by the icon-only FAB. */
  ariaLabel: { type: String as PropType<string>, default: undefined },
}

export type MFabProps = ExtractPublicPropTypes<typeof mFabProps>
