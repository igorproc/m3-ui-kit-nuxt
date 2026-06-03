/**
 * @module useGlobalListener
 *
 * @remarks
 * Delegated global `window`/`document` subscription registry — the kit's
 * "event-subscription store" requirement implemented as a **module singleton**
 * (no new Pinia store, per `plan.md`).
 *
 * Many consumers (open menus, sheets, sliders mid-drag…) often need the same
 * global event (`scroll`, `resize`, `pointermove`). Instead of each attaching
 * its own `addEventListener`, they subscribe here: the registry keeps exactly
 * **one** real DOM listener per `target+event+options` and fans it out to every
 * subscriber. The master listener is removed automatically once the last
 * subscriber unsubscribes.
 *
 * A master listener cannot use {@link useEventListener} because its lifetime
 * spans many independent component scopes (it must outlive the first
 * subscriber's unmount), so the registry manages the raw listener directly.
 * Per-consumer cleanup, however, is automatic: subscribing inside a component
 * scope auto-unsubscribes on unmount.
 *
 * @example
 * ```ts
 * // inside a component setup
 * useGlobalListener('window', 'scroll', () => reposition(), { passive: true })
 * ```
 */
import { getCurrentScope, onScopeDispose } from 'vue'
import { IN_BROWSER } from '~~/shared/constants/globals'
import type { EventHandler } from './useEventListener'

export type GlobalListenerTarget = 'window' | 'document'

interface Subscription {
  handlers: Set<EventHandler>
  remove: () => void
}

// One entry per `${target}:${event}:${optionsKey}` — shared across all consumers.
const registry = new Map<string, Subscription>()

function resolveTarget(target: GlobalListenerTarget): Window | Document {
  return target === 'window' ? window : document
}

function optionsKey(options?: boolean | AddEventListenerOptions): string {
  if (options == null) return ''
  if (typeof options === 'boolean') return `capture=${options}`
  const { capture, passive, once } = options
  return `capture=${!!capture}&passive=${!!passive}&once=${!!once}`
}

/**
 * Subscribes `handler` to a global `target`/`event`, sharing one underlying DOM
 * listener with every other subscriber of the same event+options.
 *
 * @returns A `stop` function that unsubscribes (also called automatically on
 * scope dispose when used inside a component).
 */
export function useGlobalListener(
  target: GlobalListenerTarget,
  event: string,
  handler: EventHandler,
  options?: boolean | AddEventListenerOptions,
): () => void {
  // SSR: no global targets — return a no-op so callers stay agnostic.
  if (!IN_BROWSER) return () => {}

  const key = `${target}:${event}:${optionsKey(options)}`

  let subscription = registry.get(key)
  if (!subscription) {
    const handlers = new Set<EventHandler>()
    const el = resolveTarget(target)
    const master: EventHandler = (e) => {
      // Snapshot so a handler unsubscribing mid-dispatch can't skip siblings.
      for (const fn of [...handlers]) {
        fn(e)
      }
    }
    el.addEventListener(event, master, options)
    subscription = {
      handlers,
      remove: () => el.removeEventListener(event, master, options),
    }
    registry.set(key, subscription)
  }

  subscription.handlers.add(handler)

  let stopped = false
  function stop() {
    if (stopped) return
    stopped = true
    const current = registry.get(key)
    if (!current) return
    current.handlers.delete(handler)
    if (current.handlers.size === 0) {
      current.remove()
      registry.delete(key)
    }
  }

  if (getCurrentScope()) {
    onScopeDispose(stop, true)
  }

  return stop
}
