import { defineAsyncComponent, h } from 'vue'
import type { Component } from 'vue'

/** An `IntersectionObserver` the spec drives by hand. */
export class FakeObserver {
  static instances: FakeObserver[] = []

  readonly targets = new Set<Element>()

  constructor(readonly callback: IntersectionObserverCallback) {
    FakeObserver.instances.push(this)
  }

  observe(target: Element) {
    this.targets.add(target)
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  disconnect() {
    this.targets.clear()
  }

  takeRecords() {
    return []
  }

  emit(target: Element, isIntersecting: boolean) {
    this.callback([{ target, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

/** Content that never resolves: the boundary stays pending. */
export const Endless = defineAsyncComponent(() => new Promise<Component>(() => {}))

/** Content that fails to load. */
export const Broken = defineAsyncComponent(() => Promise.reject(new Error('offline')))

export const content = () => h('div', { class: 'content' }, 'Content')

export const placeholder = () => h('div', { class: 'placeholder' }, 'Waiting')

export const ERROR_COPY = { errorText: 'Could not load', retryLabel: 'Try again' }

/** Installs a synchronous `requestIdleCallback`; undo with {@link removeIdleCallback}. */
export function installIdleCallback() {
  Object.defineProperty(window, 'requestIdleCallback', {
    configurable: true,
    value: (callback: () => void) => {
      callback()
      return 1
    },
  })
}

export function removeIdleCallback() {
  Reflect.deleteProperty(window, 'requestIdleCallback')
  Reflect.deleteProperty(window, 'cancelIdleCallback')
}
