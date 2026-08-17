# Link-backed tabs for docs routes — 2026-07-14

## Result

- Added optional `to` to `MTabItem` and `MTabProps`.
- `m-tabs` forwards destinations to each tab; route-backed tabs render through `NuxtLink`, while existing button tabs remain compatible.
- Disabled route tabs prevent navigation and expose `aria-disabled` without changing button behavior.
- `useLayoutItem` now reports when a component contributes to a hosting zone. A hosted `m-navigation-rail` contributes its width but drops its own viewport sticky/height geometry, leaving the containing aside as the single geometry owner.

## Verification

- `tests/tabs.spec.ts`: 9/9 passed, including real href rendering with a memory router.
- Layout anchor + navigation rail suites: 13/13 passed, including hosted width contribution.
- Kit ESLint: 0 errors (10 pre-existing warnings outside the changed files).
- Targeted Stylelint for `app/components/ui/tabs/**/*.vue`: passed.
- Full kit Stylelint still reports five pre-existing selector-pattern errors in `app-bar` and `list/item`; none are in the tabs change.
- Nuxt dev/build was intentionally not run.
