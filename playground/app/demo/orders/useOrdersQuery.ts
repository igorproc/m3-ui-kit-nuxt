import { computed, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { SortState } from '#kit/components/ui/table/types'
import { TODAY, shiftDay } from './data/calendar'
import { pluralize } from './data/format'
import type { OrderFlag, OrderRow, OrderStatus } from './data/model'

export interface OrdersFilters {
  from: string
  to: string
  statuses: OrderStatus[]
  flags: OrderFlag[]
  query: string
}

export const DEFAULT_PERIOD_DAYS = 7

export function defaultFilters(): OrdersFilters {
  return { from: shiftDay(TODAY, 1 - DEFAULT_PERIOD_DAYS), to: TODAY, statuses: [], flags: [], query: '' }
}

const SORT_NAMES: Partial<Record<keyof OrderRow, string>> = {
  number: 'номеру',
  createdAt: 'дате',
  customer: 'покупателю',
  items: 'количеству товаров',
  total: 'сумме',
}

function matchesFlags(order: OrderRow, flags: OrderFlag[]): boolean {
  return flags.every((flag) => {
    if (flag === 'urgent') return order.urgent
    if (flag === 'return') return order.hasReturn
    return order.delivery === 'pickup'
  })
}

function matchesQuery(order: OrderRow, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('ru-RU')
  if (!needle) return true

  return [order.number, order.customer, order.email].some(field => field.toLocaleLowerCase('ru-RU').includes(needle))
}

function compareBy(key: keyof OrderRow) {
  return (left: OrderRow, right: OrderRow) => {
    const a = left[key]
    const b = right[key]
    if (typeof a === 'number' && typeof b === 'number') return a - b
    return String(a).localeCompare(String(b), 'ru-RU', { numeric: true })
  }
}

/**
 * Filtering, sorting and paging of the orders table — all on the client, since
 * MTable renders exactly the rows it is given.
 */
export function useOrdersQuery(orders: Ref<OrderRow[]>) {
  const filters = reactive<OrdersFilters>(defaultFilters())
  const sort = ref<SortState<OrderRow> | null>({ key: 'createdAt', direction: 'desc' })
  const page = ref(1)
  const pageSize = ref(10)
  const selected = ref<OrderRow[]>([])

  const filtered = computed(() => orders.value.filter((order) => {
    const day = order.createdAt.slice(0, 10)
    if (day < filters.from || day > filters.to) return false
    if (filters.statuses.length && !filters.statuses.includes(order.status)) return false
    return matchesFlags(order, filters.flags) && matchesQuery(order, filters.query)
  }))

  const sorted = computed(() => {
    const { key, direction } = sort.value ?? {}
    if (!key || !direction) return filtered.value

    const compare = compareBy(key)
    const factor = direction === 'asc' ? 1 : -1
    return [...filtered.value].sort((left, right) => compare(left, right) * factor)
  })

  const pageRows = computed(() => sorted.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

  // A new question starts from its first page.
  watch([filters, sort], () => {
    page.value = 1
  }, { deep: true })

  const isFiltered = computed(() => {
    const initial = defaultFilters()
    return filters.from !== initial.from
      || filters.to !== initial.to
      || filters.statuses.length > 0
      || filters.flags.length > 0
      || filters.query.trim() !== ''
  })

  function resetFilters() {
    Object.assign(filters, defaultFilters())
  }

  function showOnlyStatus(status: OrderStatus) {
    filters.statuses = [status]
  }

  const statusText = computed(() => {
    const found = pluralize(filtered.value.length, ['заказ', 'заказа', 'заказов'])
    const pageCount = Math.max(1, Math.ceil(filtered.value.length / pageSize.value))
    const sortName = sort.value?.key ? SORT_NAMES[sort.value.key] : undefined
    const sortPart = sortName ? `, сортировка по ${sortName}${sort.value?.direction === 'desc' ? ' по убыванию' : ''}` : ''
    return `Найдено ${found}. Страница ${page.value} из ${pageCount}${sortPart}.`
  })

  return { filters, sort, page, pageSize, selected, filtered, pageRows, isFiltered, statusText, resetFilters, showOnlyStatus }
}

export type OrdersQuery = ReturnType<typeof useOrdersQuery>
