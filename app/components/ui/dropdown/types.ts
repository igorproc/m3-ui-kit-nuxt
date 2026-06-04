import type { ComputedRef } from 'vue'
import type { UiMenuOrigin } from '~/components/ui/menu/types'

/** A simple value/label pair fed through the `options` prop. */
export interface DropdownOption {
  label: string
  value: unknown
}

/** A richer item fed through the `items` prop (supports `id` + arbitrary keys). */
export interface DropdownItem {
  id?: string | number
  value?: unknown
  label?: string
}

/** Anything resolvable to a dropdown value (option, item, or a slotted entry). */
export type DropdownEntry = DropdownOption | DropdownItem

/** Per-instance context shared by the dropdown orchestrator and its leaves. */
export interface DropdownContext {
  /** Whether multi-select is active. */
  multiple: ComputedRef<boolean>
  /** Whether the field/menu is disabled. */
  disabled: ComputedRef<boolean>
  /** Whether the popover is open. */
  isOpen: ComputedRef<boolean>
  /** Field variant forwarded to the trigger. */
  variant: ComputedRef<'filled' | 'outlined'>
  /** Menu origin forwarded to the panel. */
  menuOrigin: ComputedRef<UiMenuOrigin>
  /** Float the label (open or has a selection). */
  fieldFocused: ComputedRef<boolean>
  /** Resolved label for the single-select trigger. */
  selectedLabel: ComputedRef<string>
  /** Resolved entries currently selected (for the chips block). */
  selectedItems: ComputedRef<DropdownEntry[]>
  /** Toggle the popover open/closed. */
  toggle: () => void
  /** Close the popover. */
  close: () => void
  /** Select (or toggle, in multiple mode) an entry. */
  select: (entry: DropdownEntry) => void
  /** Remove an entry from the multi-select value. */
  remove: (entry: DropdownEntry) => void
  /** Whether an entry is currently selected. */
  isSelected: (entry: DropdownEntry) => boolean
}
