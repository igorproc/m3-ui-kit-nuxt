# Auto-Layout Phase B — layoutContextZone — 2026-06-10

Plan: `.cursor/plans/auto-layout.md` (§2.5, Фаза B). Status: **code complete**.

## What changed

### `useLayout.ts` — public rich context (`m3:layout-zone`)
- New export `useLayoutZone(): LayoutZone | null` — available to **any** descendant of
  `<m-layout>`, `null` outside (no throw):
  ```ts
  interface LayoutZone {
    layoutId: string
    items: Readonly<LayoutItem[]>            // registry, DOM order
    insets: { top, right, bottom, left }     // CSS exprs → var(--m3-layout-inset-*, 0px)
    windowY: Readonly<Ref<number>>           // active-scroller scroll position
    scrollLock: (locked: boolean) => void    // ref-counted
    sticky: { top, bottom }                  // ready position:sticky offsets
  }
  ```
- **windowY is mode-agnostic**: listens to BOTH `window` scroll (one shared passive
  listener via `useGlobalListener`) and `m-layout-main`'s `scroll` (via `useEventListener`
  with a reactive el target). Only the actually-scrolling source fires events, so the
  engine never needs to know whether the layout is `full-height`.
- `mainEl` resolved from the registry (`registry.getEl(id)` — new method) on mount and
  on items change.
- ⚠ Naming shuffle: the internal size-contribution context was renamed
  `m3:layout-zone` → **`m3:layout-host`** (`LayoutHostProvide`), freeing "zone" for the
  public API the owner calls **layoutContextZone**.

### New: `app/composables/layout/scroll.ts`
- `createScrollLock(getTargets)` — ref-counted; restores original inline `overflow`;
  warns on unbalanced release (dev). Locks ALL potential scrollers (documentElement +
  mainEl) — freezing a non-scrolling element is visually a no-op, so no mode detection.

### `app-bar/index.vue` — auto-elevate
- `scrolled = props.isScrolled || (zone ? zone.windowY : ownWindowListener) > 0`.
- Inside a layout it consumes the shared `windowY` (covers both document scroll and
  full-height main scroll). Standalone (no layout) — falls back to its own
  `useGlobalListener('window', 'scroll')`.
- `isScrolled` prop → `@deprecated` force-override (kept, OR-semantics).
- Note: HEAD had NO auto-elevation at all (prop-only; the 2026-06-06 attempt was rolled
  back) — this is new behavior, matching AGENT_BRIEF's promise.

## Tests / gates
- `tests/layout-scroll.spec.ts` (4) — ref-count, restore, unbalanced, null targets.
- `tests/layout-zone.spec.ts` (2) — `mountSuspended` integration: zone provided through
  `m-layout → m-layout-main → probe`, insets/sticky exprs, `windowY=0`, layoutId; null
  outside layout.
- `npx vitest run` 35/35 ✅; `npm run lint` 0 errors ✅; app-bar stylelint — only the
  4 pre-existing `selector-class-pattern` errors from HEAD (untouched SCSS).

## Known notes
- `scrollLock` deliberately does NOT compensate scrollbar width (vue-final-modal locks
  its own modals itself); revisit if drawers in Phase C show layout jump.
- `sticky.top/bottom` are the GLOBAL edge sums; per-item offsets
  (`--m3-layout-<id>-top/-bottom-sticky`) land on zones in Phase C.

## Next
Phase C: multi-instance zones + `sticky` prop on per-item insets; self-registration of
app-bar/rail/bar/system-bar at first level; new `m-system-bar`, `m-spacer`.
Owner visual check: app-bar now elevates on scroll in `/demo/material` (new behavior).
