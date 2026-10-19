import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, effectScope, h, nextTick, ref, shallowRef } from 'vue'
import { useSSRWindowSize } from '#kit/composables/useSSRWindowSize'
import { useVirtualScroll } from './useVirtualScroll'
import type { UseVirtualScrollOptions, UseVirtualScrollReturn } from './types'

function createScroller({ viewport = 100, dir = 'ltr' } = {}) {
  const element = document.createElement('div')
  element.style.direction = dir
  document.body.append(element)

  const position = { scrollTop: 0, scrollLeft: 0 }
  for (const key of ['scrollTop', 'scrollLeft'] as const) {
    Object.defineProperty(element, key, {
      configurable: true,
      get: () => position[key],
      set: (value: number) => {
        position[key] = value
      },
    })
  }
  for (const key of ['clientHeight', 'clientWidth']) {
    Object.defineProperty(element, key, { configurable: true, get: () => viewport })
  }

  const scrollTo = vi.fn((options: ScrollToOptions) => {
    if (options.top !== undefined) position.scrollTop = options.top
    if (options.left !== undefined) position.scrollLeft = options.left
  })
  element.scrollTo = scrollTo as unknown as HTMLElement['scrollTo']

  const scroll = (key: keyof typeof position) => (value: number) => {
    position[key] = value
    element.dispatchEvent(new Event('scroll'))
  }
  return { element, scrollTo, setTop: scroll('scrollTop'), setLeft: scroll('scrollLeft') }
}

function run(options: UseVirtualScrollOptions): { result: UseVirtualScrollReturn, stop: () => void } {
  const scope = effectScope()
  const result = scope.run(() => useVirtualScroll(options))!
  return { result, stop: () => scope.stop() }
}

function frame() {
  vi.advanceTimersToNextFrame()
}

describe('useVirtualScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  describe('geometry', () => {
    it('computes the range from the deterministic window size before anything is measured', () => {
      const scope = effectScope()
      const { height } = scope.run(() => useSSRWindowSize())!
      const { result, stop } = run({ container: ref(null), count: 1000, itemSize: 40 })

      expect(result.viewportSize.value).toBe(height.value)
      expect(result.range.value).toEqual({ startIndex: 0, endIndex: Math.floor((height.value - 1) / 40) + 4 })
      expect(result.totalSize.value).toBe(40000)
      stop()
      scope.stop()
    })

    it('produces virtual items with resolved keys and geometry', () => {
      const { result, stop } = run({ container: ref(null), count: 1000, itemSize: 40, getKey: index => `row-${index}` })

      expect(result.virtualItems.value[0]).toEqual({ index: 0, key: 'row-0', start: 0, size: 40, end: 40 })
      stop()
    })

    it('resolves a known-size callback with paddings', () => {
      const sizes = [10, 30, 20, 40]
      const { result, stop } = run({
        container: ref(null),
        count: sizes.length,
        itemSize: index => sizes[index]!,
        paddingStart: 8,
        paddingEnd: 12,
      })

      expect(result.totalSize.value).toBe(8 + 100 + 12)
      expect(result.virtualItems.value.map(item => [item.start, item.size])).toEqual([[8, 10], [18, 30], [48, 20], [68, 40]])
      stop()
    })

    it('recomputes when the count changes and empties without invalid indices', () => {
      const count = ref(10)
      const { result, stop } = run({ container: createScroller().element, count, itemSize: 20, overscan: 0 })

      expect(result.totalSize.value).toBe(200)
      expect(result.range.value).toEqual({ startIndex: 0, endIndex: 4 })

      count.value = 2
      expect(result.range.value).toEqual({ startIndex: 0, endIndex: 1 })

      count.value = 0
      expect(result.range.value).toEqual({ startIndex: 0, endIndex: -1 })
      expect(result.virtualItems.value).toEqual([])
      expect(result.isAtEnd.value).toBe(true)
      stop()
    })

    it('places items and the spacer on logical properties along the chosen axis', () => {
      const vertical = run({ container: ref(null), count: 10, itemSize: 20 })
      const horizontal = run({ container: ref(null), count: 10, itemSize: 20, horizontal: true })

      expect(vertical.result.spacerAttrs.value).toEqual({ style: { position: 'relative', blockSize: '200px' } })
      expect(vertical.result.getItemAttrs(vertical.result.virtualItems.value[2]!)).toEqual({
        style: { position: 'absolute', insetInline: '0', insetBlockStart: '40px', blockSize: '20px' },
      })
      expect(horizontal.result.spacerAttrs.value).toEqual({ style: { position: 'relative', inlineSize: '200px', blockSize: '100%' } })
      expect(horizontal.result.getItemAttrs(horizontal.result.virtualItems.value[2]!)).toEqual({
        style: { position: 'absolute', insetBlock: '0', insetInlineStart: '40px', inlineSize: '20px' },
      })
      vertical.stop()
      horizontal.stop()
    })
  })

  describe('native scroll', () => {
    it('recomputes the range from a scroll event, coalesced to one frame', () => {
      const scroller = createScroller()
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20, overscan: 1 })

      scroller.setTop(200)
      scroller.setTop(400)
      expect(result.scrollOffset.value).toBe(0)
      frame()

      expect(result.scrollOffset.value).toBe(400)
      expect(result.range.value).toEqual({ startIndex: 19, endIndex: 25 })
      stop()
    })

    it('reports direction and goes scrolling → idle after a quiet window', () => {
      const scroller = createScroller()
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20 })

      scroller.setTop(400)
      frame()
      expect(result.state.value).toBe('scrolling')
      expect(result.isScrolling.value).toBe(true)
      expect(result.scrollDirection.value).toBe('forward')

      scroller.setTop(200)
      frame()
      expect(result.scrollDirection.value).toBe('backward')

      vi.advanceTimersByTime(120)
      expect(result.state.value).toBe('idle')
      expect(result.scrollDirection.value).toBeNull()
      stop()
    })

    it('flags the boundaries from geometry with separate thresholds', () => {
      const scroller = createScroller()
      const { result, stop } = run({
        container: scroller.element,
        count: 100,
        itemSize: 20,
        threshold: { start: 40, end: 200 },
      })

      expect(result.isAtStart.value).toBe(true)
      expect(result.isAtEnd.value).toBe(false)

      scroller.setTop(41)
      frame()
      expect(result.isAtStart.value).toBe(false)

      scroller.setTop(1699)
      frame()
      expect(result.isAtEnd.value).toBe(false)

      scroller.setTop(1700)
      frame()
      expect(result.isAtEnd.value).toBe(true)
      stop()
    })
  })

  describe('horizontal and RTL', () => {
    it('reads and writes scrollLeft in LTR', async () => {
      const scroller = createScroller()
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20, horizontal: true })

      scroller.setLeft(300)
      frame()
      expect(result.scrollOffset.value).toBe(300)

      const reached = result.scrollToOffset(500)
      frame()
      expect(await reached).toBe(true)
      expect(scroller.scrollTo).toHaveBeenLastCalledWith({ left: 500, behavior: 'auto' })
      stop()
    })

    it('keeps the inline axis logical in RTL', async () => {
      const scroller = createScroller({ dir: 'rtl' })
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20, horizontal: true, overscan: 0 })

      expect(result.isAtStart.value).toBe(true)

      scroller.setLeft(-300)
      frame()
      expect(result.scrollOffset.value).toBe(300)
      expect(result.scrollDirection.value).toBe('forward')
      expect(result.range.value).toEqual({ startIndex: 15, endIndex: 19 })
      expect(result.isAtStart.value).toBe(false)

      const reached = result.scrollToOffset(500)
      frame()
      expect(await reached).toBe(true)
      expect(scroller.scrollTo).toHaveBeenLastCalledWith({ left: -500, behavior: 'auto' })
      expect(result.scrollOffset.value).toBe(500)
      stop()
    })
  })

  describe('anchoring', () => {
    it('captures and restores an anchor by key across a prepend', () => {
      const items = ref(Array.from({ length: 20 }, (_, index) => ({ id: `a${index}` })))
      const scroller = createScroller()
      const { result, stop } = run({
        container: scroller.element,
        count: () => items.value.length,
        itemSize: 20,
        getKey: index => items.value[index]!.id,
      })

      scroller.setTop(110)
      frame()
      const anchor = result.captureAnchor()
      expect(anchor).toEqual({ key: 'a5', offsetWithinViewport: -10 })

      items.value = [...Array.from({ length: 3 }, (_, index) => ({ id: `p${index}` })), ...items.value]
      result.restoreAnchor(anchor!)

      expect(result.scrollOffset.value).toBe(170)
      expect(scroller.element.scrollTop).toBe(170)
      stop()
    })

    it('restores an anchor after rows above it are removed', () => {
      const items = ref(Array.from({ length: 20 }, (_, index) => ({ id: `a${index}` })))
      const scroller = createScroller()
      const { result, stop } = run({
        container: scroller.element,
        count: () => items.value.length,
        itemSize: 20,
        getKey: index => items.value[index]!.id,
      })

      scroller.setTop(200)
      frame()
      const anchor = result.captureAnchor()!

      items.value = items.value.slice(4)
      result.restoreAnchor(anchor)

      expect(anchor.key).toBe('a10')
      expect(result.scrollOffset.value).toBe(120)
      stop()
    })

    it('keeps the offset when the anchor key is gone', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const scroller = createScroller()
      const { result, stop } = run({ container: scroller.element, count: 10, itemSize: 20, getKey: index => `k${index}` })

      result.restoreAnchor({ key: 'missing', offsetWithinViewport: 0 })

      expect(result.scrollOffset.value).toBe(0)
      expect(scroller.scrollTo).not.toHaveBeenCalled()
      stop()
    })
  })
})

describe('useVirtualScroll · escape hatch', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a bounded window through bags that carry no class and no data-*', async () => {
    let virtual!: UseVirtualScrollReturn
    const Host = defineComponent({
      setup() {
        const viewport = shallowRef<HTMLElement | null>(null)
        const bind = (element: unknown) => {
          if (element instanceof HTMLElement) Object.defineProperty(element, 'clientHeight', { configurable: true, get: () => 480 })
          viewport.value = element as HTMLElement | null
        }
        virtual = useVirtualScroll({ container: viewport, count: 100_000, itemSize: 48 })
        return () => h('div', { ref: bind }, [
          h('div', virtual.spacerAttrs.value, virtual.virtualItems.value.map(item =>
            h('i', { ...virtual.getItemAttrs(item), key: item.key }, `Row ${item.index}`))),
        ])
      },
    })

    const wrapper = await mountSuspended(Host, { attachTo: document.body })
    await nextTick()
    const rows = wrapper.findAll('i')

    expect(rows).toHaveLength(14)
    expect(rows[0]!.attributes('style')).toContain('inset-block-start: 0px')
    for (const element of wrapper.findAll('div, i')) {
      expect(element.attributes('class')).toBeUndefined()
      for (const name of element.element.getAttributeNames()) {
        expect(name.startsWith('data-')).toBe(false)
      }
    }
    for (const bag of [virtual.spacerAttrs.value, virtual.getItemAttrs(virtual.virtualItems.value[0]!)]) {
      expect(Object.keys(bag)).toEqual(['style'])
    }
    wrapper.unmount()
  })
})
