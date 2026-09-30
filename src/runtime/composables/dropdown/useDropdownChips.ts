/**
 * @module useDropdownChips
 *
 * @remarks
 * Keyboard navigation across the chips of a multiple selection: walk into them
 * from an empty field with ArrowLeft, delete the focused one, and never keep a
 * focus index pointing past the last chip.
 *
 * It owns navigation only — removal is handed in, so the same guards
 * (`disabled`, `mandatory`, a disabled item) apply whether a chip is deleted by
 * keyboard or by click.
 */
import { computed, nextTick, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

export interface UseDropdownChipsOptions<TEntry> {
  /** Selected rows, in model order — the chips as rendered. */
  entries: ComputedRef<TEntry[]>
  multiple: () => boolean
  /** Text in the field; chip navigation only engages while it is empty. */
  draft: () => string
  remove: (entry: TEntry) => void
  /** Prefix for the chip DOM ids (scroll-into-view targets). */
  namespace: string
}

export interface UseDropdownChipsReturn {
  /** Index of the chip holding keyboard focus; `null` = caret in the field. */
  chipFocus: Ref<number | null>
  chipId: (index: number) => string
  /** Returns `true` when the key belonged to chip navigation. */
  handleChipKeydown: (event: KeyboardEvent) => boolean
}

export function useDropdownChips<TEntry>(
  options: UseDropdownChipsOptions<TEntry>,
): UseDropdownChipsReturn {
  const chipFocus = ref<number | null>(null)
  const chipId = (index: number) => `${options.namespace}-chip-${index}`
  const count = computed(() => options.entries.value.length)

  // Focus is cleared first, so a refused removal can never strand a stale index.
  function removeFocused() {
    const index = chipFocus.value
    chipFocus.value = null
    if (index === null) return

    const entry = options.entries.value[index]
    if (!entry) return

    options.remove(entry)
    if (count.value) chipFocus.value = Math.min(index, count.value - 1)
  }

  function handleChipKeydown(event: KeyboardEvent): boolean {
    if (!options.multiple() || options.draft()) return false

    if (event.key === 'ArrowLeft') {
      if (chipFocus.value === null) {
        if (!count.value) return false
        event.preventDefault()
        chipFocus.value = count.value - 1
        return true
      }
      event.preventDefault()
      if (chipFocus.value > 0) chipFocus.value--
      return true
    }

    if (event.key === 'ArrowRight' && chipFocus.value !== null) {
      event.preventDefault()
      chipFocus.value = chipFocus.value < count.value - 1 ? chipFocus.value + 1 : null
      return true
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      if (chipFocus.value !== null) {
        event.preventDefault()
        removeFocused()
        return true
      }
      // A plain Backspace deletes the last chip and leaves the caret in place.
      if (event.key === 'Backspace' && count.value) {
        const last = options.entries.value[count.value - 1]
        if (last) options.remove(last)
        return true
      }
      return false
    }

    // Any other key returns the caret to the field.
    if (chipFocus.value !== null) chipFocus.value = null
    return false
  }

  // A shrinking selection (a chip removed by click) clamps the focus so it can
  // never point past the last chip.
  watch(count, (length) => {
    if (chipFocus.value !== null && chipFocus.value >= length) {
      chipFocus.value = length ? length - 1 : null
    }
  })

  watch(chipFocus, (index) => {
    if (index === null || !import.meta.client) return
    nextTick(() => document.getElementById(chipId(index))
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' }))
  })

  return { chipFocus, chipId, handleChipKeydown }
}
