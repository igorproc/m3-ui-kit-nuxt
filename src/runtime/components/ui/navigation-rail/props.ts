/**
 * Public prop surface for `<MNavigationRail>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MIconName } from '#kit/components/ui/icon/props'

export interface MNavigationRailItem {
  id: string
  icon: MIconName
  label: string
  badge?: number
}

export const mNavigationRailProps = {
  items: { type: Array as PropType<MNavigationRailItem[]>, default: () => [] },
  expanded: { type: Boolean, default: false },
  // Accessible name for the <nav> landmark.
  ariaLabel: { type: String as PropType<string>, default: 'Primary' },
}

export type MNavigationRailProps = ExtractPublicPropTypes<typeof mNavigationRailProps>
