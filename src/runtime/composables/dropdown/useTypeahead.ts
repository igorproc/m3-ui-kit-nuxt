/**
 * @module useTypeahead
 *
 * @remarks
 * Type-to-select for a select-only combobox (WAI-ARIA APG): printable keys
 * collect into a buffer that expires after a pause, and the buffer finds the
 * next row whose title starts with it.
 *
 * Repeating one character cycles through the rows starting with it — "b, b, b"
 * walks Banana → Blueberry → Banana instead of searching for "bbb", which is
 * what a native `<select>` does and what a user reaching for the third "B"
 * expects.
 */
import { onScopeDispose } from 'vue'

/** How long a pause ends a typed word. The APG examples use the same value. */
const BUFFER_TIMEOUT = 500

export interface TypeaheadRow {
  title: string
  disabled: boolean
}

export interface UseTypeaheadReturn {
  /** True while a word is being typed: Space then belongs to the word. */
  isTyping: () => boolean
  /**
   * Feeds one character and returns the index of the matching row, or `-1`.
   * The search starts after `from`, wrapping, so a repeated key moves on.
   */
  find: (character: string, rows: readonly TypeaheadRow[], from: number) => number
}

/** Whether a keydown is a character to type rather than a command. */
export function isPrintableKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
}

export function useTypeahead(): UseTypeaheadReturn {
  let buffer = ''
  let timer: ReturnType<typeof setTimeout> | undefined

  function reset() {
    buffer = ''
    timer = undefined
  }

  function find(character: string, rows: readonly TypeaheadRow[], from: number): number {
    clearTimeout(timer)
    timer = setTimeout(reset, BUFFER_TIMEOUT)
    buffer += character.toLocaleLowerCase()

    const cycling = [...buffer].every(letter => letter === buffer[0])
    const query = cycling ? buffer[0]! : buffer
    // A word in progress may still match the current row; a cycle must leave it.
    const start = cycling ? from + 1 : Math.max(from, 0)

    for (let step = 0; step < rows.length; step++) {
      const index = (start + step) % rows.length
      const row = rows[index]!
      if (!row.disabled && row.title.toLocaleLowerCase().startsWith(query)) return index
    }
    return -1
  }

  onScopeDispose(() => clearTimeout(timer))

  return { isTyping: () => buffer !== '', find }
}
