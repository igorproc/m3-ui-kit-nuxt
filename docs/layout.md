# Auto-layout: the carving engine and column system

The layout system arranges an application shell — app bars, rails, footers, content — with a
**generated CSS grid**, and provides an MD3 column grid for the content itself. The
principles: SSR-first (no measurement, no `ResizeObserver`), zero CLS (all geometry is CSS
and applies before first paint), and Vuetify-like ergonomics (no manual `order`).

Design notes and decision history: `.cursor/plans/auto-layout.md`, phase summaries in
`.cursor/summary/`.

---

## 1. The engine: carving

`<m-layout>` is the grid root. Layout components register **only as direct children** of
`m-layout` — the check walks the instance tree, comparing `instance.parent` against the
context owner, so a `provide` reaching through a wrapper does not count.

**DOM order is carving priority.** The registry is walked in order and each element cuts a
strip off the remaining rectangle: `top`/`bottom` take a row across the remaining width,
`start`/`end` take a column across the remaining height. Whoever comes first in the DOM owns
the corner (Vuetify's semantics):

```vue
<m-layout full-height>          <!-- a Steam-style shell -->
  <m-system-bar />              <!-- row 1, full width -->
  <m-app-bar title="Store" />   <!-- row 2, full width -->
  <m-layout-footer sticky size-token="44rem" /> <!-- last row, full width -->
  <m-layout-aside sticky size-token="256rem" /> <!-- column BETWEEN the bars and the footer -->
  <m-layout-main>…</m-layout-main>
</m-layout>
```

From the registry the engine generates `grid-template-areas/columns/rows` for three device
ranges (mobile < 768 / tablet 768–1199 / desktop >= 1200 — the boundaries come from
`materialKit.breakpoints`) and injects them through `useHead` as a scoped style on
`#<layoutId>`. SSR ships a finished grid and the browser picks a range by `@media`, with no
JS involved. Grid area names are element ids; every zone element carries
`data-m3-zone="<id>"`, which the generated CSS uses to address per-item rules (sticky
positioning, hiding outside a range).

Range defaults: on mobile the side zones are not part of the grid at all, on tablet the
`end` side is dropped. A zone that falls out of range is hidden with `display: none` —
otherwise its element would become an implicit track and break the grid.

- `full-height` — `height: 100dvh; overflow: hidden`: the page does not scroll,
  `m-layout-main` does (Discord/Steam-style shells).
- **Only registering components may be direct children.** A stray element becomes an
  implicit track and breaks the grid; a dev warning tells you to wrap it in
  `m-layout-main` / `m-layout-item`.
- Late mounts (`v-if` after hydration) are re-sorted by their real DOM position.

### Zones (multi-instance, auto-id)

| Component | kind | Props | Sticky by default |
| :--- | :--- | :--- | :--- |
| `m-layout-header` | top | `sticky`, `sizeToken` | **true** |
| `m-layout-footer` | bottom | `sticky`, `sizeToken` | false |
| `m-layout-aside` | start/end | `position` (`start\|end`, legacy `left\|right`), `sticky`, `sizeToken` | false |
| `m-layout-main` | main | — | — |
| `m-layout-item` | any | `kind`, `id?`, `sizeToken`, `sticky`, `force` | false |

There may be any number of zones on one edge — each gets its own row or column. `sizeToken`
accepts either a CSS variable name (`--ui-app-bar-height-small`) or a **raw size**
(`44rem`). `force` on `m-layout-item` is an escape hatch for registering from underneath
renderless wrappers (`Transition` and friends) that break the parent chain.

### Self-registering components

`m-app-bar`, `m-system-bar`, `m-navigation-rail` and `m-navigation-bar` register themselves
when they are direct children of `m-layout` — no wrapper zone needed. **Inside a zone** the
same components instead **contribute their size to that zone**: a zone with no explicit
`sizeToken` sums its children's contributions, so `m-system-bar` + `m-app-bar` in one
`m-layout-header` produce a row as tall as both. Expanding a rail changes its token, and the
grid animates (`transition: grid-template-*`).

`m-navigation-drawer` (temporary, `v-model`) is a modal overlay, **not** a layout unit.

---

## 2. Sticky mechanics

The governing CSS fact: a grid item's containing block is its own grid area, so
`position: sticky` cannot move inside a row of exact height. Hence two different mechanisms:

- **top/bottom + `sticky`** → `position: fixed`, while the grid row **reserves the space**
  through a size variable: zero CLS, content does not jump. A sticky top/bottom zone
  therefore **must have a size** — an explicit token, or a contributing child. A size-less
  one degrades to normal flow with a dev warning.
- **start/end + `sticky`** → real `position: sticky` (the column area is tall):
  `align-self: start; inset-block-start: var(--m3-layout-<id>-top);
  height: calc(100dvh − top − bottom-sticky)`. A non-sticky footer is not subtracted —
  otherwise there would be a gap while it is off screen.

Offsets are computed **per item** during carving: each element knows which strips were cut
before it. A second sticky header automatically gets `top` = the first one's height; a bar
carved after a side column gets `inset-inline-start` = that column's width. All properties
are logical, so the layout is RTL-ready.

Positioning is emitted into the **generated CSS**
(`#<layoutId> > [data-m3-zone="<id>"]`), not into inline styles. A zone's size derived from
its children is only known after the whole tree has rendered (it arrives in the head
payload), while a parent's inline style is computed before its children's setup — the inline
variant lost `position` during SSR and with JS disabled. Only `grid-area` stays inline.

Limits: the fixed coordinates assume the layout starts at the top of the viewport (the
standard app shell), and `.m-layout` uses `contain: style` — not `layout`, which would break
fixed descendants.

---

## 3. Zone context (`useLayoutZone`)

Any descendant of `m-layout` can read a rich context (`null` outside a layout, never throws):

```ts
const zone = useLayoutZone()
// zone.layoutId                     — root id
// zone.items                        — zone registry (read-only, DOM order)
// zone.insets.top|right|bottom|left — CSS expressions for the cumulative edges
// zone.windowY                      — scroll of the active scroller (document OR main in full-height)
// zone.scrollLock(true|false)       — ref-counted scroll lock
// zone.sticky.top|bottom            — ready-made offsets for position: sticky
```

`windowY` listens to both `window` and `m-layout-main` — only the one actually scrolling
emits, so there is no mode to distinguish — with a single passive listener per layout.
`m-app-bar` raises its elevation through it (the `isScrolled` prop is a deprecated forced
override).

### CSS variables (on `#<layoutId>`, per range)

| Variable | Meaning |
| :--- | :--- |
| `--m3-layout-<id>-size` | zone size (its grid track) |
| `--m3-layout-<id>-top` / `-bottom-sticky` | per-item vertical offsets |
| `--m3-layout-<id>-start` / `-end` | per-item horizontal offsets |
| `--m3-layout-inset-top/right/bottom/left` | cumulative layout edges (FAB, snackbar, sticky content) |

---

## 4. Column system: m-container / m-row / m-col

SCSS-first: responsiveness is entirely statically generated `@media` classes built from
`$material-kit-breakpoints`. The thresholds are px — rem in a media query resolves against
the initial 16px and would drift badly under the fluid `1rem = 1px` scale. JS only maps
props to class names. Zero CLS.

### m-container

The MD3 layout grid: **4 columns (< 768) / 8 (>= 768) / 12 (>= 1200)**, gutters and margins
16rem → 24rem, a stepped `max-width` (1200rem / 1600rem; `fluid` removes it). Override with
`:cols="2"`, `:cols-tablet-xs`, `:cols-tablet`, `:cols-desktop-xs`, `:cols-desktop`.

### m-col

A span is **relative to the active column count**: `cols="2"` is half the row on mobile
(4 columns) and a sixth on desktop (12). Spans are clamped to the column count
(`span min()`); with no props a column takes the whole row.

```vue
<m-container>
  <m-col desktop-xs="2">aside</m-col>   <!-- mobile: full row; >= 1200: 2 of 12 -->
  <m-col desktop-xs="8">main</m-col>
  <m-col desktop-xs="2">aside</m-col>
</m-container>
```

Props: `cols` (the mobile-first base) plus `mobile`, `tablet-xs`, `tablet`, `desktop-xs`,
`desktop`; `offset` and `offset-<bp>` map to `grid-column-start`, and `offset-<bp>="0"`
resets to auto flow.

**Key semantics** (mobile-first, activating at `min-width` equal to the kit's constant):

| Key | min-width | Default columns |
| :--- | :--- | :--- |
| `mobile-xs` | 0 | 4 |
| `mobile` | 767px | 4 |
| `tablet-xs` | 768px | 8 |
| `tablet` | 1199px | 8 |
| `desktop-xs` | 1200px | 12 |
| `desktop` | 1920px | 12 |

> For "tablet" behaviour use `tablet-xs` (>= 768). `tablet` activates at 1199px — this is
> consistent with the kit's existing SCSS mixins (`bp-tablet`).

### m-row (optional) and utilities

`m-row` is a semantic row built on `subgrid`: it forces a wrap (`grid-column: 1/-1`) and
inherits the column lines. Its gap is set explicitly from `--m-container-gutter`, because
subgrid does not cover the inline axis here. Props: `align="start|center|end|stretch"`,
`no-gutters`.

`<m-spacer>` is a flex spacer. `<m-responsive aspect-ratio="16 / 9">` is a fixed-ratio
wrapper whose content is `position: absolute; inset: 0`.

---

## 5. Rules and anti-patterns

1. **Do not hand-build bars.** No custom `position: fixed/sticky` for headers or sidebars —
   zones do that, with correct per-item offsets.
2. A sticky top/bottom zone without a size does not work (see §2) — give it a `sizeToken`,
   or put a component with a height token inside it.
3. Only registering components may be direct children of `m-layout`.
4. Custom zone sizes come from tokens and expressions, never from measurement.
5. Prefer `is` from `useBreakpoint()` over `more`/`less` when branching on device class —
   see [architecture.md](architecture.md#3-the-viewport-layer).
