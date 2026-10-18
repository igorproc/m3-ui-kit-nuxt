import { parseDay } from './calendar'

const LOCALE = 'ru-RU'

export const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
export const integer = new Intl.NumberFormat(LOCALE)
export const signedPercent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' })
export const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 })

// Every date is formatted in UTC: the data is UTC-normalised (see calendar.ts),
// so SSR and hydration print the same text in any time zone.
const shortDay = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' })
const longDay = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: 'UTC' })
const dateTime = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})
const plural = new Intl.PluralRules(LOCALE)

export const formatShortDay = (key: string) => shortDay.format(parseDay(key))
export const formatLongDay = (key: string) => longDay.format(parseDay(key))
export const formatWeekday = (key: string) => weekday.format(parseDay(key))
export const formatDateTime = (stamp: string) => dateTime.format(Date.parse(`${stamp}:00Z`))

/** `forms` are the Russian one / few / many forms: `['заказ', 'заказа', 'заказов']`. */
export function pluralize(count: number, forms: readonly [string, string, string]): string {
  const rule = plural.select(count)
  const word = rule === 'one' ? forms[0] : rule === 'few' ? forms[1] : forms[2]
  return `${integer.format(count)} ${word}`
}
