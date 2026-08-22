/**
 * @module useExpansionPanelGroup
 *
 * @remarks
 * Optional per-instance context pair for `<MExpansionPanels>`. `<MExpansionPanel>`
 * injects it with a `null` default so a single panel keeps working standalone
 * (its own `v-model` open state). When a group ancestor is present, the panel
 * registers in the group's selection instance — `createGroup` for `multiple`,
 * `createSingle` for exclusive accordion behavior.
 *
 * Namespace: `m3:expansion-panel-group`.
 */
import type { MaybeRefOrGetter } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { GroupTicket } from '#kit/composables/registry/createGroup'
import type { ID } from '#kit/shared/types/registry'

export type PanelValue = string | number

export interface ExpansionPanelGroupContext {
  /** Whether multiple panels may be open at once. */
  multiple: boolean
  /** Register a panel ticket; returns the ticket so the panel can dispose it. */
  register: (ticket: {
    value: PanelValue
    disabled?: MaybeRefOrGetter<boolean>
  }) => GroupTicket<{ value: PanelValue }>
  /** Unregister a panel ticket by id. */
  unregister: (id: ID) => void
  /** Toggle the panel for the given value. */
  toggle: (value: PanelValue) => void
  /** Whether the panel for the given value is open. */
  isOpen: (value: PanelValue) => boolean
}

export const [useExpansionPanelGroupContext, provideExpansionPanelGroupContext]
  = createContext<ExpansionPanelGroupContext | null>('m3:expansion-panel-group', null)
