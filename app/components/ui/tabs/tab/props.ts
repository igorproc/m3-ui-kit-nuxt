/**
 * Public prop surface for `<MTab>`.
 *
 * Uses a type-based contract (not the runtime `propsFactory`) because `value`
 * is required — a leaf component with a mandatory prop expresses that cleaner
 * with `defineProps<Props>()` than with an all-optional runtime props object.
 * `disabled` is a plain state flag (a tab has no async action → no `loading`).
 */
import type { TabValue } from '~/composables/tabs/useTabs'
import type { NuxtLinkProps } from '#app'

export interface MTabProps {
  value: TabValue
  label?: string
  icon?: string
  disabled?: boolean
  /** Optional Nuxt route destination. Without it the tab remains a button. */
  to?: NuxtLinkProps['to']
}
