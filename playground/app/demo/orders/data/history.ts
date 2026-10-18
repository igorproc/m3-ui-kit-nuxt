import type { MColor } from '#kit/shared/types/props'
import { formatDateTime, money, pluralize } from './format'
import { DELIVERY_LABELS, PAYMENT_LABELS } from './model'
import type { OrderRow, OrderStatus } from './model'

export interface OrderEvent {
  id: string
  title: string
  text: string
  /** `YYYY-MM-DDTHH:mm`, shop-local. */
  stamp: string
  time: string
  icon: string
  color: MColor
  /** Outcome word read before the title by assistive technology. */
  outcome: string
}

const HOUR_MS = 3_600_000

function addHours(stamp: string, hours: number): string {
  return new Date(Date.parse(`${stamp}:00Z`) + hours * HOUR_MS).toISOString().slice(0, 16)
}

const PAID: OrderStatus[] = ['paid', 'assembling', 'shipped', 'delivered', 'returned']
const ASSEMBLED: OrderStatus[] = ['assembling', 'shipped', 'delivered', 'returned']
const SHIPPED: OrderStatus[] = ['shipped', 'delivered', 'returned']
const DELIVERED: OrderStatus[] = ['delivered', 'returned']

/** The history an order of this status has been through, oldest first. Derived, so it never disagrees with the row. */
export function orderHistory(order: OrderRow): OrderEvent[] {
  const event = (id: string, hours: number, rest: Omit<OrderEvent, 'id' | 'stamp' | 'time'>): OrderEvent => {
    const stamp = addHours(order.createdAt, hours)
    return { id: `${order.id}-${id}`, stamp, time: formatDateTime(stamp), ...rest }
  }

  const events: OrderEvent[] = [
    event('created', 0, {
      title: 'Заказ создан',
      text: `${pluralize(order.items, ['товар', 'товара', 'товаров'])} на ${money.format(order.total)}`,
      icon: 'ic:outline-receipt-long',
      color: 'primary',
      outcome: 'Выполнено',
    }),
  ]

  if (order.status === 'cancelled') {
    events.push(event('cancelled', 2, {
      title: 'Заказ отменён',
      text: 'Покупатель отказался до оплаты',
      icon: 'ic:outline-cancel',
      color: 'error',
      outcome: 'Отменено',
    }))
    return events
  }

  if (PAID.includes(order.status)) {
    events.push(event('paid', 1, { title: 'Оплата получена', text: PAYMENT_LABELS[order.payment], icon: 'ic:outline-payments', color: 'primary', outcome: 'Выполнено' }))
  }
  if (ASSEMBLED.includes(order.status)) {
    events.push(event('assembled', 20, { title: 'Заказ собран', text: 'Склад «Южный», упаковка без пластика', icon: 'ic:outline-inventory-2', color: 'secondary', outcome: 'Выполнено' }))
  }
  if (SHIPPED.includes(order.status)) {
    events.push(event('shipped', 28, { title: 'Передан в доставку', text: DELIVERY_LABELS[order.delivery], icon: 'ic:outline-local-shipping', color: 'secondary', outcome: 'Выполнено' }))
  }
  if (DELIVERED.includes(order.status)) {
    events.push(event('delivered', 76, { title: 'Доставлен', text: 'Получен покупателем', icon: 'ic:outline-check-circle', color: 'tertiary', outcome: 'Выполнено' }))
  }
  if (order.status === 'returned') {
    events.push(event('returned', 150, { title: 'Оформлен возврат', text: 'Товар не подошёл, деньги вернутся за 3 дня', icon: 'ic:outline-assignment-return', color: 'error', outcome: 'Возврат' }))
  }

  return events
}
