/**
 * Public prop surface for `<MTabs>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'
import type { TabValue } from '#kit/composables/tabs/useTabs'
import type { MIconName } from '#kit/components/ui/icon/props'

export interface MTabItem {
  value: TabValue
  label: string
  icon?: MIconName
  disabled?: boolean
  to?: NuxtLinkProps['to']
}

export const mTabsProps = {
  items: { type: Array as PropType<MTabItem[]>, default: undefined },
}

export type MTabsProps = ExtractPublicPropTypes<typeof mTabsProps>
