# Аудит select-files — 2026-10-18

Группа `w4-select-files`: MDropdown, MAutocomplete (общий движок), MSearch, MFileInput, MFileUpload.
Пробы — `playground/probes/w4-select-files/00{1..8}-*.probe.ts`, артефакты —
`test-results/conductor/w4-select-files-00N/`. Новые фикстуры (только кейсы, `src/` не тронут):
`playground/fixtures/{dropdown,autocomplete,file-input,file-upload,search}/cases.vue`.
Замеры в rem (1rem = дизайн-пиксель; при 1280 — 0.667 CSS px). Номера строк — HEAD c9da731 + рабочее
дерево 2026-10-18.

Колонка «Развилка?» — по §5.6 общего брифа. «нет» = дефект, правка по уже принятым правилам; «да → Q-n» =
ждёт решения (у каждой Q есть «(рекомендую)» с основанием).

---

## MDropdown + MAutocomplete (общий движок)

Источники: планы `inputs/dropdown.md` (частично, шаги 3–5 не сделаны), `inputs/autocomplete.md`
(частично); QA FAIL 30/31, MANUAL 15/16; базовая карта (только `@ui-chip press dy 1` — MChip, не наш);
пробы w4-select-files-001, -002, -003, -006, -007, -008; concept `renders/dropdown/concept.webp`.

Сверка с concept (скриншоты -006, light/dark × ltr/rtl): строка = высота поля (44/56/64, зазор 0 —
`densities.json`), выбранная `secondary-container` + галочка в конце, текст строки на линии значения
поля, клавиатурная строка — кольцо inset + 10 %, указатель 8 %, RTL зеркален. Расхождений с принятыми
решениями нет; дефекты — в поведении и раскладке.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| SEL-1 | B | **Enter на кнопке очистки не очищает, а открывает панель** (оба компонента): корень пересылает keydown с любой не-input цели в клавиатуру комбобокса, тот делает `preventDefault` на Enter → активация кнопки отменена. Значение остаётся, фокус уходит в input | -003 `h8-*.json`, -007 `h8-keys-*.json`: dropdown — Enter и Space оставляют `Banana`, `aria-expanded: true`; autocomplete — Enter то же, Space очищает, кнопка исчезает (`v-if`), **фокус на `body`** | `onFieldKeydown` (`dropdown/index.vue:299`, `autocomplete/index.vue:292`) пересылает только с чипов (их клавиатура — `useDropdownChips`), кнопки обрабатывают свои клавиши сами; после очистки фокус в input (как `search/index.vue:115-121`) — одна механика «очистка не роняет фокус» на группу | S | нет |
| SEL-2 | B | Чипы multiple — настоящие tab stop (`<button>` без tabindex), хотя клавиатура чипов уже реализована виртуальным фокусом (`aria-activedescendant`, `useDropdownChips`): две механики, лишние Tab-остановки по числу чипов; Enter на чипе с DOM-фокусом пересылается в комбобокс (класс SEL-1) | -008 `chips-*.json`: Tab из `multiple-filled` → очистка → **чипы Apple, Cherry соседнего `multiple-outlined`** → его input; `chip/index.vue:2-10` (без группы tabindex нет); Enter на чипе с DOM-фокусом по коду идёт в `onKeydown` → `preventDefault` + открытие (как SEL-1) | чипам в поле `tabindex="-1"` (клавиатура — только через ←/→ из input, как сейчас описано в `useDropdownChips`) | S | нет |
| SEL-3 | B | **H-5: стрелки по чипам физические** — в RTL чипы справа от каретки, а ← ведёт в них (вправо), → — обратно (влево): движение «не в ту сторону» | -003 `h5-dropdown-rtl.json`: чипы x 1097/1029, input 664–1024; ← → Cherry(1029) → Apple(1097) | `useDropdownChips.ts:58,70`: «к чипам» = ArrowLeft в ltr / ArrowRight в rtl (направление из `getComputedStyle(input).direction` в момент нажатия) | S | нет |
| SEL-4 | B | **H-3: наведение двигает список.** `onPointermove` на каждое движение → `setActive` → `scrollIntoView({block:'nearest'})` (`useDropdownControl.ts:275`, `useListbox.ts:21-25`); панель нарочно режет строку пополам → наведение на половинную строку прокручивает список под курсором; `behavior.md`: работа на каждое движение указателя — баг | -007 `h3-cut.json`: наведение на половинную «Option 6» → `scrollTop` 0 → 13px (≈19.5rem) — строка уехала из-под курсора; -002: на уже активной строке прокрутки нет | указатель активирует без прокрутки (`setActive(index, { scroll: false })`), прокрутка — только клавиатуре; ранний выход при том же индексе. **`useListbox` использует w5** (`fragments/color-picker/Swatches.vue:53,90`) — сигнатура обратно совместима | S | нет |
| SEL-5 | A/B | **H-2: filled-поле с чипами выше пустого на 9rem при любой плотности** → первый выбранный чип сдвигает всё ниже; outlined не растёт | -001 `h2-compact.json`: compact filled 44 → 53, outlined 44 → 44; default filled корень 91.9 → 100.9 (`h1-*.json`) | по Q-1 | M | да → Q-1 |
| SEL-6 | B | **H-1: multiple «идёт в ширину» при выборе**: ряд чипов `nowrap` даёт полную max-content-ширину → в auto-таблице колонка растёт на 243rem за 3 чипа, соседняя колонка сжимается, открытая панель прыгает/расширяется вместе с полем | -001 `h1-dropdown-ltr.json`: поле 849.7 → 1093.2, соседняя колонка 849.8 → 631.9, `shift ui-menu dw +82.8`; то же autocomplete и rtl. Flex-ряд (-007 `h1-flex-seeded.json`, кейс демо `OrdersFilters`): `flex: 0 1 auto` — 228 → 532px за 4 чипа, сосед уехал на новую строку; `flex: 1 1 280rem` — 241 → 280px (до `max-width`) | вклад ряда чипов во внутреннюю ширину поля обнулить (`width: 0; min-width: 100%` или `contain: inline-size` на ряду — решаю пробой в P2; ряд — `text-field/index.vue:315-342`, файл w3 → заявка или локальное правило на `.ui-dropdown__field`) | S–M | нет |
| SEL-7 | B | **H-10: клик по строке поддержки открывает/закрывает панель**, над ней `cursor: pointer` (обработчик на корне, а корень включает лейбл и support) | -003 `h10-helper.json`: `false → true → false`, `cursor: pointer`; `dropdown/index.vue:10, 291-297, 322` | обработчик и курсор — на коробку поля (`fieldRef.control`), не на корень | S | нет |
| SEL-8 | B | **H-11: ниже `minSearchLength` toggle и ↓ открывают пустую полоску** 16rem (padding 8+8, 0 строк) без `#hint`; с `#hint` — подсказка видна | -003 `h11-min-length.json`: `surfaceHeight 10.66px`, `options 0`; PNG `h11-matrix-toggle.png` | по Q-4 | S | да → Q-4 |
| SEL-9 | B | **H-12: после выбора повторное открытие показывает 1 строку, до выбора — 6** при одинаковом тексте в поле: `onSelect`/`restore` пишут заголовок в `search`, фильтр читает `search` (`useAutocomplete.ts:95-107, 123, 139-141, 199`); начальное значение — только черновик (`:155`). Заодно решение «начальное значение без события search» держится только до первого blur: `restore()` пишет `update:search` | -003 `h12-h13.json`: `enabledFirstOpen 6 → enabledReopen 1`; `selectedFirstOpen 6 → selectedAfterBlur 1` | по Q-5 | S | да → Q-5 |
| SEL-10 | B | **H-13: клик по уже сфокусированному autocomplete (после Esc) не открывает панель**; dropdown в том же сценарии открывает. Открытие только из `watch(focused)` (`useAutocomplete.ts:189-196`) | -003 `h12-h13.json`: `clickOnFocused: false`, `dropdownClickOnFocused: true` | нажатие указателем на input открывает при `openOnFocus !== false` (то же «нажатие на поле», что решение Q4 → 2), без второго пути через focus | S | нет |
| SEL-11 | B/A | **H-9: read-only — мёртвые контролы в двух разных видах.** Dropdown: очистка и чипы с × в полной краске, клик ничего не делает (`selection` заблокирован); autocomplete: очистка и toggle — disabled 38 %, **чипы 38 %** (значение read-only поля читается хуже, чем у enabled) | -003 `h9-dropdown.json` (`disabled:false`, `rgb(71,71,71)`, значение после клика то же), `h9-autocomplete.json` (`disabled:true`, 38 %, чипы `ui-chip--disabled`); PNG `h9-*-multiple.png`; `dropdown/index.vue:60,89`, `autocomplete/index.vue:57,86,102` | по Q-2 | S | да → Q-2 |
| SEL-12 | A (a11y) | **IN-09: input dropdown всегда нативно `readonly`** (механика селекта) → скринридер объявляет рабочий селект «только чтение»; проп `readonly` программно и визуально неотличим | `dropdown/index.vue:34`; QA IN-09 P1 (Q15 фазы D не отвечен) | по Q-3 | M | да → Q-3 |
| SEL-13 | B/A | **H-7: две механики индикатора.** Dropdown поворачивает `arrow_drop_down` на 180° за short-3, autocomplete мгновенно меняет глиф `arrowDropUp`/`Down`; `180deg` — литерал вне карты | -003 `h7-indicator.json` (`matrix(-1,0,0,-1)`, `0.15s`), `autocomplete/index.vue:106`, `dropdown/index.vue:342` | одна механика — поворот одного глифа (Compose `TrailingIcon` = `rotate(180)`); toggle autocomplete рисует тот же `arrowDropDown` и поворачивается по `--open`; угол — в карту (`arrow.open.rotate`). RTL не влияет (вертикальный поворот) | S | нет |
| SEL-14 | A/D | **Подменённый фон вместо слоя** (`craft.md` «The background swap»): `_panel.scss:133-162` гасит `::before` строки и красит готовыми смесями `option.{hover,keyboard}.{bg,selected-bg}`; 4 токена — тихие `map.get(item.$tokens, …)` / `map.get(menu.$tokens, …)` (`dropdown/_index.scss:16-20, 49`) — вернут `null` молча при переименовании у w2 | код | слой строки (`::before` в `currentcolor`) по модификаторам `--active` (hover 8) / `--keyboard` (focus 10); `:hover` строки не рисует второй раз (специфичность выше `.ui-list-item--interactive:hover::before`); чтения чужих карт — через `g()` | S–M | нет |
| SEL-15 | D | **Копипаста dropdown ↔ autocomplete**: чипы (`dropdown:44-79`/`autocomplete:41-76`), очистка, шаблон панели (`:113-195`/`:120-236`), live-регион, `keyboardCursor` + `optionClasses`, `watch(open)` с фокусом, `useField` + `isError`, `fieldControl`; CSS панели эмитится дважды (миксин `selection-panel` с префиксом компонента) — ~1.9 KB / 0.55 KB gzip второй копии | `index.0eG7uJ3c.css`, `index.BlkSuCUZ.css` (prod) | приватные `fragments/dropdown/{Panel,Chips}.vue` + общий композабл обвязки поля; CSS панели — один блок (классы — Q-6) | M | да → Q-6 (классы) |
| SEL-16 | C | Нет `defineSlots` у dropdown и autocomplete → пропсы слотов `item`, `chip`, `selection`, `default`, `no-results`, `hint` — `any` у потребителя (демо `#item="{ title, value }"`) | `dropdown/index.vue`, `autocomplete/index.vue` (нет `defineSlots`) | `defineSlots` с типами слотов в `props.ts`/`types.ts` | S | нет |
| SEL-17 | C | Generic `TItem` не выводится из `items`: runtime-пропы (`items: readonly DropdownItemBase[]`) → `select(item)` и слоты получают `DropdownItemBase`; ручной `MDropdownProps<TItem,TValue>` (`props.ts:85-97`) лежит рядом и в SFC не участвует | `dropdown/props.ts`, `index.vue:205` | type-based `defineProps<…>()` + `withDefaults` (прецедент MTable `table/index.vue:166`); дефолты переезжают из runtime-объекта (один дом сохраняется). Риск: компилятор SFC должен разрешить импортированные типы — проверю `typecheck` + `lint:scss` | M | нет |
| SEL-18 | B | `keyboardCursor` включается любым keydown в capture, включая Shift/Ctrl → строка под указателем внезапно получает кольцо «клавиатуры» | `dropdown/index.vue:11`, `autocomplete/index.vue:6` | считать клавиатурой только клавиши навигации/ввода (не модификаторы) | S | нет |
| SEL-19 | D | Типы держатся на глобальных авто-типах Nuxt: `DropdownResolvedItem` в `useDropdownControl.ts:192` без импорта; `DropdownControlConfig` импортирован и не используется (`:27`); `useListbox`, `useDropdownSelection` без явного типа возврата (`behavior.md`: TS7056 у mkdist) | код; `playground/.nuxt/types/imports.d.ts` | явные импорты и `Use…Return` | S | нет |
| SEL-20 | D | Внутренности движка утекают в автоимпорт приложения: `useDropdownChips`, `useDropdownEntries`, `useDropdownKeyboard`, `useDropdownSelection` + `compareByIdentity`, `usePanelStatus`, `useTypeahead` + `isPrintableKey`, `useListbox` | `playground/.nuxt/imports.d.ts` | по Q-10 | S | да → Q-10 |
| SEL-21 | D | Мёртвое в API: модификатор `ui-dropdown--multiple` (нет CSS), `ui-autocomplete--multiple`, `ui-autocomplete--open` (только спеки); проп `autocomplete` у MDropdown объявлен (`mFieldProps`) и никуда не идёт | `dropdown/index.vue:7`, `autocomplete/index.vue:5`, `text-field/props.ts` | по Q-9 (`--open` у autocomplete получает CSS в SEL-13 и остаётся) | S | да → Q-9 |
| SEL-22 | A | Английские дефолты: `MESSAGES.dropdownClear/Toggle/Loading/Empty/NoResults` в 11 местах без пропов (CT-13); шапка `messages.ts` неверна («every one of these is also a prop») | `grep MESSAGES.dropdown`: dropdown 4, autocomplete 7 | по Q-7 | M | да → Q-7 |
| SEL-23 | B | Ошибка загрузки списка неотличима от «нет опций» (ST-01/DT-04 P1, Q16 фазы D не отвечен) | QA | по Q-11 | S | да → Q-11 |
| SEL-24 | B | Dropdown в `loading` без строк: прогресс над пустой полосой 16rem, текста нет (`v-if="!loading && …"`, `dropdown/index.vue:186`); у autocomplete — `#loading` с текстом. Два поведения одного состояния в семье | код | тот же блок состояния и слот `#loading`, что у autocomplete (общий Panel из SEL-15) — новый слот, поэтому внутри Q-7 | S | да → Q-7 |
| SEL-25 | B | **H-6: галочка меняет высоту строки в multiple** — `#trailing` монтируется только у выбранной, ширина текста падает на 36rem → заголовок у края переноса уходит на строку ниже, нижние строки и высота панели прыгают за кадр | -007 `h6-edge.json`: «…dock behind» 37.3 → 41.3px, «…warehouse gate» 41.3 → 55.3px; `jump listbox height 5.94rem`; `dropdown/index.vue:159`, `autocomplete/index.vue:168` | в `multiple` место галочки зарезервировано на каждой строке (невидимый слот той же ширины); вид по решению Q2 → 1 не меняется (текст на 16, галочка только у выбранной); в single панель закрывается при выборе — не нужно | S | нет |

Минимизация: выходной CSS (база `baseline/css-sizes.json`) dropdown **2449 B / 754 gz**, autocomplete
**2247 / 658** (вместе 4696 / 1412). Станет ≈ **2.7 KB / ~0.9 KB gz** (−40 %): одна копия CSS панели
(SEL-15, −1.9 KB), слой вместо 4 готовых смесей (SEL-14, −0.45 KB, +2 правила opacity), угол поворота
из карты (0). `src`: `dropdown/index.vue` 347 + `autocomplete/index.vue` 365 = 712 → ~500 (+ фрагменты
Panel ~120, Chips ~50). Не трогаем: `@each` плотностей панели (решение zero-runtime).

---

## MSearch

Источники: план `inputs/search.md` (done, без шага 3); QA FAIL 16 / MANUAL 16; базовая карта — ничего не
сдвинулось; пробы -005, -007; concept `renders/search/concept.webp` — совпадает (56, full,
`surface-container-high`, кольцо фокуса `secondary`, слой hover 8 %, иконки 24 в 48).

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| SR-1 | C | **`id` потребителя перетирается**: `:id="fieldId"` стоит после `v-bind="controlAttrs()"`; `fieldId` больше нигде не нужен → `<label for>` потребителя не связан | -005 `search-id-escape.json`: `id: "v-0"`, `labelTarget: false`; `search/index.vue:21-22, 94` | удалить `:id`/`fieldId` | S | нет |
| SR-2 | A | **H-22: в forced colors кольцо фокуса 1px вместо 2** — `outline: 1px solid CanvasText` того же веса стоит позже `&--focused { focus-ring }` | -005 `h22-forced.json`: `none 2px`, `active 1px`; `search/index.vue:164-166, 244-254` | в forced-colors менять только `outline-color`/ширину покоя без шортката для `--focused` | S | нет |
| SR-3 | B | **H-23: Enter во время IME отправляет `submit`** (`@keydown.enter` без `isComposing`; autocomplete учитывает, `useAutocomplete.ts:178-184`) | -007 `search-ime.json`: `keydown Enter` с `isComposing: true` → `submitted: "material design"`; `search/index.vue:32` | проверка `event.isComposing` | S | нет |
| SR-4 | B | **H-24: Escape** — своего обработчика нет: Chromium очищает `type=search` сам и **не испускает `clear`**, Firefox не очищает (QA A11-08) | -005 `search-id-escape.json`: `value ""`, `clears 0` | по Q-12 | S | да → Q-12 |
| SR-5 | D | Мёртвое: проп `loading` (`makeStateProps`) без эффекта; модификатор `ui-search--empty` без CSS (только спека) | `search/props.ts:15`, `index.vue:7` | по Q-9 | S | да → Q-9 |
| SR-6 | A | FM-09: нет `:autofill` — подсветка автозаполнения ломает фон бара (у `MTextField` решено `background-clip: text`) | QA FM-09; `text-field/index.vue` (`&:autofill`) | тот же приём на `&__input` | S | нет |

Минимизация: **2582 / 793** → ≈ 2.6 KB (+~40 B на SR-2/SR-6, −мёртвый модификатор — 0 в CSS). Резерв
для сокращения мал: `--disabled` перекрашивает 4 части по отдельности (можно `inherit`, −~150 B) —
не беру без нужды. `src` 256 → ~250.

---

## MFileInput

Источники: план `inputs/file-input.md` (done); QA FAIL 12 / MANUAL 19; базовая карта — ничего не
сдвинулось; пробы -004, -006, -007; concept общий с file-upload.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| FI-1 | B | **F-1: тело поля — мёртвая tab-остановка**: readonly-input в таб-порядке, клик/Enter/Space по нему пикер не открывают, открывает только Browse | -007 `f1-picker.json`: клик по тексту / Enter / Space на input — `filechooser` нет, Browse — есть; в read-only input `tabIndex 0` при двух disabled-кнопках; `file-input/index.vue:6-24` | по Q-13 | S | да → Q-13 |
| FI-2 | B | **F-2: `required` + файл из модели → форма не отправляется**: нативный `<input type=file required>` не знает о файле, пришедшем программно (`valueMissing: true`), браузер фокусирует sr-only-инпут, пузырь ошибки висит в невидимой точке; FormData не отправит файл модели | -004 `f2-form.json`: `given: valueMissing true, files 0`, `submits 0`, `activeElement ui-file-input__native`; `index.vue:108-121` | по Q-14 | M | да → Q-14 |
| FI-3 | A | CT-02: сводка обрезается без многоточия («report.pdf, photo.\|»), «+N» включается только после 3 имён — 2 длинных имени обрезаются молча | -006 `file-input-matrix-light.png` (`many-*`) | многоточие у не сфокусированного input поля (`text-overflow: ellipsis`) — правило в `MTextField` (файл w3 → заявка); то же лечит длинный заголовок в MDropdown | S | нет |
| FI-4 | A | Read-only: Browse и Clear — disabled 38 % (класс SEL-11) | -006 `file-input-matrix-light.png`; `index.vue:198` | по Q-2 | S | да → Q-2 |
| FI-5 | D | `margin-top` физический (`index.vue:290`) | код | `margin-block-start` | S | нет |
| FI-6 | D | Мёртвые пропы `loading`, `autocomplete` (из `mFieldProps`) | `file-input/props.ts:23` (`...mFieldProps`) | по Q-9 | S | да → Q-9 |
| FI-7 | A | `showSize` — `formatFileSize` с английскими `B/KB/MB` и точкой (файл оркестратора) | `shared/utils/file/index.ts:52-57` | по Q-8 | S | да → Q-8 |

Минимизация: блок `file-input` (4 правила) лежит в чанке file-upload (`index.D3eVOOdq.css`); своего файла
нет — изменение ≈ 0. `src` 300 → ~300.

---

## MFileUpload

Источники: планы `inputs/file-upload/{index,dropzone,item,list}.md` (done); QA FAIL 12 / MANUAL 16;
базовая карта — сдвиг `item-content @auto` на загрузке (t 521 мс — та же гидрация и авто-старт, FU-1/FU-2); пробы -004, -006,
-007; concept `renders/file-upload/concept.webp`.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| FU-1 | B | **Гидрация ломается на каждой строке очереди** у любого MFileUpload с файлами: `<slot v-for>` внутри `TransitionGroup` → сервер отдаёт фрагмент, клиент ждёт `li` → «Hydration completed but contains mismatches» | -004 `h20-ssr.json` (`Hydration node mismatch … expected on client: li` на `upload-0…2` у всех трёх кейсов) | без фрагмента: `FileUploadItem v-for` напрямую, а `#item` — внутри ключевого `li` (или `v-for` на `template` с ключом на корне) | S | нет |
| FU-2 | B | **H-20: `upload()` выполняется на сервере**: `watch(model, …, { immediate: true })` + `autoStart` стартует очередь в SSR — серверный HTML уже содержит 3 строки `uploading`, клиент запускает загрузку ещё раз | -004 `h20-ssr.json`: `server.uploading 3`; `index.vue:248-254` | очередь стартует только на клиенте (после гидрации); на сервере строки `queued` | S | нет |
| FU-3 | B | **H-15: удалённая строка 280 мс держит место, потом всё ниже прыгает на 72rem за кадр** (только `opacity`, нет `leave-active { position: absolute }` и `-move`) | -004 `h15-h16.json`: `shift dy -72 @t 281`, `nextY` 321.6 → 274 за кадр | FLIP через `TransitionGroup` move (transform) + уходящая строка вне потока; тайминги из карты | S | нет |
| FU-4 | B | **H-16: последняя строка исчезает без фейда**, `#empty` встаёт сразу, всё ниже прыгает на 100rem (`v-if` на самом `TransitionGroup`) | -004 `h15-h16.json`: `shift dy -100 @t 43`; `List.vue:2-3` | список смонтирован всегда, пустое состояние — после ухода последней строки | S | нет |
| FU-5 | B | **H-17: прогресс добавляет строке 4rem** на время загрузки (`MProgressLinear v-if`) → строки ниже прыгают дважды за загрузку | -004 `h17-h18.json`: `uploading 45.33px` против `42.67px`; PNG `h17-auto.png`; `Item.vue:27-32` | полоса — поверх нижнего отступа строки (вне потока, как прогресс панели dropdown), высота строки постоянна | S | нет |
| FU-6 | B | **H-18: «Start uploads» исчезает по окончании** → всё ниже прыгает на 56rem; кнопка растянута на всю ширину колонки (flex-column stretch) | -004 `h17-h18.json`: `shift dy -55.96`; PNG `file-upload-enabled-light.png`, `-matrix-360.png`; `index.vue:98-105` | по Q-15 | S | да → Q-15 |
| FU-7 | B | **H-21: ремаунт перезапускает загрузку** — статус живёт только в компоненте, модель = `File[]`; при повторном монтировании (вкладка, sheet) `autoStart` грузит файлы модели заново (дашборд CRM `CrmDealFiles`) | `index.vue:248-254`, `integration-and-dashboards_2026-10-08.md` | по Q-16 | M | да → Q-16 |
| FU-8 | B | **F-2: `required` у скрытого пикера** внутри `<div hidden>` → форма с файлами из модели/drop молча не отправляется: «An invalid form control with name='' is not focusable» | -004 `f2-form.json`: `hiddenAncestor true`, `valueMissing true`, `submits 0` + ошибка консоли | по Q-14 | M | да → Q-14 |
| FU-9 | D | **F-4: скрытый `MFileInput` как пикер**: рендерит невидимые MTextField + 2 кнопки, печатает на каждый MFileUpload 3 dev-предупреждения (`no browse-label`, clear без имени, `m-button-icon` без имени), политика файлов считается дважды с разной семантикой `maxFiles` (пикер — на выбор, компонент — на остаток) | -004 `h20-ssr.json`, `f2-form.json` (console); `index.vue:25-38, 146-150, 205-209` | по Q-17 | S | да → Q-17 |
| FU-10 | B | Удаление строки в `queued` идёт через `cancel`: испускается `cancel` и объявляется «… · Cancelled» | -007 `remove-queued.json`: статус-регион `"contract.pdf · Cancelled"`; `useFileUploadQueue.ts:147-151 → 123-135` | по Q-18 | S | да → Q-18 |
| FU-11 | A | **H-25: «accepting» — только цветом** (фон, цвет рамки и текста); иконка, текст и стиль рамки как в покое; у «refusing» есть иконка и текст | -004 `h19-h25.json`: `accepting` тот же текст/иконка/`dashed`; PNG `h19-enabled-accepting.png` | по Q-19 | S | да → Q-19 |
| FU-12 | A | В accepting подпись outlined-кнопки «Choose files» остаётся своего цвета на `primary-container` — на скриншоте почти не читается | PNG `h19-enabled-accepting.png` | кнопка в зоне берёт краску зоны (`currentcolor`) на время перетаскивания | S | нет |
| FU-13 | A | Рамка dropzone `1rem`, не hairline `max(1px, 1rem)` (решение 2026-10-08, TK-02) | `file-upload/_index.scss:28` | `max(1px, 1rem)` в карте | S | нет |
| FU-14 | B | `dragover.prevent` всегда → над disabled/readonly зоной курсор «копировать», drop принимается браузером (компонент его игнорирует) | `Dropzone.vue:9-13, 96, 110` | в неактивной зоне `dropEffect = 'none'` | S | нет |
| FU-15 | D | `@include use-scrollbar` у списка дублирует глобальное правило `*` (`base/_scrollbar.scss:12`) — ~0.76 KB мёртвого CSS | `index.D3eVOOdq.css` | удалить | S | нет |
| FU-16 | D | Переходы строк — литеральные `var(--sys-motion-*)` вне карты, правила верхнего уровня в `_parts.scss:249-257` | код | из `g($t, 'motion…')` | S | нет |
| FU-17 | D | Мёртвое: `messages = computed(() => props.messages)` (`index.vue:144`), параметр `_source` (`:205`), проп `loading` без эффекта | код | первые два — удалить; `loading` — Q-9 | S | нет / Q-9 |
| FU-18 | C | Нет `defineSlots` → слоты `item { entry, start, cancel, retry, remove }`, `dropzone`, `list`, `rejection`, `actions` без типов | `index.vue` | `defineSlots` | S | нет |
| FU-19 | A | Размеры файлов — английские `B/KB/MB` (`formatFileSize`) | `Item.vue:125` | по Q-8 | S | да → Q-8 |

Минимизация: чанк `index.D3eVOOdq.css` **6299 / 1212** (file-upload 40 правил + file-input 4). Станет ≈
**5.7 KB / ~1.1 KB gz**: −0.76 KB `use-scrollbar` (FU-15), +~0.2 KB на FLIP/leave (FU-3/4) и полосу
прогресса вне потока (FU-5). `src`: `index.vue` 311 → ~300; при Q-17 → 1 вариант −20 строк и −1
компонент в дереве.

---

## Развилки для владельца

Основание рекомендаций — в скобках после неё. Ответ свободным текстом важнее номера.

**Q-1 (dropdown/autocomplete, SEL-5). Filled-поле с чипами на 9rem выше пустого: первый чип сдвигает форму.**
1. Резервировать: filled + `multiple` с первого кадра той высоты, что с чипами (место под чипы есть
   всегда, выбор ничего не двигает). Цена: пустое multiple-filled поле на 9rem выше соседнего одиночного. **(рекомендую)**
   *(правило «раскладка не едет от состояния» и SSR — высота известна серверу; ничего не анимируем)*
2. Чипы внутри filled-поля ниже (≈24 вместо 32), чтобы влезть под лейбл. Цена: в compact (44) не влезают
   всё равно; чип в поле другого размера, чем MChip.
3. Как сейчас. Цена: прыжок формы на 9rem при первом выборе.
(Реализация 1 — переменная высоты поля из карты dropdown или проп у MTextField; во втором случае —
заявка w3.)

**Q-2 (dropdown, autocomplete, file-input, SEL-11/FI-4). Что показывают действия, меняющие значение, в read-only поле.**
1. Как у MFileUpload (решено 2026-10-08: зона не гаснет, кнопки disabled): очистка/Browse/toggle —
   disabled 38 %, **чипы — полная краска без ×** (значение читается). Dropdown приводится к этому.
   **(рекомендую)** *(прецедент решения по MFileUpload; раскладка read-only = enabled, переключение
   readonly ничего не сдвигает)*
2. Не рендерить действия вовсе (чистый вид «только чтение»). Цена: ширина значения меняется при
   переключении readonly; расходится с MFileUpload.
3. Как сейчас (dropdown — живые на вид, но мёртвые; autocomplete — чипы 38 %).

**Q-3 (dropdown, SEL-12 = Q15 фазы D). Рабочий dropdown объявляется скринридером «только чтение».**
1. Снять нативный `readonly` с input механики: ввод гасить `beforeinput`, `inputmode="none"`, каретку —
   `caret-color: transparent`; страховка — откат значения на `input` (IME-композиция не отменяема);
   проп `readonly` → нативный `readonly` + `aria-readonly`. **(рекомендую)** *(APG select-only: комбобокс не
   «read only»; a11y P1 важнее риска, страховка его закрывает; проверка — e2e на Chromium)*
2. Оставить и записать отклонение в `decisions.md`. Цена: каждый dropdown неверно объявляется.
3. Переделать на `div role=combobox tabindex=0` (APG). Цена: L, уходим от `MTextField`.

**Q-4 (autocomplete, SEL-8). Toggle и ↓ ниже `minSearchLength` без `#hint` открывают пустую полоску.**
1. Не открывать, пока нечего показать (нет строк, нет `#hint`, нет загрузки); toggle и ↓ в этом случае
   ничего не делают, `aria-expanded` остаётся `false`. **(рекомендую)** *(пустая поверхность ничего не сообщает; так же
   уже работает ввод — `autocomplete.e2e.ts:169-179`)*
2. Открывать и показывать полный список, игнорируя порог. Цена: ломает смысл `minSearchLength` (большие
   справочники).
3. Как сейчас.

**Q-5 (autocomplete, SEL-9). Что показывает повторное открытие, когда в поле стоит выбранное значение.**
1. Полный список с отмеченным выбранным, пока пользователь не начал печатать (запрос = «напечатанное
   после последнего выбора»); `search` не пишется заголовком при выборе/blur. **(рекомендую)** *(так у MUI/Vuetify;
   совпадает с dropdown «открывается на текущем значении»; заодно держится решение Q1 «значение — не запрос»)*
2. Всегда фильтровать по тексту поля (как пример APG): первое открытие тоже даст 1 строку. Цена: чтобы
   сменить выбор, надо стереть текст.
3. Как сейчас (6 строк до первого blur, потом 1).

**Q-6 (dropdown/autocomplete, SEL-15). Классы панели при выносе её в общий фрагмент.**
1. Один приватный блок панели (`ui-dropdown-panel__list/option/state/progress`) в обоих компонентах;
   `ui-autocomplete__option` и т. п. исчезают. Ломающее для тех, кто стилизовал эти классы. **(рекомендую)**
   *(CSS панели эмитится один раз, −1.9 KB; публичный контракт стилизации — токены, а не BEM внутренностей)*
2. Фрагмент общий, но префикс класса — от компонента (как сейчас). Цена: CSS по-прежнему дважды.
3. Не выносить.

**Q-7 (dropdown/autocomplete, SEL-22 = Q13 фазы D). Английские фразы по умолчанию.**
1. Проп `messages` без дефолтов, как у MFileUpload в этой же группе: `{ clear, toggle, loading, empty,
   noResults }`; слоты `#empty` / `#no-results` / `#loading` остаются и важнее фразы (dropdown получает
   `#loading`, как у autocomplete, — SEL-24); кнопка без имени —
   dev-warn (прецедент MLoading / MOtpInput / MSearch); без фразы и слота состояние пустое, live-регион
   молчит; ключи `MESSAGES.dropdown*` удаляются (через оркестратора). Ломающее: без `messages` —
   dev-warn вместо английского. **(рекомендую)** *(`decisions.md` по MLoading, `craft.md` §6 «kit ships
   no copy it cannot translate»; одна форма фраз на всю группу)*
2. Отдельные пропы без дефолтов (`clearLabel`, `toggleLabel`, `loadingLabel`, …). Цена: пять пропов
   против одного объекта; расходится с MFileUpload.
3. Пропы с дефолтом из `MESSAGES`. Цена: английский остаётся по умолчанию.
4. Фразы через конфиг `materialKit`. **СТОП** — новый системный механизм (§8.5), только владельцу.

**Q-8 (file-input/file-upload, FI-7/FU-19; `shared/utils/file`, файл оркестратора). Единицы размера файла.**
1. Форматер — опция: `formatSize` в `MFileUploadMessages` и проп у MFileInput; по умолчанию — текущие
   символы `B/KB/MB/GB` (символы единиц, не слова). **(рекомендую)** *(перевод без нового механизма;
   `Intl.NumberFormat` без локали разошёлся бы между сервером и клиентом)*
2. `Intl.NumberFormat(…, { style: 'unit' })` с локалью `<html lang>`. Цена: риск расхождения SSR/клиент.
3. Как сейчас.

**Q-9 (вся группа, SEL-21/SR-5/FI-6/FU-17). Удалить мёртвое API.** Модификаторы `ui-dropdown--multiple`,
`ui-autocomplete--multiple`, `ui-search--empty`; пропы без эффекта `loading` (MSearch, MFileInput,
MFileUpload), `autocomplete` (MDropdown, MFileInput).
1. Удалить сразу (решение 2026-10-18 «старое удаляется сразу»); переданный `autocomplete` у
   MDropdown/MFileInput упадёт атрибутом на input (безвредно). **(рекомендую)** *(проп без эффекта —
   ловушка в таблице API, `craft.md` §2)*
2. Оставить. (Если Q-1 → 1, `ui-dropdown--multiple` получает CSS и остаётся.)

**Q-10 (dropdown/autocomplete/file-upload, SEL-20 = F-3). Внутренности в автоимпорте приложения.**
1. Перенести в `utils/dropdown/` (вне автоимпорта): `useDropdownChips`, `useDropdownEntries`,
   `useDropdownKeyboard`, `useDropdownSelection` + `compareByIdentity`, `usePanelStatus`,
   `provide/useFileUploadContext`. Публичными остаются `useDropdownControl`, `useAutocomplete`,
   `useFileUploadQueue`, `useTypeahead` (назван в `behavior.md`), `useListbox` (берёт w5). **(рекомендую)**
   *(«интернал должен остаться internal»; escape hatch — `useDropdownControl` + контекст)*
2. Оставить. Цена: 10 имён в автоимпорте приложения без документации.

**Q-11 (dropdown/autocomplete, SEL-23 = Q16 фазы D). Ошибка загрузки списка.**
1. Без нового API: рецепт — приложение рисует ошибку и «Повторить» в `#empty` / `#no-results` (они
   реактивны и уже без английского при Q-7 → 1). **(рекомендую)** *(вариант без заказчика не вводим,
   `principles.md` В4; escape hatch уже есть)*
2. `loadError` + `#error` + событие `retry`. Цена: M, новое API и новые фразы.

**Q-12 (search, SR-4). Escape в строке поиска.**
1. Свой обработчик: есть запрос → очистить, испустить `clear`, `preventDefault`; пусто → Esc идёт
   дальше (закрыть диалог/шторку). Одинаково во всех браузерах. **(рекомендую)** *(Chromium уже чистит, но без
   события; Firefox — нет; потребитель получает одно поведение и событие)*
2. Ничего не делать (оставить браузеру). Цена: разное поведение, `clear` не приходит.

**Q-13 (file-input, FI-1 = F-1). Клик / Enter / Space по телу поля.**
1. Открывают пикер (input поля — клавиатурный путь, Browse остаётся видимой кнопкой). **(рекомендую)**
   *(так у Vuetify `v-file-input` и у нативного `input type=file`; убирает мёртвую tab-остановку)*
2. Открывают, а Browse уходит из таб-порядка (`tabindex=-1`, как toggle autocomplete). Цена: двойной
   путь исчезает, но меняется Tab-порядок.
3. Как сейчас.

**Q-14 (file-input, file-upload; FI-2/FU-8 = F-2). `required` и форма, когда файлы пришли из модели или drop.**
1. Держать нативный `input type=file` в синхроне с моделью (`DataTransfer` → `input.files`): `required`
   честный, FormData отправляет файлы модели; у MFileUpload пикер выходит из `hidden` в sr-only (тогда
   браузер может сфокусировать его при ошибке). **(рекомендую)** *(`behavior.md`: «нативный элемент делает
   работу»; сейчас форма блокируется молча)*
2. Снять нативный `required`, обязательность — только `aria-required` + валидация через `useField`.
   Цена: нативная форма никогда не проверяет файл; FormData по-прежнему без файлов модели.
3. Как сейчас.

**Q-15 (file-upload, FU-6 = H-18). Кнопка «Start uploads», когда стартовать нечего.**
1. Остаётся, пока в очереди есть строки, — disabled, когда нечего стартовать; ширина — по содержимому
   (`align-self: start`). **(рекомендую)** *(раскладка не едет от окончания загрузки; кнопка M3 обнимает подпись)*
2. Место резервируется (`visibility: hidden`, как очистка MSearch). Цена: пустая дыра 40rem внизу.
3. Как сейчас (исчезает, всё ниже прыгает на 56rem).

**Q-16 (file-upload, FU-7 = H-20/H-21). Где живёт статус загрузки, чтобы ремаунт не грузил заново.**
1. Необязательный проп `queue` — экземпляр `useFileUploadQueue`, созданный приложением (живёт дольше
   компонента); без него — как сейчас. **(рекомендую)** *(escape hatch без смены модели; демо CRM переводится на него)*
2. Модель статусов (`v-model:entries`). Цена: второй v-model, синхронизация двух списков.
3. `autoStart` только для файлов, добавленных после монтирования. Цена: противоречит решению
   «autoStart и для начальной модели» (2026-10-08).

**Q-17 (file-upload, FU-9 = F-4). Пикер внутри MFileUpload.**
1. Голый `<input type=file>` (sr-only) + общая `createFilePolicy` один раз; решение «внутри один
   MFileInput» пересматривается. **(рекомендую)** *(новые факты: 3 dev-warn на экземпляр, двойная политика с
   разной семантикой `maxFiles`, невидимое поле в DOM; Q-14 → 1 проще на голом input)*
2. Оставить MFileInput, передать ему `browse-label`/`clear-label`/`clearable=false`, чтобы замолчал.
   Цена: двойная политика остаётся.

**Q-18 (file-upload, FU-10). Удаление ещё не начатой строки.**
1. `remove` для `queued`/`error`/`cancelled` — без `cancel`: событие только `remove`, объявление
   «… · Удалён» не нужно (строка ушла, фокус уходит на соседа). `cancel` — только для `uploading`.
   **(рекомендую)** *(отмена — это остановка загрузки; удаление незапущенного файла её не делает)*
2. Как сейчас (`cancel` + «Cancelled»).

**Q-19 (file-upload, FU-11 = H-25, авторский вид). Перетаскивание подходящего — не только цветом.**
1. Рамка в accepting становится сплошной (как уже в forced colors). **(рекомендую)** *(правило 13 «не только
   цветом»; приём уже есть в компоненте, нового элемента нет)*
2. Сменить иконку/текст на «Отпустите» — нужна новая фраза в `messages`.
3. Как сейчас (фон + цвет).

## Существующие шимы «снято, работает ещё релиз» (без развилки — удаляются)

- `rounded` → `shape`: `useFieldShape(component, props)` (`text-field/useFieldShape.ts:22`, владелец w3)
  вызывают MDropdown (`dropdown/index.vue`, `useFieldShape('m-dropdown')`), MAutocomplete
  (`'m-autocomplete'`), MFileInput (`'m-file-input'`); проп `rounded` приходит из `mFieldProps`.
  Мои вызовы меняю, когда w3 снимет `rounded` (`props.shape` напрямую).
- Своих `useRetired*` в группе нет.

## Предложения сверх паритета (не шаги)

| Предложение | Выигрыш | Заказчик | Цена S/M/L | Рекомендация |
|---|---|---|---|---|
| `focus()` в `expose` у MDropdown, MAutocomplete, MSearch, MFileInput | горячая клавиша `/` без `[data-crm-search]` (демо `CrmAppBar.vue`) | демо CRM | S | взять |
| Слоты `#check`, `#arrow` (dropdown/autocomplete), `#clear-icon` | замена глифов без замены всей панели | нет | S | отложить |
| `#dropzone` рендерится **внутри** зоны со слот-пропами `{ isDragging, canDrop, openPicker }`; `openPicker`/`addFiles` в `expose` | своё содержимое зоны без потери drag-n-drop | нет | S (ломает текущий `#dropzone`) | взять вместе с Q-17 |
| «+N» вместо прокрутки ряда чипов (план dropdown) | ряд не уезжает при открытии | фильтры дашбордов | M | взять после Q-1 |
| `itemSubtitle` / `itemIcon` резолверы (план dropdown) | «Москва · Россия» без `#item` | демо заказа (`#item` с email/ценой) | S | взять |
| Подсветка совпадения в autocomplete | заметность найденного | нет | S | отложить |
| MFileUpload: вставка из буфера, «повторить все неудачные», сводка очереди | очереди 10+ файлов | нет | M | отложить |
| Не блокировать прокрутку страницы при открытой панели dropdown (`lockScroll` MMenu) | страница листается колесом мимо панели | нет | S (MMenu) | обсудить с владельцем меню |

## Заявки на чужие файлы

- **w3 (`text-field/index.vue`)**: (1) корень «чипы не появляются в пустом multiple / не исчезают» —
  `hasPrepend/hasAppend/hasRow` по нереактивному `useSlots()` (`:168-170`) — оркестратор уже передал;
  у меня — регрессионный e2e dropdown/autocomplete (пустой multiple → выбор → чип виден; 2 чипа → 0 →
  ряд исчез). (2) многоточие у не сфокусированного input (FI-3, длинный заголовок dropdown). (3) ряд
  `__field` не должен расширять поле по ширине чипов (SEL-6) — правило на ряду или разрешение сделать
  это со стороны dropdown. (4) высота filled-поля с `#leading-content` — по Q-1. (5) снятие `rounded`.
- **w5**: `useListbox` получит необязательный параметр «без прокрутки» (SEL-4); `Swatches.vue` не меняется.
- **Оркестратор**: удалить ключи `MESSAGES.dropdown*` и поправить шапку `messages.ts` (Q-7);
  `shared/utils/file/index.ts` `formatFileSize` (Q-8); `src/module.ts:167` не трогается при Q-10 → 1
  (перенос в `utils/`).
- **Вне объёма (MMenu)**: открытие панели ставит `overflow: hidden` на `<html>` (`lockScroll` по
  умолчанию `true`, -002 `htmlOverflow: hidden`) — страница не листается при открытом селекте.
  **MChip**: базовая карта — на нажатие чип смещается на 1rem вниз (`press: self dy 1`).

## Что не удалось проверить

- H-4 (открытие двигает страницу) — не воспроизвелось: -002 `scrollY` 179 → 179 и при открытии у
  нижнего края (панель перевернулась вверх), и при обходе стрелками; `focus()` без `preventScroll`
  остаётся теоретическим риском — не чиню.
- H-19 (высота dropzone при перетаскивании) — с короткими фразами не меняется (-004: 199 → 199 → 199).
- H-1 во flex-ряду в -001 не измерился (пустой multiple не показывает чипы — баг w3); перемерено в -007
  с одним чипом заранее.
- H-14 (панель отрывается при фильтрации) — работа MMenu, не мерил.
- Firefox (Esc в search, `scrollbar-*`) — у дирижёра только Chromium.
- Скринридеры (TS-06) — не дирижёру.
