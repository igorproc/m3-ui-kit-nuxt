/**
 * Public prop surface for `<MNavigationBar>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MIconName } from '#kit/components/ui/icon/props'

export interface MNavigationBarItem {
  id: string
  icon: MIconName
  label: string
  badge?: number
}

export const mNavigationBarProps = {
  items: { type: Array as PropType<MNavigationBarItem[]>, default: () => [] },
  // Accessible name for the <nav> landmark.
  ariaLabel: { type: String as PropType<string>, default: 'Primary' },
}

export type MNavigationBarProps = ExtractPublicPropTypes<typeof mNavigationBarProps>
