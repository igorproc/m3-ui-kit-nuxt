# Release Audit — DX / Engineering Maturity (PrimeTime UI Kit)

**Date:** 2026-06-25
**Scope:** `D:/dev/primetime/ui/kit` (read-only audit). Goal: what is missing before a release-quality M3 kit from a DX / architecture / a11y / SSR / typing / distribution standpoint.
**Method:** direct inspection + 5 parallel sub-audits (props API, SCSS tokens, a11y, SSR, upstream `0` patterns).

---

## TL;DR — Release blockers

1. **Zero component tests.** `tests/**` covers only layout/grid (7 files). No `.vue` component has a unit test. No prop-type tests, no a11y smoke tests.
2. **Distribution is half-wired.** `package.json` name is `"ui"` (no `version`, `exports`, `files`, `nuxt.config` export) but `docs/` already consumes it as `@primetime/ui-kit` (`file:../kit`) + imports internals via relative `../kit/shared/...`. Native `nuxt extends 'github:...'` cannot work yet.
3. **`variant`/`color` API is fragmented** across the button family and surface components — overloaded `variant`, two incompatible `color` enums, chip's non-standard `v-model:selected`. This is the public API; churning it post-release is a breaking change.
4. **Overlay & composite widgets are keyboard-inoperable / invisible to AT** — dropdown, menu, sortable table headers, date grids, interactive list-items, dialog semantics. A component library cannot ship "MD3-compliant" with these gaps.

SSR/hydration discipline is **clean** (no blockers there). SCSS token compliance is **high** (only 2 real violations).

---

## 1. Component API (props) consistency — fragmented public surface

Worst offenders (paths + lines):

- **P1 — `variant` overloaded with 4 unrelated value-sets.** Surface-style in button (`app/components/ui/button/index.vue:38` `'elevated'|'filled'|'outlined'|'text'|'tonal'`), card (`card/index.vue:48`, subset), text-field/dropdown (`'filled'|'outlined'`). But chip (`chip/index.vue:30` `'assist'|'filter'|'input'|'suggestion'`), divider (`divider/index.vue:12` `'full'|'inset'`), progress (`progress/index.vue:24` `'linear'|'circular'`) reuse the same prop name for entirely different taxonomies. No shared union type.
- **P2 — Button family inconsistent.** FAB (`button/fab/index.vue:18-22`) has **no `variant`** and a `color` enum `'primary'|'surface'|'secondary'|'tertiary'` that contradicts base button's `color: 'primary'|'accent'|'warn'` (`button/index.vue:39`). icon-button defaults `variant:'text'` vs button's `'filled'`.
- **P3 — `badge` consumes an undeclared prop.** `navigation-bar/index.vue:27` passes `variant="standard"` to `<m-badge>`, but `badge/index.vue:20-24` declares only `value`/`max`/`dot`. Silently dropped — latent bug.
- **P4 — chip breaks v-model convention.** `chip/index.vue:44` uses `defineModel<boolean>('selected')` (requires `v-model:selected`); every other boolean control uses plain `v-model` via `defineModel()`.
- **P5 — `disabled` modeled two ways.** text-field declares `disabled` as both a prop (`text-field/index.vue:78`) and a writable model (`:96`). Two sources of truth.
- **P7 — emit naming drift.** slider emits extra `'change'` alias (`slider/index.vue:114-116`); snackbar redundantly declares `update:modelValue` in `defineEmits` while also using `defineModel` (`snackbar/index.vue:46,51`); table uses array-wrapped emit payload typing `[rows: T[]]` (`table/index.vue:96`) inconsistent with positional payloads elsewhere (likely a typing bug).
- **P8 — `readonly` exists only on slider** (`slider/index.vue:92`). text-field/search/dropdown/checkbox lack it.
- **P9 — no `loading` prop anywhere** (notably button/fab/icon-button) — systematic gap for async actions.
- **P10 — start/end slot vocabulary split.** `prepend`/`append` (button, text-field) vs `icon`/`trailing` (chip — asymmetric within one component) vs `leading`/`trailing` (list/item). Pick one.
- **P11 — hardcoded content where slots expected.** `search/index.vue:9-13,27-35` hardcodes leading/clear icons (no slots), unlike text-field. Violates the project's "customizable content must expose `<slot/>`" rule. nav-bar/nav-rail/segmented are `items[]`-only with no per-item slot.
- **P6 — `defineProps` style.** Type-based everywhere (good), but `list/index.vue:21` and `navigation-bar/index.vue:55` skip `withDefaults` while sibling nav-rail uses it.

Bright spots: `defineModel()`, `disabled?: boolean` default false, type-based `defineProps` are otherwise uniform; dialog/sheet share a clean `clickToClose`/`escToClose` + `cancel`/`confirm` contract.

---

## 2. SCSS token-system (Zero-Runtime M3) — high compliance

Token maps live in `app/assets/stylesheet/components/<name>/_index.scss` (NOT co-located in component dirs — note for docs). Consumed via `g($t, …)`.

- **No runtime CSS custom properties for colors/states anywhere.** Every `--*` var found carries a *dimension* (heights/widths/grid spans) — acceptable. No `.vue` reads `var(--md-sys-color-*)` at runtime → build-time model intact.
- **Only 2 real hardcoded-color violations:**
  - `card/index.vue:82` — `box-shadow: 0 1rem 3rem rgb(0 0 0 / 8%)` (variant shadows below it correctly use `g($t,'elevated-shadow')`).
  - `button/split/index.vue:135` — inline `color-mix(... map.get($theme-color-link,'surface') 30% ...)` + `!important`; split-button has no `_index.scss` token map.
- **Components missing a token map** (mostly OK — structural/layout-only): spacer, shape, responsive, main, layout/*, form-renderer, button/icon, button/split (the split is the one that should get one). `dropdown/{option,panel,trigger,selected-chips}` import the parent dropdown index rather than owning maps — document or split.
- **Named-but-nonexistent components:** avatar, slide-group, list-subheader have empty dirs (no `.vue`, no scss) despite being referenced in roadmap/dir listings.
- Minor canonical nit: some compliant `.vue` (e.g. `card/index.vue:80-81`) read `map.get($theme-color-link, …)` inline rather than through `g($t)` — build-safe but bypasses the token indirection.

---

## 3. Accessibility — the second release blocker

Two tiers. Form primitives & tabs/slider are **excellent**; overlay/composite widgets are **broken**.

**Tier 1 — keyboard-inoperable / invisible to AT (must fix):**
- **Dropdown** — fully broken. Trigger is a `<div @click>` (`dropdown/trigger/index.vue:2-5`): not focusable, no `role="combobox"`, no `aria-expanded/haspopup/controls`, zero keydown. Panel has no `role="listbox"`; options are `<div>` with no `role="option"`/`aria-selected`; chip-remove (`dropdown/selected-chips/index.vue:26-32`) is a bare non-focusable icon.
- **Menu** (`menu/index.vue`) — `role="menu"` exists but children have no `role="menuitem"`, **no `@keydown` at all** (no arrows/Enter/Esc/Home/End), no focus-in on open / return on close. Backdrop is a focusable hidden `<button aria-hidden>` (line 29-35) — in tab order.
- **Table sort** (`table/header/index.vue:19`) — `@click` on `<th>` with no inner `<button>` → not keyboard-operable; no `aria-sort`; missing `scope="col"`.
- **Time dial** (`time-picker/dial/index.vue:32-57`) — `<div>` mouse/touch only, no role/keyboard (mitigated by a good keyboard-entry sibling).
- **Interactive list-item** (`list/item/index.vue`) — when `interactive` + default `tag:'div'`, gets ripple/cursor but no role/tabindex/keydown; its `:focus-visible` CSS is dead code on a non-focusable div.

**Tier 2 — high:**
- **Dialog/drawer** pass no `role="dialog"`/`aria-modal`/`aria-labelledby` to vue-final-modal (`dialog/index.vue`, `dialog/date/index.vue`, `navigation-drawer/index.vue`); headline not wired as accessible name.
- **Date grids** (`date-picker/day-grid`, `year-grid`, `dialog/date`) — real buttons w/ aria-labels (good) but no `role=grid/row/gridcell`, no `aria-selected`, no arrow-key roving (42 buttons in plain tab order).
- **segmented/split/fab-menu** — no `role=group/radiogroup`, no `aria-pressed`/`aria-checked`, icon-only triggers without `aria-label`, no `aria-haspopup/expanded`, no Esc/arrow/focus mgmt.
- **tooltip** — has `role="tooltip"` but no `aria-describedby` link and no Esc.
- **expansion-panel** — good `aria-expanded`/`disabled` but no `aria-controls` linkage / `role="region"` (`useId()` already imported).

**Tier 3 — medium (global):**
- **No `:focus-visible` ring** across the entire button family (each sets `outline:none`, restores nothing) — WCAG 2.4.7.
- **Icon-only buttons lack accessible names** (`button/icon`, `button/fab`, `table/pagination` prev/next).
- **Nav active state not announced** — `aria-current="page"` missing on nav-bar / nav-rail items; no roving arrow nav; `<nav>` lacks `aria-label`.
- list container not `role="list"`; chip filter has no `aria-pressed`.

**Baseline done well (reference for fixes):** text-field (native input + `for`/`useId` + `aria-invalid`/`aria-describedby`), search, checkbox/radio/switch (native inputs), **tabs** (real `role=tab`, roving tabindex, full arrow/Home/End), **slider** (full `role=slider` + value attrs + keyboard model), base button (dynamic button/a with aria-disabled substitution).

---

## 4. SSR / Hydration / SEO — clean, no blockers

- **No violations.** `onMounted` is only used for browser-API / post-hydration work (DOM measurement in menu/layout/app-bar), never data fetching.
- All listeners/timers routed through purpose-built auto-cleaning primitives (`useEventListener`, `useGlobalListener`, `useTimer` — all `onScopeDispose`) or directive `unmounted` hooks (`v-ripple.ts`, `v-click-outside.ts`). No leaks.
- `window`/`document` access consistently guarded by `IN_BROWSER` / `import.meta.client` or confined to handlers. No `localStorage` (uses Nuxt cookies — correct).
- `useHead` used correctly for SSR-first theme attributes (`store/theme.ts:73`) and layout grid CSS — prevents theme flash / CLS.
- Borderline (optional): `composables/modal/useModal.ts:54` uses `Math.random()` for a modal id — switch to `useId()` if a modal can be server-rendered open. `showcase.vue:86` `new Date()` is demo-only.

---

## 5. Typing & Tests — the first release blocker

- **No component tests.** `tests/` = `grid`, `initial`, `layout-anchors`, `layout-carve`, `layout-registry`, `layout-scroll`, `layout-zone` only. Zero `.vue` component coverage, zero a11y assertions, zero prop-contract tests. Playwright configured (`test:e2e`) but no component e2e specs.
- **No exported public types.** Prop/emit types are inline per-component; nothing re-exported for consumers (`shared/types/kit.ts` covers the kit module config, not component props). Consumers can't import `MButtonProps` etc.
- **Type inconsistencies** (see §1): `variant: union` truncated differently per component with no shared type; table emit payload typing looks wrong (`[rows: T[]]`).
- Typing baseline is otherwise solid: strict type-based `defineProps`, `defineModel`, typed registry utilities (`shared/utils/createContext.ts`, `createTrinity.ts`).

---

## 6. Distribution as a Nuxt layer — half-wired, blocks "npm i" + "github extends"

Current state of `kit/package.json`:
- `name: "ui"`, `type: "module"`, **no `version`, no `exports`, no `files`, no `main`/`module`/`types`, no `repository`.**
- git remote exists: `https://github.com/igorproc/m3-ui-kit-nuxt.git`.

What consumers expect (from `docs/`):
- `docs/package.json:15` → `"@primetime/ui-kit": "file:../kit"` — **name mismatch**: the kit calls itself `"ui"`, not `@primetime/ui-kit`. `file:` install resolves the dir but the package name is wrong.
- `docs/nuxt.config.ts:9` → `extends: [['@primetime/ui-kit', { install: true }]]` — relies on a published/installable name + the layer exposing its `nuxt.config`. Commented-out alternatives show the intended end states: `'github:igorproc/m3-ui-kit-nuxt#main'` and relative `'../kit'`.
- `docs/nuxt.config.ts:1` still imports `defineMaterialKit` from relative `../kit/shared/utils/defineKit` — **bypasses the package boundary**; a real npm consumer couldn't do this without a subpath export.

Readiness per consumption mode:
- **(a) copy files as a layer** — works today (relative `../kit` is proven).
- **(b) `npm i` (git/file)** — **blocked**: wrong package name, no `version`, no `exports` mapping `nuxt.config` / `defineKit` subpath, no `files` allowlist (would ship `node_modules`/tests). The MEMORY note "v1.0 layer-only, package.json recipe (exports→nuxt.config)" is the intended fix and is **not yet applied**.
- **(c) native `nuxt extends 'github:...'`** — **blocked**: needs the package to expose `nuxt.config` as the layer entry via `exports`/`main`, plus committed generated SCSS or a prepare step. Polling `vite.server.watch.usePolling:true` is dev-only noise but harmless.

---

## 7. Ideas worth adopting from `D:/dev/primetime/ui/0` (upstream `@vuetify/v0` + `paper`)

Port the **engineering shape**, NOT the runtime-CSS-var emission (paper emits `--v0-*` runtime vars — opposite of kit's build-time Sass rule).

- **`makeX` style-prop factories** (`packages/paper/src/composables/{useColor,useRounded,useElevation,useDimensions,useBorder}/index.ts`) — exported `*Props` interfaces `extends`-mixed into each component, standardizing color/variant/size/rounded/elevation props once. **Directly fixes §1 fragmentation.** (Keep kit's `g()` for the color layer; adopt the prop-interface unification.)
- **`useProxyModel`** (`packages/0/src/composables/useProxyModel`) — robust internal-selection ↔ `v-model` bridge with `multiple`/transform/late-registration; canonical for dropdown/tabs/segmented.
- **`createContext` / `createTrinity`** (`packages/0/src/composables/`) — typed provide/inject that throws on miss; kit already has lookalikes in `shared/utils/createContext.ts`/`createTrinity.ts` — compare and align.
- **a11y composables — `useRovingFocus` + `createFocusTraversal`** (`packages/0/src/composables/useRovingFocus`) — drop-in arrow/Home/End/grid keyboard semantics. **Directly fixes the §3 menu/dropdown/segmented/date-grid keyboard gaps.**
- **SSR-safe `useId()`** (`packages/0/src/utilities/helpers.ts:399`) and **`useToggleScope`** (conditional effect lifecycle for overlay listeners).
- **DOM wrappers** (`useResizeObserver`/`useIntersectionObserver`/`useClickOutside`/`useBreakpoints`) — match kit's cleanup discipline; `useBreakpoints` pairs with `$material-kit-breakpoints`.
- **Naming taxonomy** `create*`/`use*`/`to*` and **colocated `*.test.ts` Vitest+happy-dom** convention with a `mountComponent(options)` render helper + sibling `*.ssr.test.ts` — a ready template for the missing component tests (§5).

---

## Prioritized backlog

### P0 — Release blockers
- **P0-1 Component test suite.** Add Vitest unit + a11y smoke tests for every public `<M*>` component (start: button, text-field, checkbox, dropdown, dialog, slider). Adopt `0`'s colocated test + render-helper convention.
- **P0-2 a11y Tier 1.** Make dropdown a real combobox/listbox (focusable trigger + roles + keyboard); add menu keyboard model + focus mgmt; table sort → inner `<button>` + `aria-sort` + `scope`; interactive list-item role/tabindex/keydown; date grids → grid roles + roving. Reuse `0`'s `useRovingFocus`.
- **P0-3 Packaging.** Rename package to `@primetime/ui-kit`, add `version`, `exports` (map `.` → `nuxt.config`, subpath for `defineKit`), `files`, `repository`. Verify `npm i file:` and `github:` both resolve from a clean consumer. Remove docs' relative `../kit/shared/...` import.
- **P0-4 Public API freeze.** Resolve §1 P1–P5 (overloaded `variant`, button-family `color`/FAB, chip `v-model`, text-field two-way `disabled`, badge undeclared prop) BEFORE release — these are breaking if changed later. Export component prop/emit types.

### P1 — Strongly recommended before GA
- a11y Tier 2: dialog/drawer `role/aria-modal/labelledby`; global `:focus-visible` ring on button family; `aria-label` on icon-only buttons; `aria-current` on nav items; tooltip `aria-describedby`+Esc; expansion-panel `aria-controls`.
- Adopt `makeX` prop-interface factories from `0` to enforce cross-component prop consistency (size/variant/color/density) once.
- Standardize slot vocabulary (`leading`/`trailing`) and add slots to `search`; add per-item slots to nav-bar/nav-rail/segmented.
- Add `loading` + `readonly` as cross-cutting props where applicable.
- Fix table emit payload typing; remove snackbar redundant emit; normalize slider `change` alias.

### P2 — Polish / post-GA
- Tokenize `card/index.vue:82` shadow and give `button/split` an `_index.scss` token map.
- Create/remove the empty avatar / slide-group / list-subheader dirs.
- `useModal` id → `useId()`; route inline `map.get($theme-color-link)` reads through `g($t)`.
- Adopt `0`'s `create*/use*/to*` naming taxonomy and `useToggleScope`/DOM-wrapper composables.
- Replace dev-only `vite.server.watch.usePolling:true` with an env-gated setting.
