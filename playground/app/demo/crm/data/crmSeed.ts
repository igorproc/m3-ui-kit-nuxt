/**
 * Deterministic mock data. A seeded PRNG instead of `Math.random()`: the server
 * and the browser must generate the very same deals, or hydration diverges.
 */
import { addDays, CRM_TODAY } from './crmFormat'
import type {
  CrmActivity,
  CrmCompany,
  CrmDeal,
  CrmDealStatus,
  CrmForecastPoint,
  CrmNotification,
  CrmOwner,
  CrmPeriod,
  CrmPriority,
  CrmTask,
  CrmTaskKind,
} from './crmTypes'
import { CRM_STAGES, CRM_TAGS, stageLabel } from './crmTypes'

function createRandom(seed: number) {
  let state = seed

  return () => {
    state = (state + 0x6D2B79F5) | 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
  }
}

const random = createRandom(20_261_008)
const between = (min: number, max: number) => Math.round(min + random() * (max - min))
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!

export const CRM_OWNERS: readonly CrmOwner[] = [
  { id: 'o1', name: 'Анна Смирнова', role: 'Руководитель отдела', quota: 9_000_000, score: 5 },
  { id: 'o2', name: 'Дмитрий Козлов', role: 'Старший менеджер', quota: 7_500_000, score: 4 },
  { id: 'o3', name: 'Елена Орлова', role: 'Менеджер', quota: 6_000_000, score: 4 },
  { id: 'o4', name: 'Игорь Волков', role: 'Менеджер', quota: 6_000_000, score: 3 },
  { id: 'o5', name: 'Мария Лебедева', role: 'Младший менеджер', quota: 4_000_000, score: 2 },
]

/** The signed-in user. */
export const CRM_ME: CrmOwner = CRM_OWNERS[0]!

export const CRM_COMPANIES: readonly CrmCompany[] = [
  { id: 'c1', label: 'Ромашка', industry: 'Розничная торговля', city: 'Москва' },
  { id: 'c2', label: 'Альфа-Логистик', industry: 'Логистика', city: 'Екатеринбург' },
  { id: 'c3', label: 'ТехноПарк Сибирь', industry: 'ИТ', city: 'Новосибирск' },
  { id: 'c4', label: 'Вектор Плюс', industry: 'Производство', city: 'Казань' },
  { id: 'c5', label: 'Гранит Строй', industry: 'Строительство', city: 'Пермь' },
  { id: 'c6', label: 'Медиа Квадрат', industry: 'Медиа', city: 'Санкт-Петербург' },
  { id: 'c7', label: 'Зелёный город', industry: 'Девелопмент', city: 'Краснодар' },
  { id: 'c8', label: 'Полярис Авто', industry: 'Автодилер', city: 'Самара' },
  { id: 'c9', label: 'Синергия', industry: 'Консалтинг', city: 'Москва' },
  { id: 'c10', label: 'Байкал Агро', industry: 'Агропром', city: 'Иркутск' },
  { id: 'c11', label: 'Кварц Электроникс', industry: 'Электроника', city: 'Зеленоград' },
  { id: 'c12', label: 'Орбита Телеком', industry: 'Связь', city: 'Нижний Новгород' },
  { id: 'c13', label: 'Меридиан Фарм', industry: 'Фармацевтика', city: 'Ярославль' },
  { id: 'c14', label: 'Северный ветер', industry: 'Энергетика', city: 'Мурманск' },
]

const PRODUCTS = [
  'Внедрение CRM',
  'Годовая лицензия',
  'Пилотный проект',
  'Расширение контракта',
  'Сервисный договор',
  'Миграция в облако',
  'Обучение персонала',
  'Интеграция с 1С',
  'Аудит продаж',
  'Поставка терминалов',
]

const CONTACTS = ['Ольга Петрова', 'Сергей Иванов', 'Татьяна Ким', 'Павел Морозов', 'Ирина Белова', 'Артём Соколов']
const PRIORITIES: readonly CrmPriority[] = ['low', 'medium', 'medium', 'high']
const STATUS_PLAN: readonly [CrmDealStatus, number][] = [
  ['lead', 9],
  ['qualification', 8],
  ['proposal', 7],
  ['negotiation', 5],
  ['won', 7],
  ['lost', 4],
]

function stageProbability(status: CrmDealStatus): number {
  return CRM_STAGES.find(stage => stage.id === status)?.probability ?? 0
}

function buildDeal(status: CrmDealStatus, serial: number): CrmDeal {
  const closed = status === 'won' || status === 'lost'
  const company = CRM_COMPANIES[serial % CRM_COMPANIES.length]!
  const createdAt = addDays(CRM_TODAY, -between(20, 120))

  return {
    id: `D-${1001 + serial}`,
    title: pick(PRODUCTS),
    companyId: company.id,
    ownerId: pick(CRM_OWNERS).id,
    status,
    amount: between(15, 480) * 10_000,
    probability: stageProbability(status),
    closeDate: closed ? addDays(CRM_TODAY, -between(1, 85)) : addDays(CRM_TODAY, between(4, 90)),
    stageSince: addDays(CRM_TODAY, -between(1, 34)),
    createdAt,
    tags: CRM_TAGS.filter(() => random() < 0.28).slice(0, 2).map(tag => tag.id),
    reminders: random() < 0.6,
    priority: pick(PRIORITIES),
    contact: pick(CONTACTS),
    color: null,
    notes: '',
    meetingTime: '',
  }
}

export const CRM_SEED_DEALS: readonly CrmDeal[] = STATUS_PLAN
  .flatMap(([status, count]) => Array.from({ length: count }, () => status))
  .map((status, serial) => buildDeal(status, serial))

const TASK_TITLES: readonly [string, CrmTaskKind][] = [
  ['Позвонить по условиям оплаты', 'call'],
  ['Отправить коммерческое предложение', 'email'],
  ['Согласовать демонстрацию', 'meeting'],
  ['Уточнить бюджет на квартал', 'call'],
  ['Подготовить проект договора', 'email'],
  ['Встреча с отделом закупок', 'meeting'],
]

const TASK_DUE_OFFSETS = [-4, -2, -1, 0, 0, 1, 2, 3, 5, 7, 9, 12]
const DONE_TASKS = new Set([3, 8])

export const CRM_SEED_TASKS: readonly CrmTask[] = CRM_SEED_DEALS
  .filter(deal => deal.status !== 'won' && deal.status !== 'lost')
  .slice(0, TASK_DUE_OFFSETS.length)
  .map((deal, index) => {
    const [title, kind] = TASK_TITLES[index % TASK_TITLES.length]!

    return {
      id: `T-${index + 1}`,
      title,
      dealId: deal.id,
      ownerId: deal.ownerId,
      due: addDays(CRM_TODAY, TASK_DUE_OFFSETS[index] ?? 0),
      done: DONE_TASKS.has(index),
      kind,
    }
  })

export const CRM_SEED_NOTIFICATIONS: readonly CrmNotification[] = CRM_SEED_DEALS
  .filter(deal => deal.status === 'negotiation' || deal.status === 'proposal')
  .slice(0, 4)
  .map((deal, index) => ({
    id: `N-${index + 1}`,
    text: index % 2 === 0
      ? `Клиент открыл предложение по сделке «${deal.title}»`
      : `Сделка «${deal.title}» без движения больше двух недель`,
    dealId: deal.id,
    at: addDays(CRM_TODAY, -index),
    read: index > 1,
  }))

/** The history every deal starts with, derived from the deal itself. */
export function seedActivity(deal: CrmDeal): CrmActivity[] {
  const events: CrmActivity[] = [
    { id: `${deal.id}-created`, dealId: deal.id, at: deal.createdAt, title: 'Сделка создана', text: `Контакт: ${deal.contact}`, icon: 'outline-flag', color: 'secondary', status: 'Событие' },
    { id: `${deal.id}-call`, dealId: deal.id, at: addDays(deal.createdAt, 3), title: 'Звонок клиенту', text: 'Обсудили потребности и сроки', icon: 'outline-call', color: 'secondary', status: 'Выполнено' },
    { id: `${deal.id}-stage`, dealId: deal.id, at: deal.stageSince, title: `Этап: ${stageLabel(deal.status)}`, text: 'Сделка перешла на текущий этап', icon: 'outline-swap-horiz', color: 'primary', status: 'Изменение' },
  ]

  if (deal.status === 'lost') {
    events.push({ id: `${deal.id}-lost`, dealId: deal.id, at: deal.closeDate, title: 'Сделка проиграна', text: 'Клиент выбрал другого поставщика', icon: 'outline-cancel', color: 'error', status: 'Неудача' })
  }

  return events.sort((left, right) => right.at.localeCompare(left.at))
}

const FORECAST_SHAPE: Record<CrmPeriod, { steps: number, stepDays: number, seed: number, scale: number }> = {
  week: { steps: 7, stepDays: 1, seed: 7, scale: 260_000 },
  month: { steps: 6, stepDays: 6, seed: 30, scale: 900_000 },
  quarter: { steps: 13, stepDays: 7, seed: 90, scale: 1_100_000 },
}

function buildForecast(period: CrmPeriod): CrmForecastPoint[] {
  const { steps, stepDays, seed, scale } = FORECAST_SHAPE[period]
  const next = createRandom(seed)
  const todayIndex = Math.floor(steps / 2)
  let total = 0

  return Array.from({ length: steps }, (_, index) => {
    total += Math.round((0.4 + next()) * scale)
    return {
      date: addDays(CRM_TODAY, (index - todayIndex) * stepDays),
      actual: index <= todayIndex ? total : null,
      forecast: index >= todayIndex ? total : null,
    }
  })
}

export const CRM_FORECAST: Readonly<Record<CrmPeriod, CrmForecastPoint[]>> = {
  week: buildForecast('week'),
  month: buildForecast('month'),
  quarter: buildForecast('quarter'),
}
