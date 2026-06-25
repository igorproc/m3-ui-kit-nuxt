/**
 * @module useTableSelection
 *
 * @remarks
 * Routes `<MTable>` row selection through a `createGroup` registry instance keyed
 * by `row.id` (replacing the old `JSON.stringify` equality). Keeps the public
 * `v-model:selected-rows` contract: an external array of full row objects syncs
 * two-way with the registry. A ticket is registered per data row; the set is
 * re-synced whenever `data` changes.
 *
 * The returned helpers (`isSelected`, `toggleRow`, `isAllSelected`, `toggleAll`)
 * derive from the group so the view stays thin.
 */
import { computed, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { createGroup } from '~/composables/registry/createGroup'
import type { TableData } from '~/components/ui/table/types'

export interface UseTableSelectionOptions<T extends TableData> {
  /** Source rows; tickets are kept in sync with this list. */
  data: MaybeRefOrGetter<T[]>
  /** External selection (the `selectedRows` prop / v-model). */
  selectedRows: MaybeRefOrGetter<T[]>
  /** Emit the next `update:selectedRows` payload. */
  onChange: (rows: T[]) => void
}

export function useTableSelection<T extends TableData>(options: UseTableSelectionOptions<T>) {
  const group = createGroup<{ value: T['id'] }>()

  // Keep one ticket per data row, keyed by `row.id`. Re-sync on data changes.
  watch(
    () => toValue(options.data),
    (rows) => {
      const nextIds = new Set(rows.map(row => row.id))

      for (const ticket of [...group.values()]) {
        if (!nextIds.has(ticket.value as T['id'])) group.unregister(ticket.id)
      }

      const knownIds = new Set(group.values().map(ticket => ticket.value as T['id']))

      for (const row of rows) {
        if (!knownIds.has(row.id)) group.register({ value: row.id })
      }
    },
    { immediate: true, deep: true },
  )

  // External `selectedRows` -> registry.
  watch(
    [() => toValue(options.selectedRows), () => group.size],
    () => {
      group.apply(toValue(options.selectedRows).map(row => row.id))
    },
    { immediate: true, deep: true },
  )

  const rowById = computed(() => {
    const map = new Map<T['id'], T>()
    for (const row of toValue(options.data)) map.set(row.id, row)
    return map
  })

  // Registry -> external `selectedRows`.
  watch(group.selectedValues, (ids) => {
    const next: T[] = []
    for (const id of ids) {
      const row = rowById.value.get(id as T['id'])
      if (row) next.push(row)
    }

    const current = toValue(options.selectedRows)
    const sameLength = current.length === next.length
    const unchanged = sameLength && next.every(row => current.some(r => r.id === row.id))

    if (!unchanged) options.onChange(next)
  })

  const selectedIds = computed(() => group.selectedValues.value as Set<T['id']>)

  function isSelected(row: T): boolean {
    return selectedIds.value.has(row.id)
  }

  function toggleRow(row: T): void {
    const ids = group.values()
      .filter(ticket => ticket.value === row.id)
      .map(ticket => ticket.id)

    group.toggle(ids)
  }

  const isAllSelected = computed(() => group.isAllSelected.value)

  function toggleAll(): void {
    group.toggleAll()
  }

  return {
    group,
    isSelected,
    toggleRow,
    isAllSelected,
    toggleAll,
  }
}
