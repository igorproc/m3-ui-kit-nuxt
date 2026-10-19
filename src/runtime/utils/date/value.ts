import dayjs from 'dayjs'

/** What a date model may hold: a `Date`, a day string (`YYYY-MM-DD`, or any string dayjs reads) or a timestamp. */
export type DateModelValue = Date | string | number

const DAY_FORMAT = 'YYYY-MM-DD'

/**
 * Reads a model value as a local date; `null` when empty or unreadable.
 *
 * Strings go through dayjs, which reads `'2026-10-14'` as local midnight —
 * `new Date('2026-10-14')` would read UTC and land on the 13th west of
 * Greenwich.
 */
export function toDate(value: DateModelValue | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.toDate() : null
}

/**
 * Writes a chosen date back in the type the model came in: a string model
 * gets a day string (`YYYY-MM-DD`), a number gets a timestamp, anything else
 * (a `Date`, or nothing yet) gets a `Date`.
 */
export function toModelValue(date: Date | null, like: DateModelValue | null | undefined): DateModelValue | null {
  if (!date) return null
  if (typeof like === 'string') return dayjs(date).format(DAY_FORMAT)
  if (typeof like === 'number') return date.getTime()
  return date
}

/** The day string a form submits (`<input type="date">` uses the same form). */
export const toDayString = (date: Date | null) => (date ? dayjs(date).format(DAY_FORMAT) : '')
