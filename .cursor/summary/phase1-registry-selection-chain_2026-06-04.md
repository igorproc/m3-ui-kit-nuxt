# Phase 1.1 + 1.2 — Full v0 registry/selection chain (2026-06-04)

Implements `plan.md` items **1.1** (`useSelection`) and **1.2** (`useGroup`) as the
**full registry-backed v0 chain** (Variant B), per the user's decision to port the
whole chain up front rather than a lean value-`Set` core. Supersedes the originally
drafted "future" Phase 4 (now folded into Phase 1).

## New foundation (`shared/`)

- **`shared/types/registry.ts`** — `ID`, `Extensible<T>`.
- **`shared/utils/helpers.ts`** — `clamp`, `resolveIds`, `resolveIndexes`.
- **`shared/utils/logger.ts`** — minimal `useLogger()` **shim** (dev-`console`,
  gated on `import.meta.dev`). Replaces v0's `useLogger`+`createPlugin`+adapters.
- **`shared/utils/createTrinity.ts`** — `[useContext, provideContext, default]` tuple
  over Phase 0's `createContext`.

> **Cleanup (post-review):** initially added `shared/utils/useId.ts` +
> `shared/utils/instance.ts` (Vue `useId` + counter fallback). **Removed** — Nuxt 4
> already auto-imports Vue's `useId`, and the wrapper had *shadowed* the global
> `useId` for the whole kit (it became the auto-import target in
> `.nuxt/types/imports.d.ts`, overriding Vue's for existing components). The registry
> chain now imports `useId` straight from `'vue'`. `instance.ts` was only used by
> that wrapper, so it went too.
>
> Known follow-up for component wiring: Vue's `useId()` needs an active component
> instance. The chain calls it inside `register()`, which runs during a child's
> setup — fine for normal use. If a component ever registers a ticket *outside*
> setup, pass an explicit `id`.

## New chain (`app/composables/registry/`)

Ported 1:1 (semantics preserved; verbose per-symbol JSDoc condensed):

- **`createRegistry.ts`** — ticket registry: id access, index reindexing, value
  reverse-lookup, **event bus kept**, caching, `move`/`reorder`/`seek`/`onboard`/
  `offboard`/`batch`. `createRegistryContext`/`useRegistry`.
- **`createModel.ts`** — value store: reactive `selectedIds`, `selectedItems`/
  `selectedValues`, `enroll`, `apply` bridge, disabled guards.
- **`useProxyRegistry.ts`** — reactive `{keys,values,entries,size}` snapshot via the
  registry event bus (the reason the event subsystem was retained).
- **`createSelection.ts`** — multi-select + `mandatory`/`'force'` + per-ticket
  `select/unselect/toggle`. **Canonical `useSelection`** (namespace `m3:selection`).
- **`createSingle.ts`** — single-select + singular computeds (`selectedId`/`Item`/
  `Index`/`Value`). `useSingle` (`m3:single`).
- **`createGroup.ts`** — batch ops + tri-state `mix`/`unmix` + select-all/none/
  toggle-all + `selectedIndexes`. **`useGroup`** (`m3:group`) → satisfies 1.2.

## Deviations from a literal v0 port (intentional)

- `useLogger` → dev-`console` shim (drops `createPlugin`/adapters subtree).
- `__DEV__` → `import.meta.dev`; v0 `useId` → native Vue `useId`.
- Namespaces re-prefixed `v0:*` → `m3:*`.
- Registry **event bus kept** (was slated to drop) — `useProxyRegistry`/`createGroup`
  depend on it; the actual event code is tiny (the LOC was mostly JSDoc).
- Removed the interim lean `app/composables/useSelection.ts`.

## Verification

- `npm run lint` — **0 errors** across all new files (`app/composables/registry/**`,
  `shared/utils/**`, `shared/types/registry.ts`).
- No SCSS touched → `lint:style` N/A.
- `Set.prototype.difference` in `createSelection.apply()` type-checks (kit `lib` =
  `ESNext` ⊇ es2025 decl, TS 6.0.3); needs a modern runtime (Node 22+) — already true
  of Nuxt 4.
- Full `nuxi typecheck` not run this batch (heavy; requires prepare). Chain is not yet
  imported by any component, so no app/test surface is affected.

## Next

Phase 1 continues: **1.3 `usePopover`** (confirm porting depth in chat first per
protocol). Then per-component refactors (Phase 2) wire `useSingle`/`useGroup`/
`useSelection` into tabs, toolbar, radio-group, dropdown, table, nav-bar/rail.
