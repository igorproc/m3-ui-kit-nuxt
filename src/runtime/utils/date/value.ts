import dayjs from 'dayjs'

/** What a date model may hold: a `Date`, a day string (`YYYY-MM-DD`, or any string dayjs reads) or a timestamp. */
export type DateModelValue = Date | string | number

/** The type an empty model is written in: a `Date`, a day string or a timestamp. */
export type DateValueType = 'date' | 'string' | 'number'

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
 * gets a day string (`YYYY-MM-DD`), a number gets a timestamp, a `Date` gets
 * a `Date`. An empty model has no type to keep and gets `empty`'s.
 */
export function toModelValue(date: Date | null, like: DateModelValue | null | undefined, empty: DateValueType = 'date'): DateModelValue | null {
  if (!date) return null
  const type = like === null || like === undefined ? empty : typeof like
  if (type === 'string') return dayjs(date).format(DAY_FORMAT)
  if (type === 'number') return date.getTime()
  return date
}

/** The day string a form submits (`<input type="date">` uses the same form). */
export const toDayString = (date: Date | null) => (date ? dayjs(date).format(DAY_FORMAT) : '')
