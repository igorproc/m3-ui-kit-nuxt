import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { Component } from 'vue'
import MTable from '../index.vue'
import type { TableColumn } from '../types'

export interface Row {
  id: number
  name: string
  amount: number
  [key: string]: unknown
}

export const columns: TableColumn<Row>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'amount', label: 'Amount', numeric: true, sortable: true },
]

export const rows: Row[] = [
  { id: 1, name: 'Ann', amount: 30 },
  { id: 2, name: 'Bob', amount: 1250.5 },
  { id: 3, name: 'Cid', amount: 4 },
]

export type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

/** Mounts `MTable` with the shared columns and rows; `props` override them. */
export function mountTable(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}): Promise<Wrapper> {
  return mountSuspended(MTable as Component, {
    props: { columns, data: rows, ...props },
    ...options,
  }) as Promise<Wrapper>
}
