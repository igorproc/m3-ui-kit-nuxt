import { computed, ref, shallowRef } from 'vue'
import { LAST_ORDER_NUMBER, ORDERS } from './data/orders'
import type { OrderRow, OrderStatus } from './data/model'

const LOAD_DELAY_MS = 900

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    }, { once: true })
  })
}

/**
 * The orders "backend": a simulated request (client-only, so the page shows the
 * kit's loading state), a switch that makes the next request fail, and local
 * edits — new orders and status changes — layered over what was loaded.
 */
export function useOrdersSource() {
  const failNextLoad = ref(false)
  const created = shallowRef<OrderRow[]>([])
  const statusOverrides = ref<Record<string, OrderStatus>>({})

  const { data, status, refresh } = useLazyAsyncData('demo-orders-list', async (_nuxtApp, { signal }) => {
    await wait(LOAD_DELAY_MS, signal)

    if (failNextLoad.value) {
      failNextLoad.value = false
      throw new Error('Gateway timeout')
    }

    return ORDERS
  }, { server: false, default: () => [] as OrderRow[] })

  const orders = computed<OrderRow[]>(() => [...created.value, ...data.value].map((order) => {
    const override = statusOverrides.value[order.id]
    return override ? { ...order, status: override } : order
  }))

  // `idle` counts as loading: with `server: false` the request starts only after
  // hydration, and an idle table would otherwise flash its empty state first.
  const loading = computed(() => status.value === 'idle' || status.value === 'pending')
  const errorText = computed(() => (status.value === 'error' ? 'Не удалось загрузить заказы: сервер не ответил вовремя.' : false))

  function reload() {
    return refresh()
  }

  /** Changes the status of the given orders; returns what to restore on undo. */
  function setStatus(ids: string[], next: OrderStatus): Record<string, OrderStatus | undefined> {
    const previous: Record<string, OrderStatus | undefined> = {}
    const overrides = { ...statusOverrides.value }

    for (const id of ids) {
      previous[id] = overrides[id]
      overrides[id] = next
    }

    statusOverrides.value = overrides
    return previous
  }

  function restoreStatus(previous: Record<string, OrderStatus | undefined>) {
    const merged = { ...statusOverrides.value, ...previous }
    statusOverrides.value = Object.fromEntries(
      Object.entries(merged).filter((entry): entry is [string, OrderStatus] => entry[1] !== undefined),
    )
  }

  function addOrder(order: OrderRow) {
    created.value = [order, ...created.value]
  }

  function removeOrder(id: string) {
    created.value = created.value.filter(order => order.id !== id)
  }

  const lastNumber = computed(() => orders.value.reduce((max, order) => Math.max(max, Number(order.id.slice(4))), LAST_ORDER_NUMBER))

  return { orders, loading, errorText, failNextLoad, lastNumber, reload, setStatus, restoreStatus, addOrder, removeOrder }
}

export type OrdersSource = ReturnType<typeof useOrdersSource>
