/**
 * Public prop surface for `<MLoading>`.
 *
 * `type` (`circular | expressive`) is the indicator *kind*, not an MD3
 * surface-style `variant`. `size` keeps the loading-specific scale
 * (`small | medium | large`), distinct from the shared `MSize`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MLoadingType = 'circular' | 'expressive'
export type MLoadingSize = 'small' | 'medium' | 'large'

export const mLoadingProps = {
  type: { type: String as PropType<MLoadingType>, default: 'circular' },
  size: { type: String as PropType<MLoadingSize>, default: 'medium' },
  inline: { type: Boolean, default: false },
  ariaLabel: { type: String, default: 'Loading' },
}

export type MLoadingProps = ExtractPublicPropTypes<typeof mLoadingProps>
