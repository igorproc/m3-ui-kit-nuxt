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
  ariaLabel: string
}

export interface UseDatePickerOptions {
  minDate?: Date | string | number
  maxDate?: Date | string | number
}

export function useDatePicker(
  modelValue: Ref<Date | string | number | null>,
  options: UseDatePickerOptions = {}
) {
  const view = ref<ViewMode>('calendar')
  const today = dayjs()
  const displayDate = ref(modelValue.value ? dayjs(modelValue.value) : dayjs())
  const yearGrid = ref<HTMLElement | null>(null)

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
        ariaLabel: current.format('MMMM D, YYYY'),
      })
      current = current.add(1, 'day')
    }

    return result
  })

  // Years generation
  const years = computed(() => {
    const currentYear = today.year()
    const start = currentYear - 100
    const end = currentYear + 100
    const result = []
    for (let i = start; i <= end; i++) {
      result.push(i)
    }
    return result
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
    displayDate.value = displayDate.value.subtract(1, 'month')
  }

  function goToNextMonth() {
    displayDate.value = displayDate.value.add(1, 'month')
  }

  function onSelect(date: dayjs.Dayjs) {
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
    toggleView,
    goToPreviousMonth,
    goToNextMonth,
    onSelect,
    onSelectYear,
  }
}
