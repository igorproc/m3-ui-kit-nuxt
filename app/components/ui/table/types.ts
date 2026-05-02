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
  [key: string]: any
}
