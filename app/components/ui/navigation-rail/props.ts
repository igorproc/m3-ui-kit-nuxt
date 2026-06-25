/**
 * Public prop surface for `<MNavigationRail>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export interface MNavigationRailItem {
  id: string
  icon: string
  label: string
  badge?: number
}

export const mNavigationRailProps = {
  items: { type: Array as PropType<MNavigationRailItem[]>, default: () => [] },
  expanded: { type: Boolean, default: false },
}

export type MNavigationRailProps = ExtractPublicPropTypes<typeof mNavigationRailProps>
