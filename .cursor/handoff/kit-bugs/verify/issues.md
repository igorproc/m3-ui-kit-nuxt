
## B1. Packaging and setup
B1.1 **Version:** `package.json` 0.5.0, changelog 0.6.0; published 0.5.0 lacks `./types` `TableColumn`/`SortState` and button types. *open* → check `dist`.
B1.2 **Dependencies:** `sass` is needed but undeclared; peer `nuxt ^4.4.8`; `vue` pinned to 3.5.39; `vee-validate`/`yup` optional (pulled in by `/validation`). *open*
B1.3 **Undocumented breaks:** overlay option renames; `openModal`/vue-final-modal gone; fields forward attrs to the native control. *open*
B1.4 **Leftover aliases:** `useThemeStore`, theme `preset`, `MAppBar type="center-aligned"`, `MLayoutAside left/right`, `MLayoutItem area`. *open* → don't use them.
B1.5 **`<core-scope>` ≠ `<MApp>`:** it has no theme CSS, and `useModal` needs MApp's container. *open* → without MApp, push `useMaterialTheme().htmlAttrs` and `themeCss` via `useHead`.
B1.6 **SCSS:** `$material-kit-*` not forwarded; a function `additionalData` is dropped; 7 comments per compiled sheet; `bp-tablet` = `min-width: 1199px` (band top) → use `media-min|distance`/`useBreakpoint()`. *open*
B1.7 **Misc:** hotkey internals auto-imported (`registerHotkey`, `pushScope`…, name clashes); stale props fail silently (bare `MDivider inset`, `MList lines`). *open*

## B2. Theme and SSR
B2.1 **`definition: 'system'`** renders light in SSR and flips after hydration. *open* → default `light` (as docs_v3 does).
B2.2 **Contrast:** the module default is `medium` (set `'standard'` for M3); per-theme `contrast` has no effect; `theme.default.variant`/`neutralChroma` are unread. *open*
B2.3 **`theme.semanticColors`** replaces instead of merging, and semantic colours ignore contrast. *open* → pass `success`, `warning` and `info`.
B2.4 **No colour tokens:** an invalid custom HEX or an undeclared palette key renders none; `_m3-fallback` has no semantic roles and no `scrim`. *open* → validate seeds.
B2.5 **Misc:** `setColorFromImage` fails cross-origin without CORS; theme colour transitions lag ~165 ms (*deferred*).

## B3. Layout
B3.1 **`.m-layout-main` scroll:** always `overflow-y: auto`, so `position: sticky` inside never sticks (non-full-height). *open* → `overflow: visible; overflow-x: clip` on your main.
B3.2 **`.m-layout-main` containment:** `container-type: inline-size` makes main the containing block for `position: fixed` (a FAB). *open*
B3.3 **Small `MAppBar` + `MSearch`:** 64 + 8 padding vs a 56 search; the bar grows to 72, its zone reserves 64, so it overlaps content by 8. *open* → a sized `m-layout-header` (72rem) or a 48rem row.
B3.4 **Zones:** a sticky sized zone turns `fixed` without its `size-token` height; `carve.ts` copies `size-token` onto `html` (a var set on the layout → nothing); `m-layout-item` without `kind` silently becomes a 2nd main; `insets.left/right` hold start/end. *open*
B3.5 **Nested `m-layout`:** keeps `min-height: 100dvh`; `kind="main"` lacks `min-height: 0`/`overflow`; a nested header goes sticky → `fixed`. *open* → fix by hand.
B3.6 **`MAppBar`:** `sticky` only affects registration (CSS always sticky); no landmark/heading; under main it adds to main's zone. *open*

## B4. Overlays (MMenu = the blocked primitive)
B4.1 **`MMenu`** (plan pending, *deferred*): without `absolute` (default `false`) it pins top 72 / right 32 over a full-page backdrop; `role=menu` unnamed, attrs on the wrapper; no `MMenuItem` (use the `ui-menu__item` recipe), disabled items aren't `menuitem`; Tab trapped, no typeahead; 200/250 ms literals ignore reduced motion; Escape returns focus to the trigger's `parentElement`, an item pick to nowhere; no `lockScroll`, no height cap.
B4.2 **Viewport clamping** is assigned to MMenu, and nothing clamps today: dropdown/autocomplete/search panels, tooltip, popover. *deferred* → panel `maxHeight` (token or prop).
B4.3 **MMenu-dependent:** `MColorInput`'s popover is `role=menu` around a picker while its button says `dialog`. *deferred*
B4.4 **`MDialog`/`MSheet` height:** no max height, `overflow: hidden`, so tall content is cut while the page is scroll-locked. *open* → your own `max-height: …dvh; overflow-y: auto` body.
B4.5 **`MDialog`/`MSheet`:** `confirm`/`cancel` never emitted (`useModal({component: MDialog})` resolves `null`); dialog `autofocus` likely fails (focus in `@opened`); headline always centred; sheet has no name, unfocusable handle, no `touch-action`. *open*
B4.6 **`useFocusTrap`** focuses the first focusable by default, against the owner's "focus the container". *open*
B4.7 **`MTooltip`:** `aria-describedby` on the inner span, only while visible (not announced); opens on click focus; 150 ms literal. *open*
B4.8 **`MOverlay`:** activator always `aria-haspopup="menu"`. *open*
B4.9 **`MSnackbar`:** `surface`, not inverse; live region mounts with the text; no queue (overlap); fixed over a nav bar/FAB. *open*

## B5. Navigation
B5.1 **Rail/bar items** are buttons, not links; pressing the active item emits nothing. *open* → read the native click (docs_v3 `itemAtEvent`).
B5.2 **Rail:** hovering the active pill drops it to pressed opacity; inside `MLayoutMain` it's "hosted" (100% wide). *open* → outrank `.ui-navigation-rail--hosted` with a compound selector.
B5.3 **Bar:** active state by colour only; rounded at elevation 2 (≠ M3). *open*
B5.4 **Drawer:** content doesn't scroll; `side` mixes logical and physical; `#activator` isn't forwarded. *open*
B5.5 **Tabs:** the tablist can't be named; panels have no `id`, yet `aria-controls` is always set; a preset non-first `v-model` may SSR-mismatch (?). *open* → route sections as links with `aria-current` (docs_v3).
B5.6 **Toolbar:** icon+label renders only the icon; no `aria-pressed`, role or keyboard. *open*
B5.7 **Pagination:** Next/Last become natively `disabled` (focus lost); camelCase `ariaLabel`/`ariaCurrent` slot props render `arialabel` in SSR; English "Go to page N"; no compact mode. *open*
B5.8 **Breadcrumbs:** no click API (only `to`); `scroll` mode never reveals the current crumb. *open*
B5.9 **RTL:** arrows not mirrored (tabs, bar); slider/progress/switch run from the left; drawer `side`/menu `origin` physical; `MIcon` doesn't mirror. *open*

## B6. Fields and selection
B6.1 **Checkbox/switch/radio:** `aria-invalid` but no error message (switch has no error look); user `id` replaced; `name` without `path` dropped; default slot renders only with `label`; `loading` ignored; no indeterminate. *open* → pass `label`, render errors yourself.
B6.2 **`MDropdown`/`MAutocomplete`:** `name` sits on the visible input (forms post the label → submit from `v-model`); without `messages` clear/toggle are nameless (always pass it); generic `TItem` from the model, not `items` (*deferred*). *open*
B6.3 **`MAutocomplete`:** `#hint` vanishes on the first keystroke; the first remote keystroke may not open the panel; `noResults` never shows with `:filter="false"`. *open*
B6.4 **`MNumberInput`:** static `unit` not announced; `null` unit + `units` checks nothing; English labels. `MNumberInputUnit` is public by accident (*deferred*, don't use). *open*
B6.5 **`MSearch`:** `v-model:focused=true` doesn't focus; Enter emits `submit` without `preventDefault`, even when empty (a parent form submits); without `clear-label` the clear button triggers a nameless warning. *open*
B6.6 **Minor:** `MTextField type="search"` keeps the native cancel button; `MOtpInput` paste `123-456` emits `invalid ['-']`; `MTextarea resizeLabel` = "Resize". *open*
B6.7 **Chip row width:** the chip-row field asks ~60rem in auto-width contexts (a table, a flex item with no basis). *accepted* → size it from the container.
B6.8 **Support line:** not reserved by default. *accepted* → if errors can arrive, bind `error`/`errorMessage` (even empty) or `path`, or the layout jumps. A composite's own errors shift the layout (*accepted*).
B6.9 **Field axes** use private `--ui-*` vars, against `decisions.md` (Q-1). *deferred*
B6.10 **`MFormRenderer`** (beta): `textarea` is single-line; `search` lacks `type`; "Submit" is English; config is read once; an optional `number` can't be empty; no `onError`; radios get no shared `name`. *open* → build forms by hand.

## B7. Pickers, colour, files
B7.1 **Pickers:** `MTimePicker` shows `errorMessage` only with `error`, `MDatePicker` alone (*open*); mode toggle on + English in `MDatePicker`, off in `MTimePicker` (*deferred*); `locale: 'en-US'` + English `MESSAGES` in pickers/number input (*deferred* → pass `locale` and labels); time radiogroup unnamed, 12h ArrowUp 11 AM → 12 AM; `selectYear` doesn't clamp to min/max (*open*).
B7.2 **`MColorInput`/`MColorPicker`:** a popover format change rewrites `v-model` without `change`; `auto` starts as hex; every blur commits (unchanged too); `:picker=false` leaves a live button; hex keeps alpha. *open*
B7.3 **Files:** `MFileInput` clear drops focus to `body`. `MFileUpload`: `:multiple=false` limits each pick, not the queue; `required` not exposed; `queue` read once; remount restarts `auto-start` (shared `queue`?); `start(id)` keeps old `error`/`progress`. *open*

## B8. Buttons, feedback, chips
B8.1 **Selected `text` icon toggle without `color`:** no colour (loses by CSS order). *open* → pass `color`.
B8.2 **Touch targets:** compact FAB/extended FAB (40) and icon-only `MButton` inside `MButtonGroup` get no 48 extension. *open*
B8.3 **Buttons, minor:** no name warning for icon-only group items/segmented; `selected` on `tag="link"` still emits. *open*
B8.4 **Directives:** `v-ripple` never ripples on Space (`'Space'` ≠ `' '`); `v-click-outside` keeps the mount-time handler (no `updated`). *open*
B8.5 **English default names:** `'Progress'`, `'Close'` (alert/banner), `'Primary'` (rail/bar), `'Navigation drawer'`, `'Dialog'`, rating. *open* → always pass names.
B8.6 **`MAlert`/`MBanner`:** the close slot's camelCase `ariaLabel` renders `arialabel` in SSR; close sits after the actions in Tab order; `MBanner layout="auto"` follows the window width. *open*
B8.7 **`MBadge`:** always a live region; no value + no `dot` = empty circle; vanishes in forced colours. *open*
B8.8 **`MProgress`/`MLoading`:** still `size` (Q-9, *deferred*); progress ignores reduced motion and RTL; `MLoading`'s status has only an `aria-label`. *open*
B8.9 **Chips:** selected `MChip` text `on-primary-container` on `secondary-container` (mismatch); pressed chip shifts 1rem (*deferred*); `MChipGroup` arrows follow mount order and lose focus on unmount. *open*
B8.10 **Minor:** `MRating` "double star", `touch-action: none` blocks scroll; `MSelectionGroup` `selectAll` ignores `max`, its fragment root drops `class`/`aria`. *open*

## B9. Containment and data
B9.1 **`MListItem`:** a static selected row looks selected but announces nothing. *open*
B9.2 **`MTable`:** prev/next become natively `disabled` (focus lost); no mixed select-all; the scroll region is unnamed with `aria-labelledby`; `TableData` rejects interfaces. Footer vs `MPagination` is undecided. *open*
B9.3 **`MTimelineItem` filled/outlined:** no padding, `none` corner. *open*
B9.4 **Hairlines:** `MSurface outlined`, `MHotkey` and chips still use `1rem`, so it can vanish on narrow screens. *open* (sweep pending)
B9.5 **Dash-form `g()`** remains in system-bar, surface, lazy, banner (possibly dead rules). *open*
B9.6 **`useHotkey`:** matches `KeyboardEvent.key`, so Russian layouts, Option+letter and Shift+punctuation never match; `scope` is a no-op without `pushScope`. *open*
B9.7 **Minor:** `MLazy once=false` never unmounts without `v-model:active`; `MApp` `rootElement` = `null`; `MShape` SVG not `aria-hidden`; `MIcon` loads client-side (shift, *deferred*); `useConfirmEditTransaction.draft` is shallow. *open*

## B10. Prod-only CSS order (recurring class)
B10.1 **Mechanism:** a parent's own class on a kit root sets the same property at equal specificity. Dev: the parent wins. Prod: chunk order flips, the child wins.
B10.2 **Fixed:** file-upload progress, color-picker format, dropdown panel progress and list, `MAlert`/`MBanner` vs `.ui-surface`, banner close, breadcrumbs link, OTP loading.
B10.3 **Live:** `.ui-checkbox` `color` is a single class; the `MSearch` clear colour rule is dead in every build.
B10.4 **Workaround:** compound selectors (A10), and run e2e on a prod build. The kit's scanner sees only static `class=`.

## B11. Accepted edge cases (don't re-propose)

## B12. Missing or withdrawn components (build app-side)

## B13. Open owner decisions (follow the local convention meanwhile)
B13.1 **Axes:** OQ-1 (density steps), OQ-2 (`type`).
B13.2 **Pending migrations:** `plain` → `MVariant`; `MBannerVariant` `surface`; `size` → `density` (loading, progress); the hairline sweep.
B13.3 **Polish run:** every *deferred* item in B3–B9, plus phrases via `materialKit` config, `useVirtualScroll`'s own reduced-motion copy, `useClickOutside` listening on a closed FAB menu.

## N. New bugs from the showcase run (report.md §4)
N.1 | `m-tabs` | при монтировании `mandatory: 'force'` эмитит `update:modelValue` первого таба (навигация по нему уводит с прямого URL) **и** не применяет не-первый `v-model`: выбраны оба, подсвечен первый | `composables/registry/createSelection.ts` `apply()` → `unselect(last)` молча выходит при `mandatory` | `to` на табах без обработчика; подсветку не обойти |
N.2 | `m-progress type="circular" expressive` | hydration mismatch на каждой загрузке: `d` волны из `Math.sin/cos` без округления, сервер ≠ браузер | `composables/progress/useProgress.ts` `circularPath` | `<client-only>` |
N.3 | `m-chip-group :wrap="false"` | чипы сжимаются и переносят подписи вместо горизонтального скролла | `components/ui/chip-group/index.vue` (`--scroll` без `flex-shrink: 0`) | `.ui-chip { flex: none }` |
N.4 | `m-button-segmented` | в узком контейнере подписи рвутся посреди слова («Hea/t») | — | icon-only сегменты |
N.5 | `m-snackbar` под `m-layout` | `[m-layout] Unregistered element <span>`: placeholder `<client-only>` на первом уровне | `snackbar/index.vue` + `layout/index.vue` 47–57 | снекбар в `app.vue` |
N.6 | `m-progress expressive linear` | путь волны фиксированной ширины 1000 выходит за элемент (right ≈ 1074px при окне 393) | `progress/linear` | — |
N.7 | `m-dialog-date` | при `null`-модели отдаёт `Date`, а не `YYYY-MM-DD` | — | нормализация в `@update:date` |
N.8 | `m-layout-main` `full-height` | скролл-регион не фокусируется — клавиатура не скроллит main (axe `scrollable-region-focusable`) | `components/ui/layout/main.vue` | `tabindex="0"` на main |
N.9 | `m-slider` | нет форматтера значения: `showValue` показывает «350», не «$350»; `ariaValuetext` есть в `useSliderControl`, но `MSlider` его не пробрасывает | `components/ui/slider` | свой `<output>` |
N.10 | `m-autocomplete`/`m-dropdown` | панель = ширина поля (`match-width`), в узком поле строки рвутся по слогам и налезают | — | одноколоночная раскладка полей |
N.11 | typecheck приложений | `ui/app/index.vue(49)` `process` (TS2591, нет node-типов); `utils/theme/createMaterialTheme.ts(23)` TS2352 при разнородных темах (часть с `variant`) | — | игнор |