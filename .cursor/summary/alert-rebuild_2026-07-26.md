# MAlert rebuild — 2026-07-26

## Scope

Rebuilt `app/components/ui/alert` and updated its `docs_v2` page, examples, generated manifests, unit coverage, and Playwright specification.

## Decisions

- `MAlertVariant` is `Extract<MVariant, 'tonal' | 'outlined'>`.
- String props use concrete empty defaults; `icon` defaults to `false`.
- No automatic severity icons are resolved. An icon renders only from the explicit prop or `icon` slot.
- `InferType` describes consumer props and `InferResolvedType` describes component-side default-resolved props.
- Slots are connected through `defineSlots<MAlertSlots>()`; slot return content remains polymorphic.
- Alert classes and accessibility bindings are computed.
- The actions slot renders directly without an alert-owned wrapper.
- The close control is absolutely positioned and no longer contributes layout geometry.
- `MSurface` owns the medium shape.
- Alert tokens use dot-separated `g()` paths and `$alert-token-overrides` with `map.deep-merge`.
- Alert no longer owns a reduced-motion override; button motion stays with the button layer.

## Documentation examples

- Failed table request with a retry action that restores table rows.
- Conditional template draft state that switches warning and success alerts.

## Verification

- `kit`: MAlert Vitest — 14 passing.
- `kit`: full ESLint — 0 errors, 10 pre-existing warnings.
- `kit`: targeted MAlert Stylelint — passing.
- `kit`: production build — passing.
- `docs_v2`: alert page Vitest — 4 passing.
- `docs_v2`: full ESLint and Stylelint — passing.
- `docs_v2`: generated manifests sync check — passing.
- `docs_v2`: production build — passing.
- `docs_v2`: Playwright Alert E2E — 2 passing in Chromium.

## E2E ownership follow-up

- Browser scenarios remain in `docs_v2`, which owns the rendered documentation page.
- Removed the non-functional `test:e2e` script and `@playwright/test` dev dependency from `kit`.
- Removed Playwright, Playwright Core, and their nested optional package records from the kit lockfile.
- Alert E2E waits until Vue has hydrated the interactive controls before clicking because async documentation renderers can appear in SSR HTML before client handlers are attached.

## Known unrelated issue

Full kit Stylelint remains red on five pre-existing selector naming errors in `app/components/ui/app-bar/index.vue` and `app/components/ui/list/item/index.vue`. Alert files pass targeted Stylelint.
