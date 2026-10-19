/**
 * @module useOtpCaret
 *
 * @remarks
 * The caret of the one-time-code field, mapped onto its drawn cells: which
 * cell is active, where a click on the input lands, and how the field is
 * focused from code. Part of {@link useOtpControl}; it owns no ARIA and no
 * markup.
 */
import { onScopeDispose, shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import { useGlobalListener } from '#kit/composables/useGlobalListener'

export interface OtpCaretOptions {
  element: ShallowRef<HTMLInputElement | null>
  model: Ref<string>
  /** The field's own liveness flag — the same one the cells read. */
  focused: Ref<boolean>
  disabled: () => boolean
}

export interface UseOtpCaretReturn {
  /** The cell under the caret; equal to the code's length when the caret is past the grid. */
  activeIndex: ShallowRef<number>
  syncCaret: (caret: number | null) => void
  /** Starts following the caret (on focus); `stopWatchingCaret` ends it (on blur). */
  watchCaret: () => void
  stopWatchingCaret: () => void
  focusAt: (index: number) => void
  selectAll: () => void
  /** A ref callback that registers drawn cell `index`. */
  registerCell: (index: number) => (element: unknown) => void
  /** The drawn cell under a horizontal pointer position: the one containing it, else the nearest. */
  cellAt: (x: number) => number | undefined
}

export function useOtpCaret(options: OtpCaretOptions): UseOtpCaretReturn {
  const { element, model, focused } = options
  const activeIndex = shallowRef(0)
  const cells = new Map<number, Element>()

  // Caret positions outnumber cells by one: a code of six has seven of them,
  // and the seventh sits past the last cell. Clamping it onto the last cell
  // made a full field light one up for no reason, and ate the first ArrowLeft —
  // the caret moved 6 → 5 while the clamped index stayed at 5.
  function syncCaret(caret: number | null) {
    activeIndex.value = caret ?? model.value.length
  }

  // `selectionchange` is the only event that reports every way a caret moves:
  // a held arrow key repeats `keydown` and fires `keyup` once, so watching keys
  // left the highlight frozen until release and then jumped it to the end.
  // It covers the pointer, drag-selection and programmatic moves as well.
  let stopCaretWatch: (() => void) | undefined

  function watchCaret() {
    stopCaretWatch ??= useGlobalListener('document', 'selectionchange', () => {
      if (!focused.value) return
      syncCaret(element.value?.selectionStart ?? null)
    })
  }

  function stopWatchingCaret() {
    stopCaretWatch?.()
    stopCaretWatch = undefined
  }

  onScopeDispose(stopWatchingCaret, true)

  function focusAt(index: number) {
    if (options.disabled()) return

    // The caret cannot stand past the typed text, so neither can the highlight.
    const caret = Math.min(index, model.value.length)

    element.value?.focus()
    element.value?.setSelectionRange(caret, caret)
    activeIndex.value = caret
  }

  function selectAll() {
    if (options.disabled()) return

    element.value?.focus()
    element.value?.select()
    activeIndex.value = 0
  }

  const registerCell = (index: number) => (cell: unknown) => {
    if (cell instanceof Element) cells.set(index, cell)
    else cells.delete(index)
  }

  function cellAt(x: number) {
    let nearest: { index: number, distance: number } | undefined

    for (const [index, cell] of cells) {
      const { left, right } = cell.getBoundingClientRect()
      const distance = x < left ? left - x : x > right ? x - right : 0
      if (!nearest || distance < nearest.distance) nearest = { index, distance }
    }

    return nearest?.index
  }

  return { activeIndex, syncCaret, watchCaret, stopWatchingCaret, focusAt, selectAll, registerCell, cellAt }
}
