/** Slot props of `<MChipGroup>`, kept outside the generic SFC so its declarations can name them. */
import type { SelectionBlockReason } from '#kit/composables/selection/context'

export interface ChipGroupSlot<V> {
  selected: V[]
  multiple: boolean
  disabled: boolean
  selectionLimitReached: boolean
  select: (value: V) => void
  unselect: (value: V) => void
  toggle: (value: V) => void
}

export interface ChipItemSlot<I, V> {
  item: I
  index: number
  value: V
  selected: boolean
  disabled: boolean
  blocked: boolean
  blockReason: SelectionBlockReason
  props: { value: V, disabled: boolean }
}
