import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { DatePickerView } from './index'
import type { UseDateGridControlReturn } from './useDateGridControl'

export interface DateViewFocusOptions {
  view: Ref<DatePickerView>
  month: Ref<Date>
  grid: UseDateGridControlReturn
  selectYear: (year: number) => void
}

export interface UseDateViewFocusReturn {
  /** Bind to the year list (`ref="yearGrid"`): it exposes `focusYear`. */
  yearGrid: Ref<{ focusYear: (year?: number) => void } | null>
  /** Picks a year and brings the focus back onto the day once the days are back. */
  onSelectYear: (year: number) => void
  /** Call when the new view has entered (`@after-enter`). */
  onViewEntered: () => void
}

/**
 * Focus follows a view change the user made: into the year list when it
 * opens, back onto the day after a year is picked. Done once the new view has
 * entered — before that its cells do not exist yet.
 */
export function useDateViewFocus(options: DateViewFocusOptions): UseDateViewFocusReturn {
  const yearGrid = ref<{ focusYear: (year?: number) => void } | null>(null)
  let focusOnEnter: 'year' | 'day' | null = null

  function onSelectYear(year: number) {
    focusOnEnter = 'day'
    options.selectYear(year)
  }

  watch(options.view, (next) => {
    focusOnEnter ??= next === 'year' ? 'year' : null
  })

  function onViewEntered() {
    const target = focusOnEnter
    focusOnEnter = null
    if (target === 'year') yearGrid.value?.focusYear(options.month.value.getFullYear())
    if (target === 'day') options.grid.focusDate(options.grid.focused.value)
  }

  return { yearGrid, onSelectYear, onViewEntered }
}
