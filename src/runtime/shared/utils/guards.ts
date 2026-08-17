/**
 * @module guards
 *
 * @remarks
 * Minimal runtime type guards ported from `@vuetify/v0` (`#v0/utilities`).
 * Kept dependency-free so they can live at the very bottom of the kit's
 * import graph (consumed by `createContext`, overlay primitives, etc.).
 */

/**
 * Narrows a value to `string`.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Narrows a value to `symbol`.
 */
export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol'
}

/**
 * Narrows a value to a non-null plain `object` (excludes arrays and `null`).
 */
export function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Narrows a value to `undefined`.
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}

/**
 * Narrows a value to `null`.
 */
export function isNull(value: unknown): value is null {
  return value === null
}

/**
 * Narrows a value to `null` or `undefined`.
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Narrows a value to a callable.
 */
export function isFunction(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === 'function'
}

/**
 * Narrows a value to a DOM `Element` (SSR-safe — `false` when `Element` is undefined).
 */
export function isElement(value: unknown): value is Element {
  return typeof Element !== 'undefined' && value instanceof Element
}
