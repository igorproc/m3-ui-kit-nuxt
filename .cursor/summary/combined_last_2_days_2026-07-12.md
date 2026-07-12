
# alert-plan_2026-07-12.md

# MAlert plan — 2026-07-12

- `MAlert` утверждён как persistent inline status block, а не toast/snackbar.
- Зафиксированы severity `info/success/warning/error`, варианты `tonal/outlined`, default icons и optional close.
- Visibility управляется `defineModel<boolean>`; отсутствуют timeout, queue, teleport и global state.
- Automatic announcement policy использует polite status для info/success/warning и assertive alert для error с public override.
- План подробно описывает slots, focus policy, responsive actions, M3 token map, SSR, edge cases и tests.
- Следующий план для обсуждения — `MAvatar`.

# autocomplete-plan_2026-07-12.md

# Autocomplete plan — 2026-07-12

- `autocomplete.md` переписан от search/selection проблемы к typed local/remote DX.
- Models `modelValue`, `search`, `open` закреплены через `defineModel`; ручные update emits запрещены.
- Loading, background loading, empty, no-results и error получили отдельные slots с default M3/locale content.
- Внутренний selected-item cache исключён; сохранение remote selected metadata — ответственность consumer.
- Keyboard/ARIA/IME contract и shared listbox extraction from `MDropdown` подробно зафиксированы.

# avatar-plan_2026-07-12.md

# MAvatar plan — 2026-07-12

- `MAvatar` зафиксирован как passive identity surface без interaction, upload, presence и group responsibilities.
- API покрывает image, initials, icon, canonical sizes, restricted shapes и tonal/filled/outlined variants.
- Описаны deterministic content precedence, stale image-event protection и native load/error lifecycle.
- Pure `getAvatarInitials()` utility учитывает grapheme clusters, locale casing и RTL visual order.
- Accessibility различает explicit alt, decorative image и name-derived root label.
- Следующая семья для обсуждения — `MBanner` и `BannerActions`.

# banner-family_2026-07-12.md

# MBanner family — 2026-07-12

- `MBanner` отделён от severity `MAlert` и transient `MSnackbar` как neutral page/section contextual action surface.
- Зафиксированы `surface|tonal`, `auto|inline|stacked`, controlled close и polite/off announcement.
- Sticky/placement остаются у layout family; queue/timer/overlay отсутствуют.
- Private `BannerActions` получает layout прямым prop и не использует context, registry или DOM measurement.
- Family plans перемещены в `banner/index.md` и `banner/actions.md` с обновлением roadmap/summary links.
- Следующая семья — Breadcrumbs.

# breadcrumbs-family_2026-07-12.md

# Breadcrumbs family — 2026-07-12

- Утверждены typed flat items, semantic `nav > ol > li` и explicit/default current resolution.
- Active `BreadcrumbsItem` переиспользует canonical `MLink`, либо текущий `MButton variant=text tag=link`; current/disabled остаются span.
- Context не используется: parent передаёт immediate leaves direct props.
- Mobile overflow: `scroll|wrap`, default scroll; inaccessible CSS collapse запрещён и отложен до полноценного menu flow.
- Divider является private aria-hidden leaf с MIcon/text rendering и RTL transform.
- Планы перемещены в `breadcrumbs/{index,item,divider}.md`; следующий family — ChipGroup.

# calendar-high-priority-pending_2026-07-12.md

# Calendar family moved to high-priority pending — 2026-07-12

- Moved root/category/daily/weekly plans into `feature/pendind-components/calendar/`.
- Marked family high priority but dependency-gated, not optional.
- Added prerequisite gates for date/timezone/DST, registry lifecycle, scroll/virtualization, drag, overlay focus, responsive SSR and token systems.
- Preserved separate view scopes while requiring one root context and shared event geometry.
- Active vuetify-run remainder is 21 plans; next family is Carousel.

# carousel-low-priority_2026-07-12.md

# Carousel family moved to low priority — 2026-07-12

- Moved MCarousel and private CarouselItem to `feature/low-priority-compponents/carousel/`.
- Preserved intended composition over MWindow with stable values, opt-in autoplay, gesture arbitration, controls/indicators and inert inactive slides.
- Explicitly deferred until MWindow, timer/gesture and image foundations are integration-tested.
- Active vuetify-run remainder is 19 plans; next item is MDataIterator.

# chip-group-plan_2026-07-12.md

# MChipGroup plan — 2026-07-12

- Approved dedicated `MChipGroupContext` built over canonical `useSelectionGroup` plus view-only roving-focus registry.
- `MChip` optionally injects only this dedicated context; generic selection cannot activate grouped mode accidentally.
- Standalone boolean model remains; grouped stable-value model is the sole source inside the group.
- Explicit standalone `MChip` remains the primary design component/API for assist/filter/input/suggestion; only descendants with `value` opt into group selection, while value-less chips remain valid layout children.
- First-iteration `filter`/`column` group props removed in favor of chip type and direction.
- Vuetify `ChipGroupSymbol` reclassified as internal injection infrastructure, not a visual component/plan.
- Added existing-family update plan for MChip selected icon, value registration and regression requirements.
- Active vuetify-run remainder: 33; next item is MEmptyState.

# color-canvas-and-plan-restructure_2026-07-12.md

# Color canvas and mandatory plan restructure — 2026-07-12

- `color-picker-canvas.md` зафиксирован как private S/V leaf; hue/alpha остаются parent MSlider controls.
- В `vuetify-run/index.md` добавлен обязательный незавершённый этап финального реформатирования families.
- `common.md` закрепляет plain file vs `<parent>/index.md + children` и запрещает автономно забыть move/link audit.

# color-input-review-gated-plan_2026-07-12.md

# MColorInput review-gated plan — 2026-07-12

- `color-input.md` подробно описан как dropdown-like `MTextField + swatch button + MMenu/MOverlay + MColorPicker`.
- Зафиксировано, что MColorInput не используется внутри picker; picker edit fields являются private leaves.
- Добавлен обязательный pre-implementation human review gate.
- В автономном режиме MColorInput пропускается без блокировки фазы до повторного обсуждения.
- Default trigger использует MButtonIcon/MButton, whole-control and swatch slots доступны.

# color-picker-edit-plan_2026-07-12.md

# ColorPickerEdit plan — 2026-07-12

- Private edit leaf зафиксирован поверх MTextField/MNumberInput/MButtonSegmented.
- Alpha UI строго `0–100%`; parent HSVA остаётся `0…1`.
- Draft/commit/revert и canvas/swatches synchronization описаны без второго color state.

# color-picker-family-restructure_2026-07-12.md

# ColorPicker family restructure and context audit — 2026-07-12

- Moved five flat plans into `vuetify-run/color-picker/` family structure.
- Confirmed the earlier architecture already intended one reactive HSVA source, but the exact provide/inject contract was implicit.
- Added one typed master MColorPickerContext with derived values, setters, format, validation, selection and commit actions.
- Clarified in every private leaf that its context shape is only a projection of the master context, never a second provided context/state.
- Updated roadmap links; full link audit follows with Timeline recording.

# color-picker-plan_2026-07-12.md

# MColorPicker plan — 2026-07-12

- `color-picker.md` переписан вокруг единого reactive HSVA context и string model.
- Alpha boolean удалён; capability определяется `hex/hexa`, `rgb/rgba`, `hsl/hsla` format.
- Alpha→opaque switch разрешён, сбрасывает alpha до 1 и выдаёт единичный dev console warning.
- Canvas/Edit/Preview/Swatches остаются private leaves одного parent context.
- `color-input.md` синхронизирован с format-driven alpha policy.

# color-picker-preview-plan_2026-07-12.md

# ColorPickerPreview plan — 2026-07-12

- Preview зафиксирован как private passive leaf текущего цвета без before/after transaction.
- `isLight` удалён из context/slot API как спорная presentation classification.
- Default contrast outline остаётся private implementation detail; custom slot получает concrete colors.

# color-picker-swatches-plan_2026-07-12.md

# ColorPickerSwatches plan — 2026-07-12

- Swatches зафиксированы как private opt-in leaf; без prop секция не рендерится.
- Встроенной/default palette нет.
- Flat/group palettes, normalized RGBA equality и keyboard grid используют parent context/registry.

# combobox-mapped-to-dropdown_2026-07-12.md

# Combobox mapped to MDropdown update — 2026-07-12

- Отдельный `vuetify-run/combobox.md` удалён: новый `MCombobox` не создаётся.
- `VCombobox` capability перенесена в развитие существующего `MDropdown`.
- Добавлен `feature/components-should-update/dropdown.md` с readonly/searchable/allowCustom modes, generic API, chips/multiple, creation и keyboard UX.
- Roadmap active delta и autocomplete composition references обновлены.

# confirm-edit-plan_2026-07-12.md

# MConfirmEdit plan — 2026-07-12

- ConfirmEdit переработан из renderless-only helper в adaptive popover/dialog editor.
- Transaction logic вынесена в reusable useConfirmEditTransaction for declarative/programmatic flows.
- Dirty outside/Escape uses confirm/prevent/discard; default confirm через `$modals`.
- MMenu исключён из-за menu semantics; default actions reuse MButton.

# data-iterator-low-priority_2026-07-12.md

# DataIterator moved to low priority — 2026-07-12

- Removed MDataIterator from active vuetify-run.
- Deferred until multiple table/card/list consumers demonstrate one shared transformation/query contract.
- Recorded `useDataIterator` composable as the preferred first design, with an optional renderless facade only if template DX justifies it.
- Added review gates for client/server modes, sort/filter/page policy and MTable/MPagination integration.
- Active remainder is 18 plans; next family is InfiniteScroll/Intersect.

# date-picker-months-pending_2026-07-12.md

# DatePickerMonths moved to pending — 2026-07-12

- План `DatePickerMonths` удалён из активного `vuetify-run` roadmap и перенесён в `feature/pendind-components`.
- Причина: существующий `MDatePicker` уже предоставляет day/year navigation, HeaderNav и общую date state; отдельный month-grid пока не подтверждён пользовательским сценарием.
- Возврат в roadmap требует решения, нужен ли month value или только промежуточная навигация.
- Активный остаток сокращён до 52 планов; следующий для обсуждения — `MAlert`.

# empty-state-low-priority_2026-07-12.md

# MEmptyState moved to low priority — 2026-07-12

- Created `feature/low-priority-compponents/` using the project-requested directory name.
- Moved `MEmptyState` out of active `vuetify-run` because current surface/icon/button composition covers the immediate need.
- Preserved candidate scope, boundaries, reuse and promotion gate in the deferred plan.
- Active remainder is 32 plans; next item is `MImg`.

# file-input-text-field-composition_2026-07-12.md

# FileInput over MTextField — 2026-07-12

- MFileInput зафиксирован как direct wrapper над public MTextField, не private field fork.
- Добавлен text-field update plan: props factory и reusable typed value slot.
- File model остаётся File/File[]/null; display string только computed presentation.

# file-upload-context-lifecycle_2026-07-12.md

# File upload context lifecycle — 2026-07-12

- Upload parent context расширен до master-context всего семейства: picker/input, dropzone, list, item, actions.
- Каждый participant injects, registers role ticket и unregisters строго через onScopeDispose.
- MFileInput optional injects/registers picker внутри upload, оставаясь standalone вне context.
- Queue entries остаются source of truth; participant registry хранит только capabilities/rendered-view order/focus metadata.
- View disposal не отменяет upload task; parent scope disposal aborts queue и очищает registry/context.

# file-upload-family-refactor_2026-07-12.md

# File upload family refactor — 2026-07-12

- Upload logic вынесена в `useFileUploadQueue`; file admission — в shared `useFileSelection/createFilePolicy`.
- MFileInput и MFileUpload используют один selection path; MFileUpload содержит один native picker через MFileInput.
- Runtime entries остаются internal reactive state, доступны slots/expose; model — File[].
- Планы сразу реформатированы по family rule: `file-upload/{index,dropzone,item,list}.md`.
- Roadmap links обновлены; старые flat family files удалены.

# file-upload-plans-expanded_2026-07-12.md

# File upload plans expanded — 2026-07-12

- Dropzone, Item и List переписаны из кратких заметок в самодостаточные implementation specs.
- Зафиксированы role registration contracts, flows, slots, states, a11y, SCSS maps, edge cases и detailed tests.
- Common требует хранить решения в `.md`, а не только в обсуждении; private leaves больше нельзя искусственно сокращать.

# hotkey-docs-m-table_20260712-202229.md

# Hotkey docs table migration

## Context

The table-actions example in `docs/app/pages/components/hotkey.vue` used a native HTML table instead of the kit table component.

## Changes

- Replaced the native table with `MTable`.
- Added typed column definitions and used the existing rows as table data.
- Rendered the status label through the `cell-active` slot.
- Preserved click-to-select behavior in every cell and connected the selected row to `MTable` through `selected-rows`.
- Removed native-table-specific styling and retained only the reset styles needed for clickable cell buttons.

# hotkey-plans_2026-07-12.md

# Hotkey plans update — 2026-07-12

- `hotkey.md` расширен до единого global pub/sub registry поверх `useGlobalListener`.
- Закреплены window-level subscriptions, scopes и будущая интеграция с overlay stack.
- `useHotkey()` возвращает presentation model; основной visual DX — `<MHotkey :hotkey="shortcut" />`.
- Подробно описан platform-aware `mod`: Meta/Command на Apple, Control на Windows/Linux, включая display и ARIA policy.
- Добавлен `hotkey-visual.md` для пассивного M3-like `MHotkey` с enabled/disabled/per-key pressed states.
- `MHotkey :keys="['enter']"` закрывает single-key `VKbd` role; отдельный `MKbd` пока не создаётся.
- Roadmap и phase 1 index обновлены.

# hover-focus-pending_2026-07-12.md

# Hover/focus pending decision — 2026-07-12

- Hover/focus API временно вынесен из последовательного утверждения в `plans/pendind-components/hover-focused.md`.
- Документированы четыре формы: renderless components, directives, composables и hybrid public/private architecture.
- Зафиксировано разделение hover и focus semantics и правило не заменять CSS M3 states JavaScript-логикой.
- Текущий наиболее сбалансированный кандидат: public renderless `MHover`/возможный `MFocused` поверх private helpers.
- Roadmap пока не изменён; решение будет принято позже.

# hover-stale-active-cleanup_2026-07-13.md

# Hover stale active cleanup — 2026-07-13

- Removed stale `vuetify-run/hover.md` and its roadmap link.
- Canonical Hover/Focused decision remains `feature/pendind-components/hover-focused.md`.
- Stepper/Window/Timeline family plans were not removed: they were explicitly approved, live in correct family directories and describe capabilities not currently implemented in kit source.

# image-pending-architecture_2026-07-12.md

# MImg moved to pending architecture — 2026-07-12

- Removed MImg from active vuetify-run roadmap.
- Deferred it until image plugin/provider, imgProxy, source factory, responsive transforms, SSR, caching and security boundaries are designed together.
- Preserved candidate component scope and explicit promotion gate in `feature/pendind-components/image.md`.
- Active remainder is 31 plans; next item is MSkeletonLoader.

# layout-shallow-owner-lookup_2026-07-11.md

# Layout shallow owner lookup

`useLayoutItem()` no longer requires a layout-aware component to be the direct
Vue child of `MLayout`. It now finds the owning layout through at most three
component-ancestor hops. This lets wrappers such as the docs `DocsHeader`
contain `MAppBar` without losing layout registration.

An existing layout host has priority over this lookup. `MAppBar` inside
`MLayoutHeader` or `MLayoutMain` therefore still contributes its size to the
host zone instead of registering a duplicate top zone.

Added layout-anchor coverage for a one-wrapper DocsHeader scenario and a
four-wrapper boundary scenario. Verification: `vitest run
tests/layout-anchors.spec.ts` passes 7/7; ESLint passes for the changed engine
and test files.

# list-subheader-plan_2026-07-12.md

# List coverage and MListSubheader — 2026-07-12

- Owner verification established that MListGroup and ListChildren capabilities are already implemented by the existing list family; their new-capability plans were removed.
- Coverage matrix now records those roles as existing rather than low priority/missing.
- MListSubheader was expanded as the only missing list role: passive title/slot, optional sticky and inset alignment, no context/state.
- Active remainder is 27 plans; next family is SlideGroup/SlideGroupItem.

# mapp-root-boundary_2026-07-13.md

# MApp root boundary

## Context

Implemented the public `MApp` convenience boundary from
`.cursor/plans/feature/vuetify-run/app.md` before starting docs_v2.

## Changes

- Added `app/components/ui/app/index.vue` with theme initialization, a single
  `#ui-overlay-host`, readonly loading slot state, custom root tag, root expose,
  and duplicate-boundary diagnostics.
- Added the co-located zero-runtime token map under
  `app/assets/stylesheet/components/app/_index.scss`.
- Migrated `app/app.vue` to use `MApp`.
- Preserved `app/components/core/scope.vue` exactly as an intentional runtime
  boundary and mounted it from `MApp` inside `ClientOnly`.
- Added focused unit coverage in `tests/app.spec.ts`.

## Verification

- `npm run test -- tests/app.spec.ts`: 5 tests passed.
- Targeted ESLint and Stylelint: 0 errors.
- Consumer SSR build through docs_v2: passed.

# mlazy-smart-loading-plan_2026-07-12.md

# MLazy smart loading plan — 2026-07-12

- `vuetify-run/lazy.md` переписан как подробный план public `MLazy`.
- Объединена roadmap-идея smart loading с Vuetify `VLazy` capability.
- Зафиксированы `eager`, `on-idle`, `on-view`, `on-interaction`; прежний eager-режим больше не называется `idle`.
- Suspense используется после activation для fallback/pending/resolve; error boundary реализуется отдельно.
- Проведена честная граница между lazy mount/chunk loading и native Nuxt delayed hydration SSR HTML.
- Roadmap feature links, phase index и основной `kit/roadmap.md` обновлены.

# number-input-plan_2026-07-12.md

# MNumberInput plan — 2026-07-12

- `number-input.md` переписан вокруг separate numeric model/string draft и locale codec.
- Models используют defineModel, NaN не попадает в public state.
- Default increment/decrement controls переиспользуют `MButtonIcon → MButton`.
- Whole-control `decrement/increment` slots оборачивают defaults и получают props/step escape hatch.
- Numeric SCSS не копирует button tokens; stacked mode зависит от общего button size contract.

# otp-input-family_2026-07-12.md

# OTP input family — 2026-07-12

- OTP спроектирован вокруг одного native input, visual cells private/passive.
- Mask поддерживает boolean/string и отдельный `#mask` slot для MIcon/MShape/custom content.
- Family реформатирована: `otp-input/{index,field,group,separator}.md`.
- Group/separator presentation не влияет на model/caret/accessibility.

# otp-plans-expanded_2026-07-12.md

# OTP plans expanded — 2026-07-12

- OTP parent дополнен user jobs, native input visibility, caret mapping, events, validation/SSR и edge cases.
- Field/Group/Separator переписаны в самодостаточные specs с contracts, slots, DOM semantics, M3 maps и detailed tests.
- Mask slot explicitly supports MIcon/MShape while remaining decorative and avoiding accidental code leakage.

# overlay-modals-plan_2026-07-12.md

# Overlay and modals planning update — 2026-07-12

- Переписан `feature/vuetify-run/overlay.md` от проблемы к UX/API/runtime solution.
- `MOverlay` закреплён как общий primitive для dialog, modal sheet и menu, без дублирования их geometry/semantics.
- Зафиксированы два равноправных modal flow: declarative `v-model` и programmatic `$modals`/`useModals()`.
- Добавлен `plans/components-should-update/modals.md` с typed result contract, nesting, plugin facade и миграцией текущего `openModal()`.
- `vue-final-modal` остаётся временным внутренним mounting adapter и не попадает в public API.
- Следующее обсуждение перед реализацией: точный API confirm/alert presets и persistent policy для `closeAll`.

# pagination-plan_2026-07-12.md

# MPagination plan — 2026-07-12

- Approved standalone numbered pagination distinct from compact table footer.
- One 1-based page model and `length` source; no totalItems/itemsPerPage duplication or fetch state.
- Pure deterministic range/ellipsis and page-normalization utilities.
- Out-of-range external model is normalized and updated when length changes.
- Controls reuse MButton/MButtonIcon; native keyboard and nav/current ARIA semantics.
- Active remainder is 13 plans; next item is MParallax.

# paid-charts-lab_2026-07-13.md

# Paid charts lab extraction — 2026-07-13

- Moved Barline, Sparkline, private Tooltip and Trendline out of active vuetify-run into `feature/paid-charts-plab/`.
- Added lab index covering consolidated line|bar|area decision, shared geometry, accessibility, motion, chart-library boundary and commercial packaging.
- Preserved individual plans until consolidated-vs-separate public API is approved.
- Active vuetify-run discussion remainder is 0; final cross-directory audit remains mandatory.
- Cross-directory feature audit completed: 89 Markdown files, 0 broken relative links, 0 stale active flat paths; active checklist is 24 completed / 0 remaining.
- The initiative is not yet structurally closed: the mandatory final family-directory/unification pass documented in vuetify-run/index.md remains a separate task.

# parallax-pending-image_2026-07-12.md

# MParallax moved beside pending MImg — 2026-07-12

- Removed MParallax from active vuetify-run.
- Deferred it as an image-motion composite dependent on MImg plugin/provider/imgProxy/factory and responsive geometry.
- Added a bidirectional dependency link between pending image and parallax plans.
- Preserved CSS-first motion, reduced-motion, RAF fallback and performance boundaries.
- Active remainder is 12 plans; next item is MPullToRefresh.

# pull-to-refresh-low-priority_2026-07-12.md

# PullToRefresh moved to low priority — 2026-07-12

- Removed MPullToRefresh from active vuetify-run.
- Deferred as a touch-specific gesture requiring scroll/overscroll/nested-container arbitration and real browser/device tests.
- Preserved consumer-owned data refresh and a candidate gesture state machine without fetch/cache responsibility.
- Active remainder is 11 plans; next family is Timeline.

# rating-plan_2026-07-12.md

# MRating plan — 2026-07-12

- Rating зафиксирован как single-focus slider-like control, не группа star buttons.
- Keyboard работает только при focus через shared local range controller; global useHotkey исключён.
- Fractional fill поддерживает arbitrary steps и MIcon/MShape item slot.

# selection-group-reactive-plan_2026-07-12.md

# Selection group reactive plans — 2026-07-12

- `selection-group.md` переписан как public renderless `MSelectionGroup<TItem, TValue>` над существующими `createGroup/createSelection/createTrinity`.
- Явно запрещена параллельная selection state: public refs являются computed projections текущего registry.
- Добавлены data-driven items with generic slot inference, manual `MSelectionItem` и advanced `useSelectionContext` facade.
- Default slot сохраняет один group-level смысл; `#item` и `#empty` отдельны.
- Data-driven records получают item effect scopes; cleanup регистраций выполняется только через `onScopeDispose`.
- Добавлен отдельный подробный `selection-item.md`; roadmap обновлён.

# skeleton-system-phase_2026-07-12.md

# Skeleton system moved to separate phase — 2026-07-12

- Removed the single MSkeletonLoader parity item from active vuetify-run.
- Created `feature/phases/skeletons/index.md` for a product-wide skeleton redesign.
- Phase scope includes primitives, per-component recipe matrix, shared geometry/tokens, motion/reduced-motion, SSR, accessibility, visual regression and docs workflow.
- Updated lazy-plan examples/reuse so they no longer assume an approved MSkeletonLoader API.
- Active vuetify-run remainder is 30 plans; next family is ListGroup/ListChildren/ListSubheader.

# slide-group-low-priority_2026-07-12.md

# SlideGroup family moved to low priority — 2026-07-12

- Clarified that SlideGroup is a scrollable peer-control strip, not a content carousel.
- Moved parent/item plans to `feature/low-priority-compponents/slide-group/`.
- Deferred arrows, drag arbitration, RTL scroll normalization and active reveal while chip/tab consumers can use wrap/native overflow.
- Updated ChipGroup reuse/boundaries so it does not depend on active SlideGroup work.
- Active remainder is 25 plans; next family is Calendar.

# textarea-plan_2026-07-12.md

# MTextarea plan — 2026-07-12

- `textarea.md` переписан как отдельный multiline field поверх private shared `MField` chrome.
- Models используют только `defineModel`.
- `resize` optional (`vertical|horizontal|both`); отсутствие prop означает no resize.
- Counter отделён от native maxlength; первая версия использует native-compatible code-unit count.
- Auto-grow описан через CSS field-sizing prototype + mirror fallback, с maxRows и cleanup.
- Pending validation не блокирует textarea и подключается позднее вместе с MTextField.

# theme-palette-contract_2026-07-11.md

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

# timeline-family_2026-07-12.md

# Timeline family — 2026-07-12

- Approved public MTimeline and public MTimelineItem with private TimelineDivider.
- V1 is vertical and explicit-composition-only; horizontal/data-driven modes deferred.
- Parent context/ordered view tickets own alternate side plus first/last metadata; item passes direct props to divider.
- Ordered-list chronology never changes for visual alternate layout; compact collapse is CSS-only.
- Time formatting remains consumer-owned; MSurface/MColor and decorative connector semantics are reused.
- Family moved to `timeline/{index,item,divider}.md`.
- Active remainder is 8 plans; next family is Treeview.
- Full vuetify-run audit after ColorPicker/Timeline moves: 0 broken links, 0 stale flat paths, 0 orphan component plans; checklist is 24 completed / 8 remaining.

# treeview-pending_2026-07-13.md

# Treeview family moved to pending — 2026-07-13

- Moved root/children/group/item plans to `feature/pendind-components/treeview/`.
- Preserved one master context, immutable PropertyKey graph, selected/opened/active models, cascade candidates, root lazy cache and complete visible-graph keyboard semantics.
- Added explicit prerequisite for MListItem role/tabindex semantic override.
- Deferred virtualization as a separate mode rather than coupling useVirtualScroll to v1.
- Active vuetify-run remainder is 4 visualization plans.

# validation-pending_2026-07-12.md

# Validation moved to pending — 2026-07-12

- Активный `vuetify-run/validation.md` удалён из phase 1 и roadmap.
- Расширенное обсуждение сохранено в `plans/feature/pendind-components/validation.md`.
- Pending варианты: обновить только canonical `useField` либо добавить поверх него public renderless `MValidation`.
- Новый `useValidation` не рекомендуется, пока он не даёт отдельной ценности.

# virtual-scroll-consolidation_2026-07-12.md

# Virtual scroll consolidation — 2026-07-12

- Replaced four overlapping Infinite/Intersect/Virtual component plans with one approved headless `useVirtualScroll` composable.
- Consumer owns all loading, cursor, retry, error, items and markup.
- Composable owns virtual range/geometry, boundary flags/thresholds, scroll state/direction, programmatic navigation, anchors and lifecycle-safe viewport observation.
- Removed arbitrary SSR count: initial range derives deterministically from canonical `useSSRWindowSize` and known layout geometry.
- V1 supports fixed or pre-known per-index sizes; measured variable heights remain deferred.
- Active remainder is 14 plans; next item is MPagination.

# vuetify-run-discussion-summary_2026-07-12.md

# Vuetify-run discussion summary — 2026-07-12

- Создан `plans/feature/vuetify-run/summary.md` как точка продолжения.
- Зафиксированы правила средней детализации чата и самодостаточных подробных plan files.
- Записаны общие decisions по defineModel, reuse, contexts/onScopeDispose, slots, M3 SCSS и review gates.
- `DatePickerMonths` перенесён в `feature/pendind-components`: существующий `MDatePicker` закрывает текущую задачу, а отдельный month-grid пока не имеет подтверждённого сценария.
- По активному roadmap после ConfirmEdit осталось 52 плана; следующий пункт — `MAlert`.
- `MAlert` утверждён как persistent inline status block, отдельный от toast-like `MSnackbar`; активный остаток — 51 план, следующий пункт — `MAvatar`.
- `MAvatar` подробно зафиксирован без дополнительного review; активный остаток — 50 планов, следующая семья — `MBanner` + `BannerActions`.
- `MBanner` и private `BannerActions` утверждены без context: neutral contextual action surface, direct layout prop и CSS-only responsive flow. Семья переведена в `banner/{index,actions}.md`; осталось 48 планов.
- Breadcrumbs family утверждена без context: canonical `MLink`/`MButton` text-link reuse, noninteractive current/disabled items, `scroll|wrap` overflow без collapse. Семья переведена в `breadcrumbs/{index,item,divider}.md`; осталось 45 планов.
- Window foundation и Stepper family (10 планов) утверждены: Window идёт первым, Stepper использует stable values, shared horizontal/vertical state, async guards и не дублирует pending validation. Осталось 35 планов.
- `MChipGroup` утверждён с dedicated provided context поверх `useSelectionGroup`; `MChip` получает optional group injection и сохраняет standalone model. Ошибочный visual `ChipGroupSymbol` удалён; осталось 33 плана.
- `MEmptyState` перенесён в `feature/low-priority-compponents`: текущая роль компонуется из существующих primitives. В активном roadmap осталось 32 плана; следующий — `MImg`.
- `MImg` перенесён в `feature/pendind-components`: требуется совместное проектирование plugin/provider, imgProxy, factory, responsive/SSR/security contracts. Активный остаток — 31 план; следующий — `MSkeletonLoader`.
- `MSkeletonLoader` вынесен из vuetify-run в отдельную `feature/phases/skeletons`: планируется системный реворк primitives/recipes для всех компонентов. Активный остаток — 30 планов; следующая семья — ListGroup.
- После проверки владельца `MListGroup`/`ListChildren` удалены из delta как уже покрытые существующим MList/MListItem. `MListSubheader` подробно утверждён; осталось 27 планов, следующая семья — SlideGroup.
- `MSlideGroup`/`SlideGroupItem` уточнены как scrollable control strip (не carousel) и перенесены в low priority; wrap/native overflow достаточно сейчас. Осталось 25 активных планов, следующая семья — Calendar.
- Calendar family (root/category/daily/weekly) перенесена в high-priority pending до системного integration/stress testing foundations. Активный остаток — 21 план; следующая семья — Carousel.
- Carousel parent/item перенесены в low priority как media/content composite поверх будущих tested MWindow/gesture/timer/image foundations. Осталось 19 активных планов; следующий — DataIterator.
- DataIterator перенесён в low priority; предпочтительный будущий кандидат — headless useDataIterator после согласования MTable/MPagination и client/server contracts. Осталось 18 планов; следующая семья — InfiniteScroll.
- Infinite/Intersect/VirtualScroll/Item consolidated into approved headless useVirtualScroll: no loader/data ownership or wrapper components; deterministic SSR uses useSSRWindowSize. Осталось 14 планов; следующий — MPagination.
- MPagination утверждён как standalone 1-based numbered control с pure ellipsis range, model normalization и MButton/MButtonIcon composition. Осталось 13 планов; следующий — MParallax.
- MParallax перенесён в pending рядом с MImg как dependent image-motion composite; точная component/composable форма решается после provider/source geometry. Осталось 12 планов; следующий — PullToRefresh.
- MPullToRefresh перенесён в low priority до подтверждённого touch-first flow и browser/device gesture arbitration tests. Осталось 11 планов; следующая семья — Timeline.
- ColorPicker family restructured to `color-picker/{index,canvas,edit,preview,swatches}.md`; parent now specifies one exact typed master context and all leaves explicitly consume projections of it.
- Timeline family утверждена как vertical explicit composition: public parent/item, private divider, one ordered view context, chronological DOM and CSS alternate collapse. Осталось 8 планов; следующая семья — Treeview.
- Treeview root/children/group/item перенесены в pending до утверждения normalization, cascade, lazy cache, full keyboard focus graph и MListItem semantic override. Осталось 4 active visualization plans.
- Barline/Sparkline/Tooltip/Trendline перенесены в `feature/paid-charts-plab`; active vuetify-run discussion remainder is now 0. Required next step is final cross-directory restructure/link/orphan/status audit.
- Final validation removed stale active `hover.md`/roadmap link; Hover/Focused remains only in `feature/pendind-components/hover-focused.md` until its API form is approved.
- Final scope correction moved MWindow/WindowItem and all eight Stepper plans to `feature/pendind-components`; Timeline remains active in vuetify-run.

# vuetify-run-index-m3-reuse_2026-07-11.md

# Vuetify-run index, M3 doctrine, and reuse map

Added `kit/.cursor/plans/feature/vuetify-run/index.md` as the phase-level
entrypoint. It explains the purpose, phase dependencies, file roles, and
definition of done for the Vuetify delta catalogue.

Extended `vuetify-run/common.md` with the M3-like doctrine: all visual
components must use the kit's semantic colour, typography, shape, motion,
responsive and accessibility conventions, plus co-located `$tokens` SCSS
maps accessed through `material-map()` and `g()`.

Added `vuetify-run/reuse-map.md` with mandatory composition paths. Examples:
Autocomplete/Combobox reuse MTextField + MMenu + dropdown selection; upload
reuses MProgress/useDrag; date-picker months extends MDatePicker; and overlay
consumers reuse useStack/useModal/MOverlay.

The common document now requires every detailed plan to include a `<reuse>`
section. Existing plans created earlier have composition notes but have not
yet all been mechanically normalized to that tag.

# vuetify-run-phase1-app-overlay_2026-07-13.md

# Vuetify-run Phase 1 — MApp review + MOverlay migration

Date: 2026-07-13. Closes the runtime/shell part of phase 1
(`.cursor/plans/feature/vuetify-run`). Continues
`vuetify-run-phase1-surface-selection_2026-07-12.md`.

## MApp (reviewed & fixed)

Owner implemented `app/components/ui/app/index.vue`; review fixes:

1. `import.meta.prod` is not a Nuxt flag → `!import.meta.prod` was always true
   (warned in production). Replaced with `process.env.NODE_ENV !== 'production'`
   (dev+test, silent in prod).
2. Duplicate-detection ran in `setup` (server too) → the SSR-seeded `useState`
   flag was serialized and re-read on the client, false-positiving a single
   hydrated `<MApp>` on every load. Moved the check into `onMounted`
   (client-only).
3. `core-scope` still rendered a hardcoded `<m-progress>` (via
   `useLoadingIndicator`) — the plan wants loading only via the `loading` slot.
   `core/scope.vue` now hosts only the modal container; no default progress UI.
4. scss prefix `m3-app` → `md-app` for consistency.

Note: owner then moved `#ui-overlay-host` to a sibling of `.ui-app` (MApp is now
multi-root); `tests/app.spec.ts` updated to query `.ui-app` explicitly.

## MOverlay runtime + primitive (new)

Owner chose **full migration**; the MOverlay objective is met with both VFM
modals migrated (MMenu already shares `useStack`).

- `app/composables/overlay/useScrollLock.ts` — reference-counted body scroll
  lock (nested modals don't unlock early), scrollbar-width compensation,
  SSR-safe, auto-release on scope dispose. `__resetScrollLock` for tests.
- `app/components/ui/overlay/{index.vue,props.ts}` +
  `app/assets/stylesheet/components/overlay/_index.scss` — `<MOverlay>`
  controlled primitive on `useStack` (z-index/dismiss/blocking) + teleport
  (**falls back to `body`** when `#ui-overlay-host` absent) + scrim + top-only
  Escape (via `useGlobalListener`) + outside (scrim click in modal;
  `useClickOutside` in popover) + modal scroll lock + focus trap/return.
  Props: `mode` modal|popover, `persistent`, `scrim` (default = modal),
  `closeOnOutside/Escape`, `teleportTo`, `transition`. Emits
  `update:modelValue`, `click:outside`, `dismiss(reason)`, `after:enter|leave`.
  Slots activator / default / scrim. `tests/overlay.spec.ts` (8).

## Consumer migrations VFM → MOverlay

- `MDialog` — renders `<MOverlay mode="modal">`; MDialog now owns
  `role="dialog"`+`aria-modal`+`aria-labelledby`; `clickToClose`/`escToClose`
  map to `closeOnOutside`/`closeOnEscape`; **public API unchanged**; motion
  child-targeted (root opacity fades scrim, `.ui-dialog` scales — the menu
  one-transition pattern). Dropped `vue-final-modal`, `useStack`, theme-attrs
  inject (overlay host is already themed). `tests/dialog.spec.ts` (5).
- `MSheet` — same migration; drag-to-dismiss preserved (offset now applied to
  `.ui-sheet` directly), `align-self: flex-end` bottom-aligns inside the
  centered overlay panel, slide-up child-targeted. sheet.spec green.

## Not migrated (deliberate, per owner "objective met")

- `MMenu` — already on `useStack`; a popover with bespoke anchor positioning
  (MOverlay popover doesn't position). Routing it through MOverlay would
  duplicate its stack/outside/escape for ~no functional change and real
  regression risk (dropdown/split/fab/search). Left as-is.
- `$modals`/`openModal` still uses `vue-final-modal` **only as a mounting
  adapter** (plan-sanctioned); the mounted MDialog/MSheet are MOverlay-based.
- `navigation-drawer`, `dialog/date` still on VFM. Full VFM removal + MMenu
  rewire = separate follow-up.

## Docs

- `docs/app/pages/components/overlay.vue` (interactive: mode/persistent/scrim
  knobs, dismiss reason, nested overlays) + sidebar entry.

## Gates

- ESLint + Stylelint clean on all new/changed kit files.
- Full `npm run test`: 53 files / 389 tests pass.

# vuetify-run-phase1-surface-selection_2026-07-12.md

# Vuetify-run Phase 1 — MSurface + MSelectionGroup/Item

Date: 2026-07-12. Scope: first foundational primitives of phase 1
(`.cursor/plans/feature/vuetify-run`). Bottom-up order agreed with owner:
MSurface → MSelectionGroup/Item → (next) useHotkey/MHotkey. `useHover` is
intentionally **deferred** (still under discussion — do not implement yet).
MApp + MOverlay are last, need explicit sign-off (they refactor shared modal
runtime).

## MSurface (done)

Passive M3 surface primitive (`surface.md`). Public `<MSurface>`.

- `app/components/ui/surface/index.vue` — `<component :is="tag">`, classes
  `ui-surface--{variant}` + `ui-surface--shape-{name}`; fallthrough attrs; no
  role/tabindex/ripple/state layers.
- `app/components/ui/surface/props.ts` — `tag` / `variant`
  (`plain|filled|elevated|outlined`, default `plain`) / `shape` (`MShape`,
  default `none`).
- `app/assets/stylesheet/components/surface/_index.scss` — zero-runtime
  `$tokens`; presets bind color role + elevation; corner shapes generated via
  `@each` over the canonical `$theme-shape-link`; elevation-1 shadow in tokens.
- New shared type `MShape` in `shared/types/props.ts` (mirrors
  `$theme-shape-link` keys).
- `tests/surface.spec.ts` (7 tests).
- MCard intentionally **not** rewritten onto MSurface (planned non-goal).

## MSelectionGroup + MSelectionItem (done)

Renderless adapters over the existing reactive registry (`createGroup` →
`createSelection` → `createModel` → `createRegistry`). No new store; registry
`selectedIds`/tickets remain the single source of truth.

- `app/composables/selection/context.ts` — public facade type
  `MSelectionContext<TValue>`, ticket/slot types, provide/inject pair
  (`m3:selection-group`), `useSelectionContext<TValue>()` (throws a clear
  "inside <MSelectionGroup>" error when orphaned).
- `app/composables/selection/useSelectionGroup.ts` — builds the facade on
  `createGroup({ reactive, multiple, mandatory, disabled })`; owns v-model↔
  registry sync, `max` enforcement (`blockReason: 'max'`), mandatory
  re-selection on removal, comparator-based value resolution.
  **Key gotcha fixed:** `selected` must be reference-stable (cache + content
  compare). A fresh array each recompute made the registry→model emit watch
  fire on every child registration and clobber a still-unapplied preset model
  with `undefined`.
- `app/composables/selection/useSelectionItem.ts` — shared registration hook
  (used by manual item + data-driven renderer); unregisters via
  `onScopeDispose` (never `onUnmounted`).
- `app/components/ui/selection-group/index.vue` — generic
  `<MSelectionGroup TItem, TValue = TItem>`; data-driven `items` + `#item`,
  manual children in `#default`, `#empty`; `item-value/-disabled/-key`
  resolvers (key or getter); dev warnings for object-value-without-item-key and
  duplicate keys.
- `app/components/ui/selection-item/index.vue` — public generic renderless
  `<MSelectionItem TValue>`, `<slot v-bind="state">`.
- `app/components/selection/data-item.vue` — **private** per-entry renderer
  (non-`ui` dir so it gets no `M*` public name), imported explicitly by the
  group. Adds `item`/`index` to the item slot scope.
- `tests/selection-group.spec.ts` (10 tests): preset single/multiple at mount,
  single replace, multiple accumulate, mandatory, max block, disabled reason,
  empty slot, manual item toggle, orphan error (synchronous `mount`, not
  Suspense, to avoid a noisy secondary unhandled rejection), advanced context.

## useHotkey + MHotkey (done)

Global hotkey pub/sub registry + M3 visual hint. One `HotkeyDefinition` drives
both matcher and label.

- `shared/types/hotkey.ts` — public types (HotkeyKey/Modifier/NamedKey,
  HotkeyDefinition, HotkeyDisplayKey, UseHotkeyOptions, HotkeyPresentation,
  UseHotkeyReturn).
- `app/composables/hotkey/format.ts` — normalization (aliases, event.key),
  `detectPlatform` (SSR-neutral `windows`), `resolveMod`, `parseForMatch`,
  `buildDisplayKeys` (modifier ordering + glyph/label per platform),
  `buildAriaLabel`. Pure, no DOM.
- `app/composables/hotkey/registry.ts` — module singleton on raw window
  listeners, ref-counted (attach on first sub, detach on last); `keydown`+
  `keyup`+`blur`+`visibilitychange`; reactive `pressedState`/`pressedKeys`;
  scope stack with `pushScope`/`popScope` (overlay integration point — active
  scope suppresses lower scopes); dev warns for modifier-only and duplicate
  combos; `__resetHotkeyRegistry` for tests.
- `app/composables/hotkey/useHotkey.ts` — single signature
  `useHotkey(keys | definition, handler, options)`; registers, returns
  presentation + pause/resume/stop; SSR-safe platform (neutral until mounted
  for `auto`).
- `app/components/ui/hotkey/{index.vue,props.ts}` + `.../components/hotkey/_index.scss`
  — `<MHotkey>` behavioral (`:hotkey`) or static (`:keys`) or single-key;
  `role="img"` + generated aria-label, keys `aria-hidden`; pressed/disabled
  states; `key`/`separator` slots. **Note:** slot prop is `token` not `key`
  (`key` is reserved on `<slot>` and would set the vnode key, not a slot prop).
- `tests/hotkey.spec.ts` (14 tests): format/ordering/aliases, exact modifiers,
  `mod` per platform, repeat, input policy, scope suppression, unmount cleanup,
  MHotkey static/single-key/disabled rendering.
- Docs: dedicated `docs/app/pages/components/hotkey.vue` (live shortcut +
  platform comparison + static/single-key + API) + sidebar entry.

## Gates

- `npm run lint` (eslint) clean on all new files.
- `npm run lint:style` clean on surface + hotkey SFC/scss.
- Full `npm run test`: 50 files / 371 tests pass (no regressions).

## Follow-ups (not done)

- Docs playground pages for both (docs project).
- Optional: migrate existing selection-ish families (tabs/chip-group/etc.)
  onto `MSelectionGroup` only where specialized a11y/keyboard is preserved.
- Next planned component: `useHotkey` + `MHotkey` (global pub/sub registry on
  `useGlobalListener` + M3 visual with co-located `$tokens`).

# vuetify-run-phase2-color-stack_2026-07-13.md

# Vuetify-run Phase 2 — Color stack (codec + MColorPicker + MColorInput)

Date: 2026-07-13. First phase-2 deliverable. Owner conducted the **mandatory
review gate** on `color-input.md` and chose: build the **full color stack**;
MColorInput opens the picker via **MMenu popover**.

## Shared color codec (pure)

`shared/utils/color/index.ts` — canonical boundary is RGBA (r,g,b 0–255, a 0–1);
HSVA/HSLA derived by pure conversion. `parseColor` (discriminated result with
`ColorParseError`) for HEX/HEXA, legacy+modern RGB(A), HSL(A). `formatColor`,
`formatSupportsAlpha`, `toCssColor`, `isLightColor`, `normalizeSwatch`,
conversions. Named colors / CSS vars / advanced spaces intentionally excluded.
`tests/color-codec.spec.ts` (11).

## MColorPicker family

Single reactive HSVA context provided by the parent; private leaves read/write
only through it.

- `app/composables/color-picker/context.ts` — `MColorPickerContext` +
  `createColorPickerState` + provide/inject pair (`m3:color-picker`). Setters
  clamp/normalize and sync the external string model live; `commit(reason)`
  emits `change`; alpha→opaque format switch resets alpha with one dev warn; a
  write-guard prevents the external↔internal sync from looping; a format watch
  re-projects the model.
- `app/components/ui/color-picker/{index.vue,props.ts}` — `<MColorPicker>` owns
  `v-model` (string|null) + `v-model:format`, renders Canvas + native
  hue/alpha range sliders (gradient tracks) + Preview + format selector
  (`MButtonSegmented`) + Edit + Swatches; emits `change`/`invalid`.
- Private leaves in `app/components/color-picker/` (non-`ui`, no public `M*`):
  `Canvas.vue` (S/V pointer drag + arrow keys), `Preview.vue`, `Edit.vue`
  (`MTextField` draft/commit/revert), `Swatches.vue` (roving grid).
- Tokens `app/assets/stylesheet/components/color-picker/_index.scss` (root +
  leaves + checkerboard). `tests/color-picker.spec.ts` (6).

## MColorInput

`app/components/ui/color-input/{index.vue,props.ts}` — compact field
(`MTextField`) + swatch trigger opening `MColorPicker` inside an `absolute`
`MMenu`. Models: `v-model` (string|null), `open`, `focused`. Draft commits on
Enter/blur (`commit:'change'`) or live (`commit:'input'`); Escape reverts;
invalid draft → error + `invalid` emit without touching the model; `format:'auto'`
follows the last committed family; `clearable`. Picker changes update the model
live. `tests/color-input.spec.ts` (5). Trigger + menu are siblings (picker is
never nested inside the `<button>`).

## Docs

- `docs/app/pages/components/color-picker.vue` + `.../color-input.vue`
  (interactive) + sidebar entries under Selection.

## Gates

- ESLint + Stylelint clean on all new files (gradient/#fff/#000 canvas literals
  are structural, not flagged).
- Full `npm run test`: 56 files / 411 tests pass.

## Notes / follow-ups

- A non-deterministic "Unhandled Rejection" occasionally prints during the full
  run (all tests pass; not reproducible in isolation) — likely a teleport/
  transition callback after unmount; worth a look but non-blocking.
- Menu surface max-width may clip the 280rem picker in some layouts (visual
  only); revisit if reported.
- Edit leaf is a single formatted-string field (v1); per-channel edit fields can
  come later.

# window-stepper-family_2026-07-12.md

# Window foundation and Stepper family — 2026-07-12

- `MWindow`/`WindowItem` подробно зафиксированы как generic value-based panel foundation с active/visited/eager mounting и optional touch.
- Roadmap исправлен: Window предшествует зависимому Stepper.
- Все восемь Stepper plans зафиксированы вокруг одного root workflow state и MWindow panel adapter.
- Stepper использует stable values, horizontal|vertical layouts, async beforeChange/beforeComplete и controlled complete/error descriptors.
- Pending validation engine не дублируется; vertical/immediate leaves получают direct props, root context используется только cross-branch.
- Plans переведены в `window/` и `stepper/`; active discussion remainder — 35.
- Full `vuetify-run` Markdown audit: 0 broken relative links, 0 orphan component plans; checklist содержит 17 completed и 35 remaining plans.

# window-stepper-moved-pending_2026-07-13.md

# Window and Stepper moved to pending — 2026-07-13

- Moved MWindow/WindowItem and the complete eight-plan Stepper family from active vuetify-run into `feature/pendind-components/`.
- Kept their approved architecture, adding explicit pending integration gates.
- Stepper remains dependent on Window and promotes only after mount/inert/motion plus guard/focus parity tests.
- Timeline remains active in vuetify-run by owner decision.
