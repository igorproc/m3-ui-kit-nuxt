# Дайджест — июнь 2026

Период: 2026-06-02 … 2026-06-25. Свёрнуто из 17 отчётов сессий.
Главные вехи месяца: кластер **Dropdown/Menu** (teleport, FSM, мультивыбор),
слой **headless-примитивов** (Phase 0 + Phase 1), полностью переписанный
**auto-layout v2** (carving-движок, фазы A–F) и два **релизных аудита** (бизнес + DX).

## Оглавление
1. [Аудит правил/доков/ассетов (06-02)](#1-аудит)
2. [Кластер Dropdown / Menu (06-02)](#2-кластер-dropdown-menu)
3. [Dropdown multiselect + Menu FSM/teleport-host (06-04)](#3-multiselect-и-fsm)
4. [Headless-примитивы: Phase 0 + Phase 1 (06-04)](#4-headless-примитивы)
5. [Auto-Layout v2: carving-движок, фазы A–F + SSR-фикс (06-10)](#5-auto-layout-v2)
6. [Релизные аудиты: бизнес и DX (06-25)](#6-релизные-аудиты)

---

## 1. Аудит
Проверка соответствия воркспейса `.cursorrules` (memory-leak контроль, SSR-ограничения
`onMounted`, авторизация Pinia), протоколов Zero-Runtime M3 (`m3_architecture.md`
«Declare & Pick», `migration_workflow.md`), layout-архитектуры доки и токен-мапингов
(`token_mapping.md`, `m3_token_migration.md`), SCSS-утилит (`g()`, `m3-button-scheme()`)
и `shapes.ts`. Всё сведено в центральную документацию.

## 2. Кластер Dropdown / Menu
Серия рефакторингов одного дня (06-02):
- **SCSS в токен-мапы**: `dropdown` и `dropdown/item` переведены на вложенную
  `$tokens`-мапу (`components/dropdown/_index.scss`); item вынесен в свой модуль
  (`dropdown/item/_index.scss`); удалён `:deep(.m-list-item__leading)` (уважение границ
  `m-list-item`); фикс невидимой типографики item'ов. Витрина: Filled/Outlined/Disabled/
  Custom-slot варианты.
- **Извлечение типов**: `DropdownOption`/`DropdownItem` → `dropdown/types.ts`; `UiMenuOrigin`
  → `menu/types.ts`; дефолты опциональных строк `undefined` → `''`.
- **Menu → teleport**: рендер через `<teleport to=body>` с позиционированием по
  `getBoundingClientRect()` — уход от клиппинга родительским `overflow:hidden`; `matchWidth`.
- **Native CSS Anchor Positioning** для menu (Chrome/Edge 125+, Safari 18+) с JS-fallback:
  `anchor-name`/`position-anchor`/`position-area`, `anchor-size(width)` для match-width.
- **Упрощение overlay**: удалён рекурсивный `closeCascade` из `useModal`; компоненты
  (`sheet`/`dialog`/`dialog/date`) на явном низкоуровневом `close`.

## 3. Multiselect и FSM
- **Dropdown multi-select (`multiple`) + чипсы (06-04)**: массив значений, меню не
  закрывается на клик, выбранные — чипсы через слоты `#selected`/`#chip` (дефолт
  `m-chip variant=input`); нормализация `value ?? id ?? raw`; `fieldFocused` для всплытия
  label. **Ключевой фикс**: «открывался только один дропдаун» — teleport hydration mismatch
  при SSR; решение — `<client-only>` вокруг `<teleport>`.
- **Menu FSM-рефакторинг (06-04)**: чистый DOM-free FSM-композабл `composables/menu/useMenu.ts`
  (`status: closed|opening|open|closing`, позиционная математика, детект anchor);
  компонент — только DOM. Attach-host `<div id="ui-overlay-host">` первым узлом в `app.vue`
  (вне `client-only`, монтируется раньше меню). Разобраны грабли: почему НЕ `<teleport defer>`
  (краш `emitsOptions`), `v-if` на `modelValue` (иначе застревает в `closing`), `onClickOutside`
  принимает ref, `inheritAttrs:false` при двух корнях. Потребители (`dropdown`, `button/split`)
  переведены на `@click-outside`.

## 4. Headless-примитивы
Слой headless-логики под будущие рефакторинги компонентов (порт из upstream-проекта `0`).
- **Phase 0 — фундамент (`plan.md` фаза 0)**: `shared/utils/{guards,toArray,createContext}`,
  `shared/constants/globals` (`IN_BROWSER`), композаблы `useEventListener`,
  `useStack` (z-index реестр оверлеев, module singleton), `useGlobalListener` (один DOM-листенер
  на `target+event`, fan-out), `useClickOutside`; правила в `.cursor/rules/headless_architecture.md`.
  `useModal`/`useLayout` переведены на `createContext` с nullable-дефолтами (сигнатуры
  сохранены). **Guardrail: `createContext` никогда для темы.**
- **Phase 1.1–1.2 — registry/selection chain**: полный порт v0-цепочки (вариант B):
  `createRegistry` (ticket-реестр, event bus) → `createModel` → `createSelection`
  (`useSelection`) / `createSingle` (`useSingle`) / `createGroup` (`useGroup`); неймспейсы
  `v0:*`→`m3:*`; `useLogger` → dev-console shim; `useId` из нативного Vue (убран shadowing-враппер).
- **Phase 1.3 — `usePopover`**: обобщение FSM из `useMenu` (не дублирование): `placement`,
  native CSS anchor + JS-fallback (flip/clamp для tooltip), opt-in DOM ownership.
  `useMenu` стал тонким враппером, `menuStyle` сохранён байт-в-байт.
- **Phase 1.4–1.8 (параллельно 2 суб-агентами)**: `useDrag` (Pointer Events),
  `useRaf`+`useTimer`, `useField` (консолидация vee-validate), `useFormBuilder` (убраны все
  `any`), `useFormSchema` + `<MFormRenderer>`. Оговорки на Phase 2: textarea/search →
  fallback `MTextField`, switch не зовёт `useField`.

## 5. Auto-Layout v2
Полный переписанный движок раскладки (carving), 6 фаз за 10 июня + SSR-фикс. План:
`.cursor/plans/auto-layout.md`.
- **Фаза A — движок carving** (`composables/layout/carve.ts`, чистый): DOM-order carving
  (Vuetify corner semantics), имена грид-областей = id элементов, инсеты, `buildLayoutCss`;
  реестр (`registry.ts`) с фиксом reactivity-ping-pong через `toRaw`; переписан `useLayout.ts`
  (`kind` top/bottom/start/end/main канонический, `area` deprecated; брейкпоинты из runtimeConfig).
- **Фаза B — `useLayoutZone()`** (`m3:layout-zone`): публичный контекст для потомков
  `<m-layout>` (`insets`, `windowY` mode-agnostic, `scrollLock` ref-counted, `sticky`).
  App-bar авто-элевация на скролле.
- **Фаза C — зоны, sticky, самодостаточность**: важная коррекция — `position:sticky` НЕ
  пинит top/bottom зоны в document-scroll; решение (Vuetify-style) — `position:fixed` +
  резерв строки через size-var (нулевой CLS), `contain: layout style` → `contain: style`.
  Логические `inset-block/inline`. Мульти-инстанс зоны; самодостаточные `m-app-bar`/rail/bar;
  новые `m-system-bar`, `m-spacer`.
- **Фаза D — колоночная система** (SCSS-first, zero-runtime): `m-container`/`m-row`/`m-col`/
  `m-responsive`; px-брейкпоинты, mobile-first каскад, M3-дефолты (4/8/12 колонок);
  относительные спаны с clamp, offsets через `grid-column-start`, subgrid `m-row`.
- **Фаза E — 9 wireframes** (`app/pages/demo/wf/*`, 9 параллельных агентов): AGENT_BRIEF v2,
  маппинг `v-container/v-row/v-col → m-*`, компромиссы агентов задокументированы.
- **Фаза F — доки и зачистка**: фикс gap у `m-row` (явный `gap`), чистка мёртвого кода
  (`youtube.vue`, `DocsSidebar`), консолидация `resolveBreakpoints`, переписан `kit/docs/layout.md`;
  deprecated-шимы оставлены до major.
- **SSR/no-JS sticky-фикс**: позиционирование переехало из inline-стилей в generated-CSS
  (`#<layoutId> > [data-m3-zone=<id>]{…}`), реестр отдаёт live-геттеры — работает без JS и на
  SSR; бонус — скрытые зоны получают `display:none` в bounded-media. vitest 53/53.

## 6. Релизные аудиты
Два взгляда на готовность к релизной Альфе M3 (read-only).
- **Бизнес/продукт**: библиотека почти полна (~33 публичных компонента) и темизация сильна,
  НО доку нельзя показывать заказчику: битые ссылки в сайдбаре (`carousel` — JSON есть,
  компонента нет; `extended-fab-menu` → 404), 6 готовых компонентов скрыты из навигации
  (`menu`, `toolbar`, `expansion-panel`, `icon`, `loading`, `extended-fab`); не сделаны
  skeletons (Фаза 2 п.4) и виртуализация `MTable` (Фаза 2 п.7). P0 — быстрые правки в `docs/`.
- **DX/инженерная зрелость** — блокеры релиза:
  1. **Ноль тестов компонентов** (`tests/` — только layout/grid).
  2. **Дистрибуция полу-собрана**: `package.json` name `"ui"`, нет `version`/`exports`/`files`;
     docs потребляет как `@primetime/ui-kit`.
  3. **Фрагментированный `variant`/`color` API** (перегружен `variant`, два несовместимых
     `color`-энума, `v-model:selected` у chip).
  4. **Overlay/composite виджеты недоступны с клавиатуры / невидимы для AT** (dropdown, menu,
     сортировка таблицы, date-grid, list-item). SSR-дисциплина чистая, SCSS-комплаенс высокий.
     Рекомендован порт инженерных паттернов из `0` (`makeX`-фабрики пропов, `useRovingFocus`,
     colocated-тесты). Полный приоритизированный backlog (P0–P2) внутри исходного отчёта.
