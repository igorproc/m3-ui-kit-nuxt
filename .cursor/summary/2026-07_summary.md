# Дайджест — июль 2026

Период: 2026-07-11 … 2026-07-26. Свёрнуто из 21 отчёта сессий.
Главная тема месяца — инициатива **vuetify-run**: планирование дельты компонентов
относительно Vuetify (фаза обсуждения), затем реализация фаз 1–5, параллельно —
**docs_v2** (авто-генерируемая инфраструктура доки), динамическая тема и SSR/runtime-фиксы.

## Оглавление
1. [Планирование vuetify-run — фаза обсуждения (07-11…07-12)](#1-планирование-vuetify-run)
2. [Динамическая тема, JSDoc-API, palette-контракт (07-11…07-13)](#2-тема-и-api)
3. [SSR / runtime-фиксы (07-11…07-13)](#3-ssr-runtime-фиксы)
4. [vuetify-run Phase 1: Surface, SelectionGroup, Hotkey, App, Overlay (07-12…07-13)](#4-phase-1)
5. [vuetify-run Phase 2: color-stack, lazy, field-inputs (07-13…07-14)](#5-phase-2)
6. [docs_v2: инфраструктура, button-страница, drawer, link-tabs (07-14…07-15)](#6-docs-v2)
7. [vuetify-run Phase 3: content & collections (07-16)](#7-phase-3)
8. [vuetify-run Phase 4–5: navigation & timeline (07-18)](#8-phase-4-5)
9. [Alert rebuild + фрагменты и co-located тесты (07-26)](#9-конец-месяца)

---

## 1. Планирование vuetify-run
Двухдневный лог обсуждений (07-11/12): по каждому компоненту утверждались границы, API,
reuse-пути и классификация. Инфраструктура планов: `vuetify-run/index.md` (entrypoint,
DoD), `common.md` (M3-доктрина: семантические цвет/типографика/форма/motion + co-located
`$tokens` через `g()`; правило «решения хранить в `.md`»; plain vs `<parent>/index.md`+children),
`reuse-map.md` (обязательные композиционные пути), `summary.md` (точка продолжения).

**Утверждено в активный roadmap** (примеры решений): `MAlert` (persistent inline status,
не toast; severity info/success/warning/error), `MAvatar` (+ pure `getAvatarInitials`),
`MBanner`+`BannerActions` (neutral surface, без context), `MBreadcrumbs` (`nav>ol`,
reuse `MLink`/`MButton`), `MChipGroup` (dedicated context над `useSelectionGroup`),
`MListSubheader`, `MAutocomplete` (reuse `MTextField`+`MMenu`), `MOtpInput`, `MRating`,
`MFileUpload`/`MFileInput` (`useFileUploadQueue`+`createFilePolicy`), `MConfirmEdit`
(+`useConfirmEditTransaction`), `MColorPicker`-семья (один reactive HSVA-контекст,
private leaves canvas/edit/preview/swatches), `MColorInput` (review-gated), `MTextarea`,
`MNumberInput`, `MPagination`, `MTimeline`-семья, `useVirtualScroll` (headless, заменил 4
overlapping-плана Infinite/Intersect/Virtual), `MHotkey`/`useHotkey`, `MLazy`, `MApp`,
`MOverlay`, `MSelectionGroup`.

**Реклассификация** (границы initiative): `MCombobox` слит в апгрейд `MDropdown`;
в pending → Calendar (high-priority, dependency-gated), MImg, MParallax, Treeview, Validation,
Window/Stepper (8 планов), Hover/Focused, DatePickerMonths; в low-priority →
Carousel, DataIterator, EmptyState, SlideGroup, PullToRefresh; в отдельные фазы →
skeletons (`feature/phases/skeletons`), charts (`feature/paid-charts-plab`:
Barline/Sparkline/Tooltip/Trendline). Финальный кросс-директорный аудит: 89 md-файлов,
0 битых ссылок; обязательное финальное реформатирование каталога оставлено отдельной задачей.

## 2. Тема и API
- **Динамическая тема** (`app/store/theme.ts`, kit-only): убрана вся dictionary-валидация;
  `definition: light|dark|system` (+`resolvedDefinition`, `systemDefinition` из
  `usePreferredColorScheme`); динамическая палитра — кука `{isCustom,key}`, `isCustom:true` →
  HEX генерится в рантайме и инжектится через `useHead({style})` под `data-palette=_custom`
  (`setCustomColor`); единый генератор `shared/utils/themeScss.ts` (дедуп стора и модуля).
  `@material/material-color-utilities` теперь в клиентском бандле (ради color picker).
- **Palette-контракт** (07-11): опечатка `pallete`/`data-pallet` → `palette`/`data-palette`
  сквозь модуль, стор, SCSS-миксин, типы, README, docs; `_m3-fallback` в allowed-палитрах.
- **JSDoc-API нормализация** (07-13): public property-level JSDoc для Badge, Button
  (color/variant/disabled/loading/tag/type/to), всей Button-family (size/aria-labels/segmented/
  split-menu), Icon (вынесен в co-located `props.ts`) — потребляется build-time API-генератором
  docs_v2 как источник истины.

## 3. SSR / runtime-фиксы
- **Vue runtime alignment**: SSR-краш docs_v2 из-за рассинхрона Vue 3.5.33 (kit) vs 3.5.39
  (docs); kit запинен на 3.5.39. Follow-up: `vue`/`nuxt` переведены в peerDependencies kit;
  добавлены `deps:verify`/`test:production` в docs_v2.
- **SSR layout order**: `order` возвращён как активная опция `useLayoutItem` (стабильная
  ascending-сортировка, равные/пустые — DOM-порядок); docs-shell: aside 0 / header 1 / main 2.
- **Layout shallow owner lookup** (07-11): `useLayoutItem()` находит owning-layout через ≤3
  хопа предков (docs `DocsHeader` может содержать `MAppBar`); существующий host в приоритете.

## 4. Phase 1
Bottom-up порядок: MSurface → MSelectionGroup/Item → useHotkey/MHotkey → MApp → MOverlay.
- **MSurface** (07-12): пассивный M3-примитив (`plain|filled|elevated|outlined` + `shape`),
  zero-runtime токены, новый shared-тип `MShape`. 7 тестов.
- **MSelectionGroup + MSelectionItem** (07-12): renderless-адаптеры над реестром
  (`createGroup`→`createSelection`→`createModel`→`createRegistry`), без нового стора; контекст
  `m3:selection-group`; **ключевой фикс** — `selected` должен быть reference-stable (кеш +
  content-compare), иначе emit-watch затирает preset-модель. Generic `<MSelectionGroup TItem,TValue>`.
- **useHotkey + MHotkey** (07-12): глобальный pub/sub-реестр на raw window-листенерах
  (ref-counted, scope-стек для overlay), platform-aware `mod` (Meta на Apple, Control иначе),
  `MHotkey` пассивный M3-хинт (`role=img` + aria-label). 14 тестов. Гейт: 50 файлов / 371 тест.
- **MApp** (07-13): публичная boundary — инициализация темы, один `#ui-overlay-host`, loading-слот,
  диагностика дублей. Ревью-фиксы: `import.meta.prod` не существует → NODE_ENV; duplicate-check
  перенесён в `onMounted` (не SSR); prefix `m3-app`→`md-app`.
- **MOverlay** (07-13): controlled-примитив на `useStack` + teleport (fallback `body`) + scrim +
  top-only Escape + outside + scroll-lock (`useScrollLock`, ref-counted, компенсация скроллбара) +
  focus-trap; `mode` modal|popover. Миграция VFM→MOverlay: `MDialog` (теперь владеет
  `role=dialog`+`aria-modal`), `MSheet` (drag-to-dismiss сохранён). Не мигрированы намеренно:
  `MMenu` (свой anchor-positioning), `$modals`/`openModal` (VFM как mounting-adapter),
  navigation-drawer, dialog/date. Гейт: 53 файла / 389 тестов.

## 5. Phase 2
- **Color stack** (07-13): чистый codec `shared/utils/color/index.ts` (канонический RGBA,
  HSVA/HSLA деривативы, `parseColor`/`formatColor`, 11 тестов); `MColorPicker`-семья (единый
  HSVA-контекст `m3:color-picker`, private leaves Canvas/Preview/Edit/Swatches, alpha→opaque с
  dev-warn); `MColorInput` (компактное поле + swatch-триггер, picker в `MMenu` popover, draft на
  Enter/blur, Escape-revert). Гейт: 56 файлов / 411 тестов.
- **MLazy и field-inputs** (07-13): восстановлен Nuxt-тест-старт для
  `@material/material-color-utilities` через `build.transpile`; `MOverlay` помечен done (VFM как
  внутренний адаптер); `MLazy` (eager/idle/viewport/interaction); извлечён приватный shared
  field-shell, `MTextField` мигрирован на него; новые `MTextarea`, `MNumberInput` (locale),
  `MFileInput`; ColorPicker Edit → числовые RGB/HSL-каналы.
- **Vuetify-run status audit** (07-13): 42 плана разделены на discussion-approval vs
  implementation-state (10 done / 7 partial / 25 planned).
- **Phase 2 complete** (07-14): каталог 28 done / 0 partial / 14 planned. Реализованы
  `MAutocomplete` (combobox ARIA, shared `useListbox`, local/remote), `MOtpInput` (один native
  input), `MRating`, `MFileUpload` (queue, AbortController), `MConfirmEdit`; `MNumberInput`
  stacked-layout; `MColorInput` review-gate approved. Гейт: 10 файлов / 41 тест.

## 6. docs_v2
- **Инфраструктура и миграция** (07-15): 17-компонентный каталог для API-генерации; генерируемые
  агрегат-JSON реестры (`docs:sync`); авто-дискавери renderer'ов с валидацией коллизий; рекурсивное
  извлечение props/slots/emits (в т.ч. factories, inherited); manual token-манифесты с наследованием;
  16 v1-страниц мигрированы. Гейты: `docs:sync --check` (17 API / 18 токен-семейств / 60 renderer'ов),
  `docs:validate` (19 док × 2 локали), 48 тестов, прод-билд.
- **Button-страница M3×Vuetify** (07-15): 5 секций (Overview/Specs/Guidelines/Accessibility/Tokens+API),
  server-driven EN/RU; sticky-toolbar с двумя M3-состояниями (wide-shadowless ↔ compact), `DocsOnThisPage`
  scroll-spy; dedicated content-renderers (text/usage/anatomy/states/accessibility/guidance); lazy
  block-resolution через `defineAsyncComponent`.
- **Teleported components drawer** (07-14): drawer доки вынесен из `m-layout-aside` через
  `m-overlay` popover-mode (shared host/stack/Escape/outside); overlay popover-корни → `pointer-events:none`.
- **Link-backed tabs** (07-14): опциональный `to` у `MTabItem`/`MTabProps`, route-tabs через `NuxtLink`;
  `useLayoutItem` сообщает о вкладе в host-зону (hosted rail отдаёт ширину, но не геометрию).

## 7. Phase 3
Все 9 планов «Content и collections» → done (07-16, автономно): `MAlert` (severity→роли, live-region),
`MAvatar`+`getAvatarInitials`, `MBanner`+`BannerActions`, `MBreadcrumbs`, `MChipGroup`, `MListSubheader`.
Полный сьют кита: **540 тестов / 73 файла**.
- **MAlert** (детальный отчёт 07-16): единственная `$tokens`-мапа (`alert-tonal()`/`alert-outlined()`),
  без свободного `color` (severity — единственный источник цвета/иконки/семантики); **severity→роль
  mapping** (`info→secondary`, `success→tertiary`, `warning→primary`, `error→error`) — подтверждён
  человеком; close через `MButtonIcon` с детерминированным селектором. 12 тестов.
- **Грабли/решения**: close-слот отдаёт свой класс (наследует геометрию); `name` зарезервирован на
  `<slot>` в `MAvatar`; banner auto-layout через статический `@media`; BEM-stylelint запрещает дефис в
  элементе (divider крошек → отдельный блок); memory-router в тестах link-режима; `MChipGroup` на
  runtime-props (API-генератор не парсит type-only generics). Валидатор docs_v2 теперь проверяет граф
  `extends` токен-манифестов (это давало 500 на alert из-за `extends:[surface]` без манифеста).

## 8. Phase 4-5
Все active-roadmap планы vuetify-run реализованы (07-18): **42 done / 0 planned**.
- **useVirtualScroll** (headless): чистая геометрия (`geometry.ts`, constant O(1) / prefix-sum+бинпоиск),
  реактивная машина на `useSSRWindowSize`+`useEventListener`+`useRaf`+`ResizeObserver`. 13 тестов, без
  docs-страницы (composables получат отдельную HeadlessUI-секцию). Measured variable heights отложены.
- **MPagination**: чистые `createPaginationRange` (boundary/sibling) + `normalizePage`, reuse
  `MButton`/`MButtonIcon`. 21 тест.
- **MTimeline + MTimelineItem + TimelineDivider**: view-only ordered registry по DOM-порядку
  (`compareDocumentPosition`); вертикаль v1, side start/end/alternate, коннекторы. 15 тестов.
- **Решения/грабли**: docs-валидатор ослаблен — секции страницы теперь упорядоченное подмножество пяти
  канонических (разрешает минимальные страницы); `state` в `*-interactive` рендерерах обязателен
  опциональным с дефолтом (урок из button-hero 500); side/line таймлайна → data-атрибуты (BEM-stylelint);
  `extends` токен-манифеста должен ссылаться на существующий манифест. Гейты: kit 589 тестов / 77 файлов,
  docs_v2 60 тестов.

## 9. Конец месяца
- **MAlert rebuild** (07-26): полный ребилд `app/components/ui/alert` + docs_v2. Решения: `MAlertVariant =
  Extract<MVariant,'tonal'|'outlined'>`; **без автоматических severity-иконок** (иконка только из явного
  пропа/слота); `InferType`/`InferResolvedType`; close absolute-positioned (не влияет на геометрию);
  `MSurface` владеет формой; токены через dot-`g()` + `$alert-token-overrides` (`map.deep-merge`).
  E2E перенесены в docs_v2, из kit удалён нерабочий `test:e2e` + `@playwright/test`. Гейты: kit 14
  тестов + прод-билд, docs_v2 alert 4 теста + Playwright 2.
- **Component fragments + co-located тесты** (07-26): три границы компонентов — `ui/` (публичные `M*`),
  `fragments/` (приватные explicit-import leaves), `core/` (рантайм-инфраструктура); Nuxt-сканирование
  ограничено `.vue` в `ui/` и `core/`; приватные leaves 13 семейств перенесены в `fragments/`; юнит-спеки
  переехали в директории своих компонентов; co-located `*.spec.ts` исключены из npm-пакета. Гейты:
  77 файлов / 592 теста, `npm pack --dry-run` 427 файлов / 0 спеков.

---

> **Известная фоновая проблема весь месяц:** полный `npm run lint:style` даёт 5 pre-existing
> `selector-class-pattern` ошибок в `app-bar/index.vue` (4) и `list/item/index.vue` (1) —
> не трогались, к задачам месяца отношения не имеют.
