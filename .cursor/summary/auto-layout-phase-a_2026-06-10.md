# Auto-Layout Phase A — Engine v2 (carving) — 2026-06-10

Plan: `.cursor/plans/auto-layout.md` (§2, Фаза A). Status: **code complete**, visual check by owner pending.

## What changed

### New: `app/composables/layout/carve.ts` (pure, no Vue)
- `carve(items)` — DOM-order carving: each band cuts a strip off the remaining
  rectangle (Vuetify corner semantics). Returns `grid-template-areas/columns/rows`,
  per-item insets (`top` / `bottomSticky` — sums of sized bands carved before the item)
  and edge totals.
- **Grid area names = item ids** (`layout-header`, `navigation-rail`…), not fixed
  `header/left/right` — multi-instance zones fall out naturally.
- `filterByRange` — device visibility heuristic preserved from v1 (mobile: no sides,
  tablet: no `end`).
- `buildLayoutCss(layoutId, sizeDecls, ranges)` — assembles the `useHead` payload:
  base block (item `--m3-layout-<id>-size` vars + mobile grid) + two `@media` blocks.
- `cssSum`, `sanitizeAreaName` (CSS custom-ident safe), `sizeVar`, `KIND_BY_AREA`.

### New: `app/composables/layout/registry.ts`
- Ordered reactive registry; `register/unregister/reorder/markHydrated`.
- ⚠ **Reactivity trap fixed during review**: `register` is called from each item's
  `watchEffect`; reading the reactive array there (`findIndex`) made every effect track
  the whole array → mutual splice ping-pong → infinite loop. All internal reads go
  through `toRaw`; identical snapshots short-circuit (no array touch). Covered by a
  dedicated regression test.
- `reorder(id)`: no-op until hydration (setup order = DOM order); after — repositions
  late-mounted (`v-if`) items via `compareDocumentPosition`.

### Rewritten: `app/composables/useLayout.ts`
- `createLayout(layoutId)` → `{ css, items }`; provides `m3:layout` ctx `{ uid, register,
  unregister, reorder, items }`. Breakpoint ranges now come from
  `runtimeConfig.public.materialKit.breakpoints` (tablet = `tablet-xs`…`desktop-xs`−1,
  desktop = `desktop-xs`+); the 768/1199/1200 hardcode is gone.
- `useLayoutItem(options)` decision tree:
  1. no `m3:layout` ctx → no-op;
  2. **first level** (`options.force` or `instance.parent.uid === ctx.uid`) → register,
     provide `m3:layout-zone` ctx, `gridArea: <id>` style;
  3. nested + zone ctx → **contribute** `sizeToken` to the host zone (replaces v1's
     area-dedup hack: zone w/o explicit token sums children contributions via `calc`).
- Options: `kind` (`top/bottom/start/end/main`) is canonical; `area` is a deprecated
  alias (`header→top`…); `order` deprecated no-op (DOM order rules); `sticky` accepted
  and threaded to carve (consumed in Phase C); `force` bypasses the parent check.
- `sizeToken` accepts var names (`--x` → `var(--x)`) **and raw expressions** (`360rem`,
  docs' DocsSidebar) — v1 produced invalid `var(360rem)` for the latter.
- `provideLayoutArea` → deprecated no-op (zone ctx replaced it); remove calls in Phase C.

### Slimmed: `app/components/ui/layout/index.vue`
- Just `createLayout(layoutId)` + `useHead` + dev-only top-level check (warns on
  first-level elements without inline `grid-area` → "wrap in m-layout-main/m-layout-item").

### New: `shared/utils/resolveBreakpoints.ts`
- Defaults + runtime-config merge (int px). `useBreakpoint` still has its own copy —
  consolidate in Phase F.

## Not touched (back-compat verified)
- Zone components (`layout/header|aside|main|footer|item.vue`), `app-bar`,
  `navigation-rail/bar` — work through the `area`/deprecated shims; reworked in Phase C.
- docs' `DocsSidebar` (direct child, raw `sizeToken`, `order: 0`) — compatible; its
  `provide(Symbol.for('ui:layout'), null)` hack is dead code (stale key), remove later.

## Tests / gates
- `tests/layout-carve.spec.ts` (22) — table-driven: steam order, corner flip, 3-column,
  insets accumulation, sticky-bottom nuance, range filter, css assembly.
- `tests/layout-registry.spec.ts` (6) — ping-pong regression, in-place replace, reorder.
- `npx vitest run` 29/29 ✅; `npm run lint` 0 errors ✅; `npm run lint:style` — only
  pre-existing errors (youtube.vue, app-bar, list/item), my files clean ✅.

## Known warts (deliberate, for later phases)
- Hidden-range zones (aside on mobile) keep `grid-area: <id>` pointing at an area absent
  from the template → implicit track. **Same behavior as v1** (no regression); fix
  properly in Phase C (range visibility on zones).
- `app/layouts/youtube.vue:114,126` — top-level `useLayoutItem` calls were dead code in
  v1 (no ancestor layout) and remain no-ops; clean up in Phase F.
- Public var names changed: `--m3-layout-<area>-height|width` → `--m3-layout-<id>-size`
  (+ new `--m3-layout-inset-*`, per-item `-top`/`-bottom-sticky`). No external consumers
  existed (grepped kit+docs).

## Next
Visual check by owner (no dev server from agent): `/demo/material`, `/demo/steam`,
`/demo/youtube`, `/demo/primetime`, docs sidebar. Then Phase B (layoutContextZone).
