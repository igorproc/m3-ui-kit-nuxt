# Vuetify-run: индекс развития компонентов

Этот каталог — план закрытия дельты между Vuetify и PrimeTime UI. Он не
означает API-совместимость: каждый результат остаётся M3-like и
PrimeTime-first. Полная классификация существующих и отсутствующих ролей — в
[coverage-matrix.md](coverage-matrix.md); обязательные правила — в
[common.md](common.md); готовые блоки для композиции — в
[reuse-map.md](reuse-map.md).

## Как читать каталог

- [roadmap.md](roadmap.md) содержит ссылки только на новые возможности.
- Корневой `<component>.md` — подробная спецификация одной новой public/sub
  возможности, composable или directive.
- `components-should-update/` предназначен для идей развития уже имеющихся
  семейств и не влияет на порядок создания новых компонентов.
- `<reuse>` в каждом плане обязателен: новый код начинается с композиции
  существующего kit, а не с копирования Vuetify.

## Состояние реализации

Актуально на **2026-07-18**. Product/discussion approval и implementation
state разделены: источником состояния служит `<implementation-status>` внутри
каждого plan. Шкала описана в [common.md](common.md).

| State | Количество | Планы |
|---|---:|---|
| `done` | 42 | Все планы фаз 1–5 |
| `partial` | 0 | — |
| `planned` | 0 | — |

Все фазы roadmap закрыты. Осталось обязательное финальное реформатирование
планов (см. ниже) перед завершением инициативы.

Фаза 2 закрыта: form/picker inputs реализованы, review gate `MColorInput`
подтверждён human direction от 2026-07-14, focused suite проходит.

Фаза 3 закрыта (2026-07-16): `MAlert`, `MAvatar`, `MBanner`(+`BannerActions`),
`MBreadcrumbs`(+`Item`/`Divider`), `MChipGroup`, `MListSubheader` реализованы,
для каждого создана docs_v2 страница. Severity → semantic role mapping alert'а
(`info → secondary`, `success → tertiary`, `warning → primary`) подтверждён
human direction от 2026-07-16 по фактической палитре (tertiary — зелёный,
primary — янтарный).

Фаза 4 закрыта (2026-07-18): `useVirtualScroll` (headless composable, без
docs-страницы — composables получат отдельную HeadlessUI-подобную секцию
позже) и `MPagination` (минимальная docs: hero + playground).

Фаза 5 закрыта (2026-07-18): `MTimeline`(+`MTimelineItem`, `TimelineDivider`),
минимальная docs. Docs-валидатор ослаблен по human direction: секции
компонентной страницы теперь — упорядоченное подмножество канонических пяти,
что разрешает минимальные страницы (hero + reference-only).

## Фазы

### 1. Runtime, shell и utility

Создаём M3 root/surface/overlay boundaries: `MApp`, `MSurface`,
`MOverlay`. Утилитарные роли Vuetify становятся PrimeTime composables или
directive: global hotkey registry с визуальным `MHotkey`, smart lazy activation
и selection registry. Hover/focus API остаётся в pending и не входит в текущую
итерацию.
Validation API временно вынесен в `feature/pendind-components/validation.md`. Результат: единые SSR, overlay и interaction primitives,
на которых строятся следующие фазы.

### 2. Form и picker inputs

Закрываем данные, которые нельзя получить простым расширением `MTextField`:
Autocomplete/Combobox, textarea, number, color, file/upload, OTP, rating,
transactional edit и month-grid date picker. Каждый input сначала использует
существующие field, validation, menu, selection и date primitives.

### 3. Content и collections

Добавляем M3 content blocks: alert, avatar, banner, breadcrumbs, chip group,
empty state, responsive image, hierarchical list и slide group. Product-wide
skeleton work вынесен в отдельную фазу
[`feature/phases/skeletons`](../phases/skeletons/index.md), потому что требует
recipes и token/layout parity для всей библиотеки, а не одного компонента.
Цель — reusable composition и a11y, а не новые ad-hoc layouts для docs.

### 4. Navigation, data и views

Создаём calendar, carousel, data iterator, headless virtual scrolling,
pagination. Stepper и generic `MWindow` вынесены в pending до отдельной
foundation/composite integration phase. Это
самая dependency-heavy фаза: здесь используются overlay, selection, drag,
timer, RAF и date foundations из первых фаз.

### 5. Hierarchy и visualization

Завершаем timeline; treeview перенесён в pending. Lightweight visual-data
семья вынесена в отдельный
[`paid-charts-plab`](../paid-charts-plab/index.md), где bar/line/area API,
shared geometry, accessibility и commercial packaging рассматриваются вместе.

## Definition of done каталога

- Каждый план соответствует XML-шаблону `common.md`, включая `<reuse>`.
- Для каждого visual компонента описана co-located `$tokens` SCSS map и M3
  states; literal style values не допускаются.
- Новая роль не дублирует существующий component/composable/context.
- В phase order не появляется зависимость на ещё не созданную основу.
- Все ссылки из `roadmap.md` и этого индекса существуют.

## Обязательное финальное реформатирование планов

Статус: **не выполнено; обязательно перед завершением vuetify-run**.

- plain component без children/одномысленных leaves остаётся `<component>.md`;
- family parent переезжает в `<parent>/index.md`;
- children переезжают в `<parent>/<child>.md`;
- пример: `stepper/{index,item,vertical,vertical-item,...}.md`;
- `components-should-update` и `pendind-components` унифицируются внутри `.cursor/plans/feature/`;
- после перемещения обновляются `roadmap.md`, `index.md`, `reuse-map.md`, все relative links и navigation summaries;
- выполняется link/orphan audit всех `.md`.

Автономный режим не может завершить roadmap, пока реформатирование не выполнено или явно не перенесено человеком.
