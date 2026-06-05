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
- **SCSS — legacy, needs migration (20):** card, chip, dialog, divider, expansion-panel, fab-menu, icon, loading, menu, navigation-bar, navigation-drawer, navigation-rail, progress, search, sheet, snackbar, switch, table, tabs, tooltip.
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
- [x] **2.1** `tabs` — SCSS migrated (legacy `_tabs.scss` → nested `tabs/_index.scss` map; old partial deleted). Compound `<MTabs>`/`<MTab>`/`<MTabPanel>` over `createSingle({ mandatory: 'force' })` + `createContext('m3:tabs')` (`app/composables/tabs/useTabs.ts`); thin leaves. **Backward-compat:** flat `items[]` prop auto-renders `<MTab>`s, default content slot kept. **(M)**
- [x] **2.2** `toolbar` — SCSS verified (unchanged). Opt-in registry selection: `useToolbar` (`app/composables/useToolbar.ts`) builds `createSingle`/`createGroup` only when `v-model`/`multiple` bound, provides `m3:toolbar` ctx; items registered as tickets (id-keyed). **Backward-compat:** with no model, legacy `item.selected` + `emit('select')` flow byte-identical. **(M)**
- [x] **2.3** `radio` — SCSS verified (unchanged). `<MRadioGroup>` over `createSingle` + `m3:radio-group` ctx (null default, `app/composables/radio/useRadioGroup.ts`); group injects `name`. **Backward-compat:** standalone `<MRadio v-model :path>` (incl. vee-validate path) preserved — form-renderer untouched. **(M)**
- [x] **2.4** `dropdown` — SCSS verified. Hand-rolled `any` selection replaced by `createSingle`/`createGroup` (typed). **Atomic decomposition finished:** `index.vue` orchestrator + `trigger`/`panel`/`option`/`selected-chips` leaves over `m3:dropdown` ctx; popover kept on `<m-menu>` (its own migration is 2.10). **Backward-compat:** `options[]`/`items[]`/`v-model`/all slots preserved (docs Playgrounds unchanged). **(M)**
- [x] **2.5** `table` — SCSS migrated (`_table.scss` → `table/_index.scss`). Row-selection routed through `createGroup` keyed by `row.id` (was `JSON.stringify`) via `useTableSelection` + `m3:table` context (header/pagination consume it, props kept). `types.ts` `any`→`unknown`. **Backward-compat:** `selectable`/`v-model:selected-rows`/`v-model:sort`/all slots unchanged. **(L)**
- [x] **2.6** `expansion-panel` — SCSS migrated. Compound `<MExpansionPanels multiple? mandatory?>` (createGroup when `multiple`, else createSingle exclusive) + `m3:expansion-panel-group` ctx; `<MExpansionPanel>` dual-mode. **Backward-compat:** standalone `<MExpansionPanel v-model>` unchanged. **(M)**
- [x] **2.7** `navigation-bar` — SCSS migrated. Single-select via `createSingle` (id-keyed) + `m3:navigation-bar` ctx; keeps `useLayoutItem`. **Backward-compat:** `:items`/`v-model` unchanged. **(M)**
- [x] **2.8** `navigation-rail` — SCSS migrated (shared map used by index + item). `createSingle` selection + `m3:navigation-rail` ctx (carries `expanded`); keeps `useLayoutItem` + expanded sizeToken + `:root` width vars. **Backward-compat:** `:items`/`:expanded`/`v-model` + item prop API unchanged. **(L)**
- [x] **2.9** `navigation-drawer` — SCSS migrated; `vue-final-modal` engine + all props/slots kept (thin wrapper untouched). **(L)**

### Popover / overlay cluster
- [x] **2.10** `menu` — SCSS migrated (`_menu.scss` → `menu/_index.scss`). `@vueuse` `onClickOutside`/`useEventListener` → kit `useClickOutside` + `useGlobalListener`; z-index via `useStack` (inline `:style`, dropped hardcoded). `useMenu` FSM + in-component measurement kept. **Conservative — single `index.vue` kept; atomic split deferred** (hydration-fragile, per user). Backward-compat: all props/`v-model`/`click-outside`/slot unchanged (dropdown intact). **(M)**
- [x] **2.11** `tooltip` — SCSS migrated. Kept lightweight bespoke top-center+flip math (NOT forced onto `usePopover`, per user); listeners `@vueuse`→kit `useGlobalListener`; z-index via `useStack`. API unchanged. **(S)**
- [x] **2.12** `dialog` — SCSS migrated. `useStack` integrated into `vue-final-modal` via `:z-index-fn` (per user); `useModal` context kept; `confirm` `any`→`unknown`. `dialog/date` untouched (uses date-picker SCSS). **(M)**
- [x] **2.13** `snackbar` — SCSS migrated; thin teleport; z-index via `useStack`. API unchanged. **(M)**
- [x] **2.14** `sheet` — SCSS migrated. **Dead touch-drag replaced with real `useDrag`** drag-to-dismiss (axis y, threshold 80 → close); `useStack` via `:z-index-fn`; `useModal` kept. API unchanged. **(M)**
- [x] **2.15** `fab-menu` — SCSS migrated. Extracted `app/composables/useFabMenu.ts` (open/toggle/close/select); `v-click-outside` directive → kit `useClickOutside`. API unchanged. **(M)**
- [x] **2.16** `extended-fab-menu` — **merged into `fab-menu`** (component deleted). `MFabMenu` is now a dumb wrapper: `#activator` slot (default = FAB; extended FAB goes in the slot) + default content slot (fallback = `items`). Adds `useStack` z-index (lifts the cluster over sticky/fixed chrome; no teleport — decision A), staggered clip-path reveal (unfolds from right, `--ui-fab-stagger` + `$tokens` timings). showcase "Extended FAB Menu" demo now uses the activator slot. **(M)**

### Form inputs cluster
- [x] **2.17** `text-field` — logic extracted to `app/composables/text-field/useTextField.ts` (kit `useField` binding + focus + error resolution: `errorMessage` precedence field→prop, `isError`, `meta`); `index.vue` thinned (dropped raw `vee-validate` import + manual watches + dead `useSlots`). **Atomic split deferred per user** — complexity is CSS (descendant selectors off `__control`), not JS; single `index.vue` kept (like menu 2.10). SCSS untouched (already migrated) + 2 stray `rule-empty-line-before` fixed. **Backward-compat:** all props/models/slots/classes/`aria-invalid` byte-identical. **(L)**
- [x] **2.18** `checkbox` — consolidated onto kit `useField` (dropped inline `vee-validate` block + 3 manual watches + local `errorMessage` ref). Boolean coercion preserved via a writable `booleanModel` computed (`Boolean(next)` setter) passed as the field model — shared `useField` untouched. Template/SCSS byte-identical. **(S)**
- [x] **2.19** `search` — SCSS migrated (`_search.scss` → `search/_index.scss` nested `$tokens` map, prefix `md-search`, colors via `map.get($theme-color-link,…)`; `surface-container-highest` kept as `var(--color-*)` since absent from the map; old partial deleted). **No form-binding** (user decision — search stays a pure search-box); focus/clear logic unchanged. **(M)**
- [x] **2.20** `switch` — SCSS migrated (`_switch.scss` → `switch/_index.scss` nested map, prefix `md-switch`, `map.get` colors + `color-mix` disabled states; old partial deleted). Wired kit `useField` (existing `path` prop now functional, **inert without path** → zero behavior change for current callers); `booleanModel` coercion like checkbox; `:aria-invalid` from `hasError`. No new error visuals. **(M)**

### Animation / value cluster
<!-- Post-verification fixes (round 2): slider vertical rewritten WITHOUT rotate hack (real geometry, orientation threaded to track/range/thumb) + drag perf (rect cached at dragstart, refreshed only on scroll/resize, single rAF-coalesce); time-picker dial inner-ring bug = `g()` path `selector-offset-inner` hit a scalar → null height; fixed by nesting `offset:(base/inner)`; useShapeMorph perf (loading loop-restart jank) = optional memoized `sequence` of canonical paths + settle-to-canonical + maxSegmentLength 2→6; date-picker minDate/maxDate now implemented (forwarded to useDatePicker; days disabled+dim, years outside [min,max] not rendered, nav arrows gated via canGoPrev/canGoNext). Showcase: full coverage added for all 6 (+ new Shape section, vertical sliders, constrained date-picker 2002→today, 12h time-picker). -->

- [x] **2.21** `slider` — document `pointermove/up` → existing `useDrag` (threshold default 0; window listeners via `useGlobalListener`, auto-cleanup). Click-jump preserved (pointerdown handlers untouched). Removed thumb `stopPropagation()` + added `.closest('.ui-slider-thumb')` guard on track to avoid double-jump. `createSlider` + sub-components untouched. Merged `defineEmits` signatures (unified-signatures). Lint clean. **(M)**
- [x] **2.22** `progress` — SCSS `_progress.scss`→`progress/_index.scss` nested map (prefix `md-progress`, `map.get($theme-color-link)`); old partial deleted. Wave/dash/circle math → `useProgress` (`app/composables/progress/useProgress.ts`). **Atomic split**: thin orchestrator + `linear/` + `circular/` leaves sharing `useProgress`, explicit imports, `<slot/>`. Renamed internal SVG-wave classes to single-segment BEM (`__wave`, `__wavetrack`, `__waveactive`). ARIA/sizes/indeterminate preserved. **(M)**
- [x] **2.23** `loading` — SCSS `_loading.scss`→`loading/_index.scss` (prefix `md-loading`); old partial deleted. Raw `setInterval`+`any` → `useTimer` (1s, repeat); shape cycling reuses `<MShape :name>` (explicit import; MShape owns the `useShapeMorph` morph — atomic reuse, no duplicated morph logic). No `onMounted`/`onBeforeUnmount`. **(M)**
- [x] **2.24** `shape` — flubber+RAF → `useShapeMorph` (`app/composables/useShapeMorph.ts`, over `useRaf`, auto-cancel on scope dispose, exports `easeM3Standard`; SSR snaps to target). View thinned. Shared by shape + loading. SCSS N/A. **(M)**
- [x] **2.25** `date-picker` — **Atomic split** (Agent-decided): thin orchestrator + `header-nav/` + `day-grid/` + `year-grid/` leaves, `useDatePicker` unchanged, explicit `MIcon`/`MButton` imports, `yearGrid` ref bridged via `defineExpose({ element })`. SCSS centralized in orchestrator (class-selector based), `_docked.scss` map untouched. `dialog/date` unaffected (consumes composable directly). **(M)**
- [x] **2.26** `time-picker` — verify. `index.vue`/`keyboard/` already thin. `dial/index.vue`: raw `window.addEventListener` drag → `useGlobalListener` (subscribed on pointerdown, torn down on pointerup + `onScopeDispose` safety; `{ passive: false }` preserved). **(M)**

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

