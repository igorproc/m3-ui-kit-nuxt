# useVirtualScroll

<identity>
Vuetify references: `VInfiniteScroll`, `VInfiniteScrollIntersect`, `VVirtualScroll`, `VVirtualScrollItem` · PrimeTime target: one headless `useVirtualScroll` composable · Phase: 4 · Type: composable
</identity>

<implementation-status state="planned" updated="2026-07-13">
Specification is approved; no public `useVirtualScroll` composable or focused tests were found.
</implementation-status>

<status>
Discussed and approved. No loader/fetch state, `MInfiniteScroll`, intersect leaf, `MVirtualScroll` wrapper or VirtualScrollItem component is created. SSR initial range uses the project's deterministic `useSSRWindowSize`; no `ssrCount` fallback exists.
</status>

<problem>
Large collections need windowed DOM rendering plus reliable viewport position/boundary state. Splitting this into loader and visual wrapper components would duplicate consumer data ownership and constrain list/table/grid/chat markup. The kit needs one reusable scroll state machine and range calculator.
</problem>

<solution>
`useVirtualScroll` accepts the scroll viewport ref, total item count and known item sizes. It returns the virtual range/items, total geometry, scroll state/direction/boundaries and imperative navigation/anchor tools. Consumers own item data, DOM markup, loading, cursors, retry/error and accessibility roles.

Non-goals:

- no fetch/load callback, Promise state, cursor/page, retry or error;
- no items mutation or cache;
- no public wrapper/item/sentinel components;
- no IntersectionObserver requirement for loading;
- no per-item global listener;
- no measured variable-height engine in v1.
</solution>

<api>
```ts
type VirtualScrollState = 'idle' | 'scrolling' | 'programmatic' | 'settling'
type VirtualScrollDirection = 'forward' | 'backward' | null
type VirtualScrollAlignment = 'start' | 'center' | 'end' | 'auto'

interface UseVirtualScrollOptions {
  container: MaybeRefOrGetter<HTMLElement | null>
  count: MaybeRefOrGetter<number>
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

interface VirtualItem {
  index: number
  key: PropertyKey
  start: number
  end: number
  size: number
}

interface VirtualRange {
  startIndex: number
  endIndex: number
}
```

Defaults: overscan 4 (final value token/config-reviewed), vertical, enabled, zero padding/offset/threshold. `itemSize(index)` describes a size known without DOM measurement.</api>

<return-contract>
```ts
interface UseVirtualScrollReturn {
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
```

Use `isAtStart/isAtEnd` and `scrollOffset`, not ambiguous `isStart/isEnd/position` names.</return-contract>

<state-machine>
```text
idle
├── native scroll → scrolling
└── scrollTo*     → programmatic

scrolling
└── quiet frame/window → settling → idle

programmatic
├── target reached → settling → idle
└── user interruption → scrolling
```

Only scroll behavior belongs to this state machine. Programmatic methods return whether the target was reached; request/version guards prevent stale completions. One RAF scheduler coalesces native scroll updates.</state-machine>

<range>
For fixed/known sizes, compute visible start/end from logical offset and viewport size, then expand by overscan and clamp to count. `totalSize` includes start/end padding. Empty/disabled state returns an empty range without invalid indices. Changing count or known sizes recomputes geometry without mutating source items.
</range>

<boundaries>
`isAtStart/isAtEnd` are pure reactive viewport geometry using separate logical thresholds. Consumers watch them and decide whether to fetch:

```ts
watch(isAtEnd, reached => {
  if (reached && hasNextPage.value) fetchNextPage()
})
```

The composable does not debounce, deduplicate or represent that request. When count/total size changes, boundary flags recompute naturally.
</boundaries>

<ssr>
Call canonical `useSSRWindowSize()` to obtain deterministic server/client width and height already aligned by the application. Combine the selected axis with known container/layout geometry and `initialOffset` (default zero) to calculate the real initial virtual range during SSR. Hydration begins with the same range; container observation then confirms/refines geometry without an arbitrary “first N items” mode.

There is no `ssrCount` or `initialViewportSize` prop. If a viewport is intentionally smaller than the window, its deterministic size must come from the same layout contract/explicit known geometry rather than guessed client measurement. `ResizeObserver` handles later real resizes, not initial SSR branching.
</ssr>

<scroll-navigation>
`align=auto` does nothing when fully visible, otherwise aligns the nearest start/end edge. Clamp offsets. Horizontal mode normalizes browser RTL scroll models so start/end and direction stay logical. Reduced motion converts smooth programmatic movement to immediate/approved system behavior.
</scroll-navigation>

<anchor>
```ts
interface VirtualScrollAnchor {
  key: PropertyKey
  offsetWithinViewport: number
}
```

`captureAnchor/restoreAnchor` preserve viewport position when consumers prepend/remove data (chat/history). They never invoke data callbacks. Missing anchor keys produce a safe false/no-op diagnostic path rather than an incorrect index jump.
</anchor>

<focus>
The composable owns no element registry or roles. Consumers call `ensureVisible(index)`, await its Promise/next render, then focus their own ref. The returned range enables consumers to pin a focused index if their semantics require it. No focus can be inferred from arbitrary child DOM.
</focus>

<reactivity-lifecycle>
Use `useEventListener` for the one container scroll listener, `useRaf`/one RAF scheduler and lifecycle-safe ResizeObserver utility for the viewport only. All cleanup occurs on scope disposal. Container replacement detaches old observers/listeners. Disabled mode stops work while retaining safe computed output.
</reactivity-lifecycle>

<variable-size-boundary>
V1 accepts constant size or a synchronous index function whose result is known before render. It does not measure rows. True variable-height support requires a later reviewed measurement cache, per-visible-item ResizeObserver, offset correction and scroll anchoring strategy; it must not be smuggled into this API through optional element refs.
</variable-size-boundary>

<dx>
```vue
<script setup lang="ts">
const viewport = useTemplateRef<HTMLElement>('viewport')

const virtual = useVirtualScroll({
  container: viewport,
  count: () => items.value.length,
  itemSize: 64,
  overscan: 6,
  getKey: index => items.value[index]!.id,
  threshold: { end: 256 },
})

watch(virtual.isAtEnd, reached => {
  if (reached && hasNextPage.value) fetchNextPage()
})
</script>
```

Consumer renders `virtual.virtualItems` inside a total-size spacer and applies each returned start/size along the selected axis. List/table/grid roles and item markup remain consumer-owned.</dx>

<tests>
Range/overscan/total geometry; constant and known-size callback; empty/dynamic count; boundaries/thresholds; native direction/state transitions; programmatic alignment/interruption/clamping; vertical/horizontal/RTL; anchor prepend/remove; container replacement/resize/cleanup; disabled; deterministic useSSRWindowSize SSR/hydration range; reduced motion; no fetch/observer-per-item behavior; type tests and lint.</tests>

<done>
One headless composable virtualizes large arbitrary collections and exposes scroll boundaries/navigation without owning data loading or forcing component markup.</done>

<questions>
None. Measured variable heights are explicitly deferred.
</questions>
