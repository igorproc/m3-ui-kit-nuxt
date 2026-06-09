# Auto-Layout Phase D — m-container / m-row / m-col / m-responsive — 2026-06-10

Plan: `.cursor/plans/auto-layout.md` (§3, Фаза D). Status: **code complete**,
sandbox `/demo/grid` for owner visual check.

## Architecture (SCSS-first, zero-runtime, zero-CLS)

All responsiveness is STATIC generated CSS; the components only normalize props into
class names. Nothing measures, nothing runs on resize, classes apply before first paint.

### Core: `app/assets/stylesheet/components/grid/_index.scss`
- `$grid-breakpoints: map.merge($breakpoints, cfg.$material-kit-breakpoints)` — config
  overrides defaults; values normalized to px (`bp-min()`; unitless config numbers × 1px).
  **Px thresholds only** (rem in @media resolves against initial 16px, not the fluid root).
- `$bp-order: mobile-xs, mobile, tablet-xs, tablet, desktop-xs, desktop` — emission order.
  **Mobile-first cascade trick**: every breakpoint class has equal specificity; later
  source order wins inside its media range, so `cols` < `tablet-xs` < … override upward.
  Each key activates at `min-width: <its constant>` (consistent with the kit's existing
  `bp-tablet`/`bp-desktop` mixins semantics).
- `$tokens`: M3 defaults — columns 4 (mobile-xs) / 8 (tablet-xs) / 12 (desktop-xs);
  gutter & margin 16rem → 24rem at tablet-xs; container max-width 1200rem/1600rem.

### m-container (`ui/container/index.vue`)
- `display: grid; grid-template-columns: repeat(var(--m-container-cols), minmax(0,1fr))`;
  gap/padding from `--m-container-gutter/-margin`; `margin-inline: auto` + stepped
  max-width (`fluid` prop → `max-width: none`).
- Props `cols` / `cols-<bp>` → classes `m-container--[<bp>-]cols-N` (N: 1..12), emitted
  AFTER the defaults so they win the cascade.

### m-col (`ui/col/index.vue`)
- Span: `grid-column-end: span min(var(--m-col-span, var(--m-container-cols)),
  var(--m-container-cols))` — span is RELATIVE to the active column count and clamped
  (no implicit tracks). Default (no props) = full row.
- Offset: `grid-column-start: calc(var(--m-col-offset) + 1)`. No offset → the var is
  undefined → calc is invalid-at-computed-value-time → property falls back to `auto`.
  `offset-0` resets via `--m-col-offset: initial` (guaranteed-invalid var → auto).
  ⚠ Deliberate LONGHANDS (stylelint-disabled): in the `grid-column` shorthand one invalid
  var would kill the span clamp together with the start.
- Props: `cols` (base) + `mobile|tablet-xs|tablet|desktop-xs|desktop` + `offset` /
  `offset-<bp>` → classes `m-col--[<bp>-]span-N` / `m-col--[<bp>-]offset-N`.

### m-row (`ui/row/index.vue`) — optional
- `display: grid; grid-column: 1/-1; grid-template-columns: subgrid` — forces a new row,
  inherits the container's column lines (and gaps, per subgrid spec). Props: `align`
  (align-items), `no-gutters` (gap: 0 inside the row).

### m-responsive (`ui/responsive/index.vue`)
- Native `aspect-ratio` wrapper (`aspect-ratio` prop), `position: relative; overflow:
  hidden` — fill content with `position: absolute; inset: 0`.

### Removed
- Empty placeholder dir `app/components/ui/grid/` (SCSS lives in
  `stylesheet/components/grid/`, components in `ui/container|row|col`).

## Sandbox
`app/pages/demo/grid.vue` (default layout): relative spans on 4/8/12, three-column wf
pattern, offsets + `offset-desktop-xs="0"` reset, subgrid row + align + no-gutters,
custom `:cols="2"/:cols-desktop-xs="6"`, m-responsive 16/9.

## Tests / gates
- `tests/grid.spec.ts` (7): props→classes mapping for container/col/row, responsive
  inline ratio, composition tree. mountSuspended also compiles the SCSS (build check).
- Suite 48/48 ✅; `npm run lint` 0 errors ✅; stylelint — grid files clean ✅.

## Known notes / risks
- `span min(var, var)` (integer calc in grid-column) — fine in evergreen browsers;
  verify visually on targets. Fallback would be JS clamp — not needed so far.
- `subgrid` — baseline since 2023 (FF/Chrome/Safari); m-row is optional sugar, plain
  m-col-in-container works everywhere.
- Breakpoint key semantics: `tablet` activates at 1199px (the kit's constant), i.e.
  non-xs keys are the "upper" bounds promoted to mins — consistent with existing
  `bp-tablet` mixin, but worth documenting in docs/ (Phase F).

## Next
Phase E: все 8 wireframes по AGENT_BRIEF (`app/pages/demo/wf/`), обновить бриф
(маппинг v-container/v-row/v-col → m-*, m-system-bar, m-spacer, m-responsive; убрать
костыль «два бара в один header»).
