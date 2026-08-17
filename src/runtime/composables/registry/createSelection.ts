/**
 * @module createSelection
 *
 * @remarks
 * Selection layer ported 1:1 from `@vuetify/v0`. Extends `createModel` with
 * multi-select, `mandatory` enforcement (`true` = can't deselect the last item,
 * `'force'` = auto-select the first non-disabled ticket on register),
 * auto-enrollment, disabled-item filtering, and per-ticket `select()`/
 * `unselect()`/`toggle()` self-methods. Base for `createSingle`, `createGroup`.
 *
 * This is the kit's canonical `useSelection` (registry-backed). Namespace
 * defaults to `m3:selection`.
 *
 * @example
 * ```ts
 * const selection = createSelection({ multiple: true })
 * const a = selection.register({ value: 'a' })
 * const b = selection.register({ value: 'b' })
 * selection.select(a.id)
 * ```
 */
import { toRaw, toValue, useId } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useContext } from '#kit/shared/utils/createContext'
import { createTrinity } from '#kit/shared/utils/createTrinity'
import type { ContextTrinity } from '#kit/shared/utils/createTrinity'
import { isUndefined } from '#kit/shared/utils/guards'
import { createModel } from './createModel'
import type { ModelContext, ModelOptions, ModelTicket, ModelTicketInput } from './createModel'
import type { ID } from '#kit/shared/types/registry'

/** Input ticket for a selection. Extend to add custom fields. */
export interface SelectionTicketInput<V = unknown> extends ModelTicketInput<V> {}

/** Output ticket: model ticket + self-selection methods. */
export type SelectionTicket<Z extends SelectionTicketInput = SelectionTicketInput> = ModelTicket<Z> & {
  select: () => void
  unselect: () => void
  toggle: () => void
}

export interface SelectionContext<
  Z extends SelectionTicketInput = SelectionTicketInput,
  E extends SelectionTicket<Z> = SelectionTicket<Z>,
> extends Omit<ModelContext<Z, E>, 'register'> {
  /** Whether multiple tickets may be selected. */
  multiple: MaybeRefOrGetter<boolean>
  register: (ticket?: Partial<Z>) => E
  onboard: (registrations: Partial<Z>[]) => E[]
  /** Enforce the `mandatory` option (select first when nothing is selected). */
  mandate: () => void
  /** Seek the first/last non-disabled ticket. */
  seek: (direction?: 'first' | 'last', from?: number) => E | undefined
}

export interface SelectionOptions extends ModelOptions {
  /**
   * Mandatory selection:
   * - `false` (default) — no enforcement.
   * - `true` — cannot deselect the last item.
   * - `'force'` — auto-select the first non-disabled ticket on registration.
   */
  mandatory?: MaybeRefOrGetter<boolean | 'force'>
  multiple?: MaybeRefOrGetter<boolean>
  /** Auto-select on registration. @default false (overrides `createModel`). */
  enroll?: MaybeRefOrGetter<boolean>
}

export interface SelectionContextOptions extends SelectionOptions {
  namespace?: string
}

/**
 * Creates a new selection instance.
 */
export function createSelection<
  Z extends SelectionTicketInput = SelectionTicketInput,
  E extends SelectionTicket<Z> = SelectionTicket<Z>,
  R extends SelectionContext<Z, E> = SelectionContext<Z, E>,
>(_options: SelectionOptions = {}): R {
  const {
    enroll = false,
    mandatory = false,
    multiple = false,
    ...options
  } = _options

  const model = createModel<Z, E>({ ...options, multiple, enroll: false })

  function seek(direction: 'first' | 'last' = 'first', from?: number): E | undefined {
    return model.seek(direction, from, (ticket: E) => !toValue(ticket.disabled))
  }

  function mandate() {
    if (!toValue(mandatory) || model.size === 0 || model.selectedIds.size > 0) return

    const ticket = seek('first')

    if (ticket) model.select(ticket.id)
  }

  function unselect(id: ID) {
    if (toValue(model.disabled)) return
    if (toValue(mandatory) && model.selectedIds.size === 1) return

    model.selectedIds.delete(id)
  }

  function toggle(id: ID) {
    if (toValue(model.disabled)) return

    if (model.selectedIds.has(id)) unselect(id)
    else model.select(id)
  }

  function apply(values: unknown[], options?: { multiple?: boolean }): void {
    const isMultiple = options?.multiple ?? toValue(multiple)
    const currentIds = new Set(model.selectedIds)
    const targetIds = new Set<ID>()

    for (const value of values) {
      const ids = model.browse(toRaw(value))
      if (ids) {
        for (const id of ids) targetIds.add(id)
      }
    }

    if (isMultiple) {
      for (const id of currentIds.difference(targetIds)) {
        unselect(id)
      }
      for (const id of targetIds.difference(currentIds)) {
        model.selectedIds.add(id)
      }
    } else {
      const next = targetIds.values().next().value
      const last = currentIds.values().next().value
      if (!isUndefined(last)) unselect(last)
      if (!isUndefined(next)) model.select(next)
    }
  }

  function register(registration: Partial<Z> = {}): E {
    const id = registration.id ?? useId()
    const decorated: Partial<Z> = {
      select: () => model.select(id),
      unselect: () => unselect(id),
      toggle: () => toggle(id),
      ...registration,
      id,
    } as Partial<Z>

    const ticket = model.register(decorated)

    if (toValue(enroll) && !toValue(model.disabled) && !toValue(ticket.disabled)) {
      model.select(ticket.id)
    }
    if (toValue(mandatory) === 'force') mandate()

    return ticket
  }

  function onboard(registrations: Partial<Z>[]): E[] {
    const tickets = model.batch(() => registrations.map(registration => register(registration)))
    if (toValue(mandatory) === 'force') mandate()
    return tickets
  }

  return {
    ...model,
    multiple,
    register,
    onboard,
    unselect,
    toggle,
    apply,
    mandate,
    seek,
    get size() {
      return model.size
    },
  } as R
}

/**
 * Creates a selection context trinity for provide/inject usage.
 */
export function createSelectionContext<
  Z extends SelectionTicketInput = SelectionTicketInput,
  E extends SelectionTicket<Z> = SelectionTicket<Z>,
  R extends SelectionContext<Z, E> = SelectionContext<Z, E>,
>(_options: SelectionContextOptions = {}): ContextTrinity<R> {
  const { namespace = 'm3:selection', ...options } = _options
  const context = createSelection<Z, E, R>(options)

  return createTrinity<R>(namespace, context)
}

/**
 * Injects the current selection instance from context.
 */
export function useSelection<
  Z extends SelectionTicketInput = SelectionTicketInput,
  E extends SelectionTicket<Z> = SelectionTicket<Z>,
  R extends SelectionContext<Z, E> = SelectionContext<Z, E>,
>(namespace = 'm3:selection'): R {
  return useContext<R>(namespace)
}
