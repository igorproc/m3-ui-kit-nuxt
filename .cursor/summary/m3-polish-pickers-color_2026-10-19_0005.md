# M3-polish · pickers-color (w5) — 2026-10-18…19

Группа: MDatePicker + MDialogDate, MTimePicker, MColorPicker, MColorInput, MOtpInput. Аудит —
`.cursor/handoff/m3-polish/audit/pickers-color.md` (61 находка, 13 развилок); решения Q-1…Q-13 — оркестратор
по рекомендациям, Q-7 → вариант 3. Без коммитов.

## Решения

| Q | Решение |
|---|---|
| Q-1 OTP шаг 6 | код, набранный до конца, в фокусе: все кромки `primary` (модификатор `--caret-past`), фокус старше ошибки |
| Q-2 листание месяца | мгновенно |
| Q-3 смена режима даты | новый режим проявляется fade, размер сразу |
| Q-4 пропы формы date-picker | `helperText`, `error`, `errorMessage`, `required`, `name` (+ `#helper`) |
| Q-5 тип модели даты | в типе входа: строка → `YYYY-MM-DD`, число → мс, `Date`/пусто → `Date` |
| Q-6 проброс в MDialogDate | все пропы пикера, кроме формы; слоты `#label`, `#headline`, `#day`, `#year` |
| Q-7 кнопка режима time-picker | `modeToggle` по умолчанию `false`, подписи — пропы без дефолтов + dev-предупреждение |
| Q-8 ползунки | кольцо фокуса вокруг бегунка; **перекрытие целей откатено** (см. «Отклонения») |
| Q-9 ряд значения | превью + формат в ряд, значение — рядом или под ними целиком (см. «Отклонения») |
| Q-10 поверхность | встроенный пикер — плоская карточка без тени; в поповере — без своей поверхности |
| Q-11 фабрики | `createCalendar` → `utils/date`, `createClock` → `utils/time`, контекст пикера → `utils/color-picker` |
| Q-12 OTP | символ в полном коде заменяет ячейку под кареткой |
| Q-13 color-input | без пропов `autocomplete` и `loading` |
| шимы | сняты `headline` (date-picker, dialog/date), `mode: dial|keyboard` и `is24h` (time-picker), `mask: true|глиф` (OTP) |

## Что сделано (файлы)

**MDatePicker** — `ui/date-picker/{index.vue, props.ts}`, `fragments/date-picker/{year-grid, header-nav, input}`,
`composables/date/{index.ts, useDateGridControl.ts, useYearGridControl.ts (новый), useDateViewFocus.ts (новый)}`,
`utils/date/{createCalendar.ts (перенос), value.ts (новый)}`, `stylesheet/components/date-picker/{_index, _parts,
_state-layer (новый)}`, общий фрагмент строки поддержки `fragments/picker-support` + `stylesheet/components/picker-support`.
Год-вью центрируется до показа и держит год под фокусом в виду (было: `offsetTop` от body — год вне списка),
высота годов = 7 × 48 (было −1rem), таб-стоп пустого пикера — сегодня, в RTL отражается только глиф стрелки
(рипл под пальцем), клавиатура года — в control-композабле, слой состояния — одним списком селекторов.

**MDialogDate** — `ui/dialog/date/{index.vue, props.ts (новый)}`: `confirm` отдаёт только что выбранный день,
`v-model:date` пишется в типе входа, ISO-строка без сдвига дня (dayjs, не `new Date`), первый фокус — сегодня
или поле ввода, `initialMode` при каждом открытии без `v-model:mode`, проброс пропов и слотов, fade перехода на
токенах карты.

**MTimePicker** — `ui/time-picker/{index.vue, props.ts}`, `fragments/time-picker/{dial, fields}`,
`composables/time/{useTimeDialControl, useTimeFieldsControl, useTimePickerControl}`, `utils/time/createClock.ts`
(перенос), `stylesheet/components/time-picker/{_index, _parts}`. Одновременный crossfade цифр, цвет выбранной
цифры в такт ручке, ручка под пальцем при драге, нет кольца фокуса после клика мышью (браузерный фокус без
`preventDefault`), одна строка поддержки с резервом и глифом, фокус старше ошибки на поле, readonly-период не
уводит фокус, `modeToggle`, явные типы возврата трёх композаблов.

**MColorPicker** — `ui/color-picker/{index.vue, context.ts (новый)}`, `fragments/color-picker/{Canvas, Edit,
Preview, Swatches}.vue`, `utils/color-picker/context.ts` (перенос), `stylesheet/components/color-picker/{_index,
_checker (новый)}`. Ряд значения, каналы 2 × 2 при альфе (было обрезано «103» → «10»), кольцо фокуса у бегунка,
слоты `#preview/#swatch/#actions`, плоская карточка, `hosted`, выбранный образец — кольцо тенью + фокус снаружи,
pressed-слой, без подъёма в readonly/disabled, фокус холста — только с клавиатуры, направление холста — на
`pointerdown`, шахматка одним миксином, RTL-градиенты через `@each`, dev-сообщение о потере альфы.

**MColorInput** — `ui/color-input/{index.vue, props.ts}`, `stylesheet/components/color-input/_index.scss`. Пикер в
поповере без своей поверхности, фокус при открытии — внутрь пикера, при закрытии — на кнопку (и когда фокус
застрял в уходящем пикере), проброс слотов поля, `shape` напрямую (шим `rounded` снят w3).

**MOtpInput** — `ui/otp-input/{index.vue, props.ts}`, `composables/otp-input/{useOtpControl.ts, useOtpCaret.ts
(новый)}`, `stylesheet/components/otp-input/{_index, _cells}`. `--caret-past`, кольцо активной ячейки — inset-тенью
(кромка hairline не меняет ширину, переход плавный), замена символа в полном коде (`beforeinput`), сняты старые
значения `mask`, каретка вынесена (useOtpControl 413 → 374 строки).

Фикстуры (мои): `playground/fixtures/date-picker/dialog.vue`, `time-picker/modes.vue`, `color-input/swatches.vue`
(новые), кейс `toggle` в `time-picker/matrix.vue`. Пробы — `playground/probes/w5-pickers-color/*` (вне git).

## Отклонения от утверждённого

- **Q-8**: перекрытие целей ползунков (видимый зазор 12) откатено. axe `target-size` считает CSS px: на корне
  `1vw/f` при 1280 незаслонённые 28rem ≈ 19 px < 24 px (`008`: 4 axe-падения). Кольцо вокруг бегунка оставлено;
  зазор между полосами — 24, как был.
- **Q-9**: в ширине 280 `превью 40 | формат 120 | значение 112` не помещается с паддингами полей семейства;
  превью и формат в одном ряду, значение рядом, если хватает места, иначе — целиком под ними.
- **Q-7**: у MDatePicker `modeToggle` по умолчанию `true` с готовыми строками, у MTimePicker — `false` без
  строк: к решению владельца вместе с локалью приложения.

## Ломающие изменения и миграция

| Было | Стало |
|---|---|
| `MDatePicker headline`, `MDialogDate headline` | `label` |
| `MTimePicker mode="dial" | "keyboard"` | `"picker" | "input"` |
| `MTimePicker is24h` | `hour-cycle="h23" | "h12"` |
| `MOtpInput mask` = `true` / глиф | `mask="always"`, глиф — слот `#mask` |
| `MDatePicker` с моделью-строкой отдавал `Date` | отдаёт строку `YYYY-MM-DD` (число — число) |
| `MDialogDate` `v-model:date` со строкой получал `Date` | получает строку; `confirm` по-прежнему `Date | null` |
| автоимпорт `createCalendar`, `createClock`, `createColorPickerState`, `provide/useColorPickerContext` | явный импорт `#kit/utils/date/createCalendar`, `#kit/utils/time/createClock`, `#kit/utils/color-picker/context` |
| `MColorInput autocomplete`, `loading` | пропов нет (не делали ничего) |
| `.ui-color-preview__swatch`, `.ui-color-preview__value`, `--swatch-color`, `--alpha-color` | `.ui-color-preview` (только образец), `--m-color-picker-swatch`, `--m-color-picker-alpha`, `--m-color-input-swatch` |
| `.ui-time-picker__helper`, `__error` | `.ui-picker-support` (+ `__line`, `__line--error`) |

## Тесты и гейты

- eslint (мои пути, фикстуры, пробы) — exit 0; stylelint — exit 0; `npm run lint:scss` — 154 compiled, 0 deprecations;
  typecheck — ошибок в моих путях нет (остались dropdown/table других групп); vitest моих каталогов — 233/233.
- e2e у дирижёра: 006 date-picker 26/26; 007 + 010 time-picker 28/28 (2 падали только в первом прогоне);
  013 color-picker + color-input + otp-input + date-picker — 97 passed, **1 failed** (color-input «Escape returns
  focus to the swatch button», повтор тоже упал — открыто).
- Визуально проверено скриншотами (009, 014): date-picker (годы, RTL-стрелки, ввод, диалог), time-picker (кнопка
  режима, строка поддержки, ошибка в фокусе), color-picker (кольцо у бегунка, RGBA 2 × 2, оба кольца у образца),
  color-input (одна поверхность). Не смотрел: OTP после правок, forced colors, reduced motion, 360/768.

## E2E финал

- 013 (color-picker + color-input + otp-input + date-picker): 97 passed, 1 failed — color-input
  «the picker takes its own arrow keys, and Escape returns focus to the swatch button»; повтор тоже красный.
- Разбор (проба 015, журнал focusin): `aria-expanded=false` на 6 мс → ловушка MMenu на 7 мс возвращает фокус в
  уходящий пикер (ось холста) → пикер удаляется на ~230 мс → фокус на body. Дефект компонента, не теста.
- Починка: возврат фокуса на кнопку образца — на следующих кадрах после закрытия (`useRaf`, до 2 кадров), только
  если фокус на body, вне документа или внутри уходящего пикера. Перенос фокуса внутрь при открытии (CI-B1) сохранён.
- 016 — всё ещё красный: Vue обнуляет шаблонный ref пикера в начале закрытия (до конца exit-перехода), поэтому
  «фокус внутри уходящего пикера» не распознавался (журнал 017). Элемент пикера теперь запоминается при открытии.
- **018 (color-input.e2e.ts): 14/14 зелёные.** Итого по группе: date-picker 26/26 (006, 013), time-picker 28/28
  (007/010), color-picker + otp-input + date-picker — зелёные в 013, color-input 14/14 (018).
- QA `_build.mjs --check`: OK для date-picker, time-picker, color-picker, color-input, otp-input.

## Открытые вопросы, риски, долги

- Клик по коробке MDropdown мимо input не открывает список (w4/w3, проба 011/012); в e2e пикера — клавиатура.
- Зарезервированные строки поддержки у списка форматов и поля значения дают пустоты в пикере (семейство полей).
- `MMenu` вокруг пикера color-input — `role="menu"` без `menuitem` (A11-06, вне объёма).
- `dialog.json` в QA: date-пункты ссылаются на код до c9da731 — не обновлял.
- Выходной CSS до/после — из финального прогона оркестратора (база: date-picker 7794/1556, date-dialog 530/297,
  time-picker 10236/1817, color-picker+фрагменты+color-input 6908/1484, otp-input 5845/1192).
