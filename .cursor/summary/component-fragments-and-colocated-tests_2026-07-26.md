# Component fragments and co-located tests

## Context

The previous component scanner treated most files below `app/components/` as
Nuxt components. Private leaves and TypeScript support files therefore leaked
into the generated component API.

## Changes

- Established three component boundaries:
  - `app/components/ui/` for public `M*` components;
  - `app/components/fragments/` for private explicit-import leaves;
  - `app/components/core/` for internal runtime infrastructure.
- Limited Nuxt component scanning to `.vue` files in `ui/` and `core/`.
- Moved private leaves for banner, breadcrumbs, color picker, date picker,
  dropdown, fields, file upload, form renderer, OTP input, selection group,
  slider, table, time picker, and timeline into `fragments/`.
- Preserved public family children such as Button variants, List items,
  Navigation Rail items, Progress variants, Radio Group, Tabs, and Timeline
  Item under `ui/`.
- Moved component unit specs from the root `tests/` directory to their owning
  public component directories.
- Kept cross-family, layout, runtime, and pure-code tests in root `tests/`.
- Added a component-boundary test for scanner configuration, generated Nuxt
  declarations, directory ownership, and npm package exclusions.
- Excluded co-located `*.spec.ts` files from the npm package whitelist.
- Updated README, headless architecture rules, and active private-leaf plans.

## Verification

- Nuxt declarations contain public roots and `CoreScope`, with no fragment,
  `*Props`, `*Types`, or known private-leaf registrations.
- Full Vitest suite: 77 files and 592 tests passed.
- Component boundary test: 4 tests passed.
- ESLint: 0 errors, 10 pre-existing warnings.
- Stylelint for the component tree excluding two unchanged baseline files:
  0 errors.
- Production Nuxt/Nitro build passed.
- `npm pack --dry-run --json`: 427 files, 0 co-located specs.

## Remaining baseline issue

The full Stylelint command still reports five pre-existing selector-pattern
errors in `app/components/ui/app-bar/index.vue` and
`app/components/ui/list/item/index.vue`. Those files were not changed by this
migration.
