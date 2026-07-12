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

## Фазы

### 1. Runtime, shell и utility

Создаём M3 root/surface/overlay boundaries: `MApp`, `MSurface`,
`MOverlay`. Утилитарные роли Vuetify становятся PrimeTime composables или
directive: global hotkey registry с визуальным `MHotkey`, hover, smart lazy activation и selection registry.
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
