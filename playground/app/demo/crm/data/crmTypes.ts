import type { MColor } from '#kit/shared/types/props'

export type CrmStageId = 'lead' | 'qualification' | 'proposal' | 'negotiation' | 'won'
export type CrmDealStatus = CrmStageId | 'lost'
export type CrmTagId = 'hot' | 'partner' | 'tender' | 'renewal' | 'pilot'
export type CrmPeriod = 'week' | 'month' | 'quarter'
export type CrmSection = 'deals' | 'contacts' | 'companies' | 'tasks' | 'reports'
export type CrmTab = 'funnel' | 'deals' | 'tasks'
export type CrmPriority = 'low' | 'medium' | 'high'
export type CrmTaskKind = 'call' | 'email' | 'meeting'

export interface CrmStage {
  id: CrmStageId
  label: string
  /** Default win probability of a deal entering the stage, %. */
  probability: number
}

export interface CrmTag {
  id: CrmTagId
  label: string
}

export interface CrmOwner {
  id: string
  name: string
  role: string
  /** Quarterly sales plan, ₽. */
  quota: number
  /** Lead score given by the head of sales, 1–5. */
  score: number
}

export interface CrmCompany {
  id: string
  /** `label` is the dropdown family's default item title. */
  label: string
  industry: string
  city: string
}

export interface CrmDeal {
  id: string
  title: string
  companyId: string
  ownerId: string
  status: CrmDealStatus
  amount: number
  probability: number
  /** ISO dates (`YYYY-MM-DD`), compared and formatted in UTC. */
  closeDate: string
  stageSince: string
  createdAt: string
  tags: CrmTagId[]
  reminders: boolean
  priority: CrmPriority
  contact: string
  color: string | null
  notes: string
  /** `HH:mm`, the time picker's model. */
  meetingTime: string
}

export interface CrmTask {
  id: string
  title: string
  dealId: string
  ownerId: string
  due: string
  done: boolean
  kind: CrmTaskKind
}

export interface CrmActivity {
  id: string
  dealId: string
  at: string
  title: string
  text: string
  icon: string
  color: MColor
  /** Visually hidden outcome word read before the title. */
  status: string
}

export interface CrmNotification {
  id: string
  text: string
  dealId: string
  at: string
  read: boolean
}

export interface CrmForecastPoint {
  /** ISO date of the point. */
  date: string
  actual: number | null
  forecast: number | null
}

export const CRM_STAGES: readonly CrmStage[] = [
  { id: 'lead', label: 'Лид', probability: 10 },
  { id: 'qualification', label: 'Квалификация', probability: 25 },
  { id: 'proposal', label: 'Предложение', probability: 50 },
  { id: 'negotiation', label: 'Переговоры', probability: 75 },
  { id: 'won', label: 'Выиграна', probability: 100 },
]

export const CRM_LOST_LABEL = 'Проиграна'

export const CRM_TAGS: readonly CrmTag[] = [
  { id: 'hot', label: 'Горячая' },
  { id: 'partner', label: 'Партнёр' },
  { id: 'tender', label: 'Тендер' },
  { id: 'renewal', label: 'Продление' },
  { id: 'pilot', label: 'Пилот' },
]

export const CRM_PERIODS: readonly { value: CrmPeriod, label: string, days: number }[] = [
  { value: 'week', label: 'Неделя', days: 7 },
  { value: 'month', label: 'Месяц', days: 30 },
  { value: 'quarter', label: 'Квартал', days: 90 },
]

export const CRM_SECTIONS: readonly { id: CrmSection, label: string, icon: string }[] = [
  { id: 'deals', label: 'Сделки', icon: 'outline-handshake' },
  { id: 'contacts', label: 'Контакты', icon: 'outline-contacts' },
  { id: 'companies', label: 'Компании', icon: 'outline-business' },
  { id: 'tasks', label: 'Задачи', icon: 'outline-task-alt' },
  { id: 'reports', label: 'Отчёты', icon: 'outline-assessment' },
]

export const CRM_PRIORITIES: readonly { label: string, value: CrmPriority }[] = [
  { label: 'Низкий', value: 'low' },
  { label: 'Средний', value: 'medium' },
  { label: 'Высокий', value: 'high' },
]

export function stageLabel(status: CrmDealStatus): string {
  return CRM_STAGES.find(stage => stage.id === status)?.label ?? CRM_LOST_LABEL
}

export function tagLabel(id: CrmTagId): string {
  return CRM_TAGS.find(tag => tag.id === id)?.label ?? id
}

export function isCrmSection(value: unknown): value is CrmSection {
  return CRM_SECTIONS.some(section => section.id === value)
}

export function isCrmPeriod(value: unknown): value is CrmPeriod {
  return CRM_PERIODS.some(period => period.value === value)
}
