# Бриф группы «Пикеры, цвет, OTP» (`w5-pickers-color`)

> Читается вместе с `00-common.md`. Состояние на 2026-10-18 (ветка `components/redisign-update`, HEAD c9da731).
> Редизайн группы влит одним коммитом c9da731 «feat(components): save»; незакоммиченных правок в файлах
> группы нет. **Ф** — факт (код, план, summary, решение), **Г** — гипотеза по чтению кода, проверяется
> пробой/осмотром у дирижёра. Пути — от `src/runtime/`, если не сказано иное. Базовой карты скачков
> группы и `playground/e2e/probe.ts` на момент брифа ещё нет (P0 оркестратора).

## 0. Компоненты и файлы

| Компонент | M3 / авт. | Файлы (без спеков), строк | Всего src | План | QA | Concept | Фикстуры, e2e |
|---|---|---|---|---|---|---|---|
| `MDatePicker` | M3 | `components/ui/date-picker/{index.vue 339, props 55, context 8}`; `components/fragments/date-picker/{header-nav, day-grid, year-grid, input}` 361; `composables/date/{index.ts (useDatePicker) 118, createCalendar 204, useDateGridControl 197}`; `stylesheet/components/date-picker/{_index 81, _parts 266}` | ≈1630 | `inputs/date-picker.md` | `date-picker.json` | `renders/date-picker` | `fixtures/date-picker/{matrix,stress}`, e2e 19 |
| `MDialogDate` | M3 | `components/ui/dialog/date/index.vue` 178 (стили — карта date-picker) | 178 | тот же | `dialog.json` | тот же | кейс `modal` в date matrix; **unit-спеки нет** |
| `MTimePicker` | M3 | `ui/time-picker/{index.vue 311, props 51}`; `fragments/time-picker/{dial 68, selectors 37, period 29, fields 47}`; `composables/time/{createClock 151, useTimePickerControl 154, useTimeDialControl 158, useTimeFieldsControl 150}`; `stylesheet/…/time-picker/{_index 107, _parts 297}` | ≈1560 | `inputs/time-picker.md` | `time-picker.json` | `renders/time-picker` | `fixtures/time-picker`, e2e 23 |
| `MColorPicker` | авт. | `ui/color-picker/{index.vue 253, props 49}`; `fragments/color-picker/{Canvas 215, Edit 167, Preview 61, Swatches 199}.vue`; `composables/color-picker/context.ts` 209; `…/color-picker/_index.scss` 104; математика — `shared/utils/color` 245 (**файл оркестратора**) | ≈1260 | `inputs/color-picker/{index,canvas,edit,preview,swatches}.md` | `color-picker.json` | `renders/color-picker` | `fixtures/color-picker`, e2e 17 |
| `MColorInput` | авт. | `ui/color-input/{index.vue 295, props 46}`; `…/color-input/_index.scss` 24 | ≈365 | `inputs/color-input.md` | `color-input.json` | общий с picker | `fixtures/color-input`, e2e 13 |
| `MOtpInput` | авт. | `ui/otp-input/{index.vue 329, props 81}`; `composables/otp-input/{useOtpControl **413**, useOtpValue 156}`; `shared/constants/otp.ts` 48; `…/otp-input/{_index 94, _cells 183}` | ≈1300 | `inputs/otp-input/{index,field,group,separator}.md` | `otp-input.json` | `renders/otp-input` | `fixtures/otp-input`, e2e 31 |

(e2e — число тестов с учётом циклов тем/направлений.) Unit-спеки: date — `ui/date-picker/index.spec`,
`composables/date/{createCalendar,useDateGridControl}.spec`; time — `ui/time-picker/index.spec`,
`composables/time/{createClock,useTimePickerControl}.spec` (у `useTimeDialControl`, `useTimeFieldsControl`
нет); color — `ui/color-picker/index.spec`, `ui/color-input/index.spec`; OTP — `ui/otp-input/tests/*` +
`useOtpControl.spec`.

**Куда ложится `data-test`:** date-picker, time-picker — на корень компонента (`[data-test=selected]` =
`.ui-date-picker`); color-picker, otp-input — на обёртку-`div` фикстуры; **color-input — на `<input>`**
(MTextField отдаёт атрибуты контролу), корень — `closest('.ui-text-field')`.

Скомпилированный CSS (минифицированный, мой скрипт по логике `shell/scss-smoke.mjs`): date-picker 8102 Б,
dialog/date 530, time-picker 10387, color-picker 2945 + фрагменты 3512, color-input 710, otp-input 5854.
`npm run lint:scss` — 152 стиля, 0 депрекаций, **дефисных путей `g()` в группе нет**.

## 1. Решения владельца — не переспрашивать

Общие: color-picker, color-input, otp-input — **авторские** (развиваются в своём видении; память
`authored-components-keep-vision`). Hairline `max(1px, 1rem)` при касании карты. `MLoading` без
английского имени, хост прячет его `aria-hidden`. Кольцо 1px на 1201–1279 — не чинить. Морфа и пружин в
группе нет и не вводится; статичная форма состояния остаётся статичной (`decisions.md` S3/S4). Текст
disabled 38% — исключение WCAG.

**MDatePicker / MDialogDate** (план, «Заметки реализации», `decisions.md`): В1→1 встроенный без
Cancel/OK, клик коммитит, свои кнопки — `#actions`, черновик и подтверждение — только `MDialogDate`;
В2→1 дни соседних месяцев не рисуются; В3→2 встроенный — плоская карточка `surface-container-high` /
`large` без тени, в диалоге поверхность даёт диалог (`hosted`-контекст, `ui/date-picker/context.ts`);
В4→2 без `MDateField`; В5→3 без range; В6→1 `Intl` + арифметика dayjs. `headline` → `label` (алиас на
релиз). Размеры M3 фиксированы (CT-05 принят); недоступный день и disabled-сетка — opacity 38% (ST-06
принят). «Сегодня» — только на клиенте. Терпимый ввод частично (любой разделитель, 2-значный год);
кнопка «Сегодня» и причина недоступного дня — не брались.

**MTimePicker**: В1→2 карточка остаётся; В2→2 без `MDialogTime`; В3→3 `hourCycle` (`h23` по умолчанию,
`is24h` — алиас), модель всегда `HH:mm` 24h; В4→2 циферблат — один `role="slider"` на
`createRangeKeyboardController` без правки контроллера («три круга», PageUp/Down ±10); В5→1 период —
Expressive-пара, форма full→12 **статично**, выбранный жирный (TH-05); В6→1 явная ось `layout`,
horizontal складывается по container query (< 508); В7→1 без rich/ScrollField; В8→1 в picker —
селекторы 96 × 80; В9→1 `picker|input` (`dial|keyboard` — алиасы). Радиусы колец — доли в `createClock`,
не CSS-переменная. Автопереход на минуты только от указателя (100 мс). Раскладка (data-summary
2026-10-08): h23 — одна колонка, время по центру над циферблатом, `max-width` 304/264; h12 — 328;
side-by-side — циферблат 256 явно; `aria-valuenow` всегда.

**MColorPicker**: В1→1 формат — **компактный `MDropdown`**: сегментированного HEX/RGB в коде нет, поэтому
и переноса подписей по буквам больше нет (e2e «the format list fits a narrow picker without breaking its
words»). Canvas В1→1 — две скрытые оси-слайдера. HSVA-контекст, модель в формате, альфа по формату,
предупреждение при потере альфы, части без своей модели. Строки — `messages` без дефолтов (буквы каналов
остаются). `white`/`black` холста — математика. Цель ползунка 40 (полоса 16 + `padding-block` 12) —
правка 2026-10-08 ради axe `target-size`; владельцу сообщили «зазор вырос до 24, видно глазами» — **ответа
по виду не было**.

**MColorInput**: композиция поле + образец + `MColorPicker` и модель черновика одобрены. Шаг 1
(всплывающий диалог вместо `MMenu`) **заблокирован**: MMenu вне объёма (2026-10-18). `mFieldProps` +
`density`, `pickerLabel`, `formatHint` без дефолтов.

**MOtpInput**: один нативный `<input>` под ячейками; без мигающей каретки; без визуального `complete`
(событие есть); без density; NFKC + арабо-индийские цифры; не на `mFieldProps`; `labelPlacement:
top|hidden`; 7 позиций каретки без клампа (`craft.md` §8). Вопросы плана: 1→1 `variant`, outlined без
заливки; 2→1 `mask: false|'last'|'always'`; 3→1 маска визуальна; 4→1 + `MLoading inline` в строке
сообщения; 5→1; 6→1 `required` + `*`; 7→1 `path` → `useField`. Фаза D: ошибка в forced colors —
пунктир `CanvasText`, фокус старше ошибки, read-only показывает фокус. Полный код с ошибкой при фокусе
выделяется целиком, `expose({ focus, select })`. `OTP_MASK_REVEAL = 1000` — факт механизма.

## 2. Что осталось от прошлых раундов

**OTP шаг 6 «фокус заполненного кода» — ответа владельца НЕТ.** Искал в `inputs-group…0016.md` (вопрос 3
лиду, без ответа), `qa-fix-showcase-fields…0100.md`, выжимках сессий владельца 3813a585 (2026-10-07/08 —
вопрос не задавался, только строка отчёта) и 36ed5ae8 (фаза D — в открытых), `decisions.md`, памяти.
Уже сформулированные варианты: (1) кольцо вокруг всей группы ячеек — рекомендация inputs-агента;
(2) последняя ячейка активной — против `craft.md` §8; (3) оставить; концепт (`renders/otp-input`, «full
code + focus»): A — все кромки `primary` 1, пока каретка за сеткой, B — ничего. Развилка для отчёта P1.

| Компонент | Хвосты |
|---|---|
| date-picker | Docs (шаг 9) — вне объёма. Глазами не проверено ничего из «Проверить глазами» `inputs-group…0016.md`. |
| MDialogDate | **Находки дашбордов подтверждены кодом:** (а) пробрасывает только `label/input-title/min/max/locale` (`ui/dialog/date/index.vue:13-21`) — нет `prev/nextMonthLabel`, `switchTo*Label`, `inputLabel`, `placeholder`, `errorPattern/Range`, `modeToggle`, слотов; (б) `confirm` при одностороннем `:date` отдаёт старую дату: `date.value = …; emit('confirm', date.value)` (`:128-129`), а у контролируемого `defineModel` значение не меняется до прихода пропа. Ровно так пишет `playground/app/demo/crm/new-deal/CrmDateField.vue:23-33`. |
| date/time | Английские дефолты (`MESSAGES.date*/time*`) и `locale: 'en-US'` в date-picker, dialog/date, time-picker; **общей настройки локали в приложении нет** (демо передаёт ru-строки руками, `demo/orders/NewOrderDeliveryFields.vue:9-25`). Сквозное — в отчёт оркестратору. |
| time-picker | Циферблат 200 при нехватке высоты — не сделан. `minuteStep`, границы — нет. Вопрос 9 лиду (`wrap` в `createRangeKeyboardController`, файл slider, не наш) — без ответа. Глазами не проверено. |
| color-picker | Слоты `#swatch/#preview/#actions` из API плана **не сделаны** (EN-03). UX (EyeDropper, недавние, контраст, палитра темы) не брались. Глазами: зазор 24 и кольцо фокуса 40 × `8/20` вокруг 16-полосы. |
| color-input | Шаг 1 заблокирован (A11-06). Слоты `MTextField` не проброшены (EN-03). UX (вставка любого формата, копирование в read-only) — нет. |
| otp-input | Шаг 6. IN-08 (`aria-disabled`) — сквозной вопрос фазы D. A11-08: перезапись в полном коде без ошибки блокирует `maxlength`. Разделитель в disabled (TH-02), iOS-зум (RS-11) — ручные. `useOtpControl.ts` 413 > 400. WebOTP — отдельной задачей. |

## 3. QA-аудит: что открыто

`where`/`note` во многих пунктах **устарели** (ссылки на код до c9da731: `keyboard/`, `_docked.scss`,
`!important`, `min-height 280rem`, `opacity 0.7`) — перепроверять по коду.
- **date-picker** FAIL: ST-06/P2, CT-05/P1 (оба приняты); CT-11/P3 список лет без `scrollbar-gutter` и
  намёка на продолжение (`date-picker/_parts.scss:219-229`); TH-07/P2 — `color-scheme` уже ставят темы
  (`themes/base/_light.scss:4`, `_dark.scss:4`) → вероятно PASS. MANUAL: ST-02, ST-07, CT-06, CT-12, LY-03,
  LY-07, RS-02, RS-10, TH-02/03/08, **MO-03** (быстрые переключения вида), **MO-04** (5↔6 недель), TS-06.
- **time-picker** FAIL: CT-05/P1 (принято), TH-07/P2 (устарел). MANUAL: ST-07, CT-04, CT-06, CT-12
  («:»), LY-02, LY-07, RS-02, RS-10, RS-11, TH-02/03/08, **MO-01** (часы↔минуты — теперь cross-fade),
  **MO-03** (драг через 0°), TS-06.
- **color-picker** FAIL: IN-07/P2 (нет pressed у образца), FM-09/P2 (`:autofill` — чужое), RS-12/P3
  (цели под `pointer: coarse`, числа в JSON устарели), TK-02/P1, TH-07/P2 (устарел), EN-03/P2 (слоты).
  MANUAL: ST-02/03 (Г-C5), ST-07, FM-05, CT-06, LY-07, RS-02, RS-11, TH-02/03/08, **MO-04** (Г-C2), TS-06.
- **color-input** FAIL: A11-06/P1 (заблокировано), EN-03/P2, TK-02/P1, FM-09/P2, TH-07/P2; **TS-02/03/05
  устарели** (фикстуры и axe-e2e есть) → PASS после проверки. MANUAL: ST-03, ST-06, IN-04/05, FM-05,
  CT-06, CT-10, LY-03, LY-07, RS-01/02/06/10/11/12, TH-02/03/08, MO-03, TS-06.
- **otp-input** FAIL: ST-01/P1, ST-03/P1, IN-03/P1 (все — шаг 6), IN-08/P2, LY-08/P2 (принято), A11-06/P1
  (принято). MANUAL: ST-07, **IN-04** (2rem кольца на vw-масштабе = тот же 1px, что 1rem), CT-06, CT-12,
  LY-02, LY-03, LY-07, RS-02, RS-11, TH-02/03, A11-08, EN-11, TS-06.
- Принятые/системные: RS-04/05/06, TK-09, TS-01, TS-04, DC-01…05.

## 4. Движение и анимации в группе

**Нашего морфа (`springToCss`, `useShapeMorph`) в группе нет.** `MButtonIcon` здесь не toggle; `MLoading
inline` в OTP — CSS-спиннер. §6.2 общего брифа — как «переходы на токенах без скачков».

| Где (Ф) | Что анимируется | Чем |
|---|---|---|
| date: вид дни↔годы | `opacity`, `<Transition mode="out-in">` (`ui/date-picker/index.vue:69-72`, классы `:330-338`) | `var(--sys-motion-*-short-4)` литералом в `.vue` |
| date: слой дня/года/кнопки месяца; ▾ | `::before` opacity (`date-picker/_parts.scss:25`); `rotate(180deg)` (`:116-121`) | `motion.*` карты = строка `var()` (`_index.scss:77-80`) |
| MDialogDate | контент `opacity` (`dialog/date/index.vue:7, 169-177`) | short-4 литералом |
| time: цифры | `opacity`, `<Transition mode="out-in" :key="view">` (`fragments/time-picker/dial/index.vue:26-43`; `ui/time-picker/index.vue:302-310`) | short-4 литералом |
| time: стрелка | `transform` и **`height`** inline (`time-picker/_parts.scss:215-225`); угол копится коротким путём (`composables/time/useTimeDialControl.ts:30-37`) | short-4 |
| time: поля | `background-color`, `border-color` (`_parts.scss:114-116`) | short-4 |
| color: образцы | `scale(1.1)` на hover только при `no-preference` (`Swatches.vue:157-165`) | short-2 |
| OTP: ячейки | `border-color`, `background-color`, `color` (`otp-input/_cells.scss:18-21, 40`), слой filled (`:95`) | `$theme-animation-link` short-3 |

Мгновенно (Ф): листание месяца; смена режима date picker↔input; фон выбранного селектора времени; форма
и `font-weight: 700` выбранного периода (по решению); цвет выбранной цифры циферблата; ширина кромки
активной ячейки OTP 1→2rem; появление альфа-ползунка при смене формата; бегунок холста (верно для
драга). Reduced motion укорачивает только длительности длиннее short-4 (`base/_animations.scss:40-58`) —
у группы (short-2…4) под reduce не меняется ничего.

Гипотезы «прыгает / бегает» (номер заявки — §9):

- **Г-D1. Год-вью «на 1926», потом прыжок.** Скролл к году (`focusYear`) — только в `@after-enter`
  (`ui/date-picker/index.vue:252-272`, `year-grid/index.vue:71-80`); пока список проявляется,
  `scrollTop = 0` → видны 1926 (±100, `composables/date/index.ts:50, 85-90`) или 1900 (`stress`
  `century`). Конец верный (e2e ждёт `waitForMotion`), середина — нет. Чинить: скролл до показа, фокус
  после. → заявка 1.
- **Г-D2. Высота при смене вида:** дни 7 × 48 = 336, годы `calc(48·7 − 1rem)` (`date-picker/_index.scss:70`)
  → всё ниже (actions диалога) ходит на 1rem. → 1.
- **Г-D3. Смена режима picker↔input без перехода** (`index.vue:50-134`): диалог меняет высоту рывком.
  В Compose (по памяти — сверить `DatePicker.kt`) смена режима анимирована. Новое движение — **развилка**. → 2.
- **Г-D4. Месяц листается без движения** (`composables/date/index.ts:95-102`), в M3 — горизонтальный
  сдвиг. Если вводить (токены, не пружина) — направление зеркалится в RTL. **Развилка.**
- **Г-D5. RTL-стрелки: рипл не там.** `.ui-date-picker__arrow:dir(rtl) { transform: scaleX(-1) }`
  (`_parts.scss:128-130`) отражает **всю** `MButtonIcon`, а рипл считает точку от `clientX`
  (`directives/ripple.ts:45-49`) → волна из зеркальной точки; плюс `transform` в списке переходов
  `.ui-button` (`ui/button/index.vue:161`) анимирует переворот при смене `dir`. Отражать только иконку. → 3.
- **Г-D6. Кольцо года срезается** `overflow-y: auto` без `padding-block` (`_parts.scss:219-229`). → 4.
- **Г-D7. Таб-стоп пустого пикера не на «сегодня».** `focused = ref(restingFocus())` при setup, когда
  `today` ещё `null` (ставится в `onMounted`, `composables/date/index.ts:77-79`), наблюдателя на `today`
  нет (`useDateGridControl.ts:93-110`) → таб-стоп и `MDialogDate.focusDay` на 1-м числе, а план требует
  «выбранный или сегодняшний» (A11-12). Unit-спека; в фикстуре нужен диалог без даты.
- **Г-D8. ISO-строка уезжает на день.** `MDialogDate`: `new Date(date.value)` (`dialog/date/index.vue:104, 128`)
  — `'2026-10-14'` парсится как UTC → западнее UTC черновик 13-го; пикер парсит dayjs локально
  (`composables/date/index.ts:52-56`). Unit с `TZ` или проба с `timezoneId`.
- **Г-T1. Пустой циферблат при часы→минуты.** Слой цифр `absolute; inset: 0`, но `mode="out-in"`
  (`dial/index.vue:28`): 200 мс гаснут старые, 200 мс проявляются новые, в середине пусто, а стрелка
  доехала за первые 200 мс. В Compose — одновременный crossfade. → 5.
- **Г-T2. Цвет выбранной цифры опережает ручку:** `__number--selected` → `on-primary` мгновенно
  (`_parts.scss:266-268`), ручка едет 200 мс → белая цифра на светлом фоне, старая тёмная под ручкой. → 5.
- **Г-T3. Ручка отстаёт при драге:** переход `transform` активен и во время драга, каждый `pointermove`
  перезапускает его к квантованному углу (часы — 30°). Compose (сверить `TimePicker.kt`) ведёт ручку за
  пальцем и анимирует только снап. → 7.
- **Г-T4. Ошибка двигает раскладку:** `.ui-time-picker__error:empty { display: none }`
  (`ui/time-picker/index.vue:244-250`) — нарушение «место под ошибку зарезервировано». → 6.
- **Г-T5. Ширина при смене режима в h23:** `max-width` 304 ↔ 264 (`index.vue:179-185`), у h12 — одна 328.
  Своей кнопки режима у `MTimePicker` нет — для пробы нужен кейс с переключателем в `stress.vue`.
- **Г-T6.** Длина стрелки анимируется `height` (`_parts.scss:222-224`) — геометрия, не `transform`;
  соседей не трогает. Низкий приоритет.
- **Г-T7. RTL h12:** сетка тела не `direction: ltr` (ltr только у `__display/__period/__dial`,
  `_parts.scss:54, 155, 196`) → период слева от времени. Сверить с Compose. → 8 (осмотр `?dir=rtl`).
- **Г-T8. AM/PM «прыгает»:** форма и вес меняются мгновенно — **по решению**, ширина кнопки фиксирована.
  Только показать, не чинить.
- **Г-C1. Readonly-ползунок дрожит при драге:** `onHue/onAlpha` возвращают `input.value` на каждый
  `input` (`ui/color-picker/index.vue:114-132`).
- **Г-C2. Скачок высоты при смене формата:** `v-if` альфа-ползунка (`:28-29`) и замена поля hex на сетку
  `MNumberInput` (`Edit.vue`); в color-input панель меню ещё и перепозиционируется.
- **Г-C3. Бегунок не по центру полосы** (бегунок 20, полоса 16 на `content-box`, высота 40, `appearance:
  none` — `:162-195`). → 8.
- **Г-C4. Вид ползунков:** кольцо фокуса — прямоугольник 40 со скруглением `8/20` вокруг 16-полосы
  (`:168, 173-175`), между полосами 24 пустоты (`color-picker/_index.scss:41-48`); в концепте полосы почти
  вплотную. **Развилка.** → 8.
- **Г-C5. Выбранный образец теряет кольцо под фокусом:** `--selected` и `--active` оба пишут `outline`
  (`Swatches.vue:169-181`; `focus-ring` = `outline`, `abstracts/_mixins.scss:132-137`). → 8.
- **Г-C6.** `getComputedStyle` на каждый `pointermove` холста (`Canvas.vue:76, 116-122`) — против
  `behavior.md` (кэшировать на `pointerdown`).
- **Г-I1. MMenu присваивает кнопки пикера:** `hostsForeignWidget()` ищет `[role=listbox]`
  (`ui/menu/index.vue:113-121`); без образцов (фикстура color-input их не даёт) меню делает все `button`
  пикера `role="menuitem"` и фокусирует первый. Чинить в MMenu (вне объёма) → отчёт. → 9.
- **Г-I2. Двойная поверхность:** `MColorPicker` всегда рисует карточку `surface-container-high` + `large`
  + `elevation(1)` (`color-picker/_index.scss:13-21`), в том числе внутри поверхности MMenu. Образец
  решения в группе — `hosted`-контекст date-picker. → 9.
- **Г-O1. Кромка активной ячейки щёлкает:** ширина 1→2rem без перехода, цвет — 150 мс
  (`otp-input/_cells.scss:18-21, 69-72`) — новая активная сначала толстеет в старом цвете. Ровно то, что
  `color-and-state.md` называет «width snaps while the colour eases». → 10.
- **Г-O2.** У `underline` растёт только `border-bottom-width` (`_cells.scss:145-148`) → глиф
  поднимается на ½rem. Мелко.

## 5. Кастомизация: что есть и где дыры

- **MDatePicker** — слоты `#label`, `#headline({date})`, `#day({day})`, `#year({year})`, `#actions`;
  `v-model`, `v-model:mode`, `modeToggle`, `min/maxDate`, `locale`, все строки; `expose({ validate })`;
  escape hatch `useDatePicker` + `useDateGridControl` + `createCalendar`. Дыры: нет
  `error/errorMessage/helperText/required/name` — демо рисует свою строку ошибки
  (`demo/orders/NewOrderDeliveryFields.vue:26-32`); **тип модели не сохраняется** — строка на входе,
  `Date` на выходе (`composables/date/index.ts:112-115`), `CrmDateField.vue` конвертирует руками; пусто в
  шапке — `'—'` (`index.vue:222`), в концепте — слово-плейсхолдер; годы вне `min/max` удаляются
  (`composables/date/index.ts:85-90`), в концепте — «disabled 38%, not removed». Новый проп — развилка.
- **MDialogDate** — §2; нет `modeToggle`; `initialMode` применяется, только пока `mode` пуст (`:105`) —
  повторное открытие остаётся в последнем режиме; при `initialMode="input"` начальный фокус не ставится
  (`focusDay` ищет только ячейку сетки, `:112-115`).
- **MTimePicker** — `#label`, `#helper`; оси, состояния формы, строки, `name` (скрытый input),
  `expose({ validate })`; три композабла + `createClock`. Дыра: **нет кнопки режима** (у date-picker есть
  `modeToggle`) — демо держит `v-model:mode`, а переключить нечем.
- **MColorPicker** — `formats`, `v-model:format`, `swatches`, `hide*`, `messages` (тип экспортируется),
  `change`/`invalid`. Дыры: **ни одного слота** (EN-03); нельзя убрать свою поверхность (Г-I2); ряд
  «превью | формат | значение» из концепта не повторён — превью с текстом значения, ниже список форматов
  на всю ширину, ниже поле (`index.vue:46-69`), значение показано дважды.
- **MColorInput** — всё поле семейства, `v-model:open`, `format/auto`, `commit`, `clearable`,
  `pickerMessages`. Дыры: слоты `MTextField` не проброшены (EN-03); образец не заменить;
  `.ui-color-input__trigger { padding }` (`index.vue:269-271`) почти мёртв — `padding-inline` перебивает
  `.ui-button.ui-icon-button` (`ui/button/icon/index.vue:50`), высота фиксирована плотностью.
- **MOtpInput** — `#label`, `#group`, `#field`, `#mask`, `#separator`, `#support`; `variant`, `mask`,
  `placeholder`, `groups`; `expose`; композаблы без классов. `ui-otp-input--focused` ставится
  (`index.vue:159`), но не стилизован — ждёт шага 6.
- **Автоимпорт (Ф):** `composables/**` целиком в автоимпорте (`src/module.ts:167`) → в приложение
  утекают `createCalendar`, `createClock`, `createColorPickerState`/`provide…`/`useColorPickerContext`.
  Прецедент 2026-10-08: хелперы таблицы → `utils/table`. Перенос — ломающий → развилка (рекомендация:
  фабрики в `utils/`, `use*Control` оставить).

## 6. Минимизация и оптимизация

Файл > 400: `composables/otp-input/useOtpControl.ts` 413 (вынести каретку и `cellAt`). Остальные ≤ 339.
- Миксин `state-layer($t)` **дважды построчно**: `date-picker/_parts.scss:11-41` и
  `time-picker/_parts.scss:11-41` → общий (в `abstracts` — заявка оркестратору, или партиал группы).
- Шахматка `conic-gradient` 4 раза (`ui/color-picker/index.vue:211, 216`, `Preview.vue:42`,
  `ui/color-input/index.vue:281`) и блок `checker` в двух картах (`color-picker/_index.scss:99-103`,
  `color-input/_index.scss:19-23`) → миксин + color-input `@use` карту пикера.
- Градиенты дважды ради RTL: hue (`index.vue:200-206`), alpha (`:208-218`), насыщенность (`Canvas.vue`)
  → стопы в переменную, направление — `@each`.
- Длительности строкой `var(--sys-motion-…)` в `.vue` (`ui/date-picker/index.vue:332`,
  `ui/time-picker/index.vue:304`, `ui/dialog/date/index.vue:171`) и в картах
  (`date-picker/_index.scss:77-80`, `time-picker/_index.scss:103-106`, `color-picker/_index.scss:91-92`);
  OTP берёт `$theme-animation-link` — свести к одному. Классы переходов (`.ui-date-picker-view-*`,
  `.ui-time-picker-face-*`, `.ui-date-dialog-fade-*`) — вне блока и вне `$t`.
- Мимо карты: `spacing(12)` (`date-picker/_parts.scss:100`), `spacing(8)` (`:67`); `weight: 700`
  (`time-picker/_index.scss:63`) — `font-weight: 700` в списке анти-паттернов аудита.
- Hairline `1rem` → `max(1px, 1rem)`: `date-picker/_index.scss:41, 55, 67`, `color-picker/_index.scss:63, 76`,
  `color-input/_index.scss:17`, `otp-input/_index.scss:32`; заодно пересчитать `calc(48·7 − 1rem)` (`:70`).
- Специфичность: `$hovered` в OTP (`_cells.scss:15`) ≈ (0,6,0) → модификаторами корня.
- Две механики клавиатуры сетки: дни — `useDateGridControl`, годы — свой `onKeydown` и DOM во фрагменте
  (`fragments/date-picker/year-grid/index.vue:67-103`) — поведение в компоненте вопреки п. 17.
- Ошибка dev-сообщения: `format.value = next`, потом печать `${format.value} → ${next}` — оба новые
  (`composables/color-picker/context.ts:149-152`).
- `let` в `<script setup>`/фабриках (`ui/date-picker/index.vue:256`, `ui/dialog/date/index.vue:99-101`,
  `useTimeDialControl.ts:79-80`, `Canvas.vue:64`, `context.ts:82`) — состояние экземпляра, не модуля;
  п. 18 не нарушают, не «чинить».
- Свои кнопки: селекторы и период времени — нативные `<button>` со своим слоем; `MButton` toggle несёт
  пружинный морф, а период по решению статичен → **не переводить** без развилки. Кнопка месяца
  (`header-nav/index.vue:5-24`) — кандидат в `MButton variant="text"`, не обязательно.
- Фрагменты color-picker — плоские `Canvas.vue`…, у остальных `fragments/<name>/<part>/index.vue`.
  Косметика.

## 7. Связи с другими группами

Потребители группы: `MDatePicker` ← только `MDialogDate`; `MColorPicker` ← только `MColorInput`; прочие
в ките никем. Живые потребители (читать; правка — заявкой оркестратору): `playground/app/demo/orders/
{NewOrderDeliveryFields.vue (MDatePicker со всеми ru-строками, MTimePicker с v-model:mode),
OrdersPeriodPicker.vue (два MDialogDate как самодельный диапазон)}`, `demo/crm/new-deal/{CrmDateField.vue
(MDialogDate с односторонним :date), CrmNewDealFields.vue (MTimePicker, MColorInput)}`. Смена `confirm`,
типа модели, строк ломает их.

Что группа потребляет:
- **w1** `MButtonIcon`: `ui/date-picker/index.vue:32`, `fragments/date-picker/header-nav/index.vue:30, 40`,
  `ui/color-input/index.vue:28`; `MButton`: `ui/dialog/date/index.vue:24, 30`; `MLoading`:
  `ui/otp-input/index.vue:90`; `useRetired*Warning` (`composables/button/`): date `:152`, time `:86`,
  dialog/date `:56`; ripple — через `MButtonIcon` (Г-D5).
- **w3** `MTextField`: `fragments/date-picker/input/index.vue:3`, `fragments/color-picker/Edit.vue` (hex),
  `ui/color-input/index.vue:2`; `useFieldShape` (`color-input/index.vue:83, 115`); `mFieldProps`,
  `fieldDensityProp`, `MTextFieldVariant` (`color-input/props.ts`, `otp-input/props.ts:16, 25`);
  `MNumberInput` — каналы в `Edit.vue`.
- **w4** `MDropdown` (`ui/color-picker/index.vue:54`); `useListbox` (`composables/listbox`, общий с
  dropdown) — `Swatches.vue:53`.
- **Вне объёма**: `MMenu` + `UiMenuOrigin` (`ui/color-input/index.vue:44, 76-77`); `MOverlay` +
  `mModalLayerProps/pickModalLayerProps` (`ui/dialog/date/index.vue:2, 52-53`);
  `createRangeKeyboardController` (`composables/slider`, группы нет): `Canvas.vue:54`,
  `useTimeDialControl.ts:3`; `MIcon`. Файлы оркестратора: `shared/utils/{color, context, props}`,
  `composables/{useField, useGlobalListener, useTimer, useControlAttrs}`; «только дописывать» —
  `shared/constants/{messages,icons}.ts`.
- Что сломает группу у соседей: геометрия/`padding` `MButtonIcon` (триггер, стрелки); строка поддержки и
  высоты `MTextField`/`MNumberInput` (высота пикера, поле даты); API `MDropdown` (`items`, `item-value`,
  `label-placement="hidden"`, `density="compact"`); `MMenu` (Г-I1).

## 8. Рекомендуемый порядок и объём

1. **MDialogDate + MDatePicker, баги без развилок** (S–M): `confirm` со старой датой, ISO-строка (Г-D8),
   «сегодня» (Г-D7), скролл годов до показа (Г-D1), стрелки RTL (Г-D5), кольцо года (Г-D6). Проброс
   подписей/слотов в диалог — исправление дефекта, но состав (все пропы пикера? слоты?) согласовать одной
   строкой. Первым: на диалоге стоят оба дашборда, а unit-спеки у него нет.
2. **MTimePicker, движение** (S): crossfade без `out-in` (Г-T1), цвет цифры в такт ручке (Г-T2), резерв
   строки ошибки (Г-T4); Г-T3 — после пробы и сверки с Compose.
3. **MOtpInput** (S): Г-O1 (например, кромка 2 всегда, прозрачная/своей роли в покое — как у полей
   времени `time-picker/_parts.scss:102-133`); шаг 6 — после ответа.
4. **MColorPicker** (M): развилки по ползункам и ряду значения, `hosted`-поверхность, слоты; Г-C1, Г-C2, Г-C5.
5. **MColorInput** (S): слоты поля, триггер; шаг 1 — заблокирован.
6. Минимизация §6 — параллельно, файл за файлом, `lint:scss` после каждого.

Пока ждёшь дирижёра: unit-спеки `MDialogDate` (односторонний `:date`, `TZ`, начальный фокус),
`useTimeDialControl`, `useTimeFieldsControl`; дедупликация токенов без смены вида; кейсы фикстур для проб
(диалог без даты и со строкой; time-picker с переключателем режима; color-input с образцами).

Развилки, почти наверняка к владельцу (по одной): шаг 6 OTP; анимация листания месяца (Г-D4) и смены
режима (Г-D3); ползунки цвета (оставить 24 / перекрыть цели при узком видимом зазоре / иначе);
раскладка ряда «превью | формат | значение»; поверхность пикера в поповере; пропы формы у date-picker
(`error`, `helper`, `name`); тип модели date-picker; фабрики из `composables/` в `utils/`; кнопка режима у
time-picker. Сквозное (не группы): локаль и строки на уровне приложения.

Guidance (§7 общего брифа), вероятно нужные: `animate-element-entry-exit`, `motion`,
`individual-transform-properties`, `slider`, `sms-otp-form`, `forms`, `validate-input-after-interaction`,
`accessible-error-announcement`, `scrollability-affordance-hints`, `soft-edge-content-fade`,
`size-aware-styling`, `precise-text-alignment`, `reduce-style-repetition`.

## 9. Стартовые заявки дирижёру

1. **probe** `/date-picker/matrix` и `/date-picker/stress`: клик `[data-test=selected] .ui-date-picker__view-toggle`
   (во втором — `[data-test=century] …`), потом обратно; targets `{ year: '[data-test=selected] .ui-date-picker__year--selected', card: '[data-test=selected]' }`,
   900 мс, кадры 100/250/400 мс. Ждём `jump` года (Г-D1) и изменение высоты (Г-D2).
2. **probe** `/date-picker/matrix`: клик `[data-test=open-dialog]`; `js` `document.activeElement.className`;
   клик `.ui-date-dialog .ui-date-picker__mode`; targets `{ dialog: '.ui-date-dialog', actions: '.ui-date-dialog .ui-date-picker__actions' }`,
   кадры 0/100/300 мс (Г-D3).
3. **probe** `/date-picker/matrix?dir=rtl` и `ltr`: `page.mouse.down()` у внутреннего края
   `[data-test=selected] .ui-date-picker__arrow:last-child`, скриншот через 60 мс (Г-D5).
4. **look** `/date-picker/matrix`, light/dark: клик `[data-test=selected] .ui-date-picker__view-toggle`,
   wait 500, press `Home`, shot `[data-test=selected] .ui-date-picker__years` (Г-D6).
5. **probe** `/time-picker/matrix`: (а) клик мышью по «9» на `[data-test=h23-evening] .ui-time-picker__dial`;
   (б) focus `[data-test=h23-evening] [role=slider]` + `ArrowUp`; targets `{ hand: '[data-test=h23-evening] .ui-time-picker__hand', numbers: '[data-test=h23-evening] .ui-time-picker__numbers' }`,
   styles `transform, height, opacity`, 900 мс, скриншоты циферблата 80/120/250/350 мс (Г-T1, Г-T2).
6. **probe** `/time-picker/matrix`: в `[data-test=input-h23]` в поле минут (`[id$=minutes-field]`) ввести
   `75`, Tab; targets `{ picker: '[data-test=input-h23]', next: '[data-test=input-h12]' }`; ждём `shift` (Г-T4).
7. **probe** `/time-picker/matrix`: драг по дуге `[data-test=h23-evening] .ui-time-picker__dial`
   (12 × `page.mouse.move`, 16 мс); на каждом кадре `transform` стрелки и угол указателя (Г-T3).
8. **look** `/color-picker/matrix` (light, dark, `?dir=rtl`): shot `[data-test=enabled]`; focus
   `[data-test=enabled] .ui-color-picker__hue`, shot; focus `[data-test=enabled] .ui-color-swatches`, shot;
   `js` высота hue; shot `[data-test=h12-morning]` и `[data-test=horizontal]` на `/time-picker/matrix?dir=rtl`
   (Г-C3, Г-C4, Г-C5, Г-T7). Сравнивать с `renders/color-picker/concept.webp`.
9. **look** `/color-input/matrix`: `js` `document.querySelector('[data-test=value-filled]').closest('.ui-text-field').querySelector('.ui-color-input__trigger').click()`,
   wait 400, `js` `document.activeElement.outerHTML.slice(0,160)`, `js`
   `document.querySelectorAll('.ui-color-input__picker [role=menuitem]').length`, `js` размеры триггера
   (`getBoundingClientRect`), shot страницы (Г-I1, Г-I2).
10. **probe** `/otp-input/matrix`: `type` `123` в `[data-test=live] input` по символу с паузой 300 мс;
    targets — `[data-test=live] .ui-otp-input__field:nth-child(1…3)`, styles `border-top-width,
    border-top-color` (Г-O1); плюс shot `[data-test=filled]` после focus `[data-test=filled] input` — кадр
    «полный код в фокусе» для развилки шага 6.
