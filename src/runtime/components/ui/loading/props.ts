/**
 * Public prop surface for `<MLoading>`.
 *
 * `type` (`spinner | shape`) is the indicator *kind*, not an MD3
 * surface-style `variant`. `density` is the kit's three-step scale.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MorphTransitionInput } from '#kit/utils/motion'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'

/**
 * `spinner` is the light CSS arc buttons and tables show inline; `shape` the
 * M3 Expressive indicator, a morphing shape.
 */
export type MLoadingType = 'spinner' | 'shape'
export type MLoadingDensity = MFieldDensity

export const mLoadingProps = {
  type: { type: String as PropType<MLoadingType>, default: 'spinner' },
  /** The M3 contained indicator: a 48 container in `primary-container` around a 38 indicator, whatever the density. */
  contained: { type: Boolean, default: false },
  /** Indicator size: 16 · 24 · 32. Ignored when `inline` takes the host's font size. */
  density: { type: String as PropType<MLoadingDensity>, default: 'default' },
  inline: { type: Boolean, default: false },
  /**
   * Accessible name of the status. No default: copy the kit would invent
   * cannot be in the app's language. A host that announces being busy itself
   * (`aria-busy` on a button or a table) hides the indicator instead.
   */
  ariaLabel: { type: String },
  /**
   * Motion of the `shape` indicator's morph. The cycle interval is
   * derived from it — the transition's own duration plus its rest — so the
   * shapes never sit still waiting for a hardcoded timer.
   */
  transition: {
    type: [String, Object] as PropType<MorphTransitionInput>,
    default: 'expressive',
  },
}

export type MLoadingProps = ExtractPublicPropTypes<typeof mLoadingProps>
