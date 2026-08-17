# Docs v2 component infrastructure and migration

## Context

Implemented automatic documentation infrastructure and migrated the 16 published v1 component pages while preserving the existing Button page content as the canonical baseline.

## Changes

- Added a 17-component catalog used by API generation and completeness checks.
- Replaced manual server page maps with generated aggregate JSON registries discovered by `docs:sync`.
- Added automatic block/example/playground renderer discovery with collision validation.
- Expanded API extraction to recursive props factories, inherited props/defaults, slots, scoped slots, emits, and payloads.
- Replaced generated SCSS token extraction with locale-independent manual token manifests and recursive inheritance resolution.
- Added `props | slots` control scope and enforced preset-only slot controls.
- Added shared playground harness, 16 interactive adapters, and component-specific playgrounds.
- Migrated EN/RU pages for Button family, utilities, inputs, and workflows to five routed sections with Reference ordered as playground, token map, API.
- Added infrastructure, catalog, token inheritance, slot-control, locale parity, and playground synchronization tests.

## Verification

- `npm run docs:sync -- --check` — passed; 17 API manifests, 18 token families, 60 renderers.
- `npm run docs:validate` — passed; 19 documents for both locales.
- `npm run lint` — passed.
- `npm run lint:style` — passed.
- `npm run test -- --run` — passed; 16 files, 48 tests.
- Production build — confirmed successful by the user.
- Live server probe — `GET /api/docs/en/components/button` returned HTTP 200 after replacing the Nitro-incompatible server-side eager glob.

## Follow-up

- Perform visual QA for all component pages through the already running `localhost:3000` server.
- Manual token JSON remains intentionally authored from the current SCSS and is not automatically synchronized from Sass.
