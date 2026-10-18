import { computed } from 'vue'
import type { Ref } from 'vue'
import { dayCount, dayRange, shiftDay } from './data/calendar'
import { formatShortDay, integer, money, percent, pluralize } from './data/format'
import type { OrderRow } from './data/model'

export type KpiTrend = 'up' | 'down' | 'flat'

export interface Kpi {
  id: 'revenue' | 'orders' | 'average' | 'returns'
  label: string
  value: string
  /** Signed change against the previous period, `null` when there is nothing to compare with. */
  delta: number | null
  trend: KpiTrend
  /** Whether the change is good news: more revenue is, more returns are not. */
  positive: boolean
  explanation: string
  series: number[]
  seriesLabel: string
}

export interface DayRevenue {
  day: string
  revenue: number
  orders: number
}

export interface TopProduct {
  id: string
  title: string
  units: number
  revenue: number
  share: number
}

interface PeriodTotals {
  revenue: number
  orders: number
  returns: number
}

const counted = (order: OrderRow) => order.status !== 'cancelled'
const inRange = (order: OrderRow, from: string, to: string) => {
  const day = order.createdAt.slice(0, 10)
  return day >= from && day <= to
}

function totals(orders: OrderRow[]): PeriodTotals {
  const valid = orders.filter(counted)
  return {
    revenue: valid.reduce((sum, order) => sum + order.total, 0),
    orders: orders.length,
    returns: orders.filter(order => order.hasReturn).length,
  }
}

const average = (period: PeriodTotals) => (period.orders ? period.revenue / period.orders : 0)
const change = (current: number, previous: number) => (previous ? (current - previous) / previous : null)
const trendOf = (delta: number | null): KpiTrend => (!delta ? 'flat' : delta > 0 ? 'up' : 'down')

/** Period figures, compared with the window of the same length right before it. */
export function useOrdersMetrics(orders: Ref<OrderRow[]>, period: { from: string, to: string }) {
  const previousPeriod = computed(() => {
    const length = dayCount(period.from, period.to)
    return { from: shiftDay(period.from, -length), to: shiftDay(period.from, -1) }
  })

  const current = computed(() => orders.value.filter(order => inRange(order, period.from, period.to)))
  const previous = computed(() => orders.value.filter(order => inRange(order, previousPeriod.value.from, previousPeriod.value.to)))

  const days = computed<DayRevenue[]>(() => {
    const byDay = new Map(dayRange(period.from, period.to).map(day => [day, { day, revenue: 0, orders: 0 }]))

    for (const order of current.value) {
      const entry = byDay.get(order.createdAt.slice(0, 10))
      if (!entry) continue
      entry.orders += 1
      if (counted(order)) entry.revenue += order.total
    }

    return [...byDay.values()]
  })

  const kpis = computed<Kpi[]>(() => {
    const now = totals(current.value)
    const before = totals(previous.value)
    const compared = `${formatShortDay(previousPeriod.value.from)} – ${formatShortDay(previousPeriod.value.to)}`
    const returnSeries = days.value.map(day => current.value.filter(order => order.hasReturn && order.createdAt.startsWith(day.day)).length)

    const kpi = (fields: Omit<Kpi, 'trend' | 'explanation'> & { previousText: string }): Kpi => {
      const { previousText, ...rest } = fields
      return {
        ...rest,
        trend: trendOf(fields.delta),
        explanation: `Сравнение с периодом ${compared}: было ${previousText}.`,
      }
    }

    const revenueDelta = change(now.revenue, before.revenue)
    const ordersDelta = change(now.orders, before.orders)
    const averageDelta = change(average(now), average(before))
    const returnsDelta = change(now.returns, before.returns)

    return [
      kpi({
        id: 'revenue',
        label: 'Выручка',
        value: money.format(now.revenue),
        delta: revenueDelta,
        positive: (revenueDelta ?? 0) >= 0,
        previousText: money.format(before.revenue),
        series: days.value.map(day => day.revenue),
        seriesLabel: 'Выручка по дням периода',
      }),
      kpi({
        id: 'orders',
        label: 'Заказы',
        value: integer.format(now.orders),
        delta: ordersDelta,
        positive: (ordersDelta ?? 0) >= 0,
        previousText: pluralize(before.orders, ['заказ', 'заказа', 'заказов']),
        series: days.value.map(day => day.orders),
        seriesLabel: 'Заказы по дням периода',
      }),
      kpi({
        id: 'average',
        label: 'Средний чек',
        value: money.format(average(now)),
        delta: averageDelta,
        positive: (averageDelta ?? 0) >= 0,
        previousText: money.format(average(before)),
        series: days.value.map(day => (day.orders ? day.revenue / day.orders : 0)),
        seriesLabel: 'Средний чек по дням периода',
      }),
      kpi({
        id: 'returns',
        label: 'Возвраты',
        value: integer.format(now.returns),
        delta: returnsDelta,
        positive: (returnsDelta ?? 0) <= 0,
        previousText: pluralize(before.returns, ['возврат', 'возврата', 'возвратов']),
        series: returnSeries,
        seriesLabel: 'Возвраты по дням периода',
      }),
    ]
  })

  const topProducts = computed<TopProduct[]>(() => {
    const byProduct = new Map<string, TopProduct>()
    let total = 0

    for (const order of current.value.filter(counted)) {
      for (const line of order.lines) {
        const entry = byProduct.get(line.productId) ?? { id: line.productId, title: line.title, units: 0, revenue: 0, share: 0 }
        entry.units += line.qty
        entry.revenue += line.qty * line.price
        total += line.qty * line.price
        byProduct.set(line.productId, entry)
      }
    }

    return [...byProduct.values()]
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5)
      .map(entry => ({ ...entry, share: total ? entry.revenue / total : 0 }))
  })

  const shareText = (product: TopProduct) => `${percent.format(product.share)} выручки`

  return { kpis, days, topProducts, previousPeriod, shareText }
}
