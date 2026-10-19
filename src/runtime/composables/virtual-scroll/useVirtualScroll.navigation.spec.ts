import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useVirtualScroll } from './useVirtualScroll'
import type { UseVirtualScrollOptions, UseVirtualScrollReturn } from './types'

function createScroller({ viewport = 100, smooth = false } = {}) {
  const element = document.createElement('div')
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
    if (smooth && options.behavior === 'smooth') return
    if (options.top !== undefined) position.scrollTop = options.top
  })
  element.scrollTo = scrollTo as unknown as HTMLElement['scrollTo']

  const setTop = (value: number) => {
    position.scrollTop = value
    element.dispatchEvent(new Event('scroll'))
  }
  return { element, scrollTo, setTop }
}

function run(options: UseVirtualScrollOptions): { result: UseVirtualScrollReturn, stop: () => void } {
  const scope = effectScope()
  const result = scope.run(() => useVirtualScroll(options))!
  return { result, stop: () => scope.stop() }
}

function frame() {
  vi.advanceTimersToNextFrame()
}

describe('useVirtualScroll · navigation and lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  describe('programmatic navigation', () => {
    it('clamps an offset and resolves when the container reaches it', async () => {
      const scroller = createScroller()
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20 })

      const reached = result.scrollToOffset(5000)
      expect(result.state.value).toBe('programmatic')
      frame()

      expect(await reached).toBe(true)
      expect(scroller.element.scrollTop).toBe(1900)
      stop()
    })

    it('aligns an index to start, center, end, and to the nearest edge for auto', async () => {
      const scroller = createScroller()
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20 })
      const go = async (promise: Promise<boolean>) => {
        frame()
        return await promise
      }

      await go(result.scrollToIndex(10))
      expect(scroller.element.scrollTop).toBe(200)
      await go(result.scrollToIndex(10, { align: 'center' }))
      expect(scroller.element.scrollTop).toBe(160)
      await go(result.scrollToIndex(10, { align: 'end' }))
      expect(scroller.element.scrollTop).toBe(120)

      scroller.scrollTo.mockClear()
      expect(await result.ensureVisible(6)).toBe(true)
      expect(scroller.scrollTo).not.toHaveBeenCalled()

      await go(result.ensureVisible(30))
      expect(scroller.element.scrollTop).toBe(520)
      await go(result.ensureVisible(2))
      expect(scroller.element.scrollTop).toBe(40)
      stop()
    })

    it('goes programmatic → settling → idle and ignores its own trailing scroll event', async () => {
      const scroller = createScroller()
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20 })

      const reached = result.scrollToOffset(500)
      frame()
      expect(await reached).toBe(true)
      expect(result.state.value).toBe('settling')

      scroller.element.dispatchEvent(new Event('scroll'))
      frame()
      expect(result.state.value).toBe('settling')

      vi.advanceTimersByTime(120)
      expect(result.state.value).toBe('idle')
      stop()
    })

    it('hands over to the user when a wheel interrupts a smooth scroll', async () => {
      const scroller = createScroller({ smooth: true })
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20 })

      const reached = result.scrollToOffset(1000, { behavior: 'smooth' })
      frame()
      expect(result.state.value).toBe('programmatic')

      scroller.element.dispatchEvent(new Event('wheel'))
      expect(await reached).toBe(false)
      expect(result.state.value).toBe('scrolling')
      stop()
    })

    it('resolves a superseded request with false', async () => {
      const scroller = createScroller({ smooth: true })
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20 })

      const first = result.scrollToOffset(1000, { behavior: 'smooth' })
      const second = result.scrollToOffset(200)
      frame()

      expect(await first).toBe(false)
      expect(await second).toBe(true)
      stop()
    })

    it('gives up on a target the container never reaches', async () => {
      const scroller = createScroller({ smooth: true })
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20 })

      const reached = result.scrollToOffset(1000, { behavior: 'smooth' })
      for (let index = 0; index < 12; index += 1) frame()

      expect(await reached).toBe(false)
      expect(result.state.value).toBe('settling')
      vi.advanceTimersByTime(120)
      expect(result.state.value).toBe('idle')
      stop()
    })

    it('turns a smooth request into an instant one under reduced motion', async () => {
      const scroller = createScroller()
      const reduce = ref(false)
      vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: reduce.value && query.includes('reduce') }) as MediaQueryList)
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20 })

      const smooth = result.scrollToOffset(300, { behavior: 'smooth' })
      frame()
      await smooth
      expect(scroller.scrollTo).toHaveBeenLastCalledWith({ top: 300, behavior: 'smooth' })

      reduce.value = true
      const instant = result.scrollToOffset(600, { behavior: 'smooth' })
      frame()
      await instant
      expect(scroller.scrollTo).toHaveBeenLastCalledWith({ top: 600, behavior: 'auto' })
      stop()
    })

    it('refuses to scroll while disabled or without a container', async () => {
      const enabled = ref(false)
      const { result, stop } = run({ container: createScroller().element, count: 100, itemSize: 20, enabled })
      const orphan = run({ container: ref(null), count: 100, itemSize: 20 })

      expect(await result.scrollToIndex(10)).toBe(false)
      expect(await orphan.result.scrollToOffset(100)).toBe(false)
      stop()
      orphan.stop()
    })
  })

  describe('lifecycle', () => {
    it('returns an empty range while disabled and remeasures when enabled again', async () => {
      const enabled = ref(false)
      const scroller = createScroller()
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20, enabled })

      expect(result.range.value).toEqual({ startIndex: 0, endIndex: -1 })
      expect(result.virtualItems.value).toEqual([])

      scroller.setTop(400)
      frame()
      expect(result.scrollOffset.value).toBe(0)

      enabled.value = true
      await nextTick()
      expect(result.scrollOffset.value).toBe(400)
      expect(result.range.value.startIndex).toBe(16)
      stop()
    })

    it('follows a replaced container and drops the old listeners', async () => {
      const first = createScroller({ viewport: 100 })
      const second = createScroller({ viewport: 200 })
      const added = vi.spyOn(first.element, 'addEventListener')
      const removed = vi.spyOn(first.element, 'removeEventListener')
      const container = ref<HTMLElement | null>(first.element)
      const { result, stop } = run({ container, count: 100, itemSize: 20 })

      expect(added).toHaveBeenCalled()
      container.value = second.element
      await nextTick()

      expect(removed).toHaveBeenCalledTimes(added.mock.calls.length)
      expect(result.viewportSize.value).toBe(200)

      first.setTop(400)
      frame()
      expect(result.scrollOffset.value).toBe(0)

      second.setTop(400)
      frame()
      expect(result.scrollOffset.value).toBe(400)
      stop()
    })

    it('settles a pending request when the container is replaced', async () => {
      const first = createScroller({ smooth: true })
      const container = ref<HTMLElement | null>(first.element)
      const { result, stop } = run({ container, count: 100, itemSize: 20 })

      const reached = result.scrollToOffset(1000, { behavior: 'smooth' })
      container.value = createScroller().element
      await nextTick()

      expect(await reached).toBe(false)
      expect(result.state.value).toBe('settling')
      stop()
    })

    it('observes only the container, never an item', async () => {
      const observed: Element[] = []
      const disconnect = vi.fn()
      vi.stubGlobal('ResizeObserver', class {
        observe(element: Element) {
          observed.push(element)
        }

        disconnect = disconnect
      })
      const first = createScroller()
      const second = createScroller()
      const container = ref<HTMLElement | null>(first.element)
      const { stop } = run({ container, count: 1000, itemSize: 20 })

      expect(observed).toEqual([first.element])
      container.value = second.element
      await nextTick()
      expect(observed).toEqual([first.element, second.element])
      expect(disconnect).toHaveBeenCalledTimes(1)

      stop()
      expect(disconnect).toHaveBeenCalledTimes(2)
    })

    it('removes every listener, timer and frame and settles a pending request on dispose', async () => {
      const scroller = createScroller({ smooth: true })
      const added = vi.spyOn(scroller.element, 'addEventListener')
      const removed = vi.spyOn(scroller.element, 'removeEventListener')
      const { result, stop } = run({ container: scroller.element, count: 100, itemSize: 20 })

      scroller.setTop(100)
      frame()
      const pending = result.scrollToOffset(1000, { behavior: 'smooth' })
      stop()

      expect(await pending).toBe(false)
      expect(removed).toHaveBeenCalledTimes(added.mock.calls.length)
      expect(vi.getTimerCount()).toBe(0)
    })
  })
})
