/**
 * @module useTableSelection
 *
 * @remarks
 * Row selection of `<MTable>`, driven by the model (`v-model:selected-rows`),
 * the way the dropdown family keeps its value: the table renders one page of
 * rows, but the selection is the app's set of records and outlives the page.
 *
 * - A selected row that is not on the current page stays selected; only the
 *   rows on the page are rendered and can be toggled.
 * - Select-all acts on the current page: it adds the page's unselected rows or,
 *   when the whole page is selected, takes the page's rows out. Rows of other
 *   pages are never touched by it.
 * - The table never drops a row from the selection by itself — not when the
 *   page changes and not when the row disappears from the data (it cannot tell
 *   a row on another page from a deleted one). Pruning deleted records is the
 *   app's job.
 *
 * Without a bound `v-model` the selection is kept locally, so a table that only
 * listens to `update:selectedRows` still shows what was ticked.
 */
import { computed, shallowRef, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { TableData } from '#kit/components/ui/table/types'

export interface UseTableSelectionOptions<T extends TableData> {
  /** Rows of the current page. */
  data: MaybeRefOrGetter<T[]>
  /** External selection (the `selectedRows` prop / v-model), across pages. */
  selectedRows: MaybeRefOrGetter<T[]>
  /** Emit the next `update:selectedRows` payload. */
  onChange: (rows: T[]) => void
}

export interface UseTableSelectionReturn<T extends TableData> {
  isSelected: (row: T) => boolean
  toggleRow: (row: T) => void
  /** Every row of the current page is selected (and the page has rows). */
  isAllSelected: ComputedRef<boolean>
  /** Some rows of the current page are selected, not all. */
  isMixed: ComputedRef<boolean>
  /** Selects the page's remaining rows, or clears the page when all are selected. */
  toggleAll: () => void
}

export function useTableSelection<T extends TableData>(options: UseTableSelectionOptions<T>): UseTableSelectionReturn<T> {
  const selection = shallowRef<T[]>(toValue(options.selectedRows))

  watch(() => toValue(options.selectedRows), (rows) => {
    selection.value = rows
  })

  const selectedIds = computed(() => new Set(selection.value.map(row => row.id)))
  const pageRows = computed(() => toValue(options.data))

  function isSelected(row: T): boolean {
    return selectedIds.value.has(row.id)
  }

  function commit(rows: T[]) {
    selection.value = rows
    options.onChange(rows)
  }

  function toggleRow(row: T): void {
    commit(isSelected(row)
      ? selection.value.filter(selected => selected.id !== row.id)
      : [...selection.value, row])
  }

  const isAllSelected = computed(() => pageRows.value.length > 0 && pageRows.value.every(isSelected))
  const isMixed = computed(() => !isAllSelected.value && pageRows.value.some(isSelected))

  function toggleAll(): void {
    if (isAllSelected.value) {
      const pageIds = new Set(pageRows.value.map(row => row.id))
      commit(selection.value.filter(row => !pageIds.has(row.id)))
      return
    }

    commit([...selection.value, ...pageRows.value.filter(row => !isSelected(row))])
  }

  return { isSelected, toggleRow, isAllSelected, isMixed, toggleAll }
}
