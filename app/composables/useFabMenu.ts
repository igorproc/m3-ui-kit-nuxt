/**
 * @module useFabMenu
 *
 * @remarks
 * Open/close + item-selection logic for the unified `fab-menu` component
 * (regular or extended FAB supplied via its `#activator` slot). Owns the
 * `isOpen` state and exposes
 * `open`/`close`/`toggle` (gated by a reactive `disabled` getter) plus a
 * `select` helper that runs the item's `action`, emits `select`, and closes.
 *
 * Generic over the item type so each component keeps its own item interface.
 *
 * @example
 * ```ts
 * const { isOpen, toggle, close, select } = useFabMenu<UiFabMenuItem>({
 *   disabled: () => props.disabled,
 * })
 * ```
 */
import { ref, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'

export interface FabMenuItemBase {
  action?: () => void
}

export interface UseFabMenuOptions {
  /** When truthy, `open`/`toggle` are no-ops. @default false */
  disabled?: MaybeRefOrGetter<boolean>
}

export interface UseFabMenuReturn<TItem extends FabMenuItemBase> {
  isOpen: Ref<boolean>
  open: () => void
  close: () => void
  toggle: () => void
  /** Run the item's `action`, emit `select`, then close the menu. */
  select: (item: TItem, emit: (event: 'select', item: TItem) => void) => void
}

export function useFabMenu<TItem extends FabMenuItemBase>(
  options: UseFabMenuOptions = {},
): UseFabMenuReturn<TItem> {
  const { disabled } = options

  const isOpen = ref(false)

  function open() {
    if (toValue(disabled)) return
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    if (toValue(disabled)) return
    isOpen.value = !isOpen.value
  }

  function select(item: TItem, emit: (event: 'select', item: TItem) => void) {
    item.action?.()
    emit('select', item)
    close()
  }

  return {
    isOpen,
    open,
    close,
    toggle,
    select,
  }
}
