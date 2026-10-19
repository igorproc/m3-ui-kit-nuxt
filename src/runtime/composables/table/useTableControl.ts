/**
 * @module useTableControl
 *
 * @remarks
 * Behaviour of `<MTable>` that is not selection: the wiring between its parts
 * (row checkboxes named by their row's first cell, the caption naming the
 * scroll region), the busy state, row clicks, and a scroll region that is
 * reachable from the keyboard exactly while it scrolls. Returns attribute
 * bags only; classes stay with the component.
 */
import { computed, shallowRef, useId, watch } from 'vue'
import type { ComputedRef, ShallowRef } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import type { TableData } from '#kit/components/ui/table/types'

/** Clicks on these act on the control, not on the row around it. */
const ROW_CONTROLS = 'a, button, input, label, select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [tabindex]'

export interface UseTableControlOptions<T extends TableData> {
  viewport: Readonly<ShallowRef<HTMLElement | null>>
  table: Readonly<ShallowRef<HTMLElement | null>>
  selectable: () => boolean
  isSelected: (row: T) => boolean
  busy: () => boolean
  /** Whether a caption renders: it then names the scroll region too. */
  hasCaption: () => boolean
  /** The table's own `aria-label`, which names the scroll region without a caption. */
  label: () => string | undefined
  /** The table's own `aria-labelledby`, which names the scroll region without a caption or `aria-label`. */
  labelledBy?: () => string | undefined
  onRowClick: (row: T, event: MouseEvent) => void
}

export interface UseTableControlReturn<T extends TableData> {
  captionId: string
  /** The table is wider than its viewport. */
  overflowing: Readonly<ShallowRef<boolean>>
  /** Focusable, named region while it scrolls, so the keyboard can scroll it. */
  viewportAttrs: ComputedRef<Record<string, unknown>>
  tableAttrs: ComputedRef<Record<string, unknown>>
  getRowAttrs: (row: T) => Record<string, unknown>
  /** Id of a row's first cell, which names the row's checkbox. */
  getRowNameId: (index: number) => string
  getRowCheckboxAttrs: (index: number) => Record<string, unknown>
  /** The always-mounted polite region; only its text changes. */
  statusAttrs: Record<string, unknown>
}

export function useTableControl<T extends TableData>(options: UseTableControlOptions<T>): UseTableControlReturn<T> {
  const id = useId()
  const captionId = `${id}-caption`
  const overflowing = shallowRef(false)

  const getRowNameId = (index: number) => `${id}-row-${index}`

  function measure() {
    const viewport = options.viewport.value
    overflowing.value = Boolean(viewport) && viewport!.scrollWidth > viewport!.clientWidth
  }

  // Whether the table scrolls depends on its columns and its container alike,
  // so both are observed; the observer reports once on start as well.
  watch([options.viewport, options.table], ([viewport, table], _previous, onCleanup) => {
    if (!IN_BROWSER || !viewport || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    if (table) observer.observe(table)
    onCleanup(() => observer.disconnect())
  }, { immediate: true })

  const viewportAttrs = computed<Record<string, unknown>>(() => {
    if (!overflowing.value) return {}

    if (options.hasCaption()) return { 'tabindex': 0, 'role': 'region', 'aria-labelledby': captionId }

    const label = options.label()
    return label
      ? { 'tabindex': 0, 'role': 'region', 'aria-label': label }
      : { 'tabindex': 0, 'role': 'region', 'aria-labelledby': options.labelledBy?.() }
  })

  const tableAttrs = computed<Record<string, unknown>>(() => ({
    'aria-busy': options.busy() ? 'true' : undefined,
  }))

  function onClick(row: T, event: MouseEvent) {
    const rowElement = event.currentTarget as HTMLElement | null
    const control = (event.target as Element | null)?.closest?.(ROW_CONTROLS)
    if (control && rowElement?.contains(control)) return

    options.onRowClick(row, event)
  }

  const getRowAttrs = (row: T): Record<string, unknown> => ({
    'aria-selected': options.selectable() ? String(options.isSelected(row)) : undefined,
    'onClick': (event: MouseEvent) => onClick(row, event),
  })

  const getRowCheckboxAttrs = (index: number): Record<string, unknown> => ({
    'aria-labelledby': getRowNameId(index),
  })

  const statusAttrs = { 'role': 'status', 'aria-atomic': 'true' }

  return { captionId, overflowing, viewportAttrs, tableAttrs, getRowAttrs, getRowNameId, getRowCheckboxAttrs, statusAttrs }
}
