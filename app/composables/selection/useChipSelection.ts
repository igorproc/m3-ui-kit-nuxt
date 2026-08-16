/**
 * @module useChipSelection
 *
 * @remarks
 * Reusable selection model + chip keyboard navigation for value-array combobox
 * fields (autocomplete now, dropdown next). Owns:
 * - the mode-aware selected values / `isSelected` / resolved selected entries,
 * - `select` (multiple toggle) and `remove`,
 * - chip navigation: arrow into the chips from an empty input, delete the
 *   focused chip, scroll it into view, and never keep a stale focus index.
 *
 * The host keeps ownership of single-select behavior, filtering, and the input.
 */
import type { Ref } from 'vue'

export interface ChipSelectionEntry<TValue> {
  value: TValue
  disabled?: boolean
}

interface UseChipSelectionOptions<TValue, TEntry extends ChipSelectionEntry<TValue>> {
  /** The field model — a single value, an array (multiple), or `undefined`. */
  model: Ref<TValue | TValue[] | undefined>
  /** Resolved option entries, used to map a selected value back to its entry. */
  entries: Ref<readonly TEntry[]>
  /** The live text draft; chip navigation only engages while it is empty. */
  draft: Ref<string>
  /** Namespace for the generated chip DOM ids (scroll-into-view targets). */
  namespace: string
  multiple: () => boolean | undefined
  mandatory: () => boolean | undefined
  disabled: () => boolean | undefined
  readonly: () => boolean | undefined
  /** Build a placeholder entry for a selected value absent from `entries`. */
  createFallbackEntry: (value: TValue, index: number) => TEntry
  onSelect?: (entry: TEntry) => void
  onRemove?: (entry: TEntry) => void
}

export function useChipSelection<TValue, TEntry extends ChipSelectionEntry<TValue>>(
  options: UseChipSelectionOptions<TValue, TEntry>,
) {
  const { model, entries, draft, namespace, createFallbackEntry, onSelect, onRemove } = options

  // Index of the chip targeted by keyboard navigation; `null` = caret in input.
  const chipFocus = ref<number | null>(null)
  const chipId = (index: number) => `${namespace}-chip-${index}`

  const selectedValues = computed<TValue[]>(() => options.multiple()
    ? (Array.isArray(model.value) ? model.value : []) as TValue[]
    : model.value === undefined ? [] : [model.value as TValue])

  const isSelected = (value: TValue) => selectedValues.value.some(selected => Object.is(selected, value))

  const selectedEntries = computed<TEntry[]>(() => selectedValues.value.map((value, index) =>
    entries.value.find(entry => Object.is(entry.value, value)) ?? createFallbackEntry(value, index)))

  /** Toggle a value in the multiple selection. */
  function select(entry: TEntry | undefined) {
    if (!entry || entry.disabled || options.disabled() || options.readonly()) return
    const values = [...selectedValues.value]
    const at = values.findIndex(value => Object.is(value, entry.value))
    if (at >= 0) {
      if (options.mandatory() && values.length === 1) return
      values.splice(at, 1)
      model.value = values
      onRemove?.(entry)
    } else {
      values.push(entry.value)
      model.value = values
      onSelect?.(entry)
    }
  }

  function remove(entry: TEntry) {
    if (options.disabled() || options.readonly()) return
    const values = [...selectedValues.value]
    if (options.mandatory() && values.length === 1) return
    const at = values.findIndex(value => Object.is(value, entry.value))
    if (at < 0) return
    values.splice(at, 1)
    model.value = values
    onRemove?.(entry)
  }

  // Delete the focused chip and land keyboard focus on a still-present neighbour.
  // Focus is cleared first, so a failed removal can never strand a stale index.
  function removeFocused() {
    const index = chipFocus.value
    chipFocus.value = null
    if (index === null) return
    const entry = selectedEntries.value[index]
    if (!entry) return
    remove(entry)
    const length = selectedEntries.value.length
    if (length) chipFocus.value = Math.min(index, length - 1)
  }

  /** Handle a chip-navigation key; returns `true` when the event was consumed. */
  function handleChipKeydown(event: KeyboardEvent): boolean {
    if (!options.multiple() || draft.value) return false
    const count = selectedEntries.value.length

    if (event.key === 'ArrowLeft') {
      if (chipFocus.value === null) {
        if (!count) return false
        event.preventDefault()
        chipFocus.value = count - 1
        return true
      }
      event.preventDefault()
      if (chipFocus.value > 0) chipFocus.value--
      return true
    }

    if (event.key === 'ArrowRight' && chipFocus.value !== null) {
      event.preventDefault()
      chipFocus.value = chipFocus.value < count - 1 ? chipFocus.value + 1 : null
      return true
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      if (chipFocus.value !== null) {
        event.preventDefault()
        removeFocused()
        return true
      }
      // A plain Backspace deletes the last chip but keeps the caret in the input.
      if (event.key === 'Backspace' && count) {
        remove(selectedEntries.value[count - 1]!)
        return true
      }
      return false
    }

    // Any other key returns the caret to the input.
    if (chipFocus.value !== null) chipFocus.value = null
    return false
  }

  // Typing exits chip navigation; a shrinking selection (e.g. a chip removed by
  // click) clamps the focus so it can never point past the last chip.
  watch(draft, (value) => {
    if (value) chipFocus.value = null
  })
  watch(() => selectedEntries.value.length, (length) => {
    if (chipFocus.value !== null && chipFocus.value >= length) {
      chipFocus.value = length ? length - 1 : null
    }
  })
  watch(chipFocus, (index) => {
    if (index === null || !import.meta.client) return
    nextTick(() => document.getElementById(chipId(index))?.scrollIntoView({ inline: 'nearest', block: 'nearest' }))
  })

  return {
    selectedValues,
    isSelected,
    selectedEntries,
    chipFocus,
    chipId,
    select,
    remove,
    handleChipKeydown,
  }
}
