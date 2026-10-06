import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useVirtualScroll } from './useVirtualScroll'

interface StubContainer {
  element: HTMLElement
  setScroll: (offset: number) => void
}

/** A minimal scrollable stub: happy-dom does not lay out or fire scroll. */
function stubContainer(viewport: number): StubContainer {
  const listeners = new Set<() => void>()
  const element = {
    scrollTop: 0,
    scrollLeft: 0,
    clientHeight: viewport,
    clientWidth: viewport,
    getComputedStyle: undefined,
    addEventListener: (_type: string, handler: () => void) => listeners.add(handler),
    removeEventListener: (_type: string, handler: () => void) => listeners.delete(handler),
    scrollTo: (opts: { top?: number, left?: number }) => {
      if (opts.top !== undefined) element.scrollTop = opts.top
      if (opts.left !== undefined) element.scrollLeft = opts.left
    },
  } as unknown as HTMLElement

  return {
    element,
    setScroll(offset: number) {
      ;(element as unknown as { scrollTop: number }).scrollTop = offset
      for (const handler of listeners) handler()
    },
  }
}

function run<T>(fn: () => T): { result: T, stop: () => void } {
  const scope = effectScope()
  const result = scope.run(fn)!
  return { result, stop: () => scope.stop() }
}

describe('useVirtualScroll', () => {
  it('computes an SSR range from deterministic window size before measuring', () => {
    const { result, stop } = run(() => useVirtualScroll({
      container: ref(null),
      count: 1000,
      itemSize: 40,
    }))

    // Window size store defaults are deterministic; the range is non-empty and
    // starts at zero without a mounted viewport.
    expect(result.range.value.startIndex).toBe(0)
    expect(result.range.value.endIndex).toBeGreaterThanOrEqual(0)
    expect(result.totalSize.value).toBe(40000)
    stop()
  })

  it('produces virtual items with resolved keys and geometry', () => {
    const { result, stop } = run(() => useVirtualScroll({
      container: ref(null),
      count: 1000,
      itemSize: 40,
      getKey: index => `row-${index}`,
    }))

    const first = result.virtualItems.value[0]!
    expect(first).toMatchObject({ index: 0, key: 'row-0', start: 0, size: 40, end: 40 })
    stop()
  })

  it('recomputes the range from a native scroll event', async () => {
    const stub = stubContainer(100)
    const container = ref<HTMLElement | null>(stub.element)
    const { result, stop } = run(() => useVirtualScroll({
      container,
      count: 100,
      itemSize: 20,
      overscan: 1,
    }))
    await nextTick()

    stub.setScroll(400)
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)))

    // Offset 400 with viewport 100 shows items 20..24; overscan 1 → 19..25.
    expect(result.scrollOffset.value).toBe(400)
    expect(result.range.value).toEqual({ startIndex: 19, endIndex: 25 })
    expect(result.scrollDirection.value).toBe('forward')
    stop()
  })

  it('reports boundary flags from pure geometry and thresholds', () => {
    const count = ref(50)
    const { result, stop } = run(() => useVirtualScroll({
      container: ref(null),
      count,
      itemSize: 40,
      threshold: { end: 200 },
    }))

    expect(result.isAtStart.value).toBe(true)
    // total 2000, at offset 0 with a large window the end is already reached.
    count.value = 1
    expect(result.isAtEnd.value).toBe(true)
    stop()
  })

  it('captures and restores an anchor by key across a prepend', () => {
    const items = ref(Array.from({ length: 20 }, (_, index) => ({ id: `a${index}` })))
    const stub = stubContainer(100)
    const { result, stop } = run(() => useVirtualScroll({
      container: ref(stub.element),
      count: () => items.value.length,
      itemSize: 20,
      getKey: index => items.value[index]!.id,
    }))

    stub.setScroll(100)
    result.measure()
    const anchor = result.captureAnchor()
    expect(anchor?.key).toBe('a5')

    // Prepend three items: the same key must keep its viewport position.
    items.value = [...Array.from({ length: 3 }, (_, index) => ({ id: `p${index}` })), ...items.value]
    result.restoreAnchor(anchor!)
    // a5 is now index 8 → offset 160, minus the same offsetWithinViewport (0).
    expect(result.scrollOffset.value).toBe(160)
    stop()
  })

  it('no-ops restoreAnchor when the key is gone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result, stop } = run(() => useVirtualScroll({
      container: ref(stubContainer(100).element),
      count: 10,
      itemSize: 20,
      getKey: index => `k${index}`,
    }))

    result.restoreAnchor({ key: 'missing', offsetWithinViewport: 0 })
    expect(result.scrollOffset.value).toBe(0)
    warn.mockRestore()
    stop()
  })

  it('returns an empty range while disabled', () => {
    const enabled = ref(false)
    const { result, stop } = run(() => useVirtualScroll({
      container: ref(null),
      count: 100,
      itemSize: 40,
      enabled,
    }))

    expect(result.range.value).toEqual({ startIndex: 0, endIndex: -1 })
    expect(result.virtualItems.value).toEqual([])
    enabled.value = true
    expect(result.range.value.endIndex).toBeGreaterThanOrEqual(0)
    stop()
  })

  it('clamps a programmatic offset and resolves when reached', async () => {
    const stub = stubContainer(100)
    const { result, stop } = run(() => useVirtualScroll({
      container: ref(stub.element),
      count: 100,
      itemSize: 20,
    }))
    await nextTick()

    // Beyond the max offset (2000 - 100 = 1900): the request clamps.
    const reached = await result.scrollToOffset(5000)
    expect(reached).toBe(true)
    expect(stub.element.scrollTop).toBe(1900)
    stop()
  })
})
