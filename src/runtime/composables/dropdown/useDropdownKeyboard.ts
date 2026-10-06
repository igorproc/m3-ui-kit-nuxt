/**
 * @module useDropdownKeyboard
 *
 * @remarks
 * The keyboard map of the selection family, after the WAI-ARIA APG combobox
 * patterns: *select-only* for `<MDropdown>`, *editable with list autocomplete*
 * for `<MAutocomplete>`. The two differ in what a key means when the field
 * holds text:
 *
 * | key | select-only | editable |
 * |---|---|---|
 * | printable | type-ahead: open and land on the match | a character of the query |
 * | Space | choose (opens when closed) | a character |
 * | Home / End | open and land on the first / last row | the caret's, for editing |
 * | Alt+ArrowUp | choose the active row and close | close, keeping the draft |
 *
 * Shared: arrows walk (and open), Alt+ArrowDown opens without moving,
 * PageUp/PageDown jump ten rows, Enter chooses, Escape and Tab dismiss.
 */
import { nextTick } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { isPrintableKey, useTypeahead } from './useTypeahead'

/** Where the virtual focus lands when the panel opens by a key that aims. */
export type PanelLanding = 'first' | 'last' | number

/** How far PageUp / PageDown jump, as in the APG examples. */
const PAGE_SIZE = 10

interface KeyboardRow {
  title: string
  disabled: boolean
}

export interface UseDropdownKeyboardOptions<TEntry extends KeyboardRow> {
  /** Disabled or read-only: no key does anything. */
  inert: () => boolean
  editable: () => boolean
  multiple: () => boolean
  hasSelection: () => boolean
  open: Ref<boolean>
  entries: ComputedRef<TEntry[]>
  activeIndex: Ref<number>
  activeEntry: ComputedRef<TEntry | undefined>
  move: (target: 'next' | 'previous' | 'first' | 'last') => void
  setActive: (index: number) => void
  openAt: (landing?: PanelLanding) => void
  closePanel: () => void
  /** Escape and Tab: close, and let the owner put its draft back. */
  dismiss: () => void
  selectEntry: (entry: TEntry) => void
  clear: () => void
  /** Chip navigation runs first; `true` means it consumed the key. */
  handleChipKeydown: (event: KeyboardEvent) => boolean
}

export function useDropdownKeyboard<TEntry extends KeyboardRow>(
  options: UseDropdownKeyboardOptions<TEntry>,
): (event: KeyboardEvent) => void {
  const { open, entries, activeIndex, activeEntry, move, setActive } = options
  const typeahead = useTypeahead()

  function page(direction: 1 | -1) {
    const enabled = entries.value.flatMap((entry, index) => entry.disabled ? [] : [index])
    if (!enabled.length) return

    const current = enabled.indexOf(activeIndex.value)
    const position = current < 0
      ? (direction > 0 ? 0 : enabled.length - 1)
      : Math.min(Math.max(current + direction * PAGE_SIZE, 0), enabled.length - 1)
    setActive(enabled[position]!)
  }

  function typeAhead(event: KeyboardEvent): boolean {
    if (options.editable() || !isPrintableKey(event)) return false
    // Space chooses — unless a word is being typed, where it is a letter.
    if (event.key === ' ' && !typeahead.isTyping()) return false

    event.preventDefault()
    const index = typeahead.find(event.key, entries.value, activeIndex.value)
    if (!open.value) options.openAt(index >= 0 ? index : undefined)
    else if (index >= 0) setActive(index)
    return true
  }

  function altArrow(down: boolean) {
    if (down) {
      options.openAt()
      return
    }
    if (!open.value) return
    // A select commits what it points at; a combobox keeps the typed draft.
    if (!options.editable() && !options.multiple() && activeEntry.value) {
      options.selectEntry(activeEntry.value)
      return
    }
    options.closePanel()
  }

  function arrow(event: KeyboardEvent) {
    event.preventDefault()
    if (event.altKey) {
      altArrow(event.key === 'ArrowDown')
      return
    }

    const direction = event.key === 'ArrowDown' ? 'next' : 'previous'
    if (open.value) {
      move(direction)
      return
    }
    options.openAt()
    // Opening may already have landed somewhere — on the current value, or on
    // the first row. Only an arrow that found nothing active moves.
    nextTick(() => {
      if (activeIndex.value < 0) move(direction)
    })
  }

  return function onKeydown(event: KeyboardEvent) {
    if (options.inert()) return
    if (options.handleChipKeydown(event)) return
    if (typeAhead(event)) return

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        arrow(event)
        return
      case 'Home':
      case 'End': {
        if (options.editable()) return
        event.preventDefault()
        const target = event.key === 'Home' ? 'first' : 'last'
        if (open.value) move(target)
        else options.openAt(target)
        return
      }
      case 'PageUp':
      case 'PageDown':
        if (!open.value) return
        event.preventDefault()
        page(event.key === 'PageDown' ? 1 : -1)
        return
      case 'Enter':
        event.preventDefault()
        if (!open.value) options.openAt()
        else if (activeEntry.value) options.selectEntry(activeEntry.value)
        return
      case 'Backspace':
      case 'Delete':
        // Multiple mode already consumed this in chip navigation. A select has
        // no text to erase, so the key falls through to the value itself — the
        // keyboard equivalent of the clear control.
        if (options.editable() || options.multiple() || !options.hasSelection()) return
        event.preventDefault()
        options.clear()
        return
      case 'Escape':
        if (!open.value) return
        event.preventDefault()
        options.dismiss()
        return
      case 'Tab':
        if (open.value) options.dismiss()
        return
      case ' ':
        // A combobox needs the character; a select uses it to choose.
        if (options.editable()) return
        event.preventDefault()
        if (!open.value) options.openAt()
        else if (activeEntry.value) options.selectEntry(activeEntry.value)
    }
  }
}
