/**
 * @module createRegistry
 *
 * @remarks
 * Foundational ticket registry ported 1:1 from `@vuetify/v0` (semantics
 * preserved; verbose per-symbol JSDoc condensed). Manages a collection of
 * tickets with id-based access, index ordering/reindexing, value reverse-lookup,
 * a small event bus, and per-iteration caching. It is the substrate the
 * selection chain (`createModel` → `createSelection` → `createGroup`/
 * `createSingle`) extends via spread.
 *
 * Differences from v0: `useLogger` → the kit logger shim; `__DEV__` →
 * `import.meta.dev`; default namespace `m3:registry`. The event subsystem is
 * kept — `useProxyRegistry` (used by `createGroup`) subscribes to it.
 *
 * @example
 * ```ts
 * const registry = createRegistry()
 * const ticket = registry.register({ value: 'item-1' })
 * registry.size // 1
 * registry.unregister(ticket.id)
 * ```
 */
import { shallowReactive, useId } from 'vue'
import { useContext } from '#kit/shared/utils/context/createContext'
import { createTrinity } from '#kit/shared/utils/context/createTrinity'
import type { ContextTrinity } from '#kit/shared/utils/context/createTrinity'
import { useLogger } from '#kit/shared/utils/logger'
import { clamp } from '#kit/shared/utils/helpers'
import { isUndefined } from '#kit/shared/utils/guards/guards'
import type { Extensible, ID } from '#kit/shared/types/registry'

/** User-facing input shape for registry tickets. */
export interface RegistryTicketInput<V = unknown> {
  /** Unique identifier. Auto-generated if omitted. */
  id?: ID
  /** Associated value. Defaults to the ticket index when omitted. */
  value?: V
}

/** Output ticket shape returned by `get()`/`values()`. */
export interface RegistryTicket<V = unknown> {
  id: ID
  /** Position in the registry. Managed automatically. */
  index: number
  value: V
  /** Whether `value` was derived from `index` (no explicit value supplied). */
  valueIsIndex: boolean
  /** Remove this ticket — sugar for `registry.unregister(ticket.id)`. */
  unregister: () => void
}

/** Valid event names for registry operations. */
export type RegistryEventName
  = | 'register:ticket'
    | 'unregister:ticket'
    | 'update:ticket'
    | 'clear:registry'
    | 'reindex:registry'

/** Maps event names to their payload types. */
export type RegistryEventMap<Z extends RegistryTicket> = {
  'register:ticket': Z
  'unregister:ticket': Z
  'update:ticket': Z
  'clear:registry': undefined
  'reindex:registry': undefined
}

export type RegistryEventCallback<
  Z extends RegistryTicket = RegistryTicket,
  K extends Extensible<RegistryEventName> = Extensible<RegistryEventName>,
> = K extends RegistryEventName
  ? (data: RegistryEventMap<Z>[K]) => void
  : (data: unknown) => void

type EventPayload<Z extends RegistryTicket, K extends string>
  = K extends RegistryEventName
    ? RegistryEventMap<Z>[K]
    : unknown

type InternalEventCallback = (data: unknown) => void

export interface RegistryContext<
  Z extends RegistryTicketInput = RegistryTicketInput,
  E extends RegistryTicket & Z = RegistryTicket & Z,
> {
  /** Read-only view of the internal collection. */
  collection: ReadonlyMap<ID, E>
  /** Remove all tickets. */
  clear: () => void
  /** Whether a ticket exists by id. */
  has: (id: ID) => boolean
  /** All registered ids (cached). */
  keys: () => readonly ID[]
  /** Ids that share `value`, or undefined. */
  browse: (value: E['value']) => readonly ID[] | undefined
  /** Id at `index`, or undefined. */
  lookup: (index: number) => ID | undefined
  /** Ticket by id, or undefined. */
  get: (id: ID) => E | undefined
  /** Update or insert a ticket by id. */
  upsert: (id: ID, ticket?: Partial<Z>, event?: string) => E
  /** All ticket values (cached). */
  values: () => readonly E[]
  /** All `[id, ticket]` entries (cached). */
  entries: () => readonly [ID, E][]
  /** Register a new ticket. */
  register: (ticket?: Partial<Z & RegistryTicket>) => E
  /** Unregister a ticket by id and reindex. */
  unregister: (id: ID) => void
  /** Rebuild index mapping and refresh ticket indexes. */
  reindex: () => void
  /** Move a ticket to a new index (clamped). */
  move: (id: ID, toIndex: number) => E | undefined
  /** Reorder the registry to a canonical permutation of ids in one pass. */
  reorder: (ids: ID[]) => void
  /** Scan for a ticket by direction/offset/predicate. */
  seek: (direction?: 'first' | 'last', from?: number, predicate?: (ticket: E) => boolean) => E | undefined
  /** Subscribe to a registry event (requires `events: true`). */
  on: <K extends Extensible<RegistryEventName>>(event: K, cb: RegistryEventCallback<E, K>) => void
  /** Unsubscribe from a registry event. */
  off: <K extends Extensible<RegistryEventName>>(event: K, cb: RegistryEventCallback<E, K>) => void
  /** Emit an event with data. */
  emit: <K extends Extensible<RegistryEventName>>(event: K, data: EventPayload<E, K>) => void
  /** Clear the registry and remove all listeners. */
  dispose: () => void
  /** Register many tickets in one batch. */
  onboard: (registrations: Partial<Z & RegistryTicket>[]) => E[]
  /** Unregister many tickets, returning their input shapes. */
  offboard: (ids: ID[]) => Partial<Z>[]
  /** Number of tickets. */
  size: number
  /** Run operations in a batch, deferring invalidation/events to the end. */
  batch: <R>(fn: () => R) => R
}

export interface RegistryOptions {
  /** Enable the event bus (`on`/`off`/`emit`). @default false */
  events?: boolean
  /** Track the collection with `shallowReactive`. @default false */
  reactive?: boolean
}

export interface RegistryContextOptions extends RegistryOptions {
  namespace?: string
}

/**
 * Creates a new registry instance.
 */
export function createRegistry<
  Z extends RegistryTicketInput = RegistryTicketInput,
  E extends RegistryTicket & Z = RegistryTicket & Z,
>(options?: RegistryOptions): RegistryContext<Z, E> {
  const logger = useLogger()

  const events = options?.events ?? false
  const reactive = options?.reactive ?? false

  const collection = reactive ? shallowReactive(new Map<ID, E>()) : new Map<ID, E>()
  const catalog = new Map<unknown, ID[]>()
  const directory = new Map<number, ID>()
  const cache = new Map<'keys' | 'values' | 'entries', unknown[]>()
  const listeners = new Map<string, Set<InternalEventCallback>>()

  let indexDependentCount = 0
  let needsReindex = false
  let minDirtyIndex = Infinity
  let isBatching = false
  let batched: Array<{ event: string, data: unknown }> = []

  function dispatch(event: string, data: unknown) {
    const cbs = listeners.get(event)
    if (!cbs) return
    for (const cb of cbs) cb(data)
  }

  function emit(event: string, data: unknown = undefined) {
    if (!events) return

    if (isBatching) {
      batched.push({ event, data })
      return
    }

    dispatch(event, data)
  }

  function on(event: string, cb: InternalEventCallback) {
    if (!events) {
      logger.warn(`Events are disabled. Initialize with \`createRegistry({ events: true })\` to enable.`)
      return
    }

    if (!listeners.has(event)) listeners.set(event, new Set())
    const cbs = listeners.get(event)!
    cbs.add(cb)

    if (import.meta.dev && cbs.size === 101) {
      logger.warn(`Event "${event}" has ${cbs.size} listeners. Possible memory leak.`)
    }
  }

  function off(event: string, cb: InternalEventCallback) {
    if (!events) {
      logger.warn(`Events are disabled. Initialize with \`createRegistry({ events: true })\` to enable.`)
      return
    }
    listeners.get(event)?.delete(cb)
  }

  function dispose() {
    listeners.clear()
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
        unassign(existing.value, id)
        assign(value, id)
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
    const bucket = catalog.get(value)
    return bucket ? bucket.slice() : undefined
  }

  function lookup(index: number) {
    if (needsReindex) reindex()
    return directory.get(index)
  }

  function has(id: ID) {
    return collection.has(id)
  }

  function assign(value: unknown, id: ID) {
    const bucket = catalog.get(value)
    if (bucket) {
      if (!bucket.includes(id)) bucket.push(id)
    } else {
      catalog.set(value, [id])
    }
  }

  function unassign(value: unknown, id: ID) {
    const bucket = catalog.get(value)
    if (!bucket) return

    const next = bucket.filter(v => v !== id)
    if (next.length === 0) catalog.delete(value)
    else catalog.set(value, next)
  }

  function keys(): readonly ID[] {
    if (reactive) return Array.from(collection.keys())

    const cached = cache.get('keys')
    if (!isUndefined(cached)) return cached as readonly ID[]

    const out = Array.from(collection.keys())

    cache.set('keys', out)

    return out
  }

  function values(): readonly E[] {
    if (reactive) return Array.from(collection.values())

    const cached = cache.get('values')
    if (!isUndefined(cached)) return cached as readonly E[]

    const out = Array.from(collection.values())

    cache.set('values', out)

    return out
  }

  function entries(): readonly [ID, E][] {
    if (reactive) return Array.from(collection.entries())

    const cached = cache.get('entries')
    if (!isUndefined(cached)) return cached as readonly [ID, E][]

    const out = Array.from(collection.entries())

    cache.set('entries', out)

    return out
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
    if (isBatching) return
    cache.clear()
  }

  function batch<R>(fn: () => R): R {
    if (isBatching) return fn()

    isBatching = true
    batched = []

    try {
      const result = fn()

      cache.clear()

      for (const { event, data } of batched) {
        dispatch(event, data)
      }

      return result
    } finally {
      isBatching = false
      batched = []
    }
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
          unassign(ticket.value, ticket.id)
        }
        ticket.value = index
        assign(ticket.value, ticket.id)
      } else if (startIndex === 0) {
        assign(ticket.value, ticket.id)
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
    const id = registration.id ?? useId()

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

    assign(ticket.value, ticket.id)
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
    unassign(ticket.value, ticket.id)

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

  // Strip registry-managed fields to recover a ticket's input shape. `id` is
  // dropped only when auto-generated (valueIsIndex), so a receiving registry can
  // assign a fresh one.
  function toInput(ticket: E): Partial<Z> {
    const input = { ...ticket } as Record<string, unknown>
    delete input.index
    delete input.valueIsIndex
    delete input.unregister
    if (ticket.valueIsIndex) {
      delete input.id
      delete input.value
    }
    return input as Partial<Z>
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
        unassign(ticket.value, ticket.id)
        removed.push(ticket)
      }

      if (removed.length === 0) return

      for (const ticket of removed) {
        emit('unregister:ticket', ticket)
      }

      needsReindex = true
    })

    return removed.map(ticket => toInput(ticket))
  }

  function move(id: ID, toIndex: number): E | undefined {
    if (needsReindex) reindex()

    const ticket = collection.get(id)
    if (!ticket) return undefined

    const size = collection.size
    const target = clamp(toIndex, 0, size - 1)

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

    // Fast path: simple first/last without predicate or offset.
    if (!predicate && isUndefined(from)) {
      const tickets = values()
      return direction === 'first' ? tickets[0] : tickets.at(-1)
    }

    const tickets = values()
    const index = isUndefined(from) ? undefined : clamp(from, 0, tickets.length - 1)

    if (direction === 'last') {
      const start = isUndefined(index) ? tickets.length - 1 : index
      for (let i = start; i >= 0; i--) {
        const ticket = tickets[i]!
        if (!predicate || predicate(ticket)) return ticket
      }
    } else {
      const start = isUndefined(index) ? 0 : index
      for (let i = start; i < tickets.length; i++) {
        const ticket = tickets[i]!
        if (!predicate || predicate(ticket)) return ticket
      }
    }

    return undefined
  }

  return {
    collection: collection as ReadonlyMap<ID, E>,
    emit,
    on,
    off,
    dispose,
    has,
    keys,
    clear,
    browse,
    entries,
    values,
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

/**
 * Creates a registry context trinity for provide/inject usage.
 */
export function createRegistryContext<
  Z extends RegistryTicketInput = RegistryTicketInput,
  E extends RegistryTicket & Z = RegistryTicket & Z,
>(_options: RegistryContextOptions = {}): ContextTrinity<RegistryContext<Z, E>> {
  const { namespace = 'm3:registry', ...options } = _options

  const context = createRegistry<Z, E>(options)

  return createTrinity<RegistryContext<Z, E>>(namespace, context)
}

/**
 * Injects an existing registry from context.
 */
export function useRegistry<
  Z extends RegistryTicketInput = RegistryTicketInput,
  E extends RegistryTicket & Z = RegistryTicket & Z,
>(namespace = 'm3:registry'): RegistryContext<Z, E> {
  return useContext<RegistryContext<Z, E>>(namespace)
}
