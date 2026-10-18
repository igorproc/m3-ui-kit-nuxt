export type OrderStatus = 'new' | 'paid' | 'assembling' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
export type OrderDelivery = 'courier' | 'pickup' | 'post'
export type OrderFlag = 'urgent' | 'return' | 'pickup'
export type PaymentMethod = 'card' | 'cash' | 'invoice'
export type OrderRowAction = 'open' | 'print' | 'ship' | 'cancel' | 'return'
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'email'
export type FabAction = 'order' | 'return' | 'import'

export interface Customer {
  id: string
  label: string
  email: string
  city: string
}

export interface Product {
  id: string
  label: string
  sku: string
  price: number
}

export interface OrderLine {
  id: string
  productId: string
  title: string
  sku: string
  qty: number
  price: number
}

/**
 * One row of the orders table. A type alias rather than an interface: MTable's
 * `TableData` carries a string index signature, which an interface does not
 * satisfy (`Index signature for type 'string' is missing`).
 */
export type OrderRow = {
  id: string
  number: string
  /** Shop-local timestamp, `YYYY-MM-DDTHH:mm`. */
  createdAt: string
  customer: string
  customerId: string
  email: string
  status: OrderStatus
  delivery: OrderDelivery
  payment: PaymentMethod
  items: number
  total: number
  urgent: boolean
  hasReturn: boolean
  lines: OrderLine[]
  /** MTable binds every column to a row key, so the actions column needs one too: it holds the menu's name. */
  actions: string
}

export interface StatusMeta {
  label: string
  icon: string
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  new: { label: 'Новый', icon: 'ic:outline-new-releases' },
  paid: { label: 'Оплачен', icon: 'ic:outline-payments' },
  assembling: { label: 'Сборка', icon: 'ic:outline-inventory-2' },
  shipped: { label: 'В доставке', icon: 'ic:outline-local-shipping' },
  delivered: { label: 'Доставлен', icon: 'ic:outline-check-circle' },
  cancelled: { label: 'Отменён', icon: 'ic:outline-cancel' },
  returned: { label: 'Возврат', icon: 'ic:outline-assignment-return' },
}

export const STATUS_ORDER: OrderStatus[] = ['new', 'paid', 'assembling', 'shipped', 'delivered', 'cancelled', 'returned']

export const DELIVERY_LABELS: Record<OrderDelivery, string> = {
  courier: 'Курьер',
  pickup: 'Самовывоз',
  post: 'Почта',
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: 'Картой онлайн',
  cash: 'Наличными при получении',
  invoice: 'По счёту для юрлиц',
}

export const FLAG_LABELS: Record<OrderFlag, string> = {
  urgent: 'Срочные',
  return: 'С возвратом',
  pickup: 'Самовывоз',
}

export const FLAG_ORDER: OrderFlag[] = ['urgent', 'return', 'pickup']
