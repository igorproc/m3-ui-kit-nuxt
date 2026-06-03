# Phase 1.3 — usePopover (2026-06-04)

Consolidates the floating-surface logic that menu, tooltip and dropdown each
hand-rolled, by generalising the existing `useMenu` FSM (not duplicating it).

## New

- **`app/composables/popover/usePopover.ts`**
  - **FSM** (moved out of `useMenu`): `model`-driven `status`
    (`closed`/`opening`/`open`/`closing`), `isOpen`, `open`/`close`/`toggle`,
    `onAfterEnter`/`onAfterLeave`.
  - **Positioning**: generalised `placement` (`top|bottom|left|right` +
    `-start|-center|-end`). Native **CSS anchor** path (`position-anchor` +
    `position-area`, optional `anchor-size` match-width, offset via margin) with a
    **JS fallback** (fixed coords from measured rects, viewport **flip** on the
    main axis + **clamp** to a margin — the behaviour tooltip needs).
  - **Opt-in DOM ownership**: pass `trigger`/`surface` refs → it measures via
    `getBoundingClientRect` and repositions on scroll/resize through
    `useGlobalListener` (only the JS path; CSS anchor self-pins). Omit them and it
    stays a pure FSM + style calculator driven by `setRect`.
  - Returns `anchorName`, `anchorStyle`, `popoverStyle`, `rect`, plus the FSM.

## Changed

- **`app/composables/menu/useMenu.ts`** — now a **thin wrapper** over `usePopover`.
  FSM/rect/anchor-detection are delegated; the menu-specific `menuStyle`
  (`originToArea`, `--ui-menu-origin`, `absolute` early-return, right-edge JS
  fallback, `z-index:999`) is preserved **byte-for-byte**. Public surface
  (`anchorName/status/isOpen/isAnchorSupported/menuStyle/open/close/toggle/
  onAfterEnter/onAfterLeave/setRect`) unchanged → `menu/index.vue` untouched.
  Only internal difference: anchor-name prefix `--menu-anchor-*` → `--popover-anchor-*`
  (self-consistent; both the `style.setProperty('anchor-name', …)` and
  `position-anchor` read the same value).

## Verification

- `npm run lint` — **0 errors** (`popover/usePopover.ts`, `menu/useMenu.ts`).
- No SCSS touched → `lint:style` N/A.
- menu behaviour preserved by construction (same FSM logic, identical `menuStyle`).
  A visual smoke-check of the menu component is advisable but requires running the
  dev server — per repo policy, request a screenshot in chat rather than auto-start.

## Scope notes (per user)

Only the composable + `useMenu` wrapper this item. tooltip (2.11) and dropdown
(2.4) migrate onto `usePopover` in Phase 2; hover open/close delays wait on
`useTimer` (1.6).
