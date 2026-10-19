import type { ComputedRef, CSSProperties, MaybeRefOrGetter, Ref } from 'vue'
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

export interface VirtualScrollAttrs {
  style: CSSProperties
}

export interface UseVirtualScrollReturn {
  virtualItems: Readonly<ComputedRef<VirtualItem[]>>
  range: Readonly<ComputedRef<VirtualRange>>
  totalSize: Readonly<ComputedRef<number>>
  spacerAttrs: Readonly<ComputedRef<VirtualScrollAttrs>>
  getItemAttrs: (item: VirtualItem) => VirtualScrollAttrs
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
