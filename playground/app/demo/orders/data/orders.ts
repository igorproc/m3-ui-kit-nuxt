import { TODAY, shiftDay } from './calendar'
import type { Customer, OrderDelivery, OrderLine, OrderRow, OrderStatus, PaymentMethod, Product } from './model'

export const CUSTOMERS: Customer[] = [
  { id: 'c01', label: 'Анна Смирнова', email: 'anna.smirnova@mail.ru', city: 'Москва' },
  { id: 'c02', label: 'Игорь Волков', email: 'volkov.i@yandex.ru', city: 'Санкт-Петербург' },
  { id: 'c03', label: 'Мария Кузнецова', email: 'm.kuznetsova@gmail.com', city: 'Казань' },
  { id: 'c04', label: 'Дмитрий Орлов', email: 'orlov.d@inbox.ru', city: 'Екатеринбург' },
  { id: 'c05', label: 'Елена Соколова', email: 'sokolova.elena@mail.ru', city: 'Новосибирск' },
  { id: 'c06', label: 'Алексей Морозов', email: 'a.morozov@yandex.ru', city: 'Москва' },
  { id: 'c07', label: 'Ольга Новикова', email: 'novikova.o@gmail.com', city: 'Самара' },
  { id: 'c08', label: 'Сергей Лебедев', email: 'lebedev.s@mail.ru', city: 'Пермь' },
  { id: 'c09', label: 'Татьяна Козлова', email: 'kozlova.t@yandex.ru', city: 'Воронеж' },
  { id: 'c10', label: 'ООО «Северный ветер»', email: 'zakupki@sever-veter.ru', city: 'Мурманск' },
  { id: 'c11', label: 'Наталья Павлова', email: 'pavlova.n@inbox.ru', city: 'Краснодар' },
  { id: 'c12', label: 'Константин Фёдоров-Белозерский', email: 'k.fedorov-belozersky@gmail.com', city: 'Москва' },
  { id: 'c13', label: 'Юлия Андреева', email: 'andreeva.yu@mail.ru', city: 'Тула' },
  { id: 'c14', label: 'ИП Захаров А. В.', email: 'zakharov.av@yandex.ru', city: 'Ярославль' },
  { id: 'c15', label: 'Виктория Белова', email: 'belova.v@gmail.com', city: 'Сочи' },
  { id: 'c16', label: 'Павел Григорьев', email: 'grigoriev.p@inbox.ru', city: 'Омск' },
]

export const PRODUCTS: Product[] = [
  { id: 'p01', label: 'Кофемашина Aroma Pro', sku: 'KM-AR-210', price: 38990 },
  { id: 'p02', label: 'Чайник стеклянный 1,7 л', sku: 'CH-GL-17', price: 3490 },
  { id: 'p03', label: 'Блендер погружной', sku: 'BL-PG-800', price: 5990 },
  { id: 'p04', label: 'Пылесос беспроводной V9', sku: 'PS-V9-BL', price: 27490 },
  { id: 'p05', label: 'Утюг с парогенератором', sku: 'UT-PG-24', price: 12990 },
  { id: 'p06', label: 'Набор ножей, 6 предметов', sku: 'NZ-SET-6', price: 7490 },
  { id: 'p07', label: 'Сковорода 28 см, антипригарная', sku: 'SK-28-AP', price: 2890 },
  { id: 'p08', label: 'Мультиварка 5 л', sku: 'MV-5L-WH', price: 8990 },
  { id: 'p09', label: 'Весы кухонные', sku: 'VS-KH-01', price: 1490 },
  { id: 'p10', label: 'Тостер на 2 ломтика', sku: 'TS-2-RD', price: 3290 },
  { id: 'p11', label: 'Очиститель воздуха Clean Air', sku: 'OV-CA-40', price: 19990 },
  { id: 'p12', label: 'Кабель USB-C — USB-C, 2 м, плетёный', sku: 'KB-USB-C-C-2M-BRAIDED', price: 990 },
]

const DELIVERY_FEE: Record<OrderDelivery, number> = { courier: 390, pickup: 0, post: 290 }

/** Seeded PRNG (mulberry32): the same orders on the server and in the browser. */
function createRandom(seed: number) {
  let state = seed

  return () => {
    state = (state + 0x6D2B79F5) | 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

/** Fresh orders are still being processed, old ones have arrived — or come back. */
function statusForAge(age: number, roll: number): OrderStatus {
  if (roll < 0.05) return 'cancelled'
  if (age === 0) return roll < 0.6 ? 'new' : 'paid'
  if (age <= 2) return roll < 0.35 ? 'paid' : 'assembling'
  if (age <= 5) return roll < 0.45 ? 'assembling' : 'shipped'
  if (roll < 0.11) return 'returned'
  return roll < 0.3 ? 'shipped' : 'delivered'
}

export function orderTotal(lines: OrderLine[], delivery: OrderDelivery): number {
  return lines.reduce((sum, line) => sum + line.qty * line.price, 0) + DELIVERY_FEE[delivery]
}

export function createOrderRow(fields: Omit<OrderRow, 'number' | 'items' | 'total' | 'actions'> & { sequence: number }): OrderRow {
  const { sequence, ...order } = fields
  const number = `№ ${sequence}`

  return {
    ...order,
    number,
    items: order.lines.reduce((sum, line) => sum + line.qty, 0),
    total: orderTotal(order.lines, order.delivery),
    actions: `Действия с заказом ${number}`,
  }
}

const FIRST_NUMBER = 10_401
const ORDER_COUNT = 280
const HISTORY_DAYS = 60

function createOrders(): OrderRow[] {
  const random = createRandom(20_261_008)
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!
  const drafts = []

  for (let index = 0; index < ORDER_COUNT; index++) {
    // Skewed towards recent days, as a growing shop would be.
    const age = Math.floor((random() ** 1.4) * HISTORY_DAYS)
    const hour = String(8 + Math.floor(random() * 14)).padStart(2, '0')
    const minute = String(Math.floor(random() * 60)).padStart(2, '0')
    const customer = pick(CUSTOMERS)
    const deliveryRoll = random()
    const delivery: OrderDelivery = deliveryRoll < 0.55 ? 'courier' : deliveryRoll < 0.8 ? 'pickup' : 'post'
    const payment: PaymentMethod = customer.label.startsWith('ООО') || customer.label.startsWith('ИП') ? 'invoice' : random() < 0.8 ? 'card' : 'cash'
    const status = statusForAge(age, random())

    const lineCount = 1 + Math.floor(random() * 3)
    const lines: OrderLine[] = Array.from({ length: lineCount }, (_, lineIndex) => {
      const product = pick(PRODUCTS)
      return {
        id: `l${index}-${lineIndex}`,
        productId: product.id,
        title: product.label,
        sku: product.sku,
        qty: 1 + Math.floor((random() ** 3) * 4),
        price: product.price,
      }
    })

    drafts.push({
      createdAt: `${shiftDay(TODAY, -age)}T${hour}:${minute}`,
      customer: customer.label,
      customerId: customer.id,
      email: customer.email,
      status,
      delivery,
      payment,
      urgent: random() < 0.14,
      hasReturn: status === 'returned' || (status === 'delivered' && random() < 0.05),
      lines,
    })
  }

  // Numbers grow with time, as a real shop's do; the list itself runs newest first.
  return drafts
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((draft, index) => createOrderRow({ ...draft, id: `ord-${FIRST_NUMBER + index}`, sequence: FIRST_NUMBER + index }))
    .reverse()
}

export const ORDERS: OrderRow[] = createOrders()

export const LAST_ORDER_NUMBER = FIRST_NUMBER + ORDER_COUNT - 1
