/**
 * @module useNavigationRail
 *
 * @remarks
 * Per-instance context pair for `<MNavigationRail>`. The parent owns a
 * `createSingle({ mandatory: false })` instance bound to its `v-model`, driven
 * directly by the flat `items[]` path, and exposes the shared `expanded` state.
 * Provided with a `null` default so a slotted item can render standalone.
 * Namespace: `m3:navigation-rail`.
 */
import type { ComputedRef } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { SingleContext, SingleTicket, SingleTicketInput } from '#kit/composables/registry/createSingle'

// Local (not exported) to avoid an auto-import name clash with the identical
// `NavigationValue` exported from `useNavigationBar` (both are `string`).
type NavigationValue = string

export interface NavigationRailContext {
  /** Register a destination ticket in the single-selection instance. */
  register(ticket?: Partial<SingleTicketInput<NavigationValue>>): SingleTicket<SingleTicketInput<NavigationValue>>
  /** Unregister a ticket by id. */
  unregister: SingleContext['unregister']
  /** Select a ticket by id. */
  select: SingleContext['select']
  /** Resolved value of the active destination. */
  selectedValue: ComputedRef<NavigationValue | undefined>
  /** Whether the rail is in its expanded layout. */
  expanded: ComputedRef<boolean>
}

export const [useNavigationRailContext, provideNavigationRailContext]
  = createContext<NavigationRailContext | null>('m3:navigation-rail', null)
