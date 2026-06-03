/**
 * @module helpers
 *
 * @remarks
 * Small pure helpers ported from `@vuetify/v0`'s `utilities` that the registry
 * chain depends on. Kept dependency-light (only `guards`).
 */
import { isUndefined } from './guards'
import type { ID } from '../types/registry'

/**
 * Clamps `value` into the `[min, max]` range. Non-finite input returns `min`.
 */
export function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

/**
 * Resolves an iterable of ids to their defined values via `getter`,
 * dropping ids that no longer resolve.
 */
export function resolveIds<E>(ids: Iterable<ID>, getter: (id: ID) => E | undefined): E[] {
  return Array.from(ids)
    .map(id => getter(id))
    .filter((item): item is E => !isUndefined(item))
}

/**
 * Extracts the defined `index` values from an iterable of items.
 */
export function resolveIndexes(items: Iterable<{ index?: number }>): number[] {
  return Array.from(items)
    .map(item => item?.index)
    .filter((index): index is number => !isUndefined(index))
}
