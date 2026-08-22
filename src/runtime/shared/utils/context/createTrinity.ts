/**
 * @module createTrinity
 *
 * @remarks
 * Factory for the "trinity" tuple `[useContext, provideContext, defaultContext]`
 * ported from `@vuetify/v0`. Foundational to every registry-based composable:
 * it pairs a `createContext` provide/inject with a default context instance so a
 * consumer falls back to a shared default when no ancestor provides one.
 *
 * @example
 * ```ts
 * const [useMy, provideMy, defaultMy] = createTrinity('m3:my', { foo: 'bar' })
 * ```
 */
import type { App } from 'vue'
import { createContext } from './createContext'
import { isString } from '../guards/guards'

export type ContextTrinity<Z = unknown> = readonly [
  () => Z,
  (context?: Z, app?: App) => Z,
  Z,
]

/**
 * Creates a trinity from a context key + default context.
 */
export function createTrinity<Z = unknown>(
  key: string,
  context: Z,
): ContextTrinity<Z>
/**
 * Creates a trinity from explicit `useContext`/`provideContext` fns + default.
 */
export function createTrinity<Z = unknown>(
  useContext: () => Z,
  provideContext: (context: Z, app?: App) => Z,
  context: Z,
): ContextTrinity<Z>
export function createTrinity<Z = unknown>(
  keyOrUseContext: string | (() => Z),
  provideContextOrContext: ((context: Z, app?: App) => Z) | Z,
  maybeContext?: Z,
): ContextTrinity<Z> {
  if (isString(keyOrUseContext)) {
    const [useContext, provideContext] = createContext<Z>(keyOrUseContext)
    const context = provideContextOrContext as Z

    return [
      useContext,
      (_context: Z = context, app?: App): Z => provideContext(_context, app),
      context,
    ] as const
  }

  const provideContext = provideContextOrContext as (context: Z, app?: App) => Z
  const context = maybeContext as Z

  return [
    keyOrUseContext,
    (_context: Z = context, app?: App): Z => provideContext(_context, app),
    context,
  ] as const
}
