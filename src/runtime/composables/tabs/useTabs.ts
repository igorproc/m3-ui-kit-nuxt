/**
 * @module useTabs
 *
 * @remarks
 * Per-instance context pair for the compound `<MTabs>` API. The orchestrator
 * owns a `createSingle({ mandatory: true })` instance and provides it (plus the
 * resolved `selectedValue`) so `<MTab>` and `<MTabPanel>` children can register
 * and read the active value. Namespace: `m3:tabs`.
 */
import type { ComputedRef, Ref } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { SingleContext, SingleTicket, SingleTicketInput } from '#kit/composables/registry/createSingle'

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
   * Value of the tab the orchestrator last asked to receive DOM focus
   * (keyboard navigation). The matching `<MTab>` focuses its button when this
   * equals its own value.
   */
  focusedValue: Readonly<Ref<TabValue | null>>
  /** Stable DOM id for a tab button (paired with `panelId` for ARIA wiring). */
  tabId: (value: TabValue) => string
  /** Stable DOM id for a tab panel (paired with `tabId` for ARIA wiring). */
  panelId: (value: TabValue) => string
}

export const [useTabsContext, provideTabsContext] = createContext<TabsContext>('m3:tabs')
