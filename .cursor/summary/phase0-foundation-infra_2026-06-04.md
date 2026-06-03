# Phase 0 — Foundation infrastructure (2026-06-04)

Implements `plan.md` Phase 0: the shared headless primitives that later phases
build on. No SCSS / component-rendering changes — pure logic layer.

## New files

- **`shared/utils/guards.ts`** — minimal runtime type guards ported from v0
  (`isString`, `isSymbol`, `isObject`, `isUndefined`, plus `isNull`,
  `isNullOrUndefined`, `isFunction`, `isElement` needed by `useClickOutside`).
- **`shared/utils/toArray.ts`** — `toArray` + `MaybeArray<T>` helper.
- **`shared/constants/globals.ts`** — `IN_BROWSER` (`import.meta.client`) for
  SSR-safe DOM access.
- **`shared/utils/createContext.ts`** (0.1) — typed `provide`/`inject` wrapper,
  throw-on-missing, static + dynamic key modes. Dev warns on un-namespaced keys.
  **Never for theme** (guardrail).
- **`app/composables/useEventListener.ts`** (0.2) — reactive-target listener with
  `onScopeDispose` cleanup; `useWindowEventListener` / `useDocumentEventListener`
  SSR-safe wrappers.
- **`app/composables/useStack.ts`** (0.3) — overlay z-index registry as a module
  singleton. Self-contained (did **not** drag in v0's
  `createSelection`/`createTrinity`/`createPlugin`); `register`→`select`/
  `unselect`/`dismiss`, computed `zIndex`/`globalTop`, `top`/`scrimZIndex`/
  `isBlocking`. Auto-unregisters on scope dispose.
- **`app/composables/useGlobalListener.ts`** (0.4) — delegated global subscription
  registry; one real DOM listener per `target+event+options` fanned out to many
  consumers. The "event-subscription store" with no new Pinia store. Master
  listener is managed directly (it outlives any single component scope); per-
  consumer cleanup is automatic.
- **`app/composables/useClickOutside.ts`** (0.5) — ported from v0; two-phase
  pointer detection, `bounds` mode, touch threshold, ignore list, pause/resume/
  stop. SSR no-op.
- **`.cursor/rules/headless_architecture.md`** (0.6) — thin-view contract, the
  `createContext` rules (incl. the theme guardrail), the listener-primitive
  table, and a per-refactor checklist.

## Refactors

- **`app/composables/modal/useModal.ts`** (0.7) — dropped `M3_MODAL_KEY` Symbol;
  now `createContext<M3ModalContext | null>('m3:modal', null)` (nullable default so
  a root modal injects `null` instead of throwing). Public API unchanged.
- **`app/composables/useLayout.ts`** (0.8) — dropped the two `Symbol.for` keys;
  now `m3:layout` + `m3:layout-area` contexts with `null` defaults. `createLayout`
  / `provideLayoutArea` / `useLayoutItem` signatures unchanged, so the 8 call
  sites (app-bar, layout/*, nav-bar, nav-rail, youtube layout) need no edits.

## Verification

- `npm run lint` — **0 errors** across all Phase 0 files (only pre-existing jsdoc
  `@param` warnings remain in `useModal`). Pre-existing errors in unrelated
  components (dialog/date `isNaN`, slider unified-signatures, text-field dupe-keys)
  are untouched Phase 2 work.
- No SCSS touched → `lint:style` N/A this batch.

## Next

Phase 1 — shared headless primitives (`useSelection`, `useGroup`, `usePopover`,
`useDrag`, `useField`, `useRaf`/`useTimer`, `useFormBuilder` cleanup, config-driven
forms). **Per protocol: confirm porting depth in chat before each Phase 1 item.**
