# MTimeline

<identity>
Vuetify reference: `VTimeline` · PrimeTime target: `MTimeline` · Phase: 5 · Type: public family parent
</identity>

<status>
Discussed and approved. V1 is vertical and explicit-composition-first. `MTimelineItem` is public; `TimelineDivider` is private. Horizontal/data-driven modes are deferred.
</status>

<problem>
Chronological histories, audit logs and completed process events need consistent ordering, opposite/time content, markers and connector geometry. Ad-hoc layouts often reverse DOM order for alternating presentation or make decorative lines part of accessibility semantics.
</problem>

<solution>
Render a semantic ordered vertical sequence. Parent provides layout/density/line context and an ordered view registry; public items register for first/last/alternate-side metadata; private dividers render decorative marker/connector geometry. Timeline displays history and never controls workflow state like `MStepper`.

Non-goals: horizontal v1, data/items API, date formatting/timers, selection, expansion, event fetching, interactive dots and arbitrary color values.
</solution>

<api>
```ts
export type MTimelineSide = 'start' | 'end' | 'alternate'
export type MTimelineDensity = 'compact' | 'default' | 'comfortable'
export type MTimelineLine = 'solid' | 'dashed' | 'none'

export interface MTimelineProps {
  side?: MTimelineSide
  density?: MTimelineDensity
  line?: MTimelineLine
}
```

Defaults: side end, density default, line solid. Default slot only. No model, emits, items prop or direction prop in v1.</api>

<composition>
```text
MTimeline public ol
├── MTimelineItem public li
│   └── TimelineDivider private
├── MTimelineItem
└── MTimelineItem
```

Explicit children are the primary and only v1 content API. Consumers use normal `v-for` for homogeneous data, avoiding a universal event descriptor and whole-item slot that could lose list semantics.</composition>

<context>
```ts
interface MTimelineItemRegistration {
  key?: MaybeRefOrGetter<PropertyKey | undefined>
  side?: MaybeRefOrGetter<'start' | 'end' | undefined>
}

interface MTimelineItemTicket {
  index: Readonly<ComputedRef<number>>
  count: Readonly<ComputedRef<number>>
  first: Readonly<ComputedRef<boolean>>
  last: Readonly<ComputedRef<boolean>>
  resolvedSide: Readonly<ComputedRef<'start' | 'end'>>
  stop: () => void
}

interface MTimelineContext {
  side: Readonly<ComputedRef<MTimelineSide>>
  density: Readonly<ComputedRef<MTimelineDensity>>
  line: Readonly<ComputedRef<MTimelineLine>>
  register: (registration: MTimelineItemRegistration) => MTimelineItemTicket
}
```

Context is justified because public items may appear through templates/wrappers and need dynamic registration order. Registry owns view metadata only, never event/business state. Tickets clean up with `onScopeDispose`. Alternate resolves logical start/end by registration order; an item override wins.</context>

<reuse>
Canonical context/registry lifecycle, `MSurface`, `MIcon`, MColor/MSurfaceVariant and family tokens. Do not create selection/workflow registry, date formatter or raw connector measurements.</reuse>

<layout>
DOM is always chronological. `side=start|end` positions all content logically; alternate uses CSS grid based on ticket side without CSS `order`. At compact container width alternate collapses visually to end-side through CSS/container query while DOM stays unchanged. V1 has no automatic or horizontal renderer.</layout>

<accessibility>
Root is an ordered list. Items own list-item semantics. Connectors/default markers are decorative and aria-hidden; visible time/title/content carry meaning. No roving focus or timeline-specific keyboard commands. Interactive controls belong inside item content and retain natural DOM order.</accessibility>

<styles>
One `components/timeline/_index.scss` nested map covers root vertical grid, side/alternate/collapse, density, item content/opposite/surface, divider lines/dot/icon and first/last branches. Dynamic MColor selects approved semantic schemes; no raw colors. Reused surface/control states remain in their token maps.</styles>

<ssr-lifecycle>
Props and registration order produce deterministic markup/classes. CSS owns responsive collapse. Registry cleanup is scope-safe; no browser listeners, measurement or mounted initialization.</ssr-lifecycle>

<dx>
```vue
<MTimeline side="alternate">
  <MTimelineItem
    time="09:00"
    datetime="2026-07-12T09:00:00+04:00"
    title="Заказ создан"
    icon="shopping_cart"
  >
    Покупатель оформил заказ №1248.
  </MTimelineItem>

  <MTimelineItem
    time="09:15"
    datetime="2026-07-12T09:15:00+04:00"
    title="Оплата подтверждена"
    icon="check"
    color="primary"
  />
</MTimeline>
```
</dx>

<tests>
Context registration/order/dynamic removal; start/end/alternate and item override; first/last lines; density/line modes; compact CSS collapse with chronological DOM; ordered-list semantics; RTL logical sides; SSR/hydration; tokens/lint/stylelint.</tests>

<done>
Consumers compose chronological event histories with public items and correct connector/layout metadata without manual geometry or compromised reading order.</done>

<questions>
None. Horizontal/data-driven APIs require future concrete use cases.
</questions>

