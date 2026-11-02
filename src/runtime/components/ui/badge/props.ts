/**
 * Public prop surface for `<MBadge>`.
 *
 * Badges have no `variant`/`color` taxonomy — only the numeric/dot contract.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

/** Live-region behaviour of `<MBadge>`, as `MBanner`'s. */
export type MBadgeAnnounce = 'polite' | 'off'

/** `<MBadge>` props. */
export const mBadgeProps = {
  /** Text or numeric value displayed by the badge. */
  value: { type: [String, Number] as PropType<string | number>, default: undefined },
  /** Largest numeric value shown before the badge appends a plus sign. */
  max: { type: Number, default: 99 },
  /** Renders a compact status dot without visible label content. */
  dot: { type: Boolean, default: false },
  /**
   * Live-region behaviour. `off` by default: a badge is described by its host
   * (a navigation item's name, a button's label), and a status region on every
   * instance is noise. `polite` announces value changes.
   */
  announce: { type: String as PropType<MBadgeAnnounce>, default: 'off' },
}

export type MBadgeProps = ExtractPublicPropTypes<typeof mBadgeProps>
