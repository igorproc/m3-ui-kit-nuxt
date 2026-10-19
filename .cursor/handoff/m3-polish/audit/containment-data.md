# Аудит containment-data — 2026-10-18

Группа `w2-containment-data`: MList (+MListItem, MListSubheader), MDivider, MExpansionPanel(s), MCard,
MTable, MTimeline(Item), MAvatar. Порядок — как в брифе группы §8 (список первым: на нём стоят w4).

Источники для всех: код ветки (`src/runtime/**`, пути ниже — от `src/runtime/`), бриф группы,
`docs/system/en-US/{craft,color-and-state,behavior,decisions}.md`, планы `containment/*`, `data/*`, QA JSON,
базовая карта `baseline/containment-data.md` (baseline-001, prod), `baseline/css-sizes.json`, пробы дирижёра
`w2-containment-data-001…009` (артефакты — `test-results/conductor/<id>/`; 004 упал из-за моей пробы, его
заменяет 009).

Что добавлено в P1 (src не тронут):
- пробы `playground/probes/w2-containment-data/{panel-preset,panel-exclusive,list,table,timeline,card,visual}.probe.ts`;
- `fixtures/list/matrix.vue` — «Selection on click» (`list-pick`, `pick-a|b|c`) и «Avatar image in leading»
  (`list-avatar-media`, `avatar-media-<density>`);
- `fixtures/table/matrix.vue` — `state-refreshing-caption`; `fixtures/table/stress.vue` — последняя колонка `wide`
  сортируемая;
- `fixtures/timeline/stress.vue` — `no-title` и `insert-alternate` + кнопка `insert-second`.

`npx eslint` по фикстурам и пробам — exit 0; `npm run typecheck` — 47 ошибок, все в `playground/render/**`.

Сводка: 41 находка (A 9, B 11, C 9, D 12), развилок 12 (Q-1…Q-12), из них 1 межгрупповая (Q-12), стоп-правил нет.
Не подтвердились: TL-2 (вставка в alternate), T-4 (иконка сортировки в RTL), C-1 (ссылка-карточка двигает
что-то при hover/press), выбор строки списка не меняет геометрию (L-1 — только статичный угол по решению).

---

## MList · MListItem · MListSubheader

Источники: план `containment/{list,list-subheader}.md` (done), QA `list.json` (FAIL — IN-08 принято, CT-08, CT-09;
MANUAL — ST-07, IN-04, CT-07, LY-03, TH-02/08…), базовая карта (load-сдвиг `list/stress` t=897 мс — см. «Чужие
файлы», иконки), пробы 009 (состояния строк light/dark/rtl, L-1, L-2, forced colors).

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| LST-A1 | A | `MAvatar` в `#leading` строки теряет свои `density` и `shape`: при `density="compact"`, `default` и `comfortable` и `shape="large"` все три аватара — круг 40rem; картинка аватара растянута до 56rem внутри бокса 40 и обрезана, с радиусом `small` | REQ 009 `l2.json`: avatar 26.66px (=40rem) у всех трёх, radius 666px, `.ui-avatar__image` 37.3px (=56rem) radius 8rem; `list/item/index.vue:247-265` — `.ui-list-item__leading img` (0,1,1) бьёт `.ui-avatar__image` (0,1,0), `.ui-list-item__leading .ui-avatar` (0,2,0) бьёт `--density-*`/`--shape-*` (0,1,0) | строка перестаёт размерять чужой блок: правило `.ui-avatar` удаляется (дефолт MAvatar и так 40/full = M3 `ListTokens` leading avatar); `img`/`video` — через `:where(img, video)`, чтобы `.ui-avatar__image` и класс потребителя побеждали. Без явных пропов аватара вид не меняется | S | нет |
| LST-B1 | B | Выбор строки кликом: геометрия не меняется (y/height строк постоянны, соседи не сдвигаются); угол 4→16 щёлкает мгновенно, фон плавно 150 мс | REQ 009 `l1.json`: rows y 370/418/466 и height 48 во всех кадрах, radius 2.67→10.67px на 47 мс, background 0→0.95 к 147 мс | не чинить: статичная форма выбранной строки — решение S3 (`decisions.md:24`, бриф §6.3). Закрепить e2e «выбор не меняет высоту и не двигает соседей» | S (тест) | нет |
| LST-C1 | C | Слот `trailingSupporting` — единственный camelCase-слот кита (остальные многословные — kebab: `swipe-banner`, `leading-content`, `pagination-info`). Vue не нормализует имена слотов (`renderSlot` берёт `slots[name]` как есть) → `<template #trailing-supporting>` молча ничего не рисует | `list/item/index.vue:57, 61, 64`; `node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:3278` | переименовать в `#trailing-supporting` | S | да → Q-1 |
| LST-C2 | C | `tag` — свободная строка без подсказок в IDE | `list/item/props.ts:38` | тип `MListItemTag = 'div' \| 'li' \| 'button' \| 'a' \| 'label' \| (string & {})` — подсказки без запрета | XS | нет |
| LST-C3 | C | Нет `defineSlots` у `MListItem` и `MListSubheader` — имена слотов не видны в IDE | `list/item/index.vue`, `list/subheader/index.vue` | `defineSlots` (типы в `props.ts`) | XS | нет |
| LST-A2 | A | Числа в `trailing-supporting` («100+», время) без `tabular-nums` — колонка чисел пляшет от строки к строке (QA CT-07) | `list/item/index.vue:304-308` | `font-variant-numeric: tabular-nums` у `__trailing-supporting` (так уже у таблицы и подвала) | XS | нет |
| LST-D1 | D | Три реализации «ссылка / отключённая ссылка» + три `defineAsyncComponent(NuxtLink)`: `useButton` (w1), `useCard`, `useListItemControl`. У карточки и строки поведение одно (`<a>` без `href`, `role="link"`, `aria-disabled`), у кнопки другое (href остаётся, `tabindex=-1`) | `composables/card/useCard.ts:15, 54-58, 67`; `composables/list/useListItemControl.ts:18, 56, 100, 109`; `composables/button/useButton.ts:17, 83-88` | card + list — один внутренний хелпер (корень, атрибуты отключённой ссылки); кнопка — Q-12 | S | нет (card+list); Q-12 (кнопка) |
| LST-D2 | D | Снятый проп `loading` + `useRetiredPropWarning` | `list/item/props.ts:27-31`, `list/item/index.vue:85, 96` | удалить проп, вызов и импорт; спеки | XS | нет (решение 2026-10-18) |
| LST-D3 | D | `>` в `list/index.vue:76` (`:has(> .ui-list-subheader--sticky)`) | — | оставить: без `>` липкая подпись вложенного списка давала бы `scroll-margin` строкам внешнего | — | нет |

Проверено и в порядке (REQ 009): hover/focus/pressed (ripple) кнопки, эмулированной кнопки и ссылки в light/dark/rtl;
кольцо `focus-ring(inset)` на `secondary-container` виден; forced colors — все отключённые строки `GrayText`, выбранные —
кольцо `Highlight` (`forced-colors.json`); подпись `inset` выровнена с headline строк с иконкой 24; разделитель
`inset="center"` в списке.

Минимизация: выходной CSS `list-item` (файл с блоками list-item 89, list 2, avatar 2, list-subheader 1) 5869 Б / 1255 gzip,
`list-subheader` 1356 / 368. Станет ≈ 5.75 К / 1.23 К: уходит правило `.ui-list-item__leading .ui-avatar` (−1 правило,
−2 «avatar»-блока из файла), `img`/`video` переходят в `:where()` (тот же размер). Больше здесь не выжать без нарушения
решений: матрица density × lines (9 правил) — осознанный zero-runtime. `src`: −8 строк (`loading`), −20 (общий хелпер
ссылки с карточкой).

---

## MDivider

Источники: план `containment/divider.md` (done), QA `divider.json` (FAIL нет; MANUAL LY-07, TH-02), REQ 008
(`*-divider-matrix.png` light ltr / dark rtl), список-разделы REQ 009.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| DIV-D1 | D | Снятое `inset: true` (читается как `start`) + свой dev-warning на `watchEffect` | `divider/props.ts:24` (`[Boolean, String]`), `divider/index.vue:27, 36-37` | тип `MDividerInset`, `String`; удалить ветку `true` и предупреждение; спека | XS | нет (решение 2026-10-18) |

Проверено: все четыре inset по обеим осям, light/dark, rtl (логические стороны), в `ul` — `li aria-hidden`, вне — `role="separator"`.
Минимизация: 720 Б / 255 gzip — CSS не меняется; `src` −8 строк.

---

## MExpansionPanel · MExpansionPanels

Источники: план `containment/expansion-panel.md` (done), QA `expansion-panel.json`/`expansion-panels.json` (FAIL — IN-08,
TH-08 приняты; MANUAL — ST-03, LY-03, A11-08…), concept-рендер, базовая карта (load-сдвиг `expansion-panel/stress`
`group-twenty` t=416–482 мс на prod-сборке), REQ 001/003 (E-1), 002 (E-2/E-3, ltr / rtl+dark / reduced), 008 (E-4, тона,
forced colors, запертый заголовок).

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| PNL-B1 | B | **E-1 подтверждён.** Группа с заданным `v-model` рисуется сервером целиком закрытой (`aria-expanded="false"`, регион `inert`) и раскрывается только после гидрации — с анимацией высоты 300 мс и сдвигом всего ниже на 144rem | REQ 001 `e1-server.json`: `exclusive-b`, `multiple-a`, `mandatory-a` — `aria-expanded: false`, регион `inert`; REQ 003 `e1-frames.json`: до `data-fixture-ready` (t=1036) все закрыты, затем регион 0→48px за 1036–1336 мс, следующая группа y 1327→1423px; baseline-001 — тот же сдвиг на prod. Причина: `expansion-panels/index.vue:46-50` применяет модель в setup группы, когда панелей ещё нет; `createSelection.apply` выбирает только зарегистрированные | применять модель синхронно при регистрации панели (обёртка `register` в контексте группы: зарегистрировал → `sel.apply(model)`); тогда SSR и первый кадр клиента уже открыты, перехода нет. `composables/registry` не трогаю | S | нет |
| PNL-B2 | B | **E-2 подтверждён.** Exclusive: открыта `b`, клик по `c` — заголовок `c` уезжает из-под курсора вверх на 72rem за 300 мс (схлопывается `b` над ним). Высота группы постоянна, внешние соседи не двигаются | REQ 002 `ltr-click-c.json`: headerC y 444→396px, regionB 48→0, regionC 0→48, `nextHeading` y 492 во всех кадрах; rtl и reduced — то же (reduced ≈100 мс) | — | — | да → Q-2 |
| PNL-B3 | B | **E-3 подтверждён.** При закрытии нижние углы заголовка становятся 12rem в первый же кадр (t≈47 мс), а тело схлопывается до ≈300 мс; видно только под hover/focus-слоем заголовка | REQ 002 `ltr-close-c.json`: `border-end-start-radius` 0→8px на 47 мс, regionC 48→0 к 315 мс; `expansion-panel/index.vue:250-254` | — | — | да → Q-3 |
| PNL-A1 | A | **E-4 подтверждён.** Свёрнутая панель — ровно цвет страницы: группа в покое читается как строки текста с шевронами; сегменты (зазор 2, углы 12/4) не видны в обеих темах, в forced colors тоже нет края | REQ 008 `light-tones.json`: body `rgb(249,249,249)` = collapsedPanel `rgb(249,249,249)`, expanded `rgb(243,243,243)`; dark: 19 = 19, expanded 27; `light-group-exclusive.png`, `forced-group-exclusive.png`; concept-рендер ставит группу на тонированную секцию | — | — | да → Q-4 |
| PNL-C1 | C | Нет `defineSlots`; у `title`/`description` нет JSDoc; висячий JSDoc над `mExpansionPanelProps` | `expansion-panel/props.ts:11, 17-18`; `expansion-panel/index.vue` | `defineSlots` (`header`, `trailing { expanded }`, `default`), JSDoc, убрать висячий | XS | нет |
| PNL-D1 | D | Контекст группы в автоимпорте потребителя: `provideExpansionPanelGroupContext`, `useExpansionPanelGroupContext` живут в `composables/` (`addImportsDir(composables/**)`); фикстура импортирует `PanelValue` оттуда же | `composables/expansion-panel/useExpansionPanelGroup.ts:166-167`; `fixtures/expansion-panel/matrix.vue` (`import type { PanelValue }`) | перенести в `components/ui/expansion-panels/context.ts` (образец — `ui/list/context.ts`), `PanelValue` — в `expansion-panel/props.ts`; поправить импорты фикстур и `useExpansionPanelControl` | S | нет |
| PNL-D2 | D | `>` в стилях группы | `expansion-panels/index.vue:120` (`> .ui-expansion-panel`) | панель в группе ставит себе модификатор `ui-expansion-panel--grouped` (контекст группы уже есть), правила углов — по нему | XS | нет |
| PNL-D3 | D | Снятый проп `loading` + `useRetiredPropWarning` | `expansion-panel/props.ts:28`, `expansion-panel/index.vue:64, 82` | удалить; спека | XS | нет (решение 2026-10-18) |

Проверено и в порядке: reduced motion укорачивает, а не выключает (REQ 002 reduced: ≈100 мс); фокус + hover на открытой
панели — слой фокуса и кольцо inset (ST-03, `light-focus-hover-exclusive-b.png`); запертый заголовок `mandatory` — без
hover/pressed (`*-mandatory-a-locked-*.png`); forced colors — у раскрытой панели край `CanvasText`; RTL зеркалит шеврон и
текст. Высота анимируется через `grid-template-rows` — нативный кросс-браузерный путь (см. Modern Web Guidance).

Минимизация: 5059 Б / 1118 gzip (expansion-panel 50 + panels 4 правила). Станет ≈ 5.05 К: `>` → модификатор — тот же
размер. Выигрыш в `src`: −10 строк (`loading`), контекст переезжает без роста.

---

## MTable

Источники: план `data/table.md` (done), QA `table.json` (FAIL — A11-06, DT-10, DT-11, CT-08; MANUAL — заметки ST-07/TH-02/
TH-08 устарели), находки дашбордов (`integration-and-dashboards`), базовая карта (load-сдвиг ячеек `main` t=790 мс — см.
«Чужие файлы»), REQ 005 (T-1…T-4, выбранная строка под курсором, подвал на 360).

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| TBL-A1 | A | **T-1 подтверждён.** С `caption` индикатор обновления стоит на строке шапки, поверх подписей колонок | REQ 005 `t1.json`: caption 939–987rem, thead 987–1043, busy 1011–1041 (без caption: thead 987–1043, busy 1059 — в первой строке); `state-refreshing-caption.png`; отступ считается от верха вьюпорта без caption (`table/_index.scss:36, 43, 50`) | индикатор позиционируется от `tbody`, а не от вьюпорта: busy-слой — внутри таблицы под `thead`, либо отступ учитывает caption модификатором `--captioned` (+caption-высота в карте). Выбор реализации — в P2 | S | нет |
| TBL-A2 | A | **T-2 подтверждён.** В RTL шевроны подвала смотрят не туда: «следующая» (слева) — `›`, «предыдущая» (справа) — `‹` | REQ 005 `rtl-footer.png`; `fragments/table/pagination/index.vue:41, 49`; зеркалирования направленных иконок в ките нет нигде (grep `ui/icon`, `ui/pagination`) | локально: класс иконки подвала + `:dir(rtl) { scale: -1 1 }` (`:dir()` таблица уже использует). Класс багов — в «Чужие файлы» | XS | нет |
| TBL-A3 | A | Отключённый (во время `loading`) выбор размера страницы: текст гаснет до 38%, стрелка-иконка остаётся полной | `fragments/table/pagination/index.vue:164-167` (только `select:disabled`), `:174-180` (иконка без disabled-ветки) | `.ui-table__page-size-select:disabled + .ui-table__page-size-icon` — тот же цвет 38% | XS | нет |
| TBL-B1 | B | **T-3 подтверждён частично.** Кольцо фокуса вьюпорта (`focus-ring(inset)`) гаснет под маской края на inline-end, пока таблица не докручена. Кольца кнопок сортировки последней колонки — нет: фокус докручивает вьюпорт (`scroll-padding-inline-end`), маска уходит в 0 | REQ 005 `1280-ltr-viewport-focus.png` (правой стороны кольца нет), `1280-ltr-last-sort-focus.png` (кольцо целое), `t3-*.json`; `table/index.vue:268-283` | кольцо вьюпорта рисовать на контейнере (`.ui-table-container:has(> …viewport:focus-visible)` или модификатор), который маске не подчиняется | S | нет |
| TBL-B2 | B | Hover-слой на каждой строке, даже когда строки ничего не делают (нет `selectable`, нет `row-click`) — ложная подсказка, как была у статичной карточки (ST-01) | `table/_rows.scss:77-81` | — | — | да → Q-6 |
| TBL-B3 | B | `statusText` глушит объявление ошибки: при заданном `statusText` строка `error` никогда не попадает в живой регион | `table/index.vue:195` | — | — | да → Q-7 |
| TBL-B4 | B | При `aria-labelledby` (вместо `aria-label`/caption) область прокрутки получает `role="region"` без имени | `table/index.vue:204` (читается только `aria-label`), `composables/table/useTableControl.ts:197-203` | передавать в вьюпорт и `aria-labelledby` таблицы | XS | нет |
| TBL-C1 | C | `TableData` с индекс-сигнатурой не принимает обычные интерфейсы: потребитель дописывает `[key: string]: unknown` (так в фикстуре и демо) | `ui/table/types.ts:40-43`; `fixtures/table/matrix.vue` (`interface Product { …; [key: string]: unknown }`) | ограничение `T extends { id: string \| number }`; расширение типа, ничего не ломает | S | нет |
| TBL-C2 | C | Нет `defineSlots`: у динамических `#cell-<key>` / `#header-<key>` нет подсказок в IDE | `ui/table/index.vue` | типизированные слоты через шаблонные литеральные ключи по `keyof T` в `types.ts` | S | нет |
| TBL-C3 | C | Публичные типы (`TableColumn`, `SortState`, `MTablePageRange`) доступны только глубоким путём: `exports` пакета — лишь `./types` | `package.json` | — | — | заявка (чужой файл) |
| TBL-C4 | C | Подвал: свои «первая/последняя» или встроить `MPagination` — открыт владельцем | бриф группы §2 | — | — | да → Q-8 |
| TBL-C5 | C | `stickyHeader` нет: вьюпорт — контейнер прокрутки по обеим осям, к странице шапка не прилипнет | `table/index.vue:259-266` | — | — | да → Q-9 |
| TBL-D1 | D | `material-map()` — тождественная функция, 4 вызова | `ui/table/index.vue:235`, `fragments/table/{header:76, message:54, pagination:101}` | убрать вызовы (`$t: t.$tokens`); CSS байт в байт тот же — сверить | XS | нет |
| TBL-D2 | D | `@each` по трём плотностям в четырёх местах | `table/index.vue:297-301`, `_rows.scss` (высота строк), `header/index.vue:175-180`, `message/index.vue:83-87` | один `@each` в `table/index.vue` для всех зависящих от плотности правил | S | нет |

Не подтвердилось: **T-4** — в RTL end-колонка «Amount» стоит у левого края, подпись ровно над цифрами, иконка с внутренней
стороны (`rtl-head-sorted-asc.png`) — `row-reverse` в RTL работает правильно. Выбранная строка под курсором остаётся
выбранной (`*-selected-row-hover.png`). Подвал на 360 помещается (`360-main.png`, `360-narrow-footer.png`).
Остаётся как есть (без развилки): **T-5** — `tabindex/role/aria-label` вьюпорта только после монтирования: переполнение знает
лишь рантайм. A11-06 (mixed у «выбрать всё») ждёт `indeterminate` в `MCheckbox` (вне объёма).

Минимизация: 8619 Б / 1818 gzip (table + table-container + фрагменты). Станет ≈ 8.55 К / 1.80 К: −1 правило (кольцо
вьюпорта переезжает на контейнер, маска остаётся), +1 правило (иконка disabled), `@each` в одном месте — тот же вывод, но
одна копия селектора-префикса. `src` −10…15 строк. Значимого уменьшения нет — CSS таблицы плотный.

---

## MCard

Источники: план `containment/card.md` (done), QA `card.json` (FAIL — IN-08 принято; MANUAL ST-07, TH-02…), REQ 007 (все
варианты light/dark, C-1, рамка на 360).

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| CRD-A1 | A | Рамка `1rem` вместо hairline `max(1px, 1rem)` (решение `decisions.md:84`, card не переведён). Chrome округляет толщину рамки вверх до 1px сам (на 360: 1rem = 0.47px, computed `1px`), Safari/Firefox — нет | `components/card/_index.scss:17`; REQ 007 `outline-360.json` | `outline.width: max(1px, 1rem)` | XS | нет |
| CRD-C1 | C | `#header` снимает имя: при слоте `article` / ссылка теряют `aria-labelledby` (и проп `title` игнорируется) | `ui/card/index.vue:71` (`hasTitle: … && !slots.header`) | — | — | да → Q-5 |
| CRD-C2 | C | Нет `defineSlots`; висячий JSDoc | `ui/card/props.ts:14`; `ui/card/index.vue` | `defineSlots` (`media`, `header`, `default`, `actions`), убрать висячий | XS | нет |
| CRD-D1 | D | Снятые `variant="tonal\|text"`: карта `RETIRED_VARIANTS` + `useRetiredValueWarning` | `ui/card/index.vue:74-78`, `ui/card/useCardWarnings.ts:2, 40` | удалить карту и вызов; класс — `ui-card--${variant}`; спека | XS | нет (решение 2026-10-18) |
| CRD-D2 | D | Арифметика в `.vue`: отрицательные поля медиа | `ui/card/index.vue:142` | ключ `media.margin` в карте (`calc(-1 * padding)`) | XS | нет |
| CRD-D3 | D | Селекторы по тегам `img, video` (0,1,1) бьют класс потребителя | `ui/card/index.vue:152-153` | `:where(img, video)` (как нормализация слота у подписи списка) | XS | нет |
| CRD-D4 | D | Мёртвые декларации: у отключённой карточки `box-shadow` равен покою во всех трёх вариантах (1/0/0), а hover/pressed отключены `pointer-events: none` | `components/card/_states.scss:245-250`, карта `*.disabled.elevation` | убрать `box-shadow` из disabled-ветки и ключи `disabled.elevation` без читателя | XS | нет |
| CRD-D5 | D | `material-map()` | `ui/card/index.vue:103` | убрать вызов | XS | нет |

Проверено (REQ 007): **C-1 не подтвердился** — hover и press ссылки-карточки меняют только тень (elevated 1→2, outlined
0→1) и слой; `transform` нет, сдвигов нет (`c1.json`: issues пусто). Все варианты в light/dark читаются; outlined в фокусе —
рамка `on-surface` + кольцо.

Минимизация: 3982 Б / 988 gzip → ≈ 3.85 К / 0.96 К: −3 декларации `box-shadow` в disabled, `:where()` вместо тегов — тот
же размер. `src` −12 строк.

---

## MTimeline · MTimelineItem

Источники: планы `data/timeline/{index,item,divider}.md` (done), QA `timeline.json` (MANUAL CT-07, LY-03, RS-02, TH-02
устарело), REQ 006 (рейка, пунктир, плотности, TL-1, TL-2, TL-3 на 760/780/1280 ltr/rtl).

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| TML-A1 | A | **TL-1 подтверждён (мелко).** У элемента без заголовка точка центрирована по строке `title-medium`, а первая строка — `body-medium`: точка на 2rem ниже центра текста | REQ 006 `tl1.json`: no-title-text dot 832.5 vs body 830.5; с временем — dot = time 880.5, body 878.5; `timeline/_index.scss:19` | модификатор элемента без заголовка (`hasTitle` уже есть) + второй набор смещений в карте (точка, концы линии, время) от line-height `body-medium` | S | нет |
| TML-B1 | B | **TL-3 (порог alternate) — порог в CSS-пикселях**, а вся раскладка в rem (корень = vw): переключение зависит от масштаба окна. Лента шириной 1132rem на окне 780 схлопнута в одну сторону, хотя места больше, чем у 1000px-ленты на 1280, которая alternate | REQ 006 `tl3-780-ltr.json` (wide 1132rem → две колонки), `tl3-1280-ltr.json` (1500rem → три), `780-ltr-wide-alternate.png`; `timeline/_index.scss:74` (`map.get($breakpoints, 'tablet-xs')` = 768px) | — | — | да → Q-11 |
| TML-C1 | C | `#icon` — точная копия `#dot`: вложен в `#dot` как запасное содержимое, рисуется в тот же узел | `ui/timeline/item/index.vue:29-30` | — | — | да → Q-10 |
| TML-D1 | D | Контекст на голых `provide/inject` в `composables/` → `createTimelineContext`, `provideTimelineContext`, `useTimelineContext`, `TIMELINE_KEY` попадают в автоимпорт потребителя («not a public API» — в комментарии) | `composables/timeline/context.ts:118-133`; фикстуры импортируют типы оттуда | `components/ui/timeline/context.ts` на `createContext('m3:timeline')`, типы осей — в `ui/timeline/props.ts`; поправить импорты фикстур | S | нет |
| TML-D2 | D | `>` в стилях ленты | `ui/timeline/index.vue:41`; `ui/timeline/item/index.vue:222, 229, 240, 244, 251` | плотность, стиль линии и `alternate` — модификаторы элемента из контекста; `:has(> …)` детектора колонки времени оставить (без `>` его ловит вложенная лента) с комментарием «почему» | S | нет |
| TML-D3 | D | `material-map()` ×3 | `ui/timeline/index.vue:27`, `item/index.vue:141`, `fragments/timeline/divider/index.vue:49` | убрать вызовы | XS | нет |

Не подтвердилось: **TL-2** — при вставке в середину alternate ни в одном кадре стороны не были неверными (`tl2.json`: одно
состояние до, одно после, промежуточного нет); элементы ниже сдвигаются на высоту нового — это вставка, не дефект.
Пунктир на стыках элементов на скриншотах не рвётся заметно (`line-dashed.png`, `dark-rtl-line-dashed.png`).

Минимизация: 6501 Б / 1210 gzip → ≈ 6.4 К: `>`-правила, читающие модификаторы ленты, становятся модификаторами элемента —
близко по размеру; TL-1 добавит 3–4 правила. Итог ≈ 0. `src` ±0.

---

## MAvatar

Источники: план `data/avatar.md` (done), QA `avatar.json` (MANUAL IN-05, CT-06, TH-02/03), REQ 008 (матрица light/dark,
forced colors), REQ 009 (аватар в строке — LST-A1).

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| AVT-D1 | D | Снятый `size` (`sm/md/lg`): проп, карта `AVATAR_SIZE_TO_DENSITY`, `useRetiredValueWarning`, вычисление `density` через карту | `ui/avatar/props.ts:23-27, 36`; `ui/avatar/index.vue:42, 44, 59-65` | удалить; `density` — прямо проп; спека | XS | нет (решение 2026-10-18) |
| AVT-D2 | D | `material-map()` | `ui/avatar/index.vue:86` | убрать вызов | XS | нет |

Проверено: все варианты × плотности × содержимое в light/dark, outlined с картинкой (рамка вокруг), битая картинка без
мигания (fallback сразу), forced colors — у tonal/filled рамка `CanvasText` (`forced-avatar.png`). Главный дефект аватара —
в строке списка (LST-A1). Минимизация: 2189 Б / 574 gzip — CSS не меняется; `src` −20 строк.

---

## Развилки (решает оркестратор по рекомендации)

**Q-1 (MListItem): слот числа справа называется `trailingSupporting` в camelCase, а `#trailing-supporting` молча не работает.**
1. Переименовать в `#trailing-supporting`, старое имя удалить сразу (правило 2026-10-18). **(рекомендую)** — одно
   написание во всём ките, нет тихого отказа (`craft.md` §4 «тишина — враг»). Цена: ломает тех, кто уже пишет
   `#trailingSupporting` (в ките и демо — никто).
2. Оставить. Цена: ловушка для каждого, кто пишет слоты как в остальном ките.

**Q-2 (MExpansionPanels, E-2): в группе «одна открытая» заголовок, по которому кликнули, уезжает вверх на высоту закрывающейся
панели над ним.**
1. Оставить: так ведёт себя любой аккордеон (схлопывается то, что выше), соседи вне группы не двигаются. Закрепить e2e,
   что двигается только группа изнутри. **(рекомендую)** — компенсация требует JS-подкрутки страницы по кадрам, а это
   «геометрия, которую JS чинит» (бриф §0.18) и вторая механика поверх CSS-перехода.
2. Компенсировать прокруткой: замерить заголовок до клика и докручивать страницу на дельту каждый кадр. Цена: JS-цикл,
   конфликт с ручной прокруткой, reduced motion.
3. Закрывать прежнюю панель без анимации. Цена: заголовок прыгает мгновенно — хуже, чем плавно.

**Q-3 (MExpansionPanel, E-3): при закрытии нижние углы заголовка скругляются сразу, тело ещё 300 мс схлопывается — заметно
только под hover/focus-слоем.**
1. Оставить — статичная смена формы по состоянию, без перехода радиуса (бриф §6.3, решение 2026-10-07). **(рекомендую)**
2. Отложить смену углов до конца схлопывания (`transition-delay` = длительность раскрытия, без интерполяции радиуса). Цена:
   формально это переход на `border-radius`, который §6.3 запрещает добавлять.

**Q-4 (MExpansionPanels, E-4): свёрнутая панель того же цвета, что страница, — на обычном фоне группа не видна как набор
сегментов (зазор 2 и углы 12/4 неразличимы).**
1. Оставить тон (видение авторского компонента: `surface` → `surface-container-low` + тень при раскрытии; в concept группа
   стоит на тонированной секции), в плане и доке — «ставь группу на контейнер», фикстуры — на `surface-container-low`.
   **(рекомендую)** — авторский компонент развивается в своём видении (решение `authored-components-keep-vision`), в демо
   группа и так живёт в листе.
2. Свёрнутая — `surface-container-low`, раскрытая — `surface-container` + уровень 1. Цена: меняет вид во всех текущих
   местах; на тонированном фоне `surface-container-low` сольётся уже с ним.
3. Свёрнутая — с hairline-рамкой `outline-variant`. Цена: рамка внутри группы — ближе к «форме из Bootstrap» (`craft.md` §1).

**Q-5 (MCard): слот `#header` убирает у карточки имя (`aria-labelledby`), а без слота заголовок можно задать только строкой.**
1. Добавить слот `#title` — содержимое заголовка; элемент с `id`, уровнем и связью остаётся у кита; `#header` по-прежнему
   заменяет шапку целиком. **(рекомендую)** — `craft.md` §2: «где элемент несёт связи доступности, слот заполняет только
   содержимое».
2. Отдавать `titleId` в пропсах `#header` — потребитель сам ставит `id`. Цена: забыл — карточка снова без имени.
3. Оставить + dev-предупреждение при `#header` без `aria-label`. Цена: проблема остаётся, только подсвечена.

**Q-6 (MTable): строки подсвечиваются при наведении, даже когда клик по строке ничего не делает.**
1. Подсвечивать только когда строки интерактивны: `selectable` или есть слушатель `row-click` (слушатель видно через
   объявленный `onRowClick`, без нового пропа). **(рекомендую)** — слой состояния = отклик на взаимодействие
   (`color-and-state.md`), прецедент — статичная карточка без hover (ST-01).
2. Оставить на всех строках как «линейку» для чтения широких таблиц (так в M2 data table). Цена: ложная подсказка
   кликабельности.

**Q-7 (MTable): заданный `statusText` навсегда заглушает объявление ошибки.**
1. Пока `error` — строка, объявляется ошибка; `statusText` возвращается, когда ошибки нет. **(рекомендую)** — ошибка
   срочнее «Страница 2», и она же видна в теле таблицы.
2. Объявлять оба через точку. Цена: длинное объявление при каждом изменении статуса.
3. Оставить, документировать «ошибку клади в `statusText` сам». Цена: тихий провал доступности по умолчанию.

**Q-8 (MTable): подвал — свои «первая/последняя» или встроить `MPagination` (вопрос открыт владельцем).**
1. Сейчас — оставить «пред/след» + починить RTL (TBL-A2); встраивание вернуть, когда `MPagination` получит компактный режим и
   переводимые имена. **(рекомендую)** — `MPagination` вне объёма прогона; снаружи он уже работает (CRM).
2. Свои «первая/последняя»: `ICONS.firstPage/lastPage` + два пропа подписей. Цена: новая ось подписей и дублирование
   `MPagination`.
3. Встроить `MPagination` сейчас. Цена: английские имена страниц и camelCase `aria*` в слоте (находка CRM) — блокер в чужом
   компоненте.

**Q-9 (MTable): липкая шапка.**
1. Не вводить, пока нет заказчика (В4). **(рекомендую)** — без вертикальной прокрутки внутри вьюпорта шапка липнуть некуда,
   а это новая ось высоты.
2. `maxHeight` вьюпорта (runtime-геометрия через custom property, как `maxHeight` панели дропдауна) + `position: sticky` у
   `thead`. Цена: новый проп, внутренний скролл по двум осям.

**Q-10 (MTimelineItem): `#icon` — второй способ сказать `#dot`.**
1. Удалить `#icon`, оставить `#dot`. **(рекомендую)** — `craft.md` §2 «два способа сказать одно»; потребителей слота нет ни в
   ките, ни в демо.
2. Оставить оба. Цена: потребитель не понимает, какой выбрать.

**Q-11 (MTimeline): `alternate` схлопывается в одну сторону по порогу 768 CSS-пикселей, хотя вся лента меряется в rem — на окне
780 лента в 1132rem уже «узкая», на 1280 лента в 1500rem — нет.**
1. Порог в rem (`768rem` — то же «tablet-xs», но в дизайн-пикселях): раскладка ленты зависит только от её ширины в макете.
   **(рекомендую)** — согласуется с vw-корнем (rem = дизайн-пиксель, решение `vw-root-scale-is-a-feature`). Цена: на
   окнах 1200–1919 лента шириной 768–1150rem перестанет схлопываться.
2. Оставить пиксели. Цена: точка переключения «плавает» с шириной окна.

**Q-12 (межгрупповая, MButton w1 ↔ MCard/MListItem w2): у отключённой ссылки в ките два поведения.** Кнопка-ссылка оставляет
`href` и ставит `tabindex=-1` (`useButton.ts:83-88`) — средняя кнопка мыши, контекстное меню «открыть в новой вкладке» и
перетаскивание по-прежнему уводят по адресу; карточка и строка убирают `href` и ставят `role="link"` + `aria-disabled`.
1. Одно поведение для всех — без `href`, `role="link"`, `aria-disabled` (как card/list); общий хелпер, правка `useButton` —
   у w1. **(рекомендую)** — отключённая ссылка не должна никуда вести ни одним способом.
2. Оставить два. Цена: две механики одного поведения (`craft.md` §7), разный результат средней кнопки мыши.

Стоп-правил (§8.5) нет: ни одна находка не требует новой зависимости, системного токена, морфа или пересмотра `decisions.md`.

## Шимы снятых значений (удаляются без развилки, решение 2026-10-18)

| Компонент | Снятое | Где | Потребители в ките/демо |
|---|---|---|---|
| MCard | `variant="tonal"` → `filled`, `"text"` → `outlined` | `ui/card/index.vue:74-78`, `ui/card/useCardWarnings.ts:2, 40` | нет |
| MDivider | `inset: true` → `'start'` (свой warning, не общий композабл) | `ui/divider/props.ts:24`, `ui/divider/index.vue:27, 34-40` | нет |
| MExpansionPanel | проп `loading` | `ui/expansion-panel/props.ts:24-28`, `index.vue:64, 82` | нет |
| MListItem | проп `loading` | `ui/list/item/props.ts:27-31`, `index.vue:85, 96` | нет |
| MAvatar | `size: sm/md/lg` → `density` | `ui/avatar/props.ts:22-27, 32-36`, `index.vue:42, 44, 59-65` | нет |

После удаления импорт `composables/button/useRetiredValueWarning` в группе не остаётся ни у кого.

## Предложения сверх паритета (не шаги)

| Предложение | Выигрыш | Заказчик | Цена S/M/L | Рекомендация |
|---|---|---|---|---|
| Затухание края таблицы с обеих сторон (то же scroll-driven свойство, второе значение от 0 к размеру) | после прокрутки видно, что слева тоже есть колонки | широкие таблицы (orders, CRM) | S | да |
| Закреплённая первая колонка таблицы | имя строки видно при прокрутке вбок | широкие таблицы | S | да, вместе с затуханием |
| Хук атрибутов строки таблицы (`rowAttrs(row)`) | класс/`data-*` строки по данным без обёрток | дашборды (просроченные заказы) | S | при заказчике |
| Скрыть подпись колонки визуально (`column.hideLabel`) | колонка «Действия» без своего sr-only | демо `OrdersTable.vue` | XS | да |
| `#leading` у панели | иконка раздела настроек слева | настройки | S | при заказчике |
| `hidden="until-found"` у свёрнутой панели (поиск по странице находит текст) | Ctrl+F открывает нужную панель | FAQ, документация | M | да, отдельной задачей (из плана) |
| Разделитель с подписью («или», дата) | смысл границы виден | формы входа, лента | S | да (из плана) |
| Цвет инициалов аватара из имени (роль контейнера по хешу) | разные люди различимы без фото | списки пользователей | S | обсудить (из плана) |
| Рейка ленты «показать ещё N» | длинная история не растягивает страницу | заказы, аудит | S | да (из плана) |

## Заявки на чужие файлы

| Файл (владелец) | Что поменять | Зачем |
|---|---|---|
| `package.json` (оркестратор) | `exports`: публичные типы таблицы (`TableColumn`, `SortState`, `MTablePageRange`, `MTableProps`) — либо в `./types`, либо отдельный подпуть | TBL-C3: сейчас только глубокими путями (находка дашбордов) |
| `assets/stylesheet/abstracts/_mixins.scss` (оркестратор; владелец сейчас правит типографику) | **расхождение с брифом группы §6**: `typescale()` (`_mixins.scss:111-116`) не выводит `letter-spacing`, `apply-typography()` (`:118-127`) выводит. Card, панель, таблица (на `typescale`) идут без трекинга M3, список/лента/аватар (на `apply-typography`) — с ним | свести к одному миксину в рамках работы над типографикой; пока не трогаю |
| `components/ui/icon/**` (вне объёма) | иконки грузятся на клиенте: baseline-001 показывает load-сдвиги после гидрации — ячейки шапки таблицы `main` (t=790 мс), leading строк `list/stress` (t=897 мс) | Г: место под иконку не зарезервировано до загрузки SVG; проверить у владельца MIcon |
| Направленные иконки, весь кит (оркестратор) | зеркалирования в RTL нет нигде (`ui/icon`, `ui/button/icon`, `ui/pagination`) — шевроны «пред/след» смотрят не туда (у таблицы чиню локально, TBL-A2) | класс багов: `MPagination`, карусели, хлебные крошки |
| `composables/button/useButton.ts` (w1) | по итогам Q-12 | одно поведение отключённой ссылки |
| Место общего хелпера ссылки (оркестратор) | где жить хелперу «корень-ссылка / отключённая ссылка» для card + list (+ button по Q-12): предлагаю `shared/utils/link.ts` | LST-D1; `utils/` моей группы — по компонентам, общий файл не мой |

## Что не удалось проверить

- Скринридеры (NVDA/VoiceOver) — нет у дирижёра; TS-06 остаётся MANUAL.
- Safari/Firefox: hairline `1rem` (Chrome сам округляет до 1px — `outline-360.json`), `:dir()` и scroll-driven затухание.
- Плавное протаскивание ширины окна через порог ленты (RS-02) — проверены точки 760/780/1280, не непрерывный ресайз.
- EN-10 (профиль 100+ строк списка с `v-ripple` и async NuxtLink) — не мерил.
- Порядок в RTL на скриншоте подвала таблицы «of 7 5–1» — это английский текст фикстуры в RTL, не компонент.

## Modern Web Guidance

Только чтение (P1), правок нет:
- `animate-to-intrinsic-sizes` — `interpolate-size`/`calc-size()` есть только в Chromium («Unsupported in: Firefox and
  Safari»), в остальных — мгновенный прыжок высоты. Решение: высота панели остаётся на `grid-template-rows: 0fr → 1fr`
  (кросс-браузерно), E-1 чинится порядком применения модели, а не сменой механики.
- `soft-edge-content-fade` — маска гасит всё содержимое элемента, включая его outline; отсюда TBL-B1: кольцо надо рисовать
  на элементе вне маски, а не «поднимать» поверх.
- `scrollability-affordance-hints` — scroll-state queries только Chromium; текущее затухание на scroll-driven animation
  под `@supports` лучше по поддержке; двустороннее затухание — предложение.
- `responsive-table`, `state-aware-sticky-headers` — липкой шапке нужен вертикальный контейнер прокрутки
  (`max-block-size` у обёртки) → это и есть цена варианта 2 в Q-9.
- `search-hidden-content` (найден поиском «accordion find in page») — `hidden="until-found"` для свёрнутых панелей;
  оставлено предложением.
