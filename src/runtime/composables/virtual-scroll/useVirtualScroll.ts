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
import type { CSSProperties } from 'vue'
import { useEventListener } from '#kit/composables/useEventListener'
import { useRaf } from '#kit/composables/useRaf'
import { useSSRWindowSize } from '#kit/composables/useSSRWindowSize'
import { useTimer } from '#kit/composables/useTimer'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { prefersReducedMotion } from '#kit/utils/motion/shared/reduced-motion'
import { toLogicalScrollLeft, toPhysicalScrollLeft } from '#kit/utils/viewport/logicalScroll'
import type { InlineDirection } from '#kit/utils/viewport/logicalScroll'
import { buildMeasurement, computeRange } from '#kit/utils/virtual-scroll/geometry'
import type { VirtualRange } from '#kit/utils/virtual-scroll/geometry'
import type {
  UseVirtualScrollOptions,
  UseVirtualScrollReturn,
  VirtualItem,
  VirtualScrollAlignment,
  VirtualScrollAnchor,
  VirtualScrollAttrs,
  VirtualScrollDirection,
  VirtualScrollState,
} from './types'

/** Frames of quiet before a native scroll is considered settled. */
const SETTLE_MS = 120

/** Pixels the native scroll end may stop short of the geometric end. */
const END_TOLERANCE = 1

const INTENT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const

const EDGE_KEYS = new Set(['Home', 'End'])

interface PendingScroll {
  target: number
  offset: number
  movedAt: number
  resolve: (reached: boolean) => void
}

function px(value: number) {
  return `${value}px`
}

function spacerStyle(totalSize: number, horizontal: boolean): CSSProperties {
  return horizontal
    ? { position: 'relative', inlineSize: px(totalSize), blockSize: '100%' }
    : { position: 'relative', blockSize: px(totalSize) }
}

function itemStyle(item: VirtualItem, horizontal: boolean): CSSProperties {
  return horizontal
    ? { position: 'absolute', insetBlock: '0', insetInlineStart: px(item.start), inlineSize: px(item.size) }
    : { position: 'absolute', insetInline: '0', insetBlockStart: px(item.start), blockSize: px(item.size) }
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
  let direction: InlineDirection = 'ltr'
  let pending: PendingScroll | undefined

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

  const spacerAttrs = computed<VirtualScrollAttrs>(() => ({ style: spacerStyle(totalSize.value, horizontal) }))

  function getItemAttrs(item: VirtualItem): VirtualScrollAttrs {
    return { style: itemStyle(item, horizontal) }
  }

  const startThreshold = Math.max(0, threshold.start ?? 0)
  const endThreshold = Math.max(0, threshold.end ?? 0)

  const isAtStart = computed(() => scrollOffset.value <= startThreshold)
  const isAtEnd = computed(() => {
    const maxOffset = Math.max(0, totalSize.value - viewportSize.value)
    // The native end can fall a pixel short of the geometric one: a fractional
    // viewport is reported as a whole `clientWidth`, and Chromium truncates a
    // negative RTL `scrollLeft` (-159682 where LTR reports 159683). A threshold
    // wider than that pixel is kept exact.
    return scrollOffset.value >= Math.min(maxOffset - endThreshold, maxOffset - END_TOLERANCE)
  })
  const isScrolling = computed(() => state.value === 'scrolling' || state.value === 'programmatic')

  /** Logical scroll offset of the container, RTL-normalized. */
  function readOffset(element: HTMLElement) {
    return horizontal ? toLogicalScrollLeft(element.scrollLeft, direction) : Math.max(0, element.scrollTop)
  }

  function syncOffset(next: number) {
    if (next === scrollOffset.value) return false
    scrollDirection.value = next > scrollOffset.value ? 'forward' : 'backward'
    scrollOffset.value = next
    return true
  }

  // --- native scroll → machine -------------------------------------------
  const settle = useTimer(() => {
    state.value = 'idle'
    scrollDirection.value = null
  }, { duration: SETTLE_MS })

  const scheduleUpdate = useRaf(() => {
    const element = toValue(container)
    if (!element) return
    if (!syncOffset(readOffset(element)) || state.value === 'programmatic') return
    state.value = 'scrolling'
    settle.start()
  })

  useEventListener(
    () => toValue(container),
    'scroll',
    () => {
      if (isEnabled.value) scheduleUpdate()
    },
    { passive: true },
  )

  useEventListener(
    () => toValue(container),
    [...INTENT_EVENTS],
    () => finishProgrammatic(false, 'scrolling'),
    { passive: true, capture: true },
  )

  // --- viewport measurement ----------------------------------------------
  function measure() {
    const element = toValue(container)
    if (!element) return
    if (horizontal) direction = getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr'
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

  // The server rendered the range at `initialOffset`; a container that arrives
  // at its start is moved there at once, so the first client frame keeps it.
  function jumpToInitialOffset(element: HTMLElement) {
    if (initialOffset <= 0 || !isEnabled.value || readOffset(element) > 0) return
    const target = clampOffset(initialOffset)
    if (horizontal) element.scrollTo({ left: toPhysicalScrollLeft(target, direction), behavior: 'instant' })
    else element.scrollTo({ top: target, behavior: 'instant' })
    scrollOffset.value = readOffset(element)
  }

  // Re-attach the observer whenever the container element itself is replaced.
  watch(() => toValue(container), (element) => {
    finishProgrammatic(false, 'settling')
    observe(element ?? null)
    if (!element) return
    measure()
    jumpToInitialOffset(element)
  }, { immediate: true, flush: 'post' })

  watch(isEnabled, (on) => {
    if (on) measure()
    else finishProgrammatic(false, 'settling')
  })

  // --- programmatic navigation -------------------------------------------
  function release(reached: boolean) {
    const request = pending
    pending = undefined
    poll.cancel()
    request?.resolve(reached)
  }

  function finishProgrammatic(reached: boolean, next: Extract<VirtualScrollState, 'settling' | 'scrolling'>) {
    if (!pending) return
    release(reached)
    state.value = next
    settle.start()
  }

  const poll = useRaf((timestamp) => {
    const request = pending
    if (!request) return

    const element = toValue(container)
    if (!element) {
      finishProgrammatic(false, 'settling')
      return
    }

    // Read the container directly: an instant scroll lands before its
    // scroll event fires, so polling the element beats waiting on the ref.
    const offset = readOffset(element)
    syncOffset(offset)

    if (Math.abs(offset - request.target) <= 1) {
      finishProgrammatic(true, 'settling')
      return
    }
    if (offset !== request.offset) {
      request.offset = offset
      request.movedAt = timestamp
    } else if (timestamp - request.movedAt >= SETTLE_MS) {
      finishProgrammatic(false, 'settling')
      return
    }
    poll()
  })

  function applyScroll(offset: number, behavior: ScrollBehavior) {
    const element = toValue(container)
    if (!element) return
    // Read at the moment of the scroll, not through `useReducedMotion`: that ref
    // is `false` until a component mounts, and this composable may run in a
    // bare effect scope. Both ask the same query.
    const resolved = prefersReducedMotion() ? 'auto' : behavior
    if (horizontal) element.scrollTo({ left: toPhysicalScrollLeft(offset, direction), behavior: resolved })
    else element.scrollTo({ top: offset, behavior: resolved })
  }

  function clampOffset(offset: number) {
    const maxOffset = Math.max(0, totalSize.value - viewportSize.value)
    return Math.min(Math.max(offset, 0), maxOffset)
  }

  async function scrollToOffset(offset: number, opts: { behavior?: ScrollBehavior } = {}): Promise<boolean> {
    const element = toValue(container)
    if (!isEnabled.value || !element || !IN_BROWSER) return false
    const target = clampOffset(offset)
    if (!pending && Math.abs(readOffset(element) - target) <= 1) return true

    release(false)
    settle.stop()
    state.value = 'programmatic'
    applyScroll(target, opts.behavior ?? 'auto')
    // `auto` lands synchronously; a settle poll still confirms it for `smooth`.
    return await new Promise<boolean>((resolve) => {
      pending = { target, offset: Number.NaN, movedAt: 0, resolve }
      poll()
    })
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

  // Browsers move only the block axis on Home / End, so a focused horizontal
  // lane takes them itself. Keys aimed at a row stay with the consumer.
  useEventListener(
    () => (horizontal ? toValue(container) : null),
    'keydown',
    (event: KeyboardEvent) => {
      if (!isEnabled.value || event.target !== event.currentTarget || !EDGE_KEYS.has(event.key)) return
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      event.preventDefault()
      void scrollToOffset(event.key === 'Home' ? 0 : totalSize.value, { behavior: 'smooth' })
    },
  )

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
    release(false)
    observer?.disconnect()
  })

  return {
    virtualItems,
    range,
    totalSize,
    spacerAttrs,
    getItemAttrs,
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
