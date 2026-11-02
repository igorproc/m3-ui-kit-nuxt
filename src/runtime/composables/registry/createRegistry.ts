/**
 * @module createRegistry
 *
 * @remarks
 * Foundational ticket registry ported from `@vuetify/v0` (semantics preserved;
 * verbose per-symbol JSDoc condensed). Manages a collection of tickets with
 * id-based access, index ordering/reindexing, value reverse-lookup, a small
 * event bus, and per-iteration caching. It is the substrate the selection chain
 * (`createModel` → `createSelection` → `createGroup`/`createSingle`) extends via
 * spread.
 *
 * Differences from v0: `useLogger` → the kit logger shim; `__DEV__` →
 * `import.meta.dev`; default namespace `m3:registry`; the event bus, snapshot
 * cache and value catalog live in `utils/registry/internals`. The event
 * subsystem is kept — `useProxyRegistry` (used by `createGroup`) subscribes to it.
 *
 * @example
 * ```ts
 * const registry = createRegistry()
 * const ticket = registry.register({ value: 'item-1' })
 * registry.size // 1
 * registry.unregister(ticket.id)
 * ```
 */
import { shallowReactive } from 'vue'
import { useLogger } from '#kit/shared/utils/logger'
import { clamp } from '#kit/shared/utils/helpers'
import { isUndefined } from '#kit/shared/utils/guards/guards'
import type { ID } from '#kit/shared/types/registry'
import {
  createEventBus,
  createSnapshots,
  createTicketIds,
  createValueCatalog,
  seekTicket,
  toTicketInput,
} from '#kit/utils/registry/internals'
import type {
  RegistryContext,
  RegistryOptions,
  RegistryTicket,
  RegistryTicketInput,
} from './types'

/**
 * Creates a new registry instance.
 */
export function createRegistry<
  Z extends RegistryTicketInput = RegistryTicketInput,
  E extends RegistryTicket & Z = RegistryTicket & Z,
>(options?: RegistryOptions): RegistryContext<Z, E> {
  const logger = useLogger()

  const reactive = options?.reactive ?? false

  const collection = reactive ? shallowReactive(new Map<ID, E>()) : new Map<ID, E>()
  const catalog = createValueCatalog()
  const directory = new Map<number, ID>()
  const snapshots = createSnapshots(collection, reactive)
  const bus = createEventBus(options?.events ?? false, logger)
  const nextId = createTicketIds()
  const { emit } = bus

  let indexDependentCount = 0
  let needsReindex = false
  let minDirtyIndex = Infinity

  function dispose() {
    bus.clear()
    clear()
  }

  function get(id: ID) {
    return collection.get(id)
  }

  function upsert(id: ID, patch: Partial<Z> = {}, event?: string) {
    if (needsReindex) reindex()

    const existing = get(id)

    if (!existing) return register({ ...patch, id } as Partial<Z & RegistryTicket>)

    const hasValue = Object.prototype.hasOwnProperty.call(patch, 'value')
    let value = existing.value
    let valueIsIndex = existing.valueIsIndex

    if (hasValue) {
      if (isUndefined(patch.value)) {
        value = existing.index
        valueIsIndex = true
      } else {
        value = patch.value
        valueIsIndex = false
      }

      if (valueIsIndex !== existing.valueIsIndex) {
        if (valueIsIndex) {
          indexDependentCount++
        } else {
          indexDependentCount--
        }
      }

      if (!Object.is(value, existing.value)) {
        catalog.unassign(existing.value, id)
        catalog.assign(value, id)
      }
    }

    Object.assign(existing, patch, { id, index: existing.index, value, valueIsIndex })
    collection.set(id, existing)
    invalidate()
    emit('update:ticket', existing)
    if (event) emit(event, existing)

    return existing
  }

  function browse(value: unknown) {
    if (needsReindex) reindex()
    return catalog.browse(value)
  }

  function lookup(index: number) {
    if (needsReindex) reindex()
    return directory.get(index)
  }

  function has(id: ID) {
    return collection.has(id)
  }

  function clear() {
    collection.clear()
    catalog.clear()
    directory.clear()
    invalidate()
    indexDependentCount = 0
    needsReindex = false
    minDirtyIndex = Infinity
    emit('clear:registry')
  }

  function invalidate() {
    if (bus.holding) return
    snapshots.clear()
  }

  function batch<R>(fn: () => R): R {
    return bus.hold(fn, snapshots.clear)
  }

  function reindex() {
    const startIndex = minDirtyIndex === Infinity ? 0 : minDirtyIndex

    if (startIndex === 0) {
      catalog.clear()
      directory.clear()
    }

    invalidate()

    let index = 0

    for (const ticket of collection.values()) {
      if (index < startIndex) {
        index++
        continue
      }

      if (startIndex > 0) {
        directory.delete(ticket.index)
      }

      if (ticket.valueIsIndex) {
        if (startIndex > 0) {
          catalog.unassign(ticket.value, ticket.id)
        }
        ticket.value = index
        catalog.assign(ticket.value, ticket.id)
      } else if (startIndex === 0) {
        catalog.assign(ticket.value, ticket.id)
      }

      ticket.index = index
      directory.set(index, ticket.id)

      index++
    }

    needsReindex = false
    minDirtyIndex = Infinity
    emit('reindex:registry')
  }

  function register(registration: Partial<Z & RegistryTicket> = {}): E {
    if (needsReindex) reindex()

    const size = collection.size
    const id = nextId(registration.id)

    if (has(id)) {
      logger.warn(`Ticket "${id}" already exists. Use \`upsert()\` to update or check \`has()\` before registering.`)

      return get(id)!
    }

    const valueIsUndefined = isUndefined(registration.value)
    const index = registration.index ?? size
    const value = valueIsUndefined ? index : registration.value
    const valueIsIndex = registration.valueIsIndex ?? valueIsUndefined

    if (valueIsIndex) {
      indexDependentCount++
    }

    const input = {
      ...registration,
      id,
      index,
      value,
      valueIsIndex,
      unregister: () => unregister(id),
    } as E

    const ticket = reactive ? shallowReactive(input) : input

    collection.set(ticket.id, ticket)
    directory.set(ticket.index, ticket.id)

    catalog.assign(ticket.value, ticket.id)
    invalidate()
    emit('register:ticket', ticket)

    return ticket
  }

  function unregister(id: ID) {
    const ticket = collection.get(id)

    if (!ticket) return

    if (ticket.valueIsIndex) {
      indexDependentCount--
    }

    collection.delete(ticket.id)
    directory.delete(ticket.index)
    catalog.unassign(ticket.value, ticket.id)

    const willReindex = indexDependentCount > 0 && ticket.index < collection.size
    if (!willReindex) invalidate()

    minDirtyIndex = Math.min(minDirtyIndex, ticket.index)
    if (willReindex) {
      reindex()
    } else {
      needsReindex = true
    }

    emit('unregister:ticket', ticket)
  }

  function onboard(registrations: Partial<Z & RegistryTicket>[]) {
    return batch(() => registrations.map(registration => register(registration)))
  }

  function offboard(ids: ID[]): Partial<Z>[] {
    const removed: E[] = []

    batch(() => {
      for (const id of ids) {
        const ticket = collection.get(id)
        if (!ticket) continue

        if (ticket.valueIsIndex) {
          indexDependentCount--
        }

        minDirtyIndex = Math.min(minDirtyIndex, ticket.index)
        collection.delete(ticket.id)
        directory.delete(ticket.index)
        catalog.unassign(ticket.value, ticket.id)
        removed.push(ticket)
      }

      if (removed.length === 0) return

      for (const ticket of removed) {
        emit('unregister:ticket', ticket)
      }

      needsReindex = true
    })

    return removed.map(ticket => toTicketInput<Z>(ticket))
  }

  function move(id: ID, toIndex: number): E | undefined {
    if (needsReindex) reindex()

    const ticket = collection.get(id)
    if (!ticket) return undefined

    const target = clamp(toIndex, 0, collection.size - 1)

    if (ticket.index === target) return ticket

    return batch(() => {
      const items = Array.from(collection.entries())
      const fromIndex = items.findIndex(([key]) => key === id)
      const [entry] = items.splice(fromIndex, 1)

      items.splice(target, 0, entry!)

      collection.clear()
      for (const [key, value] of items) {
        collection.set(key, value)
      }

      minDirtyIndex = Math.min(ticket.index, target)
      reindex()
      emit('update:ticket', ticket)

      return ticket
    })
  }

  function reorder(ids: ID[]): void {
    if (needsReindex) reindex()

    if (ids.length !== collection.size) return

    const seen = new Set<ID>()
    const entries: [ID, E][] = []
    for (const id of ids) {
      if (seen.has(id)) return
      const ticket = collection.get(id)
      if (!ticket) return
      seen.add(id)
      entries.push([id, ticket])
    }

    batch(() => {
      collection.clear()
      for (const [id, ticket] of entries) {
        collection.set(id, ticket)
      }
      minDirtyIndex = 0
      reindex()
    })
  }

  function seek(
    direction: 'first' | 'last' = 'first',
    from?: number,
    predicate?: (ticket: E) => boolean,
  ): E | undefined {
    if (collection.size === 0) return undefined

    if (needsReindex) reindex()

    return seekTicket(snapshots.values(), direction, from, predicate)
  }

  return {
    collection: collection as ReadonlyMap<ID, E>,
    emit,
    on: bus.on,
    off: bus.off,
    dispose,
    has,
    keys: snapshots.keys,
    clear,
    browse,
    entries: snapshots.entries,
    values: snapshots.values,
    lookup,
    get,
    upsert,
    register,
    unregister,
    reindex,
    move,
    reorder,
    seek,
    batch,
    onboard,
    offboard,
    get size() {
      return collection.size
    },
  } as RegistryContext<Z, E>
}
