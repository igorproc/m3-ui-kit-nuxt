/**
 * @module selection/useSelectionItem
 *
 * @remarks
 * Shared registration logic for both the public `<MSelectionItem>` and the
 * internal data-driven item renderer. Injects the nearest `<MSelectionGroup>`
 * facade, registers a reactive ticket, exposes a ready-to-bind slot state, and
 * unregisters through `onScopeDispose` (never `onUnmounted`) so it also cleans
 * up under conditional scope teardown and data-driven removal.
 */
import { computed, onScopeDispose, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { useSelectionContext } from './context'
import type { SelectionItemState } from './context'

export interface UseSelectionItemOptions<TValue> {
  value: MaybeRefOrGetter<TValue>
  disabled?: MaybeRefOrGetter<boolean>
}

export interface UseSelectionItemReturn<TValue> {
  /** Ready-to-`v-bind` slot state for the selectable child. */
  state: ComputedRef<SelectionItemState<TValue>>
}

export function useSelectionItem<TValue>(
  options: UseSelectionItemOptions<TValue>,
): UseSelectionItemReturn<TValue> {
  const context = useSelectionContext<TValue>()

  const ticket = context.register({
    value: options.value,
    disabled: options.disabled,
  })

  onScopeDispose(() => ticket.stop())

  const state = computed<SelectionItemState<TValue>>(() => ({
    value: toValue(ticket.value),
    isSelected: ticket.isSelected.value,
    isDisabled: ticket.isDisabled.value,
    isSelectionBlocked: ticket.isSelectionBlocked.value,
    blockReason: ticket.blockReason.value,
    select: ticket.select,
    unselect: ticket.unselect,
    toggle: ticket.toggle,
  }))

  return { state }
}
