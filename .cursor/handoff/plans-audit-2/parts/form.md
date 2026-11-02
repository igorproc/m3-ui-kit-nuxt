# Form (выбор) — аудит планов

Итог: сделано 62 · частично 17 · нет 7 · регресс 0 · отменено 15 (по пунктам; ещё 2 пункта «документация в репозитории docs» — не проверено, в счёт не входят).

Сверка — рабочее дерево на 2026-10-30. Пути кода — от `src/runtime/`. Пробы — `playground/probes/plans-audit-2/form/*.probe.ts`, окно 1280×800 (1rem = 0.667px: обводки и рамки 2rem рисуются 1px — допуски в пробах на это округление, см. «Пробы»). `lint` / `lint:style` / `lint:scss` / `typecheck` / vitest не запускались (бриф) — пункты «Готово, когда» про зелёный CI везде «не проверено».

## form/checkbox.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | слот подписи без пропа, без `aria-checked`, из `makeStateProps` только `disabled` (План работ) | сделано | `components/ui/checkbox/index.vue:29-30`, `props.ts:16-18`; проба `checkbox › first frame` — `input[aria-checked]` = 0 в SSR | — |
| Ш2 | indeterminate: `v-model:indeterminate`, `input.indeterminate`, черта, класс, forced colors | сделано | `index.vue:91-109`, `:23` (`ICONS.remove`), `:241-244`; проба `mixed` — `indeterminate=true`, `:indeterminate`, нет `aria-checked`; SSR — класс `ui-checkbox--indeterminate` в серверном HTML | — |
| Ш3 | карта токенов: рамка по состоянию, `error.checked`, инверсия слоя, focus 10, disabled ролями, глиф 18, точечные пути | сделано | `assets/stylesheet/components/checkbox/_index.scss`, `choice/_control.scss:17-45`; проба `roles` — рамка `on-surface-variant` → hover `on-surface`, disabled рамка/заливка `on-surface` 38 %, корень `opacity: 1`, checked+error заливка `error`/глиф `on-error`; `anatomy` — глиф 18, слой focus 0.1 | — |
| Ш4 | цель 48, подпись с переносом, контрол по центру первой строки, без масштаба слоя | сделано | `choice/_control.scss:49-117`; проба `label` — контейнер 40 при подписи в 200 (не сжат), центр первой строки = центр контрола (±1); `coarse` — мишень 48×48 только при `pointer: coarse`, `fine pointer` — `::after content: none`; слой `scale: none` | — |
| Ш5 | строка поддержки и `required` (ЧВ-2) | сделано | Q28-Б: `fragments/choice-support/index.vue`, `utils/choice/useChoiceField.ts:82-93`; проба SSR — `aria-describedby` = id строки; маркер `*` цветом `error`, `required` на инпуте | — |
| Ш6 | кольцо фокуса вокруг слоя 40 (ЧВ-5 = 1) | сделано | `choice/_control.scss:120-122`; проба `anatomy` — `outline` solid на контейнере 40 со скруглением full | — |
| Ш7 | движение на `--sys-motion-*`, прорисовка галочки `stroke-dashoffset` | частично | `index.vue:176-202`: заливка `medium-3`/`emphasized-decelerate`, уход `short-3`/`emphasized-accelerate`, масштаб 0.6 → 1 есть; прорисовки нет (глиф — `MIcon`, G1-31); прозрачность глифа на тех же enter/exit, а не `short-1` + `linear` из таблицы токенов | S |
| Ш8 | тесты: фикстуры `{matrix,stress}`, e2e, unit | частично | `tests/{variants,interaction,a11y}.spec.ts`, `playground/fixtures/checkbox/{matrix.vue,checkbox.e2e.ts}` есть; `stress.vue` (длинная подпись, URL, таблица с частичным выбором) нет; forced colors в e2e — только mixed | S |
| Г | Г1–Г5, Г7 (три значения, роли матрицы, ошибка текстом+глифом, цель, нет `loading`) | сделано | пробы выше; e2e `checkbox.e2e.ts`. Г6 (CI) — не проверено | — |
| A | слот `#support` | отменён | Q28-Б → `#helper`/`#error` как у полей: `docs/system/ru-RU/decisions.md:120` | — |
| ЧВ-3 | `MCheckboxGroup` | отменён | `decisions.md:41` (W6-Б) | — |
| ЧВ-4 | `readonly` | отменён | `decisions.md:42` | — |

Токены: совпадают 13 из 14; расхождения — Ш7 (движение глифа).

## form/radio.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1а | `name ?? path`, слот подписи, без `aria-checked` | сделано | `utils/choice/useChoiceField.ts:89`, `radio/index.vue:27-28`; проба `path` — три одиночные радио с `path="size"` получили `name="size"`, Space+↓ выбирает вторую | — |
| Ш1б | реактивный `value` в регистрации (геттер) | нет | `components/ui/radio/index.vue:97-100` — `value: props.value` один раз; проба `value change` — у смонтированной радио `value` сменён на `b2` (атрибут `b2`), выбор даёт модели группы `b` | S |
| Ш2 | токены: роли кольца, инверсия слоя, focus 10, disabled ролями, точка и слой `error` | сделано | `assets/stylesheet/components/radio/_index.scss`; проба `ring roles` — кольцо `on-surface-variant` → hover `on-surface`, disabled `on-surface` 38 % без `opacity`, выбранная с ошибкой — точка и кольцо `error` | — |
| Ш3 | круглое кольцо на 40, цель 48, подпись, без масштаба, общий миксин | сделано | `choice/_control.scss:99-163`; проба `focus ring` — `outline` solid, радиус full, слой 0.1, `scale: none`; `coarse` — мишень 48, центры строк через 48 (смыкаются) | — |
| Ш4 | группа: токены, `label`/`#label` → `aria-labelledby`, строки 48 (РВ-4 = 2), `required` → `aria-required` | сделано | `radio/group/index.vue:6-23,109-116`, `_index.scss:27-36`; проба `group rows` — строки 47.95 без зазора, `radiogroup` назван «Payment», `aria-required="true"` | — |
| Ш4б | dev-предупреждение у группы без имени (FM-07, «Поведение») | нет | в `radio/group/index.vue` нет `import.meta.dev`; проба `nameless group` — ни одного предупреждения про radio (у `MChipGroup` такое есть) | S |
| Ш5 | ошибка группы: `invalid` в контексте, строка поддержки, `aria-describedby` | сделано | `group/index.vue:106-131`, `radio/index.vue:109`; e2e `radio.e2e.ts` «reports the error once» | — |
| Ш6 | движение: точка `medium-2`/`emphasized-decelerate`, цвет `short-1`/`linear`, disabled без анимации | сделано | `radio/_index.scss:37-40`, `index.vue:184-243` | — |
| Ш7 | тесты | частично | unit `tests/*`, e2e `radio.e2e.ts` есть; `stress.vue`, длинные подписи и RTL-фикстура нет | S |
| Г | Г1–Г5 | сделано | пробы выше; SSR — пресет группы рисуется выбранным в серверном HTML (G1-32) | — |
| РВ-3 | горизонтальная группа | отменён | `decisions.md:43` (W10-Б) | — |
| ЧВ-4 | read-only | отменён | `decisions.md:42` | — |

Токены: совпадают 12 из 12.

## form/switch.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | слот подписи, без `aria-checked`, только `disabled` | сделано | `switch/props.ts:15-27`, `index.vue:37-38`; проба `long label` — `input[aria-checked]` = 0, `role="switch"` у всех | — |
| Ш2 | токены ручки focus/pressed, слой в карте, focus 10, disabled-трек, точечные пути | сделано | `assets/stylesheet/components/switch/_index.scss:32-62`; проба `roles` — фокус: ручка off `on-surface-variant`, on `primary-container`, слой 0.1, `scale: none`; disabled-трек `surface-container-highest` 12 %, корень `opacity: 1` | — |
| Ш3а | RTL, `flex-shrink: 0`, перенос подписи, цель 48 | сделано | `index.vue:146-182`; проба `geometry (ltr/rtl)` — трек 52×32, ручка 16/24, центры 15.5/35.5 от inline-start в обоих направлениях (−0.5 — рамка 2rem рисуется 1px); `long` — трек 52 при подписи в 160; `coarse` — мишень ≈48 по блочной оси | — |
| Ш3б | сдвиг через `inset-inline-start` от центров 16/36 | отменён | `transform` + `:dir(rtl)`: `decisions.md:124`, G1-24 | — |
| Ш4 | ось `icons` + `#icon`, ручка 24 с иконкой, глиф 16, цвета | сделано | `props.ts:17-26`, `index.vue:21-31,199-226`; проба `icons` — `both-off` ручка 24, `selected-off` без глифа, глиф 16, on `on-primary-container`, off `surface-container-highest` | — |
| Ш5 | ошибка и `required` (ПВ-2) | сделано | по решению B6.1b (`decisions.md:124`): рамка трека и слой `error`, текст — в строке. Проба: у `error-on` трек остаётся `primary` с рамкой `error` 2rem — уже, чем вариант 1 ПВ-2 («трек error у включённого») | — |
| Ш6 | движение: рост до 28 на нажатии без перехода, иконка fade+поворот | сделано | `index.vue:210-226,286-291`, `_index.scss:63-68`; проба `press` — `transition-duration: 0s` на нажатии | — |
| Г1/«Совпадает» | ручка 28 на нажатии (`SwitchTokens` 16/24/28) | частично | проба `press (mouse)` — нажатая ручка рисуется **24×28 (овал)** в обоих значениях: контейнер ручки 24 × 24 flex (`index.vue:162-173`, `thumb.size.on`), ручка 28 (`:286-291`) сжимается по главной оси (`flex-shrink: 1`). Тон нажатия верный. Было и в HEAD (`git show HEAD:…/switch/index.vue:110-121,184-186`) — не регресс | S |
| Ш7 | тесты | частично | unit + e2e `switch.e2e.ts` есть; в `matrix.vue` нет оси `icons`, `stress.vue` нет | S |
| Г | Г2–Г5 | сделано | пробы выше | — |
| ПВ-3 | read-only | отменён | `decisions.md:42` | — |
| ПВ-4 | `controlPlacement` | отменён | `decisions.md:44` | — |

Токены: совпадают 12 из 13; сдвиг ручки — отменён решением; дефект размера 28 — строкой выше.

## form/chip.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | карта токенов: роли, форма small, отступы по содержимому, ветки `elevated`/`avatar`/`disabled`/`focus`/`state` | сделано | `assets/stylesheet/components/chip/_index.scss`; проба `paddings` — только подпись 16/16, ведущая иконка 8/16, хвостовая 16/8, input 12/12, input с аватаром 4/8; высота 32; рамка `outline-variant` 1px; подпись assist `on-surface`, filter `on-surface-variant` | — |
| Ш2 | слой `::before`, без подмены фона, без `translateY` | сделано | `chip/_states.scss:12-39`; проба `state layer` — hover 0.08, pressed 0.12, фон контейнера прозрачный, `transform: none` | — |
| Ш3 | disabled ролями, тени elevated | сделано | `_states.scss:196-215`; проба — disabled `opacity: 1`, текст `on-surface` 38 %, рамка 12 %; elevated: `surface-container-low`, level 1 → hover level 2, disabled без тени | — |
| Ш4 | `variant` outlined/elevated, suggestion по умолчанию outlined | сделано | `chip/props.ts:19,35`; проба — suggestion без тени и с рамкой (W14/W15, `decisions.md:132`) | — |
| Ш5 | `aria-pressed` у standalone filter, галочка заменяет иконку, рост ширины | сделано | `composables/chip/useChipControl.ts:151`, `fragments/chip/content.vue:4-31`; проба `selected filter` — галочка вместо иконки, ширина не меняется, `aria-pressed="true"`, `secondary-container` / `on-secondary-container`; у assist `aria-pressed` нет | — |
| A | типизированный `value` (generic `TValue`) | нет | `chip/props.ts:37` — `PropType<unknown>` (G1-31) | M |
| Ш6 | переполнение, многоточие, цель 48 у однокнопочного чипа | сделано | `_states.scss:108-114`, `index.vue:179`; e2e `chip.e2e.ts` (тултип, длинные подписи); проба `coarse` — мишень ≈48 | — |
| S8 | мишень 48 у `removal="button"` | частично | `index.vue:2-11,179`: `touch-target` ложится на обёртку `<span class="ui-chip ui-chip--multi">`, а не на кнопку. Проба `coarse` — в зоне 6rem над чипом `elementFromPoint` = `SPAN` обёртки, тап там не переключает чип (`aria-pressed` false → false). У кнопки удаления своей мишени 48 нет (мышью — 27×27 за счёт `::before`, ≥ 24 по WCAG 2.5.8) | S |
| Ш7 | input-чип: `#avatar`, ось `removal`, стрелки, `remove`, миграция `MDropdown`/`MAutocomplete` | сделано | W17-Б (`decisions.md:133`), `fragments/dropdown/Chips.vue:10-11`; проба `removal="button"` — две кнопки, → на удаление, ← назад, Enter на удалении эмитит `remove`, имя «Remove Anna», аватар 24; `whole` — одна кнопка с `aria-label`, клик удаляет, без `aria-pressed` | — |
| Ш8 | статичная форма выбранного `full` | отменён | В-3 = 1: `decisions.md:132` («держит угол small») | — |
| В-6 | тултип обрезанной подписи | сделано | `utils/chip/useChipTip.ts`, `decisions.md:135`; e2e `chip.e2e.ts` «cut-off label shows its full text» | — |
| Ш9 | тесты | частично | unit `tests/{variants,interaction,a11y,anatomy,removal,truncation}.spec.ts`, e2e есть; в `matrix.vue` нет input-чипа с удалением/аватаром и elevated, `stress.vue` нет | S |
| Г | Г1–Г6, Г8 | сделано | пробы выше; Г7 (CI) — не проверено | — |

Токены: совпадают 16 из 16.

## form/chip-group.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | токены: `gap` 8, `label`, запас из `$theme-focus-link` | сделано | `assets/stylesheet/components/chip-group/_index.scss:10-21` | — |
| Ш2 | порядок обхода из DOM | сделано | `utils/chip-group/createChipRoving.ts:38-56`; проба `order` — чип, вставленный в середину, достигается → вторым; End → последний; → с конца — на первый | — |
| Ш3 | прокрутка: запас = кольцо, `scroll-padding-inline`, `overscroll-behavior-inline` | сделано | `chip-group/index.vue:344-353`; проба `scroll row` — `padding` 5 со всех сторон, `overscroll-behavior-x: contain`; после End край последнего чипа в 3.08px от края ряда (5rem = 3.33px, `scrollLeft` целый) | — |
| Ш4 | `label`/`#label` → `aria-labelledby`, dev-предупреждение без имени | сделано | `index.vue:10-21,161-174`; проба `field` — `group` назван «Tags»; `nameless` — `[m-chip-group] the group has no name` | — |
| Ш5 | режим поля: `path`, строка поддержки, `required`, `aria-describedby` | сделано | `index.vue:59-84,154-166`; проба `field` — описание «Up to two», маркер `*`, на `max` невыбранный чип `aria-disabled="true"` | — |
| Ш6 | фокус после удаления: сосед → … → корень | частично | соседу передаёт (проба: удалили Two → Three, удалили Three → One). Удаление **последнего** чипа роняет фокус на `BODY` (проба `removing`), хотя `onOrphanedFocus` должен сфокусировать ряд (`index.vue:203-206`). Вероятная причина: `@focusout="orphanedFocus = false"` (`index.vue:29`) снимает `tabindex="-1"` до `nextTick`-фокуса — не проверено | S |
| Ш7 | вход Tab на последний фокус (ГВ-1 = 1) | сделано | `createChipRoving.ts:58-62,100-103`; проба `order` — Shift+Tab/Tab возвращает на «Inserted»; одна остановка Tab, в SSR тоже (`first frame` — один `tabindex="0"`) | — |
| Ш8 | затухание у края (ГВ-4 = 1) | сделано | `index.vue:283-375`; проба — `animation-timeline: scroll(self inline)`, в покое fade start 0 / end 24rem, после End — start 24rem / end 0. `--ui-chip-group-fade-*` разрешены `decisions.md:68` | — |
| Ш9 | тесты: фикстуры `chip-group/{matrix,stress}`, e2e `chip-group.e2e.ts` | частично | unit `tests/{variants,interaction,keyboard,field,a11y}.spec.ts` есть; папки `playground/fixtures/chip-group/` и e2e нет (группа есть только строкой в `chip/matrix.vue`) | M |
| ГВ-5 | read-only | отменён | `decisions.md:42` | — |

Токены: совпадают 5 из 5.

## form/slider.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | имя и атрибуты: `aria-labelledby`, без «start/end», `role="group"` у range, `aria-*` на ручки | сделано | `slider/index.vue:128-197`; проба `names` — группа range с `aria-labelledby`, ручки «Minimum price»/«Maximum price»; `invalid` — `aria-invalid` и `aria-describedby` на ручке | — |
| Ш2 | композабл: RTL, `insetInlineStart`, `touch-action` по оси, центр шкалы | сделано | `composables/slider/useSliderControl.ts:233-302,350-351`, `createSlider.ts:183-197`; проба `RTL` — ← поднимает 50 → 51, клик на 10 % слева даёт 90; `centered` — активный трек от 0.500 до 0.683; SSR — `inset-inline-start:40%`, трек `touch-action:pan-y`, ручка `none` | — |
| Ш3 | Expressive-трек: сегменты с зазором 6, внутренние углы 2, ручка 4×44 без тени, stop 4, тики 4 по ролям, disabled ролями | сделано | `fragments/slider/track/index.vue`, `thumb/index.vue`, `assets/stylesheet/components/slider/_index.scss`; проба `anatomy` — трек 16, ручка 4×44, зазор 6/6, углы 8 снаружи / 2 к ручке, неактивный `secondary-container`, stop 4 с центром в 8 от конца, `box-shadow: none`; `discrete` — 5 тиков по 4, неактивные `primary`, stop нет; disabled — 38 % / 12 % / ручка 38 % | — |
| Ш3п | правила кита в презентации | частично | `fragments/slider/root/index.vue:48-50` — `&--dragging * { transition: none !important }`: универсальный селектор с `!important` вместо BEM-элементов | S |
| Ш4 | value indicator: капсула, на нажатии/клавиатуре, не на hover, Esc/blur, `format`, `#value` | сделано | `thumb/index.vue:129-164`, `useSliderControl.ts:193-196,279-290,355-357`; проба `states` — hover: ручка 4, значение скрыто, курсор pointer; нажатие: ручка 2, капсула 48×44, `inverse-surface`, label-large, `tabular-nums`, 12 над ручкой; отпускание прячет; шаг стрелкой показывает «51»; Esc и blur прячут | — |
| Ш5 | `density` + inset-иконка (СЛ-1 = 1) | сделано | `props.ts:18,40`; без `ResizeObserver` — две копии иконки в `cqi` (G1-22, `decisions.md:129`); проба `comfortable` — трек 40, ручка 52, угол 12, обе копии иконки 24 в 12 от начала трека | — |
| Ш6 | поле формы (СЛ-4 = 1) | сделано | `slider/index.vue:84-109,140,199-207` | — |
| СЛ-2 | dev-предупреждение `origin` на `range` (W2-А) | нет | `slider/index.vue:186` молча подменяет `origin` на `'start'`; единственное dev-предупреждение — про имена ручек (`:161-167`); проба `origin on a range` — предупреждений `m-slider` нет | S |
| Г6 | `MSlider` потребляет `rangeAttrs` | отменён | `decisions.md:129` (G1-30): сегменты из `activeRange`, `rangeAttrs` — для своей разметки | — |
| Ш7 | тесты | частично | unit + `useSliderControl.spec.ts` + e2e `slider.e2e.ts` есть; `stress.vue` (0…1 000 000, шаг 0.01, «1 250 000 ₽») нет | S |
| Г | Г1–Г5, Г7 | сделано | пробы выше; Г8 (CHANGELOG в репозитории docs_v2) — не проверено | — |

Токены: совпадают 15 из 15.

## form/rating.md — тег `done` → факт `частично` на старте аудита; после правок родителя — сделан, кроме стресс-фикстуры (тег неверен на старте)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | без `loading`, без дефолтного имени и «N of M», `valueText`, `touch-action`, значки из `ICONS` | сделано | `rating/props.ts:16-37`; `touch-action: pan-y` по решению B8.10b (`decisions.md:130`); проба `a11y` — `aria-valuetext` без `valueText` нет, `touch-action: pan-y` | — |
| Ш2 | центровка залитого значка, disabled ролями, превью только у живого | сделано | бокс глифа `index.vue` (`ui-rating__glyph`), `--live`; e2e «no double star»; проба `a11y` — disabled: корень `opacity: 1`, значки `on-surface` 38 % | — |
| Ш3 | read-only в Tab (РТ-1 = 1) | сделано | `decisions.md:139`; проба — `tabindex="0"`, `aria-readonly="true"` | — |
| Ш4 | поле формы (РТ-2 = 1) | сделано | проба `a11y` — `aria-labelledby` → «Your rating», `aria-describedby` → «Rate the delivery», пустые значки `error` | — |
| Ш5 | длинная шкала (РТ-3 = 1) | сделано | JSDoc `props.ts:22-26` (W26-А, `decisions.md:45`) | — |
| Указатель | значение по звезде под указателем, превью, только левая кнопка [занят] | сделано (родитель, в ходе аудита) | На старте (код прочитан в начале сессии): `valueFromPointer` считал долю по всему ряду с зазорами и округлял, `@pointerup` фиксировал любую кнопку, `&--live &__control:hover &__fill { opacity }` гасил все залитые значки; то же в HEAD (`git show HEAD:…/rating/index.vue:23,101-104,199`). Сейчас: `utils/rating/pointer.ts` (звезда под указателем, `ceil` по шагу), `onPointerDown` — только `button === 0`, превью отдельным слоем под фиксированной заливкой. Пробы `rating.probe.ts` 1–4 зелёные: 20/45/80 % звезды 3 → 3; половины 1.5/2/3.5/4; превью 5 над 3 — звёзды 1–3 сплошные, 4–5 полупрозрачные 0.72; превью 1 под 3 — одна сплошная; правый клик модель не меняет | — |
| Ш6 | тесты | частично | `tests/*`, `utils/rating/pointer.spec.ts`, e2e `rating.e2e.ts` есть; `stress.vue` (`length` 10 и 20 в колонке 320) нет | S |
| Г | Г1–Г5 | сделано | пробы выше | — |

Токены: совпадают 7 из 7.

## form/selection-group.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | `inheritAttrs: false` + `attrs` в scope `#default` | отменён | Q45-А: остаётся безголовой, `decisions.md:138`; JSDoc `selection-group/index.vue:30-36`; проба `fragment root` — атрибуты потребителя никуда не попадают, 2 предупреждения Vue «Extraneous non-props attributes» | — |
| Ш2 | бэги доступности по `pattern` (ВГ-1 = 2) | частично | `utils/selection/patternAttrs.ts`, `useSelectionItem.ts:165-170`; проба `pattern bags` — `toggle`: `role="group"`, `aria-pressed`, на `max` `aria-disabled`, без классов и `data-*`. Но (1) в режиме данных (`items` + `#item`) строки рендерятся **соседями** обёртки `#default` (`index.vue:1-26`): `groupAttrs` (`radiogroup`/`listbox`) некуда надеть вокруг элементов — проба: 0 `role="radio"` внутри `role="radiogroup"`; (2) `groupPatternAttrs` не отдаёт `aria-disabled` отключённой группы (`patternAttrs.ts:27-34`), хотя ВГ-1 его перечисляет | M |
| Ш4 | нагрузка: фикстура 1000 элементов | нет | фикстуры `selection-group` нет | S |
| Ш5 | тесты: unit, e2e-фикстура `selection-group/matrix.vue` + axe | частично | unit `tests/{variants,interaction,a11y}.spec.ts` (включая `pattern (W27-Б)`) есть; e2e и фикстуры нет | S |
| Г | Г2, Г4 | сделано | спека `a11y.spec.ts:35-64`; SSR-пресет (`decisions.md:137`) — проба: `preset-b` «(selected)» | — |
| ВГ-2 | read-only | отменён | `decisions.md:42` | — |
| ВГ-3 | roving | отменён | `decisions.md:213` (W28-А, отложено до общего roving-композабла) | — |

Ш3 (документация в репозитории `docs`) — не проверено. Токены: неприменимо.

## form/selection-item.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | `attrs` в `SelectionItemState`, общий для ручного и data-пути | сделано | `composables/selection/useSelectionItem.ts:165-170`, `context.ts:53-64`; проба `pattern bags` — `MSelectionItem` отдаёт `aria-pressed`/`aria-disabled` | — |
| Ш3 | тесты | сделано | `selection-group/tests/a11y.spec.ts:35-64` | — |
| Г | Г1–Г3 | сделано | то же | — |

Ш2 (документация в `docs`) — не проверено.

## form/form-renderer.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | поля по типам (FM-08) | сделано | `fragments/form-renderer/field/index.vue:1-77`; проба — дети формы: `text-field ×2` (search с `type="search"`), `textarea`, `number-input`, `checkbox`, `switch`, группа радио, `dropdown` | — |
| Ш2 | `v-model`, события | сделано | `form-renderer/index.vue:49-79` (`submitted`/`invalid`, G1-26, `decisions.md:140`); проба — пустая отправка → `invalid`, заполненная → `submitted`, `v-model` получает `{"name":"Ann",…}` | — |
| Ш2б | реактивный `config` | отменён | Q36-А, `decisions.md:140`; JSDoc `index.vue:36-39` | — |
| Ш3а | `aria-busy` на форме, `loading` у кнопки | сделано | `index.vue:4,18-23`; проба — `aria-busy="true"` во время отправки | — |
| Ш3б | результат — постоянный `role="status"` (DT-09) | нет | в `form-renderer/index.vue` live-региона нет; проба `form-a11y` — прямых `role="status"` у формы 0 (на странице только `ui-dropdown__status` и глобальный `ui-live-region`) | S |
| Ш4 | сводка ошибок `MAlert` + фокус (FM-11) | нет | G1-31: у адаптера нет карты ошибок | M |
| Ш5 | карта токенов, логические свойства | сделано | `assets/stylesheet/components/form-renderer/_index.scss`; `margin-block-end` у легенды (`field/index.vue:223-226`); проба — `gap` 16, ряд действий `flex-end` | — |
| Ш6 | `submitLabel` без дефолта + dev-предупреждение | сделано | `index.vue:44,81-87` (Q32-А) | — |
| В1, В2 | действия в конце, тип `select` | сделано | W29-А, W30-А (`decisions.md:140`); `field/index.vue:148-156` | — |
| a11y | поля из конфига проходят axe | частично | проба `form-a11y` — axe `button-name`: степперы `MNumberInput` без имени (`field/index.vue:126-132` не передаёт `incrementLabel`/`decrementLabel`, а дефолтов нет по Q32-А); `radiogroup` внутри `fieldset` без имени (`field/index.vue:160-183`: `legend` называет `fieldset`, `MRadioGroup` без `label`) | S |
| Ш7 | документация и тесты | частично | unit `tests/{variants,interaction,a11y}.spec.ts` есть; e2e и фикстуры нет; документация — в `docs`, не проверено | S |

Токены: совпадают 3 из 3.

## common.md — S8, S9 (в части контролов выбора)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| S8 | мишень 48: миксин `touch-target`, только `pointer: coarse` | сделано | `assets/stylesheet/abstracts/_mixins.scss:189-209`; подключён: `choice/_control.scss:116` (флажок, радио), `switch/index.vue:159`, `chip/index.vue:179`; пробы — на мыши `::after` нет, на таче 48 у флажка/радио/переключателя/чипа. Исключение — чип `removal="button"` (строка в chip.md) | — |
| S9 | общая ветка `selected` (контейнер, контент, форма) в картах | частично | общая схема `selected`/`unselected` есть только у кнопок (`abstracts/_functions.scss:131-178`); у выбора каждый по-своему: `checked` (`checkbox/_index.scss:24-27`, `radio/_index.scss:24`), `on` (`switch/_index.scss:29,40`), `selected` с разными ключами (`chip/_index.scss:34,43,60-64`, `choice/_control.scss:37-38`) | M |

## Регрессии

Нет. Найденные дефекты были и в HEAD: овальная нажатая ручка переключателя (`git show HEAD:src/runtime/components/ui/switch/index.vue:110-121,184-186`), указатель оценки (`…/rating/index.vue:23,101-104,199` — уже исправлен родителем). Остальные пункты — новый код прогона 2, работавшей версии у них не было.

## Планы с неверным статусом (тег → факт, одна строка почему)

- `form/checkbox.md` — `done` → частично: нет прорисовки галочки и `stress`-фикстуры (тег сам называет первое).
- `form/radio.md` — `done` → частично: геттера `value` нет (тег это признаёт), нет dev-предупреждения у безымянной группы (тег молчит).
- `form/switch.md` — `done` → частично: нажатая ручка — овал 24×28 вместо круга 28; оси `icons` нет в фикстуре.
- `form/chip.md` — `done` → частично: нет generic `TValue` (признано); мишень 48 у `removal="button"` мёртвая (не признано).
- `form/chip-group.md` — `done` → частично: удаление последнего чипа роняет фокус на `body`; нет фикстур и e2e.
- `form/slider.md` — `done` → частично: нет dev-предупреждения `origin` на `range` (W2-А), универсальный селектор `--dragging *`.
- `form/rating.md` — `done` → на старте частично (указатель по ряду, превью гасит заливку, правый клик фиксирует); родитель исправил в ходе аудита — пробы зелёные.
- `form/selection-group.md` — `done` → частично: в режиме данных `groupAttrs` не может обернуть элементы; нет фикстуры на 1000.
- `form/form-renderer.md` — `done` → частично: нет `role="status"` и сводки ошибок (сводку тег признаёт); поле `number` и радиогруппа не проходят a11y.
- `form/selection-item.md` — тег верен.

## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные

В планах группы неотвеченных нет: ЧВ-1…5, РВ-1…4, ПВ-1…4, В-1…6, ГВ-1…5, СЛ-1…4, РТ-1…3, ВГ-1…3 и вопросы 1–2 form-renderer закрыты (W1–W30, Q28/Q29/Q32/Q36/Q45, `decisions.md:41-45,120-140,213`).

Новые развилки, которые вскрыл аудит (у каждой — рекомендация аудитора):
1. `selection-group.md`, ВГ-1 в режиме данных: где живёт обёртка с `groupAttrs`, если строки из `items` рендерятся после `#default`? (а) отдавать в scope `#default` рендер-функцию или компонент строк, чтобы потребитель положил их внутрь своей обёртки; (б) экспортировать `groupPatternAttrs` и документировать обёртку вокруг самой `MSelectionGroup`; (в) в режиме данных `pattern` не поддерживать. Рекомендация: (а) — без новой обёртки и без потери безголовости.
2. `form-renderer.md`: как назвать степперы `number` в форме из конфигурации, если у `MNumberInput` нет английских дефолтов? (а) требовать `field.props.incrementLabel/decrementLabel` и предупреждать в деве; (б) у рендерера проп словаря подписей для всех полей; (в) в рендерере `number` без степперов. Рекомендация: (а) — минимум API.

## Пункты в занятых родителем файлах

- `components/ui/rating/**`, `assets/stylesheet/components/rating/**` — указатель, превью, правый клик: [занят], чинит родитель; на момент проб исправлено (`rating.probe.ts` 1–4 зелёные). Стресс-фикстура `rating/stress.vue` — в занятой папке `playground/fixtures/rating/`, тоже за родителем.
- `composables/selection/useSelectionGroup.ts` — порядок `multiple` (пресет переупорядочивается по регистрации): [занят], чинит родитель; аудит не пробовал. Пункт S9 и дефект `MSelectionGroup` в режиме данных этот файл не затрагивают (`selection-group/index.vue`, `utils/selection/patternAttrs.ts`).
- `composables/slider/createRangeKeyboardController.ts` — пунктов группы в нём нет.

## Пробы (файл → тесты → прошло/упало, ключевые измерения)

Полный прогон: 54 теста, 46 прошло, 8 упало — все 8 падений и есть найденные дефекты. Запуск: `npx playwright test -c playwright.probe.config.ts playground/probes/plans-audit-2/form --output test-results/plans-audit-2/form`. Допуски в пробах учитывают округление при 1rem = 0.667px: `outline-offset` 2rem → 1px, рамка 2rem → 1px (центры ручки переключателя 15.5/35.5), `clientWidth` — целые пиксели (мишень 48.52).

- `checkbox.probe.ts` → 7 → 7/0: бокс 18, слой 40, глиф 18; кольцо solid вокруг слоя, слой focus 0.1, `scale: none`; рамка `on-surface-variant` → hover `on-surface`, hover-слой 0.08; disabled ролями, корень `opacity: 1`; checked+error и mixed+error — заливка `error`; mixed нативный, без `aria-checked`; подпись в 200 переносится, бокс 40, центр первой строки = центр бокса; мишень: мышь — нет, тач — 48; SSR — класс mixed, `aria-describedby` на строку.
- `radio.probe.ts` → 8 → 6/2: роли кольца, disabled ролями, точка ошибки `error`; строки группы 47.95 без зазора, группа «Payment», `aria-required`; общий `path` → `name="size"`, Space+↓ выбирает вторую; круглое кольцо, слой 0.1; тач — мишень 48, шаг строк 48; SSR — пресет выбран. **Упали:** смена `value` у смонтированной радио не доходит до группы (модель `b` вместо `b2`); у безымянной группы нет dev-предупреждения.
- `switch.probe.ts` → 7 → 6/1: трек 52×32, ручка 16/24, центры 15.5/35.5 в LTR и RTL; фокус — ручка `on-surface-variant` / `primary-container`, слой 0.1; disabled-трек `surface-container-highest` 12 %; `error-on` — трек `primary` + рамка `error`; иконки — ручка 24, глиф 16, цвета по токенам; длинная подпись не сжимает трек; тач — мишень ≈48 (CDP `touchStart` в эмуляции не даёт `:active` — нажатие проверено мышью). **Упало:** нажатая ручка 24×28 (овал), ждали 28×28.
- `chip.probe.ts` → 7 → 6/1: отступы по содержимому, высота 32, рамка `outline-variant`, роли по типу; галочка заменяет иконку без смены ширины, `aria-pressed`, `secondary-container` / `on-secondary-container`; слой `::before` 0.08 / 0.12, без сдвига; disabled ролями; elevated level 1 → 2; `removal="button"` — стрелки, `remove`, аватар 24, отступ 4, удаление мышью 27×27; `whole` — имя и удаление. **Упало:** тап в зоне мишени 48 над чипом `removal="button"` попадает в `<span>` обёртки и ничего не делает.
- `chip-group.probe.ts` → 7 → 6/1: имя, описание, маркер, блок `max`; одна остановка Tab, порядок DOM после вставки, кольцо, End, возврат Tab; RTL ←, вертикаль ↓; запас 5, `overscroll contain`, затухание по scroll timeline; dev-предупреждение без имени; SSR — один `tabindex="0"`. **Упало:** после удаления последнего чипа фокус на `BODY`.
- `slider.probe.ts` → 9 → 8/1: анатомия XS и M (трек 16/40, ручка 4×44 / 4×52, зазор 6, углы 8 и 12 / 2, stop 4 в одном угле от конца, без тени); hover — только курсор; нажатие — ручка 2, капсула 48×44 `inverse-surface` `tabular-nums` в 12 над ручкой; клавиатура показывает, Esc и blur прячут; тики 4 по ролям, без stop; disabled ролями; centered 0.5 → 0.683; имена range, поле; axe на поле с `required` чисто; RTL ← и клик; SSR — позиции ручки и сегментов в серверном HTML. **Упало:** dev-предупреждения `origin` на `range` нет.
- `rating.probe.ts` → 5 → 5/0 (после правок родителя): звезда под указателем на 20/45/80 % → 3; половины → 1.5/2/3.5/4; превью над значением — только добавка 0.72, под значением — сплошное меньшее; правый клик не фиксирует; повторный клик при `clearable` → 0; read-only `tabindex="0"`; поле — имя, описание, пустые значки `error`; disabled ролями; `touch-action: pan-y`.
- `selection-form.probe.ts` → 3 → 2/1: `toggle` — `role="group"`, `aria-pressed`, `max` → `aria-disabled`, без классов и `data-*`; атрибуты на фрагментном корне отброшены с 2 предупреждениями Vue (по Q45-А), SSR-пресет выбран; form-renderer — типы → компоненты, `search`, действия `flex-end`, `gap` 16, `aria-busy`, `invalid` → `submitted`, `v-model`. **Упало:** в режиме данных 0 элементов `role="radio"` внутри обёртки `radiogroup`.
- `form-a11y.probe.ts` → 1 → 0/1: **упало** — своего `role="status"` у формы нет; axe `button-name` на степперах `MNumberInput`.

## Добавленные фикстуры

- `playground/fixtures/checkbox/audit-long.vue` — длинная подпись в 200, `required`, mixed+error, disabled mixed.
- `playground/fixtures/radio/audit-form.vue` — радио по общему `path`, выбранная с ошибкой, группа с `label`/`required`, безымянная группа, смена `value`.
- `playground/fixtures/switch/audit-icons.vue` — ось `icons` × значение × disabled, длинная подпись в 160.
- `playground/fixtures/chip/audit-anatomy.vue` — иконки, хвост, elevated, `removal="button"`/`whole`, аватар.
- `playground/fixtures/chip/audit-group.vue` — поле с `max`, порядок со вставкой, удаление, вертикаль, прокрутка, безымянная группа.
- `playground/fixtures/slider/audit-geometry.vue` — середина, range + `origin`, comfortable с иконкой у низкого значения, дискретный шаг 25, `required`.
- `playground/fixtures/audit-rating/pointer.vue` (новая папка) — целые, половины, `clearable`, read-only, поле.
- `playground/fixtures/audit-form/selection-group.vue`, `playground/fixtures/audit-form/form-renderer.vue` (новая папка) — `pattern` radio/toggle с `max`, атрибуты на фрагментном корне; форма из восьми типов с `veeValidateAdapter`.
- `touch playground/app/utils/fixtures.ts` — только время изменения, чтобы сервер увидел новые папки.
