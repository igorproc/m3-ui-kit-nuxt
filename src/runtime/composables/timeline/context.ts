/**
 * @module timeline/context
 *
 * @remarks
 * View-only ordered registry for the `<MTimeline>` family. It owns sequence
 * metadata (index/count/first/last/resolved side) and never touches
 * event/business state. Public items may appear through templates or wrappers,
 * so registration is dynamic; ordering follows the DOM rather than mount order,
 * which keeps mid-list insertion correct.
 *
 * These exports are implementation details of the family, not a public API.
 */
import { computed, inject, onScopeDispose, provide, shallowReactive, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from 'vue'

export type MTimelineSide = 'start' | 'end' | 'alternate'
export type MTimelineDensity = 'compact' | 'default' | 'comfortable'
export type MTimelineLine = 'solid' | 'dashed' | 'none'
export type MTimelineResolvedSide = 'start' | 'end'

/** Namespace for the timeline provide/inject pair. */
export const TIMELINE_KEY = 'm3:timeline'

export interface MTimelineItemRegistration {
  /** Stable identity; falls back to the registration id. */
  key?: MaybeRefOrGetter<PropertyKey | undefined>
  /** Per-item side override; wins over the parent's alternate resolution. */
  side?: MaybeRefOrGetter<MTimelineResolvedSide | undefined>
  /** Item root element, used to order tickets by document position. */
  element: Readonly<ShallowRef<HTMLElement | null>>
}

export interface MTimelineItemTicket {
  index: Readonly<ComputedRef<number>>
  count: Readonly<ComputedRef<number>>
  first: Readonly<ComputedRef<boolean>>
  last: Readonly<ComputedRef<boolean>>
  resolvedSide: Readonly<ComputedRef<MTimelineResolvedSide>>
  stop: () => void
}

export interface MTimelineContext {
  side: Readonly<ComputedRef<MTimelineSide>>
  density: Readonly<ComputedRef<MTimelineDensity>>
  line: Readonly<ComputedRef<MTimelineLine>>
  register: (registration: MTimelineItemRegistration) => MTimelineItemTicket
}

interface Entry {
  id: number
  registration: MTimelineItemRegistration
}

export interface CreateTimelineContextOptions {
  side: () => MTimelineSide
  density: () => MTimelineDensity
  line: () => MTimelineLine
}

/** Orders two entries by document position; equal (or SSR-null) keeps insertion order. */
function compareByDom(a: Entry, b: Entry): number {
  const left = a.registration.element.value
  const right = b.registration.element.value
  if (!left || !right) return 0
  const relation = left.compareDocumentPosition(right)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

export function createTimelineContext(options: CreateTimelineContextOptions): MTimelineContext {
  const entries = shallowReactive<Entry[]>([])
  let nextId = 0

  const side = computed(options.side)
  const density = computed(options.density)
  const line = computed(options.line)

  // DOM-ordered snapshot: recomputed when the entry set changes. SSR has no
  // elements, so the comparator is a no-op and insertion order (which equals
  // DOM order during server render) is preserved.
  const ordered = computed(() => [...entries].sort(compareByDom))

  function register(registration: MTimelineItemRegistration): MTimelineItemTicket {
    const entry: Entry = { id: nextId++, registration }
    entries.push(entry)

    const index = computed(() => ordered.value.findIndex(candidate => candidate.id === entry.id))
    const count = computed(() => ordered.value.length)
    const first = computed(() => index.value === 0)
    const last = computed(() => index.value === count.value - 1)

    const resolvedSide = computed<MTimelineResolvedSide>(() => {
      const override = toValue(registration.side)
      if (override) return override
      if (side.value === 'start') return 'start'
      if (side.value === 'end') return 'end'
      // Alternate: the first item starts on the logical start side.
      return index.value % 2 === 0 ? 'start' : 'end'
    })

    function stop() {
      const position = entries.indexOf(entry)
      if (position !== -1) entries.splice(position, 1)
    }

    onScopeDispose(stop)

    return { index, count, first, last, resolvedSide, stop }
  }

  return { side, density, line, register }
}

export function provideTimelineContext(context: MTimelineContext) {
  provide(TIMELINE_KEY, context)
  return context
}

/**
 * Injects the nearest `<MTimeline>` context.
 *
 * @throws When used outside an `<MTimeline>` — an item cannot resolve its
 * sequence geometry without a parent.
 */
export function useTimelineContext(): MTimelineContext {
  const context = inject<MTimelineContext>(TIMELINE_KEY)
  if (!context) throw new Error('[m3:timeline] <MTimelineItem> must be used inside <MTimeline>.')
  return context
}
