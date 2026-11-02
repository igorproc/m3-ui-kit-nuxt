# Navigation — аудит планов

Итог: сделано 49 · частично 18 · нет 10 · регресс 0 · отменено 5 (по пунктам, 82).
Из 10 «нет» восемь — шаги «Документация» (вне кита: `ui/docs/server/data/en/*.json` от июня с
`labelVisibility` / `permanent` / `fabIcon` / `variant`; страницы `ui/docs_v3/content/en/components/*`
не упоминают `scrollBehavior`, `hierarchy`, `scheme`, `iconPlacement`, `pageLabel`, `toggleAttrs`).
Все 48 проб прошли (измерения, `expect.soft`), окно 1280 → 1rem = 0.667px.

## navigation/app-bar.md — тег `planned` → факт `частично` (тег неверен) [занят]
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | токены: отступ 4, шрифты по размерам, цвет trailing | сделано | `assets/.../app-bar/_index.scss:33,55-66,81`; проба `app-bar.probe.ts › typography` — small 22/28 + 12/16, medium 28/36 + 14/20, large 36/44 + 16/24; padding 4; заголовок 16 от края / 52 с кнопкой; actions = on-surface-variant | — |
| Ш2 | ландмарк и заголовок (A11-01) | сделано | `ssr.probe.ts › app bar` — корень `HEADER`, `h1` в серверном HTML; `tag` header/div/section. `headingLevel` без дефолта — решение B3.6b (`decisions.md:117`) | — |
| Ш3 | перенос flexible-заголовка + тултип у small (CT-02) | сделано | `ssr.probe.ts` — длинный medium: заголовок 2 строки (48px = 2 × 36rem), бар 148rem, без JS; тултип `title/index.vue:69-80`, в серверном HTML 0 тултипов | — |
| Ш4 | сворачивание medium/large | сделано | `ssr.probe.ts` — JS выключен, прокрутка 600px: large 120 → 64rem, копия заголовка opacity 1 (scroll-driven, W65-В) | — |
| Ш5 | начальная прокрутка вне раскладки + safe-area (RS-09) | частично | `windowY` — **чинит родитель**; проба `app-bar.probe.ts › reload` не показательна (Nuxt сбрасывает scrollY в 0). Safe-area только у зоны layout (`utils/layout/carve.ts:128-133`), у бара вне `m-layout` выреза нет | S |
| Ш6 | `center-aligned` / предупреждение о center у medium/large | сделано | `center-aligned` удалён (без шимов), warn `app-bar/index.vue:116` | — |
| Ш7 | документация (DC-01…05) | нет | `docs/server/data/en/app-bar.json` (25.06), docs_v3 без `scrollBehavior` | M |
| Т | переходы литералами `var(--sys-motion-*)` в `.vue`, не через `g()` | частично | `app-bar/index.vue:~185-194` (файл правит родитель, строки плывут) | S |
Токены: совпадают 7 из 8; расхождение — рецепт аватара 32 (только документация).

## navigation/breadcrumbs/index.md — тег `planned` → факт `частично` (тег неверен) [занят]
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш4 | вес текущей + forced colors; кольцо в scroll; перенос в wrap; прокрутка к текущей + маска края | сделано | `pagination-crumbs.probe.ts › breadcrumbs` — текущая 700 (план 500 → `decisions.md:175`), scroll: padding 5rem + margin −5rem, `scrollLeft` 459 на открытии, wrap: `scrollWidth = clientWidth` у неразрывного имени; `forced-focus.probe.ts › crumb` — ссылка LinkText + underline, disabled GrayText, текущая CanvasText 700 | — |
| Ш5 | токены и мишень 48 (TK-02, RS-12) | частично | `touch-target(block)` — проба `› coarse`: `::after` 48rem по блоку. Перекрытие соседей отрицательным margin на таче — **чинит родитель**: в рабочем дереве уже `margin-block: 0` под `pointer: coarse` (`breadcrumbs/index.vue:154-157`, В1-Б). `calc(-1 * …)` в `.vue` (`:146`) вместо карты | S |
| Ш6 | документация | нет | вне кита (docs_v3 без новых решений) | S |
Токены: совпадают 2 из 2.

## navigation/breadcrumbs/item.md — тег `planned` → факт `сделан` (тег неверен) [занят]
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш2 | три ветки (ссылка / текущая 700 / disabled 38%), различимы в forced colors | сделано | `fragments/breadcrumbs/item/index.vue:79-118`; пробы выше | — |

## navigation/breadcrumbs/divider.md — тег `planned` → факт `сделан` (тег неверен)
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Т1 | литералы → карта, иконка 18, зеркалирование, `aria-hidden` | сделано | `breadcrumbs/_index.scss:45-48` (18rem), `divider/index.vue:4-9` (`MIcon mirror`, Q27-А); проба — `li` `aria-hidden="true"`, 12px = 18rem | — |
Токены: совпадают 1 из 2 — план пишет цвет `on-surface-variant` «без изменений», в коде и в HEAD `outline`: неверно описание плана, не код.

## navigation/navigation-bar.md — тег `planned` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | точечные пути, разделение цветов, `spacing()` | частично | пути точечные, цвета разделены (проба: иконка = on-secondary-container, подпись = secondary); литералы `rem` вместо `spacing()` — `navigation-item/_index.scss:16-91` (TK-02) | S |
| Ш2 | индикатор + слой состояния, кольцо на таблетке, forced colors | сделано | `bar-rail.probe.ts › bar` — таблетка 64×32, hover 0.08, pressed 0.12, hover неактивного → on-surface; `forced-focus.probe.ts` — таблетка Highlight, иконка HighlightText, disabled GrayText | — |
| Ш3 | контейнер 64, surface-container, плоский | сделано | проба: 64rem, `surface-container`, radius 0, без тени (Q22-А) | — |
| Ш4 | safe area, подпись в 2 строки, бейдж логически | частично | 2 строки: `audit-rail-toggle › bar-stress` (6 пунктов, 360) — бар растёт до 80rem, подпись 32rem, переполнения нет; бейдж — e2e `navigation.e2e.ts:161-184` (LTR/RTL). Safe area только через зону layout (`carve.ts:128-133`), у самого бара `env()` нет | S |
| Ш5 | ссылки (`to`, `aria-current`), `badgeLabel`, имя landmark, клавиатура | частично | **`to` нет**: пункт всегда `<button>` (`fragments/navigation-item/index.vue:2-18`, `types.ts:8-24`), проба: `tagName BUTTON` (A11-01 открыт). `badgeLabel` через `aria-describedby` — e2e `:205-211`; roving убран — проба `› keyboard` (стрелки/Home/End инертны) | M |
| Ш6 | `iconPlacement: 'start'` + поля Centered | сделано | проба `› start placement`: таблетка 40rem, поле 72rem = 15% от 480 (4 пункта), 3 пункта → 20% | — |
| Ш7 | движение индикатора на токенах | сделано | `transition-property`: `left, right, opacity` у `::after`, `color` у пункта — без `all` | — |
| Ш8 | `activeIcon` / залитый глиф (S7) | сделано | `ssr.probe.ts` — активный рисует `baseline-send` уже на сервере; `types.ts:17` | — |
| Ш9 | общий пункт для bar/rail/drawer | сделано | `components/fragments/navigation-item/` (W59-В) | — |
| Ш10 | документация | нет | `docs/server/data/en/navigation-bar.json` ещё с `labelVisibility` | S |
| О | dev-предупреждение вне 3–5 пунктов | нет | `navigation-bar/index.vue:33-72` — проверки числа пунктов нет | S |
| Тесты | фикстуры matrix + stress, e2e forced colors / safe area | частично | stress-фикстуры не было (добавлена аудитом `navigation/audit-rail-toggle.vue`); в `navigation.e2e.ts` нет forced colors и safe area | S |
| А | таблетка 56×32 | отменено | 64×32 — B5.3a, `decisions.md:110` | — |
| А | `ariaLabel` без дефолта + dev-warn | отменено (warn) | без дефолта — да; предупреждение снято B8.5 (`decisions-G3.md:12`) | — |
Токены: совпадают 18 из 18 (таблетка 64×32 по решению владельца).

## navigation/navigation-drawer.md — тег `planned` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | токены: цвет, поля 12, ширина 360 / 240 / 100% − 56, логические углы | частично | `drawer.probe.ts › surface` — 360rem, `surface-container-low`, поля 12rem, радиус 16 только на внешнем крае, тень 1; литералы вместо `spacing()` (`navigation-drawer/_index.scss:9-67`) | S |
| Ш2 | прокрутка + safe area | сделано | проба: `__content` scrollHeight 1528 > 752, `overscroll-behavior: contain`, шапка не двигается, страница не прокручивается; `env(safe-area-inset-*)` в `_index.scss:11-17` | — |
| Ш3 | сторона и выезд (`start`/`end`) | сделано | проба `› slides … (rtl)`: поверхность едет 1268 → 1028px (справа), скругление слева; LTR −240 → 0 | — |
| Ш4 | `#activator` с `aria-controls`, `defineEmits<MOverlayEmits>` | сделано | `ssr.probe.ts › drawer` — `aria-haspopup=dialog`, `aria-expanded=false`, `aria-controls`; `props.ts` `MNavigationDrawerEmits extends MOverlayEmits` | — |
| Ш5 | reduced motion без локального `0s` | сделано | проба `› reduced`: `--sys-motion-duration-medium-4` = 100ms, выезд 7 кадров вместо 21 — укорочен, не выключен; фокус возвращается на триггер | — |
| Ш6 | пункт drawer: таблетка 56, ссылка с `aria-current`, бейдж-текст, секции | частично | таблетка 56 на всю строку, секции `role=group`, разделитель — e2e `drawer.e2e.ts`; проба: заголовок секции 14/20 on-surface-variant. Пункт — `<button>`, `to` нет (как у бара) | M |
| Ш7 | роль drawer | сделано | решение W61-А: остаётся модальным baseline (`decisions.md:168`) | — |
| Ш8 | документация | нет | `navigation-drawer.json` всё ещё с permanent/persistent | S |
| CT-13 | `ariaLabel` + dev-warn без имени | отменено | B8.5 (`decisions-G3.md:12`): без дефолта и без предупреждения | — |
Токены: совпадают 12 из 12 (ветка `standard.*` не нужна по W61-А).

## navigation/navigation-rail.md — тег `planned` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | числа в карту, ветки, без литералов | частично | пункт — в карте; в `.vue` остались `transition: width var(--sys-…)` (`navigation-rail/index.vue:163`) и `calc(100dvh − …)` (`:171`) вместо `g()`; `spacing()` нет | S |
| Ш2 | пункт в потоке, 2 строки / многоточие, label-medium/large без смены веса | сделано | `bar-rail.probe.ts › rail` — пункт 64rem, таблетка 56×32, подпись 12/16/500; развёрнутый: таблетка h56 по содержимому (108rem), 14/20/500, secondary; абсолютных координат в `fragments/navigation-item` нет | — |
| Ш3 | слой `::before`, pressed, кольцо на таблетке, disabled, цвета M3 | сделано | общий пункт (пробы bar); e2e `navigation.e2e.ts:51-64` — hover на активной не тускнит | — |
| Ш4 | поля 44, промежутки 4 / 0, прокрутка списка, safe area | частично | проба: padding 44rem, gap 4rem, длинный список скроллится, Tab до 20-го пункта держит его в окне. **Кольцо фокуса первого/последнего пункта развёрнутого рейла обрезано**: список `overflow-y: auto`, gap 0, без `padding-block` — над таблеткой 0rem, кольцо выходит на 4.5rem (`forced-focus.probe.ts`; `fragments/navigation-rail/content.vue:80-102`, `navigation-rail/_index.scss:40`) — IN-05 | S |
| Ш5 | `#header` + `v-model:expanded`, атрибуты кнопки | сделано | `audit-rail-toggle`: `aria-controls` → `ui-navigation-rail__list`, `aria-expanded` false → true | — |
| Ш6 | ширина развёрнутого | сделано | 256rem (W64-А) | — |
| Ш7 | `mode: modal / dismissible` | сделано | e2e `navigation.e2e.ts:239-273`; `ssr.probe.ts` — модальный рейл 96rem в сетке, диалога в серверном HTML нет | — |
| Ш8 | движение на токенах | сделано | ширина 96 → 184 → 223 → 241 → 253 → 256rem (`transition-property: width`), подпись — `animation` 0.3s; reduced motion → 0.1s у обоих | — |
| Ш9 | `to`, `badgeLabel`, клавиатура | частично | `to` нет (общий пункт — `<button>`); стрелки/Home/End инертны в LTR и RTL (W56-А) — проба `› keyboard` | M |
| Ш10 | документация | нет | `navigation-rail.json` с `fabIcon` | S |
| Тесты | e2e в каждом режиме + forced colors, reduced motion | частично | forced colors / reduced motion в `navigation.e2e.ts` нет (проба `forced-focus` — forced colors ок) | S |
| А | контейнер `surface` | отменено | `surface-container` — Q22-А (`decisions.md:110`) | — |
Токены: совпадают 21 из 21.
Замечание вне плана: вне `m-layout` рейл всегда `height: calc(100dvh − inset)` (`index.vue:171`) и игнорирует высоту контейнера (фикстура 480rem → рейл 1200rem).

## navigation/pagination.md — тег `planned` → факт `сделан` (тег неверен; не сделаны только доки)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш6 | табличные цифры + `min-width`; `aria-disabled` на краю; RTL-шевроны; forced colors + вес; `pageLabel`; токены + мишень 48 | сделано | `pagination-crumbs.probe.ts`: ширина ряда 400.2rem на 998 / 999 / 1000, `tabular-nums`, кнопка 40rem, текущая 700 / прочие 500; 6× Enter на «Next» → стр. 5, фокус на «Next», `aria-disabled=true`, нет `disabled`; шеврон `scale: -1 1` только в RTL; forced: текущая Highlight; coarse: `::after` 48rem, gap 8rem — мишени смыкаются; `props.ts:38` `pageLabel` | — |
| Ш7 | документация | нет | вне кита | S |
Токены: совпадают 3 из 3. Расхождение с текстом решения: `decisions.md:176` — кнопка страницы растёт «только по блочной оси», в коде `@include touch-target;` = обе оси (`pagination/index.vue:294`); перекрытия нет (проба), но код ≠ запись.

## navigation/tabs.md — тег `planned` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | токены: точечные пути, угол в карте, ветки | частично | ветки primary/secondary/scrollable/stacked есть; **hairline `list.border.width: 1rem`** (`tabs/_index.scss:16`) вместо `max(1px, 1rem)` (`decisions.md:212`) — в Chromium computed 1px даже при окне 360 (Chromium округляет вверх), в других движках линия бледнеет; литералы вместо `spacing()` | S |
| Ш2 | 64 для иконки с подписью, `title-small`, раскладка | сделано | `tabs.probe.ts › heights` — 48 / 64 / secondary 48rem, 14/20/500, подпись на 9rem над низом (индикатор 3 её не касается); вместо `min-width: 0` — W54-А: ряд в карточке 280 скроллится (277rem), вкладки не сжимаются | — |
| Ш3 | pressed, focus-слой, цвета по состоянию, disabled ролями, `aria-disabled` | сделано | проба: hover 0.08 + on-surface, pressed 0.12, disabled opacity 1 + цвет 38%, `aria-disabled=true`; forced: disabled GrayText | — |
| Ш4 | скользящий индикатор по ширине содержимого | частично | anchor-индикатор = ширина содержимого (34.5 = 34.5rem), едет `inset-inline` 0.3s (42 → 181 → 220 → 244 → 254px), в SSR без JS тоже есть; **минимум 24 не обеспечен** — `tabs/index.vue:166` `inset-inline: anchor(start) anchor(end)` без `min-inline-size` | S |
| Ш5 | scrollable и переполнение | сделано | проба: отступ 52rem, мин. 90rem, активная «December» в видимой зоне с первого кадра (SSR: `scrollLeft` 585) | — |
| Ш6 | имя tablist, панель default-слота, RTL, фокус по реестру | сделано | проба `› keyboard`: LTR → Two, Three, Two, End Three, Home One, ← Three; RTL → Three, Two, Three, Three, One, Two; disabled пропускается; `aria-controls` ведёт в существующий id; `control.ts:48-84` | — |
| Ш7 | вкладки-маршруты | сделано | проба: корень `NAV`, 0 tablist, 2 ссылки, `aria-current` (W55-А) | — |
| Ш8 | secondary | сделано | индикатор 2rem на всю вкладку, активная on-surface | — |
| Ш9 | бейдж, `badgeLabel`, слот `#tab`, починить демо доков | частично | бейдж `aria-hidden` + описание (`fragments/tabs/tab-content/index.vue:9-31`), `#tab` в `props.ts:53`; демо `ui/docs/app/components/mix/MixNavigation.vue:11-12` всё ещё `#item` (вне кита) | S |
| Ш10 | документация | нет | `tabs.json` с несуществующим `variant` | S |
| А | `activeIcon` / залитый глиф активной вкладки (S7, остаток W70-А) | нет | проба: активная рисует `outline-send`; `tab-content/index.vue:7` `<MIcon :name="icon" />` без `filled`; `MTabItem` (`props.ts:18`) без `activeIcon` | S |
| Тесты | forced colors, reduced motion в e2e | частично | `tabs.e2e.ts` без forced colors / reduced motion (проба — индикатор Highlight) | S |
Токены: совпадают 13 из 15; расхождения — hairline и минимум 24 (строки выше).

## navigation/toolbar.md — тег `planned` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | выбор виден и объявлен | сделано | `toolbar.probe.ts › selection` — `aria-pressed=true` + `--selected` + secondary-container у Italic / Align center / Grid, уже в SSR. Остаток риска: `hasModel` вычисляется один раз (`toolbar/index.vue:93`) — модель, привязанная позже или с начальным `undefined`, выбор не включит | — |
| Ш2 | токены docked / floating, `transition` без `all` | сделано | проба: floating 64rem, поля 8, gap 4, full; docked 64rem, поля 16, gap 4, угол 0, без тени; `transition-property: background-color, color` | — |
| Ш3 | APG Toolbar (A11-08, A11-06, A11-02) | частично | `role=toolbar`, имя, `aria-orientation` у вертикального, `aria-pressed` — есть; **roving / стрелки / Home/End нет**: проба — все пункты Tab-стопы (`tabindex` null), ArrowRight/End/Home не двигают фокус (B5.6d, `decisions.md:112`) | M |
| Ш4 | строгий `MToolbarItem` + `#item` | сделано | `toolbar/props.ts:14-23`, `index.vue:15-18` | — |
| Ш5 | значения `type` | сделано | `floating \| docked` без алиасов (Конфликт №3, `decisions.md:174`) | — |
| Ш6 | vibrant + `#fab` | сделано | проба: vibrant primary-container, выбранный на нём surface-container; FAB 56rem в 8rem от панели | — |
| Ш7 | переполнение в меню | сделано | `maxVisible` → «⋮» `aria-haspopup=menu`, пункты `menuitemradio` с `aria-checked`, disabled `aria-disabled`, Esc возвращает фокус на «More views»; без `maxVisible` ряд 200rem скроллится. Меню собрано из сырых `<button class="ui-menu__item">`, не `MMenuItem` (`fragments/toolbar/overflow.vue:17-40`) | — |
| Ш8 | forced colors выбранного | сделано | `toolbar/index.vue:306-312`, e2e `toolbar.e2e.ts:132` | — |
| Ш8 | safe-area у docked | отменено | `decisions.md:174` — вырез отдаёт зона layout | — |
| Ш9 | тесты | сделано | `toolbar/tests/{variants,interaction,a11y}.spec.ts`, `toolbar.e2e.ts` | — |
| Ш9 | документация | нет | `toolbar.json` (25.06), docs_v3 без `scheme` | S |
Токены: совпадают 7 из 7.
**S9 (owner-questions.md:14, без ответа): `layout` → `orientation`** — `toolbar/props.ts:25` (`MToolbarLayout`), `:32` (проп), `toolbar/index.vue:7` (`aria-orientation`), `:145` (класс `--layout-*`), `:196` (размещение меню), `:202-203` (dev-warn), `:272-285` (стили `--layout-horizontal/vertical`); тесты `tests/a11y.spec.ts:64-65`, `tests/variants.spec.ts:66-78`; фикстура `playground/fixtures/toolbar/matrix.vue:40`.

## Регрессии
Нет. Сравнение — прошлый аудит `plans-audit_2026-10-23.md`, итоги `sweep-run-2_2026-10-24.md`, e2e: всё, что там отмечено сделанным, пробами подтверждается.

## Планы с неверным статусом (тег → факт, одна строка почему)
- app-bar `planned` → частично: токены, ландмарк, перенос, сворачивание, тултип сделаны; остались windowY / safe-area / доки.
- breadcrumbs/index `planned` → частично: Ш1–Ш4 сделаны, Ш5 дочинивает родитель, доки нет.
- breadcrumbs/item, breadcrumbs/divider `planned` → сделан.
- navigation-bar, navigation-rail, navigation-drawer `planned` → частично: общий пункт, M3-геометрия, режимы есть; нет `to` (ссылок) и доков.
- pagination `planned` → сделан (кроме доков).
- tabs `planned` → частично: всё по W53–W55, нет залитой иконки, hairline, минимума 24.
- toolbar `planned` → частично: всё, кроме клавиатуры APG.

## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные
Все открытые вопросы планов группы закрыты решениями (Q22-А, Q23-А, W53–W68, B8.5, B3.6b). Без ответа владельца — только S9 (рекомендация в вопросе есть, «А»), место правки — строкой выше в toolbar.
Новые, без решения (выявлены аудитом):
1. `to` у пунктов bar/rail/drawer. Планы требуют ссылок (A11-01), решения W59-В / W62-В о них молчат, пункт сделан кнопкой. Варианты: А — `to` в `NavigationDestination` → `NuxtLink` с `aria-current`, как у `MTab` (M); Б — записать в `decisions.md`, что навигация кита — кнопки + `@select`, маршрут ведёт приложение (S).
2. Минимум 24 у индикатора вкладок: А — `min-inline-size` у `&-content` или `max()` в `inset-inline`; Б — принять (подписи короче 24 редки).

## Пункты в занятых родителем файлах
- app-bar Ш5: `windowY` — **чинит родитель**; safe-area бара вне `m-layout` (`components/ui/app-bar/**`, `utils/layout/carve.ts`) [занят].
- app-bar Т: литералы переходов в `app-bar/index.vue` [занят].
- app-bar, известные дефекты — **чинит родитель**, пробой не проверялись: SSR-модификатор подзаголовка у составного `MAppBarTitle`; вклад бара в зону внутри `m-layout-main`.
- breadcrumbs Ш5: перекрытие соседей на таче — **чинит родитель** (в рабочем дереве уже `margin-block: 0`, `breadcrumbs/index.vue:154-157`); `calc(-1 * …)` в `.vue` (`:146`) [занят].
- bar Ш4 / app-bar Ш5: safe-area идёт через `utils/layout/carve.ts` [занят].

## Пробы (файл → тесты → прошло/упало, ключевые измерения)
Папка `playground/probes/plans-audit-2/navigation/`, общий хелпер `_shared.ts`. Прогон всей папки: 48 / 48 прошло (1.5 мин).
- `bar-rail.probe.ts` → 11 → 11 прошло: бар 64rem, таблетка 64×32, start-таблетка 40, поля 15% / 20%; 6 пунктов на 360 → 80rem, 2 строки; рейл 96 / 256, пункт 64, таблетка 56×32, padding 44, gap 4; список скроллится, 19× Tab → «Section 20» в окне; стрелки инертны (LTR/RTL); раскрытие ширины плавно 96 → 256, reduced motion 0.3 → 0.1s; `aria-controls` → список.
- `tabs.probe.ts` → 8 → 8: 48 / 64; индикатор = ширина содержимого и едет; pressed 0.12; RTL-стрелки зеркалятся, Home/End; scrollable 52 / 90, активная видна; route → `NAV`; активная иконка `outline-*`; border 1px (1rem).
- `toolbar.probe.ts` → 5 → 5: docked / floating 64, поля 16 / 8, gap 4; выбор `aria-pressed` + secondary-container; стрелки не работают, каждый пункт — Tab-стоп; меню «⋮».
- `pagination-crumbs.probe.ts` → 7 → 7: ряд 400.2rem на 998–1000; фокус на краю сохраняется; `scale: -1 1` в RTL; forced Highlight; coarse — мишени 48 смыкаются; крошки: 700, `scrollLeft` 459, wrap без переполнения.
- `ssr.probe.ts` (JS выключен) → 6 → 6: `data-fixture-ready` на сервере не ставится; бар / рейл / вкладки / тулбар с выбором и активным глифом уже в первом кадре; app bar `HEADER` + `h1`, высоты 64/72/112/136/120/152, сворачивание без JS 120 → 64.
- `drawer.probe.ts` → 7 → 7: 360rem, surface-container-low, поля 12; скролл внутри, шапка стоит; RTL выезд справа; reduced motion 21 → 7 кадров; полоса 12px у правого края окна = жёлоб корневой полосы прокрутки (`elementFromPoint` → null), не дефект кита.
- `app-bar.probe.ts` → 2 → 2: шрифты по размерам, отступы 4 / 16 / 52, trailing on-surface-variant; заливка при прокрутке = surface-container.
- `forced-focus.probe.ts` → 3 → 3: forced — таблетка / индикатор Highlight, крошки различимы; кольцо первого пункта развёрнутого рейла обрезано (запас 0 при выносе 4.5rem); кольцо вкладки inset (−2px).

## Добавленные фикстуры
- `playground/fixtures/navigation/audit-rail-toggle.vue` — standard-рейл с `#header` и `v-model:expanded` (`toggle-rail`, `toggle-menu`), бар-стресс: 6 пунктов, длинная подпись, бейджи 999 и точка, ширина 360 (`bar-stress`, `bar-stress-start`).
