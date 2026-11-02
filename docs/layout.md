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
  `m-layout-main` does (Discord/Steam-style shells). Only in this mode `m-layout-main` is a scroller
  (`m-layout-main--scroll`): it reserves its scrollbar gutter (`scrollbar-gutter: stable`), so
  content does not shift sideways when the scrollbar appears or goes, and it is a Tab stop
  (`tabindex="0"`, rendered by the server) with an inset focus ring, so its content can be scrolled
  from the keyboard even when nothing inside is focusable. The tab stop stays when main does hold
  focusable content: finding that out takes a DOM check after hydration, and the attribute would
  change on the client.
- Page-scroll mode (the default): the document scrolls and `m-layout-main` is **not** a scroll
  container (`overflow-x: clip`, `overflow-y: visible`). `position: sticky` inside main sticks to
  the window — offset it by `var(--m3-layout-inset-top)` to rest below the pinned zones — and
  content wider than main is clipped rather than scrolled; give a wide table its own scroller.
- **Only registering components may be direct children.** A stray element becomes an
  implicit track and breaks the grid; a dev warning tells you to wrap it in
  `m-layout-main` / `m-layout-item`.
- Late mounts (`v-if` after hydration) are re-sorted by their real DOM position.

### Zones (multi-instance, auto-id)

| Component | kind | Props | Sticky by default |
| :--- | :--- | :--- | :--- |
| `m-layout-header` | top | `sticky`, `sizeToken` | **true** |
| `m-layout-footer` | bottom | `sticky`, `sizeToken` | false |
| `m-layout-aside` | start/end | `position` (`start\|end`), `sticky`, `sizeToken` | false |
| `m-layout-main` | main | `container` | — |
| `m-layout-item` | any | `kind` (required), `id?`, `sizeToken`, `sticky`, `force` | false |

There may be any number of zones on one edge — each gets its own row or column. `sizeToken`
accepts either a CSS variable name (`--ui-app-bar-height-small`) or a **raw size**
(`44rem`). `force` on `m-layout-item` is an escape hatch for registering from underneath
renderless wrappers (`Transition` and friends) that break the parent chain.

`kind` on `m-layout-item` is required: an item without one is not a zone (no grid area, a dev
warning) — it never falls back to a second `main`. `m-layout-item kind="main"` gets the same
contract as `m-layout-main` (`m-layout-item--main`: it may shrink below its content, and it is
the scroller only in `full-height` mode).

### Container queries in main (`container`)

`m-layout-main` is a size container only on request: `<m-layout-main container>` makes it
`container: main-content / inline-size`. Without the prop it is no container, so a
`position: fixed` element inside it (a FAB, a snackbar) stays relative to the window. With the
prop, keep fixed elements out of main — in an `m-layout-item` or in `app.vue` — because a size
container may become their containing block.

```vue
<m-layout-main container>
  <article class="inbox">…</article>
</m-layout-main>

<style>
@container main-content (inline-size > 720rem) {
  .inbox { grid-template-columns: 320rem 1fr; }
}
</style>
```

### Nested layouts

An `m-layout` inside a zone of another one is marked `m-layout--nested`: it is as tall as its
content (`min-height: 0`, not `100dvh`), and its zones stay in flow — `sticky` on its header or
footer pins nothing, because the outer layout owns the window, its pinned bands and its cutouts.
The nested grid is carved as usual.

`<m-main>` is removed, without an alias: it was no zone and drew a second `<main>`. Use
`m-layout-main` inside `m-layout`.

### Self-registering components

`m-app-bar`, `m-system-bar`, `m-navigation-rail` and `m-navigation-bar` register themselves
when they are direct children of `m-layout` — no wrapper zone needed. **Inside a zone** the
same components instead **contribute their size to that zone**: a zone with no explicit
`sizeToken` sums its children's contributions, so `m-system-bar` + `m-app-bar` in one
`m-layout-header` produce a row as tall as both. Expanding a standard rail
(`v-model:expanded`) changes its token, and the grid animates (`transition: grid-template-*`).
A `mode="modal"` rail keeps its collapsed width in the grid and expands over the content; a
`mode="dismissible"` one reserves nothing (`0rem`) and only opens over the content.

Put `m-app-bar` directly into `m-layout` or into `m-layout-header`. Inside `m-layout-main` it is
ordinary page content: it registers no zone and its height reserves nothing. Its own `sticky`
(`ui-app-bar--sticky`, on by default) then sticks it to the top of the nearest scroller — in
page-scroll mode that is the window, under the pinned zones — so turn `sticky` off there or use
it in a `full-height` main. The small bar has no block padding: its 64rem `min-height` centres
the controls, and a 56rem search bar still fits the height the zone reserves; medium and large
keep their `8rem`. Inside `m-layout-header` the bar renders a `<div>`: the zone is the banner. In a
pinned zone a medium or large title keeps one line — the zone reserves one height, with no
measuring. `scroll-behavior="collapse"` does not collapse a bar that is the zone of a
`full-height` layout (its row is cut at the expanded height, a gap would open under it), and the
document's `scroll-padding` keeps the expanded height.

`m-navigation-rail` fills a side zone (`m-layout-aside`, `m-layout-item kind="start|end"`) as
`ui-navigation-rail--hosted`; anywhere else, `m-layout-main` included, it keeps its own width.
As page content of a `full-height` main it sticks to main's own top and is as tall as main's
visible height (`ui-navigation-rail--in-scroller`): main is the scroller and already sits
between the pinned bands.

`m-navigation-drawer` (temporary, `v-model`) is a modal overlay, **not** a layout unit.

---

## 2. Sticky mechanics

The governing CSS fact: a grid item's containing block is its own grid area, so
`position: sticky` cannot move inside a row of exact height. Hence two different mechanisms:

- **top/bottom + `sticky`** → `position: fixed`, while the grid row **reserves the space**
  through a size variable: zero CLS, content does not jump. A sticky top/bottom zone
  therefore **must have a size** — an explicit token, or a contributing child. A size-less
  one degrades to normal flow with a dev warning. Out of the grid a fixed zone would shrink to
  its content, so it gets `min-block-size: var(--m3-layout-<id>-size)` and always fills the row
  it reserves.
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

### Display cutouts (safe area)

With `<meta name="viewport" content="…, viewport-fit=cover">` the page extends under the status
bar, the notch and the home indicator, and the browser reports their size as
`env(safe-area-inset-*)`. Opting in is the app's decision; without `viewport-fit=cover` every
inset is zero and nothing below changes the layout.

The outermost `m-layout` hands each cutout to the zone that touches that window edge:

- **top** — the first pinned top zone, provided no sized top zone is carved before it (so it
  sits at the window's top edge);
- **bottom** — the first pinned bottom zone (its fixed offset from the bottom edge is zero);
- **left and right** — every top or bottom zone that spans the full width, i.e. no side zone
  was carved before it in the current range;
- **inline start and end** — the first side zone carved on each side, pinned or not: its column
  runs the whole height of that window edge. The side is logical, so in RTL the `start` zone
  takes the right cutout. `env()` knows only left and right, so the layout declares
  `--m3-layout-safe-inline-start/end` per writing direction (`:dir(rtl)` swaps them).

The cutout becomes a transparent border on that edge: the zone's own surface paints under the
notch, and its own padding stays as it is (a generated `padding` would replace it). A zone that
takes a top or bottom cutout also grows by it
(`min-block-size: size + inset`), its grid row reserves `size + inset`, and the inset joins the
offsets of the zones carved after it, `--m3-layout-inset-*` and the document's `scroll-padding`.
A side zone's column reserves `size + inset` the same way (a sizeless one is an `auto` column,
which its border widens), and the inset joins `--m3-layout-inset-inline-*` and the offsets of the
bars carved after it. Everything is generated CSS, so it works with SSR and without JS.

Not covered yet: bars that touch only one side, in-flow zones on the block axis, and nested
layouts — the outer layout owns the window.
`m-container` keeps its own content clear of the side cutouts (§4). A wrapper zone such as
`m-layout-header` has no surface of its own, so the strip under the notch shows whatever lies
behind it: put the bar directly into `m-layout`, or give the wrapper a background.

---

## 3. Zone context (`useLayoutZone`)

Any descendant of `m-layout` can read a rich context (`null` outside a layout, never throws):

```ts
const zone = useLayoutZone()
// zone.layoutId                     — root id
// zone.items                        — zone registry (read-only, DOM order)
// zone.insets.top|bottom|start|end — CSS expressions for the cumulative edges (start/end are logical)
// zone.windowY                      — scroll of the active scroller (document OR main in full-height)
// zone.scrollLock(true|false)       — ref-counted scroll lock
// zone.sticky.top|bottom            — ready-made offsets for position: sticky
```

The zone context and the layout components are the whole public API. The carving engine, the CSS
builder, the zone registry and the scroll lock are internals in `utils/layout/`: they are not
auto-imported, and the types a consumer meets (`LayoutKind`, `LayoutItem`, `LayoutZone`) come
from `useLayout`.

`windowY` listens to both `window` and `m-layout-main` — only the one actually scrolling
emits, so there is no mode to distinguish — with a single passive listener per layout.
`m-app-bar` fills its container through it (the `scrolled` prop is a controlled override).
`scrollLock` freezes the active scroller only — the document, plus `m-layout-main` in
`full-height` mode: in page-scroll mode `overflow: hidden` would turn main into a scroll
container and every sticky element inside it would jump while the lock holds.

### CSS variables (on `#<layoutId>`, per range)

| Variable | Meaning |
| :--- | :--- |
| `--m3-layout-<id>-size` | zone size (its grid track) |
| `--m3-layout-<id>-top` / `-bottom-sticky` | per-item vertical offsets |
| `--m3-layout-<id>-start` / `-end` | per-item horizontal offsets |
| `--m3-layout-inset-top/bottom` | cumulative block edges (FAB, snackbar, sticky content), including the cutout taken by a top or bottom zone |
| `--m3-layout-inset-inline-start/inline-end` | cumulative inline edges: the sum of the `start` / `end` side zones, so they follow the writing direction (`inline-start` is the right edge in RTL) |
| `--m3-layout-safe-inline-start/inline-end` | the side display cutouts in the writing direction (`env(safe-area-inset-left/right)`, swapped in RTL); declared only when the layout has a side zone |

**The outermost layout also publishes the four `--m3-layout-inset-*` on `html`**, per range, for
surfaces that live outside the layout element — a teleported snackbar or anything `position:
fixed` in the overlay host: `bottom: calc(var(--m3-layout-inset-bottom, 0px) + 16rem)` keeps it
above the navigation bar. On `html` the block edges count only what reaches into the window: in
`full-height` mode every top and bottom zone, in page-scroll mode only the pinned ones (an in-flow
footer scrolls away). Inside the layout the same names keep the full sums. A nested layout
publishes nothing on `html`. A FAB that is not a zone is not part of any inset.

**Zone size tokens live on `:root` or are literals.** The `html` rule (insets, and in page-scroll
mode the document's `scroll-padding`) carries its own copy of each zone's size
(`--m3-layout-<id>-size: <sizeToken>`). A token defined on the layout element or on a wrapper is
undefined on `html`, so the inset and the scroll padding would be lost: declare it on `:root` (as
the kit does for `--ui-app-bar-height-*`) or pass a literal (`size-token="56rem"`).

---

## 4. Column system: m-container / m-row / m-col

SCSS-first: responsiveness is entirely statically generated `@media` classes built from
`$material-kit-breakpoints`. The thresholds are px — rem in a media query resolves against
the initial 16px and would drift badly under the fluid `1rem = 1px` scale. JS only maps
props to class names. Zero CLS.

### m-container

The MD3 layout grid: **4 columns (< 768) / 8 (>= 768) / 12 (>= 1200)**, gutters and margins
`spacing(16)` → `spacing(24)` at `tablet-xs`, a stepped `max-width` (1200rem / 1600rem; `fluid`
removes it). Override with `:cols="2"`, `:cols-tablet-xs`, `:cols-tablet`, `:cols-desktop-xs`,
`:cols-desktop`.

The side margin never drops under a display cutout: the inline padding is
`max(margin, env(safe-area-inset-left))` on the left and the same with `right` on the right, so
in landscape the content clears the notch. The container does not know whether a rail already
covers that edge, so next to a rail the margin can grow by more than it needs to.

By default the breakpoints measure the **window**. `<m-container container>` measures its own
width instead (`@container`, inline size only): inside a drawer, a card or a narrow pane the grid
keeps 4 columns and 16rem margins even on a wide window. A box cannot query its own width, so in
this mode the root is the size container (`container: m-container / inline-size`) and the grid
moves onto an inner `m-container__grid`, with the column props and the margins. The `m-col`
inside switch to the container's breakpoints by themselves; an `m-container` without the prop
nested inside goes back to the window. The `max-width` steps still follow the window.

```vue
<m-container container>                 <!-- 4 columns in a 480rem drawer on any window -->
  <m-col tablet-xs="4">half from a 768px-wide container on</m-col>
</m-container>
```

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

> For "tablet" behaviour use `tablet-xs` (>= 768). `tablet` activates at 1199px, the top of
> the tablet band. The SCSS mixins follow the same `-xs` starts: `bp-tablet` is
> `min-width: tablet-xs` (768) and `bp-desktop` is `min-width: desktop-xs` (1200).

### m-row (optional) and utilities

`m-row` is a semantic row built on `subgrid`: it forces a wrap (`grid-column: 1/-1`) and
inherits the column lines. Its gap is set explicitly from `--m-container-gutter`, because
subgrid does not cover the inline axis here. Props: `align="start|center|end|stretch"`,
`no-gutters`.

`<m-spacer>` is a flex spacer. `<m-responsive aspect-ratio="16 / 9">` is a fixed-ratio
wrapper built on CSS `aspect-ratio`. Its content is **not** positioned: children stay in normal
flow, so a media child fills the box with `width: 100%; height: 100%` (plus `object-fit` for an
image or video), and anything taller than the ratio is clipped. The clip reaches past the box
by the width plus the offset of the kit's focus ring (`overflow: clip` with
`overflow-clip-margin`), so a focusable child that fills the box keeps its whole ring. The
same margin applies to content: a child larger than the box shows up to that distance beyond
its edges, so size media to the box rather than letting it overflow. A browser without
`overflow-clip-margin` clips at the box edge.

---

## 5. M3 window size classes

M3 describes layout by **window size class** and recommends one navigation component per class.
The kit keeps its own breakpoints (`materialKit.breakpoints`) and does not move them; the table
maps each M3 class onto the kit's defaults as they are.

| M3 window class | Width in M3 | Kit range in `m-layout` | Kit keys | M3 navigation | Kit zones |
| :--- | :--- | :--- | :--- | :--- | :--- |
| compact | < 600 | mobile (< 768) | `mobile-xs`, `mobile` | navigation bar | `m-navigation-bar` — a pinned `bottom` zone; side zones are not part of the mobile grid |
| medium | 600–839 | mobile below 768, tablet from 768 | `mobile`, `tablet-xs`, `tablet` | navigation rail | below 768 still the bar (no side zones); from 768 `m-navigation-rail` — a sticky `start` zone |
| expanded | 840–1199 | tablet | `tablet` | navigation rail | `m-navigation-rail` in `start`; `end` zones are dropped on tablet |
| large | 1200–1599 | desktop (>= 1200) | `desktop-xs` | expanded rail or standard drawer | `m-navigation-rail expanded`, or an `m-layout-aside` holding a drawer, in `start`; `end` zones return |
| extra-large | >= 1600 | desktop | `desktop-xs`, `desktop` | as large | as large; `m-container` widens its `max-width` from `desktop` (1920) |

The kit's names do not mean what M3's do: the kit's tablet range (768–1199) is the upper part
of M3's medium (768–839) plus all of expanded, and the margin steps from 16 to 24 at 768 rather
than at 600.

`useBreakpoint().is` also carries the M3 class names — `compact`, `medium`, `expanded`, `large`,
`extraLarge` — as aliases over the kit's ranges, not over M3's numbers: `compact` is below
`tablet-xs`, `medium` and `expanded` are both `tablet-xs`…`desktop-xs` (the kit has no boundary at
840, so the two are the same range), `large` is `desktop-xs`…`desktop`, `extraLarge` is from
`desktop`. With M3's own 600 the class would disagree with the layout: from 600 to 767 M3 says
"medium, use a rail", while `m-layout` drops every side zone there, so a rail chosen by class
would vanish. An inexact name is the smaller harm. The aliases follow configured breakpoints.

### Recipe: navigation that follows the window

`m-layout` drops side zones on the mobile range by itself, but it never swaps one navigation
component for another — that is the app's choice. Branch on the window classes of `is` from
`useBreakpoint()`: they follow the layout's ranges, so exactly one branch is active and it never
asks for a zone the layout has dropped.

```vue
<template>
  <m-layout>
    <m-app-bar title="Mail" />

    <m-navigation-rail
      v-if="navigation !== 'bar'"
      v-model="section"
      :items="sections"
      :expanded="navigation === 'expanded-rail'"
    />

    <m-layout-main>
      <NuxtPage />
    </m-layout-main>

    <m-navigation-bar
      v-if="navigation === 'bar'"
      v-model="section"
      :items="sections"
    />
  </m-layout>
</template>

<script setup lang="ts">
const { is } = useBreakpoint()

const section = ref<string | null>('inbox')
const sections = [
  { id: 'inbox', icon: 'ic:outline-inbox', label: 'Inbox' },
  { id: 'starred', icon: 'ic:outline-star', label: 'Starred' },
  { id: 'settings', icon: 'ic:outline-settings', label: 'Settings' },
]

const navigation = computed(() => {
  if (is.value.compact) return 'bar'
  if (is.value.medium) return 'rail'
  return 'expanded-rail'
})
</script>
```

- Branching on the kit keys works too, but with the default thresholds `is.tabletXs` and
  `is.desktopXs` are one pixel wide (exactly 768 and 1200, because a band is
  `prev < width <= value`), so each branch has to name both keys of its range.
- On the server `is` comes from the request's device class, so SSR renders a plausible
  navigation and hydration matches it; the real width corrects it after hydration
  ([architecture.md](architecture.md#3-the-viewport-layer)).
- Both components register themselves, so a switch re-carves the grid and the
  `grid-template-*` transition animates it.
- The kit ships no navigation-suite component that picks the navigation for you; this recipe
  is the supported way.

---

## 6. Rules and anti-patterns

1. **Do not hand-build bars.** No custom `position: fixed/sticky` for headers or sidebars —
   zones do that, with correct per-item offsets.
2. A sticky top/bottom zone without a size does not work (see §2) — give it a `sizeToken`,
   or put a component with a height token inside it.
3. Only registering components may be direct children of `m-layout`.
4. Custom zone sizes come from tokens and expressions, never from measurement. A token for a
   pinned zone lives on `:root` (see §3).
5. `m-app-bar` goes into `m-layout` or `m-layout-header`, not into `m-layout-main` (§1).
6. Prefer `is` from `useBreakpoint()` over `more`/`less` when branching on device class —
   see [architecture.md](architecture.md#3-the-viewport-layer).
