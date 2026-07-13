# MPagination

<identity>
Vuetify reference: `VPagination` · PrimeTime target: `MPagination` · Phase: 4 · Type: public
</identity>

<implementation-status state="planned" updated="2026-07-13">
Specification is approved; only private table pagination exists, not the public
standalone `MPagination` described here.
</implementation-status>

<status>
Discussed and approved. Standalone numbered pagination remains distinct from the compact private `MTablePagination` footer.
</status>

<problem>
Card grids, search results and arbitrary server/client collections need accessible numbered page navigation with deterministic ellipsis and valid boundaries. The current table footer exposes only table-specific previous/next controls.
</problem>

<solution>
`MPagination` is a controlled 1-based page navigator. It receives the number of pages, renders a pure calculated range and updates only the page model. It owns no items, page slicing, fetching, router query, loading or table layout.

Non-goals:

- no `totalItems`/`itemsPerPage` alternative source;
- no item transformation or data cache;
- no fetching/loading/error state;
- no route/query synchronization;
- no roving focus or tablist semantics;
- no replacement of the table-specific footer.
</solution>

<api>
```ts
export interface MPaginationProps {
  length: number
  totalVisible?: number
  disabled?: boolean
  showFirstLast?: boolean
  showPrevNext?: boolean
  ariaLabel?: string
  firstLabel?: string
  previousLabel?: string
  nextLabel?: string
  lastLabel?: string
}

const model = defineModel<number>({ default: 1 })
```

Defaults: totalVisible 7, enabled, first/last hidden, previous/next shown, labels from locale. `length` is the sole number-of-pages source. Values are normalized to finite nonnegative integer length and 1-based page.</api>

<range-utility>
```ts
type PaginationRangeItem
  = | { type: 'page', page: number }
    | { type: 'ellipsis', key: 'start' | 'end' }

export function createPaginationRange(
  page: number,
  length: number,
  totalVisible: number,
): PaginationRangeItem[]
```

The pure utility always preserves first/last pages when ellipsis is needed, centers around the current page when possible and stays deterministic for SSR. Small lengths render all pages. `totalVisible` is normalized to a documented minimum; development diagnostics explain invalid values.</range-utility>

<model-normalization>
```ts
export function normalizePage(page: number, length: number): number
```

For positive length clamp/truncate to `[1, length]`; for zero length normalize to 1 and render no page buttons. If external page becomes invalid because length shrinks, update the model to the normalized value so visible selection and query/application state cannot diverge. Internal actions never emit out-of-range pages.</model-normalization>

<composition>
```text
nav
└── ol
    ├── optional first → MButtonIcon
    ├── previous → MButtonIcon
    ├── page/ellipsis range
    │   ├── page → MButton
    │   └── ellipsis → decorative span
    ├── next → MButtonIcon
    └── optional last → MButtonIcon
```

Page controls reuse `MButton`; directional controls reuse `MButtonIcon`. Current page uses the approved selected/tonal presentation. Icons are logical-direction aware in RTL.</composition>

<reuse>
Reuse `MButton`, `MButtonIcon`, `MIcon`, locale labels and the exported pure range/normalization utilities. Table pagination may reuse boundary helpers or optionally compose numbered mode later. Do not copy button state layers or nav ARIA into consumers.</reuse>

<slots>
- `item`: whole page-control customization.
- `first`, `previous`, `next`, `last`: whole directional controls.
- `ellipsis`: decorative range gap content.

```ts
interface PaginationItemSlot {
  page: number
  current: boolean
  props: {
    type: 'button'
    ariaLabel: string
    ariaCurrent?: 'page'
    disabled: boolean
    onClick: () => void
  }
}
```

Directional slots receive target page, disabled state and equivalent safe button bindings. Consumers replacing whole controls retain native button/link semantics and accessible names.</slots>

<accessibility>
Root is `nav` with localized label and contains an ordered list. Every page has a localized “go to page N” accessible name; current uses `aria-current="page"` and a current-page label. Ellipsis is `aria-hidden` and nonfocusable. Boundary controls use real disabled semantics.

Pagination uses native Tab/Shift+Tab and Enter/Space behavior. It does not intercept arrows/Home/End or implement roving focus because the control is neither tablist nor radiogroup.</accessibility>

<responsive>
The component does not measure viewport or support `totalVisible="auto"`. Consumers derive a numeric value using the existing SSR-safe breakpoint system and pass it explicitly. Range output therefore remains deterministic on server and client.</responsive>

<table-integration>
`MTablePagination` keeps table-specific total/page-size information and compact previous/next layout. It may reuse `normalizePage`/boundary utilities or later render `MPagination` in a numbered mode. `MPagination` itself never imports table context.</table-integration>

<styles>
Create `components/pagination/_index.scss` with one nested token map for container gap/alignment/wrap, control size relationship and ellipsis typography/color. Page and directional interactive states remain owned by reused button components; pagination does not copy their colors/opacities/elevation.</styles>

<ssr-lifecycle>
Range derives synchronously from length/model/totalVisible. Model normalization is guarded against emit loops and works consistently during setup/prop changes. No DOM measurement, lifecycle hooks, observers, timers or listeners.</ssr-lifecycle>

<dx>
```vue
<MPagination
  v-model="page"
  :length="pageCount"
/>
```

```ts
const pageCount = computed(() =>
  Math.ceil(totalItems.value / itemsPerPage.value),
)
```

Server loading policy remains explicit:

```vue
<MPagination
  v-model="page"
  :length="pageCount"
  :disabled="status === 'pending'"
/>
```
</dx>

<edge-cases>
Zero/one page; negative/nonfinite/noninteger inputs; current at first/last/middle; length shrink/growth; minimal totalVisible; disabled entire control; hidden prev/next or first/last; long localized labels; RTL directional icons; slot bindings cannot target invalid pages.</edge-cases>

<tests>
Range utility snapshots across boundaries; normalization and guarded model updates; zero/small/large lengths; all controls/visibility props; safe slots; ARIA/nav/current/ellipsis/disabled semantics; native keyboard flow; RTL; SSR/hydration; responsive numeric input; table utility reuse; light/dark tokens; lint/stylelint.</tests>

<done>
Arbitrary collections receive a compact accessible numbered navigator that never exposes invalid pages and owns no data or transport state.</done>

<questions>
None.
</questions>
