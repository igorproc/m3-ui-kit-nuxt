/**
 * @module createSingle
 *
 * @remarks
 * Single-selection layer ported 1:1 from `@vuetify/v0`. Extends `createSelection`
 * to enforce one selected item and exposes singular computeds (`selectedId`,
 * `selectedItem`, `selectedIndex`, `selectedValue`). Ideal for tabs, radio
 * groups, theme pickers. Namespace defaults to `m3:single`.
 *
 * @example
 * ```ts
 * const single = createSingle()
 * const ticket = single.register({ value: 'tab-1' })
 * single.select(ticket.id)
 * single.selectedValue.value // 'tab-1'
 * ```
 */
import { toRef } from 'vue'
import type { ComputedRef } from 'vue'
import { useContext } from '#kit/shared/utils/context/createContext'
import { createTrinity } from '#kit/shared/utils/context/createTrinity'
import type { ContextTrinity } from '#kit/shared/utils/context/createTrinity'
import { createSelection } from './createSelection'
import type { SelectionContext, SelectionContextOptions, SelectionOptions, SelectionTicket, SelectionTicketInput } from './createSelection'
import type { ID } from '#kit/shared/types/registry'

export interface SingleTicketInput<V = unknown> extends SelectionTicketInput<V> {}

export type SingleTicket<Z extends SingleTicketInput = SingleTicketInput> = SelectionTicket<Z>

export interface SingleContext<
  Z extends SingleTicketInput = SingleTicketInput,
  E extends SingleTicket<Z> = SingleTicket<Z>,
> extends Omit<SelectionContext<Z, E>, 'register' | 'onboard'> {
  selectedId: ComputedRef<ID | undefined>
  selectedIndex: ComputedRef<number>
  selectedItem: ComputedRef<E | undefined>
  selectedValue: ComputedRef<E['value'] | undefined>
  register: (ticket?: Partial<Z>) => E
  onboard: (registrations: Partial<Z>[]) => E[]
}

export interface SingleOptions extends SelectionOptions {}

export interface SingleContextOptions extends SelectionContextOptions {}

/**
 * Creates a new single-selection instance.
 */
export function createSingle<
  Z extends SingleTicketInput = SingleTicketInput,
  E extends SingleTicket<Z> = SingleTicket<Z>,
  R extends SingleContext<Z, E> = SingleContext<Z, E>,
>(_options: SingleOptions = {}): R {
  const { mandatory = false, multiple = false, ...options } = _options
  const registry = createSelection<Z, E>({ ...options, mandatory, multiple })

  const selectedId = toRef(() => registry.selectedIds.values().next().value)
  const selectedItem = toRef(() => registry.selectedItems.value.values().next().value)
  const selectedIndex = toRef(() => selectedItem.value?.index ?? -1)
  const selectedValue = toRef(() => selectedItem.value?.value)

  return {
    ...registry,
    selectedId,
    selectedItem,
    selectedIndex,
    selectedValue,
    get size() {
      return registry.size
    },
  } as R
}

/**
 * Creates a single-selection context trinity for provide/inject usage.
 */
export function createSingleContext<
  Z extends SingleTicketInput = SingleTicketInput,
  E extends SingleTicket<Z> = SingleTicket<Z>,
  R extends SingleContext<Z, E> = SingleContext<Z, E>,
>(_options: SingleContextOptions = {}): ContextTrinity<R> {
  const { namespace = 'm3:single', ...options } = _options
  const context = createSingle<Z, E, R>(options)

  return createTrinity<R>(namespace, context)
}

/**
 * Injects the current single-selection instance from context.
 */
export function useSingle<
  Z extends SingleTicketInput = SingleTicketInput,
  E extends SingleTicket<Z> = SingleTicket<Z>,
  R extends SingleContext<Z, E> = SingleContext<Z, E>,
>(namespace = 'm3:single'): R {
  return useContext<R>(namespace)
}
