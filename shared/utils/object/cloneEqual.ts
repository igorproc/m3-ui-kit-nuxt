import { toRaw } from 'vue'

function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
  if (!value || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function clonePlainData<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(toRaw(value))
    } catch {
      // Vue proxies and environment-specific objects fall through to the
      // explicit plain-data clone below, which gives a clearer type boundary.
    }
  }
  if (Array.isArray(value)) return value.map(clonePlainData) as T
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, clonePlainData(entry)])) as T
  }
  if (value === null || typeof value !== 'object') return value
  throw new TypeError('[m-confirm-edit] non-plain values require an explicit clone function')
}

export function equalPlainData(left: unknown, right: unknown, seen = new WeakMap<object, object>()): boolean {
  if (Object.is(left, right)) return true
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false
  if (seen.get(left) === right) return true
  seen.set(left, right)
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false
    return left.every((entry, index) => equalPlainData(entry, right[index], seen))
  }
  if (!isPlainObject(left) || !isPlainObject(right)) return false
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  return leftKeys.length === rightKeys.length
    && leftKeys.every(key => Object.hasOwn(right, key) && equalPlainData(left[key], right[key], seen))
}
