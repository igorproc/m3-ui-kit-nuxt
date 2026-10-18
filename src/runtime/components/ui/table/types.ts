/**
 * Public types of `<MTable>`. The component is generic over the row type, so
 * its props are a type (`defineProps<MTableProps<T>>()`), declared here so they
 * reach the published declarations.
 */
import type { MFieldDensity } from '#kit/components/ui/text-field/props'

/** Row height step: 40 / 52 / 64, the header 4 taller. */
export type MTableDensity = MFieldDensity

/** Where a column's cells and header sit. */
export type MTableAlign = 'start' | 'center' | 'end'

export interface TableColumn<T> {
  key: keyof T
  label: string
  /**
   * Preferred width. Long values wrap anywhere, so a width also caps how wide
   * a long unbroken value can push the column.
   */
  width?: string
  /** Narrowest the column gets; below it the table scrolls instead. */
  minWidth?: string
  sortable?: boolean
  /** Alignment of the cells and the header; `numeric` columns default to `end`. */
  align?: MTableAlign
  /** Figures: tabular digits that line up, end-aligned, never wrapped. */
  numeric?: boolean
  /** Turns the cell value into its text, e.g. `value => money.format(value)`. */
  format?: (value: T[keyof T], row: T) => string
}

export type SortDirection = 'asc' | 'desc' | null

export interface SortState<T> {
  key: keyof T | null
  direction: SortDirection
}

export interface TableData {
  id: string | number
  [key: string]: unknown
}

/** Numbers of the page the footer shows, for the `pagination-info` slot. */
export interface MTablePageRange {
  /** 1-based position of the first row on the page; 0 when there are none. */
  start: number
  /** 1-based position of the last row on the page. */
  end: number
  total: number
  page: number
  pageCount: number
  pageSize: number
}

export interface MTableProps<T extends TableData> {
  columns: TableColumn<T>[]
  data: T[]
  /** Visible caption that names the table; `aria-label` names it without one. */
  caption?: string
  /** Row height step. */
  density?: MTableDensity
  selectable?: boolean
  /**
   * Selected rows, across pages: a row stays selected while another page is
   * shown, and only the current page's rows are rendered. Select-all acts on
   * the current page. The table never drops a row by itself.
   */
  selectedRows?: T[]
  /**
   * Accessible name of the select-all checkbox. Row checkboxes are named by
   * their row's first cell. The kit ships no wording of its own.
   */
  selectAllLabel?: string
  /**
   * Data is on its way: in place of the rows while there are none, over the
   * rows while they stay. Also blocks the footer's navigation.
   */
  loading?: boolean
  /**
   * Loading failed. Shown in place of the rows, or after the rows that did
   * load; a string is shown and announced as the message.
   */
  error?: boolean | string
  /**
   * Announced politely whenever it changes — the page, the sort, an empty
   * result — in the app's own words.
   */
  statusText?: string
  pagination?: boolean
  pageSize?: number
  /** Page sizes offered in the footer; the selector appears when given. */
  pageSizeOptions?: number[]
  totalItems?: number
  currentPage?: number
  /** Visible label of the page size selector. */
  pageSizeLabel?: string
  /** Accessible name of the previous-page button. */
  previousPageLabel?: string
  /** Accessible name of the next-page button. */
  nextPageLabel?: string
}

export interface MTableEmits<T extends TableData> {
  (e: 'update:selectedRows', rows: T[]): void
  /** The page, or the page size, the footer asks for. */
  (e: 'update:currentPage' | 'update:pageSize', value: number): void
  /** A pointer click on a row outside its controls. Keyboard users reach the same action through a link or button in a cell. */
  (e: 'row-click', row: T, event: MouseEvent): void
  /** The `retry` of the `error` slot was called. */
  (e: 'retry'): void
}

export interface MTableHeaderProps<T extends TableData> {
  columns: TableColumn<T>[]
  selectable?: boolean
  isAllSelected?: boolean
  selectAllLabel?: string
  sort?: SortState<T> | null
}

/** Payload of the `error` slot. */
export interface MTableErrorSlot {
  error: boolean | string
  retry: () => void
}
