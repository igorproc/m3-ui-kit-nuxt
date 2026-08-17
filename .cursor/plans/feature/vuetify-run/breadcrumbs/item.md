# BreadcrumbsItem

<identity>
Vuetify reference: `VBreadcrumbsItem` · PrimeTime target: private `BreadcrumbsItem` · Phase: 3 · Type: sub
</identity>

<implementation-status state="done" updated="2026-07-16">
Private leaf at `app/components/fragments/breadcrumbs/item/index.vue`: active crumbs
render through `MButton variant=text tag=link`, current/disabled render as text
with `aria-current`/`aria-disabled`. Covered by `tests/breadcrumbs.spec.ts`
(all semantic branches, current precedence, tab order, slot content).
</implementation-status>

<status>
Approved. Active crumbs reuse `MLink` or the current canonical `MButton` text-link path; current/disabled crumbs render as text.
</status>

<problem>
Each crumb needs one authoritative decision between navigation link, current-page text and disabled text while preserving shared focus/state styling.
</problem>

<api>
```ts
interface BreadcrumbsItemProps {
  item: Readonly<MBreadcrumbItem>
  index: number
  current: boolean
}
```

Content-only default slot receives item/index/current/disabled. No model, emits, public import or click API.
</api>

<composition>
```text
enabled + to + !current → MLink when available
                        → current kit: MButton variant=text tag=link
current                 → span aria-current=page
disabled                → span aria-disabled=true
missing to              → span
```

The link control receives `to` and the minimal text variant; breadcrumb-specific spacing is applied by the family wrapper/tokens without recreating link state machinery.
</composition>

<reuse>
Reuse canonical link behavior (`MLink`, or `MButton` text-link until `MLink` exists), Nuxt route typing and family tokens. Do not render a raw NuxtLink alongside a parallel custom state implementation. Do not render current/disabled as links with prevented clicks.
</reuse>

<accessibility>
Only actionable crumbs enter tab order. Current uses `aria-current="page"`; disabled text may expose `aria-disabled="true"` but has no interactive role. Visible title is never replaced solely by a tooltip/title attribute. Slot content remains inside leaf-owned semantics.
</accessibility>

<styles>
Consume nested item tokens for text-link sizing plus initial, hover, focused, pressed, current and disabled branches. Interactive layers come primarily from the reused control; breadcrumb tokens adapt typography/spacing and noninteractive states without duplicating button tokens.
</styles>

<ssr-and-lifecycle>
Pure prop-derived semantic branch. No route lookup, watchers, listeners or lifecycle hooks.
</ssr-and-lifecycle>

<edge-cases>
Current with `to` remains text; disabled current resolves as current text with no link; empty title still preserves structure but emits a development diagnostic; complex `to` passes unchanged to canonical link control; custom label cannot replace the semantic root.
</edge-cases>

<tests>
All semantic branches, current precedence, canonical text-link bindings, tab order, ARIA, slot content, complex routes, SSR and token resolution.
</tests>

<done>
Every crumb has exactly one semantic state and reuses the kit's canonical navigation control.
</done>

<questions>
None.
</questions>
