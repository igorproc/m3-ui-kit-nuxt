/**
 * The demo's clock. Days travel as `YYYY-MM-DD` keys and are read as UTC, so
 * the server and the browser agree on every date whatever their time zones —
 * nothing here reads the real time.
 */
const DAY_MS = 86_400_000

export const TODAY = '2026-10-08'
/** "Now" for orders created in the demo. */
export const NOW_TIME = '22:15'

export function parseDay(key: string): number {
  return Date.parse(`${key}T00:00:00Z`)
}

export function toDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export function shiftDay(key: string, days: number): string {
  return toDayKey(parseDay(key) + days * DAY_MS)
}

/** Inclusive count of days from `from` to `to`. */
export function dayCount(from: string, to: string): number {
  return Math.round((parseDay(to) - parseDay(from)) / DAY_MS) + 1
}

export function dayRange(from: string, to: string): string[] {
  return Array.from({ length: Math.max(0, dayCount(from, to)) }, (_, index) => shiftDay(from, index))
}

/** The kit's date pickers work in local `Date`s: a day key becomes local midnight of that day. */
export function toPickerDate(key: string): Date {
  const [year = 1970, month = 1, day = 1] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function fromPickerDate(value: Date | string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
