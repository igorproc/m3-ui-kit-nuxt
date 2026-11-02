/**
 * @module useAppBarScroll
 *
 * @remarks
 * Scroll reactions of `<MAppBar>`: the fill once content scrolls under it, and
 * the fold of a collapsing medium / large bar where the browser has no
 * scroll-driven animations (`animation-timeline: scroll()` folds it in CSS
 * everywhere else, with no JS and a correct first frame).
 */
import { computed, onMounted, ref, shallowRef } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import type { LayoutKind, LayoutZone } from '#kit/composables/useLayout'
import { useGlobalListener } from '#kit/composables/useGlobalListener'

export interface AppBarScrollOptions {
  /** Controlled fill; `undefined` follows the scroll. */
  scrolled: () => boolean | undefined
  /** The bar folds as its scroller moves. */
  collapses: () => boolean
  /** Context zone of the enclosing `m-layout`, `null` outside one. */
  zone: LayoutZone | null
  /** Kind of the zone hosting the bar, `undefined` when none hosts it. */
  hostKind: Readonly<Ref<LayoutKind | undefined>>
  /** The bar is a zone of its own: the layout holds it at its row's height. */
  anchored: boolean
}

export interface AppBarScroll {
  scrolled: ComputedRef<boolean>
  /** The fallback fold: never set where the CSS timeline does the folding. */
  collapsed: ComputedRef<boolean>
}

function supportsScrollTimeline(): boolean {
  return IN_BROWSER && typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
    && CSS.supports('animation-timeline: scroll()')
}

export function useAppBarScroll(options: AppBarScrollOptions): AppBarScroll {
  const windowY = ref(0)
  const cssFolds = shallowRef(true)

  // A controlled fill without a fold needs no listener; inside a layout the
  // zone already tracks the scroll.
  const needsWindow = (options.scrolled() === undefined && !options.zone) || options.collapses()

  if (IN_BROWSER && needsWindow) {
    useGlobalListener('window', 'scroll', () => {
      windowY.value = window.scrollY
    }, { passive: true })
  }

  // A page restored or opened at an anchor is scrolled before any event fires.
  onMounted(() => {
    windowY.value = window.scrollY
    cssFolds.value = supportsScrollTimeline()
  })

  const scrolled = computed(() => {
    const controlled = options.scrolled()
    if (controlled !== undefined) return controlled
    return (options.zone ? options.zone.windowY.value : windowY.value) > 0
  })

  // The fold follows the scroller CSS would pick (`scroll(nearest)`): main for a
  // bar that is page content of main, the window for every other bar. A zone of
  // a full-height layout sits outside main and stays open: its row is carved at
  // the expanded height, and folding would open a gap above main. A bar that is
  // a zone itself stays open here too: the layout's generated rule holds it at
  // its row's height, which only the CSS animation outranks.
  const foldY = computed(() => (options.hostKind.value === 'main' && options.zone
    ? options.zone.windowY.value
    : windowY.value))

  const collapsed = computed(() => options.collapses() && !options.anchored && !cssFolds.value && foldY.value > 0)

  return { scrolled, collapsed }
}
