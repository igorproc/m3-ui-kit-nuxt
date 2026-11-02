# Fields — аудит планов

Итог: сделано 76 · частично 6 · нет 12 · регресс 0 · отменено 8 (по пунктам).

Сверено с рабочим деревом 2026-10-30. Проверки, кроме проб: `node shell/scss-smoke.mjs` — 162 стиля без депрекаций;
`stylelint` и `eslint` по файлам группы — 0 ошибок; `vitest` по 16 папкам группы — 36 файлов, 718 тестов зелёные.
e2e и `vue-tsc` не запускались (бриф). Все пробы — Chromium, 1280×800 (1rem ≈ 0.667 CSS px).

Сквозной пункт «Рендер `current.webp` переснят» не выполнен ни в одном плане, кроме search: файлы
`.cursor/plans/feature/renders/{text-field,textarea,number-input,dropdown,autocomplete,otp-input}/current.webp`
датированы 2026-10-07. Поэтому планы с тегом `done` по факту «частично» — только из-за этого пункта.

## inputs/text-field.md — тег `done` → факт `частично` (тег неверен только по рендеру)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | роли состояний: disabled-индикатор 38 %, error+hover `on-error-container`, trailing-иконка в ошибке, лейбл outlined на hover, каретка, плейсхолдер, disabled-supporting (План работ) | сделано | `assets/.../text-field/_states.scss:28-45,129-182`, `_index.scss:150-154,202-221`, правило `.ui-text-field__input::placeholder` (`index.vue:282-284`); проба `states › text-field roles`: каретка primary / error, error+hover у filled и outlined (лейбл, иконка, кромка) = `on-error-container`, у outlined на hover лейбл = `on-surface`, disabled supporting и индикатор — on-surface 38 % | — |
| Ш2 | hover filled слоем `::before` (План работ) | сделано | `_states.scss:56-66,135-137`; проба: `::before` opacity 0.08 | — |
| Ш3 | у `underline` отступ строки поддержки 0 | сделано | `_index.scss:252-255`, `_states.scss:89-91`; проба `geometry › underline`: Δ края = 0 | — |
| Ш4 | `inset` на outlined внутри коробки | сделано | `_label.scss:100-134`; проба: центр лейбла на 15rem ниже верхней кромки, ширина выреза 0 (у `float` — 110rem) | — |
| Ш5 | строка поддержки = line-height body-small | сделано | `_index.scss:170`; проба: 16.01rem и зазор 4 от коробки у text-field (filled, underline), textarea и number-input | — |
| Ш6 | лейбл не движется (Q1→1) | сделано | `_label.scss:18-23` (переход только `color`), `props.ts:39-42`; проба: смещение после фокуса 0, `transition-property: color`; SSR-проба: центр лейбла 15rem от верха без JS — как после гидрации | — |
| Ш7 | `top` = body-medium (Q3→1) | сделано | `_index.scss:130` | — |
| Ш8 | счётчик (Q4→2) | отменён | `docs/system/ru-RU/decisions.md:30` | — |
| Ш9 | `prefix` / `suffix` (Q5→1) | сделано | `props.ts:137-140`, `index.vue:59-76`, `_parts.scss:57-71` | — |
| Ш9 | reveal (Q6→2) | отменён | ответ владельца — «Заметки реализации» плана, строка 308 | — |
| Ш10 | `useTextFieldControl` | сделано | `composables/text-field/useTextFieldControl.ts` (+ spec) | — |
| Ш11 | `rounded` → `shape` | сделано | `props.ts:31,86`, класс `--shape-*` (`index.vue:185`) | — |
| Ш11 | алиас `rounded` с dev-warn | отменён | `decisions.md:39` (шимов до стабильной нет) | — |
| Ш12 | `type="number"` (Q2→2) | сделано | удалён сразу, без dev-warn: `props.ts:16-22` — по `decisions.md:39` | — |
| Г1–Г4 | роли матрицы, мёртвых путей нет, inset/float, высота поддержки у трёх полей | сделано | пробы выше; scss-smoke чист | — |
| Г5 | lint / test / e2e | сделано | lint, stylelint, scss, vitest — зелёные; e2e не проверено | — |
| Г6 | рендер переснят | нет | `renders/text-field/current.webp` — 2026-10-07 | S |

Токены: совпадают 15 из 15. Два пункта — записанные отклонения (фокус 1rem, «фокус старше ошибки»); литерал 4 % стал системным ключом `disabled-container-subtle` (ST-05).

## inputs/textarea.md — тег `done` → факт `частично` (тег неверен по рендеру и записи Q1)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | роли: filled disabled 38 %, error+hover, каретка | сделано | `textarea/_index.scss:114,180-196`, `_states.scss:43-60,113-118`; проба `states › textarea roles`: индикатор 38 %, error+hover кромка и лейбл = `on-error-container`, каретка `error` | — |
| Ш2 | outlined disabled без заливки | сделано | `_states.scss:62-98`; проба: фон `rgba(0,0,0,0)` | — |
| Ш3 | границы роста = N × 1lh | сделано | `_index.scss:199-205`; проба: `rows=1` → 1 строка, `maxRows=3` → 3 строки и прокрутка (filled и outlined), без JS тоже 3.00 | — |
| Ш4 | строка поддержки 16 | сделано | проба: 16.01 | — |
| Ш5 | outlined на hover без слоя (Q2→1) | сделано | `_states.scss:62-78`; проба: `::before` opacity 0 | — |
| Ш6 | неактивный футер ролями, без `opacity` | сделано | `footer.vue:4-5` (`inert` + `--disabled`), `_states.scss:122-146`; пробой не проверялось | — |
| Ш7 | кегль `top` | сделано | body-medium (семейный Q3) | — |
| Г1 | `autoGrow` ровно `rows` / `maxRows` | сделано | Chromium (`field-sizing: content`) — проба; путь без `field-sizing` пробой не проверен | — |
| Г2–Г3 | outlined без заливки, роли = text-field | сделано | пробы выше | — |
| Г4 | lint / test | сделано | lint, scss, vitest зелёные | — |
| Г4 | рендер переснят | нет | `renders/textarea/current.webp` — 2026-10-07 | S |
| Q1 | «записать в `decisions.md`» (счётчик в строке поддержки) | нет | в `docs/system/ru-RU/decisions.md` записи нет; счётчик `--over` сделан (проба: цвет `error`) | S |

Токены: совпадают 10 из 10 (фокус 1rem и «фокус после ошибки» — отклонения). `--m-textarea-rows` / `--m-textarea-max-rows` — разрешённый рантайм-мост (`decisions.md:68`).

## inputs/number-input.md — тег `done` → факт `частично` (тег неверен только по рендеру)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | роли состояний | сделано | `number-input/_index.scss:160,267-285`; проба: filled disabled индикатор 38 % | — |
| Ш2 | outlined disabled без заливки; зона на границе — 38 % тона; тон filled через `state-opacity(hover)` | сделано | `_index.scss:124-127,193-202`, `_zones.scss:69-72,126-127`; проба `audit-bounds`: зона на `max` — filled `on-surface 3.04 %` (= 8 % × 38 %) против 8 % у соседней, outlined — `surface-container-high` на 38 %, глиф 38 %; outlined disabled — прозрачный | — |
| Ш3 | геометрия filled (LY-02), stacked внутри, скраб на линии значения | сделано | проба `geometry`: control filled = text-field 44 / 56 / 64; колонка stacked внутри коробки; центр скраба − центр значения = 0.01rem (filled и outlined) | — |
| Ш4 | `inset` на outlined внутри | сделано | `_label.scss:10,31-55`; проба: центр лейбла 15rem от верха, вырез 0 (split, stacked) | — |
| Ш5 | `role="alert"` только у ошибки, helper вне региона | сделано | `useNumberInputControl.ts:152-153,277`, `index.vue:140-169` | — |
| Ш6 | `aria-busy` по `meta.pending` | сделано | `useNumberInputControl.ts:261` | — |
| Ш7 | выбранная единица — галочка и контейнер | сделано | `fragments/number-input/Unit.vue` (`MMenuItem role="menuitemradio"`, Q14-А); проба: у отмеченного пункта есть глиф, фон = `secondary-container` | — |
| Ш8 | лейбл не движется | сделано | проба `misc`: смещение 0, переход только `color` | — |
| Ш9 | статичная форма нажатия (Q1→1) | отменён | «Заметки реализации» плана, строка 234; S3/S4 — `decisions.md:24` | — |
| Ш10 | кегль `top` | сделано | `_index.scss:138` | — |
| Г1–Г4 | высоты, скраб, outlined, alert / `aria-busy` | сделано | пробы выше; поведение: ↑/↓, PgUp/PgDn ±10, Home/End к границам, зажим только на Enter (150 → 100), Escape откатывает черновик «1.», колесо не меняет значение, скраб 40px → +10 (LTR) / −10 (RTL), `touch-action: pan-y` | — |
| Г5 | lint / test | сделано | vitest и lint зелёные | — |
| Г5 | рендер переснят | нет | `renders/number-input/current.webp` — 2026-10-07 | S |
| Q32 | без английских дефолтов (прогон 2) | сделано | `props.ts:67-71` — `default: undefined` | — |

Токены: совпадают 11 из 13. Ждут вопросов: pressed 12 % (СВ-1) и цель зоны 48 (RS-06 — половинки stacked 17.25 / 21.25 / 23.25rem).

## inputs/dropdown.md — тег `partial` → факт `частично` (тег верен, но текст устарел: шаги 3 и 4 сделаны в прогоне 2)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | hover строки 8 %, клавиатура 10 % + кольцо, стрелка error / hover / disabled, `state.type`, `aria-busy` | сделано | `fragments/dropdown/Panel.vue:212-235`, `dropdown/_index.scss:58-68`, `_field.scss:23-27`, `useDropdownControl.ts:275`; проба `states`: указатель 0.08, клавиатура 0.1 + `outline: solid`, стрелка `error` → на hover `on-error-container`, в disabled 38 % | — |
| Ш2 | галочка в конце (Q2→1), высота строки = поля (Q1→1), выбор `secondary-container` | сделано | `Panel.vue:33-46`, `decisions.md:89`; проба: строки 44 / 56 / 64 = поле, фон выбранной = `secondary-container`, текст строки −1.5rem от значения в поле (LTR и RTL; это hairline коробки) | — |
| Ш3 | поверхность панели | сделано | приватный `fragments/popover` (Q16-Б, `decisions.md:151`); проба: `surface-container`, угол 4rem, тень; axe открытой панели — 0 нарушений (light / dark, RTL) | — |
| Ш4 | input-чип с именованным удалением | сделано | `fragments/dropdown/Chips.vue`, ось `removal: 'whole'` (W17-Б); проба: чип — `BUTTON` с `aria-label="Remove Apple"`, `tabindex=-1` | — |
| Ш5 | ошибка загрузки (`#error` / `retry`) | отменён | Q-11 — рецепт через `#empty` / `#no-results` (`.cursor/summary/m3-polish-select-files_2026-10-19_0015.md:28`) | — |
| Ш5 | `#loading`, readonly, Tab при открытом списке | сделано | `index.vue:146-153`; Q-2 / Q-3; проба: read-only не открывается по клику и ↓; Tab закрывает и уводит фокус | — |
| Ш5 | задержка индикатора | нет | ждёт S6 (`sweep-run-2/owner-questions.md`, рекомендация — «Б: не делать») | S |
| Ш6 | намёк «список продолжается» (Q3→2) | сделано | `dropdown/_index.scss:22-24,40-46` (6.5 / 5.5 / 4.5 строки); проба: в default список 324rem = 5.5 × 56 + 16 | — |
| Ш7 | тесты | сделано | `tests/{variants,interaction,a11y,keyboard,form}.spec.ts`; e2e: axe открытой панели `[]` (`dropdown.e2e.ts:48-52`) | — |
| A | `menuPlacement` → логический `placement` | сделано | `props.ts:111` (`MMenuPlacement`, `bottom-start`) | — |
| A | generic `TItem` выводится из `items` (S1) | нет | `dropdown/index.vue:175` (`generic`) + `:201` `defineProps(mDropdownProps)`, где `items: readonly DropdownItemBase[]` (`props.ts:84`); типовой `MDropdownProps<TItem, TValue>` (`props.ts:130`) SFC не использует — `TItem` выводится из `defineModel` (`:205`). Ждёт ответа S1 | M |
| Q30 | скрытые поля формы | сделано | `index.vue:157-165`, `utils/dropdown/formValues.ts`, `tests/form.spec.ts` | — |
| Клав. | APG select-only | сделано | проба `select-keyboard`: ↓ открывает (`aria-activedescendant` → `option`), End / Home, typeahead `c` → Cherry, `bl` → Blueberry, disabled Damson пропущен, PgUp, Enter выбирает и закрывает, Alt+↓ открывает на значении, Esc закрывает с фокусом в поле, Space открывает; очистка возвращает фокус | — |
| Г2 | запись Q2 / Q3 в `decisions.md` | нет | записан только Q1 (`decisions.md:89`); галочка в конце и полстроки не записаны | S |
| Г3 | панель клампится у края окна | частично | проба `panel-edge`: у нижнего края (окно 800 и 420) панель переворачивается вверх и остаётся в окне; кламп высоты по свободному месту не сделан — в `composables/popover/usePopover.ts:239` только `position-try-fallbacks` (B4.2a). **[занят]** | M |
| Г6 | рендер переснят | нет | `renders/dropdown/current.webp` — 2026-10-07 | S |

Токены: совпадают 9 из 11. Disabled-строка — роли (`list/item/_states.scss:36-56`); форма строки и движение панели — работа планов списка и popover, здесь не проверялись.

## inputs/autocomplete.md — тег `partial` → факт `частично` (тег верен; «Ш6 не сделан» устарело)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | начальное значение с первого рендера, включая SSR | сделано | `useAutocomplete.ts:179`; SSR-проба: `value` без JS = Berlin / Copenhagen / Amsterdam | — |
| Аудит 10-23 | асинхронные `items`: id вместо заголовка до blur | сделано | `useAutocomplete.ts:234` (watch на `displayTitle`); проба `audit-async`: до загрузки «2» (запасная строка, `decisions.md:76`), после загрузки «Berlin» без blur | — |
| Ш2 | toggle по ролям, `aria-busy` | сделано | проба: toggle `error` → на hover `on-error-container`, в disabled 38 %; `aria-busy` — общий `useDropdownControl.ts:275` | — |
| Ш3 | панель и строки (общие с dropdown) | сделано | axe открытой панели — 0 (light / dark, RTL) | — |
| Ш4 | `#hint`, `clear` в `#no-results` (Q2→1, Q3→1) | сделано | `Panel.vue:62-110`; проба: с `#hint` после «b» видно «Type 1 more»; без `#hint` панель не открывается ни по вводу, ни по toggle — «No results» не показывается (Q-4) | — |
| Ш5 | `openOnFocus: 'pointer'` (Q4→2) | сделано | `props.ts:54`, `useAutocomplete.ts:205,216-224`; проба: Tab в поле — закрыта, клик — открыта на значении | — |
| Ш6 | чипы | сделано | W17-Б, общий `Chips.vue` | — |
| Ш7 | ошибка загрузки | отменён | Q-11 (рецепт) | — |
| Ш8 | тесты | сделано | `tests/{variants,interaction,a11y,form,remote}.spec.ts` | — |
| B6.3 | удалённый поиск (прогон 2) | сделано | проба: «b» → панель открыта с «Loading options», через 400 мс строки Berlin / Dublin; «zzz» → «No results» | — |
| IME | композиция | частично | Enter внутри композиции не выбирает (`utils/keyboard/ime.ts`, проба: модель пуста). Дефект: после завершения композиции панель сама не открывается. В Chromium итоговый `input` приходит до `compositionend` (проба: `compositionstart → input(composing) … → input(composing) → compositionend`), а `onInput` при `composing` выходит (`useAutocomplete.ts:161-163`); `onCompositionend` (`:209`) только снимает флаг. Открывает только следующая клавиша (↓ → 東京). MSearch так делает: `utils/search/useSearchControl.ts:240` | S |
| A | generic `TItem` (S1) | нет | `autocomplete/index.vue:211` + `:239` `defineProps(mAutocompleteProps)`. Ждёт S1 | M |

Токены: совпадают 3 из 3. Кламп панели и рендер — общие пункты dropdown (Г3, Г6).

## inputs/search.md — тег `done` → факт `частично` (тег неверен). WIP владельца: только статус, без предложений
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | строка: один слой, кольцо только с клавиатуры, очистка без резерва, отступ у края по последней части, без `v-model:focused` | сделано | `search/index.vue:8,10,43,327,370-402` (`:has()` + `@supports not selector(:has(*))`), `props.ts` (нет `focused`) | — |
| Ш2 | контекст и движок | сделано | `utils/search/{useSearchControl,context}.ts` | — |
| Ш3 | `MSearchList`, `MSearchListItem`, `items` | сделано | `components/ui/search/list/**`, `utils/search/items.ts`, общий фильтр `utils/dropdown/matchRows.ts` | — |
| Ш4 | docked-вид | частично | на `MMenu` (`index.vue:147`); проба axe: `aria-required-children: .ui-menu__surface`; e2e `search.e2e.ts:264-267` с `test.fail()`. После Q16-Б `MMenu` — только для меню (`decisions.md:151`) | M |
| Ш5 | inline-вид | сделано | SSR-проба: inline-вид рендерится сервером (533rem) | — |
| Ш5 | рецепт полноэкранного поиска | нет | в репозитории кита нет (docs_v2 вне репо не проверялся); концепт рисует полноэкранный вид от кита | S |
| Ш6 | демо CRM / Orders с результатами | нет | `playground/app/demo/crm/shell/CrmAppBar.vue:19-37`, `orders/OrdersAppBar.vue:24-30` — только строка, без `items` и слота | S |
| Ш7 | тесты и документация | частично | `index.spec.ts`, `view.spec.ts` — не по эталону `tests/{variants,interaction,a11y}`; docked axe — `test.fail` | M |
| Г3 | без зашитых английских строк | сделано | `props.ts` (`messages` без дефолтов), dev-предупреждения `index.vue:240-247` | — |
| Правило | файл ≤ 400 строк | частично | `components/ui/search/index.vue` — 459 строк | S |

Токены: таблица плана без расхождений не проверялась пробой (WIP).

## inputs/confirm-edit.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Q1 | композабл + рецепт (вариант 2) | сделано | `decisions.md:35` | — |
| Ш1 | `useConfirmEditTransaction` (`saved \| cancelled \| conflict \| error`, `AbortSignal`) | сделано | `composables/confirm-edit/useConfirmEditTransaction.ts` + spec (в прогоне зелёный); `draft` — глубокий ref (`decisions.md:195`) | — |
| Ш2–Ш4 | компонент, `presentation`, тексты | отменён | `decisions.md:35` | — |
| Рецепт | описание решения и рецепта | сделано | `components/ui/confirm-edit/README.md`; рецепт в docs_v2 вне репо не проверялся | — |

## inputs/otp-input/index.md — тег `done` → факт `частично` (тег неверен только по рендеру)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | `min-width: 0`, без `--complete`, `font-size: medium` | сделано | `otp-input/index.vue:214-219,284-287`, классы корня без `--complete` (`:158-168`); проба: в grid / flex / узкой колонке 200 корень = 200rem, переполнения нет; шрифт нативного инпута 16px | — |
| Ш2 | роли кромок | сделано | `otp-input/_index.scss:45-55`, `_cells.scss:56-80`; проба: ячейка с символом `outline`, пустая `outline-variant`, у outlined фона нет | — |
| Ш3 | ось `variant` (Q1→1) | сделано | `props.ts:52`, `_index.scss:45-80`; фикстура `matrix` (3 варианта × 4 состояния); проба — только outlined | — |
| Ш4 | `placeholder` → `OtpCell.hint` | сделано | `useOtpControl.ts:197,222`, `index.vue:46-50` | — |
| Ш5 | `mask: false \| 'last' \| 'always'` (Q2, Q3) | сделано | `props.ts:31,54`, `useOtpControl.ts:176-201`; проба: «7» видна сразу и скрыта «•» через 1.3 с | — |
| Ш6 | фокус полного кода | сделано | `--caret-past` (`index.vue:156-164`); проба: после 6 цифр класс есть, активной ячейки нет | — |
| Ш7 | вид `loading` (Q4→1 с поправкой) | сделано | `MLoading inline` в строке сообщения (`index.vue:87-95`) | — |
| Ш8 | `required`, `path` → `useField` | сделано | `props.ts:61,73`, `useOtpControl.ts:171,287,297` | — |
| Ш8 | `density` (Q5→1) | отменён | `decisions.md:90` | — |
| Ш9 | тесты | сделано | `tests/{variants,interaction,a11y}.spec.ts`, e2e: grid / flex, роли кромок, `--complete` | — |
| Пов. | каретка, вставка, RTL | сделано | проба: ←, Home, End и Backspace двигают активную ячейку вслед за кареткой; вставка `123-456`, ` 12 34 56 `, `١٢٣٤٥٦` → `123456` (Q34), `12a456` → `12456`; `dir=rtl`: ряд `direction: ltr`, первый символ в левой ячейке | — |
| Г6 | рендер переснят | нет | `renders/otp-input/current.webp` — 2026-10-07 | S |

Токены: совпадают 8 из 8.

## inputs/otp-input/field.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Г1 | роли кромок ячейки | сделано | проба `states › otp` (см. index Ш2) | — |
| Г2 | плейсхолдер в пустых ячейках, не в значении | сделано | `index.vue:46-50` (только при пустом символе), атрибут `placeholder` на инпут не ставится (`useOtpControl.ts:197`) | — |

## inputs/otp-input/group.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Г1 | не вылезает из grid / flex-колонки | сделано | проба `otp-number › grid and flex`: корень и `visual` ≤ 200rem во всех трёх случаях | — |
| Г1 | «ячейки сжимаются квадратом» | частично | ячейка широкой раскладки 48×48, а сжатая — не квадрат: grid 200 → 26.0×31.0rem, flex [4, 4] в 200 → 17.5×31.0rem. Высоту держит автоминимум `aspect-ratio`-бокса по содержимому (line-height 28 + две кромки), `_cells.scss:28-45` | S |

## inputs/otp-input/separator.md — тег `done` → факт `сделан` (тег верен; в аудите 10-23 был «частично»)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Г1 | разделитель по центру ячеек и не ярче приглушённых | сделано | `otp-input/_index.scss:73-77`, `index.vue:271-273`; проба: в disabled цвет разделителя = цвету символа ячейки (on-surface 38 %), смещение центра −0.01px | — |

## Регрессии

Нет. Дефекты аудита 2026-10-23 по группе закрыты и подтверждены пробами: id вместо заголовка у autocomplete до blur, яркий разделитель OTP в disabled.

## Планы с неверным статусом (тег → факт, одна строка почему)

- `search.md`: `done` → частично. Docked на `MMenu`, axe `aria-required-children` (e2e `test.fail`), демо без результатов, тесты не по эталону, `index.vue` 459 строк.
- `otp-input/group.md`: `done` → частично. Сжатые ячейки не квадратные (17.5×31 и 26×31rem).
- `text-field.md`, `number-input.md`, `otp-input/index.md`: `done` → частично. Не переснят только рендер (Г «рендер переснят»).
- `textarea.md`: `done` → частично. Рендер не переснят, запись Q1 в `decisions.md` не сделана.
- `dropdown.md`, `autocomplete.md`: тег `partial` верен, но текст устарел. «Не сделаны шаг 3 и шаг 4 / шаг 6» — сделаны в прогоне 2 (Q16-Б, W17-Б). Реально открыты: S1, кламп высоты, задержка индикатора (S6), IME-открытие, рендер.

## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные

Нет. Все Q планов группы отвечены («Заметки реализации»). У владельца открыты S1 (generic `TItem`, рекомендация Б) и S6 (задержка индикатора, рекомендация Б), обе с рекомендацией.

## Пункты в занятых родителем файлах

- `components/ui/text-field/index.vue`, `components/ui/textarea/index.vue` (+ `tests/a11y.spec.ts`): нет dev-предупреждения о безымянном поле (находка прогона 2) — **чинит родитель**. Пунктов этих планов, не сделанных в занятых файлах, нет.
- `composables/popover/**`: кламп высоты панели dropdown / autocomplete по свободному месту (dropdown Г3, B4.2a) — `[занят]`.

## Пробы (файл → тесты → прошло/упало, ключевые измерения)

Папка `playground/probes/plans-audit-2/fields/`, прогон `--output test-results/plans-audit-2/fields`: 40 тестов, 39 прошло, 1 упал — это находка IME.

- `geometry.probe.ts` → 9 / 9:
  - text-field 44 / 56 / 64; number-input filled = text-field при каждой плотности; stacked внутри коробки; скраб − значение = 0.01rem;
  - строка поддержки 16.01 и зазор 4 у трёх полей; underline Δ = 0;
  - float: смещение 0, переход только `color`; inset outlined: лейбл внутри, вырез 0 (text-field и number-input);
  - textarea 1 / 3 строки; строки dropdown = высоте поля.
- `states.probe.ts` → 5 / 5:
  - каретка, error+hover `on-error-container` (text-field и textarea), disabled 38 %, outlined disabled прозрачный (textarea и number-input);
  - зона на границе 3.04 % / 38 %; единица: галочка и `secondary-container`;
  - стрелка и toggle по ролям; строки 0.08 / 0.1 + кольцо; панель `surface-container` / 4rem / тень;
  - OTP: роли кромок, разделитель = символ, 16px.
- `select-keyboard.probe.ts` → 4 / 5:
  - APG dropdown и autocomplete: Tab не открывает, клик открывает;
  - async items: «2» → «Berlin» без blur; удалённый поиск открывается на позднем ответе, есть «No results»;
  - **IME упал**: после композиции `expanded=false`, открывает только ↓.
- `otp-number.probe.ts` → 7 / 7: каретка ↔ активная ячейка, вставка с санитайзом, RTL, grid / flex без переполнения (ячейки 26×31 / 17.5×31), `mask: 'last'`, spinbutton, скраб ±10 на 40px (LTR / RTL), колесо инертно.
- `ssr.probe.ts` → 3 / 3, JS выключен:
  - `[data-fixture-ready]` на сервере нет (0);
  - заголовки autocomplete и dropdown есть в серверном HTML; лейбл float на 15rem;
  - number «42», единица MiB, `aria-valuetext` «512 MiB»; OTP «123456»; textarea 3.00 строки; search строка 56rem, inline-вид 533rem.
- `axe.probe.ts` → 3 / 3: открытые панели dropdown и autocomplete — 0 нарушений (light / dark, RTL); search docked — `aria-required-children: .ui-menu__surface`.
- `panel-edge.probe.ts` → 2 / 2: у нижнего края панель переворачивается и остаётся в окне (800 и 420).
- `misc.probe.ts` → 6 / 6:
  - лейбл number-input не движется;
  - короткий запрос autocomplete: с `#hint` — «Type 1 more», без `#hint` панель закрыта;
  - разделитель OTP по центру;
  - dropdown: read-only не открывается, очистка возвращает фокус, текст строки −1.5rem от значения, чипы с `aria-label="Remove …"` и `tabindex=-1`.
- `helpers.ts` — разрешение ролей и замеры в rem (не проба).

## Добавленные фикстуры

- `playground/fixtures/autocomplete/audit-async.vue` — значение до `items` (кнопка «Load items»), удалённый поиск с ответом через 400 мс, поле для IME (東京 / 京都).
- `playground/fixtures/number-input/audit-bounds.vue` — значение на `max` (filled и outlined), скраб 0–100, свободное поле.
