/**
 * @module useDateGridControl
 *
 * @remarks
 * Behavior layer of the day grid — the APG date-picker grid: one tab stop
 * that roves with the arrows across month edges, Page keys by month (Shift: by
 * year), Home/End to the week's ends, Enter or Space to choose. Unavailable
 * days stay focusable and say so (`aria-disabled`); they are never chosen.
 *
 * It hands back the weeks ready for a nested `v-for` and attribute bags for
 * the grid and its cells. No classes and no `data-*` leave it: the state a
 * cell carries is in the cell, the markup is the consumer's.
 *
 * @example
 * ```vue
 * <div v-bind="gridAttrs">
 *   <div v-for="week in weeks" role="row">
 *     <div v-for="cell in week" v-bind="getCellAttrs(cell)">{{ cell.label }}</div>
 *   </div>
 * </div>
 * ```
 */
import { computed, nextTick, ref, useId, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import dayjs from 'dayjs'
import type { Calendar, CalendarBounds, CalendarKey } from '#kit/utils/date/createCalendar'

export interface DateGridControlOptions {
  calendar: ComputedRef<Calendar>
  /** The month on screen. Written when the keyboard walks past its edge. */
  month: Ref<Date>
  selected: () => Date | null
  /** `null` until the client knows the date: the server never marks a "today". */
  today: () => Date | null
  bounds: () => CalendarBounds
  disabled: () => boolean
  readonly: () => boolean
  /** Id of the element naming the grid — the month label. */
  labelledBy: () => string | undefined
  onSelect: (date: Date) => void
}

/** One cell of the grid; `date` is `null` outside the month (an empty cell). */
export interface DateGridCell {
  key: string
  date: Date | null
  /** The day in the locale's digits; empty outside the month. */
  label: string
  selected: boolean
  today: boolean
  /** Outside `min`/`max`: focusable, announced, never chosen. */
  unavailable: boolean
}

export interface DateGridAttrs {
  'id': string
  'role': 'grid'
  'aria-labelledby': string | undefined
  'aria-disabled': 'true' | undefined
  'aria-readonly': 'true' | undefined
  'onKeydown': (event: KeyboardEvent) => void
}

export type DateGridCellAttrs = { role: 'gridcell' } & Partial<{
  'id': string
  'tabindex': 0 | -1
  'aria-label': string
  'aria-selected': 'true' | 'false'
  'aria-current': 'date'
  'aria-disabled': 'true'
  'onClick': () => void
  'onFocus': () => void
}>

export interface UseDateGridControlReturn {
  weeks: ComputedRef<DateGridCell[][]>
  /** The date that holds the grid's one tab stop. */
  focused: Ref<Date>
  gridAttrs: ComputedRef<DateGridAttrs>
  getCellAttrs: (cell: DateGridCell) => DateGridCellAttrs
  /** Moves the tab stop to a date (and the month with it) and focuses it. */
  focusDate: (date: Date) => void
}

const GRID_KEYS = new Set<CalendarKey>(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'])

const isoDay = (date: Date) => dayjs(date).format('YYYY-MM-DD')

export function useDateGridControl(options: DateGridControlOptions, gridId: string = useId() ?? 'm-date-grid'): UseDateGridControlReturn {
  const { calendar, month } = options
  const cellId = (date: Date) => `${gridId}-${isoDay(date)}`

  function restingFocus(): Date {
    const inMonth = (date: Date | null) => date && calendar.value.isSameMonth(date, month.value) ? date : null
    return inMonth(options.selected()) ?? inMonth(options.today()) ?? dayjs(month.value).startOf('month').toDate()
  }

  const focused = ref<Date>(restingFocus())
  // Whether the user has placed the tab stop: until then it follows the resting
  // rule, which can only see "today" after mount (the server has no today).
  let placed = false

  watch(() => options.today(), () => {
    if (!placed) focused.value = restingFocus()
  })

  // A month changed by its arrows keeps the tab stop on the same day of the
  // new month, clamped to its length.
  watch(month, (next) => {
    if (calendar.value.isSameMonth(focused.value, next)) return
    const day = Math.min(dayjs(focused.value).date(), dayjs(next).daysInMonth())
    focused.value = dayjs(next).date(day).toDate()
  })

  watch(() => options.selected(), () => {
    focused.value = restingFocus()
  })

  const weeks = computed<DateGridCell[][]>(() => {
    const selected = options.selected()
    const today = options.today()
    const bounds = options.bounds()

    return calendar.value.monthGrid(month.value).map((week, row) => week.map((date, column) => date
      ? {
          key: isoDay(date),
          date,
          label: calendar.value.dayNumber(date),
          selected: Boolean(selected && calendar.value.isSameDay(date, selected)),
          today: Boolean(today && calendar.value.isSameDay(date, today)),
          unavailable: calendar.value.isOutside(date, bounds),
        }
      : { key: `blank-${row}-${column}`, date: null, label: '', selected: false, today: false, unavailable: false }))
  })

  function clampToBounds(date: Date): Date {
    const { min, max } = options.bounds()
    if (min && dayjs(date).isBefore(min, 'day')) return min
    if (max && dayjs(date).isAfter(max, 'day')) return max
    return date
  }

  function focusDate(date: Date) {
    placed = true
    focused.value = date
    if (!calendar.value.isSameMonth(date, month.value)) month.value = dayjs(date).startOf('month').toDate()
    nextTick(() => document.getElementById(cellId(date))?.focus())
  }

  function choose(date: Date) {
    if (options.disabled() || options.readonly() || calendar.value.isOutside(date, options.bounds())) return
    options.onSelect(date)
  }

  function onKeydown(event: KeyboardEvent) {
    if (options.disabled()) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(focused.value)
      return
    }

    if (!GRID_KEYS.has(event.key as CalendarKey)) return
    event.preventDefault()

    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl'
    const next = calendar.value.step(focused.value, event.key as CalendarKey, { shift: event.shiftKey, rtl })
    focusDate(clampToBounds(next))
  }

  const gridAttrs = computed<DateGridAttrs>(() => ({
    'id': gridId,
    'role': 'grid',
    'aria-labelledby': options.labelledBy(),
    'aria-disabled': options.disabled() ? 'true' : undefined,
    'aria-readonly': options.readonly() ? 'true' : undefined,
    'onKeydown': onKeydown,
  }))

  function getCellAttrs(cell: DateGridCell): DateGridCellAttrs {
    const date = cell.date
    if (!date) return { role: 'gridcell' }

    const holdsFocus = calendar.value.isSameDay(date, focused.value)
    return {
      'role': 'gridcell',
      'id': cellId(date),
      'tabindex': holdsFocus && !options.disabled() ? 0 : -1,
      'aria-label': calendar.value.fullDate(date),
      'aria-selected': cell.selected ? 'true' : 'false',
      ...(cell.today ? { 'aria-current': 'date' as const } : {}),
      ...(cell.unavailable || options.disabled() ? { 'aria-disabled': 'true' as const } : {}),
      'onClick': () => {
        placed = true
        focused.value = date
        choose(date)
      },
      'onFocus': () => {
        placed = true
        focused.value = date
      },
    }
  }

  return { weeks, focused, gridAttrs, getCellAttrs, focusDate }
}
