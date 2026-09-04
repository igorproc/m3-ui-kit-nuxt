# Slider escape hatch: `useSliderControl` + demo page

**Дата:** 2026-09-02
**Репозитории:** `kit` (новый публичный API + рефактор), `docs_v2` (лаб-страница)

## Зачем

Маркетинговый тезис «сотри тег компонента, оставь `v-bind` + хук — поведение цело» не был
подкреплён кодом: `useSlider` (`createSlider.ts`) — чистая математика значений, а весь
pointer/keyboard/ARIA жил внутри `<MSlider>` и фрагмента thumb. Демку нельзя было построить
честно.

## Что сделано в `kit`

### Новый слой `composables/slider/useSliderControl.ts`

Behavior-композабл между математикой и компонентом. Отдаёт готовые к `v-bind` наборы:

- `rootAttrs` — `data-orientation` / `data-state` / `data-disabled` / `data-readonly`
- `trackAttrs` — callback-`ref`, `onPointerdown` (click-to-jump), `touch-action`
- `rangeAttrs` — геометрия активного отрезка + `--m-slider-range-*`
- `getThumbAttrs(index)` — `role="slider"`, `tabindex`, весь `aria-*`, позиция
  (`left`/`bottom` + `--m-slider-percent` / `--m-slider-progress` / `--m-slider-value`),
  `onKeydown`, `onPointerdown`

Внутрь переехали из `<MSlider>`: drag через `useDrag`, кэш `DOMRect` с обновлением по
scroll/resize, rAF-троттлинг, offset от центра ручки, вертикальная геометрия, клавиатура
(Arrow/Page/Home/End, Shift ×10).

Публичный контракт объявлен явно (`UseSliderControlReturn`) — без этого `mkdist` падал на
TS7056 при сериализации выведенного типа.

### Рефактор `<MSlider>` и фрагмента thumb

`components/ui/slider/index.vue` потерял ~120 строк DOM-логики и теперь консьюмит те же
бэги, что и любой сторонний маркап — один кодовый путь, демка не может «врать».
`fragments/slider/thumb` стал презентационным: role/aria/handlers приходят fallthrough-атрибутами,
позиционирование переехало с `left: calc(N% - 24rem)` на `left: N%` + `transform: translate(-50%, -50%)`
(вертикаль — `translate(-50%, 50%)`).

### Починен чужой баг

`createSlider.ts` → `getNearestThumbIndex`: `Math.abs(values[idx] || 0 - value)` читалось как
`values[idx] || (0 - value)`, поэтому клик по треку в `range`-режиме всегда двигал ручку с
наименьшим значением. Исправлено на `Math.abs((values[idx] ?? 0) - value)`. Согласовано отдельно.

## Что сделано в `docs_v2`

Страница `/lab/escape-hatch` — степпер из трёх уровней с общим `value` и режимом autoplay
(3 × 3300 мс ≈ 10 с), который глушится при первом же взаимодействии:

1. `<m-slider>` — готовый компонент
2. свой маркап на `v-bind` трёх бэгов
3. эквалайзер из 32 полос с кареткой — визуально не слайдер, поведение то же

Панель телеметрии читает живой ARIA-контракт с сфокусированного элемента и лог событий
(`pointerdown`, `ArrowRight`, `Home`, `+ Shift`) — это и есть доказательство для гифки.

## Проверки

- `kit`: 713 тестов зелёные, из них 25 по слайдеру (9 старых на `<MSlider>` — регрессионная сетка,
  16 новых на `useSliderControl`, включая SSR-тест: `role`/`tabindex`/`aria-*`/`left:25%` есть в
  серверном HTML, `ref=` в разметку не попадает)
- `kit`: eslint 0 ошибок, stylelint 0 ошибок, `npm run build` проходит
- `docs_v2`: eslint 0 ошибок, `npm run build` проходит; stylelint показывает 2 ошибки в чужом
  `app/pages/lab/shape.vue` (не трогал)

## Осталось / риски

- Живьём в браузере страница не проверялась — dev-сервер по договорённости запускает человек.
- Самое хрупкое место рефактора — drag в вертикальной ориентации: юнит-тесты покрывают
  геометрию частично (rect в happy-dom приходится стабить).
- `createRangeKeyboardController` (используется в `<MRating>`) остаётся вторым, независимым
  клавиатурным контроллером — дублирование не трогали сознательно.
