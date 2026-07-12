/**
 * Public prop surface for `<MNavigationRailItem>`.
 */
import type { ExtractPublicPropTypes } from 'vue'

export const mNavigationRailItemProps = {
  active: { type: Boolean, default: false },
  expanded: { type: Boolean, default: false },
  icon: { type: String, required: true },
  label: { type: String, required: true },
  badge: { type: Number, default: 0 },
}

export type MNavigationRailItemProps = ExtractPublicPropTypes<typeof mNavigationRailItemProps>
