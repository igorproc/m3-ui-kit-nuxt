# verify-g1: B1, B2, B3, B10, B13, N.5, N.8, N.11
Tree: HEAD 64fb4dc + uncommitted. Paths relative to `D:\dev\primetime\ui\kit`; `R` = `src/runtime`.

## B1. Packaging and setup

### B1.1 Version / published types
status: partly — `package.json:3` is 0.5.0; source and local `dist/` export `TableColumn`/`SortState`/button types (`R/shared/types/components.ts:9-16`, `props.ts:115`); published 0.5.0 does not (unpkg: no `components.d.ts`).
kind: doc
fix: bump to 0.6.0 and republish (owner's release step).

### B1.2a `sass` undeclared
status: present — `package.json:80` devDependency only; README never mentions it; every SFC is `<style lang="scss">`.
kind: doc
fix: peerDependency `sass` (needs owner OK, "no new deps") or one README line.

### B1.2b `nuxt` peer vs claims
status: present — peer `^4.4.8` (`package.json:92`) vs `compatibility >=4.0.0` (`src/module.ts:80`) and README.
kind: doc
fix: one floor everywhere.

### B1.2c `vue` pinned exactly
status: present — peer `"vue": "3.5.39"` (`package.json:94`); nuxt 4.4.8 itself wants `^3.5.35`, so consumers on 3.5.40+ get ERESOLVE.
kind: bug
fix: peer `^3.5.35` (unless the pin is deliberate).

### B1.2d `vee-validate`/`yup` optional peers
status: present — `package.json:93,95,97-103`; imported by `R/adapters/vee-validate/index.ts:19`. README:164 never says the consumer must install both for `/validation`.
kind: doc
fix: README Validation: "install `vee-validate` and `yup` yourself".

### B1.3a Overlay renames / `openModal` / VFM removal undocumented
status: present — only in git (`36152a1`, 2026-10-06: `clickToClose->closeOnOutside`, `escToClose->closeOnEscape`, `openModal()` removed, `useModal->useModalContext`). Not in `docs_v2/.../changelog/0.6.0.md`.
kind: doc
fix: Breaking block in the 0.6.0 changelog (docs_v2 repo).

### B1.3b Fields forward attrs to the native control
status: present — `R/composables/useControlAttrs.ts:19-36` (class/style on root, rest on the control); 15 SFCs use `inheritAttrs:false`. Not in 0.6.0 changelog or kit docs.
kind: doc
fix: one changelog line + a sentence in `docs/system/en-US/behavior.md`.

### B1.4a `useThemeStore`
status: present — `R/composables/useMaterialTheme.ts:24-25`.
kind: bug
fix: delete (owner rule: no pre-1.0 aliases).

### B1.4b Theme `preset`
status: present — `R/shared/types/kit.ts:23-24`, `R/utils/theme/generateScheme.ts:50`.
kind: bug
fix: drop the field and the `?? data.preset` fallback.

### B1.4c `MAppBar type="center-aligned"`
status: present — `R/components/ui/app-bar/index.vue:28-31`, `props.ts:14-17,24`, spec `index.spec.ts:19`.
kind: bug
fix: remove the union member, two computeds, spec case.

### B1.4d `MLayoutAside position left/right`
status: present — `R/components/ui/layout/aside.vue:19-21,38-41`; `docs/layout.md:61`.
kind: bug
fix: narrow to `'start' | 'end'`.

### B1.4e `MLayoutItem area` and siblings
status: present — `R/components/ui/layout/item.vue:18-19`; `R/composables/useLayout.ts:51-52,210-211,285-288,392` (`KIND_BY_AREA` `carve.ts:22`, no-op `provideLayoutArea`). Also `<m-main>`, `ToolbarItem` (`toolbar/index.vue:51`); `docs/layout.md:161` cites a gone `isScrolled`.
kind: bug
fix: remove them all; fix the doc line.

### B1.5 `<core-scope>` vs `<MApp>`
status: fixed — `docs/architecture.md:176-189`, README:120 describe it; `core-scope` already holds the modal container (`R/components/core/scope.vue`), so `useModal` works. Residual: `architecture.md:193-196` still says "detached effect scope"; it is the `material` plugin now.
kind: doc
fix: reword that paragraph.

### B1.6a `$material-kit-*` not forwarded
status: present — `R/assets/stylesheet/abstracts/_variables.scss:2` is `@use ... as *`, `forward.scss` forwards only variables/functions/mixins/helpers; `src/module.ts:22-25` claims they are in scope.
kind: bug
fix: `@forward "~material-kit-config"` in `forward.scss`, or fix the comment.

### B1.6b Function `additionalData` dropped
status: present — `src/module.ts:33` keeps only a string; a function becomes `prelude + ''`.
kind: bug
fix: wrap it: `(src, file) => prelude + await previous(src, file)`.

### B1.6c 7 loud comments per sheet
status: present — `/* */` at `_functions.scss:5`, `_helpers.scss:1`, `_mixins.scss:1`, `_variables.scss:4,71,316`, `additional.scss:1` (exactly 7).
kind: bug
fix: turn into `//`.

### B1.6d `bp-tablet` = `min-width: 1199px`
status: present — `abstracts/_mixins.scss:37-47` read `tablet` (1199) / `desktop` (1920); unused in the kit; `docs/layout.md:223` records the quirk.
kind: bug
fix: point at `tablet-xs`/`desktop-xs` (what `useBreakpoint` and the layout use) or delete; update layout.md.

### B1.7a Hotkey internals auto-imported
status: present — `src/module.ts:167` scans `composables/**`: `registerHotkey`, `pushScope` (`hotkey/registry.ts:179-214`), `normalizeKey`, `parseForMatch` (`hotkey/format.ts`), `detectPlatform` (`useHotkeyPlatform.ts:15`).
kind: bug
fix: move internals to `R/utils/hotkey/*` (0.6.0 `useButton` precedent); keep `useHotkey`, `provideHotkeyLabels`.

### B1.7b Stale props fail silently
status: present — `R/components/ui/divider/props.ts:21` bare `inset` = `''` -> no class; `lines` is not a MList prop, falls through as a DOM attribute. No warning.
kind: doc
fix: none in code (owner rule: no legacy errors); both are in 0.6.0 Breaking.

## B2. Theme and SSR

### B2.1 `definition: 'system'` renders light in SSR
status: present — `R/utils/theme/createMaterialTheme.ts:36` `usePreferredColorScheme()` is `no-preference` on the server; `createThemeController.ts:66` maps it to light; flips after hydration. Not in `docs/configuration.md:69`.
kind: fork
fix: see question.
question: `system` на SSR всегда светлая и перекрашивается после гидратации. Как чинить?
А: Оставить, дефолт `light`, написать про вспышку в `configuration.md` (как docs_v3). Ноль кода.
Б: CSS-only: для `system` отдавать блоки палитры с `@media (prefers-color-scheme: dark)`; первая отрисовка верна без JS, цена - лишний блок CSS в head.
В: Client Hint `Sec-CH-Prefers-Color-Scheme` - только Chromium, нужен `Accept-CH`.
Рекомендация: Б - единственный вариант с верной первой отрисовкой на всех браузерах.

### B2.2a Module default contrast `medium`
status: present — `src/module.ts:111`, `createMaterialTheme.ts:29`, `configuration.md:67`.
kind: fork
fix: see question.
question: Дефолтный контраст `medium`, а M3 baseline - `standard`. Менять?
А: Дефолт `standard`; `medium` ставят явно (README так и делает).
Б: Оставить `medium` (читается лучше, но не M3 по умолчанию).
Рекомендация: А - кит позиционируется как M3.

### B2.2b Per-theme `contrast` has no effect
status: present — `generateScheme.ts:85` `opts.contrast ?? data.contrast`, but `plugins/theme-css.ts:30-33` always passes the defaulted cookie (`createMaterialTheme.ts:33`). `configuration.md:45` promises it.
kind: fork
fix: see question.
question: Поле `contrast` у темы не читается. Реализовать или убрать?
А: Приоритет cookie > тема > `theme.default` (cookie без значения = «не выбрано»); SSR остаётся верным.
Б: Удалить поле из типов и доков.
Рекомендация: А - доки обещают, правка локальная.

### B2.2c `theme.default.variant` / `neutralChroma` unread
status: present — typed at `R/shared/types/kit.ts:75-76`, no reader; `configuration.md:72-73` admits it.
kind: fork
fix: see question.
question: `theme.default.variant`/`neutralChroma` объявлены, но не читаются. Что делать?
А: Подключить как дефолт для тем без своего значения.
Б: Удалить из типов и доков.
Рекомендация: Б - то же задаётся у темы.

### B2.3a `semanticColors` replaces instead of merging
status: present — `createThemeController.ts:63` `?? DEFAULT_SEMANTIC_COLORS` (a user map drops success/warning/info); per-theme maps merge (`generateScheme.ts:75`); docs say "Extra named seeds" (`configuration.md:77`).
kind: fork
fix: see question.
question: Своя `semanticColors` вытесняет `success/warning/info`. Мерджить?
А: Мердж поверх дефолтов (убрать дефолт - `success: false`).
Б: Оставить замену, записать в доки.
Рекомендация: А - согласуется с per-theme мерджем и словом «Extra».

### B2.3b Semantic colours ignore contrast
status: present — `generateScheme.ts:76-81` uses MCU `customColor()` groups with fixed tones.
kind: gap
fix: contrast-aware tones per semantic seed (feature work).

### B2.4a Undeclared key / invalid custom HEX renders no tokens
status: present — `createThemeController.ts:100-108` sanitises only under `restrict.customPalette`; else `generateScheme` gets no seed and returns `null`, `theme-css.ts:33-36` stores `''` and still commits the key, wiping the old CSS. `setCustomColor` (`:141`) does not validate.
kind: bug
fix: fall back to the default palette when the key is undeclared or `customColor` is null; validate in `setCustomColor`.

### B2.4b Invalid `themes[].color` not validated at build
status: present — `src/options/validate.ts` checks only `theme.default.palette`; a bad seed throws in the generator and is swallowed (`theme-css.ts:36-43`).
kind: bug
fix: `findInvalidSeed` with `HEX_SEED_PATTERN`, throw in `setup`.

### B2.4c `_m3-fallback` lacks semantic roles and `scrim`
status: present — `R/assets/stylesheet/themes/base/_light.scss`/`_dark.scss` define neither; overlays use `--md-sys-color-scrim` (`abstracts/_variables.scss:148`).
kind: bug
fix: add `scrim` + semantic tokens (from `DEFAULT_SEMANTIC_COLORS`) to both files.

### B2.5a `setColorFromImage` cross-origin
status: present — `R/utils/color/imageColor.ts:44` `getImageData` throws `SecurityError` on a tainted canvas; no catch though the contract says `null` when unresolved.
kind: bug
fix: try/catch -> `null`; document the CORS need.

### B2.5b Theme colour transitions lag ~165 ms
status: cannot-verify — components transition colours on token change (e.g. `app-bar/index.vue:127-131`); 165 ms is not measurable from code. Owner: deferred.
kind: fork
fix: see question.
question: Цвета при смене темы доезжают из-за transition компонентов. Гасить?
А: На время смены ставить класс-модификатор на `<html>`, отключающий transition.
Б: Оставить, закрыть как deferred.
Рекомендация: Б - косметика, А добавляет глобальное состояние.

## B3. Layout

### B3.1 `.m-layout-main` always scrolls, `sticky` inside never sticks
status: present — `R/components/ui/layout/main.vue:30` unconditional `overflow-y: auto`; its comment (`:13`) and `docs/layout.md:46-49` say only `full-height` scrolls main.
kind: fork
fix: see question (shares a `--scroll` modifier with N.8).
question: main всегда `overflow-y:auto`, sticky внутри не липнет. Что делать?
А: `auto` только в `full-height` (модификатор из контекста лейаута), иначе `overflow: visible; overflow-x: clip`; sticky работает, широкий контент обрезается, а не скроллится в main.
Б: Оставить, обход только в доках.
Рекомендация: А - контракт в доках уже «скроллит только full-height»; в store обход пришлось писать руками.

### B3.2 `container-type` makes main the containing block for `fixed`
status: present — `main.vue:32-33` (`container-name: main-content`); tasks FINDINGS: a FAB in full-height main scrolls away. The kit never uses `main-content`; showcase mail/tasks do.
kind: fork
fix: see question.
question: `main-content` делает main containing block для fixed (FAB уезжает). Как быть?
А: Оставить, в доках: FAB/снекбар класть вне main (`m-layout-item`/`app.vue`).
Б: Контейнер включается явным пропом `container` на `MLayoutMain`; по умолчанию `fixed` работает как ждут.
Рекомендация: Б - тихая поломка `fixed` хуже одной опции для `@container`.

### B3.3 Small `MAppBar` + 56 `MSearch` overlaps by 8
status: present — bar `min-height: 64rem` + `padding-block: 8rem` (`R/assets/stylesheet/components/app-bar/_index.scss:23-26,36`); search bar 56rem (`search/_index.scss:41`); the zone reserves only the token (`app-bar/index.vue:45-53`), so the 72rem bar covers 8rem.
kind: fork
fix: see question.
question: Малый `MAppBar` с 56rem `MSearch` растёт до 72rem при резерве 64. Чинить где?
А: У малого бара `padding-block: 0` (min-height 64 центрирует 48rem-кнопки); бар равен токену.
Б: Потребитель ставит `size-token="72rem"` на `m-layout-header` (в доки).
Рекомендация: А - JS-замер ломает SSR first paint, `padding.block` нужен только medium/large.

### B3.4a Pinned zone is `fixed` without its size-token height
status: partly — `R/composables/layout/css.ts:56-62` sets no height; `min-block-size` exists only for the first sized zone at a window edge with safe-area on (`css.ts:84-88`, `carve.ts:126-131`; not nested). Other pinned zones shrink to content while the row reserves the token.
kind: bug
fix: emit `min-block-size: var(--m3-layout-<id>-size)` for every sized fixed zone.

### B3.4b Size copied onto `html`
status: present — it is `css.ts:107-118` (`scrollPaddingRule`), not `carve.ts`: copies `--m3-layout-<id>-size: <item.size>` onto `html`; a token var set on the layout element is undefined there, so scroll padding is lost.
kind: doc
fix: document "pinned-zone size tokens must live on `:root` or be literals".

### B3.4c `m-layout-item` without `kind` becomes a 2nd main
status: present — `item.vue:17` `kind` optional; `useLayout.ts:285-288` falls back to `'main'`; `carve` templates only the first main, so the extra's `grid-area` matches nothing (implicit track). No warning.
kind: bug
fix: require `kind` (type) + dev `console.warn` when missing; no default.

### B3.4d `insets.left/right` hold start/end
status: present — `carve.ts:77,178-179,227-229,249-253`, vars `--m3-layout-inset-left/right` (`css.ts:148-150`), `useLayout.ts:70-75`, `docs/layout.md:171`; in RTL `left` is inline-end.
kind: bug
fix: rename to `inline-start/inline-end` (`--m3-layout-inset-inline-*`, `insets.start/end`), no alias.

### B3.5a Nested `m-layout` behaves as root
status: present — `layout/index.vue:65` unconditional `min-height: 100dvh`; `nested` (`useLayout.ts:117,201`) only affects safe-area/scroll padding; `stickyDecls` (`css.ts:47-62`) makes a nested sticky header (default, `header.vue:24`) `fixed` to the viewport.
kind: fork
fix: see question (covers B3.5c).
question: Вложенный `m-layout` ведёт себя как корневой (`min-height:100dvh`, sticky -> `fixed` от viewport). Какой контракт?
А: Поддержать: `m-layout--nested` (`min-height: 0`), sticky-зоны вложенного остаются в потоке.
Б: Не поддерживать: «зоны только у корневого» + dev-warn на вложенный.
Рекомендация: А - код уже особо обрабатывает `nested`, значит вложенность задумана; в потоке - SSR-верный вариант без fixed.

### B3.5b `m-layout-item kind="main"` lacks `min-height: 0`/overflow
status: present — `item.vue` has no `<style>`; only `.m-layout-main` has `min-width/min-height: 0` (`main.vue:28-34`).
kind: bug
fix: `m-layout-item--main` class with the same minima (and the scroll modifier).

### B3.5c Nested header sticky -> `fixed`
status: present — same code as B3.5a.
kind: fork
fix: decided with B3.5a.

### B3.6a `MAppBar sticky` only affects registration
status: present — `app-bar/index.vue:121-122` `position: sticky; top: 0` always; `props.sticky` only feeds `useLayoutItem`. Outside a layout `sticky=false` still sticks.
kind: bug
fix: `ui-app-bar--sticky` modifier bound to `props.sticky`.

### B3.6b No landmark / heading
status: present — root `div` (`app-bar/index.vue:2`), title `<p>` (`title/index.vue:4`); landmark comes from `MLayoutHeader`.
kind: gap
fix: `headingLevel` on `MAppBar`/`MAppBarTitle`, no default (MCard precedent) rendering `h{n}`.

### B3.6c Under main it adds to main's zone
status: present — `useLayout.ts:265-278`: a host wins, the bar donates its size to `main`, which `carve` ignores; no top zone is registered.
kind: doc
fix: document "put `MAppBar` in `m-layout-header`"; optional dev warn.

## B10. Prod-only CSS order

### B10.1 Mechanism
status: present — equal-specificity parent class vs child root; nothing structural prevents it.
kind: doc
fix: keep rule A10 (compound selector).

### B10.2 Fixed set
status: fixed — all compound selectors: `file-upload/_parts.scss:165`, `color-picker/index.vue:268`, `fragments/dropdown/Panel.vue:181,190`, `alert/index.vue:149`, `banner/index.vue:131,244`, `fragments/breadcrumbs/item/index.vue:79`, `otp-input/index.vue:319`.
kind: doc
fix: none.

### B10.3a `.ui-checkbox` `color` single class
status: present — `R/components/ui/checkbox/index.vue:90`; no kit-internal override, exposure is consumer overrides.
kind: doc
fix: consumers use a compound selector (A10).

### B10.3b `MSearch` clear colour rule dead
status: fixed — in the working tree the rule is gone: `.ui-search__clear` is only `flex: 0 0 auto` (`R/components/ui/search/index.vue:308-310`; HEAD had `color: icon.color`). The icon inherits the bar colour.
kind: bug
fix: none left (3-class selector if the old ink is wanted back).

### B10.4 Workaround / scanner
status: present — scanner `override-scan.mjs` is not in the repo (`.cursor/summary/prod-override-child-root_2026-10-19_1520.md`); guard = rule A10 + prod e2e.
kind: doc
fix: optionally commit it under `shell/` as a script.

## B13. Open owner decisions

### B13.1a OQ-1 `density` step set
status: present — `docs/system/en-US/axes.md:15,95-106`, `decisions.md:95,108` still say open, but the owner fixed `compact|default|comfortable` on 2026-10-07 (memory). Fields/buttons/FAB/avatar/search use it; `MSize` (`R/shared/types/props.ts:39`), `MLoadingSize` (`loading/props.ts:12`), progress still `size`.
kind: fork
fix: see question.
question: Закрыть OQ-1: `density` = только `compact | default | comfortable` для всех семейств?
А: Да: пометить решённым, убрать `MSize`/`MLoadingSize`, loading/progress -> `density` (loading 24/48/64).
Б: Держать открытым до данных showcase.
Рекомендация: А - решение владельца есть, доки отстали.

### B13.1b OQ-2 meaning of `type`
status: present — native: `MButtonType`, `MTextFieldType`; taxonomy: `MChipType` (`chip/props.ts:15`), `MAlertType` (`alert/props.ts:5`, a semantic role), `MLoadingType`, `MToolbarType`, `MAppBarType` (really a size).
kind: fork
fix: see question.
question: Как развести два смысла `type`?
А: `type` только для нативного passthrough; таксономия на свои оси (chip `kind`, toolbar `variant`, app-bar `density`, alert - роль). Ломающие переименования без алиасов.
Б: Не переименовывать, правило «не вводить `type` в новом» остаётся.
Рекомендация: Б сейчас, А вместе с миграцией alert.

### B13.2a `plain` -> `MVariant`
status: present — `MVariant` has no `plain` (`R/shared/types/props.ts:36`); `MSurfaceVariant` does (`surface/props.ts:13`), timeline reuses it (`timeline/props.ts:59`).
kind: gap
fix: decided (`decisions.md:96`): add to `MVariant`, `MSurfaceVariant = Extract<MVariant, ...>`. Typing only.

### B13.2b `MBannerVariant` `surface`
status: present — `R/components/ui/banner/props.ts:16,34`.
kind: gap
fix: decided (`decisions.md:97`); after B13.2a rename to `plain`, narrow with `Extract<>`; no alias.

### B13.2c `size` -> `density` in loading, progress
status: present — `loading/props.ts:16`, `progress/props.ts:18` (`'medium'`).
kind: fork
fix: decided with B13.1a (values wait for OQ-1).

### B13.2d Hairline sweep
status: present — literal `1rem` strokes remain in `R/assets/stylesheet/components/`: alert `_index.scss:39`, banner `:30`, chip `:26`, hotkey `:13`, navigation-rail `:21`, surface `:30`, tabs `:12`.
kind: bug
fix: mechanical sweep to `max(1px, 1rem)` (decided, `decisions.md:99`).

### B13.3a Deferred items in B3-B9
status: cannot-verify — meta item; individual B3-B9 items are verified in their own groups.
kind: doc
fix: none.

### B13.3b Phrases via `materialKit` config
status: present — `MaterialKitOptions` (`R/shared/types/kit.ts:107-120`) has no messages option; defaults in `R/shared/constants/messages.ts`.
kind: gap
fix: `materialKit.messages` merged into `MESSAGES` (owner defines scope vs "no English default copy").

### B13.3c `useVirtualScroll` own reduced-motion copy
status: present — `R/composables/virtual-scroll/useVirtualScroll.ts:21,249` uses `prefersReducedMotion()` (`utils/motion/shared/reduced-motion.ts:18`), apart from `composables/useReducedMotion.ts`.
kind: bug
fix: build `useReducedMotion` on `prefersReducedMotion()` (low priority).

### B13.3d `useClickOutside` on a closed FAB menu
status: present — `R/components/ui/fab-menu/index.vue:207` registers always; the composable's `pause/resume` are unused.
kind: bug
fix: `watch(isOpen, open => open ? outside.resume() : outside.pause(), { immediate: true })`.

## N. New bugs

### N.5 `m-snackbar` under `m-layout` -> "Unregistered element <span>"
status: present — `R/components/ui/snackbar/index.vue:7` root `<client-only>`; Nuxt's `ClientOnly` renders a `<span>` before mount, and `R/components/ui/layout/index.vue:47-57` warns on any first-level element without `gridArea` (also a stray grid child in SSR). `MMenu` has the same shape (`menu/index.vue:2-16`); `MOverlay` avoids it with `v-if="lifecycle.isRendered"` (`overlay/index.vue:17`).
kind: bug
fix: gate the `teleport` with a `useMounted()` `v-if` instead of a root `<client-only>` (comment node, no span); same for `MMenu`.

### N.8 `m-layout-main full-height` not focusable
status: present — `R/components/ui/layout/main.vue:1-8` has no `tabindex`; it is the scroller in full-height mode (`:30`).
kind: bug
fix: expose `fullHeight` in the layout zone context; `tabindex="0"` + focus-visible ring only under the same `m-layout-main--scroll` modifier as B3.1 (page-scroll main must not be a tab stop).

### N.11a `process` untyped (TS2591)
status: present — `R/components/ui/app/index.vue:49` `process.env.NODE_ENV` (the only `process` use in the runtime).
kind: bug
fix: `import.meta.dev`.

### N.11b TS2352 on the runtime-config cast
status: present — `R/utils/theme/createMaterialTheme.ts:23` casts `useRuntimeConfig().public.materialKit` directly (module side hops via `Record<string, unknown>`, `src/module.ts:200`). Not reproduced (needs mixed `variant` themes).
kind: bug
fix: `as unknown as ...`.
