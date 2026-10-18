/**
 * Public prop surface for `<MLoading>`.
 *
 * `type` (`circular | expressive`) is the indicator *kind*, not an MD3
 * surface-style `variant`. `size` keeps the loading-specific scale
 * (`small | medium | large`), distinct from the shared `MSize`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MorphTransitionInput } from '#kit/utils/motion'

export type MLoadingType = 'circular' | 'expressive'
export type MLoadingSize = 'small' | 'medium' | 'large'

export const mLoadingProps = {
  type: { type: String as PropType<MLoadingType>, default: 'circular' },
  size: { type: String as PropType<MLoadingSize>, default: 'medium' },
  inline: { type: Boolean, default: false },
  /**
   * Accessible name of the status. No default: copy the kit would invent
   * cannot be in the app's language. A host that announces being busy itself
   * (`aria-busy` on a button or a table) hides the indicator instead.
   */
  ariaLabel: { type: String },
  /**
   * Motion of the `expressive` indicator's shape morph. The cycle interval is
   * derived from it — the transition's own duration plus its rest — so the
   * shapes never sit still waiting for a hardcoded timer.
   */
  transition: {
    type: [String, Object] as PropType<MorphTransitionInput>,
    default: 'expressive',
  },
}

export type MLoadingProps = ExtractPublicPropTypes<typeof mLoadingProps>
