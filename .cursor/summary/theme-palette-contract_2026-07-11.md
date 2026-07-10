# Theme palette contract cleanup

Updated the theme configuration contract from `pallete` / `data-pallet` to
`palette` / `data-palette` across the kit module, Pinia theme store, SCSS
theme mixin, public types, README, and the docs consumer config.

`_m3-fallback` is now included in the store's allowed palettes, so the
cookie default resolves to the static fallback theme defined in
`app/assets/stylesheet/themes/base`.

Removed the redundant `onMounted` + `setTimeout` from the Text Field docs
page; the refs already contain their desired initial values.

Verification: ESLint completed with 0 errors (10 pre-existing warnings).
Full Stylelint still reports five unrelated existing selector-name errors in
`app-bar` and `list/item`.
