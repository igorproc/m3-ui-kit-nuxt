/**
 * Public prop surface for `<MBadge>`.
 *
 * Badges have no `variant`/`color` taxonomy — only the numeric/dot contract.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

/** `<MBadge>` props. */
export const mBadgeProps = {
  value: { type: [String, Number] as PropType<string | number>, default: undefined },
  max: { type: Number, default: 99 },
  dot: { type: Boolean, default: false },
}

export type MBadgeProps = ExtractPublicPropTypes<typeof mBadgeProps>
