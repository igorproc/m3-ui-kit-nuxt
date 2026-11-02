/**
 * @module useTabs
 *
 * @remarks
 * Per-instance context pair for the compound `<MTabs>` API. The orchestrator
 * owns a `createSingle({ mandatory: true })` instance and provides it (plus the
 * resolved `selectedValue`) so `<MTab>` and `<MTabPanel>` children can register
 * and read the active value. Its `register` also applies a preset `v-model`
 * to the tab it matches. Namespace: `m3:tabs`.
 */
import type { ComputedRef } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { SingleContext, SingleTicket, SingleTicketInput } from '#kit/composables/registry/createSingle'
import type { MTabsHierarchy, MTabsIconPlacement } from '#kit/components/ui/tabs/props'

export type TabValue = string | number

export interface TabsContext {
  /** Register a tab ticket in the single-selection instance. */
  register(ticket?: Partial<SingleTicketInput<TabValue>>): SingleTicket<SingleTicketInput<TabValue>>
  /** Unregister a tab ticket by id. */
  unregister: SingleContext['unregister']
  /** Select a ticket by id. */
  select: SingleContext['select']
  /** Number of registered tabs. */
  readonly size: number
  /** Resolved value of the active tab. */
  selectedValue: ComputedRef<TabValue | undefined>
  /**
   * Hands the orchestrator the element of a tab, so keyboard navigation can
   * focus it directly. Returns the matching unregister.
   */
  registerElement: (value: TabValue, element: () => HTMLElement | null) => () => void
  /** Stable DOM id for a tab button (paired with `panelId` for ARIA wiring). */
  tabId: (value: TabValue) => string
  /** Stable DOM id for a tab panel (paired with `tabId` for ARIA wiring). */
  panelId: (value: TabValue) => string
  /**
   * Whether `<MTabs>` renders panels (its default slot or `#panels`). Without
   * them a tab sets no `aria-controls`: it would point at nothing.
   */
  hasPanels: () => boolean
  /** The tabs lead to routes: links in a `<nav>`, selected by the current route. */
  readonly routes: boolean
  readonly hierarchy: MTabsHierarchy
  /** Icon placement after the hierarchy default. */
  readonly iconPlacement: MTabsIconPlacement
}

export const [useTabsContext, provideTabsContext] = createContext<TabsContext>('m3:tabs')
