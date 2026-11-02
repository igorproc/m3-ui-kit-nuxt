/**
 * @module registry/internals
 *
 * Building blocks `createRegistry` composes: the event bus with batching, the
 * cached keys/values/entries snapshots, the value → ids reverse lookup and the
 * pure ticket helpers. Not part of the public surface.
 */
import { getCurrentInstance, useId } from 'vue'
import { clamp } from '#kit/shared/utils/helpers'
import { isUndefined } from '#kit/shared/utils/guards/guards'
import type { Logger } from '#kit/shared/utils/logger'
import type { ID } from '#kit/shared/types/registry'
import type { RegistryTicket } from '#kit/composables/registry/types'

type EventCallback = (data: unknown) => void

/**
 * Id source for registrations that name no id. In a component's setup the id
 * comes from `useId()`, so server and client agree. A registration made later —
 * a watcher adding an item — runs outside any instance, where `useId()` returns
 * `''` for every call and the second ticket would collide with the first; it
 * takes this source's prefix (an SSR-stable id of the creating component) and
 * a counter instead.
 */
export function createTicketIds(): (id: ID | undefined) => ID {
  const prefix = getCurrentInstance() ? useId() : 'm3-ticket'
  let late = 0

  return id => id ?? (getCurrentInstance() ? useId() : `${prefix}-${++late}`)
}

const EVENTS_DISABLED = 'Events are disabled. Initialize with `createRegistry({ events: true })` to enable.'

/**
 * Event bus whose events can be held: inside `hold()` they queue and go out
 * together once the outermost call returns.
 */
export function createEventBus(enabled: boolean, logger: Logger) {
  const listeners = new Map<string, Set<EventCallback>>()
  let holding = false
  let held: Array<{ event: string, data: unknown }> = []

  function dispatch(event: string, data: unknown) {
    const callbacks = listeners.get(event)
    if (!callbacks) return
    for (const callback of callbacks) callback(data)
  }

  function emit(event: string, data: unknown = undefined) {
    if (!enabled) return

    if (holding) {
      held.push({ event, data })
      return
    }

    dispatch(event, data)
  }

  function on(event: string, callback: EventCallback) {
    if (!enabled) {
      logger.warn(EVENTS_DISABLED)
      return
    }

    if (!listeners.has(event)) listeners.set(event, new Set())
    const callbacks = listeners.get(event)!
    callbacks.add(callback)

    if (import.meta.dev && callbacks.size === 101) {
      logger.warn(`Event "${event}" has ${callbacks.size} listeners. Possible memory leak.`)
    }
  }

  function off(event: string, callback: EventCallback) {
    if (!enabled) {
      logger.warn(EVENTS_DISABLED)
      return
    }
    listeners.get(event)?.delete(callback)
  }

  /** Runs `fn` with events held; `beforeFlush` runs once, right before they go out. */
  function hold<R>(fn: () => R, beforeFlush: () => void): R {
    if (holding) return fn()

    holding = true
    held = []

    try {
      const result = fn()

      beforeFlush()

      for (const { event, data } of held) {
        dispatch(event, data)
      }

      return result
    } finally {
      holding = false
      held = []
    }
  }

  return {
    emit,
    on,
    off,
    hold,
    clear: () => listeners.clear(),
    get holding() {
      return holding
    },
  }
}

/**
 * Cached `keys()` / `values()` / `entries()` arrays of a collection. A reactive
 * collection is read fresh every time so the read stays tracked.
 */
export function createSnapshots<E>(collection: Map<ID, E>, reactive: boolean) {
  const cache = new Map<'keys' | 'values' | 'entries', unknown[]>()

  function read<T>(key: 'keys' | 'values' | 'entries', build: () => T[]): readonly T[] {
    if (reactive) return build()

    const cached = cache.get(key)
    if (!isUndefined(cached)) return cached as readonly T[]

    const out = build()
    cache.set(key, out)
    return out
  }

  return {
    keys: () => read('keys', () => Array.from(collection.keys())),
    values: () => read('values', () => Array.from(collection.values())),
    entries: () => read('entries', () => Array.from(collection.entries())),
    clear: () => cache.clear(),
  }
}

/** Reverse lookup: the ids registered under each value, in registration order. */
export function createValueCatalog() {
  const buckets = new Map<unknown, ID[]>()

  function assign(value: unknown, id: ID) {
    const bucket = buckets.get(value)
    if (bucket) {
      if (!bucket.includes(id)) bucket.push(id)
    } else {
      buckets.set(value, [id])
    }
  }

  function unassign(value: unknown, id: ID) {
    const bucket = buckets.get(value)
    if (!bucket) return

    const next = bucket.filter(v => v !== id)
    if (next.length === 0) buckets.delete(value)
    else buckets.set(value, next)
  }

  function browse(value: unknown) {
    const bucket = buckets.get(value)
    return bucket ? bucket.slice() : undefined
  }

  return { assign, unassign, browse, clear: () => buckets.clear() }
}

/**
 * First ticket matching `predicate` scanning from `from` (clamped) towards the
 * end (`first`) or the start (`last`); without both, simply the first or last.
 */
export function seekTicket<E>(
  tickets: readonly E[],
  direction: 'first' | 'last',
  from?: number,
  predicate?: (ticket: E) => boolean,
): E | undefined {
  if (!predicate && isUndefined(from)) {
    return direction === 'first' ? tickets[0] : tickets.at(-1)
  }

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

/**
 * A ticket's input shape with the registry-managed fields stripped. When the
 * value was derived from the index, `id` and `value` go too, so a receiving
 * registry assigns fresh ones.
 */
export function toTicketInput<Z>(ticket: RegistryTicket & Z): Partial<Z> {
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
