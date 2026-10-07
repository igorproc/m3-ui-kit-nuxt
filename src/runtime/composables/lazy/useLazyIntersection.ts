import { onScopeDispose, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'

export interface LazyIntersectionOptions {
  rootMargin: string
  threshold: number | number[]
}

export type LazyIntersectionCallback = (entry: IntersectionObserverEntry) => void

interface SharedObserver {
  observer: IntersectionObserver
  targets: Map<Element, Set<LazyIntersectionCallback>>
}

const observers = new Map<string, SharedObserver>()

function lazyIntersectionKey(options: LazyIntersectionOptions): string {
  const thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold]

  return `${options.rootMargin}|${thresholds.join(',')}`
}

function createSharedObserver(options: LazyIntersectionOptions): SharedObserver {
  const targets = new Map<Element, Set<LazyIntersectionCallback>>()
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      for (const callback of [...(targets.get(entry.target) ?? [])]) callback(entry)
    }
  }, { rootMargin: options.rootMargin, threshold: options.threshold })

  return { observer, targets }
}

export function observeLazyIntersection(
  target: Element,
  options: LazyIntersectionOptions,
  callback: LazyIntersectionCallback,
): () => void {
  if (!IN_BROWSER || typeof IntersectionObserver === 'undefined') return () => {}

  const key = lazyIntersectionKey(options)
  const shared = observers.get(key) ?? createSharedObserver(options)
  observers.set(key, shared)

  const callbacks = shared.targets.get(target) ?? new Set<LazyIntersectionCallback>()
  if (!shared.targets.has(target)) {
    shared.targets.set(target, callbacks)
    shared.observer.observe(target)
  }
  callbacks.add(callback)

  let stopped = false

  return () => {
    if (stopped) return
    stopped = true

    callbacks.delete(callback)
    if (callbacks.size > 0) return

    shared.targets.delete(target)
    shared.observer.unobserve(target)
    if (shared.targets.size > 0) return

    shared.observer.disconnect()
    if (observers.get(key) === shared) observers.delete(key)
  }
}

export function useLazyIntersection(
  target: MaybeRefOrGetter<Element | null | undefined>,
  options: MaybeRefOrGetter<LazyIntersectionOptions>,
  callback: LazyIntersectionCallback,
  enabled: MaybeRefOrGetter<boolean> = true,
): () => void {
  let unobserve: (() => void) | undefined

  function cleanup() {
    unobserve?.()
    unobserve = undefined
  }

  const stopWatch = watch(
    () => [toValue(target), toValue(enabled), lazyIntersectionKey(toValue(options))] as const,
    ([element, isEnabled]) => {
      cleanup()
      if (element && isEnabled) unobserve = observeLazyIntersection(element, toValue(options), callback)
    },
    { immediate: true, flush: 'post' },
  )

  function stop() {
    stopWatch()
    cleanup()
  }

  onScopeDispose(stop, true)

  return stop
}
