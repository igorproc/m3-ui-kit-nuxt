# Бриф группы «Выбор и файлы» (`w4-select-files`)

> Читается вместе с `00-common.md`. Состояние на 2026-10-18 (ветка `components/redisign-update`, HEAD c9da731).
> Правки группы этой ветки — в одном коммите `c9da731` («до» — `git show c9da731^:<путь>`); семейство
> dropdown/autocomplete переписано раньше, в main (2026-09-06, `summary/dropdown-family-rework_2026-09-06_1801.md`).
> **[Ф]** — факт с путём, **[Г]** — гипотеза по коду: сначала проба, потом аудит. Пути — от `src/runtime/`.
> P0 на момент написания не готов: нет `playground/e2e/probe.ts`, `playground/probes/`, baseline (в т. ч. `baseline/css-sizes.json` — выходной CSS из prod-сборки, метрика минимизации).

## 0. Компоненты и файлы

| Компонент | M3? | Файлы | Строк src | План | QA FAIL/MANUAL | Concept | Фикстуры |
|---|---|---|---|---|---|---|---|
| MDropdown | M3 exposed dropdown (`PrimaryNotEditable`) | `components/ui/dropdown/{index.vue 347, props.ts 102, context.ts 19}`; движок `composables/dropdown/{useDropdownControl 324, useDropdownKeyboard 175, useDropdownSelection 136, useDropdownChips 111, useTypeahead 69, useDropdownEntries 61, usePanelStatus 52, types 192}`, `composables/listbox/useListbox.ts 59`; `assets/stylesheet/components/dropdown/{_index 75, _panel 106}` (`_panel` общий с autocomplete) | 1828 с движком | `inputs/dropdown.md` (частично) | 30 / 15 | есть | matrix, stress, e2e ~23 |
| MAutocomplete | M3 editable | `components/ui/autocomplete/{index.vue 365, props.ts 69}`, `composables/autocomplete/useAutocomplete.ts 224`, `.../autocomplete/_index.scss 12` (= карта dropdown) | 670 | `inputs/autocomplete.md` (частично) | 31 / 16 | есть | matrix, stress, e2e ~20 |
| MSearch | M3 search bar (без view) | `components/ui/search/{index.vue 256, props.ts 31}`, `.../search/_index.scss 47` | 334 | `inputs/search.md` (done, кроме шага 3) | 16 / 16 | есть | matrix, stress, e2e 9 |
| MFileInput | авторский | `components/ui/file-input/{index.vue 300, props.ts 47}`, `.../file-input/_index.scss 19`; политика `shared/utils/file/index.ts` (оркестратор) | 366 | `inputs/file-input.md` (done) | 12 / 19 | общий `file-upload` (верх) | matrix, stress, e2e 9 |
| MFileUpload | авторский | `components/ui/file-upload/{index.vue 311, props.ts 60}`, `components/fragments/file-upload/{Dropzone 114, Item 152, List 79, upload.ts 41}`, `composables/file-upload/{useFileUploadQueue 163, context 28}`, `.../file-upload/{_index 86, _parts 171}` | 1205 | `inputs/file-upload/{index,dropzone,item,list}.md` (done) | 12 / 16 | общий (низ) | matrix, stress, e2e 16 |

Планы — `.cursor/plans/feature/components-should-update/`, QA — `.cursor/summary/runs/quality/data/<name>.json`,
concept — `.cursor/plans/feature/renders/<name>/concept.webp`. Unit: dropdown `tests/{a11y,interaction,keyboard,variants}`
+ `useDropdownControl.spec.ts`; autocomplete `tests/{a11y,interaction,variants}` — **спеки бэгов `useAutocomplete`
нет**; `useListbox`, `useTypeahead`, `useDropdownChips`, `useDropdownKeyboard` — только через компонент. В e2e
группы нет проб геометрии/движения, кроме «typing and clearing never reflows the query» (search) и «ошибка не
меняет высоту».

**`data-test` [Ф]:** у dropdown/autocomplete/search/file-input (`inheritAttrs: false` + `useControlAttrs`) он
падает на `<input>` — корень брать `.ui-dropdown:has([data-test=X])`; у MFileUpload — на корне `.ui-file-upload`.
- `dropdown/matrix` (`<table>`, `td { min-width: 220rem }`): `<state>-<filled|outlined>`, state: `enabled`,
  `selected` (clearable, Banana), `multiple` (clearable, Apple + Cherry), `helper`, `required`, `readonly`
  (без clearable), `error`, `flagged`, `disabled`, `loading`; `density-<step>` (одиночные, пустые); `after`.
  `stress` (колонки 280rem): `long`, `chips` (12), `huge` (1000, значение 500), `empty`, `loading`, `mixed-script`.
- `autocomplete/matrix`: `enabled`, `selected` (Berlin), `multiple`, `min-length` (2), `readonly`, `error`,
  `disabled`, `loading` × вариант; `stress` — те же id, что у dropdown.
- `search/matrix`: `empty`, `populated`, `disabled`, `actions` (trailing + avatar), `submitted`; `stress`: `long`, `word`, `mixed-script`.
- `file-input/matrix`: `<empty|one|many|required|error|readonly|disabled>-<variant>`, `icon-only`; `stress`: `long`, `many`.
- `file-upload/matrix`: `enabled` (required, `contract.pdf` + длинное имя), `auto` (autoStart: `hang-scan` висит,
  `fail-scan` падает, `done`), `disabled`, кнопка `reset`; `stress`: `many` (100), `silent` (без `messages`).

**Дыры фикстур:** compact × multiple × filled с чипами; readonly + clearable / multiple; multiple с длинными
строками; поле у нижнего края окна (просит план dropdown); file-поля внутри `<form>`; autocomplete с `#hint`.
Фикстуры — твои файлы; в P1 запрещён только `src/` (сомневаешься — спроси оркестратора).

## 1. Решения владельца — не переспрашивать

**Семейство выбора**
- MDropdown — база; MAutocomplete = он же + запрос; один движок, два компонента (summary 09-06).
- `mFieldProps` + `fieldDensityProp`; `variant` — `Extract<…, 'filled' | 'outlined'>`; `underline` никогда
  (`docs/system/en-US/decisions.md:22, :90`).
- Items — объекты с `id`, примитивы отклонены; `itemValue` по умолчанию — весь item; компаратор по `id` (`:54`);
  выбор model-first (`:52`); порядок обхода — из данных.
- `max` только с `multiple`; заблокированные строки выпадают из обхода, `aria-disabled` (`:55`).
- Кламп панели по месту — работа MMenu (`:57`). Строка = высота поля 44/56/64 (`:65`).
- Галочка — `#trailing`, только у выбранной, текст строки на 16 под значением (план Q2 → 1); потолок панели на
  половине строки (Q3 → 2, `dropdown/_index.scss:23-45`).
- Строка: указатель 8 %, клавиатура 10 % + `focus-ring(inset)`, кольцо только пока ведёт клавиатура.
- Выбранная = `secondary-container`; строки Expressive: угол 4, у выбранной 16 **статично**; строка не сабмитит
  форму (память `containment-decisions-2026-10`).
- `maxHeight` → `--m-dropdown-panel-max-height` — законное исключение; `#default` + `useDropdownContext` — escape hatch.
- Очистка не primary в покое, подсветка на hover/focus; Backspace/Delete чистят одиночный; placeholder скрыт после
  выбора; при открытии фокус в инпут; панель якорится к `control` (summary 09-06, «Три бага»).
- Autocomplete: начальное значение — только черновик, без `search` (Q1 → 1); `#hint({ query, missing })` без
  текста (Q2 → 1); `clear` в `#no-results` (Q3 → 1); `openOnFocus` дефолт `'pointer'` (Q4 → 2); поиск без
  диакритики; атрибут `autocomplete` — только тут; toggle вне таб-порядка.
- Владелец 2026-09-07: «field и menu из разных веков» — редизайн панели ждёт его слова (digest g2); поверхность — MMenu.

**MSearch** — строка M3: `surface-container-high`, full, 56, без рамки, иконки 24 в 48, padding 4, hover 8 %; фокус
— кольцо кита на корне (Q1 → 2); без `density` (LY-08 принят); `max-width: 720rem` — ось кита; без английских
дефолтов (dev-warn); очистка всегда в разметке, прячется `visibility`.

**MFileInput** — одно нативное `<input type=file>`, модель `File | File[] | null`, сводка «a, b, c +N»; поля семьи
доходят до `MTextField`; отказ — в строке поддержки; `browseLabel`/`clearLabel`/`rejectMessages` без дефолтов.

**MFileUpload** — внутри один `MFileInput` как picker, **скрытый** (Q1 → 1); корень `role="group"`, `hint` в
`aria-describedby`, постоянный `role=alert` под dropzone, всё — `messages`; disabled → `aria-disabled`, read-only
dropzone не гаснет; модель ↔ очередь в обе стороны, `autoStart` и для начальной модели; `queued` различает
«добавлен»/«запрошен», `start(id)` — одна строка, удаление ничего не запускает (2026-10-08); длинная очередь —
`max-height: calc(spacing(64) * 5)` + прокрутка (память `data-inputs-decisions-2026-10`); без `density`.

**Вся группа:** hairline `max(1px, 1rem)` (`decisions.md:84`); helper disabled 38 % — исключение WCAG; морфа и
пружин нет; file-* — авторские, в своём видении.

## 2. Что осталось от прошлых раундов

### 2.1 Вне объёма — не браться
- **dropdown/autocomplete шаг 3** — поверхность на примитиве поповера: роль `menu` вокруг listbox (A11-01; e2e
  `KNOWN_MENU_VIOLATION`, `dropdown.e2e.ts:12` — не трогать), анимация панели литералами без reduced motion
  (TK-04, MO-05, A11-18), перемер/кламп (LY-05, RS-10), z-index (LY-06), слушатели закрытого меню (EN-10),
  `placementToArea` в RTL (часть LY-10), `menuPlacement` → `PopoverPlacement`.
- **dropdown шаг 4 / autocomplete шаг 6** — input-чип с отдельным удалением (MChip, В-4; A11-04).
- **search шаг 3** — search view; шаг 4 — рецепт app bar (docs).
- DC-* (docs), RS-12 (цели — MButtonIcon/MChip), FM-09 (`:autofill` — w3), IN-08 `aria-disabled` и видимый
  validating FM-06 — общие вопросы полей.

### 2.2 В объёме, но новый API — только по слову владельца
- **dropdown шаг 5 / autocomplete шаг 7** (не начаты): `loadError`/`#error`/`retry` (ST-01, DT-04, EN-03),
  задержка индикатора (DT-11, ≈150/400 мс), `#loading` у dropdown, отличимый readonly (IN-09). Фаза D Q15
  (readonly как у Vuetify) и Q16 (`loadError` + `#error` + `retry`) **не отвечены** (digest g3); Q17 (Tab закрывает
  без выбора) уже в коде — `useDropdownKeyboard.ts:164-166`, e2e «Tab out of an open panel».
- CT-08/DT-08 — виртуализация (`useVirtualScroll`) и подгрузка: пока только через `#default`.
- Предложения планов (не шаги): dropdown — «+N» вместо прокрутки чипов, `itemSubtitle`/`itemIcon`, группы (ждёт
  заказчика), «выбрать все»; autocomplete — подсветка совпадения, `allowCustom`; search — недавние, `/`/`mod+k`,
  подсветка, debounce; file-input — сводка чипами, миниатюра; file-upload — вставка из буфера, сводка очереди,
  «повторить все неудачные».

### 2.3 Хвосты
- summary 09-06: «глазами не смотрел — чипы при multiple (высота коробки), compact-панель под compact-полем,
  outlined + чипы»; summary inputs «Проверить глазами»: «не смотрено ничего» (search без рамки, очистка без сдвига;
  галочка справа, текст на линии значения, половина строки; отказ не прыгает, многоточие, refusing-вид) — первые `look`.
- summary 09-06: `MList` красит `container-color` лишним слоем — у строки теперь `transparent`
  (`list/item/_index.scss:45`), проверить у `MList`.
- Дашборды (`integration-and-dashboards_2026-10-08.md`): английские имена очистки/раскрытия и статуса без пропа;
  **MFileUpload: статус не в модели — ремаунт (`MTabsPanel`; в демо sheet → `CrmDealFiles`) перезапускает
  auto-start**; **MSearch теряет `id`**; generic выбора выводить из `items`; публичный экспорт типов.

### 2.4 Развилки, которые придут владельцу (сформулировать, не решать)
1. **Q13 — английские дефолты** (открыт с фазы D): `MESSAGES.dropdownClear | dropdownToggle | dropdownLoading |
   dropdownEmpty | dropdownNoResults` (11 мест, только dropdown/autocomplete) + единицы `B/KB/MB` с точкой в
   `formatFileSize` (`shared/utils/file/index.ts:52-57`, файл оркестратора). Варианты (digest g3): проп без дефолта +
   dev-warn (прецедент MSearch, file-*, MLoading, MOtpInput; `craft.md` §6) / проп с дефолтом из `MESSAGES` /
   сообщения через `materialKit`. Шапка `messages.ts` врёт («every one of these is also a prop») для `dropdown*`.
   Удалять ключи — через оркестратора. e2e на текст: `dropdown.e2e.ts:281`, `autocomplete.e2e.ts` («No results»).
2. **Где живёт статус загрузки** (H-20/H-21): внешняя очередь / `v-model` статусов против autoStart только для
   новых файлов (противоречит «autoStart и для начальной модели»).
3. Q15, Q16. 4. По итогам проб: H-11…H-13, H-24, H-25, F-1…F-4.

## 3. QA-аудит: что открыто

«устар.» — писалось до редизайна: перепроверь по коду.

**MDropdown** — в объёме: ST-01 P1, IN-09 P1 (readonly неотличим, `index.vue:34`, → Q15), DT-04 P1, CT-13 P2
(→ Q13), EN-03 P2, DT-08 P2, CT-08 P2 (1000 строк, у каждой `v-ripple`), DT-11 P3, FM-06 P2, IN-08 P2.
Чужие: ST-06 (устар.: строка гасит части отдельно, `list/item/_index.scss:52-64`), LY-05, LY-06, LY-10 (устар.
наполовину: строка уже `text-align: start`), RS-10, RS-12, TK-04, A11-01, A11-04, A11-18, MO-05, EN-10, DC-02…05.
MANUAL → `look`: RS-01 P1 (320 + чипы, панель = поле), RS-02 P1 (ресайз с открытой панелью), RS-06 P1 (clear/чип ≥ 24
на compact), LY-07 P1 (модалка, таблица, узкая колонка), A11-13 P1 (sticky-шапка), CT-06 P1, TH-02 P1 (устар.:
`primary-container`), TH-03 P1, LY-03, RS-07, CT-12, TH-08, FM-04 P2, EN-11; TS-06 — скринридер, не дирижёру.

**MAutocomplete** — то же + CT-13 (`'Toggle options'`, `'No results'`), EN-03 (`#error`), FM-09 (w3), EN-10
(debounce — у приложения по плану). MANUAL доп.: RS-11 (виртуальная клавиатура), RS-07 (зазор clear ↔ toggle),
CT-12 (устар.: NFD уже есть, `useAutocomplete.ts:47-49`; проверить CJK).

**MSearch** — FAIL в объёме: FM-09 P2 (нет `:autofill`), TH-11 P3 (нет `prefers-contrast`); системные TH-07, RS-06,
IN-08. MANUAL: A11-08 P1 (Esc, см. H-24), CT-06, LY-07 (в app bar — демо), RS-01, A11-13, CT-07 (запрос из пробелов
показывает очистку), MO-03 (быстрый ввод/очистка), CT-12, LY-03, RS-11, TH-08; ST-07, TH-02, TH-03 — про рамку,
которой больше нет.

**MFileInput** — FAIL: TK-02 (устар.), TH-07, DC-*. MANUAL: ST-03 P1 (кольцо Browse/Clear поверх error), IN-04/05 P1
(кольца кнопок в append не обрезаны), CT-02 P1 (длинные имена уходят за край), LY-07 P1 (Browse + Clear съедают
ширину), RS-01 P1, CT-06, MO-04 (появление Clear сужает текст), LY-03 (базовая линия Browse), CT-12, TH-*.

**MFileUpload** — FAIL: TK-02 (устар. `index.vue:182`; реально — `dropzone.border.width: 1rem` без hairline,
`file-upload/_index.scss:28`), TH-07, DC-*. MANUAL: ST-02 P1 (drag над disabled; фокус кнопки в dragging-зоне),
ST-03 P1, IN-04 P1, RS-01 P1 (строка с 4 кнопками на 320), LY-07, CT-06, ST-07 (контраст dragging), TH-03 (пунктир ≥ 3:1), LY-03, CT-12.

**Принято, не трогать:** RS-04/05/06, TS-04, TS-01 (Storybook отклонён), TK-09, LY-08 у search.

## 4. Движение и анимации

### 4.1 Что анимируется [Ф]
| Где | Что | Чем | Морф? |
|---|---|---|---|
| `dropdown/index.vue:336-343` стрелка | `rotate(180deg)` на `--open` | `motion` short-3 (`dropdown/_index.scss:71-74`); `180deg` — литерал | нет |
| `autocomplete/index.vue:106` toggle | смена глифа `arrowDropUp`/`Down`, без перехода | — | нет |
| строки (`MListItem`, w2) | `background-color`, `color`; ripple | `list/item` `motion` short-3 | нет |
| панель (MMenu, вне объёма) | scale + fade, литералы | `menu/index.vue` | нет |
| поле (`MTextField`, w3) | рамка, фон, цвет иконок | `text-field/index.vue:270-272, 367` | нет |
| `search/index.vue:143-154` | `::before` opacity | short-3 | нет |
| `_parts.scss:23-26` dropzone | рамка, фон, цвет | `motion` short-4 из карты | нет |
| `_parts.scss:163-171` строки очереди | только `opacity` (`TransitionGroup`) | **литеральные** `var(--sys-motion-*)` вне карты | нет |

Морфа, пружин, `useShapeMorph`, `useReducedMotion` в группе нет; глобальный reduced motion
(`base/_animations.scss:44-60`) режет только medium/long — short-3/4 законно остаются. Риск группы — **скачки
раскладки**, а не кривые.

### 4.2 Гипотезы «прыгает / бегает» [Г]

**Поле и чипы**
- **H-1. Поле растёт в ширину при выборе в multiple.** Ряд чипов `nowrap` + `overflow-x: auto`, чипы
  `flex: 0 0 auto` (`text-field/index.vue:315-342`) → max-content поля растёт с каждым чипом; в auto-таблице
  (`fixtures/dropdown/matrix.vue`) и во flex-элементе с `min-width: auto` (демо `OrdersFilters.vue:98-101`) поле/колонка
  расширяется — дословно «при выборе опции компонент идёт в ширину». Если корень в ряду MTextField — заявка w3.
- **H-2. Высота коробки с чипами на compact** (чип ~32 + поднятый float-лейбл filled в 44). Нужна фикстура.
- **H-5. Стрелки по чипам физические.** `useDropdownChips.ts:58` ArrowLeft входит в чипы, `:70` ArrowRight выходит
  при любом `dir`; в RTL чипы справа от каретки — «не в ту сторону».
- **H-9. Readonly: очистка и чипы выглядят активными, но мертвы.** `dropdown/index.vue:89` `:disabled="disabled"`,
  чипы `:60` без `readonly`; блокирует `useDropdownSelection.ts:71, 100`. У autocomplete — `disabled || readonly`
  (`:57, :86`). Проверь весь класс.

**Очистка**
- **H-8. Очистка с клавиатуры роняет фокус на `body`.** Кнопка `v-if` (`dropdown/index.vue:84-94`,
  `autocomplete/index.vue:81-91`) в таб-порядке исчезает после Enter. MSearch делает правильно
  (`search/index.vue:115-121` + резерв `visibility`) — две механики одного поведения в группе.

**Панель**
- **H-3. Наведение прокручивает список.** `useDropdownControl.ts:275-278` `onPointermove` → `setActive` →
  `useListbox.ts:21-26` `scrollIntoView({ block: 'nearest' })` на **каждое** движение; панель нарочно режет строку
  пополам → наведение на половинную строку сдвигает список под курсором. `behavior.md`: замер на каждое движение
  указателя — баг.
- **H-4. Открытие двигает страницу.** Тот же `scrollIntoView` идёт по всем прокручиваемым предкам, панель
  `absolute` (`dropdown/index.vue:107`); `focus()` без `preventScroll` при открытии (`dropdown/index.vue:287-289`,
  `autocomplete/index.vue:339-341`); чипы — `useDropdownChips.ts:104-108`.
- **H-6. Галочка меняет высоту строки в multiple.** `#trailing` монтируется только у выбранной
  (`dropdown/index.vue:158-166`, `autocomplete/index.vue:167-175`) → длинный заголовок переносится иначе, строки
  ниже едут. Нужна фикстура.
- **H-10. Клик по строке поддержки открывает/закрывает панель.** `@click` на корне `.ui-dropdown`, а он включает
  лейбл, коробку и строку поддержки (`dropdown/index.vue:10, 291-297`; `cursor: pointer` `:322`).
- **H-11. Toggle или ↓ при запросе короче `minSearchLength` открывают пустую полоску.** `openAt` порог не смотрит
  (`useDropdownControl.ts:128-146`), `filterRows` → `[]` (`useAutocomplete.ts:95`), `#hint` без текста
  (`autocomplete/index.vue:198-203`) → поверхность с `padding-block` 8 + 8. e2e проверяет только ввод
  (`autocomplete.e2e.ts:169-179`).
- **H-12. После выбора повторное открытие показывает одну строку.** `onSelect` → `setQuery(entry.title)` пишет
  `search` (`useAutocomplete.ts:120-125`), фильтр читает `search` (`:97`), а начальное значение — только `draft`
  (`:155`): до первого выбора 6 строк, после — 1. Подтвердится — развилка.
- **H-13. Клик по уже сфокусированному инпуту (после Esc) не открывает панель** — открытие только из
  `watch(focused)` (`useAutocomplete.ts:189-196`), ввода, ↓, toggle; dropdown по клику переключает.
- **H-7. Две механики индикатора.** Dropdown крутит стрелку 150 мс, autocomplete меняет глиф мгновенно (так и в
  concept'ах). Выбор между двумя реализациями — твоё решение, не развилка; сверь с
  `ExposedDropdownMenuDefaults.TrailingIcon` в `m3-reference`; `180deg` — в карту; проверь направление в RTL.
- **H-14. Панель отрывается от поля при фильтрации** (LY-05) — MMenu: замерить и передать оркестратору.

**Очередь file-upload**
- **H-15. Удалённая строка держит место, потом соседи прыгают** — `_parts.scss:163-171`: только `opacity`, нет
  `-leave-active { position: absolute }` и `-move`.
- **H-16. Последняя строка исчезает без фейда, первая — без появления** — `List.vue:2-3` `v-if` на самом
  `TransitionGroup`; `#empty` встаёт сразу; без `appear`.
- **H-17. Прогресс меняет высоту строки** — `Item.vue:27-32` `MProgressLinear v-if="uploading"`.
- **H-18. «Start uploads» появляется/исчезает** — `file-upload/index.vue:98-105` `v-if="… && hasQueued"`.
- **H-19. Dropzone меняет высоту при перетаскивании** — текст `drop` ↔ `reject.type` или пропадает
  (`Dropzone.vue:29-32, 89`); содержимое выше `min-height: 160rem`.
- **H-20. Авто-старт на сервере.** `watch(model, …, { immediate: true })` (`file-upload/index.vue:248-254`) в SSR →
  `queue.start()` → `options.upload()` (`useFileUploadQueue.ts:62-71`) на сервере; клиент стартует снова (двойная
  загрузка, расхождение гидрации).
- **H-21. Ремаунт перезапускает auto-start** — факт дашбордов, тот же корень → развилка 2.4-2.

**Search и dropzone**
- **H-22. В forced colors кольцо фокуса строки 1px.** `&--focused { focus-ring }` (`search/index.vue:164-166`)
  перебивается позже стоящим `outline: 1px solid CanvasText` той же специфичности (`:244-254`).
- **H-23. Enter во время IME отправляет `submit`** — `search/index.vue:32` без `isComposing` (autocomplete учитывает,
  `useAutocomplete.ts:178-184`). Unit-спека.
- **H-24. Esc** — обработчика нет; Chromium очищает `type=search` сам, не испуская `clear`, Firefox нет (QA A11-08).
- **H-25. «Accepting» у dropzone — только цветом** (правило 13): иконка и текст как в покое (`Dropzone.vue:22-32`,
  `_parts.scss:30-35`). Авторский вид → предложение, не тихая правка.

## 5. Кастомизация: что есть и где дыры

**MDropdown [Ф]** — слоты `prepend`, `append`, `selection { entries, remove }`, `chip { item, value, title, index,
remove }`, `item { item, index, value, title, selected, disabled, blocked, active }`, `empty`, `default { entries,
listboxAttrs, getOptionAttrs, panelStyle, activeId, limitReached, loading, select, close }`; модели `modelValue`,
`open`; события `select`, `remove`, `clear`, `open`, `close`; `expose { open, close, clear }`; контекст и
`useDropdownControl` (спека бэгов есть). Дыры [Г]:
- **нет `defineSlots`** в dropdown, autocomplete, file-upload → слот-пропсы без типов («нет подсказок в ide» — P1);
- галочка (`ICONS.check`) не заменяется: `#item` меняет только тело (`dropdown/index.vue:158-180`); стрелка и
  иконка очистки без слота (у MSearch `#clear` есть); нет `#loading` (у autocomplete есть), `#error`, `focus()` в expose;
- generic выбора — из модели, не из `items`; ручной `MDropdownProps` (`props.ts:85-97`) рядом с runtime-пропами;
- проп `autocomplete` из `mFieldProps` объявлен, но не передаётся (`text-field/props.ts:112`).

**MAutocomplete** — + `hint`, `loading`, `no-results { query, clear }`, модель `search`, пропы фильтра,
`openOnFocus`; `expose { open, close = closeAndRestore, clear = clearQuery }`; корень без `--disabled`
(у dropdown есть).

**MSearch** — слоты `leading`, `clear`, `trailing`, `avatar` (типизированы), события `submit`, `clear`. Дыры:
**`id` потребителя перетирается** — `:id="fieldId"` после `v-bind="controlAttrs()"` (`search/index.vue:21-22`),
`fieldId` больше нигде не нужен; `loading` без эффекта; нет `readonly`, `expose` (`focus`).

**MFileInput** — слоты `prepend`, `selection`, `browse { props, open }`, `clear { props, clear }`, `actions`;
`expose { open, clear }`. Дыры: текст в поле не заменить (`#selection` — под полем; «+N» после
`SUMMARY_NAMES = 3` зашито, `index.vue:211-221`); `loading`/`autocomplete` без эффекта; **F-1** клик по телу поля
picker не открывает (поведение → развилка); **F-2** `required` на нативном инпуте (`index.vue:115`), который не
знает о файлах, пришедших в модель программно.

**MFileUpload** — слоты `dropzone { openPicker, addFiles }`, `rejection`, `list`, `item { entry, start, cancel,
retry, remove }`, `empty`, `actions`; 9 событий; `expose { entries, start, cancel, retry, remove }`;
`useFileUploadQueue` (автоимпорт). Дыры: `#dropzone` заменяет зону **вместе с drag-логикой** (слот приватного
`Dropzone.vue:14-21` наружу не выведен); в expose нет `openPicker`/`addFiles`; `loading` без эффекта; `_source` в
`addFiles` не используется (`index.vue:205`); удаление строки в `queued` идёт через `cancel` → испускает `cancel` и
объявляет «Cancelled» (`useFileUploadQueue.ts:147-151` → `:123-135`) — проверить спекой; **F-2**: `required` на
скрытом нативном инпуте внутри `<div hidden>` (`index.vue:25-38`) — при файлах из модели/drop форма с ним не
отправится («invalid form control is not focusable»).

Развилки раздела: F-1, F-2, **F-3** (внутренние фабрики из автоимпорта, §6), **F-4** (скрытый `MFileInput` →
голый `<input type=file>`, §6).

## 6. Минимизация и оптимизация

- **Строки:** > 400 нет; крупнейшие `autocomplete/index.vue` 365, `dropdown/index.vue` 347, `useDropdownControl.ts` 324.
- **Дефисных путей `g()` нет** (`lint:scss` 2026-10-18: «152 stylesheets compiled, no deprecations», legacy-предупреждений
  нет). Литералов px/ms/rgb/`transition: all`/`>`/`[data-*]` нет, кроме законного `1px` в forced-colors; остаются
  `rotate(180deg)` и литеральные motion-переменные `_parts.scss:165`.
- **Копипаста dropdown ↔ autocomplete:** чипы (`dropdown:44-79` / `autocomplete:41-76`), очистка, шаблон панели
  (`dropdown:113-195` / `autocomplete:120-236`), live-регион, `keyboardCursor` + `optionClasses` (`:263-273` / `:315-325`),
  `usePanelStatus`, `watch(open)` с фокусом, `useField` + `isError`, `fieldControl`. Кандидат — приватные
  `fragments/dropdown/{Panel,Chips}.vue` или общий композабл; −150…200 строк.
- **Подменённый фон вместо слоя:** `_panel.scss:56-87` гасит `::before` строки и красит готовой смесью
  `option.{hover,keyboard}.{bg,selected-bg}` (`dropdown/_index.scss:51-64`) — «The background swap» из `craft.md`
  (en, `:40-48`). Слой по `--active` (8) / `--keyboard` (10) снимет 4 токена и `display: none`; не нарисуй hover
  дважды (у строки свой `state.hover`), pressed у строки — только ripple (решение w2).
- **Тихие чтения чужих карт:** `map.get(item.$tokens, …)`, `map.get(menu.$tokens, …)` (`dropdown/_index.scss:16-20,
  27, 49`) вернут `null` молча после переименования у w2 → `g()`.
- **Мёртвое:** модификаторы без CSS — `ui-search--empty` (только спека), `ui-autocomplete--open|--multiple`,
  `ui-dropdown--multiple` (видны потребителю — удаление согласуй); пропы `loading` (MSearch, file-*), `autocomplete`
  (MDropdown, MFileInput); `fieldId`; `messages = computed(() => props.messages)` (`file-upload/index.vue:144`);
  `_source`; импорт `DropdownControlConfig` не нужен, а `DropdownResolvedItem` (`useDropdownControl.ts:27, 192`)
  держится на глобальных типах автоимпорта; `autocomplete/_index.scss` — алиас.
- **Две механики одного:** очистка (H-8), индикатор (H-7), две проверки файлов в MFileUpload — политика скрытого
  `MFileInput` и своя (`file-upload/index.vue:146-150, 205-209`) с разной семантикой `maxFiles` → F-4 (решение
  владельца «один MFileInput» — значит развилка). Скрытый `MFileInput` без `browse-label` печатает dev-warn на
  каждый MFileUpload (`file-input/index.vue:236-238`).
- **Автоимпорт внутренностей:** `composables/**` сканируется глубоко (`src/module.ts:167`) → в приложение утекают
  `useDropdownChips`, `useDropdownEntries`, `useDropdownKeyboard`, `useDropdownSelection` + `compareByIdentity`,
  `usePanelStatus`, `useTypeahead` + `isPrintableKey`, `use/provideFileUploadContext` (`playground/.nuxt/imports.d.ts`).
  Перенос в `utils/` ломает потребителей → F-3; `useTypeahead` назван в `behavior.md` каноническим — возможно, публичен намеренно.
- **Прочее:** `margin-top` → `margin-block-start` (`file-input/index.vue:290`); hairline dropzone; `material-map()` —
  no-op (`abstracts/_functions.scss:70-85`), его отсутствие в dropdown ничего не меняет.
- Из кнопок/полей применимо: `@each` уже есть (плотности панели, состояния dropzone), `_states.scss` не нужен,
  китовые кнопки и `focus-ring` уже стоят. Загрузка панели — `MProgressLinear` по кромке (решение плана), не `MLoading`.

## 7. Связи с другими группами

**Потребляем [Ф]:**
- **w1** `MButtonIcon` — очистка dropdown/autocomplete/search/file-input, toggle autocomplete (`tabindex="-1"`,
  `aria-expanded`, `aria-controls`), browse-иконка, «choose» dropzone (`outlined`), действия строки очереди; цвет —
  через `ui-button--current` (без `color` → `currentColor`, роли зоны trailing поля). `MButton` — browse (`text`),
  «choose» (`outlined`), «Start uploads».
- **w3** `MTextField` (dropdown, autocomplete, file-input): пропы `model-value`, `focused`, `label`, `placeholder`,
  `helper-text`, `error`, `error-message`, `variant`, `shape`, `label-placement`, `density`, `name`, `disabled`,
  `readonly`, `required`, `autofocus`, `autocomplete`, `input-attrs`; слоты `prepend`, `leading-content` (чипы),
  `append`; expose `{ control, input }`; классы `__icon--append`, `--disabled`, `__support`. Плюс `useFieldShape`,
  `mFieldProps`, `fieldDensityProp`, `MTextFieldVariant`, `MFieldDensity`, `MFieldParts`.
- **w2** `MList` (`density`, атрибуты listbox), `MListItem` (`interactive`, `selected`, `disabled`, `lines="1"`,
  `#trailing`, тело); токены `list/item/_index.scss`.
- **Вне объёма:** `MMenu` (`absolute`, `match-width`, `anchor`, `origin`, `@click-outside`; `lockScroll` по умолчанию
  `true`, `menu/props.ts:13`), `MChip`, `MIcon`, `MProgressLinear`, `useField`, `createContext`, `shared/utils/file`.

**Потребляют нас [Ф]:**
- **w5** `MColorPicker` → `MDropdown` (`ui/color-picker/index.vue:54-67`: `items`, `item-value`, `label-placement="hidden"`,
  `density="compact"`, `outlined`, `disabled`, `readonly`); `fragments/color-picker/Swatches.vue:53, 90` →
  `useListbox(entries, focused, () => false)`. Правка `useListbox` (H-3) и readonly (Q15) задевают w5 — заявкой.
- Демо (только читать): `demo/orders/{OrdersFilters, NewOrderCustomerFields, NewOrderDeliveryFields, OrdersAppBar}`,
  `demo/crm/{deals/CrmDealsTab, new-deal/CrmNewDealFields, details/CrmDealFiles, shell/CrmAppBar}`.
  `form-renderer` тип `search` рисует `MTextField`, не MSearch.
- Внутри группы: MFileUpload → MFileInput и `MFileRejectMessages` (`file-input/props.ts`).

## 8. Порядок и объём

1. **dropdown + autocomplete** вместе (общий движок и `_panel.scss`, на них стоит w5): без API — H-3, H-4, H-5, H-8,
   H-9, H-10, `defineSlots`, минимизация; развилки — Q13, Q15/Q16, H-11…H-13. Аудит M, реализация M–L.
2. **file-upload + file-input** (общие `required`, политика, picker): H-15…H-21, F-1…F-4, hairline, dev-warn. M / S.
3. **search** — пока ждёшь дирижёра: `id`, H-22…H-24, мёртвые `loading`/`--empty`. S.

Без браузера, пока ждёшь: unit-спеки H-5 (`dir="rtl"` на предке), H-8 (`attachTo: document.body`), H-9, H-12, H-23,
`id` MSearch, `cancel` при удалении queued, dev-warn скрытого MFileInput, спека бэгов `useAutocomplete`.

## 9. Стартовые заявки дирижёру

`w4-select-files-NNN`. Опции кликать через `js`:
`[...document.querySelectorAll('[role=option]')].find(o => o.textContent.trim() === 'Banana').click()` (id опций — из `useId`).

1. **001 `probe` H-1.** `dropdown/matrix` и `autocomplete/matrix`, ltr + rtl. Targets: `.ui-dropdown:has([data-test="multiple-filled"])`,
   сосед по колонке `…enabled-filled`, `[role=listbox]`; `width`. Act: клик по полю, выбрать ещё 3 опции. `analyzeMotion` + `shootStates`.
2. **002 `probe` H-3, H-4.** `dropdown/stress` `huge`: фокус + ArrowDown, `waitForMotion`, `hover()` на опцию,
   обрезанную краем listbox, записать `scrollTop` listbox и `scrollY` 600 мс. Вариант: viewport 1280×600, поле у
   нижнего края — `scrollY`, rect поля и панели до/после открытия.
3. **003 `look` H-5.** `/dropdown/matrix?dir=rtl` (и `ltr`): `focus [data-test=multiple-filled]`; `js` — левые края
   чипов и инпута; `press ArrowLeft`; `js` — текст элемента из `aria-activedescendant`; `press ArrowRight`; `js` снова.
4. **004 `look` H-8.** `/dropdown/matrix`: `focus [data-test=selected-filled]`, `press Tab`, `js document.activeElement.className`,
   `press Enter`, `js document.activeElement === document.body`. То же на `/autocomplete/matrix`.
5. **005 `look` H-10, H-11.** `click .ui-dropdown:has([data-test=helper-filled]) .ui-text-field__support` → `js` `aria-expanded`;
   `/autocomplete/matrix`: `click .ui-autocomplete:has([data-test=min-length-filled]) .ui-autocomplete__toggle`,
   `wait 400`, `js` `aria-expanded` + высота `[role=listbox]`, `shot .ui-menu__surface`.
6. **006 `look` H-12, H-13.** `/autocomplete/matrix`: клик `[data-test=enabled-filled]`, `js` выбрать Berlin, `wait 300`,
   клик по его toggle, `wait 400`, `js` число `[role=option]`; затем `press Escape`, клик по инпуту, `js` `aria-expanded`.
7. **007 `probe` H-15…H-18.** `/file-upload/matrix`: targets — строки `[data-test=enabled] .ui-file-upload__item`,
   кнопка `[data-test=reset]`, корень `[data-test=auto]`; `height`, `opacity`. Act: `button[aria-label="Remove contract.pdf"]`,
   затем удалить последнюю строку. Отдельно — высоты строк `hang-scan` и `done` в `auto`, наличие «Start uploads».
8. **008 `probe` H-20, F-2, dev-warn.** `page.request.get('/file-upload/matrix')` → число `__item--queued|--uploading|--success`
   у `auto` в серверном HTML; после `openFixture` — консоль (гидрация, `[m-file-input] no browse-label`) и те же счётчики;
   `js` — `required` и `validity.valueMissing` у `[data-test=enabled] input[type=file]` при двух строках в очереди.
9. **009 `probe` H-19, H-25.** `/file-upload/matrix` `enabled` и `/file-upload/stress` `silent`: `dispatchEvent('dragenter')`
   с `DataTransfer` (`application/x-msdownload` — refusing, `application/pdf` — accepting); rect зоны и первой строки в
   покое / accepting / refusing, `shootStates` зоны.
10. **010 `look` H-22 + осмотр.** `{ "url": "/search/matrix", "media": { "forcedColors": "active" } }`: `focus [data-test=empty]`,
    `js getComputedStyle(document.querySelector('.ui-search:has([data-test=empty])')).outlineWidth`, `shot`; повтор без media.
    Плюс `shot` `.ui-search:has([data-test=actions])` в hover/focus, light/dark — сверка с concept.

Следом: `shootStates` открытой панели `dropdown/matrix` `selected-filled`, `multiple-filled` и `autocomplete/matrix`
`multiple-filled` (light/dark, ltr/rtl) — сверка с concept (строки, галочка, `secondary-container`, половина строки).
