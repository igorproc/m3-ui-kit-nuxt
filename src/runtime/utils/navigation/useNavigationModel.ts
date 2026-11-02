import { computed, useId, watch } from 'vue'
import type { Ref } from 'vue'
import { createSingle } from '#kit/composables/registry/createSingle'
import type { ID } from '#kit/shared/types/registry'

/**
 * Selection of a flat list of destinations bound to a `v-model` of their ids,
 * shared by the bar, the rail and the drawer.
 *
 * The model selects a destination as soon as it registers — items that arrive
 * after the model included — and `select(id)` writes the chosen id back.
 * Selection is not mandatory: an empty model selects nothing.
 *
 * @param items Reads the current destinations.
 * @param model The host's `v-model` (`defineModel`).
 * @returns The registry (for the host's slotted-item context), the selected id
 *   and `select`.
 */
export function useNavigationModel(items: () => readonly { id: string }[], model: Ref<string | null>) {
  const single = createSingle<{ id?: ID, value: string }>({ mandatory: false })

  function applyModel(value = model.value) {
    if (value === null || value === undefined) {
      if (single.selectedValue.value !== undefined) single.apply([])
      return
    }
    if (single.selectedValue.value !== value) single.apply([value])
  }

  const ticketIds = new Map<string, ID>()
  // Items that arrive after setup register outside it, where `useId()` has no
  // instance to draw from: each ticket gets an id derived from this one instead.
  const ticketBase = useId()

  function syncTickets() {
    const wanted = new Set(items().map(item => item.id))

    for (const item of items()) {
      if (ticketIds.has(item.id)) continue
      const ticket = single.register({ id: `${ticketBase}-${item.id}`, value: item.id })
      ticketIds.set(item.id, ticket.id)
    }

    for (const [value, id] of ticketIds) {
      if (wanted.has(value)) continue
      single.unregister(id)
      ticketIds.delete(value)
    }
  }

  // The model is applied right after the tickets change, so a destination that
  // arrives after the model is selected as it registers.
  watch(items, () => {
    syncTickets()
    applyModel()
  }, { immediate: true, deep: true })

  watch(model, value => applyModel(value))

  watch(single.selectedValue, (value) => {
    if (value !== model.value) model.value = (value ?? null)
  })

  const selectedValue = computed(() => single.selectedValue.value ?? null)

  function select(id: string) {
    const ticketId = ticketIds.get(id)
    if (ticketId !== undefined) single.select(ticketId)
  }

  return { single, selectedValue, select }
}
