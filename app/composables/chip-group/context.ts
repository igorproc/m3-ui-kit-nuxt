/**
 * @module chip-group/context
 *
 * @remarks
 * Dedicated chip context layered on top of the canonical selection facade.
 *
 * It exists instead of reusing `MSelectionContext` directly so that an `MChip`
 * placed inside an unrelated `<MSelectionGroup>` never registers by accident:
 * only a real `<MChipGroup>` provides this key. Selection itself is not
 * reimplemented — every ticket delegates to `useSelectionGroup`, and the extra
 * ordered element list is view/focus state only.
 *
 * These exports are implementation details of the chip-group family, not a
 * public capability: there is no `ChipGroupSymbol` component and no public
 * injection key.
 */
import { inject, provide } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from 'vue'
import type { SelectionBlockReason } from '~/composables/selection/context'

/** Namespace for the chip-group provide/inject pair. */
export const CHIP_GROUP_KEY = 'm3:chip-group'

/** Layout flow of the group; also maps the arrow keys. */
export type MChipGroupDirection = 'horizontal' | 'vertical'

/** Reactive inputs a chip supplies when joining a group. */
export interface MChipRegistration<TValue> {
  value: MaybeRefOrGetter<TValue>
  disabled: MaybeRefOrGetter<boolean>
  /** Used only for user-triggered roving focus, never for measurement. */
  element: Readonly<ShallowRef<HTMLElement | null>>
}

/** Reactive per-chip ticket returned from {@link MChipGroupContext.register}. */
export interface MChipGroupTicket<TValue> {
  value: Readonly<ComputedRef<TValue>>
  selected: Readonly<ComputedRef<boolean>>
  disabled: Readonly<ComputedRef<boolean>>
  blocked: Readonly<ComputedRef<boolean>>
  blockReason: Readonly<ComputedRef<SelectionBlockReason>>
  /** Roving tabindex: exactly one chip in the group is a tab stop. */
  tabindex: Readonly<ComputedRef<0 | -1>>
  toggle: () => void
  focus: () => void
  stop: () => void
}

/** Facade injected by `MChip` descendants of `<MChipGroup>`. */
export interface MChipGroupContext<TValue> {
  multiple: Readonly<ComputedRef<boolean>>
  disabled: Readonly<ComputedRef<boolean>>
  selectionLimitReached: Readonly<ComputedRef<boolean>>
  direction: Readonly<ComputedRef<MChipGroupDirection>>
  register: (registration: MChipRegistration<TValue>) => MChipGroupTicket<TValue>
  select: (value: TValue) => void
  unselect: (value: TValue) => void
  toggle: (value: TValue) => void
  focusNext: (value: TValue) => void
  focusPrev: (value: TValue) => void
  focusFirst: () => void
  focusLast: () => void
}

export function provideChipGroupContext<TValue>(context: MChipGroupContext<TValue>) {
  provide(CHIP_GROUP_KEY, context as MChipGroupContext<unknown>)
  return context
}

/**
 * Injects the nearest `<MChipGroup>` facade.
 *
 * Returns `undefined` outside a group — unlike `useSelectionContext`, a missing
 * context is the normal standalone case, not an error.
 */
export function tryUseChipGroupContext<TValue = unknown>(): MChipGroupContext<TValue> | undefined {
  return inject<MChipGroupContext<unknown> | undefined>(CHIP_GROUP_KEY, undefined) as
    | MChipGroupContext<TValue>
    | undefined
}
