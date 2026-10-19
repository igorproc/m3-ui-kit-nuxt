/**
 * @module createCalendar
 *
 * @remarks
 * The pure half of the date picker: month grids, keyboard steps across them,
 * bounds, and every text a date turns into — no Vue, no DOM. Arithmetic is
 * dayjs (it clamps 31 → 30 on a month step); names, formats and the first day
 * of the week come from `Intl`, so a locale is a string and never a global.
 *
 * One factory per locale, so the module adds one name to the auto-import
 * surface rather than a dozen helpers.
 *
 * @example
 * ```ts
 * const calendar = createCalendar('de-DE')
 * calendar.monthGrid(new Date(2026, 9, 1)) // 6 weeks, Monday first, blanks outside October
 * ```
 */
import dayjs from 'dayjs'

/** A day of the month, or `null` for the cells outside it (they are not drawn). */
export type CalendarCell = Date | null

/** Where a grid key takes the focused date. */
export type CalendarKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End' | 'PageUp' | 'PageDown'

/** Order of the parts in a numeric date, read from the locale. */
export type DatePart = 'day' | 'month' | 'year'

export interface CalendarBounds {
  min?: Date
  max?: Date
}

export interface Calendar {
  locale: string
  /** First day of the week, 0 = Sunday. From `Intl.Locale.weekInfo`, Sunday where it is missing. */
  firstDay: number
  /** Six weeks of seven cells; the days outside the month are `null`, so the height never jumps 5 ↔ 6. */
  monthGrid: (month: Date) => CalendarCell[][]
  /** Narrow weekday letters and their full names, in grid order. */
  weekdays: () => { narrow: string, long: string }[]
  /** Where a key moves the focused date; `shift` with Page keys moves by a year. */
  step: (date: Date, key: CalendarKey, options?: { shift?: boolean, rtl?: boolean }) => Date
  isSameDay: (left: Date, right: Date) => boolean
  isSameMonth: (left: Date, right: Date) => boolean
  /**
   * Where a key moves the focus in a grid of `count` items laid in `columns`
   * (the year list): arrows by one and by a row, Home and End to the ends.
   * `null` for a key the grid does not take.
   */
  gridStep: (index: number, key: string, count: number, columns: number, rtl?: boolean) => number | null
  /** Outside `min`/`max`, by day. */
  isOutside: (date: Date, bounds: CalendarBounds) => boolean
  /** "October 2026" — the month menu and the grid's name. */
  monthYear: (date: Date) => string
  /** "14" in the locale's digits — what a day cell shows. */
  dayNumber: (date: Date) => string
  /** "2026" in the locale's digits — what a year cell shows. */
  year: (year: number) => string
  /** "Oct 14, 2026" — the headline. */
  headline: (date: Date) => string
  /** "Wednesday, October 14, 2026" — a day's accessible name. */
  fullDate: (date: Date) => string
  /** Numeric form for the input field ("10/14/2026"). */
  numeric: (date: Date) => string
  /** Part order and the separator the locale writes numeric dates with. */
  numericLayout: () => { order: DatePart[], separator: string }
  /**
   * Reads a typed date in the locale's part order. Any separator goes ("14 10
   * 2026", "14.10.26"); a two-digit year is this century. `null` when the text
   * is not a real date.
   */
  parse: (text: string) => Date | null
}

const DEFAULT_FIRST_DAY = 0
// A known Sunday: weekday names are read off the week that starts on it.
const REFERENCE_SUNDAY = new Date(2024, 0, 7)
const CENTURY = 2000

function readFirstDay(locale: string): number {
  try {
    const info = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay: number }
      getWeekInfo?: () => { firstDay: number }
    }
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay
    // `Intl` counts Monday as 1 and Sunday as 7.
    return firstDay === undefined ? DEFAULT_FIRST_DAY : firstDay % 7
  } catch {
    return DEFAULT_FIRST_DAY
  }
}

export function createCalendar(locale: string): Calendar {
  const firstDay = readFirstDay(locale)
  const formatter = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options)

  const monthYearFormat = formatter({ month: 'long', year: 'numeric' })
  const headlineFormat = formatter({ month: 'short', day: 'numeric', year: 'numeric' })
  const fullFormat = formatter({ dateStyle: 'full' })
  const numericFormat = formatter({ day: '2-digit', month: '2-digit', year: 'numeric' })
  const dayFormat = formatter({ day: 'numeric' })
  const yearFormat = formatter({ year: 'numeric' })

  const startOfWeek = (date: dayjs.Dayjs) => date.subtract((date.day() - firstDay + 7) % 7, 'day')

  function monthGrid(month: Date): CalendarCell[][] {
    const first = dayjs(month).startOf('month')
    let cursor = startOfWeek(first)

    return Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => {
      const cell = cursor.month() === first.month() ? cursor.toDate() : null
      cursor = cursor.add(1, 'day')
      return cell
    }))
  }

  function weekdays() {
    const narrow = formatter({ weekday: 'narrow' })
    const long = formatter({ weekday: 'long' })
    return Array.from({ length: 7 }, (_, index) => {
      const date = dayjs(REFERENCE_SUNDAY).add(firstDay + index, 'day').toDate()
      return { narrow: narrow.format(date), long: long.format(date) }
    })
  }

  function step(date: Date, key: CalendarKey, options: { shift?: boolean, rtl?: boolean } = {}): Date {
    const day = dayjs(date)
    const forward = options.rtl ? -1 : 1
    const moves: Record<CalendarKey, () => dayjs.Dayjs> = {
      ArrowRight: () => day.add(forward, 'day'),
      ArrowLeft: () => day.subtract(forward, 'day'),
      ArrowDown: () => day.add(7, 'day'),
      ArrowUp: () => day.subtract(7, 'day'),
      Home: () => startOfWeek(day),
      End: () => startOfWeek(day).add(6, 'day'),
      PageDown: () => day.add(1, options.shift ? 'year' : 'month'),
      PageUp: () => day.subtract(1, options.shift ? 'year' : 'month'),
    }
    return moves[key]().toDate()
  }

  function numericLayout() {
    const parts = numericFormat.formatToParts(REFERENCE_SUNDAY)
    const order = parts.map(part => part.type).filter((type): type is DatePart => type === 'day' || type === 'month' || type === 'year')
    const separator = parts.find(part => part.type === 'literal')?.value ?? '/'
    return { order, separator }
  }

  function parse(text: string): Date | null {
    const numbers = text.trim().split(/\D+/).filter(Boolean).map(Number)
    const { order } = numericLayout()
    if (numbers.length !== 3) return null

    const value: Partial<Record<DatePart, number>> = {}
    order.forEach((part, index) => {
      value[part] = numbers[index]
    })
    const year = value.year! < 100 ? CENTURY + value.year! : value.year!
    const date = new Date(year, value.month! - 1, value.day!)

    // `new Date` rolls 31.02 into March; a real date survives the round trip.
    const real = date.getFullYear() === year && date.getMonth() === value.month! - 1 && date.getDate() === value.day
    return real ? date : null
  }

  function gridStep(index: number, key: string, count: number, columns: number, rtl = false): number | null {
    const forward = rtl ? -1 : 1
    const moves: Record<string, number> = {
      ArrowRight: index + forward,
      ArrowLeft: index - forward,
      ArrowDown: index + columns,
      ArrowUp: index - columns,
      Home: 0,
      End: count - 1,
    }
    const next = moves[key]
    return next === undefined ? null : Math.min(count - 1, Math.max(0, next))
  }

  return {
    locale,
    firstDay,
    gridStep,
    monthGrid,
    weekdays,
    step,
    isSameDay: (left, right) => dayjs(left).isSame(right, 'day'),
    isSameMonth: (left, right) => dayjs(left).isSame(right, 'month'),
    isOutside: (date, { min, max }) => Boolean(
      (min && dayjs(date).isBefore(min, 'day')) || (max && dayjs(date).isAfter(max, 'day')),
    ),
    monthYear: date => monthYearFormat.format(date),
    dayNumber: date => dayFormat.format(date),
    year: value => yearFormat.format(new Date(value, 0, 1)),
    headline: date => headlineFormat.format(date),
    fullDate: date => fullFormat.format(date),
    numeric: date => numericFormat.format(date),
    numericLayout,
    parse,
  }
}
