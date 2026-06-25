import type { ComputedRef, Ref } from 'vue'
import type { UiMenuOrigin } from '~/components/ui/menu/types'

/** Registration handle returned to an option leaf for ARIA + active-state wiring. */
export interface DropdownOptionTicket {
  /** Stable DOM id for the option (target of `aria-activedescendant`). */
  id: string
  /** Whether this option is the active (virtually focused) descendant. */
  isActive: ComputedRef<boolean>
  /** Detach the option from the keyboard-navigation registry. */
  unregister: () => void
}

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
  /** Stable id for the listbox panel (combobox `aria-controls` target). */
  listboxId: string
  /** Id of the active descendant, or `undefined` when none is active. */
  activeDescendant: ComputedRef<string | undefined>
  /** Register an option leaf for keyboard navigation + active-state tracking. */
  registerOption: (entry: DropdownEntry, el: Ref<HTMLElement | null>) => DropdownOptionTicket
  /** Open the popover (no-op if disabled). */
  open: () => void
  /** Keyboard handler bound to the focusable combobox trigger. */
  onTriggerKeydown: (event: KeyboardEvent) => void
  /** Register the combobox element so focus can be returned to it on close. */
  setTriggerEl: (el: HTMLElement | null) => void
}
