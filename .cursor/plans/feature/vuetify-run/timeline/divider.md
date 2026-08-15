# TimelineDivider

<identity>
Vuetify reference: `VTimelineDivider` · PrimeTime target: private `TimelineDivider` · Phase: 5 · Type: sub
</identity>

<implementation-status state="done" updated="2026-07-18">
Private `TimelineDivider` at `app/components/fragments/timeline/divider/index.vue`:
direct props only (first/last/line/color/icon/hideDot), no context. Decorative
and `aria-hidden`; before/after connector hidden on first/last; dashed line via
repeating-gradient; MColor dot. Covered by `tests/timeline.spec.ts`.
</implementation-status>

<problem>Before/after connector segments and marker geometry must respond to first/last, density, line and dot content without consumers assembling decorative DOM.</problem>

<api>Internal direct props: first, last, line, color, icon, hideDot and resolved side/density as needed. Slots: dot/icon projection from parent. No model, emits, expose or public import.</api>

<composition>Immediate child of MTimelineItem. Receives all state by direct props; it neither injects parent context nor registers a ticket.</composition>

<reuse>`MIcon`, MColor scheme and nested timeline divider tokens. No independent context, event state, DOM measurement or interaction control.</reuse>

<behavior>Hide before line for first and after line for last; solid/dashed/none is parent policy. Marker remains centered on the logical axis and connector adapts to tokenized marker size. Custom dot content cannot alter sequence state.</behavior>

<accessibility>Wrapper, lines and default marker/icon are aria-hidden and nonfocusable. Interactive dot content is unsupported/documented invalid; event actions belong in item content.</accessibility>

<styles>Nested line/dot/icon/color/density/first/last tokens. Connector geometry uses CSS grid/pseudo elements and system values, never JS measurements or literal colors.</styles>

<ssr-lifecycle>Pure props/render leaf with no state or lifecycle hooks.</ssr-lifecycle>

<tests>First/middle/last, line modes, dot/icon/hide/custom content, sizes/density/color, decorative semantics, SSR and token resolution.</tests>

<done>All sequence connector geometry is private, decorative and driven by parent/item state.</done>

<questions>None.</questions>
