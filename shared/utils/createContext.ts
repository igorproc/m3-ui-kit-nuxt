/**
 * @module createContext
 *
 * @remarks
 * Type-safe wrapper around Vue's `provide`/`inject`, ported from `@vuetify/v0`.
 * Throws on a missing context instead of silently returning `undefined`, which
 * makes parent↔children coordination (tabs, radio-group, accordion, menus, …)
 * safe to rely on.
 *
 * Two modes:
 * - **Static key**: `createContext('m3:tabs')` — key fixed at creation time.
 * - **Dynamic key**: `createContext()` / `createContext({ suffix: 'item' })` —
 *   key passed at runtime (for per-instance namespacing).
 *
 * ⚠ **Scope: component-local coordination only.** Never use this for theme —
 * there is exactly one global theme (the Pinia `app/store/theme.ts`). Per-tree
 * theme provision is explicitly forbidden (see `plan.md` guardrails).
 *
 * @example
 * ```ts
 * const [useTabs, provideTabs] = createContext<TabsContext>('m3:tabs')
 *
 * // parent
 * provideTabs({ select, selectedId })
 * // child
 * const tabs = useTabs()
 * ```
 */
import { inject, provide } from 'vue'
import type { App, InjectionKey } from 'vue'
import { isObject, isString, isSymbol, isUndefined } from './guards'

export type ContextKey<Z> = InjectionKey<Z> | string

export interface CreateContextOptions {
  /** Optional suffix appended to the runtime key (`key:suffix`). */
  suffix?: string
}

/**
 * Injects a context provided by an ancestor.
 *
 * @throws When the context is not found and no default is supplied.
 */
export function useContext<Z>(key: ContextKey<Z>, defaultValue?: Z): Z {
  const context = inject<Z>(key, defaultValue as Z)

  if (isUndefined(context)) {
    throw new Error(`Context "${String(key)}" not found. Ensure it's provided by an ancestor.`)
  }

  return context
}

/**
 * Provides a context to all descendants (or app-wide when `app` is passed).
 */
export function provideContext<Z>(key: ContextKey<Z>, context: Z, app?: App): Z {
  if (app) {
    app.provide(key, context)
  } else {
    provide(key, context)
  }

  return context
}

/**
 * Creates a typed provide/inject pair.
 *
 * @returns `[useContext, provideContext]`.
 */
export function createContext<Z>(key: ContextKey<Z>, defaultValue?: Z): readonly [
  () => Z,
  (context: Z, app?: App) => Z,
]
export function createContext<Z>(options?: CreateContextOptions): readonly [
  (key: string, defaultValue?: Z) => Z,
  (key: string, context: Z, app?: App) => Z,
]
export function createContext<Z>(
  keyOrOptions?: ContextKey<Z> | CreateContextOptions,
  defaultValue?: Z,
) {
  // Static key mode: createContext('m3:tabs') or createContext(Symbol())
  if (isString(keyOrOptions) || isSymbol(keyOrOptions)) {
    if (import.meta.dev && isString(keyOrOptions) && !keyOrOptions.includes(':')) {
      console.warn(
        `[m3:context] String key "${keyOrOptions}" has no namespace separator. `
        + `Use "namespace:key" format (e.g. "m3:tabs") to prevent collisions.`,
      )
    }
    const _key = keyOrOptions as ContextKey<Z>

    function _provideContext(context: Z, app?: App) {
      return provideContext<Z>(_key, context, app)
    }

    function _useContext() {
      return useContext<Z>(_key, defaultValue)
    }

    return [_useContext, _provideContext] as const
  }

  // Dynamic key mode: createContext() or createContext({ suffix: 'item' })
  const suffix = isObject(keyOrOptions) ? keyOrOptions.suffix as string | undefined : undefined

  function _provideContext(key: string, context: Z, app?: App) {
    const resolved = suffix ? `${key}:${suffix}` : key
    return provideContext<Z>(resolved, context, app)
  }

  function _useContext(key: string, defaultValue?: Z) {
    const resolved = suffix ? `${key}:${suffix}` : key
    return useContext<Z>(resolved, defaultValue)
  }

  return [_useContext, _provideContext] as const
}
