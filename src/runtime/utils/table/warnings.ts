import { watchEffect } from 'vue'
import type { MTableMessage } from './model'

export interface TableWarningState {
  named: boolean
  selectable: boolean
  selectAllLabel?: string
  pagination: boolean
  pageSizeSelector: boolean
  pageSizeLabel?: string
  rangeSlot: boolean
  message: MTableMessage | null
  emptySlot: boolean
  error: boolean | string | undefined
  errorSlot: boolean
}

/**
 * Dev-only warnings for `<MTable>` text the app has to supply: the kit ships no
 * wording of its own, so a missing name or message would reach the user as
 * silence. Each warning fires once per table. Internal: lives in `utils/` so it
 * is not auto-imported into consumers.
 *
 * @param read Reads the table's current state.
 */
export function useTableWarnings(read: () => TableWarningState) {
  if (!import.meta.dev) return

  const warned = new Set<string>()
  const warn = (key: string, message: string) => {
    if (warned.has(key)) return
    warned.add(key)
    console.warn(`[m-table] ${message}`)
  }

  watchEffect(() => {
    const state = read()

    if (!state.named) warn('name', 'has no accessible name: pass `caption`, `aria-label` or `aria-labelledby`.')
    if (state.selectable && !state.selectAllLabel) warn('select-all', 'the select-all checkbox has no name: pass `selectAllLabel`.')
    if (state.pagination && !state.rangeSlot) warn('range', 'the footer shows no range: fill the #pagination-info slot ({ start, end, total, page, pageCount }).')
    if (state.pagination && state.pageSizeSelector && !state.pageSizeLabel) warn('page-size', 'the page size selector has no label: pass `pageSizeLabel`.')
    if (state.message === 'empty' && !state.emptySlot) warn('empty', 'has no rows and no #empty slot: the body is left blank.')
    if (state.message === 'error' && state.error === true && !state.errorSlot) {
      warn('error', '`error` is set without a message: pass the message as `error` or fill the #error slot.')
    }
  })
}
