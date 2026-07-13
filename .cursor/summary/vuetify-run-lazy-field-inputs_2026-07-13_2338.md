# Vuetify-run: MLazy and field inputs

## Scope

Implemented the agreed first batch from the vuetify-run plan while keeping
`useHover` pending for a later discussion:

- restored Nuxt test startup for `@material/material-color-utilities` 0.4.0
  through Nuxt `build.transpile`;
- marked `MOverlay` done without removing `vue-final-modal`; VFM remains an
  allowed internal mounting adapter;
- added public `MLazy` with eager, idle, viewport and interaction activation;
- extracted the private shared field shell and migrated `MTextField` to it;
- added public `MTextarea`, locale-aware `MNumberInput` and `MFileInput`;
- changed ColorPicker Edit to use numeric RGB/HSL channel inputs;
- added pure number codec and file-policy utilities.

## Documentation

Added EN/RU docs_v2 pages and live examples for `MLazy`, `MTextarea`,
`MNumberInput` and `MFileInput`. Extended docs manifest generation so field
components include shared `mFieldProps`, and slot extraction works regardless
of attribute order.

## Verification

- kit targeted Vitest: 9 files, 49 tests passed;
- kit ESLint: 0 errors (10 pre-existing warnings outside this batch);
- targeted Stylelint covers every Vue/SCSS file in this batch;
- docs_v2 Vitest: 14 files, 36 tests passed;
- docs_v2 ESLint and Stylelint passed;
- docs_v2 content validation passed for 9 pages in both locales.

No Nuxt dev server or production build was started. Full kit Stylelint still
reports pre-existing selector-pattern errors in `ui/app-bar/index.vue` and
`ui/list/item/index.vue`; these files were already modified outside this batch
and were deliberately left untouched.
