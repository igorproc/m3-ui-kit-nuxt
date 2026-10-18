/**
 * Formatting and date arithmetic for the CRM demo.
 *
 * Dates live as `YYYY-MM-DD` strings and are formatted in UTC: the server and
 * the browser sit in different time zones, and a local-time formatter would
 * print a different day on each side of hydration.
 */
export const CRM_LOCALE = 'ru-RU'

/** The demo's fixed "today", so every relative date is the same on every render. */
export const CRM_TODAY = '2026-10-08'

const DAY_MS = 86_400_000

const moneyFormat = new Intl.NumberFormat(CRM_LOCALE, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
const compactFormat = new Intl.NumberFormat(CRM_LOCALE, { notation: 'compact', maximumFractionDigits: 1 })
const percentFormat = new Intl.NumberFormat(CRM_LOCALE, { style: 'percent', maximumFractionDigits: 0 })
const integerFormat = new Intl.NumberFormat(CRM_LOCALE)
const shortDateFormat = new Intl.DateTimeFormat(CRM_LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' })
const longDateFormat = new Intl.DateTimeFormat(CRM_LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const plurals = new Intl.PluralRules(CRM_LOCALE)

export function toUtcTime(iso: string): number {
  const [year = 1970, month = 1, day = 1] = iso.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtcTime(iso) + days * DAY_MS).toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcTime(to) - toUtcTime(from)) / DAY_MS)
}

/** The date pickers work in local time: a calendar day becomes local midnight. */
export function toLocalDate(iso: string): Date {
  const [year = 1970, month = 1, day = 1] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function fromLocalDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export const formatMoney = (value: number) => moneyFormat.format(value)
export const formatCompactMoney = (value: number) => `${compactFormat.format(value)} ₽`
export const formatPercent = (value: number) => percentFormat.format(value / 100)
export const formatInteger = (value: number) => integerFormat.format(value)
export const formatShortDate = (iso: string) => shortDateFormat.format(toUtcTime(iso))
export const formatLongDate = (iso: string) => longDateFormat.format(toUtcTime(iso))

/** Russian plural: `pluralRu(5, ['сделка', 'сделки', 'сделок'])` → `сделок`. */
export function pluralRu(count: number, [one, few, many]: readonly [string, string, string]): string {
  const rule = plurals.select(count)
  if (rule === 'one') return one
  if (rule === 'few') return few
  return many
}

export function countLabel(count: number, forms: readonly [string, string, string]): string {
  return `${formatInteger(count)} ${pluralRu(count, forms)}`
}

/** `Анна Смирнова` → `Анна С.` */
export function shortName(name: string): string {
  const [first = name, last] = name.split(' ')
  return last ? `${first} ${last.charAt(0)}.` : first
}
