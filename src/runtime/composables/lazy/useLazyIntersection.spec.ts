import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { observeLazyIntersection, useLazyIntersection } from './useLazyIntersection'

class FakeObserver {
  static instances: FakeObserver[] = []

  readonly targets = new Set<Element>()
  disconnected = false

  constructor(readonly callback: IntersectionObserverCallback, readonly options: IntersectionObserverInit = {}) {
    FakeObserver.instances.push(this)
  }

  observe(target: Element) {
    this.targets.add(target)
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  disconnect() {
    this.disconnected = true
    this.targets.clear()
  }

  takeRecords() {
    return []
  }

  emit(target: Element, isIntersecting: boolean) {
    this.callback([{ target, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

const OPTIONS = { rootMargin: '200px 0px', threshold: 0 }

beforeEach(() => {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('observeLazyIntersection', () => {
  it('shares one observer between every target with the same options', () => {
    const elements = Array.from({ length: 100 }, () => document.createElement('div'))
    const stops = elements.map(element => observeLazyIntersection(element, OPTIONS, () => {}))

    expect(FakeObserver.instances).toHaveLength(1)
    expect(FakeObserver.instances[0]!.targets.size).toBe(100)

    stops.forEach(stop => stop())
  })

  it('creates a separate observer for different options', () => {
    const first = observeLazyIntersection(document.createElement('div'), OPTIONS, () => {})
    const second = observeLazyIntersection(document.createElement('div'), { rootMargin: '0px', threshold: [0, 0.5] }, () => {})

    expect(FakeObserver.instances.map(observer => observer.options)).toEqual([
      { rootMargin: '200px 0px', threshold: 0 },
      { rootMargin: '0px', threshold: [0, 0.5] },
    ])

    first()
    second()
  })

  it('delivers an entry only to the callbacks of its own target', () => {
    const [a, b] = [document.createElement('div'), document.createElement('div')]
    const onA = vi.fn()
    const onB = vi.fn()
    const stops = [observeLazyIntersection(a, OPTIONS, onA), observeLazyIntersection(b, OPTIONS, onB)]

    FakeObserver.instances[0]!.emit(a, true)

    expect(onA).toHaveBeenCalledWith(expect.objectContaining({ target: a, isIntersecting: true }))
    expect(onB).not.toHaveBeenCalled()

    stops.forEach(stop => stop())
  })

  it('unobserves a released target and disconnects after the last one', () => {
    const [a, b] = [document.createElement('div'), document.createElement('div')]
    const stopA = observeLazyIntersection(a, OPTIONS, () => {})
    const stopB = observeLazyIntersection(b, OPTIONS, () => {})
    const observer = FakeObserver.instances[0]!

    stopA()
    stopA()
    expect([...observer.targets]).toEqual([b])
    expect(observer.disconnected).toBe(false)

    stopB()
    expect(observer.disconnected).toBe(true)

    const stopNext = observeLazyIntersection(a, OPTIONS, () => {})
    expect(FakeObserver.instances).toHaveLength(2)
    stopNext()
  })
})

describe('useLazyIntersection', () => {
  it('re-subscribes when the options change and stops with its scope', async () => {
    const element = document.createElement('div')
    const rootMargin = ref('200px 0px')
    const scope = effectScope()

    scope.run(() => useLazyIntersection(element, () => ({ rootMargin: rootMargin.value, threshold: 0 }), () => {}))
    await nextTick()
    expect(FakeObserver.instances).toHaveLength(1)

    rootMargin.value = '0px'
    await nextTick()

    expect(FakeObserver.instances).toHaveLength(2)
    expect(FakeObserver.instances[0]!.disconnected).toBe(true)
    expect(FakeObserver.instances[1]!.options.rootMargin).toBe('0px')

    scope.stop()
    expect(FakeObserver.instances[1]!.disconnected).toBe(true)
  })

  it('observes only while enabled', async () => {
    const element = document.createElement('div')
    const enabled = ref(false)
    const scope = effectScope()

    scope.run(() => useLazyIntersection(element, OPTIONS, () => {}, enabled))
    await nextTick()
    expect(FakeObserver.instances).toHaveLength(0)

    enabled.value = true
    await nextTick()
    expect(FakeObserver.instances[0]!.targets.has(element)).toBe(true)

    enabled.value = false
    await nextTick()
    expect(FakeObserver.instances[0]!.disconnected).toBe(true)

    scope.stop()
  })
})
