# MBreadcrumbs

<identity>
Vuetify reference: `VBreadcrumbs` · PrimeTime target: `MBreadcrumbs` · Phase: 3 · Type: public family parent
</identity>

<implementation-status state="done" updated="2026-07-16">
Public `MBreadcrumbs` with private `BreadcrumbsItem`/`BreadcrumbsDivider` leaves,
co-located `breadcrumbs/_index.scss` tokens and focused tests
(`tests/breadcrumbs.spec.ts`, 13 cases) are present; lint and stylelint pass.
The docs_v2 page is generated and validated. The kit layer ships no pages, so
link-mode tests install a memory router to exercise the canonical NuxtLink path
for real.
</implementation-status>

<status>
Discussed and approved. Mobile overflow is `scroll | wrap`, default `scroll`; interactive collapse is deferred. Family uses direct props rather than context.
</status>

<problem>
Route/content hierarchy needs consistent navigation semantics, current-page resolution, link rendering, dividers and constrained-width behavior without consumers manually wiring `nav`, ordered-list and ARIA rules.
</problem>

<solution>
Normalize a typed flat item list and render `nav > ol` with private item/divider leaves. Preserve every crumb at small widths through native horizontal scrolling or wrapping. Do not infer hierarchy/current state from the router and do not implement ellipsis collapse without a complete accessible disclosure/menu flow.
</solution>

<api>
```ts
export type MBreadcrumbsOverflow = 'scroll' | 'wrap'

export interface MBreadcrumbItem {
  id?: PropertyKey
  title: string
  to?: NuxtLinkProps['to']
  disabled?: boolean
  current?: boolean
}

export interface MBreadcrumbsProps {
  items: MBreadcrumbItem[]
  ariaLabel?: string
  divider?: string
  overflow?: MBreadcrumbsOverflow
}
```

Defaults: localized breadcrumbs label, `divider: 'chevron_right'`, `overflow: 'scroll'`. There is no parent-wide disabled prop, href/click data API, nested children, route-matching policy or arbitrary HTML field.
</api>

<composition>
```text
MBreadcrumbs
└── nav
    └── ol
        ├── li → BreadcrumbsItem
        ├── li aria-hidden → BreadcrumbsDivider
        └── …
```

Parent imports leaves explicitly and passes normalized values directly. No context is created: leaves are immediate children with no registration, deep injection or mutable shared state.
</composition>

<reuse>
`BreadcrumbsItem` reuses canonical `MLink` when available; in the current kit it uses `MButton variant="text" tag="link"` so NuxtLink resolution, focus and interaction states remain centralized. Divider reuses `MIcon`. Reuse locale/stable-key utilities and family tokens. Do not create raw navigation click handlers or a second link primitive.
</reuse>

<normalization>
The first explicit `current: true` wins. If none exists, the last non-disabled item is current. Multiple explicit current entries produce a development diagnostic and only the first is honored. Current stays noninteractive even when `to` is present.

Keys resolve from explicit `id`, then a deterministic serialized `to`, then index fallback with a development diagnostic. Input objects are not mutated.
</normalization>

<slots>
- `item`: replaces label content inside the leaf-owned link/span semantics.
- `divider`: replaces content inside the leaf-owned `aria-hidden` divider.
- `prepend` and `append`: optional content within the ordered-list boundary.

```ts
export interface MBreadcrumbsItemSlot {
  item: Readonly<MBreadcrumbItem>
  index: number
  current: boolean
  disabled: boolean
}
```

No whole-control item slot in v1: retaining semantic ownership prevents accidental loss of link/current/disabled wiring.
</slots>

<overflow>
`scroll` keeps a single logical row and native inline-axis scrolling; `wrap` allows multiple rows. No mounted scroll correction or ResizeObserver is used. CSS logical direction keeps the current trailing crumb naturally reachable and preserves all items in the accessibility tree.

Collapse is excluded until it includes an actual ellipsis button, hidden-items menu, keyboard behavior and focus return; CSS `display:none` for middle crumbs is forbidden.
</overflow>

<accessibility>
Root is `nav` with localized `aria-label`; children are an ordered list; dividers are hidden from assistive technology; exactly one current leaf receives `aria-current="page"`; current/disabled leaves are not focusable; active items use native/canonical link keyboard behavior. No roving focus is introduced.
</accessibility>

<styles>
Create one `components/breadcrumbs/_index.scss` nested map for container spacing/typography/overflow, item initial/hover/focus/pressed/current/disabled states and divider color/size/spacing/RTL transform. Leaves consume their own nested branches. No literal SFC values or runtime component-state variables.
</styles>

<ssr-and-lifecycle>
Items and current state normalize synchronously from props. The component does not call `useRoute`, inspect location, measure DOM or perform mounted initialization. CSS owns overflow; SSR and hydration select identical semantic elements.
</ssr-and-lifecycle>

<dx>
```vue
<MBreadcrumbs
  :items="[
    { title: 'Главная', to: '/' },
    { title: 'Каталог', to: '/catalog' },
    { title: 'Ноутбуки', to: '/catalog/laptops' },
    { title: 'PrimeBook' },
  ]"
/>
```
</dx>

<tests>
Normalization, explicit/default/multiple current, stable keys, active/current/disabled branches, canonical link reuse, slots, icon/text divider, RTL, scroll/wrap, long labels, ordered-list/ARIA semantics, SSR/hydration, tokens, lint and stylelint.
</tests>

<done>
Hierarchy renders as accessible, token-driven navigation with centralized link behavior and lossless responsive overflow.
</done>

<questions>
None.
</questions>
