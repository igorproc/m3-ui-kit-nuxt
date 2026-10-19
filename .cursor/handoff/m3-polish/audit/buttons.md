# Аудит buttons (w1) — 2026-10-18

Группа: MButton, MButtonIcon, MButtonFab, MButtonExtendedFab, MButtonSplit, MButtonSegmented,
MButtonGroup, MFabMenu, MLoading, MShape + морф-утилиты. Пути от `src/runtime/`, токены семьи —
`assets/stylesheet/components/button/**` (ниже `tok/`).

**Доказательства.** Пробы `playground/probes/w1-buttons/*.probe.ts` (вне git), результаты —
`test-results/conductor/w1-buttons-<NNN>[-r1]/`. Радиус в пробах — **нарисованный** (CSS
Backgrounds 3 §5.5: при переполнении стороны все радиусы умножаются на общий коэффициент),
`getComputedStyle` отдаёт заданные 999rem. Юнит-проверки — `playground/probes/w1-buttons/audit.spec.ts`
(7/7 зелёные, `npx vitest run playground/probes/w1-buttons/audit.spec.ts --coverage.enabled=false`).
Выходной CSS «станет» — оценка; собственная компиляция SFC (`playground/probes/w1-buttons/css-dump.mjs`)
сходится с базой `baseline/css-sizes.json` в пределах 2%.

| REQ | Что | Итог |
|---|---|---|
| 001 | toggle MButton/MButtonIcon, select/deselect/двойной клик, motion/reduce | 8 passed |
| 003 | статические углы split и группы, 1920 | 2 passed |
| 004 | клавиатура группы ltr/rtl, disabled-кнопка группы light/dark | 4 passed |
| 006 | ширина segmented при выборе | 3 passed |
| 007 | fold/unfold extended FAB ltr/rtl/reduce | 3 passed |
| 008 | FAB menu: anchor и JS-путь × 3 ступени, быстрый тоггл | 7 passed |
| 010 | MLoading expressive motion/reduce, MShape прерванный, inline, forced colors | 3 passed (r1); «forced colors and inline» падал в пробе (вращающийся индикатор не бывает stable) |
| 013 | повтор «forced colors and inline» с исправленной пробой | 1 passed |
| 011 | смена loading/density/variant на лету, фокус, `<form>` (новая фикстура `button/dynamic`) | 3 passed (r1) |
| 012 | состояния light/dark × ltr/rtl, forced colors | 5 passed (r1) |

Базовая карта скачков (P0) по группе пустая: свип не кликал toggle и не открывал меню.

---

## Семья: форма `full = 999rem` (корень №1)

Источники: `tok/_index.scss:10,70`, `tok/group/_index.scss:9,11`, `fab-menu/_index.scss:59`,
`base/_shapes.scss:14`, REQ 001/003/004/008. Расчёт по пружине `spatial.fast` (230 мс) сходится с
трассой.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| FAM.B-1 | B | Toggle → квадрат: цвет пошёл на клике (≈80 мс), нарисованный радиус стоит ещё ≈133 мс и доезжает за 2 кадра (56% пути за кадр). Обратно в круг — 100% пути за **1 кадр**. Так у `MButton` (filled, outlined) и у `MButtonIcon` в обе стороны (square→round тоже снап). Двойной клик 80 мс: нарисованный радиус не шевельнулся вовсе | REQ 001 `toggle-filled-motion-select.json`: firstMove 212.8, r90 229.5, largestStepShare 0.56; `…-deselect.json`: largestStepShare 1 @62.5; `icon-toggle-square-filled-motion-select.json`: 1 @80.1 | конечный радиус в карте: `calc(<высота ступени> / 2)` вместо `full` у toggle; пружина тогда идёт на всём пути | M | да → Q-1 |
| FAM.B-2 | B | Reduce: тот же рисунок, только короче (CALM): стоит ≈167 мс, потом 70% за кадр; в круг — за 1 кадр | REQ 001 `*-reduce-*.json` | то же | — | да → Q-1 |
| FAM.A-3 | A | Статические смешанные углы рисуются почти квадратными: внутренние углы split 4 → **0.08rem** (compact 0.06, comfortable 0.11), крайние кнопки группы 8 → **0.16rem** (0.13 / 0.22) — на всех ступенях и вариантах | REQ 003 `corners.json` (factor 0.02), PNG `group-filled.png`, `split-outlined.png` | тот же конечный радиус для внешних углов (`calc(h/2)`) | S | да → Q-1 |
| FAM.B-4 | B | Группа: три разных поведения в одном ряду. Средняя кнопка в пилюлю — снап за кадр (8 → 20, 100%); обратно — 150 мс стоит, потом 70% за кадр. Крайние — внутренний угол едет плавно, но к 0.16 | REQ 004 `ltr-ArrowRight.json`, `ltr-ArrowLeft.json` | то же | — | да → Q-1 |
| FAM.B-5 | B | FAB menu: открытый FAB `open.shape = full`. Default 16 → круг — 100% за 1 кадр; закрытие — радиус стоит ≈130 мс, потом 40% за кадр; compact 12 → 28 — 54% за кадр | REQ 008 `menu-density-default-anchor/anchor-open.json` (largest 1 @88), `anchor-close.json` (first 214.8) | `open.shape: calc(open.size / 2)` = 28 — вид в покое не меняется (круг 56) | S | нет |
| FAM.B-7 | B | Прерывание toggle (двойной клик 80 мс): заданный радиус и цвет разворачиваются с текущего значения — inline-переход посреди движения не перезаписывается (гипотеза брифа §4.2 не подтвердилась) — проверено | REQ 001 `*-double80.json` (computed radius: 2 смены направления, без скачка к началу) | — | — | — |
| FAM.B-6 | B (тесты) | e2e это не видят: сравнивают заданный радиус | `button.e2e.ts:147-171,306-319,591`, `button-group.e2e.ts:5` | регрессия на нарисованный радиус + `traceMotion` в своих e2e | S | нет |

---

## MButton
Источники: план `button/index.md` (done), QA `button.json` (FAIL — только принятые/вне объёма;
MANUAL ST-07, CT-06/07/12, LY-03/07, RS-02/07, TH-02/03/08, TS-06), REQ 001/011/012.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| BTN.A-1 | A | **Forced colors: подпись выбранной кнопки не читается** — белая «подложка» текста (backplate) на `Highlight`, текст `HighlightText` того же цвета. Так у выбранного `MButton` с подписью (видно на text и outlined), выбранной кнопки группы и выбранного сегмента; у icon-toggle глиф виден (у иконок подложки нет) | REQ 012 `forced-button_matrix-selected-outlined.png`, `forced-button-group_matrix-group-tonal.png`, `forced-button_family-segmented-single.png`; правило `index.vue:353-358` | `forced-color-adjust: none` на выбранном состоянии (системные цвета заданы явно) — снимает подложку | S | нет |
| BTN.A-2 | A | Disabled-контент — `on-surface-variant` 38%, у M3 — `on-surface` 38%; FAB и extended FAB уже на `on-surface` — в семье два цвета disabled | `abstracts/_functions.scss:207`; M3 tokens v0_192 `filled-button disabled-label-text-color: on-surface`, `icon-button disabled-icon-color: on-surface`; `tok/fab/_index.scss:20` | `$on-surface` в `m3-button-scheme` | S | нет (заявка, файл оркестратора) |
| BTN.A-3 | A | Hairline outlined `1rem` (на узком экране < 1 device px) | `tok/_index.scss:11` | `max(1px, 1rem)` (решение 2026-10-08) | S | нет |
| BTN.A-4 | A | Outlined шире filled на ширину двух рамок: смена `variant` на лету двигает соседей на 3rem | REQ 011 `cycle-variant-*.json` (tonal→outlined: width +3, neighbour x +6); `index.vue:197-199` | `padding-inline` outlined = ступень − ширина рамки, в карте (`calc`) — у M3 рамка внутри того же размера | S | нет |
| BTN.A-5 | A | Выбранная text-toggle отличается от невыбранной **только цветом** (контейнер прозрачен, квадрат не виден) — В-7 расходится с правилом «состояние не только цветом» | `_functions.scss:201-204` (`text.selected = $bare`); REQ 012 `button_matrix-selected-text-rest.png` vs `enabled-text-rest.png` | см. Q-7 | S | да → Q-7 |
| BTN.B-1 | B | `transform` в списках переходов — никто его не задаёт | `index.vue:161`, `morph.ts:25` | удалить из обоих (inline-морф заменяет весь список — §6.2.7) | S | нет |
| BTN.B-2 | B | Loading держит фокус и ширину (В-6 работает) — проверено | REQ 011 `focus-loading.json` (button: before/during/after = button; `aria-disabled`, `aria-busy`), `toggle-loading-*.json` (ширина та же) | — | — | — |
| BTN.C-1 | C | `useButton` отдаёт BEM-классы (`rootClass`) и автоимпортируется потребителю вместе с внутренними `useFabProps`, `useButtonNameWarning`, `useRetiredValueWarning` | `composables/button/useButton.ts:52-71`; `src/module.ts:167` (`composables/**`); `behavior.md` «composable emits no classes» | см. Q-6 | S–M | да → Q-6 |
| BTN.D-1 | D | Генерация дублирует правила: `unselected` = база у elevated/tonal/outlined и `selected` = база у filled → 16 одинаковых правил (4 роли × 4); disabled не зависит от роли, но генерируется 20 раз (роль × вариант) + 20 копий `@media (forced-colors)` (всего 22 в выходе) | `index.vue:89-138`; скомпилированный CSS: `.ui-button--secondary.ui-button--elevated.ui-button--unselected{…}` = базе | `@if` «не равно базе» при генерации; disabled и его forced-colors — один раз на вариант, вне цикла ролей (специфичность — через `:where()` у ролевых правил) | M | нет |
| BTN.D-2 | D | Ось `size` в `rootClass` — только ради снятого `size` FAB | `useButton.ts:24,55` | удалить вместе с шимами | S | нет |

Минимизация: `ui-button` было 21451 / 2085 gzip (база; из них icon-button 1613) → оценка ~15.5–16 KB /
~1.7 KB: −16 дублей, −15 ролевых disabled, −21 forced-colors блок. Строки src: `index.vue` 360 →
~330.

## MButtonIcon
Источники: план `button/icon.md` (done), REQ 001/012.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| ICN.B-1 | B | Toggle square → round и round → square — см. FAM.B-1 (снап в круг за 1 кадр, `icon-button.selected.square = full`) | REQ 001 `icon-toggle-*` | Q-1 | — | да → Q-1 |
| ICN.D-1 | D | Шим «снято»: предупреждение `variant="elevated"` | `icon/index.vue:27,36` | удалить (решение 2026-10-18) | S | нет |
| ICN.C-1 | C | Слот `{ selected }` есть — это и есть путь к «залитому» глифу (M3 standard icon toggle = цвет + глиф) | `icon/index.vue:19`; фикстура `family.vue` | см. Q-7 | — | — |

## MButtonFab
Источники: план `button/fab.md` (done), REQ 011/012.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| FAB.A-1 | A | Состояния — подмена фона заранее смешанным цветом (`fab-surface`: hover/focus/pressed на роль × вариант), плюс рипл → **двойной pressed** (фон 12% + рипл) — то, что убрали в `MButton` | `tok/fab/_index.scss:13-23`, `fab/index.vue:4,96-108`; `craft.md` «The background swap» | слой `::before` в `currentcolor` + pressed только рипл, как `MButton` | M | да → Q-2 |
| FAB.B-1 | B | `.ui-fab__icon { transition: color }` на ребёнке, который наследует цвет: у корня `color` не переходит, а у иконки идёт свой short-3. В морфе FAB menu иконка красится на short-3/standard, контейнер — на пружине effects | `fab/index.vue:78`; `fab-menu/morph.ts:32-33` | убрать переход у ребёнка, `color` — в список корня (и в `fab-menu/morph.ts`) | S | нет |
| FAB.D-1 | D | Шимы «снято»: `size` + `FAB_SIZE_TO_DENSITY` + `useFabProps` (size→density, предупреждения `elevated/outlined/text`; тянет `reactiveComputed` из VueUse) | `fab/props.ts:17-22,28-34`; `composables/button/useFabProps.ts`; `fab/index.vue:29,36`; `extended-fab/index.vue:32,40` | удалить; пропы — прямо в `useButton` | S | нет |
| FAB.D-2 | D | FAB и extended FAB — две копии одной схемы: `fab-surface` и `extended-fab-surface` (разные имена ключей: `hover.color` vs `hover-color`), два набора миксинов `apply-surface/apply-scheme` | `tok/fab/_index.scss:13-31`, `tok/extended-fab/_index.scss:13-35`, `fab/index.vue:90-130`, `extended-fab/index.vue:129-168` | одна карта FAB-набора (роль × `tonal/filled` → контейнер + контент + disabled), состояния — слоем | M | нет |

Минимизация: `ui-fab` было 9446 / 1045 → оценка ~4.5 KB / ~0.7 KB (4 роли × 2 варианта × 5 правил
→ 4 × 2 × 2 + слой). Строки: `tok/fab` 68 → ~35.

## MButtonExtendedFab
Источники: план `button/extended-fab.md` (done; «подпись гаснет» не сделано), REQ 007/011.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| EXT.B-1 | B | Сворачивание: ширина 132 → 56rem **за первый кадр**, подпись исчезает тем же кадром; дальше корень «качается» 56 → 48 → 56 ≈450 мс (padding едет, а `auto` считается от живого содержимого без подписи) | REQ 007 `ltr-fold.json`: t47.8 w 56.0, затем 50.9 / 48.1 / 51.7 / 54.6; label w 68.3 → 1.5 за кадр; `extended-fab/index.vue:186-196` (`sr-only` сразу) | план «подпись гаснет»: анимировать подпись (opacity + inline-size обёртки подписи до 0 при `overflow: clip`), `sr-only` — по окончании; ширина корня тогда честный `auto`; переходы `padding/gap` не нужны | M | нет |
| EXT.B-2 | B | Раскрытие: подпись в первом кадре встаёт целиком и переносится в 2 строки → высота кнопки +19rem на 2 кадра; иконка прыгает на 16rem к началу и едет обратно | REQ 007 `ltr-unfold.json` (root height +19, icon x −15.97 @47.3), `rtl-unfold.json` зеркально | тот же фикс; подпись `white-space: nowrap` на время перехода | — | нет |
| EXT.B-3 | B | Смена `density` на лету анимирует `padding/gap` 18 кадров, а высота и шрифт — снапом | REQ 011 `cycle-density-*.json` (extended width 18 moving frames, height jump 40) | уходит вместе с переходами `padding/gap` (EXT.B-1) | — | нет |
| EXT.B-4 | B | Без `interpolate-size` (Firefox, Safari) сворачивание мгновенное; ширина в потоке толкает соседей (RTL — layout-shift каждый кадр) | MWG `animate-to-intrinsic-sizes` (Chrome-only); REQ 007 `rtl-fold.json` shifts | принято планом (В-1, `expanded` + `interpolate-size`) — фиксирую, не чиню | — | — |
| EXT.A-1 | A | Подмена фона + двойной pressed — как FAB.A-1 | `tok/extended-fab/_index.scss:13-26`, `extended-fab/index.vue:4,129-158` | слой + рипл | M | да → Q-2 |

Минимизация: `ui-extended-fab` было 12954 / 1448 → оценка ~6 KB / ~0.9 KB (общая FAB-карта, слой,
без переходов `padding/gap`).

## MButtonSplit
Источники: план `button/split.md` (done), QA LY-07/TS-06, REQ 003/011, `audit.spec.ts`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| SPL.A-1 | A | Внутренние углы 4 рисуются 0.08rem — см. FAM.A-3 | REQ 003, PNG `split-outlined.png` | Q-1 | — | да → Q-1 |
| SPL.B-1 | B | Loading роняет фокус правой половины в `<body>` и не возвращает (против В-6): правая получает нативный `disabled` | REQ 011 `focus-loading.json` split-trailing: during/after = BODY, `disabled: true`; `split/index.vue:31`; `audit.spec.ts` | правая — «мягко выключена» (`aria-disabled`, клик гасится в capture), как главная при loading | S | нет |
| SPL.C-1 | C | `aria-*`/`data-*` уходят на `div`-обёртку; у главной кнопки нет `type`/`tag`/`to` — нельзя сделать submit или ссылку | `audit.spec.ts` (aria-describedby на `.ui-split-button`); `split/props.ts`, `split/index.vue:7-15` | см. Q-8 | S | да → Q-8 |
| SPL.D-1 | D | `>`-селекторы и специфичность 0,3,0–0,4,0 ради перебивки `.ui-button` | `split/index.vue:143-176` | модификаторы `ui-split-button__action/--trailing` с углами из карты, без `>` | S | нет |
| SPL.D-2 | D | Шимы «снято»: `dropdownAriaLabel`, событие `dropdown` + dev-предупреждение, `variant="text"` | `split/props.ts:27-28`; `split/index.vue:71,78-79,85,89-93,100` | удалить; потребитель в playground — только `playground/render/gallery/button-split.vue` (вне фикстур, `dropdown-aria-label`) | S | нет |
| SPL.B-2 | B | `<form>`: ни одна половина не сабмитит форму (`type="button"`) — проверено | REQ 011 `form.json` (submits 0) | — | — | — |

Минимизация: `ui-split-button` было 2128 / 389 → ~1.7 KB (без `>`-дублей по плотностям).

## MButtonSegmented
Источники: план `button/segmented.md` (done), QA ST-07 (MANUAL), REQ 006/012, `audit.spec.ts`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| SEG.B-1 | B | Выбор меняет ширину: сегмент без иконки получает галочку (+26rem), соседи сдвигаются до 26rem **за кадр**, группа меняет ширину (single: −10.5, multiple: ±26) | REQ 006 `segmented-single-click-1.json` (s1 +15.4, s2 −26, s3/s4 x −10.5), `segmented-multiple-click-*.json` (±26); `segmented/index.vue:21,104` | см. Q-3 | M | да → Q-3 |
| SEG.B-2 | B | У сегментов с подписью галочка не анимируется ни на входе, ни на выходе: обёртка `v-if` появляется/удаляется вместе с галочкой (у icon-сегментов `out-in` работает, 8 кадров) | REQ 006 `icons` в `segmented-single-click-*.json` (opacity 1 сразу) vs `segmented-icons-click-2.json` | обёртка галочки всегда смонтирована (решается вместе с Q-3) | S | нет |
| SEG.A-1 | A | Подмена фона заранее смешанным цветом (выбранный — на роль, невыбранный — на `on-surface`) + рипл → двойной pressed | `tok/segmented/_index.scss:15-22,44-55`; `segmented/index.vue:12,131-143,171-215` | слой + рипл | M | да → Q-2 |
| SEG.A-2 | A | Hairline литералом `1rem` мимо карты (рамка группы и разделители) | `segmented/index.vue:87,112` | `container.outline.width: max(1px, 1rem)` в карте | S | нет |
| SEG.C-1 | C | Проп `loading` (из `makeStateProps`) ничего не делает | `segmented/props.ts:27`; `audit.spec.ts` (разметка идентична) | см. Q-12 | S | да → Q-12 |
| SEG.C-2 | C | Три одинаковых интерфейса пункта: `SegmentedItem`, `MSegmentedItem`, `MButtonGroupItem` | `useSegmentedButton.ts:18-25`, `segmented/props.ts:13-19`, `group/props.ts:12-20` | один тип, два публичных имени — алиасы | S | нет |
| SEG.D-1 | D | `useVModel` из VueUse | `segmented/index.vue:51,67-70` | `defineModel` | S | нет |
| SEG.D-2 | D | `@include forced-colors` внутри `apply-selected` → блок повторён на каждую роль (13 медиа-блоков в выходе) | `segmented/index.vue:196-213`; css-dump: forced 13 | forced-colors — один раз, вне ролей | S | нет |
| SEG.D-3 | D | Шим: ре-экспорт `MSegmentedItem` «for backwards compatibility» | `segmented/index.vue:58-59` | удалить | S | нет |

Минимизация: `ui-segmented-button` было 8964 / 1118 → оценка ~4 KB / ~0.7 KB (слой, один
forced-colors). Строки: `segmented/index.vue` 256 → ~200.

## MButtonGroup
Источники: план `button/group.md` (done), REQ 003/004/012, `audit.spec.ts`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| GRP.— | B | Гипотеза брифа «disabled-кнопка группы выглядит активной» **не подтвердилась**: `disabled` из `segmentAttrs` попадает в объявленный проп `MButton`, класс `ui-button--disabled` есть, цвета 38%/12%, слой при hover 0, `pointer-events: none` (light и dark) | REQ 004 `disabled-light.json`, `disabled-dark.json`; `audit.spec.ts` (2 теста) | — | — | — |
| GRP.B-1 | B | Клавиатура: стрелки/Home/End выбирают и пропускают disabled, RTL зеркалит — проверено. Форма — см. FAM.B-4 | REQ 004 `ltr-*.json`, `rtl-ArrowRight.json` | Q-1 | — | да → Q-1 |
| GRP.A-1 | A | Forced colors: подпись выбранной кнопки не читается — см. BTN.A-1 | REQ 012 `forced-button-group_matrix-group-tonal.png` | BTN.A-1 | — | нет |
| GRP.C-1 | C | Dev-предупреждение советует «pass `ariaLabel`», а такого пропа у группы нет (имя — атрибутом `aria-label`) | `group/index.vue:62` → `useButtonNameWarning.ts:19` | своё сообщение для группы (атрибут) | S | нет |
| GRP.C-2 | C | Публичные типы (`MButtonGroupItem`, `MButtonGroupModelValue`, `MButtonGroupVariant`) — только глубоким путём; `package.json ./types` = `shared/types/props` | `group/props.ts`; брифа §2 | заявка: реэкспорт типов семьи из публичной точки типов | S | нет (заявка) |
| GRP.D-1 | D | `useVModel` из VueUse | `group/index.vue:36,52-55` | `defineModel` | S | нет |

## MFabMenu
Источники: план `button/fab-menu.md` (done), QA `fab-menu.json` (MANUAL MO-03, ST-02/03/07, LY-07,
TH-06, EN-10; TS-05 «нет axe» — устарел, axe есть `fab-menu.e2e.ts:11`), REQ 008/012.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| FM.B-1 | B | JS-путь (нет anchor positioning): столбец по вертикали стоит по **закрытому** FAB. Comfortable (96 → 56): низ пунктов на 48rem выше FAB (надо 8) — висит на 40; compact (40 → 56): −7.9 — наезжает на FAB на 8 (ошибка 16) | REQ 008 `menu-density-comfortable-js/js-open.json` last `gapLastEntryToFab 48.1`; `…compact-js/js-open.json` −7.9; anchor-путь — 8 | `@transitionend.self` на `span` не срабатывает (переход идёт на FAB-ребёнке) — `index.vue:16`; позиция меряется один раз на `nextTick` (`usePopover.ts:228-233`). Перемер по `transitionend` самого FAB и после enter — в `fab-menu/index.vue` | S | нет |
| FM.B-2 | B | JS-путь по горизонтали: край пунктов на **23.3rem дальше** края FAB (anchor-путь — 0). Ящик в первом кадре на 24rem уже, JS-путь меряет его в этот момент | REQ 008 `*-js/js-open.json` `inlineEndDelta −23.3`, issue `drawer width +24 in one frame`; `usePopover.ts:153-156` | тот же перемер после enter (размер ящика окончательный) | S | нет |
| FM.B-3 | B | Закрытие — не обратный выезд: пункты не двигаются, гаснет весь ящик, причём на кривой **входа** (emphasized-decelerate: 48% за первый кадр). `item-leave-*` и токены `motion.item.leave.*` не играют никогда (мёртвые) | REQ 008 `*-close.json` (gap const 8, opacity 1 → 0.52 за кадр); `index.vue:291-299`; `Actions.vue:84-92`; `fab-menu/_index.scss:91-94` | закрытие играет уход пунктов (кривая выхода из карты, сдвиг 16 вниз), ящик удаляется после них; порядок каскада — Q-4 | M | частично: уход пунктов — нет; каскад — да → Q-4 |
| FM.B-4 | B | Быстрый тоггл (MO-03): иконка plus/close при повторном нажатии начинает кроссфейд заново — уходящая иконка прыгает 0.10 → 0.92; открытие посреди закрытия пересоздаёт ящик — пункты прыгают в 0 / сдвиг 16 | REQ 008 `rapid.json` (t214 → 230 icons; t414 first op 0.98 → 0, ty +15.8) | иконки смонтированы обе, состояние — классом (CSS-переход продолжает с текущего); ящик не пересоздаётся, а разворачивает уход | M | нет |
| FM.B-5 | B | Открыт с сервера (`open = true`): FAB — круг из SSR, а столбец (`client-only` + `appear`) въезжает после гидрации (§6.2.5); `isRtl` читается только при открытии | `index.vue:61-64,144-156` (по коду, пробой не мерил) | `appear` только для открытий после монтирования; направление — при каждом позиционировании | S | нет |
| FM.B-6 | B | `transition: transform` у глифа затирается inline `font-size`, `transform` у глифа никто не ставит | `index.vue:212`; `morph.ts:37` | удалить | S | нет |
| FM.A-1 | A | Открытый FAB и пункты — подмена фона (`fab-menu-surface` hover/focus/pressed); у пунктов нет рипла | `fab-menu/_index.scss:14-24`; `index.vue:248-266`; `Actions.vue:15,137-160` | слой `::before` + рипл (как семья) | M | да → Q-2 |
| FM.D-1 | D | Шимы «снято»: `size` (+ своя копия `FAB_SIZE_TO_DENSITY`), `align: left/right`, ре-экспорт `MFabMenuItem` | `fab-menu/props.ts:31-41`; `index.vue:98-99,110-111,125-130,168-169` | удалить | S | нет |
| FM.C-1 | C | `useFabMenu` — эталон escape hatch (бэги без классов) — проверено | `composables/useFabMenu.ts` | — | — | — |

Минимизация: `fab-menu` было 10032 / 1441 (index + Actions) → оценка ~5.5 KB / ~1 KB (слой, одна
схема пунктов).

## MLoading
Источники: план `feedback/loading.md` (planned, вопросы 1–2 открыты), QA `loading.json` (устарел),
REQ 010, `audit.spec.ts`. Фикстуры не было — создана `playground/fixtures/loading/{matrix,stress}.vue`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| LDG.B-1 | B | Таймер цикла expressive стартует в `setup` — на сервере тоже, и перезапускается бесконечно (на сервере нет unmount): утечка на каждый SSR-рендер expressive | `audit.spec.ts` (SSR `renderToString` + fake timers: после рендера 3 таймера, через 5 с — 2, цикл перезапускается; у circular — 0. В jsdom `IN_BROWSER` = true, поэтому в счёт попадает и интервал трекинга; `setTimeout` цикла от `IN_BROWSER` не зависит); `loading/index.vue:96-102`; `useTimer.ts:166` (`setTimeout` без `IN_BROWSER`) | старт цикла в `onMounted`; guard в `useTimer` — заявка | S | нет |
| LDG.D-1 | D | Литералы движения `1333ms`, `cubic-bezier(.4,0,.2,1)`, `$calm: 2`, `calc(4 * …)` в SFC. Системного токена нет, а `--sys-motion-*` под reduce **укорачиваются** (`base/_animations.scss:49-53`) — спиннер под reduce ускорился бы | `loading/index.vue:108-115` | см. Q-10 | S | да → Q-10 |
| LDG.A-1 | A | Размеры 16/24/32 вне M3 (48 / contained 38), `size` вместо `density` (решено в принципе, ступени ждут OQ-1) | `tok/loading/_index.scss:9-13`; `decisions.md` «Settled, migration pending» | см. Q-9 | M | СТОП → Q-9 (OQ-1 у владельца) |
| LDG.C-1 | C | `role="status"` только с `aria-label` — живой регион без текста ничего не объявляет при появлении (DT-09) | `loading/index.vue:10-11` | ждёт Q-9 | S | да → Q-9 |
| LDG.B-2 | B | `contain: strict; content-visibility: auto` пропускают отрисовку вне экрана, а rAF-морф и таймер работают | `loading/index.vue:125-126` | Предложения | — | — |
| LDG.B-3 | B | Expressive по кадрам: смена фигуры раз в ≈710 мс, морф 24–37 кадров (плавно, `d` меняется каждый кадр) — проверено; разрывы — только SHP.B-1/B-4 | REQ 010-r1 `expressive-motion.json` (morphRuns @609/1308/2043/2742) | — | — | — |
| LDG.A-2 | A | Inline в строке (LY-03): центр индикатора на 2.2rem (≈0.11em при 20rem шрифте) ниже центра строки — `vertical-align: middle` берёт базовую линию + пол x-height. Forced colors: дуга и фигура — `Highlight`, в кнопке — серые, как disabled — проверено | REQ 013 `inline-geometry.json` (indicator middle 419.4 vs text 417.2), PNG `forced-*.png`; `loading/index.vue:145` | центр по строке: `vertical-align` со сдвигом из карты (`calc` от `em`) или `text-box` — сверю по MWG `precise-text-alignment` | S | нет |

## MShape / useShapeMorph / утилиты морфа

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| SHP.B-1 | B | Reduced motion **выключает** морф: `prefersReducedMotion()` → `settle(to)`, а таймер цикла продолжает менять фигуры — под reduce фигура меняется скачком (против §6.2.6) | `useShapeMorph.ts:232`; REQ 010-r1 `expressive-reduce.json`: за 3 с `d` менялся 4 раза, каждый раз **за 1 кадр** (morphRuns frames 1), угол 0 | под reduce — переход `calm` без поворота, цикл реже; reduce — из `useReducedMotion` (одна механика) | S | нет |
| SHP.B-2 | B | С `sequence` прерывание стартует от канонической формы, а не от живого `d` → скачок, когда таймер сработал при стоящем rAF (вкладка в фоне) или сменился `transition` | `useShapeMorph.ts:227-228` | старт от живого `d` с кэшем интерполятора только для «чистых» пар | S | нет |
| SHP.B-3 | B | Угол сбрасывается в 0 при прерывании: первый тик `rotate = amplitude · v(0) = 0` | `useShapeMorph.ts:211`; REQ 010-r1 `shape-interrupt.json`: второй клик на 285 мс — угол 4.9 → **0.0** за кадр, затем снова 0 → 59 (при прерывании на пике скачок был бы ~60°) | продолжать от текущего угла | S | нет |
| SHP.B-4 | B | Качание: угол = 60° · скорость / пик; у `expressive` (перелёт 9.5%) скорость меняет знак → фигура поворачивает обратно: 0 → +60 → 0 → − → 0 | `utils/motion/shared/velocity.ts`, `expressive/transitions.ts`; REQ 010-r1 `expressive-motion.json`: угол 0 → 60 → 0 → **−6** → 0 → +1 → 0 на каждую фигуру, 7 разворотов за 4 морфа, min −5.66° | см. Q-5 | S | да → Q-5 |
| SHP.D-1 | D | `easeM3Standard` — `@deprecated`, потребителей нет, торчит в публичном автоимпорте | `useShapeMorph.ts:76-84`; `.nuxt/imports.d.ts` | удалить | S | нет |
| UTL.D-1 | D | `useReducedMotion`: модульные `let query/subscribers` — против правила 18, хотя синглтон одобрен в раунде кнопок | `composables/useReducedMotion.ts:14-16` | см. Q-11 | S | да → Q-11 |
| UTL.D-2 | D | Три механики reduced motion: `prefersReducedMotion()` (`useShapeMorph`), `useReducedMotion`, копия в `virtual-scroll/useVirtualScroll.ts:78` (не наш файл) | — | наша часть — SHP.B-1; чужая — заявка | — | нет |

---

## Шимы «снято, работает ещё релиз» — удаляются без развилки (решение 2026-10-18)

В группе (удаляю в P2, потребителей внутри кита правлю в том же изменении):

| Где | Что снято | Миграция |
|---|---|---|
| `button/icon/index.vue:36` | `variant="elevated"` (предупреждение; тип уже без него) | `filled` / `tonal` |
| `button/fab/props.ts:17-34`, `composables/button/useFabProps.ts` (целиком), `useButton.ts:24,55` | `size: sm/md/lg` у FAB и extended FAB; предупреждения `variant` `elevated/outlined/text` | `density: compact/default/comfortable` |
| `button/split/props.ts:27-28`, `split/index.vue:78-79,85,89-93,100` | `dropdownAriaLabel`, событие `dropdown`, `variant="text"` | `trailingAriaLabel`, `@trailing`, `outlined` |
| `fab-menu/props.ts:31-41`, `fab-menu/index.vue:98-99,125-130,168-169` | `size`, `align: left/right` | `density`, `start/end` |
| `fab-menu/index.vue:110-111`, `segmented/index.vue:58-59` | ре-экспорт типов «for backwards compatibility» | импорт из `./props` |
| `composables/useShapeMorph.ts:76-84` | `easeM3Standard` | `{ transition: 'standard' }` |

Чужие группы на `composables/button/useRetiredValueWarning.ts` (снимают владельцы групп; файл удалю,
когда скажет оркестратор): avatar `size`; card `variant` `tonal/text`; date-picker и dialog/date
`headline`; expansion-panel `loading`; list/item `loading`; text-field `type="number"`, `populated`;
`useFieldShape` `rounded`; time-picker `mode` `dial/keyboard`, `is24h`.

---

## Развилки (решает оркестратор по рекомендации; СТОП — владельцу)

**Q-1 (семья): где круглую форму заменить конечным радиусом.** Сейчас «круг» = 999rem. Браузер
рисует не больше половины высоты, поэтому пружина 999 → 12 видна только в самом конце (снап), а у
split и крайних кнопок группы маленькие внутренние углы сплющиваются в ноль. Конечный радиус =
половина высоты ступени (`calc(высота / 2)` в карте).
1. Только там, где форма морфится или углы смешаны: toggle `MButton`/`MButtonIcon`, кнопки
   `MButtonGroup`, половины split, открытый FAB menu. Обычные кнопки остаются 999. В покое ничего не
   меняется; двухстрочная toggle-кнопка станет скруглённым прямоугольником (редкость). Так делает
   Compose: «full» = 50% меньшей стороны, а не бесконечность. **(рекомендую)**
2. Все кнопки семьи на конечный радиус. Одно правило, но любая обычная кнопка с переносом подписи
   перестанет быть пилюлей — видимое изменение по всему киту и у соседей (`pagination`, `breadcrumbs`).
3. Оставить 999, чинить только статические углы split/группы. Морф остаётся снапом — против §6.2.

**Q-2 (FAB, extended FAB, segmented, FAB menu): нажатие — только рипл.** Сейчас hover/focus/pressed
этих компонентов — подмена фона готовым смешанным цветом, а при нажатии к фону 12% добавляется ещё
рипл (двойное нажатие). У `MButton` это уже убрано: слой `::before` в цвете контента + рипл.
1. Как у `MButton`: слой (hover 8, focus 10), нажатие — только рипл; пунктам FAB menu добавляется
   рипл. Одна механика в семье, ~−40 строк токенов, выходной CSS этих компонентов примерно вдвое
   меньше. Видимое: нажатие светлее на 12% фона. **(рекомендую — `craft.md` «The background swap»,
   решение по `MButton`)**
2. Слой, но pressed 12% остаётся на слое вместе с риплом — ближе к сегодняшнему виду, двойное нажатие
   остаётся.
3. Оставить подмену фона.

**Q-3 (segmented): ширина при выборе.** Галочка добавляет 26rem выбранному сегменту, соседи и группа
прыгают за кадр.
1. Как M3 (material-web: `grid-auto-columns: 1fr`; Compose: `weight(1f)`): сегменты равной ширины,
   ширина считается с местом под галочку, место под галочку внутри сегмента раскрывается плавно (как
   `__graphic` у material-web) — подпись сдвигается внутри своей кнопки, соседи и группа стоят.
   Видимое: короткие сегменты станут шире. **(рекомендую — паритет M3, «раскладка не едет от
   состояния»)**
2. Ширины остаются по содержимому, но каждый сегмент без иконки заранее держит место под галочку
   (невидимый двойник). Вид почти прежний, сегменты без иконок шире на 26.
3. Анимировать ширину сегмента — соседи всё равно едут.

**Q-4 (FAB menu): порядок ухода пунктов при закрытии.** Уход пунктов чиню без вопроса (сейчас
гаснет весь ящик на кривой входа). Вопрос — каскад.
1. Обратный каскад: первым уходит дальний от FAB пункт, последним — ближний, на кривой выхода и
   задержке `stagger` из карты; FAB морфится назад параллельно. Зеркало открытия. **(рекомендую — по
   памяти так закрывается `FloatingActionButtonMenu` в Compose (стаггер и на выходе); сверю с
   исходником при реализации)**
2. Все пункты уходят одновременно (без каскада) — короче, проще прерывать.

**Q-5 (MShape / MLoading): обратный поворот фигуры.** Угол фигуры следует за скоростью пружины, а
пружина с перелётом меняет знак скорости — фигура качается туда-обратно (0 → +60 → 0 → − → 0).
1. Угол только в одну сторону: модуль скорости (0 → +60 → 0), в покое по-прежнему 0°. Одна
   «отдача», без хода «не в ту сторону». **(рекомендую — минимальная правка в рамках «JS-пружины как
   есть», §6.2.4)**
2. Накопительное вращение (как глобальный поворот `LoadingIndicator` в Compose): фигура всё время
   вращается в одну сторону. Меняет характер движения и свойство «в покое 0°».
3. Оставить как есть.

**Q-6 (useButton): классы в композабле и внутренние хелперы в автоимпорте.** `useButton` отдаёт
BEM-классы, а `composables/**` автоимпортируется потребителю (туда же попадают `useButtonNameWarning`,
`useRetiredValueWarning`, до удаления — `useFabProps`).
1. `useButton` — внутренняя фабрика семьи: перенос в `utils/button/` (не автоимпорт), классы
   остаются. Escape hatch у кнопки — нативный `<button>`. **(рекомендую — «интернал должен остаться
   internal», меньше всего правок)**
2. `useButton` остаётся публичным, но без классов: отдаёт состояние и бэги атрибутов, классы строят
   компоненты. Честный escape hatch, но 3 компонента собирают классы сами.
3. Оставить как есть.

**Q-7 (конфликт двух решений): выбранная text-toggle отличается только цветом.** В-7 (text-toggle =
standard icon button) против правила «состояние никогда не только цветом».
1. Дать `MButton` слот-проп `{ selected }` (как у `MButtonIcon`) и в документации/фикстурах показывать
   смену глифа; правило выполняет потребитель глифом — так делает и M3 у standard icon toggle.
   **(рекомендую — M3: залитый/контурный глиф, ноль нового вида)**
2. Выбранной text-toggle дать контейнер (`<role>-container`) — вид, которого нет в M3.
3. Запретить `selected` при `variant="text"` у `MButton` (у M3 нет text toggle), icon-standard оставить.

**Q-8 (split): как достучаться до главной кнопки.** Сейчас `aria-*`/`data-*` ложатся на обёртку, а
`type`/`tag`/`to` главной кнопке не передать.
1. `inheritAttrs: false`: `class`/`style` — на корень, остальное — на главную кнопку; плюс типизированные
   `type`/`tag`/`to` как у `MButton`. Подсказки IDE, submit и ссылка работают. **(рекомендую — DX,
   паритет с `MButton`)**
2. Только перенаправление атрибутов (без новых пропов) — `type`/`to` дойдут как атрибуты, но без типов.
3. Оставить.

**Q-9 (СТОП — OQ-1 владельца): `MLoading` density и ступени.** `size` → `density` решено в принципе,
ступени ждут OQ-1 (`axes.md`). План: compact 24 / default 48 / comfortable 64 (default = M3); вместе с
этим — contained-вариант и живой текст вместо `aria-label` (DT-09). Без ответа API `MLoading` не трогаю;
делаю только поведение (LDG.B-1, SHP.*).

**Q-10 (правило в docs/system): константы бесконечной анимации.** Дуга circular — константы
спецификации (1333 мс, `cubic-bezier(.4, 0, .2, 1)`), системного токена нет, а `--sys-motion-*` под
reduce укорачиваются — спиннер ускорился бы.
1. Константы — в карте компонента (`motion: (arc: 1333ms, easing: …)`) с источником M3; правило
   «константы цикла бесконечного индикатора — в карте компонента, не системные длительности» — в
   `docs/system`. **(рекомендую)**
2. Вывести из `--sys-motion-*` через `calc` — под reduce крутится быстрее.
3. Системный токен — СТОП (новых системных токенов нет).

**Q-11 (правило 18 против одобренного синглтона): `useReducedMotion`.**
1. Оставить модульный синглтон (один слушатель на всех; пишется только на клиенте после монтирования,
   сервер его не трогает) и записать исключение в `decisions.md`. **(рекомендую)**
2. Перенести состояние в `useState` + клиентский плагин — без модульного `let`, но больше кода и
   плагин в чужом каталоге.

**Q-12 (segmented): проп `loading` без эффекта.**
1. Удалить (ломающее для TS-потребителей; миграция — убрать проп). **(рекомендую — «пропы без эффекта
   удаляются»)**
2. Реализовать (спиннер вместо галочки у выбранного?) — заказчика нет.

---

## Предложения сверх паритета (не шаги)

| Предложение | Выигрыш | Заказчик | Цена | Рекомендация |
|---|---|---|---|---|
| `v-model:open` у split (как у FAB menu) | управляемое меню (аналитика, тесты) | нет | S | отложить |
| Пауза морфа `MLoading` вне экрана (`IntersectionObserver` / `content-visibility` событие) | нет rAF/таймеров на невидимых индикаторах | таблицы со многими индикаторами | S | после Q-9 |
| Стаггер FAB menu через `sibling-index()` вместо inline `--ui-fab-stagger` | меньше inline-стилей | — | S | нет: Baseline с 2026-08, нужен фолбэк — выигрыш мал |
| Настраиваемые тайминги морфа (`SHAPE`, `COLOR`, `CALM` — константы модулей) | «мы должны этим манипулировать» | нет | M | отложить до заказчика |
| `disabledReason`, `hotkey`, подтверждение на месте (из плана `MButton`) | — | см. план | M | без изменений: не одобрены |

## Заявки на чужие файлы

1. `assets/stylesheet/abstracts/_functions.scss:207` (`m3-button-scheme`): disabled-контент
   `$on-surface-variant` → `$on-surface` (M3 tokens; FAB уже так) — BTN.A-2.
2. `composables/useTimer.ts:166`: не запускать `setTimeout` при `!IN_BROWSER` (на сервере таймер
   вечный при `repeat`) — LDG.B-1; свою часть (старт в `onMounted`) делаю сам.
3. Публичная точка типов (`shared/types/props` / `package.json ./types`): реэкспорт `MButtonGroupItem`,
   `MButtonGroupModelValue`, `MButtonGroupVariant`, `MSegmentedItem`, `MFabMenuItem`, `MButtonShape`,
   `MButtonDensity` — GRP.C-2.
4. `virtual-scroll/useVirtualScroll.ts:78` — своя копия чтения reduced motion → `useReducedMotion`
   (UTL.D-2; владелец virtual-scroll).
5. `useClickOutside` (EN-10 FAB menu): слушает документ и в закрытом состоянии — нужна пауза.
6. `navigation`/`toolbar/index.vue:142-143` эмулирует выбор сменой `variant` без `selected`/`aria-pressed`
   (вне объёма — сообщаю).
7. `pagination/index.vue:188-191,209`, `fragments/breadcrumbs/item/index.vue:77-84` лезут во
   внутренности `.ui-button` (специфичность 0,2,0, литерал `8rem`) — при Q-1 вариант 2 и при снижении
   специфичности (BTN.D-1) их надо сверить; при варианте 1 не задеваются.
8. Рестарт/«touch» `playground/app/utils/fixtures.ts` после новых фикстур (уже сделано дирижёром).

## Что не удалось проверить

- Типы `MShape` (пропсы объявлены type-based в SFC) в IDE потребителя после `nuxt-module-build`.
- Скринридеры (NVDA/VoiceOver), зум 200/400%, text spacing (TS-06, CT-06) — нет инструмента.
- Firefox/Safari: путь без `interpolate-size` и без anchor positioning — только эмуляция JS-пути в
  Chromium (stub `CSS.supports`).
- Контраст 3:1 края outlined (TH-03) и сегментов (ST-07) по палитрам docs — скриншоты есть только в
  теме playground (монохромная).

## Modern Web Guidance

- `animate-to-intrinsic-sizes` — «`interpolate-size`/`calc-size()` — прогрессивное улучшение, Chrome
  only; keyword-to-keyword не интерполируется». Объяснило «качание» extended FAB: `auto` считается от
  живого содержимого, из которого подпись уже ушла. Направление фикса EXT.B-1 — анимировать подпись,
  а не бокс.
- `animate-element-entry-exit` — «exit — переход к скрытому состоянию до удаления узла». Причина
  FM.B-3: пункты удаляются вместе с ящиком, их leave не успевает начаться.
- `physics-based-easing` — `linear()` — Baseline widely; «пружину лучше вешать на transform/opacity».
  Наш морф двигает `border-radius/width/height` — решение владельца, оставляю; новых пружин не будет.
- `motion`, `spinner` — «reduced motion замедляет, а не останавливает». Подтвердило SHP.B-1 (морф под
  reduce сейчас выключен) и Q-10 (системные длительности под reduce укорачиваются — спиннер нельзя на
  них сажать).
- `dynamic-sibling-animations` — `sibling-index()` Baseline только с 2026-08 → не меняю inline-стаггер
  (Предложения).
- `animate-to-from-top-layer` — `overlay` в списке перехода нужен, если popover уходит из top layer до
  конца анимации; в JS/anchor-путях FAB menu ящик удаляется Vue после leave — сверю при FM.B-3.
- `reduce-style-repetition` — CSS `@function` не применяю: zero-runtime, генерация в Sass (`decisions.md`).
