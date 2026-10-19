# Бриф группы «Containment и data» (`w2-containment-data`)

> Читается вместе с `00-common.md`. Состояние на 2026-10-18 (ветка `components/redisign-update`, HEAD c9da731).
> У владельца не закоммичены `src/module.ts`, `base/_typography.scss`, `base/_fonts.scss`, `utils/typography/**`
> (шрифты) — не трогать. Пути — от `src/runtime/`, если не сказано иное. **Ф** — факт (код/план/решение),
> **Г** — гипотеза, подтверждать пробой или осмотром у дирижёра.

---

## 0. Компоненты и файлы

| Компонент | M3? | Файлы (строк) | src | План | QA | Concept | Фикстуры |
|---|---|---|---|---|---|---|---|
| MCard | M3 | `ui/card/{index.vue 196, props.ts 35, useCardWarnings.ts 57}`, `composables/card/useCard.ts 76`, `components/card/{_index 86, _states 103}.scss` | 553 | `containment/card.md` | `card.json` | `renders/card` | `card/*` 575 |
| MDivider | M3 | `ui/divider/{index.vue 81, props.ts 27}`, `components/divider/_index.scss 11` | 119 | `containment/divider.md` | `divider.json` | `renders/divider` | `divider/*` 320 |
| MExpansionPanel(s) | авторский | `ui/expansion-panel/{index.vue 308, props.ts 31, heading.ts 13}`, `ui/expansion-panels/{index.vue 134, props.ts 19}`, `composables/expansion-panel/{useExpansionPanelControl 128, useExpansionPanelGroup 39}`, `components/expansion-panel/_index.scss 88` (ветка `group` там же) | 760 | `containment/expansion-panel.md` | `expansion-panel.json`, `expansion-panels.json` | `renders/expansion-panel` | `expansion-panel/*` 528 |
| MList, MListItem, MListSubheader | M3 Expressive; подпись авторская | `ui/list/{index.vue 80, context.ts 42, types.ts 26}`, `ui/list/item/{index.vue 312, props.ts 61, ListRow.ts 13}`, `ui/list/subheader/{index.vue 88, props.ts 26}`, `composables/list/useListItemControl.ts 122`, `components/list/{_index 25, item/_index 137, item/_states 94, subheader/_index 39}.scss` | 1065 | `containment/{list,list-subheader}.md` | `list.json` | `renders/list` | `list/*` 595 |
| MAvatar | авторский | `ui/avatar/{index.vue 146, props.ts 69}`, `composables/avatar/useAvatar.ts 119`, `components/avatar/_index.scss 54` | 388 | `data/avatar.md` | `avatar.json` | низ `renders/timeline/concept.webp` | `avatar/*` 313 |
| MTable | авторский | `ui/table/{index.vue 307, types.ts 127}`, `fragments/table/{header 182, message 89, pagination 183}/index.vue`, `composables/table/{useTableControl 102, useTableSelection 85}`, `utils/table/{model 82, warnings 48}`, `components/table/{_index 136, _rows 97}.scss` | 1438 | `data/table.md` | `table.json` | `renders/table` | `table/*` 569 |
| MTimeline(Item) | авторский | `ui/timeline/{index.vue 46, item/index.vue 266, props.ts 68}`, `fragments/timeline/divider/index.vue 84`, `composables/timeline/context.ts 133`, `components/timeline/_index.scss 75` | 672 | `data/timeline/{index,item,divider}.md` | `timeline.json` | `renders/timeline` | `timeline/*` 409 |

Каталоги: планы `.cursor/plans/feature/components-should-update/`, QA `.cursor/summary/runs/quality/data/`, рендеры
`.cursor/plans/feature/renders/`, фикстуры `playground/fixtures/<x>/{matrix,stress}.vue + <x>.e2e.ts`. Все планы
`done` (2026-10-07/08). Фикстуры групп панелей и подписи — внутри `expansion-panel/` и `list/`. Unit-спеки есть у
всех (у `MTimelineItem` своей нет — покрыт `timeline/index.spec.ts`). Файлов > 400 нет (макс.
`list/item/index.vue` 312, `expansion-panel/index.vue` 308, `table/index.vue` 307).

**CSS «было»** (expanded-вывод Sass, мой замер копией `shell/scss-smoke.mjs`; ориентир; официальная база — выходной CSS из prod-сборки,
`.cursor/temp/m3-polish/baseline/css-sizes.json`, P0): card 4916 Б, divider 927, expansion-panel 5313, -panels 641, list 448, list-item 6863, subheader 1607,
avatar 2543, table 4185 + header 2787 + message 1059 + pagination 2269, timeline 552 + item 5994 + divider 1210.

**Ф:** `npm run lint:scss` на HEAD — exit 0, 152 стиля; **дефисных путей `g()` в группе нет**. Морфа
(`springToCss`, `useShapeMorph`, `M3_SPRING`, `useReducedMotion`) в группе нет ни в одном файле — §6.2 общего
брифа применим только в части «без скачков, сдвигов, разворотов».

---

## 1. Решения владельца — не переспрашивать

[mc] память `containment-decisions-2026-10`, [md] `data-inputs-decisions-2026-10`, [av]
`authored-components-keep-vision`, [dec:N] `docs/system/en-US/decisions.md` строка N, [sc]/[sd]/[si] summary
containment / data-group / integration-and-dashboards, [p] план.

**Общее.** Авторские (панели, аватар, таблица, лента, подпись) — в текущем видении [av]. Hairline `max(1px, 1rem)`
везде, card ещё не переведён [dec:84, md]. Кольцо 1px на 1201–1279 не чинить [md].

**MCard.** `tag="link"` — вся карточка `NuxtLink` (disabled: `<a>` без `href`, `role="link"`, `aria-disabled`);
кнопки и «растянутой ссылки» нет [mc, dec:26]. `#actions` в ссылке рендерится + dev-предупреждение [mc].
`headingLevel` 2–6 без дефолта, иначе `<p>` [mc]. `variant` = elevated/filled/outlined, `tonal`/`text` — релиз
алиасом [mc]. Статичная — без hover, курсора, слоя, переходов; имя — заголовок через `aria-labelledby` [mc, sc].
Disabled-ссылка вне Tab — принято (IN-08). Dragged и плотности нет (В4, S5) [p].

**MDivider.** `inset: 'start'|'center'|'end'`, `true` = `start` релиз [mc]. В `MList`-`ul` — `li aria-hidden`, в
списке с ролью — `div aria-hidden`, вне — `div role="separator"` [mc]. Линия рамкой, без `width/height: 100%` [p].

**Панели.** Вид прежний (12, `surface` → `surface-container-low` + `elevation(1)`, заголовок 56, шеврон → `primary`)
[p]. `headingLevel` без дефолта; `loading` снят [mc]. Группа segmented: зазор 2, углы 12/4, **статичные** [mc].
Смена `value` закрывает; переход в exclusive оставляет первую открытую; запертый `mandatory`-заголовок —
`aria-disabled`, без hover/pressed [mc]. Свёрнутое — `inert` [dec:61]. IN-08 и TH-08 не берём [p]. Reduced
motion — глобально `base/_animations.scss:44` (medium → short-2).

**Список.** Выбор `secondary-container` (dropdown/autocomplete следом) [mc]. Expressive с иконками 24: зазор 0,
угол 4, выбранная 16 **статично**, gap 12, отступы 10 [mc]. `ul/li`, при роли потребителя — `div`; `ul` без
`role="list"` [mc, dec:60]. «Выбрано»: ссылка `aria-current`, кнопка `aria-pressed`, при роли — ничего [mc].
`lines="auto"` переносит, число — clamp + `title` [mc]. `loading` снят; строка всегда `type="button"` [mc].
Segmented/reorder/swipe/expandable не вводятся [dec:25]. Подпись в `ul` — `li` без роли [dec:59]; `MList surface`
только объявляет фон [mc]. Плотность строки = `MFieldDensity` [dec:65].

**Аватар.** `density` 24/40/56, `size` — релиз алиасом; слот `{ density, failed }`; outlined — `border`;
`ICONS.person` [sd]. Предложения — «обсудить / при заказчике» [p].

**Таблица.** Только множественный выбор + `row-click` [dec:28]. Выбор в модели, переживает страницу, «выбрать все» —
текущая страница, исчезнувшие не удаляет [md, dec:68]. Хелперы в `utils/table` [md]. Нет `column.maxWidth`
[dec:29]. Слой на каждой ячейке [dec:64]. Загрузка — `MLoading aria-hidden` [dec:36]. Подписи подвала — пропы без
английских дефолтов; смена размера страницы → `update:currentPage(1)` [sd]. RS-12 принято.

**Лента.** Вертикальная, явная композиция, DOM хронологический [p]. `status` — строка, тонов нет [dec:27]. Концы
рейки `:first/last-child` [dec:62], колонка времени — `:has()` [dec:63], `alternate` — контейнерный запрос по своей
ширине [sd]. Точка на линии заголовка, линия обрывается в `spacing(2)` [sd]. «Сейчас» противоречит «история, не
процесс» [sd].

---

## 2. Что осталось от прошлых раундов

- **Card:** hairline `container.outline.width: 1rem` (`components/card/_index.scss:17`, Ф). Предложения
  (горизонтальная, выбираемая, скелет) не решены. Ошибки в репозитории `docs` — вне объёма [sc].
- **Divider:** предложения — подпись слотом, `inset="text"` [p].
- **Панели:** документация (шаг 6) не делалась; предложения: «раскрыть всё», `hidden="until-found"`, индикатор
  ошибок, `lazy`, стрелки [p].
- **Список:** CT-08 (виртуализация, план `foundation/virtual-scroll.md`), CT-09 (заглушка изображения) — FAIL;
  предложения: `dividers`, подсветка совпадений, действия по наведению, готовое пустое состояние, `#trailing` у
  подписи [p]. Риски: отключённая строка не приглушает контролы в слотах; Safari VO и `ul` без роли [sc].
- **Таблица:**
  - A11-06 mixed ждёт `indeterminate` в `MCheckbox` (план `form/checkbox.md` — `planned`, в `ui/checkbox` слова
    `indeterminate` нет, Ф); `isMixed` уже считается.
  - **Открыто владельцем:** подвал — встроить `MPagination` или свои «первая/последняя» [md, si]. Агент CRM:
    снаружи `MPagination` работает; встроить мешают английские имена страниц, camelCase `ariaLabel/ariaCurrent` в
    слоте (SSR), нет компактного «‹ ›» [si]. `ICONS.firstPage/lastPage` нет. `MPagination` вне объёма.
  - `stickyHeader` не введён: вьюпорт `overflow-x: auto` — контейнер прокрутки по обеим осям, к странице шапка не
    прилипнет; нужен свой `maxHeight` вьюпорта — вопрос 8 [sd].
  - DT-10, DT-11 (задержка индикатора — системно), CT-08 — FAIL.
  - Находки дашбордов (Ф): `statusText` глушит объявление ошибки (`table/index.vue:195`); при `aria-labelledby`
    область прокрутки без имени (`table/index.vue:204`, `useTableControl.ts:73-75`); `TableData` с
    индекс-сигнатурой не принимает интерфейсы (`types.ts:40-43`); `TableColumn`/`SortState` только глубокими
    путями (`package.json` `exports` — лишь `./types` = `shared/types/props`).
  - Риски [sd]: маска края бледнит кольцо вьюпорта; индикатор обновления без подложки.
- **Лента:** `container-type` на `ol` схлопывается во flex/inline без ширины; пунктир начинается заново у каждого
  `li` [sd].
- **Не проверено в браузере ни разу** [sd]: рейка во всех плотностях, пунктир, точка/время, `hideDot`; таблица —
  выбранная под курсором, кольцо сортировки, иконка в `end`, `select` на 360, обновление, затухание (rtl слева),
  перенос; аватар — outlined с картинкой, битая без мигания, forced colors.

---

## 3. QA-аудит: что открыто

Принятые/вне объёма у всех: RS-04/05, TK-09, TS-04, DC-01…05; у list и table ещё RS-06/RS-12.

| Компонент | FAIL (кроме принятых) | MANUAL → кандидаты в осмотр |
|---|---|---|
| card | IN-08 принято | ST-07 hover 8% в темах; CT-06; CT-12; LY-07 узкая колонка / grid / модалка; RS-02; TH-02; TH-03; TS-06 |
| divider | — | LY-07 в карточке и меню; TH-02 dark; TS-06 |
| expansion-panel | IN-08, TH-08 — приняты | ST-03 кольцо поверх expanded+hover; ST-07; CT-06; CT-08 20+ регионов; CT-12; LY-03 шеврон у двухстрочного; LY-07; RS-01 320; RS-02; TH-02; TH-03; TS-06 |
| expansion-panels | — | A11-08 нет стрелок (осознанно?); TS-06 |
| list | IN-08 (`useListItemControl.ts:91`, осознанно); CT-08; CT-09 (`item/index.vue:247`) | ST-07 3:1 selected/rest; IN-04 кольцо на `secondary-container`; CT-06; CT-07 (числа без `tabular-nums`); CT-12; LY-03; LY-07; RS-01; RS-02; TH-02; TH-03; TH-08 «полоса» при смене темы; EN-10 профиль 100+ строк (`v-ripple` + async NuxtLink); EN-11 |
| avatar | — | IN-05 `overflow: hidden` режет кольцо в слоте; CT-06 инициалы в 24; LY-07; TH-02; TH-03; TS-06 |
| table | A11-06; DT-10; DT-11; CT-08 | ST-07/TH-02/TH-08 — **заметки устарели** (hover 4%, `primary` 8%, `index.vue:154` — код до редизайна); CT-06; CT-12; LY-03; LY-07; RS-01 320 подвал; RS-02; TH-03; TS-06 |
| timeline | — | CT-06; CT-07 пустые title/text; CT-12; LY-03; RS-02 порог `alternate`; TH-02 **устарело** (кольца у точки нет); TH-03; TS-06 |

---

## 4. Движение и анимации в группе

### 4.1 Что анимируется (Ф)

| Где | Свойства | Чем |
|---|---|---|
| card `--link`: `components/card/_states.scss:15, 27` | `box-shadow`, слой `::before` | `state.duration` short-3 |
| panel: `expansion-panel/index.vue:112-114, 151, 218, 239-241` | фон и тень корня, слой, `rotate(180deg)` шеврона (`:261`, только дефолтного), `opacity` содержимого | short-3 |
| panel: `:224-225, 268` | **высота: `grid-template-rows` 0fr → 1fr** (геометрия в потоке, двигает всё ниже) | medium-2 (reduced → short-2) |
| list item: `list/item/index.vue:172-174, 186` | `background-color`, `color`, слой; радиус 4 ↔ 16 без перехода (решение) | short-3 |
| list item: `v-ripple` (`:5`) | pressed — только ripple, своего слоя нет (`item/_index.scss:127-132`) | `_ripple.scss` (литеральные ms — файл оркестратора) |
| table: `header/index.vue:142`, `_rows.scss:58`, `pagination/index.vue:149` | слои сортировки и ячеек, фон `select` | short-3 |
| table: `table/index.vue:238-283` | scroll-driven: `@property --ui-table-fade` + `@keyframes` + `animation-timeline: scroll(self inline)` под `@supports`; RTL — `:dir(rtl)` | `easing-linear` |
| divider, avatar, timeline | — | — |

`transition: all`, inline-`transition`, `left/translate` в RTL, смены `border-width/padding/font-weight` по
состоянию — не найдено (Ф, grep).

### 4.2 Гипотезы «прыгает / бегает»

**E-1. Группа панелей с предустановленным `v-model` раскрывается ПОСЛЕ гидрации — с анимацией и сдвигом.**
`expansion-panels/index.vue:46-50` — `watch(…, { immediate: true })` применяет модель в setup группы, когда панели
ещё не зарегистрированы; `createSelection.apply` (`composables/registry/createSelection.ts:116-140`) находит id
только среди зарегистрированных → ничего не выбрано. Панели регистрируются в своём setup
(`useExpansionPanelControl.ts:73-83`), повторный прогон watch — отложенная задача. Вероятно, сервер рисует все панели
группы закрытыми (и `mandatory` — без открытой), клиент открывает после гидрации → переход высоты + сдвиг всего
ниже. Код сам пишет «a preset v-model opens its panel at mount». В `expansion-panel/matrix.vue` предустановлены
`exclusive='b'`, `several=['a']`, `required='a'`; e2e ждут `data-fixture-ready` и этого не видят. Направление
(техническое): применять модель при регистрации тикета.

**E-2. Exclusive: нажатый заголовок уезжает из-под курсора.** Открыта `b`, клик по `c`: обе анимируются
одновременно, заголовок `c` едет вверх на высоту содержимого `b`. Если подтвердится — поведенческая развилка.

**E-3. Нижние углы заголовка щёлкают.** `expansion-panel/index.vue:250-254`: у раскрытой
`border-end-*-radius: 0` ставится классом мгновенно; после клика виден hover-слой → при закрытии его углы
скругляются сразу, пока тело ещё схлопывается. Статичная форма разрешена (§6.3) — проверить, не читается ли как
скачок.

**E-4 (вид). Segmented-ритм не виден в покое:** свёрнутая панель — `surface` (`components/expansion-panel/_index.scss:16`),
фон страницы — `background` (`components/app/_index.scss:7`); зазор 2 и углы 12/4 на одном тоне не различимы. В
concept группа стоит на тонированной секции. Если подтвердится — развилка (вид авторского компонента).

**L-1. Выбор строки:** фон плавно, угол 4 → 16 и слой (`radius: inherit`) — мгновенно (`item/_states.scss:9-10`).
По решению статично; проверить только «нет изменения высоты/сдвига соседей». В фикстурах списка `selected`
статичен — нужен интерактивный случай.

**L-2. MAvatar с картинкой в leading строки** (специфичность — Ф, вид — Г): `list/item/index.vue:247-252`
`.ui-list-item__leading img {56×56; radius small}` (0,1,1) бьёт `.ui-avatar__image` (0,1,0) → картинка 56 в боксе 40
с `overflow: hidden`; `:261-265` `.ui-avatar {40; full}` (0,2,0) бьёт `--density-*`/`--shape-*` аватара → его
`density` и `shape` в строке игнорируются. В фикстурах аватар в строке только с инициалами (`list/matrix.vue:27-30`),
в демо — тоже.

**T-1. Индикатор обновления наезжает на шапку при `caption`:** отступ `busy` = шапка + 4 + 16 от верха вьюпорта
(`components/table/_index.scss:36, 43, 50`), а `<caption>` (`_rows.scss:12-18`) стоит над `thead`. `state-refreshing`
в фикстуре без caption (`table/matrix.vue:64-71`).

**T-2. Шевроны подвала не зеркалятся в RTL:** `fragments/table/pagination/index.vue:41, 49` —
`ICONS.chevronLeft/Right`; правил зеркалирования в `ui/icon`, `ui/button/icon`, `ui/pagination` нет (Ф, grep); в
плане `MPagination` «RTL-шевроны» тоже открыты.

**T-3. Маска края бледнит кольца фокуса:** `focus-ring(inset)` вьюпорта (`table/index.vue:268-270`) и кнопок
сортировки последней колонки под `mask-image` (`:276`).

**T-4. Иконка сортировки в `end`-колонке в RTL** (`header/index.vue:102`, `row-reverse`) — ведёт ли иконка в обоих
направлениях.

**T-5.** `tabindex/role/aria-label` вьюпорта появляются только после монтирования (`useTableControl.ts:54-76`,
`ResizeObserver`) — не в SSR-HTML; без развилки не чинить (геометрию знает только рантайм).

**TL-1. Точка у элемента без `title`** стоит по линии несуществующего заголовка: `$-dot-offset` выведен из
line-height `title-medium` (`components/timeline/_index.scss:19`). Таких случаев в фикстурах нет.

**TL-2. Вставка в середину `alternate`:** новый элемент регистрируется последним, `compareByDom` для несмонтированного
возвращает 0 (`composables/timeline/context.ts`) → кадр с неверными сторонами хвоста, затем переворот. Нужен случай
со вставкой.

**TL-3.** Пунктир на стыках; переход порога `alternate` (RS-02).

**C-1.** Ссылка-карточка: hover/pressed — только тень и слой (проверить отсутствие `shift`); внешнее кольцо (offset 2
+ 3) обрежется в родителе с `overflow: hidden` (так у `MSheet` [si]).

---

## 5. Кастомизация: что есть и где дыры

- **MCard** — 8 пропов, слоты `#media, #header, default, #actions`, escape hatch `useCard`. Дыры: `#header` снимает
  имя — `card/index.vue:71` `hasTitle: () => Boolean(props.title) && !slots.header` → `article` без
  `aria-labelledby` (Ф); нет `#title/#subtitle` раздельно; нет `defineSlots`.
- **MDivider** — `orientation`, `inset`; подписи нет (предложение).
- **Панели** — `disabled, value, title, description, headingLevel`; `#header`, `#trailing { expanded }`, default;
  группа `multiple, mandatory`; атрибуты на кнопку; `useExpansionPanelControl` (+ `headingAttrs`). Дыры (Г): нет
  `#leading`; нет `defineSlots`/`defineExpose`; у `title`/`description` нет JSDoc.
- **MList** — generic `items`, `#empty`, `density`, `surface`. **MListItem** — 13 пропов (+ снятый `loading`), слоты `#leading,
  #overline, #headline, default, #supporting, #trailingSupporting, #trailing`, `useListItemControl`. Дыры (Г): `tag` —
  свободная строка (`item/props.ts:38`); слот `trailingSupporting` в camelCase при kebab-слотах в ките; leading
  размеряет чужие блоки (L-2). **Подпись** — `title, tag, sticky, inset`; `#trailing` — предложение.
- **MAvatar** — 8 пропов, слоты `default`, `fallback`, события `load/error`, `defineSlots` есть. Дыра (Г): только
  `primary`-роли, оси `color` нет (цвет инициалов — «обсудить» в плане).
- **MTable** — богатое API (§1, `types.ts`), слоты `#caption, #header-<key>, #cell-<key>, #loading, #empty, #error,
  #pagination-info`, `useTableControl`, `useTableSelection`. Дыры (Г): нет `defineSlots` (подсказки IDE у
  динамических слотов generic-компонента — проверить `vue-tsc`); нет хука на строку (класс/атрибуты по данным);
  нельзя визуально скрыть подпись колонки (демо `OrdersTable.vue` прячет «Действия» своим sr-only); иконки
  сортировки/подвала не заменить; публичные типы не экспортированы (§2).
- **MTimeline(Item)** — `side, density, line`; элемент 12 пропов; слоты `#opposite, #dot, #icon, #title, default`.
  Дыры: `#icon` — вложенный запасной вариант `#dot` (`item/index.vue:29-30`), два слота на одно место.

---

## 6. Минимизация и оптимизация

**Мёртвое и шум (Ф):**
- `material-map()` — тождественная копия (`abstracts/_functions.scss:70-85`, `$prefix`/`$new-path` не используются).
  Вызывается в card, avatar, table (4 файла), timeline (3). Удаление вызовов — CSS байт в байт тот же (сверь).
- Висячие JSDoc: `card/props.ts:14`, `expansion-panel/props.ts:11`.
- Двойные карты снятых значений: `card/index.vue:75` + `useCardWarnings.ts:40`; `AVATAR_SIZE_TO_DENSITY`
  (`avatar/props.ts`) + `avatar/index.vue:59-63`.
- Устаревшие QA-заметки (§3).

**Две механики одного (Ф):**
- Типографика: `typescale('<name>')` (card, panel, table) и `apply-typography(<map>)` (list item, subheader,
  avatar, timeline item) дают одни и те же декларации (`abstracts/_mixins.scss:111-127`). Свести — но владелец
  сейчас правит типографику: только через оркестратора.
- Ссылка и disabled-ссылка — три `defineAsyncComponent(NuxtLink)` и три правила: `composables/button/useButton.ts:17,
  83-88` (NuxtLink, `tabindex=-1`, `href` остаётся), `composables/card/useCard.ts:15, 54-58, 67` (`<a>` без `href`,
  `role="link"`), `composables/list/useListItemControl.ts:18, 56, 100, 109` (`<a>`, `delete href`). Общий хелпер
  трогает файл w1 → заявка.
- Pressed: строка списка — ripple, card/panel/сортировка — слой 12% без ripple. Наблюдение; менять — развилка.
- `@each` по трём плотностям таблицы в четырёх местах: `table/index.vue:297-301`, `_rows.scss` (высота строк),
  `header/index.vue:175-180`, `message/index.vue:83`.
- Ключи движения: `state.duration` (card, table), `motion.duration` (list), `motion.state/expand` (panel).

**Селекторы (Ф):** `>` — `list/index.vue:76`, `expansion-panels/index.vue:120`, `timeline/index.vue:41`,
`timeline/item/index.vue:222, 229, 240, 244, 251`, `table/_rows.scss:78` (детектор `:has()` колонки времени без `>`
не выразить — обоснуй). Теги — `card/index.vue:152-153` (`img, video`), `list/item/index.vue:247, 254` и чужой
`.ui-avatar` (`:261`), `item/_states.scss:55`, `list/subheader/index.vue:81` (`:where(h1…p)` — нормализация
слота, обоснованно).

**Внутреннее в автоимпорте (Ф):** `addImportsDir(runtime('composables/**'))` (`src/module.ts:167`) →
`composables/timeline/context.ts` («not a public API», да ещё голые `provide/inject` вместо `createContext`,
`:119, :130`) и `provideExpansionPanelGroupContext` из `composables/expansion-panel/useExpansionPanelGroup.ts`.
Образец — `ui/list/context.ts`. Фикстура импортирует `PanelValue` из `composables/…` — поправить вместе.

**Из кнопок/полей применимо:** почти всё уже есть (`@each`, `_states.scss` у card и list, китовые `MButtonIcon`,
`MLoading`, `MCheckbox`). Цель здесь — мусор выше; выигрыш — десятки строк и единицы КБ CSS.

---

## 7. Связи с другими группами

**Потребители группы (Ф, grep):** только список — `ui/dropdown/index.vue:138-182, 222-223`,
`ui/autocomplete/index.vue:147-191, 263-264` (w4). Остальное внутри кита никто не импортирует; `MDivider` читает
контекст списка (`divider/index.vue:14, 22-25`). Демо: MCard ×9 (статичные, всегда `headingLevel`), MDivider ×6
(`inset="center"`), MList/MListItem ×4 (drawer-ссылки с `selected`, `lines=3`, `surface`), MAvatar ×7 (только
`name`), MTable ×2 (orders — встроенный подвал; CRM — внешние `MDropdown` + `MPagination`), MTimeline ×2,
MExpansionPanels ×1.

**Контракт списка для MDropdown/MAutocomplete — что сломается у w4:**
1. Ключи `components/list/item/_index.scss`, которые читает `components/dropdown/_index.scss:15-19, 26`:
   `label.text.color`, `label.text.selected.color`, `state.focus`, `container.selected.color`,
   `density.<step>.height.one`. Переименование = ошибка Sass у w4.
2. Классы `ui-list-item`, `--selected`, `--disabled`, `--density-*`, `__leading`, `__trailing` — читают
   `dropdown/_panel.scss:58-88` (`&__option.ui-list-item::before { display: none }`: дропдаун гасит слой строки и
   рисует свой фон), `dropdown/tests/*`, `autocomplete/tests/*`, `fixtures/autocomplete/autocomplete.e2e.ts:200`.
   Перенос слоя с `::before` вернёт двойной hover.
3. `MList`: роль через `$attrs` → `div` (`list/index.vue:46`), `density`, атрибуты и `style` на корень (нет
   `inheritAttrs: false`) — так приходят `listboxAttrs` и `--m-dropdown-panel-max-height`.
4. `MListItem`: `interactive`, `selected`, `disabled`, `lines=1`, `#trailing`, default-слот. При роли потребителя
   строка не ставит роль и `aria-pressed`, **но ставит `tabindex`/`onKeydown` эмулированной кнопки** — дропдаун
   перебивает `tabindex: -1` (`composables/dropdown/useDropdownControl.ts:265-279`, потребитель в `mergeProps`
   последним). `disabled` → `pointer-events: none`. `v-ripple` работает и в опциях.
5. Корень — `div`/`a`/`NuxtLink`/`button` по `tag`; `<button>`-корень сломает `role="option"`.
Регрессия на любую правку списка: e2e и unit `dropdown`, `autocomplete`.

**Расхождение с общим брифом (Ф):** «строка списка стоит на `useButton`» — **нет**. `useListItemControl` не
импортирует `useButton` (его используют только `ui/button/{index,fab,extended-fab}`); в октябре лишь предлагалось
«переиспользовать ядро» [mc]. Реальная зависимость от папки w1 — `composables/button/useRetiredValueWarning.ts`
(`card/useCardWarnings.ts:2`, `expansion-panel/index.vue:64`, `list/item/index.vue:85`, `avatar/index.vue:42`).

**Что группа потребляет:** w1 — `MButtonIcon` (подвал), `MLoading` (таблица), `useRetiredValueWarning`, ripple
(список). w3 — тип `MFieldDensity` из `ui/text-field/props` (`list/item/props.ts:9`, `avatar/props.ts:11`,
`table/types.ts:6`, `composables/timeline/context.ts:19`) — переименование у w3 ломает четыре типа. Вне объёма —
`MCheckbox` (нет `indeterminate`), `MSurface` (контент ленты), `MIcon`, `MPagination`, `composables/registry`
(панели), `shared/utils/{avatar,pagination}`, `ICONS` (только дописывать; `firstPage/lastPage` — после решения по
подвалу).

---

## 8. Рекомендуемый порядок и объём

1. **Список + подпись + разделитель** — первым: на нём стоят w4. Контракт §7 без заявки не менять. L-1, L-2,
   селекторы, отчёт о `useButton`. M (больше аудита, чем правок). Разделитель — XS.
2. **Панели** — E-1 (вероятный реальный «прыжок при загрузке»), E-2…E-4, утечка контекста. S–M.
3. **Таблица** — T-1…T-5, развилки (подвал, sticky, hover строк), слоты/типы, хвосты дашбордов, `material-map`,
   4× `@each`. M–L. Ждущее `MCheckbox`/решения по подвалу — «перенесено с причиной».
4. **Карточка** — hairline, `#header` без имени, шум, C-1. S.
5. **Лента** — TL-1…TL-3, контекст через `createContext` вне автоимпорта, `>`, `#icon`. S.
6. **Аватар** — `material-map`, двойная карта, MANUAL. XS–S (основное — в строке списка).

Пока ждёшь дирижёра: `docs/system`, гайды `modern-web-guidance` (`animate-to-intrinsic-sizes`,
`dynamic-sibling-animations`, `state-aware-sticky-headers`, `scrollability-affordance-hints`,
`soft-edge-content-fade`, `responsive-table`, `child-state-based-styling`), следующие пробы, новые случаи в своих
фикстурах (не `src/`). Базовая карта P0 — `.cursor/temp/m3-polish/baseline/w2-containment-data.md` и
`playground/e2e/probe.ts` готовит оркестратор (на момент брифа их ещё нет).

**Кандидаты в развилки** (формулировать по §5.6, не решать): подвал таблицы (открыт владельцем); `stickyHeader` +
своя высота вьюпорта; hover-слой на всех строках таблицы без `selectable` и `row-click` (`_rows.scss:77-81`, курсора
нет; у статичной карточки hover сняли как ложную подсказку — ST-01); E-2 и E-4, если подтвердятся; `#title` у
карточки; ось цвета у аватара; когда удалять снятые значения (card `tonal/text`, divider `inset: true`, `loading` у
строки и панели, avatar `size`).

---

## 9. Стартовые заявки дирижёру

1. **probe — E-1.** `playground/probes/w2-containment-data/panel-preset.probe.ts`: `page.request.get('/expansion-panel/matrix')`
   → в HTML `aria-expanded`/`aria-disabled` у `[data-test=exclusive-b]`, `[data-test=multiple-a]`,
   `[data-test=mandatory-a]` (атрибуты потребителя лежат на кнопке); затем `traceMotion` с `act: page.reload()`,
   targets `[data-test=group-exclusive]`, `[data-test=group-multiple]` и регион по `aria-controls` кнопки
   `exclusive-b`, styles `grid-template-rows, height`; сбор `console` (hydration).
2. **probe — E-2/E-3.** `/expansion-panel/matrix`: клик `[data-test=exclusive-c]`, затем `[data-test=exclusive-b]`;
   targets — оба заголовка, оба региона, группа; повтор с `reducedMotion: reduce` и `dir=rtl`; `shootStates`
   `[data-test=exclusive-b]` + кадр посреди закрытия.
3. **look — E-4.** `/expansion-panel/matrix` light и dark: shot `[data-test=group-exclusive]`,
   `[data-test=group-mandatory]`, `[data-test=panel-title-collapsed]`, `[data-test=panel-description-expanded]`,
   `[data-test=panel-trailing-collapsed-disabled]`; hover `[data-test=exclusive-a]` + shot.
4. **look — список.** `/list/matrix` light/dark, ltr/rtl: `shootStates` `[data-test=button-rest]`,
   `[data-test=button-selected]`, `[data-test=emulated-selected-disabled]`, `[data-test=link-disabled]`; shot
   `[data-test=list-content]`, `[data-test=list-sections]`, `[data-test=sections-inset]`; `js` — `border-radius` и
   `min-height` `[data-test=button-selected]` до/после hover.
5. **look — L-2** после добавления в `list/matrix.vue` строки с `MAvatar src shape="large" density="comfortable"`:
   shot строки, `js` — `getBoundingClientRect` `.ui-avatar` и `.ui-avatar__image`.
6. **look — подвал и RTL.** `/table/matrix?dir=rtl` и `ltr`, ширина 1280 и 360: shot
   `.ui-table-container:has([data-test=main]) .ui-table__pagination` и шапки после сортировки по колонке `end`;
   hover по выбранной строке (в фикстуре предвыбраны 2-я и 4-я, `table/matrix.vue:167`) + shot.
7. **look — затухание.** `/table/stress` 1280 и 768, ltr/rtl: Tab до
   `.ui-table-container:has([data-test=wide]) .ui-table-container__viewport` → shot; `js` `scrollLeft = scrollWidth`
   → shot; фокус на последней кнопке сортировки → shot.
8. **look — состояния данных.** `/table/matrix`: shot рамок `[data-test=state-refreshing]`,
   `[data-test=state-loading]`, `[data-test=state-partial]`, плотностей `[data-test=density-compact]`…; после
   добавления случая «caption + loading + строки» — T-1.
9. **look — лента.** `/timeline/matrix`: zoom стыка `[data-test=line-dashed]`, `[data-test=no-dot]`,
   `[data-test=density-compact]`; `/timeline/stress`: `[data-test=narrow-alternate]`, `[data-test=wide-alternate]`
   при ширине 760 и 780, rtl; после новых случаев — TL-1, TL-2.
10. **probe — C-1.** `/card/matrix`: hover/press/focus `[data-test=link-elevated]`, `[data-test=link-outlined]`;
    targets — карточка и соседняя `[data-test=static-elevated]`, styles `box-shadow, transform`; `shootStates`
    light/dark.
