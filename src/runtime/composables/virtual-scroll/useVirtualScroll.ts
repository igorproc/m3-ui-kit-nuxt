/**
 * @module virtual-scroll/useVirtualScroll
 *
 * @remarks
 * One headless scroll state machine and range calculator for large
 * collections. It owns windowed geometry, viewport position/boundary state and
 * imperative navigation; the consumer owns item data, DOM markup, loading,
 * cursors, retry/error and accessibility roles.
 *
 * It never fetches, never mutates items and ships no wrapper/item/sentinel
 * component. Boundary flags are pure reactive geometry the consumer watches to
 * decide whether to load more — the composable does not represent that request.
 */
import { computed, onScopeDispose, readonly, ref, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import { useEventListener } from '#kit/composables/useEventListener'
import { useRaf } from '#kit/composables/useRaf'
import { useSSRWindowSize } from '#kit/composables/useSSRWindowSize'
import { buildMeasurement, computeRange } from './geometry'
import type { VirtualRange } from './geometry'

export type VirtualScrollState = 'idle' | 'scrolling' | 'programmatic' | 'settling'
export type VirtualScrollDirection = 'forward' | 'backward' | null
export type VirtualScrollAlignment = 'start' | 'center' | 'end' | 'auto'

export interface UseVirtualScrollOptions {
  container: MaybeRefOrGetter<HTMLElement | null>
  count: MaybeRefOrGetter<number>
  /** Size known before render: a constant or a synchronous index function. */
  itemSize: number | ((index: number) => number)
  getKey?: (index: number) => PropertyKey
  overscan?: number
  horizontal?: boolean
  enabled?: MaybeRefOrGetter<boolean>
  paddingStart?: number
  paddingEnd?: number
  initialOffset?: number
  threshold?: { start?: number, end?: number }
}

export interface VirtualItem {
  index: number
  key: PropertyKey
  start: number
  end: number
  size: number
}

export interface VirtualScrollAnchor {
  key: PropertyKey
  offsetWithinViewport: number
}

export interface UseVirtualScrollReturn {
  virtualItems: Readonly<ComputedRef<VirtualItem[]>>
  range: Readonly<ComputedRef<VirtualRange>>
  totalSize: Readonly<ComputedRef<number>>
  scrollOffset: Readonly<Ref<number>>
  viewportSize: Readonly<Ref<number>>
  isAtStart: Readonly<ComputedRef<boolean>>
  isAtEnd: Readonly<ComputedRef<boolean>>
  scrollDirection: Readonly<Ref<VirtualScrollDirection>>
  state: Readonly<Ref<VirtualScrollState>>
  isScrolling: Readonly<ComputedRef<boolean>>
  scrollToOffset: (offset: number, options?: { behavior?: ScrollBehavior }) => Promise<boolean>
  scrollToIndex: (index: number, options?: { align?: VirtualScrollAlignment, behavior?: ScrollBehavior }) => Promise<boolean>
  ensureVisible: (index: number, options?: { align?: VirtualScrollAlignment, behavior?: ScrollBehavior }) => Promise<boolean>
  captureAnchor: () => VirtualScrollAnchor | null
  restoreAnchor: (anchor: VirtualScrollAnchor) => void
  measure: () => void
  refresh: () => void
}

const IN_BROWSER = typeof window !== 'undefined'
/** Frames of quiet before a native scroll is considered settled. */
const SETTLE_MS = 120

function prefersReducedMotion() {
  return IN_BROWSER && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function useVirtualScroll(options: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const {
    container,
    count,
    itemSize,
    getKey = index => index,
    overscan = 4,
    horizontal = false,
    enabled = true,
    paddingStart = 0,
    paddingEnd = 0,
    initialOffset = 0,
    threshold = {},
  } = options

  const ssr = useSSRWindowSize()

  const isEnabled = computed(() => toValue(enabled))
  const itemCount = computed(() => Math.max(0, Math.floor(toValue(count))))

  // SSR renders a real initial range: the deterministic window size stands in
  // for the not-yet-measured viewport, so hydration starts from the same range.
  const scrollOffset = ref(Math.max(0, initialOffset))
  const viewportSize = ref(horizontal ? ssr.width.value : ssr.height.value)

  const scrollDirection = ref<VirtualScrollDirection>(null)
  const state = ref<VirtualScrollState>('idle')

  const measurement = computed(() => buildMeasurement(itemCount.value, itemSize, paddingStart))
  const totalSize = computed(() => measurement.value.totalSize + paddingEnd)

  const range = computed<VirtualRange>(() => {
    if (!isEnabled.value) return { startIndex: 0, endIndex: -1 }
    return computeRange(scrollOffset.value, viewportSize.value, measurement.value, itemCount.value, overscan)
  })

  const virtualItems = computed<VirtualItem[]>(() => {
    const { startIndex, endIndex } = range.value
    const items: VirtualItem[] = []
    for (let index = startIndex; index <= endIndex; index += 1) {
      const start = measurement.value.offsetAt(index)
      const size = measurement.value.sizeAt(index)
      items.push({ index, key: getKey(index), start, end: start + size, size })
    }
    return items
  })

  const startThreshold = Math.max(0, threshold.start ?? 0)
  const endThreshold = Math.max(0, threshold.end ?? 0)

  const isAtStart = computed(() => scrollOffset.value <= startThreshold)
  const isAtEnd = computed(() => {
    const maxOffset = Math.max(0, totalSize.value - viewportSize.value)
    return scrollOffset.value >= maxOffset - endThreshold
  })
  const isScrolling = computed(() => state.value === 'scrolling' || state.value === 'programmatic')

  /** Logical scroll offset of the container, RTL-normalized. */
  function readOffset(element: HTMLElement) {
    const raw = horizontal ? element.scrollLeft : element.scrollTop
    // RTL horizontal scroll is reported as a negative offset by modern engines;
    // the absolute value restores a logical start-to-end axis.
    return horizontal ? Math.abs(raw) : raw
  }

  // --- native scroll → machine -------------------------------------------
  const scheduleUpdate = useRaf(() => {
    const element = toValue(container)
    if (!element) return

    const next = readOffset(element)
    if (next !== scrollOffset.value) {
      scrollDirection.value = next > scrollOffset.value ? 'forward' : 'backward'
      scrollOffset.value = next
    }

    if (state.value !== 'programmatic') state.value = 'scrolling'
    armSettle()
  })

  let settleTimer: ReturnType<typeof setTimeout> | undefined
  function armSettle() {
    if (settleTimer) clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      state.value = 'idle'
      scrollDirection.value = null
    }, SETTLE_MS)
  }

  useEventListener(
    () => toValue(container),
    'scroll',
    () => {
      if (isEnabled.value) scheduleUpdate()
    },
    { passive: true },
  )

  // --- viewport measurement ----------------------------------------------
  function measure() {
    const element = toValue(container)
    if (!element) return
    viewportSize.value = horizontal ? element.clientWidth : element.clientHeight
    scrollOffset.value = readOffset(element)
  }

  let observer: ResizeObserver | undefined
  function observe(element: HTMLElement | null) {
    observer?.disconnect()
    observer = undefined
    if (!element || !IN_BROWSER || typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver(() => measure())
    observer.observe(element)
  }

  // Re-attach the observer whenever the container element itself is replaced.
  watch(() => toValue(container), (element) => {
    observe(element ?? null)
    if (element) measure()
  }, { immediate: true, flush: 'post' })

  // --- programmatic navigation -------------------------------------------
  let requestId = 0

  function applyScroll(offset: number, behavior: ScrollBehavior) {
    const element = toValue(container)
    if (!element) return
    const resolved = prefersReducedMotion() ? 'auto' : behavior
    // In RTL the physical scrollLeft is the negated logical offset.
    const rtl = horizontal && getComputedStyle(element).direction === 'rtl'
    const physical = horizontal && rtl ? -offset : offset
    if (horizontal) element.scrollTo({ left: physical, behavior: resolved })
    else element.scrollTo({ top: physical, behavior: resolved })
  }

  function clampOffset(offset: number) {
    const maxOffset = Math.max(0, totalSize.value - viewportSize.value)
    return Math.min(Math.max(offset, 0), maxOffset)
  }

  async function settleTo(target: number): Promise<boolean> {
    const id = ++requestId
    state.value = 'programmatic'

    return await new Promise<boolean>((resolve) => {
      const check = useRaf(() => {
        // A newer request or a user scroll supersedes this one.
        if (id !== requestId) return resolve(false)

        const element = toValue(container)
        if (!element) return resolve(false)

        // Read the container directly: an instant scroll lands before its
        // scroll event fires, so polling the element beats waiting on the ref.
        const offset = readOffset(element)
        scrollOffset.value = offset

        if (Math.abs(offset - target) <= 1) {
          state.value = 'idle'
          scrollDirection.value = null
          return resolve(true)
        }
        check()
      })
      check()
    })
  }

  async function scrollToOffset(offset: number, opts: { behavior?: ScrollBehavior } = {}): Promise<boolean> {
    if (!isEnabled.value) return false
    const target = clampOffset(offset)
    applyScroll(target, opts.behavior ?? 'auto')
    // `auto` lands synchronously; a settle poll still confirms it for `smooth`.
    return await settleTo(target)
  }

  function offsetForIndex(index: number, align: VirtualScrollAlignment): number {
    const safeIndex = Math.min(Math.max(index, 0), Math.max(0, itemCount.value - 1))
    const start = measurement.value.offsetAt(safeIndex)
    const size = measurement.value.sizeAt(safeIndex)
    const end = start + size

    if (align === 'start') return start
    if (align === 'end') return end - viewportSize.value
    if (align === 'center') return start - (viewportSize.value - size) / 2

    // auto: do nothing if already fully visible, else align the nearest edge.
    if (start < scrollOffset.value) return start
    if (end > scrollOffset.value + viewportSize.value) return end - viewportSize.value
    return scrollOffset.value
  }

  async function scrollToIndex(
    index: number,
    opts: { align?: VirtualScrollAlignment, behavior?: ScrollBehavior } = {},
  ): Promise<boolean> {
    if (!isEnabled.value || itemCount.value === 0) return false
    return await scrollToOffset(offsetForIndex(index, opts.align ?? 'start'), { behavior: opts.behavior })
  }

  function ensureVisible(
    index: number,
    opts: { align?: VirtualScrollAlignment, behavior?: ScrollBehavior } = {},
  ): Promise<boolean> {
    return scrollToIndex(index, { align: opts.align ?? 'auto', behavior: opts.behavior })
  }

  // --- anchoring ----------------------------------------------------------
  function captureAnchor(): VirtualScrollAnchor | null {
    const first = virtualItems.value.find(item => item.end > scrollOffset.value)
    if (!first) return null
    return { key: first.key, offsetWithinViewport: first.start - scrollOffset.value }
  }

  function restoreAnchor(anchor: VirtualScrollAnchor) {
    // The key may have scrolled out of the current data (prepend/remove); a
    // missing key is a safe no-op rather than an incorrect index jump.
    for (let index = 0; index < itemCount.value; index += 1) {
      if (getKey(index) === anchor.key) {
        const target = clampOffset(measurement.value.offsetAt(index) - anchor.offsetWithinViewport)
        scrollOffset.value = target
        applyScroll(target, 'auto')
        return
      }
    }
    if (import.meta.dev) console.warn('[virtual-scroll] restoreAnchor: key not found; keeping current offset')
  }

  function refresh() {
    measure()
  }

  onScopeDispose(() => {
    if (settleTimer) clearTimeout(settleTimer)
    observer?.disconnect()
  })

  return {
    virtualItems,
    range,
    totalSize,
    scrollOffset: readonly(scrollOffset),
    viewportSize: readonly(viewportSize),
    isAtStart,
    isAtEnd,
    scrollDirection: readonly(scrollDirection),
    state: readonly(state),
    isScrolling,
    scrollToOffset,
    scrollToIndex,
    ensureVisible,
    captureAnchor,
    restoreAnchor,
    measure,
    refresh,
  }
}
