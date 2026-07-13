# MTimelineItem

<identity>
Vuetify reference: `VTimelineItem` · PrimeTime target: `MTimelineItem` · Phase: 5 · Type: public family child
</identity>

<implementation-status state="planned" updated="2026-07-13">
Public-child specification is approved; no `MTimelineItem` implementation or focused tests were found.
</implementation-status>

<status>Approved as a public explicit-composition component.</status>

<problem>An event needs opposite/time content, semantic content surface, marker/icon and connector participation while inheriting parent layout and retaining chronological list order.</problem>

<api>
```ts
interface MTimelineItemProps {
  title?: string
  text?: string
  time?: string
  datetime?: string
  icon?: string
  color?: MColor
  variant?: MSurfaceVariant
  side?: 'start' | 'end'
  hideOpposite?: boolean
  hideDot?: boolean
  contentTag?: 'div' | 'article'
}
```
Defaults: primary color, plain surface, no side override, visible opposite/dot, content div. Slots: opposite, dot, icon, title, default.</api>

<composition>Inject required Timeline context, register one ticket and render `li` with opposite, private divider and `MSurface` content. Pass ticket first/last/resolved side plus visual props directly to divider; divider has no context.</composition>

<reuse>Parent ticket/context, `MSurface`, `MIcon`, shared color/surface types and family tokens. No model, event registry, date formatting or local connector calculation.</reuse>

<content-time>`time` is display text; `datetime` is machine-readable and renders through `<time datetime>`. Component never formats Date or updates relative time. Slot precedence is opposite slot over time and title/default slots over props. Empty wrappers are omitted.</content-time>

<marker>Default dot may contain decorative MIcon. `dot` replaces marker visual content but is documented noninteractive; meaningful actions belong inside content. hideDot preserves connector geometry policy without an accessible empty control.</marker>

<semantics>Root remains `li`; content defaults to div and optionally article. Current item has no selection/current semantics. Connector/icon is aria-hidden; full time/title/content is readable once. Actions within content follow normal focus order.</semantics>

<styles>Consume nested item surface/opposite/title/body/side/status branches. Variant delegates container styling to MSurface; timeline tokens own grid placement/gaps only. Color is limited to MColor roles.</styles>

<lifecycle>Ticket registers reactive side/key metadata and stops on scope disposal. No other lifecycle or browser APIs.</lifecycle>

<edge-cases>Missing time/title/body; time without datetime; datetime without visible time does not create hidden duplicate text; large custom dot; long opposite content; item side override under alternate; dynamic insertion/removal; nested interactive content.</edge-cases>

<tests>Props/slots/precedence, context-required error, ticket cleanup, surface variants/colors, time semantics, side override, dot/icon/hide branches, article/div, list semantics, RTL, SSR and tokens.</tests>

<done>Each event is a public semantic list item that derives all sequence geometry from its parent ticket.</done>

<questions>None.</questions>
