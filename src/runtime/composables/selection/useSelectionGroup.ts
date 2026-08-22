/**
 * @module selection/useSelectionGroup
 *
 * @remarks
 * Builds the public {@link MSelectionContext} facade for `<MSelectionGroup>` on
 * top of the kit's reactive `createGroup` registry. Owns the external
 * `v-model` ↔ registry synchronisation, `max`-limit enforcement, `mandatory`
 * re-selection when a selected item is removed, and value resolution through the
 * consumer-supplied comparator. No second selection collection is created — the
 * registry's reactive `selectedIds`/tickets stay the single source of truth.
 */
import { computed, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { createGroup } from '#kit/composables/registry/createGroup'
import { useProxyRegistry } from '#kit/composables/registry/useProxyRegistry'
import { toArray } from '#kit/shared/utils/toArray'
import { isUndefined } from '#kit/shared/utils/guards/guards'
import type { ID } from '#kit/shared/types/registry'
import type { MSelectionContext, SelectionItemRegistration, SelectionItemTicket } from './context'

/** Ticket value stored in the registry (kept reactive via getter/ref). */
type GroupTicketValue<TValue> = MaybeRefOrGetter<TValue>

interface GroupTicketInputShape<TValue> {
  value: GroupTicketValue<TValue>
  disabled?: MaybeRefOrGetter<boolean>
}

export interface UseSelectionGroupOptions<TValue> {
  multiple: () => boolean
  mandatory: () => boolean | 'force'
  disabled: () => boolean
  max: () => number | undefined
  comparator: () => (a: TValue, b: TValue) => boolean
  /** Current external model value. */
  model: () => TValue | TValue[] | undefined
  /** Emit an updated model value. */
  emitModel: (value: TValue | TValue[] | undefined) => void
}

/** Extra group-level projections consumed by the default/empty slots. */
export interface SelectionGroupState<TValue> {
  context: MSelectionContext<TValue>
  isAllSelected: ComputedRef<boolean>
  isMixed: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
}

export function useSelectionGroup<TValue>(
  options: UseSelectionGroupOptions<TValue>,
): SelectionGroupState<TValue> {
  const { multiple, mandatory, disabled, max, comparator, model, emitModel } = options

  const group = createGroup<GroupTicketInputShape<TValue>>({
    reactive: true,
    multiple,
    mandatory,
    disabled,
  })

  // Reactive snapshot of the ticket collection for value↔id resolution.
  const proxy = useProxyRegistry(group)

  const ticketValue = (ticket: { value: GroupTicketValue<TValue> }): TValue =>
    toValue(ticket.value) as TValue

  function ticketByValue(value: TValue) {
    const equal = comparator()
    return proxy.values.find(ticket => equal(ticketValue(ticket), value))
  }

  function sameValues(left: readonly TValue[], right: readonly TValue[]) {
    if (left.length !== right.length) return false
    const equal = comparator()
    return left.every((value, index) => equal(value, right[index] as TValue))
  }

  // Reference-stable selected values: only produce a new array when the content
  // actually changes, so the registry→model emit watch below does not fire (and
  // clobber a still-unapplied preset model) merely because a child registered.
  let selectedCache: TValue[] = []
  const selected = computed(() => {
    const next = proxy.values
      .filter(ticket => group.selectedIds.has(ticket.id))
      .map(ticket => ticketValue(ticket))
    if (sameValues(selectedCache, next)) return selectedCache
    selectedCache = next
    return next
  })

  const selectionLimitReached = computed(() => {
    const limit = max()
    return !!(multiple() && !isUndefined(limit) && selected.value.length >= (limit as number))
  })

  const disabledRef = computed(() => disabled())
  const multipleRef = computed(() => multiple())

  function isBlockedById(id: ID) {
    const ticket = group.get(id)
    if (!ticket) return true
    if (disabled() || toValue(ticket.disabled)) return true
    if (!group.selectedIds.has(id) && selectionLimitReached.value) return true
    return false
  }

  function selectById(id: ID) {
    if (group.selectedIds.has(id) || isBlockedById(id)) return
    group.select(id)
  }

  function unselectById(id: ID) {
    group.unselect(id)
  }

  function toggleById(id: ID) {
    if (group.selectedIds.has(id)) unselectById(id)
    else selectById(id)
  }

  function isSelected(value: TValue) {
    const ticket = ticketByValue(value)
    return ticket ? group.selectedIds.has(ticket.id) : false
  }

  function select(value: TValue) {
    const ticket = ticketByValue(value)
    if (ticket) selectById(ticket.id)
  }

  function unselect(value: TValue) {
    const ticket = ticketByValue(value)
    if (ticket) unselectById(ticket.id)
  }

  function toggle(value: TValue) {
    const ticket = ticketByValue(value)
    if (ticket) toggleById(ticket.id)
  }

  function register(registration: SelectionItemRegistration<TValue>): SelectionItemTicket<TValue> {
    const ticket = group.register({
      value: registration.value,
      disabled: registration.disabled,
    })

    const value = computed(() => toValue(registration.value) as TValue)
    const isSelectedRef = computed(() => group.selectedIds.has(ticket.id))
    const isDisabledRef = computed(() => disabled() || !!toValue(registration.disabled))
    const blockReason = computed(() => {
      if (isDisabledRef.value) return 'disabled' as const
      if (!isSelectedRef.value && selectionLimitReached.value) return 'max' as const
      return null
    })

    return {
      id: ticket.id,
      value,
      isSelected: isSelectedRef,
      isDisabled: isDisabledRef,
      isSelectionBlocked: computed(() => blockReason.value !== null),
      blockReason,
      select: () => selectById(ticket.id),
      unselect: () => unselectById(ticket.id),
      toggle: () => toggleById(ticket.id),
      stop: () => group.unregister(ticket.id),
    }
  }

  const context: MSelectionContext<TValue> = {
    register,
    selected: selected as ComputedRef<TValue[]>,
    disabled: disabledRef,
    multiple: multipleRef,
    selectionLimitReached,
    isSelected,
    select,
    unselect,
    toggle,
    selectAll: () => group.selectAll(),
    unselectAll: () => group.unselectAll(),
    toggleAll: () => group.toggleAll(),
  }

  // --- external model → registry -------------------------------------------
  function applyExternal() {
    const raw = model()
    let values: TValue[]
    if (multiple()) values = toArray(raw) as TValue[]
    else values = isUndefined(raw) ? [] : [raw as TValue]

    const targetIds = new Set<ID>()
    for (const value of values) {
      const ticket = ticketByValue(value)
      if (ticket) targetIds.add(ticket.id)
    }

    for (const id of [...group.selectedIds]) {
      if (!targetIds.has(id)) group.unselect(id)
    }
    for (const id of targetIds) group.select(id)
  }

  // Re-apply when the external model or the ticket set changes (so a preset
  // value selects its item once the matching child registers).
  watch([() => model(), () => proxy.size], applyExternal, { immediate: true })

  // --- registry → external model -------------------------------------------
  watch(selected, (values) => {
    if (multiple()) {
      const current = toArray(model()) as TValue[]
      if (!sameValues(current, values)) emitModel([...values])
      return
    }

    const next = values[0]
    const current = model() as TValue | undefined
    const equal = comparator()
    const unchanged = isUndefined(next)
      ? isUndefined(current)
      : !isUndefined(current) && equal(current, next)
    if (!unchanged) emitModel(next)
  })

  // Keep `mandatory` invariant when a selected item is removed dynamically.
  watch([() => proxy.size, () => group.selectedIds.size], () => group.mandate())

  const isAllSelected = computed(() => group.isAllSelected.value)
  const isMixed = computed(() => group.isMixed.value)
  const isEmpty = computed(() => proxy.size === 0)

  return { context, isAllSelected, isMixed, isEmpty }
}
