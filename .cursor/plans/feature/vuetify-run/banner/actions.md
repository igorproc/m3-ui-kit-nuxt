# BannerActions

<identity>
Vuetify reference: `VBannerActions` · PrimeTime target: private `BannerActions` · Phase: 3 · Type: sub
</identity>

<implementation-status state="done" updated="2026-07-16">
Private leaf lives at `app/components/ui/banner/actions/index.vue`, is mounted
by `MBanner` only when an `actions` slot exists, takes `layout` as an explicit
prop and reads the parent's nested `actions` token paths. Covered by
`tests/banner.spec.ts` (conditional mount, layout modifier, stable DOM order).
</implementation-status>

<status>
Discussed and approved as a stateless private layout leaf.
</status>

<problem>
Banner actions must align and wrap consistently across inline/stacked layouts without forcing consumers to recreate spacing or letting responsive CSS reorder keyboard navigation.
</problem>

<solution>
Render the parent `actions` slot in one private semantic-neutral wrapper. The leaf owns only action layout. It does not inspect, register, prioritize or invoke actions.
</solution>

<api>
```ts
interface BannerActionsProps {
  layout: MBannerLayout
}
```

Default slot only. No model, emits, expose API or public auto-import name.
</api>

<composition>
`MBanner` imports and renders the leaf directly only when the actions slot exists. It passes `layout` as an explicit prop. There is no context: the leaf is an immediate child and needs no shared state, descendant registration or cross-tree coordination.
</composition>

<reuse>
Reuse the parent layout type and nested banner action tokens. Slot consumers use `MButton`. Do not create action tickets, selection state, context, ResizeObserver, click handlers or a private button implementation.
</reuse>

<behavior>
`inline` aligns actions at the logical end of the main row. `stacked` places them in the trailing secondary row. `auto` exposes the CSS modifier/container rule required for responsive switching. Flex/grid visual placement must never use `order` to change DOM order.
</behavior>

<accessibility>
The wrapper adds no landmark or toolbar role because arbitrary links/buttons may appear and banner actions are not a command toolbar. Native child semantics and focus order remain intact. RTL changes visual alignment through logical properties, not DOM order.
</accessibility>

<styles>
Use the parent co-located token source through the nested actions paths for gap, alignment, wrap and row spacing. No separate theme system, local Sass variables, literal layout values or interactive state layers.
</styles>

<ssr-and-lifecycle>
Pure render/layout leaf with no reactive state, listeners, observers, timers or lifecycle hooks. SSR output is identical to hydrated output.
</ssr-and-lifecycle>

<edge-cases>
Zero actions means the parent does not mount the leaf; one action aligns correctly; multiple long labels wrap without overlap; mixed links/buttons preserve source order; custom controls remain consumer-owned.
</edge-cases>

<tests>
Conditional mount, inline/stacked/auto modifiers, wrapping, DOM and keyboard order, RTL logical alignment, SSR markup, token lookup, lint and stylelint.
</tests>

<done>
Banner actions have deterministic responsive alignment without state, context, public API or reordered accessibility flow.
</done>

<questions>
None.
</questions>
