import { ref, computed, watch, nextTick } from 'vue'
import type { Ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/ru' // Ensure dayjs localizations are imported if necessary

export type ViewMode = 'calendar' | 'year'

export interface DayCell {
  key: string
  date: dayjs.Dayjs
  label: number
  inCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
  ariaLabel: string
}

export interface UseDatePickerOptions {
  minDate?: Date | string | number
  maxDate?: Date | string | number
}

export function useDatePicker(
  modelValue: Ref<Date | string | number | null>,
  options: UseDatePickerOptions = {},
) {
  const view = ref<ViewMode>('calendar')
  const today = dayjs()
  const displayDate = ref(modelValue.value ? dayjs(modelValue.value) : dayjs())
  const yearGrid = ref<HTMLElement | null>(null)

  // Normalized bounds (day granularity). Undefined when the bound is absent,
  // preserving fully-unbounded behavior byte-identically.
  const minDay = computed(() =>
    options.minDate !== undefined ? dayjs(options.minDate).startOf('day') : undefined,
  )
  const maxDay = computed(() =>
    options.maxDate !== undefined ? dayjs(options.maxDate).startOf('day') : undefined,
  )

  function isDisabledDay(date: dayjs.Dayjs): boolean {
    if (minDay.value && date.isBefore(minDay.value, 'day')) return true
    if (maxDay.value && date.isAfter(maxDay.value, 'day')) return true
    return false
  }

  // Label Computations
  const selectedLabel = computed(() => {
    if (!modelValue.value) return 'Select date'
    return dayjs(modelValue.value).format('ddd, MMM D')
  })

  const currentMonthYearLabel = computed(() => {
    return displayDate.value.format('MMMM YYYY')
  })

  const weekdayLabels = computed(() => {
    const weekdays = []
    for (let i = 0; i < 7; i++) {
      weekdays.push(dayjs().day(i).format('dd').charAt(0))
    }
    return weekdays
  })

  // Days calculations
  const days = computed<DayCell[]>(() => {
    const startOfMonth = displayDate.value.startOf('month')
    const endOfMonth = displayDate.value.endOf('month')

    const startOfWeek = startOfMonth.startOf('week')
    const endOfWeek = endOfMonth.endOf('week')

    const result: DayCell[] = []
    let current = startOfWeek

    while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
      result.push({
        key: current.format('YYYY-MM-DD'),
        date: current,
        label: current.date(),
        inCurrentMonth: current.month() === displayDate.value.month(),
        isToday: current.isSame(today, 'day'),
        isSelected: modelValue.value ? current.isSame(dayjs(modelValue.value), 'day') : false,
        isDisabled: isDisabledDay(current),
        ariaLabel: current.format('MMMM D, YYYY'),
      })
      current = current.add(1, 'day')
    }

    return result
  })

  // Years generation. Clamped to the bounds' years when present; only years
  // within [minYear, maxYear] are produced (out-of-range years are not
  // rendered at all). Falls back to the ±100 window when a bound is absent.
  const years = computed(() => {
    const currentYear = today.year()
    const start = minDay.value ? minDay.value.year() : currentYear - 100
    const end = maxDay.value ? maxDay.value.year() : currentYear + 100
    const result = []
    for (let i = start; i <= end; i++) {
      result.push(i)
    }
    return result
  })

  // Month-navigation edge detection: disable prev/next at the month containing
  // the respective bound. Always allowed when unbounded.
  const canGoPrev = computed(() => {
    if (!minDay.value) return true
    return displayDate.value.startOf('month').isAfter(minDay.value.startOf('month'))
  })

  const canGoNext = computed(() => {
    if (!maxDay.value) return true
    return displayDate.value.startOf('month').isBefore(maxDay.value.startOf('month'))
  })

  // Navigation and interactions
  function toggleView() {
    view.value = view.value === 'calendar' ? 'year' : 'calendar'
    if (view.value === 'year') {
      nextTick(() => {
        const selectedYear = yearGrid.value?.querySelector('.ui-date-picker__year--selected')
        selectedYear?.scrollIntoView({ block: 'center' })
      })
    }
  }

  function goToPreviousMonth() {
    if (!canGoPrev.value) return
    displayDate.value = displayDate.value.subtract(1, 'month')
  }

  function goToNextMonth() {
    if (!canGoNext.value) return
    displayDate.value = displayDate.value.add(1, 'month')
  }

  function onSelect(date: dayjs.Dayjs) {
    if (isDisabledDay(date)) return
    modelValue.value = date.toDate()
  }

  function onSelectYear(year: number) {
    displayDate.value = displayDate.value.year(year)
    view.value = 'calendar'
  }

  watch(modelValue, (next) => {
    if (next) {
      displayDate.value = dayjs(next)
    }
  })

  return {
    view,
    today,
    displayDate,
    yearGrid,
    selectedLabel,
    currentMonthYearLabel,
    weekdayLabels,
    days,
    years,
    canGoPrev,
    canGoNext,
    toggleView,
    goToPreviousMonth,
    goToNextMonth,
    onSelect,
    onSelectYear,
  }
}
