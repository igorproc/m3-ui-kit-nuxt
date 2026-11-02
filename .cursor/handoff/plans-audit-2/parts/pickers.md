# Pickers — аудит планов

Итог: сделано 50 · частично 10 · нет 2 · регресс 0 · отменено 7 (по пунктам) · не проверено 6 (шаги документации: `../docs` вне кита, у `docs/server/data/en/{date,time}-picker.json` mtime — 13 мая).

Пути кода ниже даны от `src/runtime/`. Пробы лежат в `playground/probes/plans-audit-2/pickers/`, окно 1280×800; режим coarse — контекст `hasTouch + isMobile` (`matchMedia('(pointer: coarse)')` = true). Прошлый аудит (`sweep-run/plans-audit_2026-10-23.md:25-28`): hsl/hsla у образцов, пакетный отказ файлов, disabled-день через `opacity`, мишень 40/36 у дня, PageUp/Down ±10 у циферблата исправлены и подтверждены пробами. Открытыми остались «мишень 48 у образцов» и «период — свои `<button>`»; циферблат по высоте отменён (S2).

## inputs/date-picker.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | Баги и a11y: фокус в списке лет после `after-enter`, `aria-*`, disabled у стрелок, pressed, явные импорты | сделано | `ui/date-picker/index.vue:9-11` (group + labelledby), `fragments/date-picker/header-nav/index.vue:9-17` (`aria-expanded`, `aria-controls`, `aria-live`), `composables/date/useDateViewFocus.ts:247-252`, `_state-layer.scss:138` (`:active::before`), `ui/dialog/date/index.vue:81-83`; проба `date.probe.ts › aria and year view`: сразу после клика фокус ещё на кнопке, через ≤3 с — на «2026», он в видимой области; стрелка на границе: `disabled`, цвет `/ 0.38` | S |
| Ш2 | Одна карта токенов с числами M3 | сделано | `assets/stylesheet/components/date-picker/_index.scss:26-103`, пути `g()` через точку; проба `› geometry`: контейнер 360, шапка 120, nav 56, день 40 (шрифт 16rem = body-large), строка дней недели 48 (сетка 336 = 7 × 48), чип года 72 × 36, угол large 16, тени нет (вопрос 3 → 2) | M |
| Ш3 | Один контроллер сетки | сделано | `utils/date/createCalendar.ts:129-143`, `composables/date/useDateGridControl.ts`, `useYearGridControl.ts`; проба `› keyboard`: 31.10 → ArrowRight → 1.11; 31.10 → PageUp → 30.09 (кламп); Shift+PageDown → 30.10.2027; Home/End — края недели; RTL: ArrowLeft → следующий день, шеврон `scaleX(-1)` | M |
| Ш4 | Локаль и строки через `Intl` | сделано | `createCalendar.ts:82-106` (`weekInfo` с запасным воскресеньем, форматы `Intl`); `grep dayjs/locale` по `src/runtime` пуст | M |
| Ш5 | Анатомия M3 во встроенном пикере | сделано | `ui/date-picker/index.vue:21-57` (title, headline, переключатель, divider), стрелки — `MButtonIcon` (`header-nav/index.vue:30-54`), поле ввода outlined (`fragments/date-picker/input/index.vue:5`), футера нет | M |
| Ш6 | `MDialogDate` поверх `MDatePicker` | сделано | 222 строки; min/max — через `DIALOG_PICKER_KEYS` (`dialog/date/props.ts:19`); защита от повторного нажатия при закрытии `index.vue:131,157,164`; `max-height: 100dvh` + прокрутка `:200-201`; проба `› dialog`: первый фокус — «Wednesday, October 14, 2026», Escape → `cancelled` | L |
| Ш7 | Range | отменено | `docs/system/ru-RU/decisions.md:32` («Range-пикер даты») | — |
| Ш8 | Docked (`MDateField`) | отменено | `decisions.md:31` | — |
| Ш9 | Документация | не проверено | вне кита | S |
| A | `headline` → `label` с алиасом на релиз | отменено | `decisions.md:39`: алиасы не делаем до стабильной версии; пропа `headline` нет (`ui/date-picker/props.ts`) | — |
| A | `modeToggle` по умолчанию `true` | отменено | `decisions.md:106` (Q37-А): по умолчанию `false`, `props.ts:50` | — |
| A | `disabled`/`readonly`, `locale`, фразы без дефолтов, слоты, реактивные min/max, `valueType` (Q51-Б) | сделано | `props.ts:31-78`, `composables/date/index.ts:61-68`. `errorNotAllowed` слит с `errorRange` (`props.ts:77`): без предиката дня второй фразе нечего называть | S |
| Г | Г1–Г8 | сделано | Г3: недоступный день `tabindex=-1`, `aria-disabled`, фокусируется кликом, не выбирается; стрелка у `min` остаётся на `min` (кламп `useDateGridControl.ts:136-141`). Г4: SSR-проба `› SSR` — group, grid, 31 ячейка с `aria-label`, tab-stop, `aria-expanded`, `aria-live`; `aria-current` появляется только на клиенте — по плану (EN-08). Г7: часть «дефолты в `MESSAGES`» заменена решением Q32-А (`decisions.md:40`). `lint:scss` и axe я не запускал (axe — в `date-picker.e2e.ts:8-18`) | — |

Мишень 48 (S8) подтверждена пробой `› coarse pointer`: `::after` дня 48 × 48, года 69 × 48 (только по блочной оси), стрелки 48 × 48.
Токены: совпадают 24 из 24 применимых строк (строка range отменена).

## inputs/time-picker.md — тег `done` → факт `частично` (тег неверен в мелочах)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | Баги и a11y: период `type=button` + `radio`/`aria-checked`, часы двумя цифрами, фокус отдельно от выбора, пустая модель | сделано | проба `time.probe.ts › geometry`: `BUTTON type=button role=radio aria-checked=[true,false]`, селектор «09»; рамка поля прозрачна в покое (`time-picker/_parts.scss:76`); пустая модель — «--», активного поля нет (`composables/time/useTimePickerControl.ts:73,107`) | S |
| Ш1 | EN-04: `inheritAttrs: false`, `aria-*` на поля | частично | у `ui/time-picker/index.vue` нет `defineOptions({ inheritAttrs: false })`, атрибуты потребителя ложатся на корневую группу. `layout` теперь проп и наружу не протекает, `name` уходит в hidden input `:15-21` | S |
| Ш2 | Одна карта токенов, `::before`, hover в `can-hover`, LY-03 | сделано | `assets/stylesheet/components/time-picker/_index.scss`, подпапок `dial/`, `keyboard/` нет; `_parts.scss:40` (`state-layer`); радиусы колец — доли в JS (`utils/time/createClock.ts:108`), отказ от CSS-свойства записан в «Заметках реализации» | M |
| Ш3 | Селекторы 96 × 80 (`radio`) | сделано | проба: селектор 96 × 80, display-large; `fragments/time-picker/selectors/index.vue` | M |
| Ш3 | Период: механика toggle и ветка `selected` из плана кнопок (S9), а не своя | частично | Expressive-пара со статичной формой есть, но это свои `<button>` (`fragments/time-picker/period/index.vue:6-14`) со своим слоем (`_parts.scss:134-152`). Совпадает с прошлым аудитом | S |
| Ш4 | Поведенческий слой: Pointer Events, переход через 0°, PageUp/Down ±5 | сделано | `composables/time/useTimeDialControl.ts:122-141, 164-176`; проба `› dial keyboard`: 21 → ↑ 22 → PageUp 3 (с переходом) → PageDown 22; Home 0 → ↓ 23; минуты 45 → PageUp 50 → 2×PageDown 40 | M |
| Ш5 | Состояния формы, `hourCycle`, AM/PM из `locale` | сделано | `ui/time-picker/props.ts:37-55`, `createClock.ts:62-73` | S |
| Ш6 | `MDialogTime` | отменено | `decisions.md:33` | — |
| Ш7 | Horizontal складывается по ширине | сделано | `ui/time-picker/index.vue:203,283`; проба `› narrow`: при 280 и 360 складывается, при 600 стоит в ряд, переполнения нет | S |
| Ш7 | Циферблат сжимается до 200 при нехватке высоты | отменено | `.cursor/handoff/sweep-run-2/owner-questions.md` S2, рекомендация «В — не делать» (оба способа нарушают правила rem и SSR). Проба `› dial height`: в окне 1280 × 420 циферблат остаётся 256 | — |
| Ш8 | Документация | не проверено | вне кита | S |
| A | Алиасы `is24h` и `dial`/`keyboard` | отменено | `decisions.md:39`; в `props.ts` только `hourCycle` и `mode: picker \| input` | — |
| Т | Мишень 48 у кнопок периода на `pointer: coarse` (S8) | нет | проба `› coarse pointer`: опция периода 52 × 38 (vertical) и 106 × 38 (horizontal), `::after` — `none`; в `_parts.scss:134-152` нет `touch-target(block)`. У кнопки режима мишень 48 × 48 есть | S |
| О | Disabled — `opacity` всего тела, а не цветовые роли | частично | `ui/time-picker/index.vue:310-312`, токен `disabled.opacity` `_index.scss:104`; проба: тело 0.38. Расходится с `color-and-state.md:48-50` и с решением G4 для date-picker (`opacity` гасит и кольцо фокуса) | S |
| Г | Г1–Г9 | сделано | Г2: проба — циферблат 256, ручка 48, центр 8, кольца r101 и r69 из 256, фон `surface-container-highest`. Г4: `role=radio`, `aria-checked`, жирный выбранный. Г5: slider, клавиатура пробой. SSR (`› SSR`): group, 2 radiogroup, slider `aria-valuetext="9 AM"`, стрелка нарисована на сервере | — |

Токены: совпадают 18 из 19; расхождение — мишень периода (строкой выше).

## inputs/color-picker/index.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | Сравнение образцов по значению цвета | сделано | `fragments/color-picker/Swatches.vue:80-82`; проба `color.probe.ts › hsl/hsla`: в форматах HSL, HSLA, HEX и RGBA клик по Error, White и Primary отмечает ровно этот образец, модель — `hsl(3, 71%, 41%)` и т. п. Дефект прошлого аудита закрыт | S |
| Ш2–Ш4 | Фокус ползунков и образцов, listbox с activedescendant, ARIA холста и группы | сделано | `ui/color-picker/index.vue:225-231` (кольцо на бегунке); проба `› swatch keys`: Primary → → Error → White → End Black → Home Primary → ← Black (по кругу), у детей listbox нет `tabindex` (одна точка табуляции); `› canvas`: группа «Colour, enabled», каналы — `role=group`, hue `aria-valuetext="256°"` | M |
| Ш5–Ш7 | Формат — `MDropdown`, ошибка с подсказкой, disabled по ролям, readonly | сделано | `index.vue:60-73`; `fragments/color-picker/Edit.vue:84-86,137-140`; `index.vue:283-302` | S |
| Ш8 | Токены, тени, RTL, reduced motion | частично | RTL: проба — `linear-gradient(to left…)`; тени — `elevation(1)`; scale только при `no-preference` (`Swatches.vue:211`). Нарушено правило «CSS-переменные только у layout»: inline `--m-color-picker-alpha` (`index.vue:41`), `--m-color-picker-swatch` (`Swatches.vue:29`), `--m-color-picker-preview` (`Preview.vue:6`); проба `› inline custom properties` их видит | S |
| Ш9 | Слушатели только на время драга | сделано | `Canvas.vue` — pointer capture на элементе, слушателей на `window` нет | S |
| Ш10 | Тесты | сделано | `ui/color-picker/tests/{variants,interaction,a11y}.spec.ts`, `playground/fixtures/color-picker/color-picker.e2e.ts` | M |
| Ш10 | Документация | не проверено | вне кита | S |
| Г | Готово (выбор стабилен, фокус, ошибка, формат) | сделано | пробы выше; SSR (`› SSR`): group, 2 оси-slider, listbox с именем, Primary отмечен уже в серверном HTML | — |

Токены: совпадают 4 из 4 строк таблицы. Правило CSS-переменных — Ш8.

## inputs/color-picker/canvas.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| — | Две скрытые оси `role=slider`, pointer capture, forced colors у бегунка | сделано | `Canvas.vue:25-43,207-215`; проба: Saturation/Brightness с `aria-valuenow` | — |
| — | Клавиатура: «Shift ±10» | частично | стрелки ±1, PageUp/PageDown ±10, Home/End работают; Shift+ArrowRight даёт +1 (проба `› canvas`: 52 → 53). Общий контроллер Shift не знает (`composables/slider/createRangeKeyboardController.ts:26-27`) | S |
| — | Бегунок 16 + кольцо фокуса | частично | бегунок 16 есть (`color-picker/_index.scss:34`), но кольцо стоит на всём поле, а не на бегунке (`Canvas.vue:172-174`) | S |

## inputs/color-picker/edit.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| — | Dropdown формата, поле hex compact с подсказкой, Escape откатывает и снимает ошибку, каналы — группа | сделано | `Edit.vue:6-21,84-86,137-140`; проба: каналы `role=group` | — |
| — | Подписи каналов «R», «G», «B», «A %», «H», «S %», «L %» из пропов (CT-13) | частично | зашиты в `Edit.vue:99-110`. Отступление объяснено только комментарием `ui/color-picker/props.ts:6-7` («нотация, а не фразы»), в `decisions.md` его нет. «A %» и «S %» — уже не чистая нотация | S |

## inputs/color-picker/preview.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| — | `aria-hidden`, кромка hairline, токены, forced colors | сделано | `Preview.vue:3-6,36-39`, `_index.scss:62-69`. Переменная `--m-color-picker-preview` учтена в Ш8 index.md | — |

## inputs/color-picker/swatches.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| — | Listbox на `useListbox`, сравнение по цвету, ключ «индекс + значение», галочка и кольцо, `Highlight` в forced colors | сделано | `Swatches.vue:19,99,187-195`; пробы выше | — |
| — | Образец 32, мишень до 48 расширителем (S8) | нет | образец 32, шаг 40 (проба); на `pointer: coarse` у образца `::after` — `none`, `touch-target` в `Swatches.vue:149-202` не подключён. Совпадает с прошлым аудитом. Полосы hue и alpha — 40, тоже без 48 | S |
| — | Hover: слой и `scale` | частично | при наведении слой `::before` остаётся с opacity 0 — только `scale(1.1)` (`Swatches.vue:206-219`; проба `› hover`). Pressed-слой есть (`:207-209`) | S |

## inputs/color-input.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | Всплывающий диалог вместо `MMenu` | сделано | `ui/color-input/index.vue:76-99` (`Popover trap-focus role=dialog`); проба `› color-input`: dialog с именем, `aria-haspopup=dialog`, `aria-expanded=true`, фокус на «Saturation», `role=menu` нет, после 12 нажатий Tab фокус внутри, Escape возвращает его на «Pick a colour» | M |
| Ш2–Ш4 | `required`, `name`, `density`, атрибуты на input, сообщение формата, `pickerLabel`, RTL | сделано | `color-input/props.ts:10,28-29,44,51`; проба: `required` и `aria-required=true` на input; `placement="bottom-end"` | S |
| Ш5 | Forced colors у образца, токены | частично | forced colors и токены сделаны (`index.vue:316-331`, `assets/.../color-input/_index.scss`); inline `--m-color-input-swatch` (`index.vue:57,71`) нарушает правило CSS-переменных | S |
| Ш6 | Документация | не проверено | вне кита | S |
| Г | Готово (клавиатура, возврат фокуса, required и ошибка) | сделано | проба + `fixtures/color-input/color-input.e2e.ts:31-97` | — |

## inputs/file-input.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | Лейбл над значением при выбранных файлах | сделано | проба `files.probe.ts › file-input`: «report.pdf, photo.pdf», низ лейбла 195 px, верх значения 201 px, наложения нет | S |
| Ш2 | Проброс `mFieldProps`, `density`, атрибутов | сделано | `ui/file-input/index.vue:7-24,155-156` (`inheritAttrs: false` + `useControlAttrs`) | S |
| Ш3 | Ошибка отказа с текстом, все причины | сделано | `index.vue:187-193`; проба: три файла → «notes.txt: not a PDF; big.pdf: larger than 1 KB», `aria-invalid=true`, в модели ok.pdf | S |
| Ш4 | Строки без английских дефолтов | сделано | `file-input/props.ts:45-53`; dev-предупреждения `index.vue:244-253`. Кнопка «Обзор» получает поле не через `aria-labelledby`, а через `aria-describedby` скрытого эха лейбла (`:91-95,236`) | S |
| Ш5 | Токены | сделано | `assets/.../file-input/_index.scss` | S |
| Ш5 | Документация | не проверено | вне кита | S |
| Г | Готово | сделано | пробы выше | — |

## inputs/file-upload/index.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш3 | `autoStart` для начальной модели, disabled/readonly на действиях, имя группы, вложенного поля нет | сделано | `ui/file-upload/index.vue:2-7,283-286`; проба `› file-upload`: начальная модель → Uploading, «Failed · network error», Uploaded; в disabled `Start locked.pdf` и `Remove locked.pdf` выключены | S |
| Ш4–Ш5 | Отказ с причинами под dropzone, постоянный регион; двусторонняя синхронизация | сделано | `index.vue:47-63,193-195,274-280`; проба: `role=alert` есть до отказа, порядок label → picker → dropzone → rejection → list; «notes.txt: type not allowed; big.png: larger than 1 KB»; после внешнего `v-model = []` строк 0. Дефект прошлого аудита закрыт | M |
| Ш6–Ш9 | Причина ошибки, фокус после действий, длинные имена, роли dragging, forced colors | сделано | Ш6 — маппер `messages.error(error)` (`file-upload/props.ts:33`): транспорт знает приложение; Ш7 — после удаления первой строки фокус на «Start a_very_long…»; Ш8 — основа имени обрезана, «.pdf» видно, имя кончается на 392, действия начинаются с 404; Ш9 — `_parts.scss:31-60` | M |
| Ш10 | Тесты | сделано | `ui/file-upload/tests/{variants,interaction,a11y}.spec.ts`, `fragments/file-upload/upload.spec.ts`, e2e | M |
| Ш10 | Документация | не проверено | вне кита | S |
| Г | Готово | сделано | SSR (`› SSR`): group с именем, `ul` «Upload queue», строки Queued (на сервере загрузка не стартует — по плану), alert и status уже в HTML | — |

## inputs/file-upload/dropzone.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| — | Состояния accepting, refusing, disabled; подсказка в `aria-describedby`; forced colors | сделано | проба `› dropzone`: при подходящем типе модификатор `--accepting` и сплошная рамка; при неподходящем — `--refusing` и текст «type not allowed»; disabled — цвет `/ 0.38`; подсказка «PDF or PNG, up to 1 KB» связана с кнопкой. Цвета заливки снимались посреди перехода, поэтому роли `primary-container` / `error-container` сверены по коду (`file-upload/_index.scss:36-47`) | — |

## inputs/file-upload/item.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| — | Значок статуса, многоточие в середине, мета с причиной, `MProgress`, имена кнопок с файлом, фокус после действия | сделано | `fragments/file-upload/Item.vue:7-36,115-150`; пробы выше | — |
| — | BEM: у кнопок действий только модификатор без класса элемента | частично | `Item.vue:42,53,64,74`: `ui-file-upload__action--start` и т. д. без `ui-file-upload__action`. Эти же классы служат JS-хуками фокуса (`:146-148`) | S |

## inputs/file-upload/list.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| — | `ul`/`li` с именем, пустое состояние из `messages`, `TransitionGroup`, длинная очередь прокручивается | сделано | `fragments/file-upload/List.vue:7-37`, `file-upload/_parts.scss:86-90` (`max-height` + `overflow-y`) | — |

## Регрессии
Нет. Все пять дефектов прошлого аудита по пикерам и файлам либо закрыты (подтверждено пробами), либо остались открытыми (образцы без мишени 48, свой период) — ни один не вернулся.

## Планы с неверным статусом (тег → факт, одна строка почему)
- `time-picker.md`: done → частично. Период на своих `<button>` (не S9), у него нет мишени 48 на coarse, disabled — через `opacity`, нет `inheritAttrs: false`.
- `color-picker/index.md`: done → частично. Inline CSS-переменные `--m-color-picker-*` нарушают правило кита.
- `color-picker/canvas.md`: done → частично. Shift ±10 не работает, кольцо фокуса на поле, а не на бегунке.
- `color-picker/edit.md`: done → частично. Буквы каналов зашиты; отступление не записано в `decisions.md`.
- `color-picker/swatches.md`: done → частично. Нет мишени 48 и слоя hover (только `scale`).

## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные
Нет: открытые вопросы всех 13 планов закрыты «Заметками реализации». S2 (циферблат по высоте) владелец явно не отвечал. По брифу я принял рекомендацию «В — не делать», шаг 7 помечен «отменено».

Новые развилки, найденные аудитом (с рекомендацией):
1. **Цвет значения в color-picker / color-input без CSS-переменных.** (1) Inline `background` и `background-image` прямо в `style` — так уже делает холст (`Canvas.vue:9`); шахматку придётся собирать в JS-строке. (2) Записать исключение «динамический цвет значения» в `decisions.md`. Рекомендация: 2 для alpha-полосы и превью (шахматка из миксина `checker`), 1 для образца палитры, где хватает `background-color`.
2. **Disabled у time-picker.** (1) Цветовые роли, как у date-picker (решение G4). (2) Оставить `opacity` и записать, почему у time-picker иначе. Рекомендация: 1.
3. **Буквы каналов color-picker.** (1) Записать в `decisions.md`, что буквы каналов — нотация, а «%» убрать в суффикс поля. (2) Добавить в `messages` ключи `channelR` и т. д. Рекомендация: 1.

## Пункты в занятых родителем файлах
- Shift ±10 у холста color-picker: если делать в общем `composables/slider/createRangeKeyboardController.ts` — `[занят]`. Можно и локально в `Canvas.vue` (`keydownFor`, `:99-105`), тогда файл свободен.
- `MColorInput` стоит на `components/fragments/popover/**` `[занят]`; открытых пунктов по нему нет, проба прошла.
- `MFileInput`, `MColorInput` и поле даты стоят на `components/ui/text-field/index.vue` `[занят]`; открытых пунктов, требующих правки text-field, нет.

## Пробы (файл → тесты → прошло/упало, ключевые измерения)
- `date.probe.ts` → 7 тестов: все прошли (после правок самой пробы: строку дней недели теперь меряю по сетке; ячейку `aria-disabled` кликаю с `force`). Контейнер 360, шапка 120, nav 56, день 40, сетка 336, чип 72 × 36; на coarse `::after` 48 / 48 / 69 × 48; клавиатура: переход месяца, кламп PageUp, Shift+Page, Home/End, RTL; Escape в диалоге → cancel; роли в SSR.
- `time.probe.ts` → 7 тестов, все прошли. Селектор 96 × 80, циферблат 256 (и в окне высотой 420), ручка 48, кольца 101 и 69; PageUp/PageDown ±5 с переходом через ноль; период 52 × 38 без мишени на coarse; disabled — opacity 0.38; складывание при 280 и 360; роли в SSR.
- `color.probe.ts` → 7 тестов: все прошли (тест color-input прошёл после правки локатора: `data-test` поля стоит на input). Образцы в hsl, hsla, hex и rgba ✓; одна точка табуляции; hover без слоя; на coarse у образца и hue мишени нет; Shift на холсте +1; диалог с ловушкой и возвратом фокуса; inline `--m-*`; SSR ✓.
- `files.probe.ts` → 4 теста, все прошли. Пакетный отказ называет все файлы (file-input и file-upload); `autoStart` на начальной модели; disabled; длинное имя; фокус после удаления; внешний сброс; dropzone accepting, refusing, disabled; SSR.

Концепты (`renders/*/concept.webp`) глазами не сверял: геометрию и роли проверил пробами.

## Добавленные фикстуры
Нет: хватило существующих `playground/fixtures/{date-picker,time-picker,color-picker,color-input,file-input,file-upload}/`.
