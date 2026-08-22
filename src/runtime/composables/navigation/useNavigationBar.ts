/**
 * @module useNavigationBar
 *
 * @remarks
 * Per-instance context pair for `<MNavigationBar>`. The parent owns a
 * `createSingle({ mandatory: false })` instance bound to its `v-model`; the
 * flat `items[]` path drives the registry directly. The context is provided
 * (namespace `m3:navigation-bar`, `null` default so a future slotted item can
 * render standalone) so slotted destinations can register and reflect the
 * active value without the parent re-plumbing props.
 */
import type { ComputedRef } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { SingleContext, SingleTicket, SingleTicketInput } from '#kit/composables/registry/createSingle'

export type NavigationValue = string

export interface NavigationBarContext {
  /** Register a destination ticket in the single-selection instance. */
  register(ticket?: Partial<SingleTicketInput<NavigationValue>>): SingleTicket<SingleTicketInput<NavigationValue>>
  /** Unregister a ticket by id. */
  unregister: SingleContext['unregister']
  /** Select a ticket by id. */
  select: SingleContext['select']
  /** Resolved value of the active destination. */
  selectedValue: ComputedRef<NavigationValue | undefined>
}

export const [useNavigationBarContext, provideNavigationBarContext]
  = createContext<NavigationBarContext | null>('m3:navigation-bar', null)
