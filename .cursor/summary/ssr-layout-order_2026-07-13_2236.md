# SSR layout order

## Context

`docs_v2` rendered the desktop header across the full viewport on SSR, then
corrected it after hydration. The async setup in the docs aside registered the
header before the visually earlier aside on the server.

## Changes

- Restored `order` as an active `useLayoutItem` option and added it to layout
  registry/carve item contracts.
- Carving now uses a stable ascending order sort. Equal or omitted values retain
  registration/DOM order, so existing layouts keep their current behavior.
- Exposed `order` on layout aside, header, footer, main, and generic item.
- Set docs shell order to aside `0`, header `1`, main `2`.
- Added regression coverage for late async aside registration and registry order
  updates.

## Verification

- `npm run test -- tests/layout-carve.spec.ts tests/layout-registry.spec.ts`:
  37 tests passed.
- Kit ESLint: 0 errors (10 pre-existing warnings outside layout).
- docs_v2 ESLint: 0 errors.
- Production build was started, then intentionally stopped at user request.
