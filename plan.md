# PrimeTime UI Kit — Refactor Plan

> **Goal.** Split every UI component into **headless logic** (composables, in the spirit of `@vuetify/v0` in `../0/packages/0/src/composables`) and **thin view** (only attaches event listeners, juggles styling variants, passes `props`/`emit`). Migrate every component still on **deprecated plain `$variable` SCSS** to the **Zero-Runtime M3 `$tokens` map + `g()`** system (reference: `app/assets/stylesheet/components/button/_index.scss`). Replace ad-hoc `provide`/`inject` and global DOM listeners with ported v0 primitives.

## Working protocol (per the user)

- **Before starting each next item:** mark the previous item `[x]` in this file and post a short progress ping in chat. **No git commits** — the user commits manually.
- **Come back for answers** before any *new shared-primitive* implementation (Phase 1 items) or any design ambiguity — confirm the porting depth/approach in chat first.
- Every batch must end with `npm run lint` and `npm run lint:style` at **0 errors** (and `npm run test` where relevant).
- Architecture decisions already made: port v0 `createContext` into `shared/utils`; port v0 `useEventListener` + `useStack` (no new Pinia store); refactor existing raw `provide/inject` (`useModal`, `useLayout`) onto `createContext`.

## Conventions reference

- **SCSS migrated pattern** (target): co-located `_index.scss` with a nested `$tokens` map → in `.vue`: `$t: material-map(t.$tokens, $prefix)` then `g($t, 'path-to-token')`. No hardcoded colors, no local `$color` vars, no runtime `--custom-properties` for component colors. Handle all 5 MD3 states via `color-mix`.
- **Headless pattern** (target): logic factory prefixed `create*`/`use*`, no DOM event binding inside the factory (only the ported `useEventListener`/`useStack`/`useClickOutside` wrappers touch DOM); view component stays thin.
- **Context pattern**: `createContext('m3:<name>')` → `[useX, provideX]`, throw-on-missing. Use for parent↔children coordination instead of prop drilling.
- **Atomic-design decomposition** (target for complex/fat components): a thin `index.vue` orchestrator + small single-responsibility sub-components in their own folders, paired with a headless composable. **Reference: `app/components/ui/slider/`** (`index.vue` + `root/`, `track/`, `range/`, `thumb/`, `hidden-input/`) backed by `app/composables/slider/createSlider.ts`. Monolithic fat components get split this way.

### ⚠ Guardrails

- **Theme stays a single global.** Do **NOT** introduce `provideTheme`/`useTheme` or any per-tree theme context — there is exactly one theme for the whole project (the existing Pinia `app/store/theme.ts`). Per-subtree theme provision would create chaos. `createContext` is for component-local coordination (tabs, radio-group, accordion, etc.), never for theme.

## Current state (audit)

- **SCSS — already migrated (12):** app-bar, badge, button, checkbox, date-picker, dropdown, list, radio, slider, text-field, time-picker, toolbar.
- **SCSS — legacy, needs migration (21):** card, chip, dialog, divider, expansion-panel, extended-fab-menu, fab-menu, icon, loading, menu, navigation-bar, navigation-drawer, navigation-rail, progress, search, sheet, snackbar, switch, table, tabs, tooltip.
- **SCSS — N/A (3):** layout, main, shape.

Legend — effort: **S** small · **M** medium · **L** large.

---

## Phase 0 — Foundation infrastructure

- [x] **0.1** Port v0 `createContext` → `shared/utils/createContext.ts` (static + dynamic key, namespaced, throw-on-missing). Port the minimal type guards it needs (`isString`, `isSymbol`, `isObject`, `isUndefined`) into `shared/utils/`. **Scope: component-local coordination only — never theme** (see Guardrails). **(M)**
- [x] **0.2** Port v0 `useEventListener` → `app/composables/useEventListener.ts` (reactive targets, multi-event, `onScopeDispose` auto-cleanup, SSR-safe via `IN_BROWSER`). **(M)**
- [x] **0.3** Port v0 `useStack` → `app/composables/useStack.ts` (overlay z-index registry; `register`/`select`/`unselect`, `globalTop`). For menu/dialog/tooltip/snackbar/sheet. **(M)**
- [x] **0.4** Build `app/composables/useGlobalListener.ts` — a delegated global `window`/`document` subscription registry (module singleton on top of `useEventListener`) giving auto subscribe/unsubscribe per consumer. This is the "event-subscription store" requirement, without a new Pinia store. **(M)**
- [x] **0.5** Port v0 `useClickOutside` → `app/composables/useClickOutside.ts` (replaces the ad-hoc `v-click-outside` directive + manual `onClickOutside`). **(S)**
- [x] **0.6** Write the migration recipe + headless-split convention doc → `.cursor/rules/` (SCSS map recipe from `button`, the thin-view contract, the context/global-listener rules). **(S)**
- [x] **0.7** Refactor existing `app/composables/modal/useModal.ts` onto `createContext` (drop the raw `M3_MODAL_KEY` Symbol). **(S)**
- [x] **0.8** Refactor existing `app/composables/useLayout.ts` provide/inject onto `createContext`. **(S)**

## Phase 1 — Shared headless primitives  *(confirm porting depth in chat before each)*

- [x] **1.1** `useSelection` (single/multiple/mandatory) — **delivered as the full registry-backed v0 chain** (Variant B, per user) in `app/composables/registry/`: `createRegistry` → `createModel` → `createSelection` (canonical `useSelection`) → `createSingle`. Foundation in `shared/utils/` (`createTrinity`, `helpers`, `instance`, `logger` shim, `useId`) + `shared/types/registry.ts`. Used by tabs, toolbar, radio-group, dropdown, table, nav-bar/rail. **(L)**
- [x] **1.2** `useGroup` — **delivered** as `createGroup`/`createGroupContext`/`useGroup` in `app/composables/registry/createGroup.ts` (batch select + tri-state mixed/indeterminate), backed by `useProxyRegistry` over `createContext`/`createTrinity`. Children self-register; parent owns selected/mixed state. **(L)**
- [x] **1.3** `usePopover` — built `app/composables/popover/usePopover.ts`: shared FSM (`status`/`isOpen`/`open`/`close`/`toggle`/`onAfter*`) + positioning (CSS anchor `position-area` **and** JS fallback with viewport flip/clamp) + **opt-in DOM ownership** (pass `trigger`/`surface` refs → measures + repositions on scroll/resize via `useGlobalListener`). `menu/useMenu.ts` rewritten as a thin wrapper over it (FSM/rect/anchor shared; menu's exact `menuStyle`/`origin→position-area`/`--ui-menu-origin` kept byte-for-byte → `menu/index.vue` untouched). tooltip/dropdown migrate in Phase 2 (2.4/2.10/2.11); hover-delay deferred to 1.6. **(M)**
- [x] **1.4** `useDrag` — pointer/touch drag-gesture composable (delta, threshold, start/move/end) shared by slider + sheet; listeners via `useGlobalListener`. **(M)**
- [x] **1.5** `useField` — form-binding wrapper over `vee-validate`/`useFormBuilder` shared by checkbox, radio, text-field, search, switch. **(M)**
- [x] **1.6** `useRaf` + `useTimer` — port from v0 (animation frame + interval with cleanup) for loading, shape, progress. **(S)**
- [x] **1.7** Refactor `app/composables/useFormBuilder.ts` — eliminate `any` (type `validationSchema` against yup `AnyObjectSchema`/`InferType`, type `resolveInitialValues` and the `field.type` switch), drop the bare `console.error` (surface via `onError`/return), tighten `FormBuilderReturn` typing, keep `defineFormBuilder` factory. **(M)**
- [x] **1.8** Config-driven form generation — build `useFormSchema(config)` + a thin `<MFormRenderer :config>` example that, from a passed field config (type/name/label/rules/options), derives the yup schema, drives `useFormBuilder`, and renders the matching kit inputs (text-field/checkbox/radio/switch/search) via the new `useField`. Atomic: renderer orchestrator + per-field-type leaf renderers. Confirm config shape with user before building. **(M)**

## Phase 2 — Per-component refactors  *(SCSS axis + logic axis together)*

### Selection / group cluster
- [ ] **2.1** `tabs` — SCSS legacy→migrate; tab↔panel coordination via `useGroup`/`createContext`; thin view. **(M)**
- [ ] **2.2** `toolbar` — SCSS migrated (verify); item selection + component-type resolution → `useSelection`/context. **(M)**
- [ ] **2.3** `radio` — SCSS migrated (verify); radio-group context (`useGroup`) + `useField`; drop manual name wiring. **(M)**
- [ ] **2.4** `dropdown` — SCSS migrated (verify); `useSelection` (single/multi) + `usePopover`; context for selected-label/chips. **Atomic: finish decomposition** (trigger / panel / option / selected-chips leaves) — currently only half-split. **(M)**
- [ ] **2.5** `table` — SCSS legacy→migrate; row-selection + sort state via `createContext`/`useSelection` (subs: header, pagination). **(L)**
- [ ] **2.6** `expansion-panel` — SCSS legacy→migrate; accordion exclusivity via `createContext` group. **(M)**
- [ ] **2.7** `navigation-bar` — SCSS legacy→migrate; item-selection context + `useLayoutItem`. **(M)**
- [ ] **2.8** `navigation-rail` — SCSS legacy→migrate; item-selection + expanded context + `useLayoutItem`. **(L)**
- [ ] **2.9** `navigation-drawer` — SCSS legacy→migrate; thin modal-wrapper cleanup. **(L)**

### Popover / overlay cluster
- [ ] **2.10** `menu` — SCSS legacy→migrate; replace manual scroll/resize/click listeners with `useGlobalListener` + `useClickOutside`; z-index via `useStack`; keep `useMenu` FSM headless. **Atomic: split monolithic `index.vue`** (anchor / surface / item leaves) per slider reference. **(M)**
- [ ] **2.11** `tooltip` — SCSS legacy→migrate; extract positioning to `usePopover`; listeners via `useEventListener`. **(S)**
- [ ] **2.12** `dialog` — SCSS legacy→migrate; modal stacking via `createContext` + `useStack`. **(M)**
- [ ] **2.13** `snackbar` — SCSS legacy→migrate; thin teleport; z-index via `useStack`. **(M)**
- [ ] **2.14** `sheet` — SCSS legacy→migrate; drag via `useDrag`; touch listeners via `useEventListener`. **(M)**
- [ ] **2.15** `fab-menu` — SCSS legacy→migrate; open-state composable (`useFabMenu`) + `useClickOutside`. **(M)**
- [ ] **2.16** `extended-fab-menu` — SCSS legacy→migrate; reuse `useFabMenu` from 2.15; `useClickOutside`. **(M)**

### Form inputs cluster
- [ ] **2.17** `text-field` — SCSS migrated (verify); extract label-float/variant/error logic to `useTextField` + `useField`; thin view. **Atomic: split monolithic `index.vue`** (input / floating-label / leading+trailing slots / helper-error-text leaves) per slider reference. **(L)**
- [ ] **2.18** `checkbox` — SCSS migrated (verify); `useField` consolidation; thin view. **(S)**
- [ ] **2.19** `search` — SCSS legacy→migrate; input/clear/focus composable + `useField`. **(M)**
- [ ] **2.20** `switch` — SCSS legacy→migrate; toggle logic + `useField`. **(M)**

### Animation / value cluster
- [ ] **2.21** `slider` — SCSS migrated (verify); move `document` pointer listeners to `useGlobalListener`; `useDrag`; keep `createSlider`. **(M)**
- [ ] **2.22** `progress` — SCSS legacy→migrate; extract SVG path/dash math to `useProgress` composable. **Atomic: split monolithic `index.vue`** (linear vs circular leaf renderers sharing `useProgress`) per slider reference. **(M)**
- [ ] **2.23** `loading` — SCSS legacy→migrate; extract shape-morph loop to `useRaf`/`useTimer`. **(M)**
- [ ] **2.24** `shape` — SCSS N/A; extract flubber morph to `useShapeMorph` (over `useRaf`); cancel on unmount. **(M)**
- [ ] **2.25** `date-picker` — SCSS migrated (verify); keep `useDatePicker`; ensure view thin; consider `createStep` for month nav. **Atomic: split monolithic `index.vue`** (header/nav / day-grid / year-grid leaves) per slider reference. **(M)**
- [ ] **2.26** `time-picker` — SCSS migrated (verify); keep `useTimePicker`; ensure dial/keyboard views thin. **(M)**

### Remaining SCSS migrations + thin verifications
- [ ] **2.27** `card` — SCSS legacy→migrate. **(L)**
- [ ] **2.28** `chip` — SCSS legacy→migrate; filter-toggle minor logic. **(L)**
- [ ] **2.29** `divider` — SCSS legacy→migrate. **(S)**
- [ ] **2.30** `icon` — SCSS legacy→migrate. **(S)**
- [ ] **2.31** `app-bar` — SCSS migrated (verify); extract scroll-state via `useEventListener`; size context (`useLayoutItem`). **(M)**
- [ ] **2.32** `button` — SCSS migrated (verify); thin view; optional variant-strategy tidy. **(S)**
- [ ] **2.33** `badge` — SCSS migrated; verify-only (already thin). **(S)**
- [ ] **2.34** `list` — SCSS migrated; list↔list-item context for the `item/` sub-folder if drilling exists. **(M)**
- [ ] **2.35** `layout` / `main` — SCSS N/A; ensure `useLayout` is the sole logic owner; views thin. **(S)**

## Phase 3 — Verification & cleanup

- [ ] **3.1** Full sweep: confirm no remaining local `$color`/state `$variable`s and no runtime `--custom-properties` for component colors anywhere. **(M)**
- [ ] **3.2** Confirm every global DOM listener routes through `useEventListener`/`useGlobalListener`/`useClickOutside` (no raw `addEventListener` left in `.vue`). **(S)**
- [ ] **3.3** `npm run lint` + `npm run lint:style` = 0 errors; `npm run test` green. **(M)**
- [ ] **3.4** Add a dated summary in `.cursor/summary/` capturing the refactor for the next session. **(S)**

## Phase 4 — Registry-backed selection ✅ (folded into Phase 1)

> **Status.** Originally drafted as a *future* upgrade path (Variant B), but per the
> user it was implemented up front as part of **1.1/1.2**. The full v0 chain now
> lives in `app/composables/registry/` — `createRegistry` (with the event bus) →
> `createModel` (value store + `enroll`/`apply`) → `createSelection` (canonical
> `useSelection`, `mandatory`/`'force'`) → `createSingle` (singular computeds) and
> `createGroup` (batch + tri-state, via `useProxyRegistry`). Foundation in
> `shared/utils/` (`createTrinity`, `helpers`, `instance`, `logger` shim, `useId`)
> and `shared/types/registry.ts`.
>
> **Deviations from a literal v0 port:** `useLogger` replaced by a dev-`console`
> shim (no `createPlugin`/adapters subtree); `__DEV__` → `import.meta.dev`; native
> Vue `useId`; namespaces re-prefixed `m3:*`. The registry **event subsystem was
> kept** (initially slated to drop) because `useProxyRegistry`, used by
> `createGroup`, subscribes to it. JSDoc condensed; runtime semantics unchanged.
>
> **Note:** `createSelection.apply()` uses `Set.prototype.difference`. Type-checks
> fine (kit `lib` is `ESNext`, which includes the es2025 `Set.difference` decl; TS
> 6.0.3). Runtime needs a modern engine (Node 22+/recent browsers) — true of the
> Nuxt 4 toolchain already.

