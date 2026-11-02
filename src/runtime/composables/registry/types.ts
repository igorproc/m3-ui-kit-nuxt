/**
 * @module registry/types
 *
 * Public shapes of the ticket registry (`createRegistry`) and its event bus.
 */
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
