# BreadcrumbsDivider

<identity>
Vuetify reference: `VBreadcrumbsDivider` · PrimeTime target: private `BreadcrumbsDivider` · Phase: 3 · Type: sub
</identity>

<implementation-status state="planned" updated="2026-07-13">
Leaf specification is approved; no breadcrumbs divider implementation or focused tests were found.
</implementation-status>

<status>
Approved as a stateless decorative leaf.
</status>

<problem>
Separators need consistent icon/text rendering, spacing and RTL direction without becoming list content announced between every crumb.
</problem>

<api>
```ts
interface BreadcrumbsDividerProps {
  divider: string
}
```

Default slot replaces visual content. No events, model, route state or public import.
</api>

<composition>
Parent inserts the divider only between items. The leaf wrapper is `aria-hidden="true"`; icon-like configured values render through `MIcon`, while explicit text such as `/` renders as text according to the documented discriminator/normalized parent value.
</composition>

<reuse>
Reuse `MIcon` and nested family tokens. No context, focus behavior, route logic or independent state.
</reuse>

<accessibility>
Entire divider wrapper is hidden from the accessibility tree, nonfocusable and has no interactive role. RTL visual direction is CSS-driven and never changes item DOM order.
</accessibility>

<styles>
Consume nested divider color, inline spacing, icon size and RTL transform tokens from the breadcrumbs family map. No separate token system or literal values.
</styles>

<ssr-and-lifecycle>
Pure render leaf without state or lifecycle hooks; identical SSR/hydrated markup.
</ssr-and-lifecycle>

<edge-cases>
No divider before first/after last item; one item renders no divider; custom text and icon both remain hidden semantically; custom slot cannot accidentally become focusable because the wrapper is aria-hidden and documented as decorative only.
</edge-cases>

<tests>
Between-only placement, icon/text/custom rendering, aria-hidden/nonfocusable behavior, RTL transform, SSR and tokens.
</tests>

<done>
Dividers remain visually configurable, semantically silent and independent of navigation state.
</done>

<questions>
None.
</questions>
