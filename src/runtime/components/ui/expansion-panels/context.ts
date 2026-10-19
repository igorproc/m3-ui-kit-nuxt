/**
 * @module expansion-panels/context
 *
 * @remarks
 * What `<MExpansionPanels>` tells the panels inside it. Namespace:
 * `m3:expansion-panel-group`. `<MExpansionPanel>` injects it with a `null`
 * default, so a single panel keeps working standalone (its own `v-model`).
 * Inside a group the panel registers in the group's selection — one instance
 * whose `multiple` and `mandatory` follow the group's props, so either can
 * change after mount.
 */
import type { MaybeRefOrGetter } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { GroupTicket } from '#kit/composables/registry/createGroup'
import type { ID } from '#kit/shared/types/registry'
import type { PanelValue } from '#kit/components/ui/expansion-panel/props'

export interface ExpansionPanelGroupContext {
  /** Whether multiple panels may be open at once; follows the group prop. */
  readonly multiple: boolean
  /**
   * Register a panel ticket; returns the ticket so the panel can dispose it.
   * A panel whose value the group's model holds is open as soon as it
   * registers, so a preset model renders open on the server.
   */
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
  /** Whether the panel is open and the group will not let it close (`mandatory`, exclusive). */
  isLocked: (value: PanelValue) => boolean
}

export const [useExpansionPanelGroupContext, provideExpansionPanelGroupContext]
  = createContext<ExpansionPanelGroupContext | null>('m3:expansion-panel-group', null)
