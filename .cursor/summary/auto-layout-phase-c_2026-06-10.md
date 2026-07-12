# Auto-Layout Phase C — Zones, sticky anchors, self-registration — 2026-06-10

Plan: `.cursor/plans/auto-layout.md` (Фаза C). Status: **code complete**, owner visual check pending.

## ⚠ Design correction discovered during implementation

`position: sticky` **cannot pin top/bottom zones** in document-scroll mode: a grid item's
containing block is its grid area, and a header row is exactly the header's height — there
is no room to slide. (Side columns DO work: the column stretches to content height, so the
v1 rail pattern was fine.) The v1 "sticky header" was silently a no-op.

**Resolution (Vuetify-style):** sticky top/bottom zones use `position: fixed` while their
grid row still reserves the space via the size var → zero CLS, pure CSS. This required
relaxing `.m-layout` containment: `contain: layout style` → `contain: style` (layout
containment turns fixed descendants into absolute-like ones).

Consequences:
- Sticky top/bottom zones REQUIRE a size (token or child contribution) — a sizeless one
  cannot reserve its row and degrades to in-flow with a dev-warning.
- Logical props used throughout: `inset-block-start/end` + `inset-inline-start/end`
  (RTL-ready; also dodges a happy-dom validation quirk that drops `top: var(…)`).
- Limitation (documented): fixed coords assume the layout starts at the viewport top
  (standard app-shell); a nested `full-height` layout inside a scrolled page would misplace
  pinned bars.

## Sticky styles emitted by `useLayoutItem` (inline, from per-item insets)

- `top`/`bottom` + sticky + sized: `position: fixed; inset-block-start|end:
  var(--m3-layout-<id>-top|-bottom-sticky); inset-inline-start/end: var(--m3-layout-<id>-start/-end)`.
  Horizontal insets matter when a side column is carved before the bar.
- `start`/`end` + sticky: `position: sticky; align-self: start; inset-block-start:
  var(<id>-top); height: calc(100dvh − <id>-top − <id>-bottom-sticky)` (height, not
  max-height — the rail/sidebar must fill its visual column; non-sticky bottoms excluded).
- carve() now also emits per-item `start`/`end` insets (`CarveInsets` has 4 edges).

## Zones (all multi-instance via auto-id, DOM order; `order` prop and
`provideLayoutArea` calls removed)

- `m-layout-header` — `sticky` (default **true**, now actually pins), `sizeToken`.
- `m-layout-aside` — `position: left|right|start|end` (logical preferred), `sticky`
  (default false → stretches with content), `sizeToken`; sticky adds `overflow-y: auto`.
- `m-layout-footer` — `sticky` (default false), `sizeToken`.
- `m-layout-main` — bare `kind: 'main'`.
- `m-layout-item` — `id?` (auto), `kind`, deprecated `area`, `sizeToken`, `sticky`,
  **`force`** (escape hatch: registers past the parent check, e.g. inside Transition).

## Self-sufficient components (first level of m-layout — no zone wrappers needed)

- `m-app-bar` → `kind: 'top'`, `sticky` prop (default true), `--anchored` class (z-index)
  when registered. Nested in a header → contributes height (unchanged).
- `m-navigation-rail` → `kind: 'start'`, sticky. Nested-case CSS improved:
  `top: var(--m3-layout-inset-top)` + height calc (was `top: 0; height: 100dvh` ignoring
  headers).
- `m-navigation-bar` → `kind: 'bottom'`, sticky, NEW height token
  `--ui-navigation-bar-height: 80rem` (M3 spec) emitted at `:root`, component gets
  explicit `height` — required so the sticky bottom row can reserve space.
- **NEW `m-system-bar`** (m3-like thin status bar): 24rem height token, surface-container-
  highest, label-small; `kind: 'top'`, sticky. Stacks with app-bar: two zones OR both
  inside one header (contributions sum via calc).
- **NEW `m-spacer`**: `flex: 1 0 0` push-apart utility.

## Demo update

`app/layouts/default.vue`: rail and nav-bar are now DIRECT children of `m-layout`
(showcase of self-registration); aside/footer wrappers removed. Mobile nav-bar is now
actually pinned to the bottom (was below the fold on long content).

## Tests / gates

- carve: +start/end insets case (23 unit tests total in file).
- NEW `tests/layout-anchors.spec.ts` (5, mountSuspended): two-header stack (fixed + offset
  var), app-bar self-registration vs in-header contribution (asserted via
  `useLayoutZone().items`), sticky vs plain aside inline styles, sizeless degradation.
- Test-env notes: `useHead` does not reach document.head under mountSuspended (CSS
  asserted at the carve unit level instead); happy-dom drops `top:`/`height:` values with
  `var()`/`calc()` (logical inset props pass).
- `npx vitest run` **41/41** ✅; `npm run lint` 0 errors ✅; stylelint — my files clean,
  repo errors are the pre-existing ones (app-bar ×4, youtube ×2, list/item ×1).

## Visual check needed (owner; dev server not run by agent)

1. `/demo/material` — header pins on scroll (NEW — v1 scrolled away), elevates; desktop
   rail pinned below header; mobile bottom bar always visible (NEW).
2. `/demo/steam`, `/demo/youtube`, `/demo/primetime` — no regressions (zones still
   wrapper-based there).
3. docs sidebar — unchanged (explicit id/area path).

## Next

Phase D: m-container / m-row / m-col (SCSS-first grid, `@media` from
`$material-kit-breakpoints`, 4/8/12 defaults, span clamp, offsets via grid-column-start,
subgrid m-row) + `m-responsive`.
