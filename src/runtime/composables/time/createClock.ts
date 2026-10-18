/**
 * Clock math for `<MTimePicker>`: the `HH:mm` model, the hour cycle, the
 * dial's geometry and the locale's text. Pure — no Vue, no DOM — so every
 * edge (midnight, noon, 12 AM, the turn past 0°) is checked in a unit spec.
 *
 * The model is always 24-hour `HH:mm`; the cycle only changes what is shown.
 */

export type TimeField = 'hours' | 'minutes'
export type TimePeriod = 'am' | 'pm'
export type HourCycle = 'h12' | 'h23'
export type HourCycleOption = 'auto' | HourCycle

export interface ClockTime {
  hours: number
  minutes: number
}

export interface DialNumber {
  value: number
  label: string
  angle: number
  inner: boolean
}

export interface Clock {
  cycle: HourCycle
  /** Ring radii as fractions of the dial, M3's 101 and 69 of 256. */
  ring: { outer: number, inner: number }
  parse: (value: string | null | undefined) => ClockTime | null
  format: (time: ClockTime) => string
  periodOf: (hours: number) => TimePeriod
  /** The hour as the face shows it: 0–23, or 1–12 with a period. */
  faceHour: (hours: number) => number
  /** The 24-hour value of a face hour in a period. */
  toHours: (faceHour: number, period: TimePeriod) => number
  /** Positions a field takes on the dial: 24, 12 or 60. */
  count: (field: TimeField) => number
  indexOf: (field: TimeField, time: ClockTime) => number
  fromIndex: (field: TimeField, index: number, period: TimePeriod) => number
  angleOf: (field: TimeField, time: ClockTime) => number
  /** The value under a point of the dial, by its angle from 12 o'clock. */
  valueAt: (field: TimeField, angle: number, inner: boolean, period: TimePeriod) => number
  isInner: (field: TimeField, time: ClockTime) => boolean
  numbers: (field: TimeField) => DialNumber[]
  /** Digits in the locale's numbering system, padded. */
  digits: (value: number, width?: number) => string
  periods: Record<TimePeriod, string>
  valueText: (field: TimeField, time: ClockTime) => string
  /** A typed part, read strictly: digits only, inside the cycle's range. */
  readTyped: (field: TimeField, text: string) => number | null
  range: (field: TimeField) => { min: number, max: number }
}

const MODEL = /^(\d{1,2}):(\d{2})$/
const HOURS_ON_FACE = 12
const MINUTES = 60
const DEGREES = 360

const pad2 = (value: number) => String(value).padStart(2, '0')

function resolveCycle(locale: string, option: HourCycleOption): HourCycle {
  if (option !== 'auto') return option
  const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle
  return cycle === 'h11' || cycle === 'h12' ? 'h12' : 'h23'
}

function readPeriods(locale: string): Record<TimePeriod, string> {
  const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', hourCycle: 'h12', timeZone: 'UTC' })
  const at = (hour: number) => format.formatToParts(new Date(Date.UTC(2000, 0, 1, hour)))
    .find(part => part.type === 'dayPeriod')?.value
  return { am: at(9) ?? 'AM', pm: at(21) ?? 'PM' }
}

export function createClock(locale: string, option: HourCycleOption = 'h23'): Clock {
  const cycle = resolveCycle(locale, option)
  const twelve = cycle === 'h12'
  const periods = readPeriods(locale)
  const number = (width: number) => new Intl.NumberFormat(locale, { minimumIntegerDigits: width, useGrouping: false })
  const minuteText = new Intl.NumberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'long' })
  const hourText = new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'long' })
  const hourWithPeriod = new Intl.DateTimeFormat(locale, { hour: 'numeric', hourCycle: 'h12', timeZone: 'UTC' })

  const faceHour = (hours: number) => twelve ? (hours % HOURS_ON_FACE || HOURS_ON_FACE) : hours
  const toHours = (face: number, period: TimePeriod) => (face % HOURS_ON_FACE) + (period === 'pm' ? HOURS_ON_FACE : 0)
  const periodOf = (hours: number): TimePeriod => hours >= HOURS_ON_FACE ? 'pm' : 'am'
  const digits = (value: number, width = 1) => number(width).format(value)
  const range = (field: TimeField) => field === 'minutes'
    ? { min: 0, max: MINUTES - 1 }
    : (twelve ? { min: 1, max: HOURS_ON_FACE } : { min: 0, max: 23 })

  function numbers(field: TimeField): DialNumber[] {
    const steps = Array.from({ length: HOURS_ON_FACE }, (_, step) => step)
    if (field === 'minutes') {
      return steps.map(step => ({ value: step * 5, label: digits(step * 5, 2), angle: step * 30, inner: false }))
    }
    if (twelve) {
      return steps.map(step => ({ value: step || HOURS_ON_FACE, label: digits(step || HOURS_ON_FACE), angle: step * 30, inner: false }))
    }
    return [
      ...steps.map(step => ({ value: step, label: digits(step, step ? 1 : 2), angle: step * 30, inner: false })),
      ...steps.map(step => ({ value: step + HOURS_ON_FACE, label: digits(step + HOURS_ON_FACE), angle: step * 30, inner: true })),
    ]
  }

  return {
    cycle,
    ring: { outer: 101 / 256, inner: 69 / 256 },
    parse(value) {
      const match = value ? MODEL.exec(value.trim()) : null
      if (!match) return null
      const hours = Number(match[1])
      const minutes = Number(match[2])
      return hours < 24 && minutes < MINUTES ? { hours, minutes } : null
    },
    format: time => `${pad2(time.hours)}:${pad2(time.minutes)}`,
    periodOf,
    faceHour,
    toHours,
    count: field => field === 'minutes' ? MINUTES : (twelve ? HOURS_ON_FACE : 24),
    indexOf: (field, time) => field === 'minutes' ? time.minutes : (twelve ? time.hours % HOURS_ON_FACE : time.hours),
    fromIndex: (field, index, period) => field === 'minutes' ? index : (twelve ? toHours(index, period) : index),
    angleOf: (field, time) => field === 'minutes'
      ? time.minutes * (DEGREES / MINUTES)
      : (time.hours % HOURS_ON_FACE) * (DEGREES / HOURS_ON_FACE),
    valueAt(field, angle, inner, period) {
      const turn = ((angle % DEGREES) + DEGREES) % DEGREES
      if (field === 'minutes') return Math.round(turn / (DEGREES / MINUTES)) % MINUTES
      const step = Math.round(turn / (DEGREES / HOURS_ON_FACE)) % HOURS_ON_FACE
      if (twelve) return toHours(step, period)
      return inner ? step + HOURS_ON_FACE : step
    },
    isInner: (field, time) => !twelve && field === 'hours' && time.hours >= HOURS_ON_FACE,
    numbers,
    digits,
    periods,
    valueText(field, time) {
      if (field === 'minutes') return minuteText.format(time.minutes)
      return twelve
        ? hourWithPeriod.format(new Date(Date.UTC(2000, 0, 1, time.hours)))
        : hourText.format(time.hours)
    },
    readTyped(field, text) {
      if (!/^\d{1,2}$/.test(text)) return null
      const value = Number(text)
      const { min, max } = range(field)
      return value >= min && value <= max ? value : null
    },
    range,
  }
}
