/**
 * @module createGroup
 *
 * @remarks
 * Multi-selection layer ported 1:1 from `@vuetify/v0`. Extends `createSelection`
 * with batch operations (`select`/`unselect`/`toggle` accept `ID | ID[]`),
 * tri-state mixed/indeterminate support (`mix`/`unmix`), `selectedIndexes`, and
 * select-all/none/toggle-all aggregates. Backs checkbox groups, multi-select
 * dropdowns, filter panels, accordions. Namespace defaults to `m3:group`.
 *
 * Internally creates its selection with `events: true` so the bundled
 * `useProxyRegistry` snapshot stays reactive.
 *
 * @example
 * ```ts
 * const group = createGroup()
 * group.register({ value: 'a' })
 * group.register({ value: 'b' })
 * group.select(['a', 'b'])
 * ```
 */
import { computed, shallowReactive, toRef, toValue, useId } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Reactive, Ref } from 'vue'
import { useContext } from '#kit/shared/utils/createContext'
import { createTrinity } from '#kit/shared/utils/createTrinity'
import type { ContextTrinity } from '#kit/shared/utils/createTrinity'
import { toArray } from '#kit/shared/utils/toArray'
import { resolveIds, resolveIndexes } from '#kit/shared/utils/helpers'
import { createSelection } from './createSelection'
import type { SelectionContext, SelectionContextOptions, SelectionOptions, SelectionTicket, SelectionTicketInput } from './createSelection'
import { useProxyRegistry } from './useProxyRegistry'
import type { ID } from '#kit/shared/types/registry'

export interface GroupTicketInput<V = unknown> extends SelectionTicketInput<V> {
  /** Start the ticket in the mixed/indeterminate state. */
  indeterminate?: MaybeRefOrGetter<boolean>
}

export type GroupTicket<Z extends GroupTicketInput = GroupTicketInput> = SelectionTicket<Z> & {
  isMixed: Readonly<Ref<boolean>>
  mix: () => void
  unmix: () => void
}

export interface GroupContext<
  Z extends GroupTicketInput = GroupTicketInput,
  E extends GroupTicket<Z> = GroupTicket<Z>,
> extends Omit<SelectionContext<Z, E>, 'register' | 'onboard' | 'select' | 'unselect' | 'toggle'> {
  selectedIndexes: ComputedRef<Set<number>>
  select: (ids: ID | ID[]) => void
  unselect: (ids: ID | ID[]) => void
  toggle: (ids: ID | ID[]) => void
  mixedIds: Reactive<Set<ID>>
  mixedItems: ComputedRef<Set<E>>
  mix: (ids: ID | ID[]) => void
  unmix: (ids: ID | ID[]) => void
  mixed: (id: ID) => boolean
  isNoneSelected: ComputedRef<boolean>
  isAllSelected: ComputedRef<boolean>
  isMixed: ComputedRef<boolean>
  selectAll: () => void
  unselectAll: () => void
  toggleAll: () => void
  register: (ticket?: Partial<Z>) => E
  onboard: (registrations: Partial<Z>[]) => E[]
}

export interface GroupOptions extends SelectionOptions {}

export interface GroupContextOptions extends SelectionContextOptions {}

/**
 * Creates a new group instance (batch + tri-state multi-selection).
 */
export function createGroup<
  Z extends GroupTicketInput = GroupTicketInput,
  E extends GroupTicket<Z> = GroupTicket<Z>,
  R extends GroupContext<Z, E> = GroupContext<Z, E>,
>(_options: GroupOptions = {}): R {
  const { mandatory = false, multiple = true, ...options } = _options
  const selection = createSelection<Z, E>({ ...options, mandatory, multiple, events: true })
  const proxy = useProxyRegistry<Z, E>(selection)
  const mixedIds = shallowReactive(new Set<ID>())

  const selectedIndexes = computed(() => new Set(resolveIndexes(selection.selectedItems.value)))

  const mixedItems = computed(() => new Set(resolveIds(mixedIds, selection.get)))

  function mixed(id: ID) {
    return mixedIds.has(id)
  }

  function mix(ids: ID | ID[]) {
    for (const id of toArray(ids)) {
      if (!selection.has(id)) continue
      selection.selectedIds.delete(id)
      mixedIds.add(id)
    }
  }

  function unmix(ids: ID | ID[]) {
    for (const id of toArray(ids)) {
      mixedIds.delete(id)
    }
  }

  function select(ids: ID | ID[]) {
    for (const id of toArray(ids)) {
      mixedIds.delete(id)
      selection.select(id)
    }
  }

  function unselect(ids: ID | ID[]) {
    for (const id of toArray(ids)) {
      selection.unselect(id)
    }
  }

  function toggle(ids: ID | ID[]) {
    for (const id of toArray(ids)) {
      if (mixed(id)) {
        select(id)
      } else {
        selection.toggle(id)
      }
    }
  }

  function register(registration: Partial<Z> = {}): E {
    const id = registration.id ?? useId()

    const item = {
      ...registration,
      id,
      isMixed: toRef(() => mixed(id)),
      select: () => select(id),
      unselect: () => unselect(id),
      toggle: () => toggle(id),
      mix: () => mix(id),
      unmix: () => unmix(id),
    }

    const ticket = selection.register(item as unknown as Partial<Z>) as E

    if (toValue(registration.indeterminate)) mix(id)

    return ticket
  }

  function unregister(id: ID) {
    mixedIds.delete(id)
    selection.unregister(id)
  }

  function offboard(ids: ID[]): Partial<Z>[] {
    for (const id of ids) {
      mixedIds.delete(id)
    }
    return selection.offboard(ids)
  }

  function onboard(registrations: Partial<Z>[]): E[] {
    const tickets = selection.batch(() => registrations.map(registration => register(registration)))
    if (toValue(mandatory) === 'force') selection.mandate()
    return tickets
  }

  function reset() {
    mixedIds.clear()
    selection.reset()
  }

  const selectableItems = computed(() => {
    return proxy.values.filter(item => !toValue(item.disabled))
  })

  const isAllSelected = computed(() => {
    const items = selectableItems.value
    if (items.length === 0) return false
    return items.every(item => selection.selectedIds.has(item.id))
  })

  const isNoneSelected = toRef(() => selection.selectedIds.size === 0)

  const isMixed = computed(() => {
    return mixedIds.size > 0 || (!isNoneSelected.value && !isAllSelected.value)
  })

  function selectAll() {
    for (const item of selectableItems.value) {
      mixedIds.delete(item.id)
      selection.select(item.id)
    }
  }

  function unselectAll() {
    selection.selectedIds.clear()

    if (!toValue(mandatory)) return

    const ticket = selection.seek('first')

    if (ticket) selection.select(ticket.id)
  }

  function toggleAll() {
    if (isAllSelected.value) unselectAll()
    else selectAll()
  }

  return {
    ...selection,
    mixed,
    mix,
    unmix,
    select,
    unselect,
    toggle,
    register,
    unregister,
    offboard,
    onboard,
    reset,
    selectAll,
    unselectAll,
    toggleAll,
    mixedIds,
    mixedItems,
    selectedIndexes,
    isNoneSelected,
    isAllSelected,
    isMixed,
    get size() {
      return selection.size
    },
  } as unknown as R
}

/**
 * Creates a group context trinity for provide/inject usage.
 */
export function createGroupContext<
  Z extends GroupTicketInput = GroupTicketInput,
  E extends GroupTicket<Z> = GroupTicket<Z>,
  R extends GroupContext<Z, E> = GroupContext<Z, E>,
>(_options: GroupContextOptions = {}): ContextTrinity<R> {
  const { namespace = 'm3:group', ...options } = _options
  const context = createGroup<Z, E, R>(options)

  return createTrinity<R>(namespace, context)
}

/**
 * Injects the current group instance from context.
 */
export function useGroup<
  Z extends GroupTicketInput = GroupTicketInput,
  E extends GroupTicket<Z> = GroupTicket<Z>,
  R extends GroupContext<Z, E> = GroupContext<Z, E>,
>(namespace = 'm3:group'): R {
  return useContext<R>(namespace)
}
