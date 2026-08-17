/**
 * @module createModel
 *
 * @remarks
 * Value-store layer ported 1:1 from `@vuetify/v0`. Extends `createRegistry` with
 * a reactive `Set` of selected ids, per-ticket/instance disabled guards, an
 * `enroll`-on-register option, and an `apply` bridge used by `useProxyModel` to
 * sync an external ref. Selection-specific concepts (`mandatory`) live one layer
 * up in `createSelection`. `multiple` here only controls whether `select()`
 * accumulates or replaces.
 *
 * @example
 * ```ts
 * const model = createModel({ multiple: false })
 * model.register({ value: 'apple' })
 * model.select(model.values()[0]!.id)
 * ```
 */
import { computed, isRef, shallowReactive, toRaw, toRef, toValue, useId } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Reactive, Ref } from 'vue'
import { createRegistry } from './createRegistry'
import type { RegistryContext, RegistryOptions, RegistryTicket, RegistryTicketInput } from './createRegistry'
import { isUndefined } from '#kit/shared/utils/guards'
import { resolveIds } from '#kit/shared/utils/helpers'
import type { ID } from '#kit/shared/types/registry'

/** Input ticket: registry input + optional disabled state. */
export interface ModelTicketInput<V = unknown> extends RegistryTicketInput<V> {
  disabled?: MaybeRefOrGetter<boolean>
}

/** Output ticket: registry ticket + guaranteed `disabled` + `isSelected`. */
export type ModelTicket<Z extends ModelTicketInput = ModelTicketInput> = RegistryTicket & Z & {
  disabled: MaybeRefOrGetter<boolean>
  isSelected: Readonly<Ref<boolean, boolean>>
}

export interface ModelContext<
  Z extends ModelTicketInput = ModelTicketInput,
  E extends ModelTicket<Z> = ModelTicket<Z>,
> extends Omit<RegistryContext<Z, E>, 'register'> {
  /** Reactive set of selected ticket ids. */
  selectedIds: Reactive<Set<ID>>
  /** Selected ticket instances (ghost ids filtered out). */
  selectedItems: ComputedRef<Set<E>>
  /** Selected ticket values (refs unwrapped). */
  selectedValues: ComputedRef<Set<E['value'] extends Ref<infer U> ? U : E['value']>>
  /** Instance-level disabled guard. */
  disabled: MaybeRefOrGetter<boolean>
  /** Clear selection only (tickets preserved). */
  reset: () => void
  /** Select a ticket by id (respects single/multiple + disabled). */
  select: (id: ID) => void
  /** Unselect a ticket by id. */
  unselect: (id: ID) => void
  /** Toggle a ticket's selection. */
  toggle: (id: ID) => void
  /** Whether a ticket id is selected. */
  selected: (id: ID) => boolean
  /** Apply external value(s); used by `useProxyModel`. */
  apply: (values: unknown[], options?: { multiple?: boolean }) => void
  /** Register a ticket (adds `disabled`/`isSelected`). */
  register: (registration?: Partial<Z>) => E
  /** Register many tickets at once. */
  onboard: (registrations: Partial<Z>[]) => E[]
}

export interface ModelOptions extends RegistryOptions {
  /** Instance-level disabled guard. @default false */
  disabled?: MaybeRefOrGetter<boolean>
  /** Auto-select tickets on registration. @default true (`createSelection` overrides to false) */
  enroll?: MaybeRefOrGetter<boolean>
  /** Accumulate (`true`) vs replace (`false`) on `select()`. @default false */
  multiple?: MaybeRefOrGetter<boolean>
}

/**
 * Creates a new model instance (value store over a registry).
 */
export function createModel<
  Z extends ModelTicketInput = ModelTicketInput,
  E extends ModelTicket<Z> = ModelTicket<Z>,
  R extends ModelContext<Z, E> = ModelContext<Z, E>,
>(_options: ModelOptions = {}): R {
  const {
    disabled = false,
    enroll = true,
    multiple = false,
    ...options
  } = _options

  const registry = createRegistry<Z, E>(options)
  const selectedIds = shallowReactive(new Set<ID>())

  const selectedItems = computed(() => new Set(resolveIds(selectedIds, registry.get)))

  const selectedValues = computed(() => {
    return new Set(
      Array.from(selectedItems.value).map(item => toValue(item.value)),
    )
  })

  function select(id: ID) {
    if (toValue(disabled)) return

    const item = registry.get(id)
    if (!item || toValue(item.disabled)) return

    if (!toValue(multiple)) selectedIds.clear()
    selectedIds.add(id)
  }

  function unselect(id: ID) {
    if (toValue(disabled)) return

    selectedIds.delete(id)
  }

  function toggle(id: ID) {
    if (toValue(disabled)) return

    if (selected(id)) unselect(id)
    else select(id)
  }

  function selected(id: ID) {
    return selectedIds.has(id)
  }

  function apply(values: unknown[], _options?: { multiple?: boolean }): void {
    const value = values[0]

    // If the selected ticket's value is a ref, update it directly.
    for (const id of selectedIds) {
      const item = registry.get(id)
      if (!item || !isRef(item.value)) continue

      item.value.value = value
    }

    // Fallback: browse resolution for static values.
    if (!toValue(multiple)) selectedIds.clear()
    if (isUndefined(value)) return

    const ids = registry.browse(toRaw(value))
    const id = ids?.values().next().value
    if (!isUndefined(id)) selectedIds.add(id)
  }

  function register(registration: Partial<Z> = {}): E {
    const id = registration.id ?? useId()
    const item: Partial<E> = {
      disabled: false,
      ...registration,
      isSelected: toRef(() => selected(id)),
      id,
    } as Partial<E>

    const ticket = registry.register(item)

    if (toValue(enroll) && !toValue(disabled) && !toValue(ticket.disabled)) {
      select(id)
    }

    return ticket
  }

  function unregister(id: ID) {
    selectedIds.delete(id)
    registry.unregister(id)
  }

  function onboard(registrations: Partial<Z>[]): E[] {
    return registry.batch(() => registrations.map(r => register(r)))
  }

  function offboard(ids: ID[]): Partial<Z>[] {
    for (const id of ids) {
      selectedIds.delete(id)
    }
    return registry.offboard(ids)
  }

  function reset() {
    selectedIds.clear()
  }

  function clear() {
    reset()
    registry.clear()
  }

  function dispose() {
    reset()
    registry.dispose()
  }

  return {
    ...registry,
    disabled,
    selectedIds,
    selectedItems,
    selectedValues,
    register,
    onboard,
    unregister,
    offboard,
    clear,
    dispose,
    reset,
    select,
    unselect,
    toggle,
    selected,
    apply,
    get size() {
      return registry.size
    },
  } as unknown as R
}
