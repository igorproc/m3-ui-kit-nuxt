# M3 UI Kit — Release Plan (Alpha → release)

**Date:** 2026-06-25
**Goal:** довести kit до релизной версии M3 (Alpha по roadmap, фазы 1–3).
**Form:** фазовый план. Сегодня выполняем максимум, начиная с Фазы A.
**Order (по решению user):** API → дистрибуция → a11y → тесты → docs.

## Locked decisions (ответы user)
- **API:** полная унификация пропсов через `makeX`-фабрики (паттерн из `0`). **Ломающие изменения ОК** (релиза ещё не было).
- **Имена цветов:** вместо `primary/accent/warn` и `primary/surface/secondary/tertiary` — **MD3 color-role имена**: `primary | secondary | tertiary | error`.
- **Тесты:** **полное покрытие** всех ~33 компонентов (colocated `*.test.ts`, happy-dom, a11y-asserts; шаблон из `0`).
- **Пакет:** `@primetime/ui-kit`. **Layer-only, НЕ Nuxt module.** Все 3 способа подключения — через `extends`.
- **Distribution modes:** (A) копирование файлов `extends:['../kit']`; (B) `npm i @primetime/ui-kit` (git/file/registry) → `extends:['@primetime/ui-kit']`; (C) `extends:['github:igorproc/m3-ui-kit-nuxt']`.

## Source audits
- Бизнес: `.cursor/summary/release-audit-business_2026-06-25.md`
- DX/инженерия: `.cursor/summary/release-audit-dx_2026-06-25.md`

---

## Phase A — Public API freeze & prop unification (makeX)  ⟵ START

### A0. Контракт пропсов (единая конвенция — фундамент всего)
Define shared unions/types в `shared/types/props.ts` (+ re-export public component types).
- `color?: 'primary' | 'secondary' | 'tertiary' | 'error'` — default `'primary'` (MD3 roles).
- `variant?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text'` — **только** surface-style компоненты (button family, card, text-field, dropdown). Default per-component.
- `size?: 'sm' | 'md' | 'lg'` — default `'md'` (расширяемо до xs–xl позже).
- Cross-cutting booleans: `disabled`, `readonly`, `loading` — добавить везде, где применимо (включая button/fab/icon-button — сейчас `loading` нет нигде).
- Slots vocabulary: единый `leading` / `trailing` (переименовать `prepend`/`append`, `icon`/`trailing`).
- **Освободить `variant`** там, где он перегружен другой таксономией → переименовать в семантический проп:
  - chip: `variant: assist|filter|input|suggestion` → `type` (это MD3 chip-типы, не surface-style).
  - progress: `variant: linear|circular` → `type`.
  - divider: `variant: full|inset` → `inset?: boolean` (+ `vertical?`).
  > ⚠️ Decision point (default принят): rename → `type`. Если хочешь оставить `variant` — скажи.

### A1. makeX prop-factories (порт инженерной формы из `0`, БЕЗ runtime CSS-vars)
`shared/utils/props/` :
- `useColorProps` (MD3 role) — отдаёт `color` prop + резолв в `g($t)`-совместимый ключ.
- `useVariantProps` (surface-style union).
- `useSizeProps`, `useRoundedProps` (shape), `useStateProps` (disabled/readonly/loading).
- Каждая фабрика экспортирует `*Props` interface для `extends`-микса в `defineProps`.

### A2. Reference refactor — button family на makeX (эталон для остальных)
`button`, `button/icon`, `button/fab`, `button/extended-fab`, `button/segmented`, `button/split`:
- Привести `color` к MD3 ролям; `fab` получает `variant` (его `surface` → `variant`/tonal).
- icon-button default `variant:'text'` сохранить, но через общий union.
- Добавить `loading` (спиннер/disabled во время).
- `button/split` — добавить `_index.scss` token-мапу, убрать inline `color-mix !important` (`button/split/index.vue:135`).

### A3. Распространить унификацию на остальные компоненты + точечные баги
- **Bugs:** badge undeclared `variant` (`navigation-bar/index.vue:27` ↔ `badge/index.vue:20-24`); chip `v-model:selected` → обычный `v-model` (`chip/index.vue:44`); text-field двусторонний `disabled` → один источник (`text-field/index.vue:78,96`); slider лишний `change`-alias (`slider/index.vue:114-116`); snackbar дублирующий `update:modelValue` emit (`snackbar/index.vue:46,51`); table emit payload typing `[rows:T[]]` (`table/index.vue:96`).
- **Slots:** добавить `<slot/>` в `search` (сейчас хардкод иконок `search/index.vue:9-13,27-35`); per-item слоты в nav-bar/nav-rail/segmented.
- `withDefaults` где пропущен (`list/index.vue:21`, `navigation-bar/index.vue:55`).

### A4. Export public types
Re-export `MButtonProps`, `MTextFieldProps`, … из `shared/types/` (через kit `exports` subpath). Сейчас потребитель не может импортировать типы пропсов.

**Gate A:** `npm run lint` + `lint:style` + `nuxi typecheck` = 0 ошибок.

---

## Phase B — Distribution (3 modes, layer-only)

### B1. `kit/package.json`
- `name: "@primetime/ui-kit"`, добавить `version` (`1.0.0-alpha.0`), `repository`, `license`.
- `exports`: `"."` → `./nuxt.config.ts` (layer entry); subpath `"./defineKit"` → `shared/utils/defineKit`; `"./types"` → public types.
- `files`: allowlist (`app`, `shared`, `nuxt.config.ts`, generated scss, `public`) — НЕ тащить `node_modules`/`tests`/`.cursor`.
- `sideEffects` для scss.

### B2. github-extends готовность (mode C)
- Сгенерированный SCSS (`material-kit-themes.scss`, `material-kit-config.scss`) — закоммитить ИЛИ обеспечить `prepare`/postinstall-генерацию при extends. Проверить, что giget-резолв `github:igorproc/m3-ui-kit-nuxt` поднимает layer.

### B3. docs/ как чистый потребитель
- Убрать относительный `../kit/shared/...` импорт `defineMaterialKit` (`docs/nuxt.config.ts:1`) → через subpath `@primetime/ui-kit/defineKit`.
- Проверить все 3 режима из docs (или временного чистого консьюмера): file-install, github, копирование.

### B4. README — 3 рецепта установки + быстрый старт.

**Gate B:** чистый консьюмер поднимается во всех 3 режимах, компоненты и темы работают.

---

## Phase C — Accessibility (Tier 1 → Tier 2)

### C1. a11y-примитивы (порт из `0`)
`useRovingFocus`, `createFocusTraversal`, SSR-safe `useId` (где ещё не используется).

### C2. Tier 1 (keyboard-inoperable / invisible to AT — блокеры MD3)
- **Dropdown** → combobox/listbox: focusable trigger (`role=combobox`, `aria-expanded/haspopup/controls`), keydown, `role=listbox`/`option`/`aria-selected`, focusable chip-remove (`dropdown/trigger/index.vue`, `selected-chips`).
- **Menu** → `role=menuitem` детям, полный keydown (arrows/Enter/Esc/Home/End), focus-in on open / return on close; убрать focusable hidden backdrop (`menu/index.vue:29-35`).
- **Table sort** → внутренний `<button>` + `aria-sort` + `scope="col"` (`table/header/index.vue:19`).
- **Interactive list-item** → role/tabindex/keydown (`list/item/index.vue`).
- **Date grids** → `role=grid/row/gridcell` + `aria-selected` + roving (`date-picker/*`, `dialog/date`).
- **Time dial** → role/keyboard (или подтвердить keyboard-entry sibling достаточным).

### C3. Tier 2
- Dialog/drawer: `role=dialog`/`aria-modal`/`aria-labelledby` в vue-final-modal.
- Глобальный `:focus-visible`-ring на всё button-семейство (сейчас `outline:none` без восстановления).
- `aria-label` на icon-only (icon-button, fab, pagination prev/next).
- `aria-current="page"` + roving на nav-bar/nav-rail; `<nav aria-label>`.
- tooltip `aria-describedby`+Esc; expansion-panel `aria-controls`+`role=region`.

### C4. SEO/SSR (мелочи, нарушений нет)
- `composables/modal/useModal.ts:54` `Math.random()` id → `useId()`.

**Gate C:** axe/ручной keyboard-прогон ключевых виджетов чисто; a11y-тесты (Phase D) зелёные.

---

## Phase D — Tests (full coverage)

### D1. Harness
- `mountComponent()` helper, happy-dom env, a11y-assert утилиты; colocated `*.test.ts` (+ `*.ssr.test.ts` где важно). Шаблон из `0`.

### D2. Покрытие по семействам
- Actions: button(+icon/fab/extended-fab/segmented/split), fab-menu.
- Inputs/Selection: text-field, search, checkbox, radio(+group), switch, slider(+range), dropdown, chip, date-picker, time-picker.
- Containment: card, sheet, dialog(+date), divider, list(+item), table(+header/pagination), expansion-panel(s), tooltip, badge, snackbar.
- Navigation: app-bar, navigation-bar/rail/drawer, tabs(+tab/panel), menu, toolbar, system-bar.
- Feedback: progress, loading.
- Layout: container/row/col/grid/spacer/responsive/shape (smoke).
- Каждый: рендер + props-контракт + ключевые a11y-роли/клавиатура + emits/v-model.

**Gate D:** `npm run test` зелёный, разумный порог покрытия публичных компонентов.

---

## Phase E — Docs correctness & unification
> Решение user: docs сейчас НЕ эталонна — привести **все** страницы к единому виду; карту токенов
> генерировать из реальных SCSS-мап (`$tokens` / variables), а НЕ из ручного JSON (закрывает roadmap Фаза 3 п.9).

### E1. P0 (битая витрина — часы)
- `carousel`: убрать/скрыть ссылку до реализации компонента (`DocsSidebar.vue:142`).
- `extended-fab-menu` → slug `extended-fab` или создать JSON (`DocsSidebar.vue:125`).
- Вернуть в сайдбар скрытые готовые: `menu`, `toolbar`, `expansion-panel`, `extended-fab`, `icon`, `loading`.
- Поправить маркетинговый счётчик «33 / Full Spec Coverage» (`docs/app/pages/index.vue:83-90`).

### E2. Единый эталонный формат страницы компонента
- Согласовать единую структуру JSON/шаблон (Overview / Specs / API: props+slots+emits+events / Tokens / use-cases) и привести **ВСЕ** компоненты к нему — устранить разнобой полей и неполноту.
- Доки для пользовательских компонентов без JSON: `form-renderer`, `expansion-panels`, `system-bar`, `slide-group`, `avatar`.

### E3. Token cards из SCSS-мап (не ручной JSON)
- Скрипт/пайплайн: извлекать токены компонента из его `app/assets/stylesheet/components/<name>/_index.scss` (`$tokens`-мапа) + system variables → JSON/данные для доки. Убрать ручной рассинхрон дока↔код.

### E4. Синхронизировать API-доки с новыми унифицированными пропсами (после Phase A).

---

## Phase F — Roadmap Фаза 2 (heavy; в релиз сегодня если останется время)
- **Skeletons** на компоненты (roadmap п.4) — минимум table/list/card.
- **MTable виртуализация** `v-scroll` (roadmap п.7).
- Эти два — единственные крупные roadmap-обещания, не закрытые; реалистично — после релизного ядра.

---

## Cleanup / housekeeping
- Пустые dirs `avatar` / `slide-group` / `list-subheader` (есть в листинге, нет `.vue`) — создать или удалить.
- `card/index.vue:82` хардкод тени → токен.
- `vite.server.watch.usePolling:true` → env-gated.

## Open decision points (default принят, поправь если нужно)
1. `variant`-перегрузка у chip/progress/divider → переименование в `type`/`inset` (A0). Default: переименовать.
2. FAB `color: surface` → маппинг в `variant`/tonal (A2). Default: surface уходит в variant.
3. `size` базово `sm|md|lg` (A0). Default: да.
4. Phase F (skeletons + виртуализация) — в релиз сегодня или сразу после. Default: после ядра.
