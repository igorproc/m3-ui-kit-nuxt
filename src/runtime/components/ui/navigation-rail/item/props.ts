/**
 * Public prop surface for `<MNavigationRailItem>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MIconName } from '#kit/components/ui/icon/props'

export const mNavigationRailItemProps = {
  active: { type: Boolean, default: false },
  expanded: { type: Boolean, default: false },
  icon: { type: String as PropType<MIconName>, required: true as const },
  label: { type: String, required: true },
  badge: { type: Number, default: 0 },
}

export type MNavigationRailItemProps = ExtractPublicPropTypes<typeof mNavigationRailItemProps>
