# containment — фаза 2

## Сделано (пункт → что изменилось → файлы)

1. **list, N3 = вариант 1** → плотность управляет и отступами строки. В карте у каждой ступени свои
   `density.<ступень>.padding.block` и `density.<ступень>.supporting.gap`: compact — 6 и 0, default и
   comfortable — 10 и 4 (как было). Правила выводит тот же `@each` по плотностям, что и `min-height`.
   Ключи `padding.top`, `padding.bottom` и `supporting.gap` сняты (их читал только `MListItem`), зазор
   overline остался 4. e2e: compact 44 / 60 / 76, default 56 / 72 / 88, comfortable 64 / 80 / 96 (раньше
   compact-2 был 68, compact-3 — 88).
   Файлы: `src/runtime/assets/stylesheet/components/list/item/_index.scss`,
   `src/runtime/components/ui/list/item/index.vue`, `playground/fixtures/list/matrix.vue` (трёхстрочная
   строка в секции Density), `playground/fixtures/list/list.e2e.ts` (тест «every density draws each line
   count at its own height»).
2. **list-subheader, `:has(> .ui-list-subheader--sticky)`** → соседний селектор от модификатора
   `--sticky`, без `>`: `.ui-list-subheader--sticky ~ .ui-list-item` и
   `.ui-list-subheader--sticky ~ .ui-list__row .ui-list-item`. `scroll-margin` получают только строки
   после липкой подписи (строки выше неё она не перекрывает). Подпись вложенного списка не трогает
   строки внешнего. Файл: `src/runtime/components/ui/list/index.vue`. Покрыто существующим e2e «Tab never
   parks a row under a sticky subheader».
3. **table**
   - Compact-строка с колонкой чекбоксов теперь 40. Чекбокс стоит в обёртке
     `<div class="ui-table__checkbox">` (flex, высота `cell.checkbox.height` =
     `calc(compact-строка − волосок)`), и разделитель больше не прибавляется к строке. В e2e плотности
     проверяется каждая строка: у матрицы плотностей теперь 3 строки, допуска «+ волосок» больше нет.
   - `>` в `table/index.vue:301` убран. Кольцо фокуса области прокрутки рисует пустой элемент
     `ui-table-container__ring` (absolute, `inset: 0`, `border-radius: inherit`, `pointer-events: none`),
     сосед своего вьюпорта: `__viewport:focus-visible ~ __ring`.
   - `>` в `_rows.scss:81` убран. Hover теперь пишется так:
     `.ui-table__row:hover .ui-table__cell:not(.ui-table__row:not(:hover) .ui-table__cell)::before`.
     Вложенная таблица ведёт себя как прежде.
   - `--ui-table-fade` удалён вместе с `@property`. Затухание края теперь сдвигает `mask-position` у слоя
     шириной `100% + 24` по `scroll(self inline)`, это тот же приём, что у `MBreadcrumbs`. В RTL градиент
     зеркальный и стоит `animation-direction: reverse`. Ключи карты — `fade.mask.width` и
     `fade.mask.shift`. Без переменной обойтись получилось, поэтому исключение chip-group на таблицу не
     расширяется.
   - Unit: `.ui-table__checkbox` в каждой ячейке чекбокса; `__ring` стоит сразу за вьюпортом.
   - e2e: в `stress.vue` добавлена вложенная таблица; тест проверяет, что вложенная таблица не светится
     вместе с внешней строкой и не зажигает внешнюю рамку. Ещё один тест проверяет `mask-position` в
     начале и в конце прокрутки в LTR и RTL. Тест кольца читает `__ring`.
   Файлы: `src/runtime/components/ui/table/index.vue`,
   `src/runtime/assets/stylesheet/components/table/{_index,_rows}.scss`,
   `src/runtime/components/ui/table/tests/variants.spec.ts`,
   `playground/fixtures/table/{matrix.vue,stress.vue,table.e2e.ts}`.
4. **S3 = Б** → в `data/table.md` поправлены «Поведение» (пагинация), строка API «подвал», Ш8 (первая и
   последняя страница помечены **отменено**, основание Q47-А) и заметки реализации. Попутно по решениям
   помечены `stickyHeader` (**отменено**, Q-9) в осях и API и DT-11 в Ш2 (**отменено**, S6-Б).
5. **S8 = А** → `MTimelineItem.color` и `UiTimelineDivider.color` теперь `MColor` (раньше
   `MAccentColor`). В карте `dot.color` появились `info`, `success` и `warning` (+ `on-*`), модификаторы
   `__dot--<роль>` строит `@each` по самой карте, а не по списку из четырёх. Ошибки vue-tsc в
   `fixtures/timeline/matrix.vue` ушли, вместе с ними и в WIP-демо `crm/details/CrmDealActivity.vue` и
   `orders/OrderDetailsSheet.vue`. В matrix добавлена рамка «Every colour role» (7 ролей, у
   `info/success/warning` есть `icon` и `status`), e2e сверяет фон точки с `--md-sys-color-<роль>`, unit
   перебирает 7 ролей. Файлы: `src/runtime/components/ui/timeline/props.ts`,
   `src/runtime/components/fragments/timeline/divider/index.vue`,
   `src/runtime/assets/stylesheet/components/timeline/_index.scss`,
   `src/runtime/components/ui/timeline/tests/variants.spec.ts`,
   `playground/fixtures/timeline/{matrix.vue,timeline.e2e.ts}`.
6. **Журнал** → `.cursor/handoff/plans-audit-2/decisions-containment.md`. Там отказ от `stickyHeader`
   (Q-9), API статуса timeline строкой, исключение «обёртка слота» для `:where(img, video)` и
   `:where(h1…h6, p)` и все решения этой фазы.
7. **`<implementation-status>`** (`updated="2026-10-30"`, у всех `done`): `containment/list.md`,
   `containment/list-subheader.md`, `containment/expansion-panel.md`, `data/avatar.md`, `data/table.md`
   (остался DT-10: в шаги плана он не входит, отложен), `data/timeline/item.md`,
   `data/timeline/divider.md`. Планы `card`, `divider` и `timeline/index` не менялись, их теги верны.

## Решения (ID → вариант → основание) — те же строки, что в журнале

- **N3** → вариант 1: padding по блоку 6 и supporting 0 у compact. Основание — рекомендация аудитора
  (§5.2) и обещанные картой 60 / 76.
- **LS-1** → соседний селектор `~` от `--sticky` вместо `:has(> …)`. Основание — правило «без `>`»,
  §5.2 «чинить в коде».
- **T-6** → обёртка чекбокса высотой «compact − волосок». Основание — план Ш6.
- **T-7** → элемент `__ring` и `~`. Основание — правило «без `>`».
- **T-8** → `:not(.ui-table__row:not(:hover) .ui-table__cell)`. Основание — правило «без `>`»,
  поведение то же.
- **T-9** → `--ui-table-fade` снят, затухание сделано через `mask-position`. Основание — правило
  CSS-переменных и прецедент breadcrumbs.
- **S3** → Б. Основание — Q47-А.
- **S6** → Б, DT-11 у таблицы не делается. Основание — рекомендация S6.
- **S8** → А. Основание — W52-А.
- **Q-9** → отказ от `stickyHeader`, в «Удалено» с условием возврата.
- **TL-1** → `status` остаётся строкой, строку `decisions.md` нужно обновить.
- **BEM-1** → исключение «обёртка слота». Основание — правило владельца.
- **RS-1** → `1px` в forced-colors не нарушение (`agent-brief.md` §4).

## Ломающие изменения и миграция

- **`MListItem` compact с подстрокой стал ниже.** Двухстрочная строка 68 → 60, трёхстрочная 88 → 76;
  padding по блоку 10 → 6, зазор supporting 4 → 0. Задевает compact-строки с `supportingText` или
  `overline`, в том числе опции `MDropdown` / `MAutocomplete` в compact с подстрокой. Однострочные
  строки и default / comfortable не изменились. Миграции нет, это вид по решению N3.
- **Ключи карты строки.** `padding.top`, `padding.bottom` и `supporting.gap` удалены, на их месте
  `density.<ступень>.padding.block` и `density.<ступень>.supporting.gap`. Внутри кита их никто, кроме
  строки, не читал.
- **`MTable`, DOM.**
  - Чекбокс строки теперь лежит в `div.ui-table__checkbox` внутри `td.ui-table__cell--checkbox`.
    Потребительский CSS вида `.ui-table__cell--checkbox > .ui-checkbox` нужно переписать на
    `.ui-table__checkbox .ui-checkbox`.
  - Сразу за вьюпортом появился `div.ui-table-container__ring`.
  - Кольцо фокуса области прокрутки теперь рисует `outline` на `__ring`, а не на
    `.ui-table-container`. Кольцо стоит внутри рамки, на волосок глубже прежнего.
- **`MTable`, затухание края.** Пользовательское свойство `--ui-table-fade` удалено. Keyframes
  `ui-table-fade` теперь анимируют `mask-position`. В середине прокрутки затухание уезжает за край,
  а не сужается.
- **`MTimelineItem`.** `color` расширен до `MColor`, это не ломает.

## Не сделано и почему

- DT-10 у `MTable` (устаревшие данные): в мой список не входит, в шаги плана тоже; отложен в заметках
  плана.

## Вопросы (развилки без рекомендации)

Нет.

## Правки вне моих файлов, которые нужны

- `docs/system/{ru-RU,en-US}/decisions.md` — свести журнал `decisions-containment.md`:
  - в «Удалено / отвергнуто» добавить `stickyHeader` (Q-9);
  - обновить строку «Тоны статуса у `MTimelineItem`» (`:27`): `color` теперь берёт все роли, а
    `{ tone, label }` отвергнут по-прежнему (TL-1);
  - строка `:154` («все остальные компоненты сужают `MColor` до `MAccentColor`») больше не верна —
    timeline берёт все роли (S8);
  - в строку исключений `:119` добавить «обёртку слота» (`:where(img, video)` у card и list,
    `:where(h1…h6, p)` у subheader) (BEM-1);
  - решения N3, T-6…T-9, S3, S6 — по журналу;
  - устаревшая запись `:191`: «пункт timeline всё ещё задаёт `anywhere`», а в коде уже `break-word`
    (находка аудита, не моя правка).

## Проверки (команда → результат; что упало и почему)

- `npx vitest run src/runtime/components/ui/{list,table,timeline} src/runtime/composables/{table,list} src/runtime/utils/table --coverage.enabled=false`
  → 19 файлов, 325 тестов, все прошли.
- `npx eslint` (list, table, timeline, fragments table/timeline, фикстуры list/table/timeline) → 0 ошибок.
- `npx stylelint` (мои .vue и .scss, фикстуры) → 0 ошибок.
- `npm run lint:scss` → мои файлы компилируются. Упали 7 таблиц стилей в чужих файлах
  (`menu/group`, dropdown/autocomplete/search через `menu.$tokens` `surface.border.radius`) — их правят
  параллельно.
- `npx playwright test playground/fixtures/{list,table,timeline} --output test-results/p2/containment`
  → 84 теста.
  - Первый прогон: 78 прошли, 6 упали. 4 из них — `<vite-error-overlay>` перехватывал указатель, его
    вызвали чужие SCSS-ошибки и HMR. Ещё 1 — переходное значение слоя hover, 1 — сброс выбора при
    перезагрузке страницы.
  - Повтор упавших: прошли 4, ещё 2 упали на том же оверлее и перезагрузке.
  - Второй повтор двух оставшихся: оба прошли.
  - Отдельная проба (скрипт в scratchpad): выбор переживает смену страницы — «…, Desk lamp» после «Next
    page».
  - Новые тесты затухания (LTR и RTL), вложенной таблицы и плотности прошли отдельным прогоном: 5 из 5.
- `npx vue-tsc --noEmit` → 2 ошибки, обе чужие (`fixtures/chip-group/matrix.vue`,
  `ui/selection-group/index.vue`). Ошибок в timeline, в matrix и в демо timeline больше нет.

## Не проверено

- Затухание края в браузерах кроме Chromium (Firefox без scroll timeline не затухает — так и задумано).
  Safari 26 не запускался.
- Вид compact-опций `MDropdown` / `MAutocomplete` с подстрокой глазами не смотрел; e2e этих компонентов
  от высоты строки не зависят и не запускались.
- Кольцо `__ring` в forced colors глазами не проверено. Цвет `outline` система подставляет та же, что
  прежде.
