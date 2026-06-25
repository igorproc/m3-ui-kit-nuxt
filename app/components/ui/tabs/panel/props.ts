/**
 * Public prop surface for `<MTabPanel>`.
 *
 * Type-based (not runtime `propsFactory`) because `value` is required.
 */
import type { TabValue } from '~/composables/tabs/useTabs'

export interface MTabPanelProps {
  value: TabValue
}
