/**
 * @module timeline/context
 *
 * @remarks
 * What `<MTimeline>` tells its items. Namespace: `m3:timeline`. A view-only
 * ordered registry: it owns sequence metadata (index and resolved side) and
 * never touches event or business state. Items may arrive through templates
 * or wrappers, so registration is dynamic; ordering follows the DOM rather
 * than mount order, which keeps mid-list insertion correct.
 *
 * The ends of the rail are not computed here: the first and last item are
 * `:first-child` / `:last-child` of the list, which the server already renders
 * right — a registry only knows the last item once every item has registered.
 *
 * Internal to the family: it lives beside the components, out of the
 * consumer's auto-imports.
 */
import { computed, onScopeDispose, shallowReactive, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { MTimelineDensity, MTimelineLine, MTimelineResolvedSide, MTimelineSide } from './props'

export interface MTimelineItemRegistration {
  /** Per-item side override; wins over the parent's alternate resolution. */
  side?: MaybeRefOrGetter<MTimelineResolvedSide | undefined>
  /** Item root element, used to order tickets by document position. */
  element: Readonly<ShallowRef<HTMLElement | null>>
}

export interface MTimelineItemTicket {
  index: Readonly<ComputedRef<number>>
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

  // DOM-ordered positions, built in one pass whenever the entry set changes, so
  // each item reads its index in O(1) instead of searching the list. SSR has no
  // elements: the comparator is a no-op and insertion order — which equals DOM
  // order during a server render — is kept.
  const positions = computed(() => {
    const map = new Map<number, number>()
    for (const [position, entry] of [...entries].sort(compareByDom).entries()) map.set(entry.id, position)
    return map
  })

  function register(registration: MTimelineItemRegistration): MTimelineItemTicket {
    const entry: Entry = { id: nextId++, registration }
    entries.push(entry)

    const index = computed(() => positions.value.get(entry.id) ?? -1)

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

    return { index, resolvedSide, stop }
  }

  return { side, density, line, register }
}

const [injectTimelineContext, provideTimelineContext] = createContext<MTimelineContext | null>('m3:timeline', null)

export { provideTimelineContext }

/**
 * Injects the nearest `<MTimeline>` context.
 *
 * @throws When used outside an `<MTimeline>` — an item cannot resolve its
 * sequence geometry without a parent.
 */
export function useTimelineContext(): MTimelineContext {
  const context = injectTimelineContext()
  if (!context) throw new Error('[m3:timeline] <MTimelineItem> must be used inside <MTimeline>.')
  return context
}
