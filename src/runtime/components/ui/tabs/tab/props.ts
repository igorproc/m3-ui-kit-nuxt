/**
 * Public prop surface for `<MTab>`.
 *
 * Uses a type-based contract (not the runtime `propsFactory`) because `value`
 * is required — a leaf component with a mandatory prop expresses that cleaner
 * with `defineProps<Props>()` than with an all-optional runtime props object.
 * `disabled` is a plain state flag (a tab has no async action → no `loading`).
 */
import type { TabValue } from '#kit/composables/tabs/useTabs'
import type { NuxtLinkProps } from '#app'
import type { MIconName } from '#kit/components/ui/icon/props'

export interface MTabProps {
  value: TabValue
  label?: string
  icon?: MIconName
  /** Glyph of the selected tab. Without it an `ic` outline icon turns to its filled pair; set it for a glyph that has none. */
  activeIcon?: MIconName
  disabled?: boolean
  /** Route of the tab: inside `MTabs` it turns the tabs into a navigation of links. */
  to?: NuxtLinkProps['to']
  /** A count, or `true` for a dot. Drawn only: its meaning comes from `badgeLabel`. */
  badge?: number | true
  /** What the badge means; describes the tab. */
  badgeLabel?: string
}

export interface MTabSlots {
  /** The label content. */
  default?: (props: { selected: boolean }) => unknown
}
