/**
 * @module useEventListener
 *
 * @remarks
 * Event-listener composable with automatic cleanup on scope disposal, ported
 * from `@vuetify/v0`. Replaces hand-rolled `addEventListener`/`removeEventListener`
 * pairs scattered across the kit's overlay components.
 *
 * Key features:
 * - `Window` / `Document` / `HTMLElement` / `EventTarget` targets
 * - reactive targets, events and listeners (re-binds on change)
 * - event-options support (capture, passive, once)
 * - automatic `removeEventListener` on `onScopeDispose`
 * - SSR-safe window/document helpers via `IN_BROWSER`
 *
 * @example
 * ```ts
 * useEventListener(window, 'resize', () => console.log('resized'))
 * ```
 */
import { onScopeDispose, toValue, unref, watch } from 'vue'
import type { MaybeRef, MaybeRefOrGetter } from 'vue'
import { IN_BROWSER } from '~~/shared/constants/globals'
import { toArray } from '~~/shared/utils/toArray'
import type { MaybeArray } from '~~/shared/utils/toArray'

export type CleanupFunction = () => void
export type EventHandler<E = Event> = (event: E) => void

export function useEventListener<E extends keyof WindowEventMap>(
  target: Window,
  event: MaybeRefOrGetter<MaybeArray<E>>,
  listener: MaybeRef<MaybeArray<(this: Window, event: WindowEventMap[E]) => void>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): CleanupFunction

export function useEventListener<E extends keyof DocumentEventMap>(
  target: Document,
  event: MaybeRefOrGetter<MaybeArray<E>>,
  listener: MaybeRef<MaybeArray<(this: Document, event: DocumentEventMap[E]) => void>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): CleanupFunction

export function useEventListener<E extends keyof HTMLElementEventMap>(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  event: MaybeRefOrGetter<MaybeArray<E>>,
  listener: MaybeRef<MaybeArray<(this: HTMLElement, event: HTMLElementEventMap[E]) => void>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): CleanupFunction

export function useEventListener<EventType = Event>(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: MaybeRefOrGetter<MaybeArray<string>>,
  listener: MaybeRef<MaybeArray<EventHandler<EventType>>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): CleanupFunction

export function useEventListener(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: MaybeRefOrGetter<MaybeArray<string>>,
  listener: MaybeRef<MaybeArray<EventHandler>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): CleanupFunction {
  const cleanups: CleanupFunction[] = []

  function cleanup() {
    for (const fn of cleanups) {
      fn()
    }
    cleanups.length = 0
  }

  function register(
    el: EventTarget,
    event: string,
    listener: EventHandler,
    options?: boolean | AddEventListenerOptions,
  ) {
    el.addEventListener(event, listener, options)
    return () => el.removeEventListener(event, listener, options)
  }

  const stopWatcher = watch(
    () => [toValue(target), toValue(event), unref(listener), toValue(options)] as const,
    ([el, events, listeners, opts]) => {
      cleanup()
      if (!el) return

      const eventList = toArray(events)
      const listenerList = toArray(listeners)

      for (const event of eventList) {
        for (const listenerFn of listenerList) {
          cleanups.push(register(el, event, listenerFn, opts))
        }
      }
    },
    { immediate: true, flush: 'post' },
  )

  function stop() {
    stopWatcher()
    cleanup()
  }

  onScopeDispose(stop, true)

  return stop
}

/**
 * Attaches a `window` listener (SSR no-op).
 */
export function useWindowEventListener<E extends keyof WindowEventMap>(
  event: MaybeRefOrGetter<MaybeArray<E>>,
  listener: MaybeRef<MaybeArray<(this: Window, event: WindowEventMap[E]) => void>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): CleanupFunction {
  return IN_BROWSER ? useEventListener(window, event, listener, options) : () => {}
}

/**
 * Attaches a `document` listener (SSR no-op).
 */
export function useDocumentEventListener<E extends keyof DocumentEventMap>(
  event: MaybeRefOrGetter<MaybeArray<E>>,
  listener: MaybeRef<MaybeArray<(this: Document, event: DocumentEventMap[E]) => void>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): CleanupFunction {
  return IN_BROWSER ? useEventListener(document, event, listener, options) : () => {}
}
