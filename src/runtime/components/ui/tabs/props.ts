/**
 * Public prop surface for `<MTabs>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'
import type { TabValue } from '#kit/composables/tabs/useTabs'

export interface MTabItem {
  value: TabValue
  label: string
  icon?: string
  disabled?: boolean
  to?: NuxtLinkProps['to']
}

export const mTabsProps = {
  items: { type: Array as PropType<MTabItem[]>, default: undefined },
}

export type MTabsProps = ExtractPublicPropTypes<typeof mTabsProps>
