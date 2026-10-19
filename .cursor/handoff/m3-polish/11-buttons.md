# Бриф группы «Кнопки» (`w1-buttons`)

> Читается вместе с `00-common.md`. Состояние на 2026-10-18 (ветка `components/redisign-update`,
> HEAD `c9da731`). Пути от `src/runtime/`, если не сказано иное. **[Ф]** — факт из кода, планов,
> summary или решений; **[Г]** — гипотеза, её подтверждает проба. Длительности пружин посчитаны по
> `springDuration` (`utils/motion/shared/spring.ts`, ε = 1e-3).

**Главное.** Наш морф формы по сути не плавный. Все «круглые» формы группы — это
`--sys-shape-corner-full: 999rem` (`assets/stylesheet/base/_shapes.scss:14`). Пружина ведёт радиус
между 999rem и 8–28rem, а нарисованный радиус обрезан половиной высоты. Поэтому «в круг» форма
прыгает за кадр, а «в квадрат» ~150 мс стоит на месте. Та же причина статически сплющивает
внутренние углы split и крайних кнопок группы почти в ноль (§4.1). Начинай с этого.

---

## 0. Компоненты и файлы

Токены семьи — `assets/stylesheet/components/button/**` (ниже `tok/`).

| Компонент | M3? | Файлы | Строк src | План · QA · concept | Фикстуры / e2e |
|---|---|---|---|---|---|
| `MButton` | Button + Toggle | `ui/button/{index.vue,props.ts,morph.ts}`, `tok/_index.scss` (общий: ветки `icon-button`, `split`), `composables/button/{useButton,useButtonNameWarning,useRetiredValueWarning}.ts` | 360+78+27+111+121 (+69) | `button/index.md` · `button.json` (вся семья, кроме FAB menu) · `renders/button` | `fixtures/button/{matrix,stress}.vue`, `button.e2e.ts` (642) |
| `MButtonIcon` | Icon button | `ui/button/icon/index.vue` (пропы в `button/props.ts`) | 82 | `icon.md` · `renders/button-icon` | `family.vue` `icon-*` |
| `MButtonFab` | FAB | `ui/button/fab/{index.vue,props.ts}`, `tok/fab/_index.scss`, `composables/button/useFabProps.ts` | 173+46+68+39 | `fab.md` · `renders/button-fab` | `family.vue` `fab-*` |
| `MButtonExtendedFab` | Extended FAB | `ui/button/extended-fab/{index.vue,props.ts}`, `tok/extended-fab/_index.scss` | 227+20+111 | `extended-fab.md` · `renders/button-fab` | `family.vue` `extended-*`, `extended-fold` |
| `MButtonSplit` | Split button | `ui/button/split/{index.vue,props.ts}` (+ `split.*` в `tok/_index.scss:75-85`) | 187+31 | `split.md` · `renders/button-split` | `family.vue` `split-*` |
| `MButtonSegmented` | baseline Segmented | `ui/button/segmented/*`, `tok/segmented/_index.scss`, `composables/button/useSegmentedButton.ts` | 256+36+88+136 | `segmented.md` · `renders/button-group` (низ) | `family.vue` `segmented-*` |
| `MButtonGroup` | Expressive connected group | `ui/button/group/*`, `tok/group/_index.scss` (+ `useSegmentedButton`, `button/morph.ts`) | 103+42+12 | `group.md` · `renders/button-group` | `fixtures/button-group/{matrix,stress}.vue` + e2e (109) |
| `MFabMenu` | FAB menu | `ui/fab-menu/{index.vue,props.ts,morph.ts}`, `fragments/fab-menu/Actions.vue`, `components/fab-menu/_index.scss`, `composables/useFabMenu.ts` | 302+49+40+163+103+135 | `fab-menu.md` · `fab-menu.json` · `renders/fab-menu` | `fixtures/fab-menu/{matrix,stress}.vue` + e2e (196) |
| `MLoading` | Loading indicator (+ `circular` — расширение кита) | `ui/loading/{index.vue,props.ts}`, `components/loading/_index.scss` | 301+35+25 | `feedback/loading.md` (`planned`, устарел) · `loading.json` (устарел) · `renders/progress` | **нет** |
| `MShape` (только потребитель морфа) | авторский | `ui/shape/index.vue` | 70 | — | **нет** |
| Морф-утилиты | — | `composables/{useShapeMorph,useReducedMotion}.ts`, `utils/motion/**` (12), `utils/morph/**` (9) | 270+47+657+850 | — | unit: `utils/{motion,morph}/index.spec.ts`, `useReducedMotion.spec.ts` |

- Планы лежат в `.cursor/plans/feature/components-should-update/button/`. Unit-спеки — рядом со всеми
  компонентами.
- Файлов больше 400 строк в `src` нет.
- URL: `/button/{matrix,family,stress}`, `/button-group/{matrix,stress}`, `/fab-menu/{matrix,stress}`.

---

## 1. Решения владельца — не переспрашивать

Сверх §10 общего брифа: density 32/40/56, FAB 40/56/96, pressed 12%, tonal = контейнер, морф только у
toggle и FAB menu. Источники — память `button-family-decisions-2026-10` и
`no-expressive-motion-density-three-steps`, summary `button-family-m3_2026-10-07.md`, `decisions.md`.

- **`MButton`:**
  - Край outlined — `outline-variant` у всех ролей (В-2). `shape: 'round' | 'square'` — исключение
    словаря (В-3).
  - `selected` + `v-model:selected` у `MButton` и `MButtonIcon` (В-4). Выбранная всегда square
    (`checkedShape`). Форма выбора держится в disabled и loading (В-5).
  - Loading инертен, но фокусируем: `aria-disabled`, клик гасится в capture (В-6). Выбранная tonal —
    инверсия контейнера, text-toggle — цвета standard icon button (В-7).
  - Индикатор в кнопках — только `MLoading inline` (circular, `1em`, `currentcolor`). Слой — `::before`,
    нажатие — только рипл. Цель 48 у compact.
- **Морф.** Пружина `M3_SPRING` → `springToCss` → CSS `linear()` без кадрового цикла: toggle (форма —
  spatial.fast, цвет — effects) и FAB → круг 56 (размер и углы — spatial.default, цвет — effects).
  Нажатие форму не меняет. Новый морф — только этим рецептом и с одобрения. JS-пружины
  `MShape`/`MLoading` «как есть» (`decisions.md`). Прогон 2026-10-18: где морф есть — плавно.
- **`MButtonIcon`:** ось `width: narrow | default | wide`. `elevated` снят (рисуется релиз с
  предупреждением). Без `color` — цвет контента контейнера (`ui-button--current`). `MButton` без
  подписи = геометрия icon button. Выбор: round → square, square → round. Цель 48 у всех ступеней.
- **`MButtonFab`:** `density` вместо `size` (`size` — релиз с предупреждением). `tonal` = контейнер
  (дефолт), `filled` = роль. `disabled` остаётся. Medium FAB 80 нет.
- **`MButtonExtendedFab`:** только проп `expanded`, без scroll-композабла. Свёрнутая — квадрат ступени,
  подпись остаётся именем через `sr-only`. Ширина анимируется через `interpolate-size`, где он есть.
- **`MButtonSplit`:**
  - `items`/`select` убраны → слоты `#menu="{ close }"` и `#trailing="{ open }"`, событие `trailing`,
    проп `trailingAriaLabel` (`dropdown*` — релиз).
  - Шеврон всегда, вверх при открытом меню, без анимации поворота. Без `text`, без «круглого open».
  - Зазор 2, внутренние углы 4 статичны. Loading — спиннер в главной, правая выключена.
- **`MButtonSegmented`:** остаётся на общем движке с группой. Слота `#item` нет (EN-03). Минимум 58,
  перенос только по словам, ряд прокручивается.
- **`MButtonGroup`:** только connected (`items` + `v-model`/`multiple`). Standard и переполнение
  отложены до заказчика. Зазор 2 и внутренние углы 8 на всех ступенях.
- **`MFabMenu`:**
  - Disclosure (В-1). Столбец в верхнем слое: popover + anchor positioning + JS-фолбэк (В-2). Тень
    пунктов level 3 (В-3).
  - FAB морфится в круг 56 цвета роли (В-4). Владелец выбрал вариант M3, а не рекомендованный «тот же
    FAB»; concept нарисован **до** решения.
  - `align: start | end` (`left/right` — релиз). `variant`/`loading` сняты, `label` пункта обязателен,
    иконки из `ICONS`.
- **`MLoading`:** без английского `aria-label`. Хост прячет индикатор `aria-hidden`, у самостоятельного
  без имени — dev-предупреждение. `size` → `density` решено в принципе, миграция ждёт OQ-1.

---

## 2. Что осталось от прошлых раундов

**Общее.**
- Summary, «Риски»: inline-морф заменяет весь `transition` у toggle — новые переходы `MButton` дописывать
  и в `button/morph.ts`.
- Столбец FAB menu без anchor positioning «перемеряется по `transitionend`» — **[Ф] не работает** (§4.4).
- Предложения по UX всех планов **не одобрялись**. TK-03 (трекинг `typescale`) — системный.
- Владелец сейчас правит типографику в рабочем дереве (`base/_typography.scss`, `utils/typography/`) —
  `typescale` используют все кнопки.

| Компонент | Хвосты |
|---|---|
| `MButton` | Текст плана «выбранная форма без анимации» устарел — верь статусу и `decisions.md`. Hairline `container.outline.width: 1rem` (`tok/_index.scss:11`) не переведён. Не одобрены: `disabledReason`, `hotkey`, подтверждение на месте. |
| `MButtonIcon` | Не одобрены: `tooltip`, `#badge`, `selectedIcon`. Залитый глиф выбора — на потребителе через слот `{ selected }`. |
| `MButtonFab` | Дашборды: `MLayoutMain` с `container-type` становится containing block для `fixed` FAB (`ui/layout/main.vue:26-34`, не наш файл; CRM-демо вынесло FAB из `MLayout`). Не одобрены: скрытие при прокрутке, зона раскладки, тултип. |
| `MButtonExtendedFab` | План «подпись гаснет» **[Ф] не сделан**: подпись мгновенно уходит в `sr-only` (`extended-fab/index.vue:188-195`), `opacity` не анимируется. |
| `MButtonSplit` | Баг `MMenu` + `client-only` передан в план меню (вне объёма). Обход возврата фокуса — `split/index.vue:107-117`. |
| `MButtonGroup` | Типы (`MButtonGroupItem` и др.) — только глубоким путём; `package.json` `./types` = `shared/types/props`. |
| `MFabMenu` | MANUAL MO-03 (быстро открыть-закрыть) и EN-10 (`useClickOutside` слушает документ всегда — не наш файл). `docs`-репозиторий: несуществующие `icon`/`label` (DC, вне объёма). |
| `MLoading` | См. ниже. |

`MLoading`: план `planned`, но часть сделана в раунде кнопок и оркестратором.
- **[Ф] Сделано:** только `span` (EN-09); `inline` = `1em` + `currentcolor`; толщина в токенах (TK-02);
  circular под reduce медленнее в 2 раза; forced colors (TH-04); нет дефолтной подписи,
  dev-предупреждение; ленивый `MShape`.
- **Не сделано:** contained и 48/38; `density` (вопрос 2 плана); судьба `circular` (вопрос 1); живой
  текст вместо `aria-label` (DT-09); `delay`/`minDuration` (DT-11); reduced motion у expressive (A11-18,
  §4.5); литералы движения (TK-04, MO-05); `vertical-align: middle` (LY-03); тест цикла (TS-07);
  фикстура. Вопросы 1–2 не решены.

---

## 3. QA-аудит: что открыто

| JSON | PASS | FAIL | MANUAL | N/A |
|---|---|---|---|---|
| `button.json` | 76 | 11 | 13 | 46 |
| `fab-menu.json` | 70 | 10 | 19 | 47 |
| `loading.json` (**устарел**) | 27 | 27 | 4 | 88 |

**Принятые и вне объёма:** RS-04/05/06, TS-04, TK-03, TK-09, DC-01…05, `button` EN-03 (решено не
добавлять). `fab-menu` TS-05 «нет axe» **устарел** — axe есть (`fab-menu.e2e.ts:11`), закрыть.

**`button.json` MANUAL** (кандидаты в заявки дирижёру):
- ST-07 — контраст segmented selected/unselected/hover.
- CT-06 text spacing; CT-07 пустая кнопка; CT-12 эмодзи и CJK (`stress.vue` `mixed-script`).
- LY-03 — выравнивание иконки. Пометка «шеврон split — повёрнутый плюс» устарела.
- LY-07 — кнопки в карточке, диалоге, ячейке; split в скролл-контейнере.
- RS-02, RS-07 — брейкпоинты, зазоры в рядах.
- TH-02, TH-03 — варианты × роли в light/dark, край outlined 3:1.
- TH-08 — переливание кнопок при смене темы.
- TS-06 — клавиатура split и segmented, зум, High Contrast.

**`fab-menu.json` MANUAL:**
- ST-02, ST-03, ST-07 — состояния и фокус пунктов на `*-container`.
- IN-05 **устарел**: `clip-path` в коде нет. RS-06 **устарел**: пункт теперь h56.
- CT-06, CT-07 (`label` теперь обязателен по типу), CT-12, LY-03.
- LY-07 — в карточке с `overflow: hidden`, у края, рядом со sticky.
- RS-01 (320 px), RS-02, TH-02, TH-03, TH-06 (тень в тёмной теме), A11-13.
- **MO-03**, EN-10, TS-06.

**`loading.json` по коду 2026-10-18:**
- Закрыто кодом, в JSON всё ещё FAIL: CT-13, TK-02, TH-04, EN-09; A11-04 частично.
- Открыто:
  - DT-09 — `role="status"` только с `aria-label` (`loading/index.vue:10-11`).
  - DT-11 — нет `delay`/`minDuration`.
  - LY-03 — `vertical-align: middle` (`:145`).
  - LY-04, TK-06 — размеры 16/24/32 вне шкалы.
  - TK-04, MO-05 — `1333ms`, `cubic-bezier`, `$calm: 2` литералами (`:108-115`).
  - A11-18 у expressive; TS-07.
- TS-01…03 — это Storybook, а его нет по решению. MANUAL: LY-07 (в `<p>`, кнопке, оверлее), TH-02,
  TH-03, TS-06.

---

## 4. Движение и анимации в группе

### 4.0 Карта переходов

| Где | Что анимируется | Чем | Морф? |
|---|---|---|---|
| `button/index.vue:156-161`, `::before :173` | `background-color, color, box-shadow, border-color, transform`; `opacity` слоя | short-3 / standard | нет |
| `button/index.vue:71` + `button/morph.ts:18-27` | inline у toggle: `border-radius` (spatial.fast ≈ 230 мс), `background-color, color` (effects ≈ 231 мс), прочее short-3; reduce → `CALM` (short-4) | `M3_SPRING` | **да** |
| `group/index.vue:16` | тот же `toggleTransition` на каждой кнопке | то же | **да** |
| `fab-menu/morph.ts:26-38` → `index.vue:35,41` | FAB: `width, height, border-radius` (spatial.default ≈ 325 мс), цвет (effects), тень short-3; глиф `font-size` | `M3_SPRING` | **да** |
| `fab-menu/index.vue:218-234` | иконка plus ↔ close: `opacity` + `rotate(±90deg)` | medium-1 | нет |
| `fab-menu/index.vue:291-299` | столбец `opacity`: enter **и** leave на medium-2 emphasized-decelerate | токены | нет |
| `Actions.vue:79-92` | пункты: `opacity` + `translate: 0 16rem`, задержка `short-1 × --ui-fab-stagger` | токены | нет |
| `fab/index.vue:59-61,78` | `box-shadow, background-color`; у `__icon` свой `color` | short-3 | нет |
| `extended-fab/index.vue:72-83` | `width, padding, gap` (+ `interpolate-size`), тень, фон | fold medium-2 emphasized | нет |
| `segmented/index.vue:118-120,233-254` | фон, цвет; галочка `scale(.5)` + `opacity`, `out-in` | short-3 | нет |
| `loading/index.vue:153-230` | CSS-дуги circular; reduce → в 2 раза медленнее | **литералы** | нет |
| `useShapeMorph.ts` (rAF) → `shape/index.vue:57-59` | `d` пути + inline `rotate()` | `expressive` (ζ 0.6, k 380 ≈ 610 мс + hold 100) | **да** |

### 4.1 Корень №1: `full = 999rem` в морфе и в смешанных углах

**[Ф]** по коду и CSS Backgrounds 3 §5.5. При равных углах видимый радиус = `min(r, min(w,h)/2)`.
При разных углах **все** радиусы умножаются на `f = min(L_стороны / сумма радиусов на ней)`.

- **Toggle `MButton`.** round = `container.shape` = 999rem (`tok/_index.scss:10`), selected =
  `density.*.square` 12/16. У кнопки высотой 40 радиус виден только при `r < 20`, то есть после 99.2%
  пути пружины: ~150–170 мс из 230 ничего не происходит, потом «доезд» по хвосту. Обратно круг
  достигается за ~3 мс — **снап в первом кадре**.
- **Toggle `MButtonIcon`.** square → selected round = 999rem (`tok/_index.scss:70`,
  `icon/index.vue:72-74`) — тот же снап.
- **`MButtonGroup`** (`group/_index.scss:9,11`: `outer` и `selected` = 999rem, `inner` = 8).
  - Средние кнопки: снап в пилюлю, задержка обратно.
  - **Статический баг:** у крайних кнопок 999 + 8 → `f ≈ 40/1998` → внутренние углы рисуются ≈ 0.16rem
    вместо 8. В морфе они плавно едут, но к ~0. Три разных поведения в одной группе.
- **`MButtonSplit`.** Половины = `.ui-button` с 999rem, внутренние углы `split.inner` = 4
  (`split/index.vue:150-160`) → рисуются ≈ 0.08rem, **квадратные** вместо 4.
- **`MFabMenu`.** `open.shape` = 999rem (`fab-menu/_index.scss:59`). Закрытый 16/12/28 → круг за 1–2
  кадра. При закрытии радиус ~220 мс из 325 стоит, потом квадратится в конце. Comfortable 96 → 56:
  сначала круг, потом сжатие.
- **e2e этого не видят:** `getComputedStyle` отдаёт заданный радиус (`button-group.e2e.ts:73-89`,
  `button.e2e.ts:147-157,585-602`, `fab-menu.e2e.ts:112-134`).
- **Направление починки:** конечный радиус в карте. `calc(<высота ступени> / 2)` у toggle, группы и
  split; `calc(open.size / 2)` у FAB menu.
- **Развилка:** только там, где морф и смешанные углы, или `round` всех кнопок? Двухстрочная кнопка с
  конечным радиусом станет скруглённым прямоугольником.

### 4.2 Toggle и группа — прочее
- **[Ф]** Inline-строка перехода от `selected` не зависит (`index.vue:71`, `group/index.vue:16`), а
  одинаковое значение Vue в DOM не пишет. «Перезапись посреди движения» по коду не подтверждается:
  возможна лишь при смене reduce или `selected: undefined → boolean`. Подтвердить пробой двойного
  клика.
- **[Ф]** `transform` в переходах `MButton` и `morph.ts` никто не задаёт — мёртвое свойство.
- **[Ф]** SSR: класс `--selected` и inline-переход приходят с сервера, reduce до монтирования `false` с
  обеих сторон. Перехода на гидрации нет.
- **[Г] Disabled-кнопка группы выглядит активной.** `disabled` приходит фоллтру-атрибутом из
  `segmentAttrs` (`useSegmentedButton.ts:107-108`) и перебивает `rootAttrs.disabled`, но `useButton` о нём
  не знает. Значит, нет `ui-button--disabled`, нет цветов 38/12%, рипл и hover-слой живы. Unit-тест
  проверяет только атрибут (`group/index.spec.ts:59-65`).

### 4.3 Segmented, split, extended FAB
- **[Г] Segmented едет в ширину при выборе.** Обёртка иконки `v-if="isSelected || item.icon"`
  (`segmented/index.vue:21`) у сегмента без иконки появляется вместе с выбором; сегменты
  `flex: 0 1 auto` (`:104`). Ширина скачет на 18 + 8, соседи двигаются. Leave галочки не играет:
  родитель удаляется сразу. Enter тоже: `<transition>` без `appear` в новом узле. Нарушено правило
  «раскладка не едет от состояния». **Развилка:** резерв места, равные сегменты как в M3, или анимация.
- **[Г] Extended FAB: прыжок иконки при сворачивании.**
  - Подпись в первом кадре уходит в `sr-only` (absolute), а ширина ещё едет от `auto`.
  - Иконка при `justify-content: center` прыгает в центр широкого бокса, потом едет с ним.
  - При раскрытии подпись сразу занимает место, `overflow: hidden` её режет.
  - Где `interpolate-size` нет — всё мгновенно.
  - `width`/`padding`/`gap` анимируются в потоке: соседи в ряду двигаются.
- **[Г] Split loading роняет фокус шеврона.** Правая половина получает нативный `disabled`
  (`split/index.vue:31`) — против В-6.

### 4.4 FAB menu
- **[Ф] Перемер столбца после морфа не срабатывает.**
  - `@transitionend.self` висит на `span` якоря (`fab-menu/index.vue:16`), а переход идёт на дочернем
    FAB. `.self` пропускает событие только при `target === span` — `reposition()` не вызывается.
  - В JS-пути позиция считается один раз, на `nextTick` открытия (`usePopover.ts:228-233`), по
    **закрытому** FAB.
  - Без anchor positioning у `compact` (40 → 56) столбец наезжает на FAB на 16, у `comfortable` (96 →
    56) висит на 40 выше. Даже живой `transitionend` дал бы скачок в конце морфа.
  - Chromium идёт anchor-путём, а тест выравнивания взят на default 56 → 56 (`fab-menu.e2e.ts:137`) —
    e2e это не ловят.
- **[Ф] Закрытие — не обратный выезд.** Пункты — `transition-group` внутри `v-if`-ящика. При закрытии
  играет только `opacity` ящика, на кривой входа (`index.vue:291-294`). `item-leave-*`
  (`Actions.vue:84-92`) срабатывает лишь при смене `items`. **[Г]** У M3 закрытие — обратный каскад к FAB;
  сверить с `FloatingActionButtonMenu.kt`.
- **[Г] Прерывание (MO-03).** Закрыть посреди входа: `opacity` прыгает к 1 и уходит. Открыть посреди
  ухода: узел удаляется, новый въезжает с нуля. FAB при этом ретаргетится плавно — рассинхрон.
  `MIcon` plus/close в `<transition>` без `mode` при быстром тоггле может прыгать.
- **[Г] В потоке FAB толкает соседей:** размер морфится через `width/height` (`morph.ts:29-30`). В
  fixed-углу (`demo/orders/OrdersFab.vue`) это безопасно.
- **[Г] Иконка FAB отстаёт по цвету.** `.ui-fab__icon` держит свой `transition: color` short-3
  (`fab/index.vue:78`), а цвет наследуется от корня на пружине. Ребёнок перезапускает переход каждый
  кадр.
- **[Ф]** Inline `transition: font-size` у глифа (`index.vue:41`) затирает стилевой
  `transition: transform` (`:212`); `transform` у глифа никто не ставит.
- **[Ф]** Открыт с сервера (`open = true`): FAB уже круг из SSR, а столбец (`client-only` + `appear`)
  въезжает после гидрации — против §6.2.5. `isRtl` читается только при открытии (`:155`).

### 4.5 `useShapeMorph` / `MLoading` / `MShape`
- **[Ф] Reduced motion выключает морф.** `prefersReducedMotion()` → `settle(to)`
  (`useShapeMorph.ts:232`), а таймер цикла продолжает менять фигуры каждые ~710 мс. Под reduce фигуры
  **меняются скачком**: против §6.2.6 и плана («замедлять»). Плюс вторая механика reduced motion
  рядом с `useReducedMotion`.
- **[Ф] Прерывание с `sequence` стартует от канонической формы, а не от живой** (`:227-228`,
  против §6.2.2). В `MLoading` — при смене `transition` на лету или когда вкладка в фоне (rAF стоит,
  таймер идёт).
- **[Ф] Угол сбрасывается при прерывании:** первый тик ставит `rotate = amplitude · v(0) = 0` (`:211`).
- **[Ф] Качание.** Угол = 60° · скорость / пик (`utils/motion/shared/velocity.ts`). У `expressive`
  (перелёт 9.5%) скорость после ~200 мс меняет знак, фигура **поворачивает обратно**: 0 → +60 → 0 →
  минус → 0, два разворота на каждую фигуру. В покое 0°.
  **[Г]** У Compose `LoadingIndicator`, по памяти, поворот монотонный — сверить с `LoadingIndicator.kt`.
  Обратный ход — кандидат «не в ту сторону». Это развилка: решение «пружины как есть» о направлении
  ничего не говорит.
- **[Ф] Таймер цикла стартует в setup, в том числе на сервере.** `watch(type, …, { immediate: true }) →
  cycle.start()` (`loading/index.vue:96-102`); `useTimer.begin` зовёт `setTimeout` без `IN_BROWSER`
  (`composables/useTimer.ts:166`).
  **[Г]** С `repeat: true` таймер на сервере вечный: утечка на каждый SSR-рендер expressive.
  Проверить unit-тестом (`renderToString` + `vi.getTimerCount()`). Починка у нас: старт в `onMounted`;
  guard в `useTimer` — заявкой.
- **[Ф]** `contain: strict; content-visibility: auto` (`loading/index.vue:125-126`) пропускают рендер вне
  экрана, но rAF-морф и таймер работают. Пауза вне вьюпорта — в «Предложения».
- **[Ф]** Ни в ките, ни в демо нет ни одного expressive-индикатора и ни одной фикстуры
  `MLoading`/`MShape`: морф никто не видел в тестах.

---

## 5. Кастомизация: что есть и где дыры

**Есть:**
- `MButton`: слоты `#prepend` / default / `#append`; оси `variant, color, density, shape, selected, tag,
  type, to`.
- `MButtonIcon`: слот `{ selected }`, `width`, `ariaLabel`.
- Extended FAB: `#prepend`, `expanded`.
- Split: `#prepend`, `#trailing="{ open }"`, `#menu="{ close }"`.
- Segmented и группа: `items` + `v-model` + `multiple`.
- FAB menu: `#activator` (+ `activatorAttrs`), default-слот `{ close, select }`, `v-model:open`,
  `openIcon` / `closeIcon`.
- `MLoading`: `type, size, inline, ariaLabel, transition`. `MShape`: `name, sequence, transition,
  duration`.
- Escape hatch: `useFabMenu` (бэги без классов — эталон), `useSegmentedButton`, `useShapeMorph`.

**Дыры** — все [Г]; каждая новая ось или проп — развилка:
- `useButton` отдаёт BEM-классы (`rootClass`, `useButton.ts:52-71`) — против `behavior.md`. Ещё
  `composables/**` автоимпортируется потребителю (`src/module.ts:167`), и туда утекают внутренние
  `useFabProps`, `useButtonNameWarning`, `useRetiredValueWarning`. Последний используют 9 компонентов
  других групп — перенос в `utils/` только заявкой.
- `MButtonSplit`:
  - у главной кнопки нет `type` / `tag` / `to` — нельзя сделать submit или ссылку;
  - нет `v-model:open` меню (у FAB menu есть);
  - нет `inheritAttrs` — `aria-*` уходят на `div`.
- `MButtonGroup` предупреждает «pass `ariaLabel`», а такого пропа у неё нет (`group/index.vue:62`).
- `MButtonSegmented`: `loading` из `makeStateProps` ничего не делает (`segmented/props.ts:27`).
- Три одинаковых интерфейса пункта: `SegmentedItem` (`useSegmentedButton.ts:18`), `MSegmentedItem`,
  `MButtonGroupItem`.
- Публичные типы группы — только глубокими путями. `MShape` объявляет пропы type-based в SFC — проверить
  подсказки IDE у потребителя.
- Тайминги морфа (`SHAPE`, `COLOR`, `CALM`) — константы модулей. В «Предложения», не в шаги.
- `MLoading`: нет живого `label`, contained, `delay`/`minDuration`, `density` — ждут вопросов 1–2 плана.
- Text-toggle: выбранное отличается **только цветом**. Контейнер прозрачен, форма не видна
  (`m3-button-scheme`: `text.selected = $bare`). Решение В-7 расходится с правилом №13. Не переспрашивай
  решённое: в отчёт как конфликт двух правил, с вариантами — глиф `{ selected }` в документации и
  фикстурах или другая подсказка.

---

## 6. Минимизация и оптимизация

**Чисто [Ф].**
- `npm run lint:scss` (2026-10-18): 152 таблицы, 0 deprecations, 0 дефисных путей во всём ките.
- `data-*` и `transition: all` нет.
- Метрика минимизации — выходной CSS компонента из prod-сборки: база `.cursor/temp/m3-polish/baseline/css-sizes.json` (P0), итог — финальный прогон (§4 общего брифа).

**Находки.**
1. **Подмена фона, четыре копии одной функции.** `fab-surface` (`tok/fab/_index.scss:13`),
   `extended-fab-surface` (`tok/extended-fab/_index.scss:13`), `fab-menu-surface`
   (`fab-menu/_index.scss:14`), `segmented-selected` (`tok/segmented/_index.scss:16`) — заранее смешанные
   `color-mix` hover/focus/pressed на роль × вариант.
   - `MButton` уже на `::before`; FAB, extended FAB, open-FAB, пункты FAB menu и segmented — нет
     (`craft.md`, «Подмена фона»).
   - Побочно **двойной pressed**: фон 12% + рипл 12% у FAB (`fab/index.vue:4,106-108`), extended FAB
     (`:4,145-147`), segmented (`:12,141-143,186-188`). Ровно это убрали в `MButton`.
   - У пунктов FAB menu рипла нет вовсе (`Actions.vue:15`).
   - Перевод на слой убирает ~40 строк токенов и правила роль × вариант × 3 состояния. Видимое
     изменение pressed — **развилка**.
2. `fab/index.vue` и `extended-fab/index.vue` дублируют миксины `apply-surface` / `apply-scheme` /
   `apply-density` при одинаковых схемах — нужна одна карта FAB-набора.
3. Миграция `size → density` сделана дважды: `useFabProps` и свой `computed` в
   `fab-menu/index.vue:125`; плюс `size` в оси `useButton.ts:55`. После релиза удалить разом.
4. `@vueuse/core`: `useVModel` (`segmented/index.vue:51`, `group/index.vue:36`) → `defineModel`;
   `reactiveComputed` (`useFabProps.ts:1`).
5. `>`-селекторы и специфичность: `split/index.vue:143-176` → модификаторы.
6. Hairline: `tok/_index.scss:11` и литералы `1rem` в `segmented/index.vue:87,112` (мимо карты) →
   `max(1px, 1rem)` из карты.
7. Литералы `MLoading` (`1333ms`, `cubic-bezier`, `$calm`, `calc(4 * …)`, `loading/index.vue:108-115`) —
   в карту `motion.*`. Это числа спецификации M3 circular; если токена нет — **развилка**.
8. Мёртвое:
   - `transform` в переходах `MButton`/`morph.ts`;
   - `transition: transform` у `.ui-fab-menu__glyph`;
   - `loading` у segmented;
   - `easeM3Standard` (`useShapeMorph.ts:84`, `@deprecated`, потребителей нет; это публичный
     автоимпорт; по решению 2026-10-18 снятое удаляется сразу, без предупреждений — в аудит как кандидат на удаление).
9. `useReducedMotion`: модульные `let query` / `let subscribers` (`useReducedMotion.ts:14-16`) — против
   правила 18, хотя синглтон одобрен в раунде кнопок. Конфликт — в отчёт, сам не меняй.
10. Две механики reduced motion: `prefersReducedMotion()` (в `useShapeMorph`) и `useReducedMotion`.
    Третья копия — `virtual-scroll/useVirtualScroll.ts:78` (не наш файл).

**Применимо из кнопок и полей:** слой `::before` + рипл (п. 1–2), `defineModel`, BEM-модификаторы,
hairline из карты. `_states.scss` не нужен: файлы короче 400.

---

## 7. Связи с другими группами

**Кто стоит на группе.**
- `MButton`: `fragments/{breadcrumbs/item,file-upload/Dropzone}`, `ui/{dialog/date,file-input,
  file-upload,form-renderer,pagination,toolbar}` (toolbar — async); 17 файлов демо.
- `MButtonIcon`: `fragments/{date-picker/header-nav,file-upload/Dropzone,file-upload/Item,
  table/pagination}`, `ui/{alert,autocomplete,banner,color-input,date-picker,dropdown,file-input,
  pagination,search,toolbar}`; 13 файлов демо.
- `MLoading`: button, fab, extended-fab, `ui/otp-input`, `ui/table`, `fragments/table/message`; демо
  `CrmInlineEdit`.
- `useRetiredValueWarning`: avatar, card, date-picker, dialog/date, expansion-panel, list/item,
  text-field (+`useFieldShape`), time-picker — сигнатуру не менять.
- Лезут во внутренности `.ui-button` — смена специфичности или паддингов их ломает:
  - `pagination/index.vue:188-191` (`&__page.ui-button`, литерал `8rem`) и `:209` (`[aria-current]`);
  - `fragments/breadcrumbs/item/index.vue:77-84` (`&__link.ui-button`: высота, отступ, радиус, цвет;
    0,2,0).
- `toolbar/index.vue:142-143` эмулирует выбор сменой `variant`, без `selected` и `aria-pressed` — сообщи
  (navigation, вне объёма).
- Демо, только читать: `OrdersFab` (`MFabMenu`, fixed), `OrdersListSection` (`MButtonGroup`),
  `OrdersBulkBar` (`MButtonSplit`), `CrmPageHeader` (`MButtonSegmented`), `CrmDashboard` (extended FAB).
- **[Ф] Поправка к `00-common.md` §2.6 и §5.4:** «на `useButton` стоят строки списка» — неверно.
  `list/item` берёт из `composables/button/` только `useRetiredValueWarning`; `useButton` используют лишь
  `MButton`, FAB и extended FAB.

**Что потребляет группа (вне объёма):**
- `MMenu` (split).
- `usePopover`, `useTopLayer`, `supportsAnchorPositioning` (FAB menu). Перемер чинить в
  `fab-menu/index.vue`, не в `usePopover`.
- `useClickOutside` (EN-10), `useStack`, `useTimer` (guard — заявка), `MIcon`, `ICONS` (только
  дописывать).
- `m3-button-scheme` (`abstracts/_functions.scss`) и `_ripple.scss` — файлы оркестратора, правка
  заявкой.

**Риск для соседей.** Конечный радиус для **всех** кнопок (вариант §4.1) меняет вид каждой пилюли в
ките. Перевод FAB-семьи на `::before` соседей не задевает.

---

## 8. Рекомендуемый порядок и объём

1. **P1, до проб:** фикстура `playground/fixtures/loading/{matrix,stress}.vue` (circular/expressive ×
   size × inline, внутри `<p>`, в кнопке, 20 штук) и сценарий для `MShape` в
   `playground/probes/w1-buttons/`. Без них заявки по `MLoading` невозможны.
2. **Радиусы (§4.1)** в `tok/_index.scss`, `tok/group/_index.scss`, `fab-menu/_index.scss` — на них
   стоят toggle, icon, group, split, FAB menu. **M**, сначала развилка об объёме.
3. **`MButton`/`MButtonIcon`/`useButton`:** disabled в группе, мёртвые переходы, hairline. **S–M.**
4. **Group и split:** углы, `>`, фокус в loading, `defineModel`. **S–M.**
5. **Segmented:** ширина при выборе (развилка), слой, `defineModel`, hairline. **M.**
6. **FAB и extended FAB:** слой `::before` + одна карта, двойной pressed, fold (подпись гаснет, иконка
   не прыгает). **M.**
7. **FAB menu:** JS-перемер, обратный каскад, прерывание, иконка, слой. **M–L.**
8. **`MLoading`/`useShapeMorph`:**
   - reduce: переход `calm` без поворота плюс медленнее цикл;
   - таймер стартует в `onMounted`;
   - прерывание от живых `d` и угла;
   - литералы в карту;
   - API (contained, `density`, `label`, `delay`) — после вопросов 1–2.
   **M** + M на API.
9. **Минимизация (§6)** — по ходу; выходной CSS до/после — `baseline/css-sizes.json` → финальный прогон.

**Пока ждёшь дирижёра:**
- unit-спеки: SSR-таймер `MLoading`, disabled-класс в группе, `useShapeMorph` под reduce и при
  прерывании (fake timers);
- формулировка развилок;
- `modern-web-guidance`: `physics-based-easing`, `motion`, `animate-to-intrinsic-sizes`,
  `animate-element-entry-exit`, `animate-to-from-top-layer`, `dynamic-sibling-animations`,
  `individual-transform-properties`, `spinner`, `progress-ring`, `reduce-style-repetition`.

**Вероятные развилки** (по одной):
- объём конечного радиуса;
- pressed у FAB-семьи и segmented — только рипл;
- ширина segmented;
- обратный каскад FAB menu;
- обратный поворот `MShape`;
- `useButton` без классов и хелперы в `utils/`;
- `let` в `useReducedMotion`;
- `type` / `to` / `v-model:open` у split;
- вопросы 1–2 `MLoading` (+ `label`, contained, `delay`);
- text-toggle только цветом.

---

## 9. Стартовые заявки дирижёру

Эффективный радиус считай из трассы (`border-*-radius` + `width`/`height`) по правилу §4.1:
computed-радиус врёт. Для мелких углов — вьюпорт 1920 (`1rem` ≈ 1px).

1. **`w1-buttons-001` probe — toggle `MButton`.**
   - `/button/matrix`, цели `[data-test=toggle-filled]`, `[data-test=toggle-outlined]`.
   - `styles: ['border-top-left-radius','height','background-color']`, 600 мс.
   - Сценарии: клик туда, клик обратно, двойной клик с интервалом 80 мс, всё ещё раз с
     `reducedMotion: 'reduce'`.
   - Ждём: ~150 мс задержки к square, снап к round, `shift` нет.
2. **`-002` probe — `MButtonIcon`.** `/button/family`, `icon-toggle-square-filled` и
   `icon-toggle-round-filled`: клик туда и обратно, те же стили.
3. **`-003` look — статические углы.** Вьюпорт [1920,1080], light.
   - `/button/family`: `shot` `split-filled`, `split-outlined`.
   - `/button-group/matrix`: `shot` `group-filled`, `group-outlined`, `group-density-comfortable`.
   - Смотрим внутренние углы против concept: split — 4, группа — 8.
4. **`-004` probe — группа.** `/button-group/matrix`, фокус на radio «Day» в `group-filled`, затем
   `ArrowRight` ×2 (через disabled «Month»), `End`, `Home`. Трасса радиуса и `x` всех кнопок, 600 мс на
   шаг; одна стрелка в `?dir=rtl`.
5. **`-005` look — disabled в группе.** `/button-group/matrix`, light и dark.
   - `shot` `group-disabled`; `hover` на «Month» в `group-filled` + `shot`.
   - `js`: `className`, `color`, `background-color` у «Month» и у «Week» в `group-disabled`.
   - Ждём: класса `--disabled` нет, цвета активные.
6. **`-006` probe — ширина segmented.** `/button/family`, `[data-test=segmented-single]`: клик по «Day»,
   потом по «Year». Трасса `width` группы и `x`/`width` каждого `.ui-segmented-button__segment`,
   500 мс. Ждём `shift` и +~26rem.
7. **`-007` probe — extended fold.** `/button/family`, `[data-test=extended-fold]`: клик → 900 мс →
   клик → 900 мс.
   - Цели: корень, `.ui-extended-fab__icon`, `.ui-extended-fab__label`.
   - Стили: `width, opacity, padding-inline-start`.
   - ltr, rtl и с reduce.
8. **`-008` probe — FAB menu, оба пути позиционирования.** `/fab-menu/matrix`,
   `menu-density-comfortable` и `menu-density-compact`.
   - Цели: `.ui-fab-menu__activator` (`width, height, border-top-left-radius, background-color`),
     `.ui-fab-menu__drawer` (rect, `opacity`), `.ui-fab-menu__item` (`translate, opacity`).
   - Сценарий: клик → 900 мс → `Escape` → 900 мс.
   - Второй прогон — с `page.addInitScript`: `CSS.supports` → `false` для `anchor` / `position-try`
     (JS-путь, `shared/utils/support.ts:25`).
   - Ждём: в JS-пути низ столбца не на `FAB.top − 8`; при закрытии пункты не едут.
9. **`-009` probe — прерывание (MO-03).** `/fab-menu/matrix`, `menu-primary-end`: клик → 120 мс →
   клик → 120 мс → клик, запись 1200 мс. Трасса `opacity` ящика, `translate` пунктов, радиус и цвет
   FAB, число `.ui-fab-menu__icon` по кадрам.
10. **`-010` probe — `MLoading` expressive** (после фикстуры из §8.1). `/loading/matrix`,
    `svg.ui-shape`: `transform` + `js` с длиной `d` по кадрам, 3000 мс, без reduce и с reduce.
    - Ждём: два разворота угла на фигуру; под reduce `d` меняется скачком раз в ~710 мс.
    - Плюс `shootStates` circular и expressive в forced-colors.
