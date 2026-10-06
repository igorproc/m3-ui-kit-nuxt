export interface TableColumn<T> {
  key: keyof T
  label: string
  width?: string
  sortable?: boolean
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

export interface MTableProps<T extends TableData> {
  columns: TableColumn<T>[]
  data: T[]
  selectable?: boolean
  selectedRows?: T[]
  pagination?: boolean
  pageSize?: number
  totalItems?: number
  currentPage?: number
}

export interface MTableEmits<T extends TableData> {
  (e: 'update:selectedRows', rows: T[]): void
  (e: 'update:currentPage', page: number): void
}

export interface MTableHeaderProps<T extends TableData> {
  columns: TableColumn<T>[]
  selectable?: boolean
  isAllSelected?: boolean
  sort?: SortState<T> | null
}
