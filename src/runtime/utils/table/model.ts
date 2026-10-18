/**
 * @module utils/table/model
 *
 * @remarks
 * Pure rules of `<MTable>`: what the body shows for a combination of data
 * states, the numbers of the current page, and the sort cycle. No Vue and no
 * DOM, so the server and the client agree on them and they are tested as a
 * table of cases. Internal to the table family: `utils/` is not auto-imported,
 * so none of this reaches a consumer's namespace.
 */
import { normalizePage } from '#kit/shared/utils/pagination'
import type { MTableAlign, MTablePageRange, SortState, TableColumn } from '#kit/components/ui/table/types'

/** What stands in for the rows, if anything. */
export type MTableMessage = 'loading' | 'empty' | 'error'

export interface TableBodyInput {
  loading: boolean
  error: boolean | string | undefined
  rowCount: number
}

export interface TableBody {
  /** The message row, alone or after the rows; `null` when the rows speak for themselves. */
  message: MTableMessage | null
  /** Rows stay on screen while their replacement loads. */
  refreshing: boolean
}

/**
 * Resolves the body. Loading wins while it lasts: a retry after an error shows
 * progress, not the stale error. An error with rows keeps the rows that did
 * load and reports the failure after them.
 */
export function resolveTableBody({ loading, error, rowCount }: TableBodyInput): TableBody {
  const hasRows = rowCount > 0

  if (loading) return { message: hasRows ? null : 'loading', refreshing: hasRows }
  if (error) return { message: 'error', refreshing: false }

  return { message: hasRows ? null : 'empty', refreshing: false }
}

/**
 * The numbers of one page: its 1-based row span, the page clamped into the
 * page count, and that count. An empty source has no rows on its one page.
 */
export function getTablePageRange(page: number, pageSize: number, total: number): MTablePageRange {
  const size = Math.max(1, Math.floor(pageSize) || 1)
  const safeTotal = Math.max(0, Math.floor(total) || 0)
  const pageCount = Math.ceil(safeTotal / size)
  const current = normalizePage(page, pageCount)

  return {
    start: safeTotal === 0 ? 0 : (current - 1) * size + 1,
    end: Math.min(current * size, safeTotal),
    total: safeTotal,
    page: current,
    pageCount,
    pageSize: size,
  }
}

/** The sort cycle of a sortable column: none → ascending → descending → none. */
export function nextTableSort<T>(current: SortState<T> | null, key: keyof T): SortState<T> | null {
  if (current?.key !== key) return { key, direction: 'asc' }
  if (current.direction === 'asc') return { key, direction: 'desc' }

  return null
}

/** A column's alignment: figures line up at the end unless told otherwise. */
export function tableColumnAlign<T>(column: TableColumn<T>): MTableAlign {
  return column.align ?? (column.numeric ? 'end' : 'start')
}

/** `aria-sort` of a sortable column header. */
export function tableAriaSort<T>(current: SortState<T> | null, key: keyof T): 'ascending' | 'descending' | 'none' {
  if (current?.key !== key || !current.direction) return 'none'

  return current.direction === 'asc' ? 'ascending' : 'descending'
}
