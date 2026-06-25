/**
 * Public prop surface for `<MNavigationBar>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export interface MNavigationBarItem {
  id: string
  icon: string
  label: string
  badge?: number
}

export const mNavigationBarProps = {
  items: { type: Array as PropType<MNavigationBarItem[]>, default: () => [] },
}

export type MNavigationBarProps = ExtractPublicPropTypes<typeof mNavigationBarProps>
