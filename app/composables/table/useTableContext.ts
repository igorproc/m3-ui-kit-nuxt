/**
 * @module useTableContext
 *
 * @remarks
 * Per-instance context pair for `<MTable>`. The orchestrator provides shared
 * selection/sort/pagination state so `<MTableHeader>` / `<MTablePagination>` can
 * consume it instead of relying solely on prop-drilling. The context is optional
 * (`null` default) so the sub-components keep working standalone with their own
 * props for backward-compat.
 *
 * Namespace: `m3:table`.
 */
import type { ComputedRef, Ref, WritableComputedRef } from 'vue'
import { createContext } from '~~/shared/utils/createContext'

export interface TableContext {
  /** Whether the table renders the row-selection column. */
  selectable: Ref<boolean> | ComputedRef<boolean>
  /** Whether every selectable row is selected. */
  isAllSelected: ComputedRef<boolean>
  /** Toggle the select-all state. */
  toggleAll: () => void
  /** Current sort state (writable, mirrors `v-model:sort`). */
  sort: Ref<unknown> | WritableComputedRef<unknown>
  /** Apply a new sort state. */
  setSort: (value: unknown) => void
}

export const [useTableContext, provideTableContext]
  = createContext<TableContext | null>('m3:table', null)
