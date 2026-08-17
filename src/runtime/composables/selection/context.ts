/**
 * @module selection/context
 *
 * @remarks
 * Public facade over the kit's reactive selection registry (`createGroup` →
 * `createSelection` → `createModel` → `createRegistry`). `<MSelectionGroup>`
 * builds this facade and provides it; `<MSelectionItem>`, the data-driven item
 * renderer, and advanced custom children all consume the one shared context and
 * the same tickets via `useSelectionContext()`.
 *
 * The facade deliberately hides internal ids, namespaces and proxy plumbing:
 * every public operation is expressed in terms of the consumer's `TValue`.
 */
import { inject } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { createContext } from '#kit/shared/utils/createContext'
import type { ID } from '#kit/shared/types/registry'

/** Namespace for the selection-group provide/inject pair. */
export const SELECTION_GROUP_KEY = 'm3:selection-group'

/** Why a value cannot currently be selected. */
export type SelectionBlockReason = 'disabled' | 'max' | null

/** Reactive inputs an advanced child supplies when registering a ticket. */
export interface SelectionItemRegistration<TValue> {
  /** The item's selection value (reactive). */
  value: MaybeRefOrGetter<TValue>
  /** Per-item disabled guard (reactive). */
  disabled?: MaybeRefOrGetter<boolean>
  /** Stable identity override; falls back to resolved value. */
  key?: MaybeRefOrGetter<PropertyKey>
}

/** Reactive ticket returned to an advanced child from `context.register`. */
export interface SelectionItemTicket<TValue> {
  /** Internal registry id (opaque; exposed only for keying). */
  id: ID
  value: Readonly<ComputedRef<TValue>>
  isSelected: Readonly<ComputedRef<boolean>>
  isDisabled: Readonly<ComputedRef<boolean>>
  isSelectionBlocked: Readonly<ComputedRef<boolean>>
  blockReason: Readonly<ComputedRef<SelectionBlockReason>>
  select: () => void
  unselect: () => void
  toggle: () => void
  /** Manual early unregister; otherwise cleared on scope dispose. */
  stop: () => void
}

/** Reactive per-item state exposed to selectable children via slot scope. */
export interface SelectionItemState<TValue> {
  value: TValue
  isSelected: boolean
  isDisabled: boolean
  isSelectionBlocked: boolean
  blockReason: SelectionBlockReason
  select: () => void
  unselect: () => void
  toggle: () => void
}

/** Data-driven `#item` slot scope: item state plus source item and index. */
export interface SelectionItemSlot<TItem, TValue> extends SelectionItemState<TValue> {
  item: TItem
  index: number
}

/** `#default`/`#empty` group-level slot scope. */
export interface SelectionGroupSlot<TValue> {
  selected: TValue[]
  isAllSelected: boolean
  isMixed: boolean
  selectionLimitReached: boolean
  selectAll: () => void
  unselectAll: () => void
  toggleAll: () => void
}

/** Public selection facade injected by descendants of `<MSelectionGroup>`. */
export interface MSelectionContext<TValue> {
  register: (registration: SelectionItemRegistration<TValue>) => SelectionItemTicket<TValue>
  /** Currently selected values, in registration order (readonly). */
  selected: Readonly<ComputedRef<TValue[]>>
  /** Whether the whole group is disabled (readonly). */
  disabled: Readonly<ComputedRef<boolean>>
  /** Whether multiple selection is active (readonly). */
  multiple: Readonly<ComputedRef<boolean>>
  /** Whether the `max` limit has been reached (readonly, multiple only). */
  selectionLimitReached: Readonly<ComputedRef<boolean>>
  isSelected: (value: TValue) => boolean
  select: (value: TValue) => void
  unselect: (value: TValue) => void
  toggle: (value: TValue) => void
  selectAll: () => void
  unselectAll: () => void
  toggleAll: () => void
}

const [, provideSelectionContext] = createContext<MSelectionContext<unknown>>(SELECTION_GROUP_KEY)

export { provideSelectionContext }

/**
 * Injects the nearest `<MSelectionGroup>` facade.
 *
 * @throws When no `<MSelectionGroup>` ancestor is present.
 */
export function useSelectionContext<TValue = unknown>(): MSelectionContext<TValue> {
  const context = inject<MSelectionContext<unknown>>(SELECTION_GROUP_KEY)

  if (!context) {
    throw new Error(
      '[m3:selection] useSelectionContext() must be used inside an <MSelectionGroup>.',
    )
  }

  return context as MSelectionContext<TValue>
}
