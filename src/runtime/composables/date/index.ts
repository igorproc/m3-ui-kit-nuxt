/**
 * @module useDatePicker
 *
 * @remarks
 * The state of a date picker: the chosen date, the month on screen, the view
 * (days or years) and the bounds — all of it reactive, the locale included.
 * The day grid's keyboard and ARIA live in {@link useDateGridControl}; the
 * math and the text in {@link createCalendar}.
 *
 * "Today" is set on the client only: the server cannot know the reader's date,
 * so its HTML marks none and the mark arrives after mount.
 */
import { computed, onMounted, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import dayjs from 'dayjs'
import { createCalendar } from '#kit/utils/date/createCalendar'
import type { Calendar, CalendarBounds } from '#kit/utils/date/createCalendar'
import { toDate, toModelValue } from '#kit/utils/date/value'
import type { DateModelValue } from '#kit/utils/date/value'

export type DatePickerView = 'calendar' | 'year'
export type DatePickerValue = DateModelValue

export interface UseDatePickerOptions {
  model: Ref<DatePickerValue | null>
  locale: () => string
  min: () => DatePickerValue | undefined
  max: () => DatePickerValue | undefined
}

export interface UseDatePickerReturn {
  calendar: ComputedRef<Calendar>
  /** The model as a date; `null` when empty or unreadable. */
  selected: ComputedRef<Date | null>
  /** First day of the month on screen. */
  month: Ref<Date>
  view: Ref<DatePickerView>
  today: Ref<Date | null>
  bounds: ComputedRef<CalendarBounds>
  years: ComputedRef<number[]>
  canGoPrev: ComputedRef<boolean>
  canGoNext: ComputedRef<boolean>
  prevMonth: () => void
  nextMonth: () => void
  toggleView: () => void
  /** Shows the same month of another year, back on the day view. */
  selectYear: (year: number) => void
  select: (date: Date) => void
}

/** How far the year list reaches each way when no bound limits it. */
const YEAR_SPAN = 100

export function useDatePicker(options: UseDatePickerOptions): UseDatePickerReturn {
  const calendar = computed(() => createCalendar(options.locale()))
  const selected = computed(() => toDate(options.model.value))

  // Bounds are read on every change, not once at setup (EN-05).
  const bounds = computed<CalendarBounds>(() => {
    const min = toDate(options.min()) ?? undefined
    const max = toDate(options.max()) ?? undefined
    if (import.meta.dev && min && max && dayjs(min).isAfter(max, 'day')) {
      console.warn('[m-date-picker] `min-date` is after `max-date`: no day can be chosen.')
    }
    return { min, max }
  })

  const startOfMonth = (date: Date) => dayjs(date).startOf('month').toDate()
  const month = ref<Date>(startOfMonth(selected.value ?? new Date()))
  const view = ref<DatePickerView>('calendar')
  const today = ref<Date | null>(null)

  onMounted(() => {
    today.value = new Date()
  })

  watch(selected, (date) => {
    if (date && !dayjs(date).isSame(month.value, 'month')) month.value = startOfMonth(date)
  })

  const years = computed(() => {
    const anchor = dayjs().year()
    const first = bounds.value.min ? dayjs(bounds.value.min).year() : anchor - YEAR_SPAN
    const last = bounds.value.max ? dayjs(bounds.value.max).year() : anchor + YEAR_SPAN
    return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index)
  })

  const canGoPrev = computed(() => !bounds.value.min || dayjs(month.value).isAfter(bounds.value.min, 'month'))
  const canGoNext = computed(() => !bounds.value.max || dayjs(month.value).isBefore(bounds.value.max, 'month'))

  function prevMonth() {
    if (canGoPrev.value) month.value = dayjs(month.value).subtract(1, 'month').toDate()
  }

  function nextMonth() {
    if (canGoNext.value) month.value = dayjs(month.value).add(1, 'month').toDate()
  }

  function toggleView() {
    view.value = view.value === 'calendar' ? 'year' : 'calendar'
  }

  function selectYear(year: number) {
    month.value = dayjs(month.value).year(year).toDate()
    view.value = 'calendar'
  }

  // The model keeps the type it came in: a form holding `'2026-10-14'` gets a
  // day string back, not a `Date`.
  function select(date: Date) {
    if (calendar.value.isOutside(date, bounds.value)) return
    options.model.value = toModelValue(date, options.model.value)
  }

  return { calendar, selected, month, view, today, bounds, years, canGoPrev, canGoNext, prevMonth, nextMonth, toggleView, selectYear, select }
}
