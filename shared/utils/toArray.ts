/**
 * @module toArray
 *
 * @remarks
 * Normalises a value (or array of values) into an array. Ported from
 * `@vuetify/v0`; used by the event-listener primitives to accept either a
 * single event/listener or a list.
 */
export type MaybeArray<T> = T | T[]

/**
 * Wraps a scalar in an array, or returns the array as-is.
 */
export function toArray<T>(value: MaybeArray<T>): T[] {
  return Array.isArray(value) ? value : [value]
}
