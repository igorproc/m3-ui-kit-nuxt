/**
 * Public prop surface for `<MBadge>`.
 *
 * Badges have no `variant`/`color` taxonomy — only the numeric/dot contract.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

/** `<MBadge>` props. */
export const mBadgeProps = {
  /** Text or numeric value displayed by the badge. */
  value: { type: [String, Number] as PropType<string | number>, default: undefined },
  /** Largest numeric value shown before the badge appends a plus sign. */
  max: { type: Number, default: 99 },
  /** Renders a compact status dot without visible label content. */
  dot: { type: Boolean, default: false },
}

export type MBadgeProps = ExtractPublicPropTypes<typeof mBadgeProps>
