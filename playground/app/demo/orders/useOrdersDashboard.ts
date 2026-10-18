import { computed, inject, provide, ref, watch } from 'vue'
import type { InjectionKey } from 'vue'
import { NOW_TIME, TODAY, shiftDay } from './data/calendar'
import { formatShortDay, pluralize } from './data/format'
import { PRODUCTS, CUSTOMERS, createOrderRow } from './data/orders'
import type { ExportFormat, OrderRow, OrderRowAction, OrderStatus } from './data/model'
import type { NewOrderDraft } from './useNewOrderDraft'
import { useOrdersMetrics } from './useOrdersMetrics'
import { useOrdersQuery } from './useOrdersQuery'
import { useOrdersSource } from './useOrdersSource'
import { useUndoSnackbar } from './useUndoSnackbar'

export const HISTORY_FROM = shiftDay(TODAY, -59)

export const SECTIONS = [
  { id: 'overview', icon: 'ic:outline-dashboard', label: 'Обзор' },
  { id: 'orders', icon: 'ic:outline-receipt-long', label: 'Заказы' },
  { id: 'products', icon: 'ic:outline-inventory-2', label: 'Товары' },
  { id: 'customers', icon: 'ic:outline-people', label: 'Клиенты' },
  { id: 'analytics', icon: 'ic:outline-insights', label: 'Аналитика' },
] as const

const EXPORT_LABELS: Record<ExportFormat, string> = { csv: 'CSV', xlsx: 'Excel', pdf: 'PDF', email: 'письмо' }
const CLOSED: OrderStatus[] = ['cancelled', 'returned', 'delivered']

function createDashboard() {
  const source = useOrdersSource()
  const query = useOrdersQuery(source.orders)
  const metrics = useOrdersMetrics(source.orders, query.filters)
  const snackbar = useUndoSnackbar()

  const section = ref<string | null>('orders')
  const railExpanded = ref(false)
  const newOrderOpen = ref(false)
  const detailsOpen = ref(false)
  const detailsId = ref<string | null>(null)
  // Looked up live, so an action taken from the sheet shows in the sheet.
  const detailsOrder = computed(() => source.orders.value.find(order => order.id === detailsId.value) ?? null)

  const newOrdersCount = computed(() => source.orders.value.filter(order => order.status === 'new').length)
  const periodText = computed(() => `${formatShortDay(query.filters.from)} – ${formatShortDay(query.filters.to)}`)

  // The demo shows one section; the others only say so and hand the selection back.
  watch(section, (id) => {
    if (id === 'orders') return
    const target = SECTIONS.find(item => item.id === id)
    snackbar.show(`Раздел «${target?.label ?? ''}» в этом демо не показан`)
    section.value = 'orders'
  })

  function changeStatus(orders: OrderRow[], status: OrderStatus, message: string) {
    const previous = source.setStatus(orders.map(order => order.id), status)
    snackbar.show(message, () => source.restoreStatus(previous))
  }

  function openOrder(order: OrderRow) {
    detailsId.value = order.id
    detailsOpen.value = true
  }

  function runAction(action: OrderRowAction, order: OrderRow) {
    if (action === 'open') openOrder(order)
    else if (action === 'print') snackbar.show(`Накладная ${order.number} отправлена на печать`)
    else if (action === 'ship') changeStatus([order], 'shipped', `Заказ ${order.number} передан в доставку`)
    else if (action === 'cancel') changeStatus([order], 'cancelled', `Заказ ${order.number} отменён`)
    else changeStatus([order], 'returned', `По заказу ${order.number} оформлен возврат`)
  }

  const bulk = {
    ship() {
      // The selection holds the rows as they were when picked; read their status now.
      const picked = new Set(query.selected.value.map(order => order.id))
      const open = source.orders.value.filter(order => picked.has(order.id) && !CLOSED.includes(order.status) && order.status !== 'shipped')
      query.selected.value = []
      if (!open.length) {
        snackbar.show('Среди выбранных нет заказов, которые можно передать в доставку')
        return
      }
      changeStatus(open, 'shipped', `${pluralize(open.length, ['заказ передан', 'заказа переданы', 'заказов передано'])} в доставку`)
    },
    print() {
      snackbar.show(`На печать: ${pluralize(query.selected.value.length, ['накладная', 'накладные', 'накладных'])}`)
    },
    export(format: ExportFormat) {
      snackbar.show(`Экспорт: ${pluralize(query.selected.value.length, ['заказ', 'заказа', 'заказов'])}, формат — ${EXPORT_LABELS[format]}`)
    },
    clear() {
      query.selected.value = []
    },
  }

  function createOrder(draft: NewOrderDraft) {
    const customer = CUSTOMERS.find(item => item.id === draft.customerId)
    const product = PRODUCTS.find(item => item.id === draft.productId)
    if (!customer || !product) return

    const sequence = source.lastNumber.value + 1
    const order = createOrderRow({
      id: `ord-${sequence}`,
      sequence,
      createdAt: `${TODAY}T${NOW_TIME}`,
      customer: customer.label,
      customerId: customer.id,
      email: customer.email,
      status: 'new',
      delivery: 'courier',
      payment: draft.payment,
      urgent: false,
      hasReturn: false,
      lines: [{ id: `l-new-${sequence}`, productId: product.id, title: product.label, sku: product.sku, qty: draft.quantity ?? 1, price: product.price }],
    })

    source.addOrder(order)
    snackbar.show(`Заказ ${order.number} создан`, () => {
      source.removeOrder(order.id)
      // MTable keeps selected rows across pages and never prunes them: a deleted record is ours to drop.
      query.selected.value = query.selected.value.filter(selected => selected.id !== order.id)
    })
  }

  return {
    source,
    query,
    metrics,
    snackbar,
    section,
    railExpanded,
    newOrderOpen,
    detailsOpen,
    detailsOrder,
    newOrdersCount,
    periodText,
    openOrder,
    runAction,
    bulk,
    createOrder,
  }
}

export type OrdersDashboard = ReturnType<typeof createDashboard>

const DASHBOARD: InjectionKey<OrdersDashboard> = Symbol('orders-dashboard')

/** Creates the dashboard's state and hands it to every part below. */
export function provideOrdersDashboard(): OrdersDashboard {
  const dashboard = createDashboard()
  provide(DASHBOARD, dashboard)
  return dashboard
}

export function useOrdersDashboard(): OrdersDashboard {
  const dashboard = inject(DASHBOARD)
  if (!dashboard) throw new Error('useOrdersDashboard() needs provideOrdersDashboard() above it')
  return dashboard
}
