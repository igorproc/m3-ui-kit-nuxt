/**
 * @module useYearGridControl
 *
 * @remarks
 * Behavior layer of the date picker's year list: one tab stop that the arrows
 * move by one and by a row, Home/End to the ends, Enter or Space to choose.
 * The list scrolls itself — never the page — so the year under focus stays in
 * view, and it can be centred on a year before it is first shown.
 *
 * It hands back the rows ready for a nested `v-for` and attribute bags for the
 * list and its cells. No classes and no `data-*` leave it.
 */
import { computed, ref, useId } from 'vue'
import type { ComputedRef } from 'vue'
import type { Calendar } from '#kit/utils/date/createCalendar'

export interface YearGridControlOptions {
  calendar: () => Calendar
  years: () => number[]
  /** The year on screen — where the tab stop starts. */
  shownYear: () => number
  selectedYear: () => number | undefined
  /** This year, known on the client only. */
  currentYear: () => number | undefined
  disabled: () => boolean
  /** Id of the element naming the list — the month label. */
  labelledBy: () => string | undefined
  columns: number
  onSelect: (year: number) => void
}

export interface YearGridAttrs {
  'id': string
  'role': 'grid'
  'aria-labelledby': string | undefined
  'aria-disabled': 'true' | undefined
  'ref': (element: unknown) => void
  'onKeydown': (event: KeyboardEvent) => void
}

export interface YearCellAttrs {
  'id': string
  'role': 'gridcell'
  'tabindex': 0 | -1
  'aria-selected': 'true' | 'false'
  'aria-current'?: 'date'
  'aria-disabled'?: 'true'
  'onClick': () => void
  'onFocus': () => void
}

export interface UseYearGridControlReturn {
  rows: ComputedRef<number[][]>
  gridAttrs: ComputedRef<YearGridAttrs>
  getCellAttrs: (year: number) => YearCellAttrs
  /** Scrolls the list so a year sits in its middle, without moving the focus. */
  centerYear: (year?: number) => void
  /** Moves the tab stop to a year, keeps it in view and focuses it. */
  focusYear: (year?: number) => void
}

export function useYearGridControl(options: YearGridControlOptions, gridId: string = useId() ?? 'm-year-grid'): UseYearGridControlReturn {
  const focused = ref(options.shownYear())
  const cellId = (year: number) => `${gridId}-${year}`
  let list: HTMLElement | null = null

  const rows = computed(() => {
    const years = options.years()
    return Array.from({ length: Math.ceil(years.length / options.columns) }, (_, row) =>
      years.slice(row * options.columns, (row + 1) * options.columns))
  })

  const cellOf = (year: number) => list?.querySelector<HTMLElement>(`[id="${cellId(year)}"]`) ?? null

  // Measured against the list itself: `offsetTop` would count from whatever
  // positioned ancestor the page or a dialog happens to have.
  const offsetIn = (host: HTMLElement, cell: HTMLElement) =>
    cell.getBoundingClientRect().top - host.getBoundingClientRect().top + host.scrollTop

  function centerYear(year = focused.value) {
    const cell = cellOf(year)
    if (!list || !cell) return
    list.scrollTop = offsetIn(list, cell) - (list.clientHeight - cell.offsetHeight) / 2
  }

  // Half a cell of room above and below keeps the focus ring inside the list.
  function reveal(host: HTMLElement, cell: HTMLElement) {
    const room = cell.offsetHeight / 2
    const top = offsetIn(host, cell) - room
    const bottom = offsetIn(host, cell) + cell.offsetHeight + room
    if (top < host.scrollTop) host.scrollTop = top
    else if (bottom > host.scrollTop + host.clientHeight) host.scrollTop = bottom - host.clientHeight
  }

  function focusYear(year = focused.value) {
    const cell = cellOf(year)
    if (!list || !cell) return
    focused.value = year
    reveal(list, cell)
    cell.focus({ preventScroll: true })
  }

  function choose(year: number) {
    if (!options.disabled()) options.onSelect(year)
  }

  function onKeydown(event: KeyboardEvent) {
    if (options.disabled()) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(focused.value)
      return
    }

    const years = options.years()
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl'
    const next = options.calendar().gridStep(years.indexOf(focused.value), event.key, years.length, options.columns, rtl)
    if (next === null) return

    event.preventDefault()
    focusYear(years[next])
  }

  const gridAttrs = computed<YearGridAttrs>(() => ({
    'id': gridId,
    'role': 'grid',
    'aria-labelledby': options.labelledBy(),
    'aria-disabled': options.disabled() ? 'true' : undefined,
    'ref': (element: unknown) => {
      list = element instanceof HTMLElement ? element : null
    },
    'onKeydown': onKeydown,
  }))

  function getCellAttrs(year: number): YearCellAttrs {
    const disabled = options.disabled()
    return {
      'id': cellId(year),
      'role': 'gridcell',
      'tabindex': year === focused.value && !disabled ? 0 : -1,
      'aria-selected': year === options.selectedYear() ? 'true' : 'false',
      ...(year === options.currentYear() ? { 'aria-current': 'date' as const } : {}),
      ...(disabled ? { 'aria-disabled': 'true' as const } : {}),
      'onClick': () => choose(year),
      'onFocus': () => {
        focused.value = year
      },
    }
  }

  return { rows, gridAttrs, getCellAttrs, centerYear, focusYear }
}
