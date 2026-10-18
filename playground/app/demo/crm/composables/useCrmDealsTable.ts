import { computed, ref, watch } from 'vue'
import type { SortState, TableColumn } from '#kit/components/ui/table/types'
import { formatMoney, formatPercent, formatShortDate } from '../data/crmFormat'
import { companyName, findOwner } from '../data/crmLookup'
import { CRM_STAGES, stageLabel } from '../data/crmTypes'
import type { CrmDeal, CrmDealStatus } from '../data/crmTypes'
import { useCrmFakeRequest } from './useCrmFakeRequest'
import type { CrmStore } from './useCrmStore'

/** A type alias, not an interface: `MTable` rows need an implicit index signature. */
export type CrmDealRow = {
  id: string
  title: string
  company: string
  owner: string
  ownerId: string
  stage: string
  status: CrmDealStatus
  amount: number
  probability: number
  closeDate: string
}

export const CRM_PAGE_SIZES = [5, 10, 20] as const

// `format` receives the union of every field's type, not the column's own.
export const CRM_DEAL_COLUMNS: TableColumn<CrmDealRow>[] = [
  { key: 'title', label: 'Сделка', sortable: true, minWidth: '200rem' },
  { key: 'company', label: 'Компания', sortable: true, minWidth: '150rem' },
  { key: 'owner', label: 'Ответственный', minWidth: '190rem' },
  { key: 'stage', label: 'Этап', sortable: true, minWidth: '130rem' },
  { key: 'amount', label: 'Сумма', numeric: true, sortable: true, format: value => formatMoney(Number(value)) },
  { key: 'probability', label: 'Вероятность', numeric: true, sortable: true, format: value => formatPercent(Number(value)) },
  { key: 'closeDate', label: 'Закрытие', sortable: true, minWidth: '110rem', format: value => formatShortDate(String(value)) },
]

const SORT_LABELS: Partial<Record<keyof CrmDealRow, string>> = {
  title: 'названию',
  company: 'компании',
  stage: 'этапу',
  amount: 'сумме',
  probability: 'вероятности',
  closeDate: 'дате закрытия',
}

const stageOrder = (status: CrmDealStatus) => {
  const index = CRM_STAGES.findIndex(stage => stage.id === status)
  return index < 0 ? CRM_STAGES.length : index
}

function toRow(deal: CrmDeal): CrmDealRow {
  return {
    id: deal.id,
    title: deal.title,
    company: companyName(deal.companyId),
    owner: findOwner(deal.ownerId).name,
    ownerId: deal.ownerId,
    stage: stageLabel(deal.status),
    status: deal.status,
    amount: deal.amount,
    probability: deal.probability,
    closeDate: deal.closeDate,
  }
}

function compareRows(left: CrmDealRow, right: CrmDealRow, key: keyof CrmDealRow): number {
  if (key === 'stage') return stageOrder(left.status) - stageOrder(right.status)
  const a = left[key]
  const b = right[key]
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'ru-RU')
}

/**
 * The «Сделки» tab: the table only renders rows, so sorting and paging happen
 * here and the public `MPagination` drives the page.
 */
export function useCrmDealsTable(store: CrmStore) {
  const sort = ref<SortState<CrmDealRow> | null>(null)
  const page = ref(1)
  const pageSize = ref<number>(10)
  const selected = ref<CrmDealRow[]>([])
  const request = useCrmFakeRequest()

  const rows = computed(() => store.visibleDeals.value.map(toRow))

  const sortedRows = computed(() => {
    const state = sort.value
    if (!state?.key || !state.direction) return rows.value
    const key = state.key
    const sign = state.direction === 'asc' ? 1 : -1
    return [...rows.value].sort((left, right) => sign * compareRows(left, right, key))
  })

  const total = computed(() => sortedRows.value.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const pageRows = computed(() => sortedRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

  const range = computed(() => {
    const start = total.value ? (page.value - 1) * pageSize.value + 1 : 0
    return { start, end: Math.min(page.value * pageSize.value, total.value), total: total.value }
  })

  const sortText = computed(() => {
    const state = sort.value
    if (!state?.key || !state.direction) return ''
    const by = SORT_LABELS[state.key] ?? String(state.key)
    return `, сортировка по ${by} ${state.direction === 'asc' ? 'по возрастанию' : 'по убыванию'}`
  })

  // The table announces `statusText` instead of the error once both are set,
  // so the failure has to be part of it.
  const statusText = computed(() => {
    if (request.loading.value) return 'Загрузка сделок…'
    if (request.error.value) return request.error.value
    if (!total.value) return 'Сделки не найдены'
    return `Страница ${page.value} из ${pageCount.value}, сделок: ${total.value}${sortText.value}`
  })

  // A new filter or sort starts from the first page, the way a new query does.
  watch(() => [store.filters.query, store.filters.owners, store.filters.tags, sort.value], () => {
    page.value = 1
  }, { deep: true })

  // The table keeps selected rows that a filter hides; this demo prunes them,
  // so a bulk action never reaches a row the user cannot see.
  watch(rows, (current) => {
    const visible = new Set(current.map(row => row.id))
    const kept = selected.value.filter(row => visible.has(row.id))
    if (kept.length !== selected.value.length) selected.value = kept
  })

  watch([page, sort], () => request.load())

  function setPageSize(size: number) {
    pageSize.value = size
    page.value = 1
    request.load()
  }

  function reassignSelected(ownerId: string) {
    store.reassign(selected.value.map(row => row.id), ownerId)
    selected.value = []
  }

  return {
    columns: CRM_DEAL_COLUMNS,
    sort,
    page,
    pageSize,
    pageCount,
    pageRows,
    range,
    selected,
    statusText,
    loading: request.loading,
    error: request.error,
    refresh: request.refresh,
    retry: request.retry,
    setPageSize,
    reassignSelected,
  }
}
