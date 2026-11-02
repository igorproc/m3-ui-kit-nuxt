/**
 * Public prop surface for `<MTabs>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'
import type { TabValue } from '#kit/composables/tabs/useTabs'
import type { MIconName } from '#kit/components/ui/icon/props'

/** M3 tab hierarchy: `primary` under the app bar, `secondary` inside the content. */
export type MTabsHierarchy = 'primary' | 'secondary'

/** `fixed` shares the row equally (and scrolls as a safety net); `scrollable` sizes tabs by content. */
export type MTabsLayout = 'fixed' | 'scrollable'

/** Where a tab puts its icon against its label. */
export type MTabsIconPlacement = 'top' | 'start'

export interface MTabItem {
  value: TabValue
  label: string
  icon?: MIconName
  /** Glyph of the selected tab. Without it an `ic` outline icon turns to its filled pair; set it for a glyph that has none. */
  activeIcon?: MIconName
  disabled?: boolean
  /** Route of the tab. Tabs with routes are a navigation: links in a `<nav>`, no tablist, no panels. */
  to?: NuxtLinkProps['to']
  /** A count, or `true` for a dot. Drawn only: its meaning comes from `badgeLabel`. */
  badge?: number | true
  /** What the badge means ("3 unread"); describes the tab. The kit ships none. */
  badgeLabel?: string
}

export const mTabsProps = {
  items: { type: Array as PropType<MTabItem[]>, default: undefined },
  hierarchy: { type: String as PropType<MTabsHierarchy>, default: 'primary' },
  layout: { type: String as PropType<MTabsLayout>, default: 'fixed' },
  /** Unset, the hierarchy decides: `top` for primary, `start` for secondary. */
  iconPlacement: { type: String as PropType<MTabsIconPlacement>, default: undefined },
  /** Accessible name of the tablist (or of the `<nav>` of route tabs). The kit ships none: warns in dev when no name is given. */
  ariaLabel: { type: String, default: undefined },
  /** Id of a visible heading that names the tablist; preferred over `ariaLabel`. */
  ariaLabelledby: { type: String, default: undefined },
}

export type MTabsProps = ExtractPublicPropTypes<typeof mTabsProps>

export interface MTabsSlots {
  /** The default panel, filled for the selected value. */
  default?: (props: { value: TabValue | null }) => unknown
  /** `MTabPanel`s, one per tab. */
  panels?: () => unknown
  /** `MTab`s after the `items` ones. */
  tabs?: () => unknown
  /** The content of every `items` tab, in place of its label. */
  tab?: (props: { item: MTabItem, selected: boolean }) => unknown
}
