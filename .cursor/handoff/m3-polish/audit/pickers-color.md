# Аудит pickers-color (w5) — 2026-10-18

Группа: MDatePicker + MDialogDate, MTimePicker, MColorPicker, MColorInput, MOtpInput. Код — HEAD c9da731,
`src/` не правился. Пробы: `playground/probes/w5-pickers-color/{date,time,color,otp,followup}.probe.ts`
(заявки w5-pickers-color-001…005, артефакты `test-results/conductor/w5-pickers-color-00N/`). Новые кейсы
фикстур (только мои папки): `playground/fixtures/date-picker/dialog.vue`, `time-picker/modes.vue`,
`color-input/swatches.vue`. Базовая карта — `.cursor/temp/m3-polish/baseline/pickers-color.md`, размеры CSS —
`baseline/css-sizes.json`.

Колонка «Развилка?» — по §5.6: «нет» — можно в работу сразу; «да → Q-N» — ждёт решения (рекомендация в
разделе развилок); «СТОП» — стоп-правило §8.5.

Сверка с Compose Material3 (`TimePicker.kt`, `DatePicker.kt`, androidx-main, только чтение): циферблат
переключает часы/минуты одним `Crossfade` (одновременно), цвет выбранной цифры рисуется смешением с кругом
ручки (`BlendMode.DstOver`), при драге ручка ведётся за пальцем и анимируется только `onDragEnd`;
`ClockDisplayNumbers` и поля ввода принудительно LTR, переключатель AM/PM — нет (зеркалится); месяц
листается `animateScrollToItem` (горизонтальный сдвиг), смена режима — `AnimatedContent` со слайдом и
`SizeTransform`, год-вью — `expandVertically + fadeIn`.

---

## MDatePicker

Источники: план `inputs/date-picker.md` (done 2026-10-08), QA FAIL CT-11, ST-06/CT-05 (приняты), TH-07
(устарел: `color-scheme` ставят темы); базовая карта — «ничего не сдвинулось» (matrix), в stress только
прокрутка страницы фокусом; пробы 001, 005.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| DP-B1 | B | **Год-вью открывается не на своём годе.** После открытия фокус на 2026, но список прокручен к 2040–2057: выбранный год вне видимой области. Причина — `cell.offsetTop` считается от `offsetParent` (body или панель диалога), а не от списка: `scrollTop` перелетает на `list.offsetTop` (253 px ≈ 380rem в matrix, 1278 px в stress). e2e проверяет только фокус, не видимость | `fragments/date-picker/year-grid/index.vue:78`; 001 `years-open.json`: `scrollTop 1298`, год `y 99`, список `y 253…476`, `insideList false`, `offsetParent BODY`; скрин `years-open-settled.png` | считать позицию от списка: `cell.offsetTop - list.offsetTop` или `getBoundingClientRect` разницей; e2e «выбранный год виден внутри списка» | S | нет |
| DP-B2 | B | **Год-вью сначала показывает 1926, потом прыгает** (Г-D1 подтверждена). Пока список проявляется, `scrollTop = 0`; прокрутка — только в `@after-enter`, на ~515 мс | 001 `years-frames.json`: `scrollTop 0` на 360 и 477 мс; `years-open.json` issue `year jump -1947 rem at 515 ms`; скрин `years-400ms.png` (1926…1946 на экране) | ставить `scrollTop` до показа (в `onEnter`/при монтировании сетки, `preventScroll`), фокус — после | S | нет |
| DP-B3 | B | Высота карточки меняется на 1rem при смене дни↔годы (Г-D2 подтверждена): дни 336, годы `calc(48·7 − 1rem)` | `stylesheet/components/date-picker/_index.scss:70`; 001: карточка 342.33 → 341.66 px (−1rem) | `height-total` = ровно `grid.cell × 7` | S | нет |
| DP-B4 | B | Рипл стрелки месяца в RTL стартует из зеркальной точки (Г-D5 подтверждена): `scaleX(-1)` отражает всю `MButtonIcon`, рипл считает точку по `clientX`. Плюс `transform` есть в списке переходов `.ui-button` — переворот анимируется при смене `dir` | `_parts.scss:128-130`; 001 `arrow-ripple-rtl.json`: нажатие x 1025.3, центр волны 1041 (кнопка 1020…1046.7); в LTR 226.7 → 227 | отражать только иконку (класс на `MIcon` стрелки), кнопку не трогать | S | нет |
| DP-B5 | B / a11y | Таб-стоп пустого пикера — 1-е число, а не «сегодня» (Г-D7 подтверждена): `focused = ref(restingFocus())` при setup, `today` ставится в `onMounted`, наблюдателя на `today` нет. План требует «выбранный или сегодняшний» (A11-12) | `composables/date/useDateGridControl.ts:98, 108`; `composables/date/index.ts:78`; 001 `empty-tab-stop.json`: таб-стоп «Thursday, October 1», сегодня «Sunday, October 18» | пересчитывать покойный фокус при появлении `today`, пока пользователь не двигал фокус | S | нет |
| DP-B6 | B | Клавиатура года — отдельная механика в фрагменте (свой `onKeydown`, DOM-поиск, `getComputedStyle` на каждое нажатие), а не в control-композабле, как у дней | `year-grid/index.vue:87-103` | `useYearGridControl` рядом с `useDateGridControl` (бэги, без классов), фрагмент — презентация | M | нет |
| DP-B7 | B / a11y | Home/End в год-вью уводят фокус за пределы видимого: Home фокусирует 1926, а список показывает 1941–1958 (тот же корень, что DP-B1). Кольцо года у нижнего края (2126) не срезается (Г-D6 у низа не подтвердилась); верх проверю после DP-B1 | 005 `years-edges.json` (`light-home: 1926`, focus-visible), скрины `years-home-light.png`, `years-end-dark.png` | закрывается DP-B1; e2e «год под фокусом виден» на Home/End | — | нет |
| DP-A1 | A | Hairline `1rem` (разделитель, кольцо «сегодня», кольцо текущего года) — не `max(1px, 1rem)` | `_index.scss:41, 55, 67` | перевести карту | S | нет |
| DP-D1 | D | Миксин `state-layer($t)` построчно повторён в time-picker; в выходном CSS слой рисуется отдельным блоком для дня, года и кнопки месяца | `_parts.scss:11-41` ≡ `time-picker/_parts.scss:11-41` | один миксин (заявка в `abstracts` или общий партиал группы), селекторы слоя — одним списком | S | нет |
| DP-D2 | D | Значения мимо карты: `spacing(12)` у кнопки месяца, `spacing(8)` — зазор строки заголовка | `_parts.scss:67, 100` | в `$tokens` | S | нет |
| DP-D3 | D | Длительности перехода видов — строкой `var(--sys-motion-…)` в `.vue`, а не из карты; классы `.ui-date-picker-view-*` вне блока | `ui/date-picker/index.vue:330-338` | брать `g($t, 'motion.*')`, как слои | S | нет |
| DP-D4 | D | Снятый проп `headline` (+ `useRetiredPropWarning`) | `ui/date-picker/index.vue:180, 221`; `props.ts` `headline` | удалить по решению 2026-10-18; спека — следом | S | нет |
| DP-C1 | C | Нет пропов формы: `helperText`, `error`, `errorMessage`, `required`, `name` (у `MTimePicker` они есть). Демо рисует свою строку ошибки | `demo/orders/NewOrderDeliveryFields.vue:26-32` | по Q-4 | M | да → Q-4 |
| DP-C2 | C | Тип модели не сохраняется: строка на входе — `Date` на выходе | `composables/date/index.ts:112-115`; 001 `dialog-payloads.json` iso: `valueAfter "Date Tue Oct 20"` при модели `'2026-10-14'` | по Q-5 | S | да → Q-5 |
| DP-B8 | B | Месяц листается мгновенно (в Compose — горизонтальный сдвиг) | `composables/date/index.ts:95-102` | по Q-2 | S–M | да → Q-2 |

Проверено, не дефект: год-вью ↔ дни — fade на токенах без рывка соседей (`issues` только по opacity);
5↔6 недель — высота стабильна (e2e есть); смена месяца не двигает соседей (базовая карта); удаление лет
вне min/max (концепт рисует их 38%) — оставляю: в списке нет мёртвых целей, в Compose диапазон лет — отдельный
`yearRange`, которого у кита нет.

Минимизация: выходной CSS `date-picker` **7794 Б / 1556 gzip** (+ `date-dialog` 530/297). Станет ≈7100/1450:
слой состояния одним списком селекторов вместо трёх блоков `::before`/`:hover`/`:active`/`:focus-visible`
(≈500 Б), переворот иконки вместо кнопки, без дублей переходов. Строки `src` ≈1630 → ≈1600 (+`useYearGridControl`,
−логика из фрагмента).

## MDialogDate

Источники: e2e date-picker (2 теста диалога), `dialog.json` (часть про date **устарела**: ссылки на 881-строчную
версию до c9da731), демо `CrmDateField.vue`, `OrdersPeriodPicker.vue`; пробы 001, 005; новая фикстура
`date-picker/dialog.vue`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| DD-B1 | B | **`confirm` при `v-model:date` отдаёт старое значение.** `date.value = …; emit('confirm', date.value)`: при двусторонней привязке `defineModel` не обновляет локальное значение до прихода пропа. Гипотеза брифа (б) про *односторонний* `:date` — **не подтвердилась**: там Vue 3.5 пишет локально, payload новый | `ui/dialog/date/index.vue:128-129`; 001 `dialog-payloads.json`: oneway → payload `Date Tue Oct 20` (верно); iso (`v-model:date`) → payload `string 2026-10-14` (старое) | считать `next` один раз, писать и эмитить его; unit-спека на оба вида привязки | S | нет |
| DD-B2 | B | **ISO-строка уезжает на день** западнее UTC (Г-D8 подтверждена): `new Date('2026-10-14')` = UTC-полночь | `index.vue:104, 128`; 001 (timezone America/Los_Angeles): модель `'2026-10-14'` → выбран «Tuesday, October 13», заголовок «Oct 13, 2026» | парсить, как пикер (`dayjs` локально) — одна функция `toDate` на оба | S | нет |
| DD-B3 | B / a11y | Пустой диалог открывается с фокусом на 1-м числе, не на «сегодня» (A11-12) | 001 empty: фокус «Thursday, October 1» | следует из DP-B5 | — | нет |
| DD-B4 | B / a11y | При `initial-mode="input"` начальный фокус не ставится: фокус на самом `<dialog>` | `index.vue:112-115` ищет только ячейку; 001 typed: `focusOnOpen DIALOG.ui-overlay` | фокус на поле ввода, если режим input | S | нет |
| DD-B5 | B | `initialMode` действует только при первом открытии (`mode.value ??=`): повторное открытие — в последнем режиме, вопреки JSDoc «How the picker opens» | `index.vue:105` | при каждом открытии без привязанного `v-model:mode` — `initialMode` | S | нет |
| DD-B6 | B | Смена режима picker↔input — диалог за один кадр становится ниже на 274rem и перецентрируется (верх уезжает на 137rem); виды дни↔годы при этом fade-ятся — две разные механики в одном пикере | 001 `dialog-mode.json`: `dialog y +137, height −274 rem` одним кадром | по Q-3 | S | да → Q-3 |
| DD-C1 | C | Пробрасываются только `label/inputTitle/min/max/locale`: нет подписей стрелок/переключателей, `inputLabel`, `placeholder`, `errorPattern/Range`, `modeToggle`, слотов | `index.vue:13-21` | по Q-6 | S | да → Q-6 |
| DD-D1 | D | Снятый проп `headline` (+ warning) | `index.vue:65, 85, 90` | удалить | S | нет |
| DD-T1 | тесты | Unit-спеки нет; e2e не ловит DD-B1/B2 (проверяет текст `outcome`, а не payload) | — | `dialog/date/index.spec.ts` + e2e на фикстуре `dialog.vue` | M | нет |

Проверено, не дефект: в год-вью внутри диалога фокус встаёт на выбранный год (005 `dialog-years-focus.json`;
в 001 «фокус на кнопке месяца» — артефакт пробы, замер шёл до `after-enter`).

## MTimePicker

Источники: план `inputs/time-picker.md` (done), QA CT-05 (принято), TH-07 (устарел); базовая карта — «ничего
не сдвинулось»; пробы 002, 005; фикстура `time-picker/modes.vue`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| TP-B1 | B | **Циферблат пустеет при часы → минуты** (Г-T1 подтверждена): `mode="out-in"` — старые цифры гаснут, ~130 мс нет никаких, потом проявляются новые. В Compose — одновременный `Crossfade` | `fragments/time-picker/dial/index.vue:28`; 002 `dial-pointer.json`: opacity слоя 1 → 0.01 к 343 мс, `[0]` на 376–409 мс, 0.41 на 442; скрин `dial-120ms.png` (снят на 251 мс) — пустой круг с ручкой | одновременный crossfade: оба слоя `absolute`, без `mode` | S | нет |
| TP-B2 | B | Цвет выбранной цифры меняется мгновенно, ручка едет 200 мс (Г-T2 подтверждена) — новая цифра белая вне ручки, старая тёмная под ручкой. Compose рисует цвет пересечением с кругом ручки | `time-picker/_parts.scss:266-268`; 002 `dial-keyboard.json`: выбранная «22» с первого кадра, угол ручки −90 → −60 к ~225 мс; 005 `hand-30ms.png`: ручка на полпути, «00» уже белая на сером — половина цифры не видна | цвет цифры переходит с той же длительностью и easing, что ручка (CSS-переход `color`), без клипа | S | нет |
| TP-B3 | B | **Ручка отстаёт от пальца при драге** (Г-T3 подтверждена): переход `transform` активен во время драга, ручка квантуется по часам (30°) и догоняет с отставанием 10–37°. В Compose ручка следует за указателем, анимируется только отпускание | `_parts.scss:222-224`; `useTimeDialControl.ts:83-93`; 002 `dial-drag.json`: указатель 310° → ручка 273° (−87), 330° → 317°, 40° → 28.6° | во время драга — угол указателя без перехода (модификатор «тянут»), на `pointerup` — переход к значению | M | нет |
| TP-B4 | B | **Ошибка двигает раскладку** (Г-T4): `.ui-time-picker__error:empty { display: none }`, помощь и ошибка — две строки | `ui/time-picker/index.vue:244-250`; 002 `error-shift.json`: высота пикера +23rem при «75» в минутах | одна строка поддержки с резервом высоты (ошибка заменяет помощь, как у полей), `role=alert` смонтирован всегда | S | нет |
| TP-A1 | A / a11y | Поле с ошибкой в фокусе держит красную рамку — правило кита «фокус старше ошибки на кромке» нарушено | `_parts.scss:126-127` (`&--error, &--error:focus`) | в фокусе — цвета фокуса, ошибка остаётся в подписи поля и строке сообщения | S | нет |
| TP-B5 | B / a11y | **Клик мышью по циферблату рисует кольцо фокуса** (`:focus-visible` = true), у кнопки периода после клика — нет. Вероятная причина (по коду, не доказана) — `preventDefault()` на `pointerdown` + ручной `focus()`: браузер считает фокус программным | `useTimeDialControl.ts:99-100`; 005 `pointer-focus.json`: dial `focusVisible true`, period `false`; скрин `dial-after-pointer.png` | не гасить `pointerdown` (выделение и прокрутку уже держат `user-select: none`, `touch-action: none`), фокус — нативным путём; проверить пробой | S | нет |
| TP-B6 | B | Период в readonly: стрелка переводит фокус на невыбранный вариант (значение не меняется) — таб-стоп и фокус расходятся | `useTimePickerControl.ts` `getPeriodAttrs.onKeydown` | в `locked` — не двигать фокус | S | нет |
| TP-C1 | C | Нет кнопки режима: демо держит `v-model:mode`, переключить нечем (у `MDatePicker` есть `modeToggle`) | `ui/time-picker/index.vue` (нет), `demo/orders/NewOrderDeliveryFields.vue` | по Q-7 | S | да → Q-7 |
| TP-D1 | D | Снятые значения `mode: 'dial' \| 'keyboard'` (`RETIRED_TIME_PICKER_MODES`, `useRetiredValueWarning`) и проп `is24h` (`useRetiredPropWarning`) | `ui/time-picker/props.ts:12-17, 31-32`; `index.vue:107-111` | удалить; тип `MTimePickerMode = 'picker' \| 'input'` | S | нет |
| TP-D2 | D | `state-layer` — копия из date-picker (см. DP-D1); длительности строкой в `.vue` (`index.vue:304`) | — | как DP-D1/D3 | S | нет |
| TP-D3 | D / тесты | `useTimeDialControl`, `useTimeFieldsControl`, `useTimePickerControl` — без явного типа возврата (`behavior.md`: `UseXControlReturn`), у первых двух нет unit-спек | `useTimeDialControl.ts:25`, `useTimeFieldsControl.ts:193`, `useTimePickerControl.ts` `ReturnType<…>` | интерфейсы + спеки (бэги без `class`/`data-*`) | M | нет |

Проверено, не дефект: RTL h12 — AM/PM слева от времени, цифры LTR (Г-T7): ровно как Compose
(`ClockDisplayNumbers` LTR, переключатель зеркалится), скрины 002 `h12-morning-rtl.png`, `horizontal-rtl.png`;
AM/PM — статичная смена формы и веса по решению (Г-T8); ширина h23 при смене режима 304 → 264
(Г-T5, 002 `modes-h23.json`: −40rem) — разные виды, Compose меняет размер тоже, не чиню; длина стрелки
через `height` (Г-T6) — элемент вне потока, соседей не трогает.

Минимизация: выходной CSS `time-picker` **10236 Б / 1817 gzip**. Станет ≈9700/1730: слой состояния одним
списком (селектор + период), без второй строки поддержки и `:empty`, длительности из карты. Строки `src` ≈1560 →
≈1570 (+типы возврата).

## MColorPicker

Источники: планы `inputs/color-picker/*` (done), QA FAIL IN-07, TK-02, EN-03, RS-12, FM-09 (чужое, autofill
поля), TH-07 (устарел); базовая карта — образцы растут на hover/press (`scale 1.1`, без сдвига соседей) — **в
том числе в `@readonly` и `@disabled`**; проба 003; концепт `renders/color-picker/concept.webp`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| CP-A1 | A / LY | **Каналы RGBA/HSLA обрезаны**: 4 поля по 56 в ширине 248 — «103» видно как «10», «164» как «16», «100» как «10», подпись «A %» → «A…» | 003 скрин `format-RGBA.png`; `edit.channel.min.width 56rem` (`_index.scss:69`) | 4 канала — сетка 2 × 2, 3 — ряд (локально в `Edit.vue`); не зависит от Q-9 | S | нет |
| CP-A2 | A | Кольцо фокуса ползунка — скруглённый прямоугольник 40 вокруг полосы 16, между полосами 24 пустоты (Г-C4 подтверждена глазами); в концепте полосы почти вплотную, кольцо у ручки | 003 `hue-focus-light-ltr.png`; `_index.scss:41-48`, `index.vue` `&:focus-visible { focus-ring }` | по Q-8 | S–M | да → Q-8 |
| CP-A3 | A | Под фокусом у выбранного образца кольцо выбора заменяется кольцом фокуса (оба — `outline`), галочка остаётся (Г-C5 подтверждена) | `Swatches.vue:169-181`; 003 `picker-facts.json`: у `--selected --active` `outline: solid 2px` цвета фокуса | кольцо выбора — `box-shadow` (или `border`), фокус — `outline`: видны оба | S | нет |
| CP-B1 | B | Образцы «приподнимаются» под курсором в readonly и disabled (`scale(1.1)` не зависит от `--locked`) | базовая карта: `div[Error] @disabled`, `div[Primary] @readonly` — hover `dw 3.2` | подъём только у незаблокированного списка | S | нет |
| CP-B2 | B | Нет pressed у образца (QA IN-07) | `Swatches.vue` (только hover) | слой нажатия в чернилах галочки (`on-dark`/`on-light`) на `state-opacity(pressed)` | S | нет |
| CP-B3 | B | `getComputedStyle` на каждый `pointermove` холста (Г-C6) — против `behavior.md` | `Canvas.vue:76, 119` | направление снимать на `pointerdown` вместе с `rect` | S | нет |
| CP-D1 | D | Dev-сообщение о потере альфы печатает новый формат дважды (`format.value` уже присвоен) | `composables/color-picker/context.ts:149-152` | запомнить прежний формат до присвоения | S | нет |
| CP-D2 | D | Шахматка `conic-gradient` 4 раза и блок `checker` в двух картах; градиенты hue/alpha/насыщенности продублированы ради RTL | `index.vue:200-218`, `Preview.vue:42`, `Canvas.vue` `&__saturation`, `color-input/index.vue:281`, `color-input/_index.scss:19-23` | миксин `checker` в карте пикера, color-input `@use` её; направление — `@each (ltr: right, rtl: left)` | S | нет |
| CP-D3 | D | Hairline `1rem` у превью и образцов; рантайм-свойство `--alpha-color` без префикса кита | `_index.scss:63, 76`; `index.vue:40` | `max(1px, 1rem)`; `--m-color-picker-alpha` (живое значение — законно) | S | нет |
| CP-C1 | C | Ни одного слота (`#swatch`, `#preview`, `#actions` есть в API плана, EN-03) | план `color-picker/index.md:96` | сделать по API плана: `#swatch="{ swatch, selected }"`, `#preview="{ color, value }"`, `#actions` | M | нет (API плана) |
| CP-C2 | C / A | Ряд «превью \| формат \| значение» из концепта не повторён: превью с текстом значения, ниже формат на всю ширину, ниже поле — значение показано дважды, два зарезервированных места под строку поддержки дают большие пустоты | 003 `format-RGBA.png`, `color-input-open-palette.png`; `index.vue:46-69` | по Q-9 | M | да → Q-9 |
| CP-A4 | A | Встроенный пикер — карточка с тенью `elevation(1)`; у `MDatePicker` по решению В3→2 встроенный — плоская карточка без тени | `_index.scss:20` | по Q-10 | S | да → Q-10 |

Проверено, не подтвердилось: Г-C1 (readonly-ползунок дрожит) — 003 `readonly-hue.json`: значение 256 на всех
11 `input`, модель не изменилась, `change` не пришёл; Г-C3 (бегунок не по центру) — на скрине 3× бегунок по
центру полосы. Г-C2 (высота при смене формата) — есть, но не дефект: 003 `format-change.json` RGB → RGBA
`picker height +39.97rem`, RGBA → HEX `−27.97` за кадр — содержимое меняется по выбору пользователя (появляется
альфа, поле hex ↔ каналы); закрывающаяся панель списка форматов уезжает вместе с якорем
(`div.ui-menu shift dy 39.97`) — это `MMenu`, вне объёма. Не чиню.

Минимизация: выходной CSS файла пикера (`color-picker` 28 правил + canvas 14 + swatches 13 + preview 5 +
color-input 5) **6908 Б / 1484 gzip**. Станет ≈6400/1400: без дублей RTL-градиентов (≈400 Б) и одной
шахматки на правило; рост от сетки каналов и pressed ≈+100. Строки `src` ≈1260 → ≈1270.

## MColorInput

Источники: план `inputs/color-input.md` (шаг 1 заблокирован MMenu), QA FAIL A11-06 (блок), EN-03, TK-02;
TS-02/03/05 — фикстуры и axe-e2e есть → PASS после проверки в P2; проба 003, фикстура `color-input/swatches.vue`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| CI-A1 | A | **Двойная поверхность** (Г-I2 подтверждена): внутри панели `MMenu` (радиус 4rem, своя тень) рисуется карточка пикера (16rem, `surface-container-high`, `elevation(1)`, свой padding) — по краям видна рамка меню | 003 `color-input-palette.json` `pickerSurface` vs `menuSurface`; скрин `color-input-open-palette.png` | `hosted`-контекст, как у date-picker: в хосте пикер без своей поверхности и тени | S | нет |
| CI-B1 | B / a11y | Фокус при открытии: без палитры уходит на `.ui-menu__surface role=menu` (внутри нет ни одного `menuitem`), с палитрой — остаётся на кнопке; стрелки ничего не делают. Г-I1 (кнопки пикера → `menuitem`) **не подтвердилась**: `menuitem` 0 в обоих случаях | 003 `color-input-plain.json` `active: ui-menu__surface role=menu`, `color-input-palette.json` `active: …ui-color-input__trigger` | в своём файле: после открытия фокус на первый управляемый элемент пикера; роль `menu` у поверхности — `MMenu` (вне объёма, A11-06) | S | нет (фокус); роль → заявка |
| CI-C1 | C | Слоты `MTextField` не проброшены (`#prepend`, `#leading-content`, `#helper`, `#error`) — EN-03 | `color-input/index.vue:1-72` | пробросить существующие слоты поля как есть | S | нет |
| CI-C2 | C | Пропы без эффекта из `mFieldProps`: `autocomplete` (прибит `off`), `loading` (`makeStateProps`, у `MTextField` не используется вовсе) | `color-input/index.vue:21`; `shared/utils/props/index.ts:36-41` | по Q-13 | S | да → Q-13 |
| CI-D1 | D | `.ui-color-input__trigger { padding }` почти мёртв: `padding-inline` перебит кнопкой, высота задана плотностью | 003: `padding: 1.33px 0px`, кнопка 40rem | удалить правило и токен | S | нет |
| CI-D2 | D | Шахматка и `checker` — копия из пикера; образец 22rem без вывода; hairline `1rem` | `color-input/_index.scss:12-23` | см. CP-D2; размер образца вывести (24 − 2 × кромка) или из карты пикера | S | нет |

Минимизация: блок `color-input` (5 правил) внутри файла пикера; −1 правило (CI-D1), шахматка через общий миксин.
Строки `src` ≈365 → ≈375 (проброс слотов, фокус при открытии).

## MOtpInput

Источники: план `inputs/otp-input/*` (шаг 6 открыт), QA FAIL ST-01/ST-03/IN-03 (шаг 6), IN-08, A11-08 (MANUAL);
базовая карта — только прокрутка страницы фокусом; пробы 004, 005; концепт `renders/otp-input/concept.webp`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| OT-A1 | A / a11y | **Фокус полного кода не виден** (шаг 6): каретка за сеткой → активной ячейки нет (craft §8), `ui-otp-input--focused` ставится, но не стилизован — WCAG 2.4.7 | `ui/otp-input/index.vue:159`; QA ST-01/ST-03/IN-03; 005 `typed-to-end.json`: `caret 6, activeCells 0, focused true`; скрин `typed-to-end-focused.png` — код с ошибкой в фокусе выглядит так же, как без фокуса | по Q-1 | S | да → Q-1 |
| OT-B1 | B | Кромка активной ячейки 1 → 2rem без перехода, цвет — 150 мс (Г-O1, «width snaps while the colour eases»). На ширине ≤ 1919 обе ширины рисуются 1 px (2rem = 1.33 px → 1 px): активная ячейка отличается только цветом; на ≥ 1920 — толщина щёлкает | `otp-input/_cells.scss:18-21, 69-72`; 004 `active-edge.json`: `border-top-width 1px` у активной и покоящейся, цвет 0 → 119 за ~130 мс | кромка 1rem всегда, «вторая» 1rem — `box-shadow: inset` того же цвета в списке переходов: без смены раскладки, плавно, видно и на 1280 | S | нет |
| OT-B2 | B | У `underline` растёт только `border-bottom-width` → глиф активной ячейки поднимается на ½ разницы (Г-O2; на ≤ 1919 разницы нет, см. OT-B1) | `_cells.scss:145-148` | решается OT-B1 | — | нет |
| OT-B3 | B | Набор в полный код без ошибки блокируется `maxlength` — исправить одну цифру можно только удалив (A11-08) | `useOtpControl.ts` `inputAttrs.maxlength` | по Q-12 | S | да → Q-12 |
| OT-D1 | D | Снятые значения `mask: true` и глиф-строка (dev-предупреждения + ветка `maskCharacter`) | `ui/otp-input/index.vue:176-184`; `props.ts:53-57`; `useOtpControl.ts:51-54, 173-181` | удалить; `mask: MOtpInputMask` | S | нет |
| OT-D2 | D | `useOtpControl.ts` — 413 строк (> 400) | — | каретку (`syncCaret/watchCaret`) и `cellAt` — в `useOtpCaret.ts` | S | нет |
| OT-D3 | D | Селектор наведения ≈ (0,6,0): `:not(--disabled) __visual:hover __field:not(--active, --error)` | `_cells.scss:15` | гейт «не disabled» модификатором корня, селектор короче | S | нет |
| OT-D4 | D | Длительность из `$theme-animation-link` (у остальных группы — строка `var(--sys-motion-…)`); hairline `1rem` | `_index.scss:32, 91-92` | одна запись на группу; `max(1px, 1rem)` | S | нет |

Минимизация: выходной CSS `otp-input` **5845 Б / 1192 gzip**. Станет ≈5600/1150: короче селекторы наведения ×3
варианта, без дублей `border-width` у трёх вариантов (одна тень). Строки `src` ≈1300 → ≈1290.

---

## Шимы «снято, работает ещё релиз» (решение 2026-10-18 — удалить вместе со значениями)

| Где | Что снято | Механизм |
|---|---|---|
| `ui/date-picker/index.vue:180`, `props.ts` | проп `headline` → `label` | `useRetiredPropWarning` |
| `ui/dialog/date/index.vue:85`, `:65` | проп `headline` → `label` | `useRetiredPropWarning` |
| `ui/time-picker/index.vue:107`, `props.ts:12-17` | `mode: 'dial' \| 'keyboard'` → `'picker' \| 'input'` | `useRetiredValueWarning` + `RETIRED_TIME_PICKER_MODES` |
| `ui/time-picker/index.vue:108`, `props.ts:31-32` | проп `is24h` → `hourCycle` | `useRetiredPropWarning` |
| `ui/otp-input/index.vue:176-184`, `props.ts:53-57`, `useOtpControl.ts:51-54, 173-181` | `mask: true`, глиф-строка → `'always'` + `#mask` | свой `watchEffect` + ветка в композабле |

Потребителей снятых значений в `playground/app/**` и фикстурах нет (grep). Спеки, закрепляющие предупреждения:
`ui/date-picker/index.spec.ts`, `ui/time-picker/index.spec.ts`, `ui/otp-input/tests/variants.spec.ts` — правятся
вместе. Связь: `MColorInput` получает `rounded` из `mFieldProps` через `useFieldShape` (шим w3) — уйдёт вместе с ним.

---

## Развилки (у каждой — рекомендация)

**Q-1 (MOtpInput, шаг 6): как показать фокус, когда код набран до конца и каретка за последней ячейкой?**
1. Все кромки ячеек в `primary` обычной толщины, пока поле в фокусе и активной ячейки нет (вариант A концепта);
   у кода с ошибкой в фокусе — тоже `primary` («фокус старше ошибки на кромке»), ошибку держат значок и
   сообщение. **(рекомендую)** — фокус остаётся сменой цвета (`color-and-state.md`), без нового кольца и без
   клампа каретки (craft §8); WCAG 2.4.7 закрыт.
2. Кольцо вокруг всей группы ячеек — в семействе полей колец нет, это второй механизм фокуса.
3. Подсвечивать последнюю ячейку — прямо против craft §8 (ложная позиция ввода).
4. Оставить как есть — фокус невидим.

**Q-2 (MDatePicker): анимировать ли листание месяца?**
1. Оставить мгновенно. **(рекомендую)** — craft §7 «Nothing moves position»; при удержании PageDown любая
   анимация мигает; месяц уже объявляется `aria-live` подписью; бандл не растёт.
2. Короткое проявление новой сетки (opacity от ~0.6, `short-2`), без сдвига — дёшево, но направления не
   показывает.
3. Горизонтальный сдвиг, как в Compose (зеркально в RTL) — новое движение позиции, M по цене, против craft §7.

**Q-3 (MDialogDate): смена режима календарь ↔ ввод.**
1. Новый режим проявляется тем же fade, что и смена дни ↔ годы; размер диалога меняется сразу.
   **(рекомендую)** — одна механика переходов в пикере; анимация высоты (как `SizeTransform` в Compose) — это
   анимация геометрии в потоке, против правила «только transform».
2. Оставить мгновенно (как сейчас).
3. Анимировать высоту — нужен `interpolate-size`/замер JS; отвергается правилами.

**Q-4 (MDatePicker): добавить пропы формы?**
1. Добавить набор `MTimePicker`: `helperText`, `error`, `errorMessage`, `required`, `name` (скрытый input),
   строка поддержки с резервом высоты, `validate()` учитывает `required`. **(рекомендую)** — паритет в группе;
   живой заказчик — `demo/orders/NewOrderDeliveryFields.vue`, который рисует ошибку сам.
2. Не добавлять: ошибку рисует приложение.

**Q-5 (MDatePicker/MDialogDate): в каком типе отдавать модель?**
1. В том, в каком пришла: строка → `YYYY-MM-DD`, число → миллисекунды, `Date` → `Date`; пусто → `null`.
   **(рекомендую)** — без нового пропа; формы хранят ISO-день, а сейчас каждое демо конвертирует руками
   (`CrmDateField.vue`, `OrdersPeriodPicker.vue`).
2. Всегда `Date` (как сейчас).
3. Проп `valueFormat` — третье слово API ради того, что выводится из входа.

**Q-6 (MDialogDate): что пробрасывать в пикер?**
1. Все пропы `MDatePicker`, кроме поверхности и actions (подписи стрелок и переключателей, `inputLabel`,
   `placeholder`, `errorPattern/Range`, `modeToggle`, `disabled`/`readonly`) + слоты `#label`, `#headline`,
   `#day`, `#year`. **(рекомендую)** — диалог — это пикер в обёртке, а не его урезанная версия.
2. Только строки — слоты и `modeToggle` остаются недоступны в модальном варианте.

**Q-7 (MTimePicker): кнопка переключения режима.**
1. Проп `modeToggle` (по умолчанию `true`, как у `MDatePicker`), кнопка-иконка в начале нижнего ряда
   (клавиатура ↔ часы), подписи — пропы из `MESSAGES`-паттерна. **(рекомендую)** — анатомия M3 и паритет с
   датой; живой заказчик держит `v-model:mode` без кнопки.
2. То же, но `false` по умолчанию — существующие пикеры не меняют вид.
3. Не добавлять — кнопку рисует приложение.

**Q-8 (MColorPicker): вид ползунков hue/alpha.**
1. Кольцо фокуса — вокруг бегунка, полосы на прежнем расстоянии (видимый зазор 24).
2. Кольцо вокруг бегунка + полосы ближе: цели по 40 остаются, но перекрываются на 12, видимый зазор 12;
   незаслонённая цель каждой ≥ 28 × ширина (WCAG 2.5.8 / axe `target-size` держится). **(рекомендую)** —
   концепт («hue/alpha: kit slider handle + focus ring», полосы почти вплотную), a11y сохранён.
3. Оставить как есть.

**Q-9 (MColorPicker): ряд значения.**
1. Как в концепте: `превью 40 | формат | значение` в одном ряду; текст значения из превью убирается (его
   говорит поле); каналы RGB/HSL — своим рядом (2 × 2 при альфе). **(рекомендую)** — значение не дублируется,
   пикер ниже на ≈60rem, вид концепта.
2. Оставить раскладку, починить только обрезку каналов (CP-A1).

**Q-10 (MColorPicker): тень встроенного пикера.**
1. Плоская карточка без тени, как `MDatePicker` (решение В3→2: «тень говорит "плавает", а он в потоке»); в хосте
   (`MColorInput`) — без своей поверхности (CI-A1). **(рекомендую)** — одно правило поверхности в группе.
2. Оставить `elevation(1)` у встроенного; убрать только в хосте.

**Q-11 (группа): фабрики в автоимпорте.** `composables/**` автоимпортируется целиком, поэтому в приложение
утекают `createCalendar`, `createClock`, `createColorPickerState` / `provideColorPickerContext` /
`useColorPickerContext` (`src/module.ts:167`).
1. Перенести фабрики и контекст пикера в `utils/{date,time,color-picker}`; `use*Control` остаются в
   `composables`. **(рекомендую)** — прецедент: хелперы таблицы → `utils/table` (2026-10-08); «интернал должен
   остаться internal». Ломающее для тех, кто звал их автоимпортом: явный импорт `#kit/utils/...`.
2. Оставить.

**Q-12 (MOtpInput, A11-08): набор поверх полного кода.**
1. Символ заменяет ячейку под кареткой (каретка внутри полного кода), без ошибки — как сейчас удаление.
   **(рекомендую)** — исправить одну цифру одним нажатием; вставка и SMS-автозаполнение не меняются.
2. Оставить: в полном коде сначала удалить символ.

**Q-13 (MColorInput): пропы без эффекта.**
1. Исключить `autocomplete` и `loading` из пропов `MColorInput` (`Omit` из `mFieldProps`). **(рекомендую)** —
   «проп, который сразу обезврежен, — ловушка в таблице API» (craft §2). `loading` мёртв во всём семействе полей —
   общий вопрос к w3/оркестратору.
2. Оставить до решения по семейству.

СТОП-пунктов в группе нет: новых зависимостей, системных токенов и морфа не предлагаю. Циферблат 200 по
высоте (хвост плана) требует height container query — против `decisions.md`, не беру.

---

## Предложения сверх паритета (не шаги)

| Предложение | Выигрыш | Заказчик | Цена | Рекомендация |
|---|---|---|---|---|
| Намёк на продолжение списка лет (CT-11): мягкий край по прокрутке — тем же приёмом, что край таблицы | видно, что лет больше | любые даты рождения/договоров | S | после Q-2; без `scroll-state` (только Chromium) |
| Кнопка «Сегодня» / набор года цифрами в год-вью | возврат после глубокой навигации | формы с дальними датами | S | ждать заказчика |
| `minuteStep` и границы у `MTimePicker` | запись по слотам | бронирование | M | ждать заказчика |
| EyeDropper и «недавние» в `#actions` пикера | выбор цвета с экрана | редакторы тем | S после CP-C1 | рецепт в docs, не проп |
| WebOTP (`navigator.credentials.get({ otp })`) | код из SMS без нажатия на Android | вход по SMS | S | отдельной задачей (план OTP) |

## Заявки на чужие файлы

1. **`MMenu` (вне объёма, A11-06):** поверхность `role="menu"` без `menuitem`, когда внутри `MColorPicker`
   (003); при `[role=listbox]` внутри фокус остаётся на триггере. Нужен всплывающий `dialog`-режим из плана меню.
2. **Оркестратор / сквозное:** английские дефолты `MESSAGES.date*/time*` и `locale: 'en-US'` в date-picker,
   dialog/date, time-picker; общей настройки локали в приложении нет (демо передают ru-строки руками).
3. **w3 / оркестратор:** `loading` из `makeStateProps` в `mFieldProps` ничего не делает в `MTextField` — мёртвый
   проп всего семейства полей (см. Q-13).
4. **Оркестратор (`abstracts`, по желанию):** миксин `state-layer($t)` (кнопка/ячейка со слоем в своих чернилах)
   — сейчас две копии в группе; иначе сведу в партиал группы.
5. **Оркестратор (`playground/app/demo`):** после DD-B1 комментарий в `demo/orders/OrdersPeriodPicker.vue:82-84`
   («one-way `:date` would hand over the previous day») неверен — на деле наоборот (001); `CrmDateField.vue`
   работает правильно.
6. **Оркестратор (QA):** `.cursor/summary/runs/quality/data/dialog.json` — пункты date-диалога ссылаются на
   код до c9da731 (`dialog/date/index.vue:706` и т. п. при 178 строках) — перепроверить.

## Что не удалось проверить

- Forced colors, reduced motion глазами — не снимал. По коду: у группы длительности short-2…short-4, глобальное
  укорочение `_animations.scss` их не меняет (как в брифе) — под reduce переходы остаются прежними.
- 360 px и 768 px визуально; e2e на переполнение в группе есть.
- Firefox/Safari (`:dir()`, полосы `appearance: none`, `field-sizing` не используется).

## Modern Web Guidance

- `animate-element-entry-exit` — для TP-B1: вход/выход двух слоёв одновременно, оба `absolute`; уберегает от
  `mode="out-in"`, который и даёт пустой кадр. `@starting-style` не нужен — переход ведёт Vue `<Transition>`.
- `slider` — «center the WebKit thumb with `margin-block-start`» и «preserve a generous interaction area
  (`block-size: 2.5rem`)»: подтвердил, что бегунок уже по центру (Г-C3 снята) и что цель 40 — правильная
  основа для Q-8; совет держать направление градиента в кастомном свойстве не беру (zero-runtime) — `@each`.
- `scrollability-affordance-hints` — `container-type: scroll-state` только в Chromium 133+; для CT-11 предлагаю
  кит-овый мягкий край, а не эту фичу.
- `sms-otp-form` — «Do not split digits across multiple `<input>`», `maxlength` на одном поле, шрифт поля
  ≥ 16 px против зума iOS: кит уже так устроен (`font-size: medium` у нативного поля). Для Q-12 отсюда следует:
  замену символа делать на `beforeinput` (выделить символ под кареткой), а не снимать `maxlength` — иначе
  SMS-автозаполнение и вставка получат лишние символы.
