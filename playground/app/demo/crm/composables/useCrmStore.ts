import { computed, inject, markRaw, provide, reactive, ref, shallowRef } from 'vue'
import type { InjectionKey } from 'vue'
import { CRM_TODAY, addDays, formatShortDate } from '../data/crmFormat'
import { companyName, findOwner, matchesDeal } from '../data/crmLookup'
import { CRM_SEED_DEALS, CRM_SEED_NOTIFICATIONS, CRM_SEED_TASKS, seedActivity } from '../data/crmSeed'
import { stageLabel } from '../data/crmTypes'
import type { CrmActivity, CrmDeal, CrmDealStatus, CrmPeriod, CrmTab, CrmTagId } from '../data/crmTypes'
import { useCrmSnackbar } from './useCrmSnackbar'

export interface CrmFilters {
  query: string
  owners: string[]
  tags: CrmTagId[]
  period: CrmPeriod
}

type ActivityNote = Pick<CrmActivity, 'title' | 'text' | 'icon' | 'color' | 'status'>

/**
 * The dashboard's shared state and every mutation of it. Tree-local, so it is
 * provided by the dashboard root rather than kept in `useState`.
 */
export function createCrmStore() {
  const deals = ref<CrmDeal[]>(CRM_SEED_DEALS.map(deal => ({ ...deal, tags: [...deal.tags] })))
  const tasks = ref(CRM_SEED_TASKS.map(task => ({ ...task })))
  const notifications = ref(CRM_SEED_NOTIFICATIONS.map(notification => ({ ...notification })))
  const sessionActivity = ref<CrmActivity[]>([])
  const files = shallowRef<Record<string, File[]>>({})

  const filters = reactive<CrmFilters>({ query: '', owners: [], tags: [], period: 'month' })
  const tab = ref<CrmTab>('funnel')
  const sheetDealId = ref<string | null>(null)
  const sheetOpen = ref(false)
  const newDealOpen = ref(false)
  const snackbar = useCrmSnackbar()

  const visibleDeals = computed(() => deals.value.filter(deal => matchesDeal(deal, filters)))
  const hasFilters = computed(() => Boolean(filters.query.trim() || filters.owners.length || filters.tags.length))
  const sheetDeal = computed(() => deals.value.find(deal => deal.id === sheetDealId.value) ?? null)
  const unreadCount = computed(() => notifications.value.filter(notification => !notification.read).length)
  const overdueTasks = computed(() => tasks.value.filter(task => !task.done && task.due < CRM_TODAY))

  const findDeal = (id: string) => deals.value.find(deal => deal.id === id)

  function log(dealId: string, note: ActivityNote) {
    sessionActivity.value = [
      { id: `${dealId}-session-${sessionActivity.value.length + 1}`, dealId, at: CRM_TODAY, ...note },
      ...sessionActivity.value,
    ]
  }

  function activityFor(dealId: string): CrmActivity[] {
    const deal = findDeal(dealId)
    const own = sessionActivity.value.filter(event => event.dealId === dealId)
    return deal ? [...own, ...seedActivity(deal)] : own
  }

  function updateDeal(id: string, patch: Partial<CrmDeal>, note?: ActivityNote) {
    deals.value = deals.value.map(deal => (deal.id === id ? { ...deal, ...patch } : deal))
    if (note) log(id, note)
  }

  function openDeal(id: string) {
    sheetDealId.value = id
    sheetOpen.value = true
  }

  function moveDeal(id: string, status: CrmDealStatus) {
    const deal = findDeal(id)
    if (!deal || deal.status === status) return

    const previous = { status: deal.status, stageSince: deal.stageSince }
    updateDeal(id, { status, stageSince: CRM_TODAY }, {
      title: `Этап: ${stageLabel(status)}`,
      text: `Перемещена из этапа «${stageLabel(deal.status)}»`,
      icon: 'outline-swap-horiz',
      color: status === 'lost' ? 'error' : 'primary',
      status: 'Изменение',
    })
    snackbar.show(`«${deal.title}» → ${stageLabel(status)}`, () => updateDeal(id, previous))
  }

  function reassign(ids: readonly string[], ownerId: string) {
    const previous = new Map(deals.value.filter(deal => ids.includes(deal.id)).map(deal => [deal.id, deal.ownerId]))
    deals.value = deals.value.map(deal => (previous.has(deal.id) ? { ...deal, ownerId } : deal))

    snackbar.show(`Ответственный изменён: ${findOwner(ownerId).name}, сделок — ${previous.size}`, () => {
      deals.value = deals.value.map(deal => ({ ...deal, ownerId: previous.get(deal.id) ?? deal.ownerId }))
    })
  }

  function addDeal(deal: CrmDeal) {
    deals.value = [deal, ...deals.value]
    log(deal.id, { title: 'Сделка создана', text: `Компания: ${companyName(deal.companyId)}`, icon: 'outline-flag', color: 'secondary', status: 'Событие' })
    snackbar.show(`Сделка «${deal.title}» создана`, () => {
      deals.value = deals.value.filter(item => item.id !== deal.id)
    })
  }

  function nextDealId(): string {
    const max = deals.value.reduce((top, deal) => Math.max(top, Number(deal.id.slice(2)) || 0), 1000)
    return `D-${max + 1}`
  }

  function toggleTask(id: string) {
    tasks.value = tasks.value.map(task => (task.id === id ? { ...task, done: !task.done } : task))
  }

  function postponeTask(id: string) {
    const task = tasks.value.find(item => item.id === id)
    if (!task) return

    const due = addDays(task.due < CRM_TODAY ? CRM_TODAY : task.due, 1)
    tasks.value = tasks.value.map(item => (item.id === id ? { ...item, due } : item))
    snackbar.show(`«${task.title}» перенесена на ${formatShortDate(due)}`, () => {
      tasks.value = tasks.value.map(item => (item.id === id ? { ...item, due: task.due } : item))
    })
  }

  function markRead(id: string) {
    notifications.value = notifications.value.map(item => (item.id === id ? { ...item, read: true } : item))
  }

  function markAllRead() {
    notifications.value = notifications.value.map(item => ({ ...item, read: true }))
  }

  function setFiles(dealId: string, list: File[]) {
    files.value = { ...files.value, [dealId]: list.map(file => markRaw(file)) }
  }

  function toggleTag(tag: CrmTagId) {
    filters.tags = filters.tags.includes(tag) ? filters.tags.filter(item => item !== tag) : [...filters.tags, tag]
  }

  function resetFilters() {
    filters.query = ''
    filters.owners = []
    filters.tags = []
  }

  return {
    deals,
    tasks,
    notifications,
    files,
    filters,
    tab,
    sheetDealId,
    sheetOpen,
    newDealOpen,
    snackbar,
    visibleDeals,
    hasFilters,
    sheetDeal,
    unreadCount,
    overdueTasks,
    activityFor,
    updateDeal,
    openDeal,
    moveDeal,
    reassign,
    addDeal,
    nextDealId,
    toggleTask,
    postponeTask,
    markRead,
    markAllRead,
    setFiles,
    toggleTag,
    resetFilters,
  }
}

export type CrmStore = ReturnType<typeof createCrmStore>

const CRM_STORE_KEY: InjectionKey<CrmStore> = Symbol('crm-store')

export function provideCrmStore(): CrmStore {
  const store = createCrmStore()
  provide(CRM_STORE_KEY, store)
  return store
}

export function useCrmStore(): CrmStore {
  const store = inject(CRM_STORE_KEY, null)
  if (!store) throw new Error('[crm demo] useCrmStore() needs the dashboard root above it.')
  return store
}
