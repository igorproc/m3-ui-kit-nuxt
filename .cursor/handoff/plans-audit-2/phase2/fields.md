# fields — фаза 2

## Сделано (пункт → что изменилось → файлы)

1. **autocomplete, IME (топ-8).** После `compositionend` панель открывается сама: обработчик повторяет «намерение» ввода (`wantList()` — флаг + решение в `nextTick` по `canOpen()`). Причина дефекта: `v-model` текстового поля молчит во время композиции и шлёт свой `input` на `compositionend` раньше обработчика автокомплита, когда флаг `composing` ещё стоит. → `composables/autocomplete/useAutocomplete.ts`; unit `autocomplete/tests/remote.spec.ts` («opens the panel once a composition ends»); e2e `fixtures/autocomplete/autocomplete.e2e.ts` («a finished IME composition opens the list it typed», CDP, только Chromium).
2. **S1 = Б, generic `TItem`.** SFC объявляют `defineProps(mDropdownProps as MDropdownPropsOptions<TItem, TValue>)` / `defineProps(mAutocompleteProps as MAutocompletePropsOptions<TItem, TValue>)`. Новый тип `TypedPropsOptions<TRuntime, TTyped>` заменяет `type` у ключей, объявленных в `MDropdownProps` / `MAutocompleteProps`; дефолты — только в runtime-объекте. Движку props отдаются как `DropdownControlConfig`. В шаблоне `TItem` выводится из `items` (слоты, `select` / `remove`, резолверы, `filter`). → `components/ui/dropdown/{props.ts,index.vue}`, `components/ui/autocomplete/{props.ts,index.vue}`; тесты: `dropdown/tests/helpers.ts` (`base` — `Record<string, unknown>`), `autocomplete/tests/remote.spec.ts` (из `h()` с пустым `items` убраны бесполезные `itemTitle` / `itemValue`).
3. **otp-input/group, квадрат.** `min-height: 0` у ячейки снимает автоминимум блока с `aspect-ratio` по содержимому — сжатая ячейка квадратная. → `assets/stylesheet/components/otp-input/_cells.scss`; e2e `fixtures/otp-input/otp-input.e2e.ts` («squeezed cells stay square» × narrow / grid-column / flex-row).
4. **time-picker.**
   - EN-04: `defineOptions({ inheritAttrs: false })` + `useControlAttrs`; корень — обёртка (`class`, `style`), `role="group"` с ARIA переехал на `ui-time-picker__body`, туда же — атрибуты потребителя.
   - Период: две `MButton` (как кнопки `MButtonGroup`) с классами `ui-button--selected` / `--unselected` и ARIA радио из `getPeriodAttrs`; цвета и форма — новые ветки карты `period.unselected` / `period.selected` (`container.color`, `content.color`, `shape`; `weight` у выбранного) поверх схемы кнопки составным селектором; форма статична (без пропа `selected` — без пружины). Слой hover/focus, рипл, кольцо фокуса, disabled — семьи кнопок; forced colors выбранного — `Highlight`.
   - N1: `touch-target(block)` на опции; на `pointer: coarse` вертикальная колонка раздвигает зазор 4 → 8 (`period.coarse.gap`), чтобы мишень соседа не заходила в коробку опции; горизонтальный ряд держит 4.
   - Disabled: снят `opacity` тела и токен `disabled.opacity`; новая ветка карты `disabled.*` — 38 % каждой роли (как date-picker), миксин `parts.disabled`; forced colors — `GrayText`.
   → `components/ui/time-picker/index.vue`, `components/fragments/time-picker/period/index.vue`, `assets/stylesheet/components/time-picker/{_index,_parts}.scss`; unit `time-picker/tests/{a11y,variants,interaction}.spec.ts`; e2e `fixtures/time-picker/time-picker.e2e.ts` (disabled ролями; мишень периода horizontal и «stacked options keep apart»).
5. **color-picker.**
   - N6: образец палитры — инлайн `background-color` (без `--m-color-picker-swatch`); alpha-полоса и превью оставлены как исключение «динамический цвет значения» (журнал), шахматка — существующий миксин `checker`.
   - Canvas: Shift + стрелка ±10 локально (`axisController` в `Canvas.vue`, снап — `createRangeKeyboardController.snap`, общий контроллер не тронут); кольцо фокуса на `__thumb`, не на поле.
   - N7 = 1: подписи каналов — буквы без «%», «%» стал единицей поля (`unit` у `MNumberInput`, `aria-valuetext` «52 %»).
   - Образцы: `touch-target` по обеим осям, на coarse зазор 8 → 16 (`swatches.coarse.gap` = 48 − 32); hover — слой `::before` 8 % (`swatches.layer.hover`), `scale` остался под `no-preference`.
   → `components/fragments/color-picker/{Swatches,Canvas,Edit}.vue`, `assets/stylesheet/components/color-picker/_index.scss`; unit `color-picker/tests/{variants,interaction}.spec.ts`; e2e `fixtures/color-picker/color-picker.e2e.ts` (кольцо на бегунке, Shift ±10, слой hover, мишень на таче).
6. **color-input.** Цвет образца — инлайн `background-color` на новом узле `ui-color-input__swatch-color`; шахматка — фон самого образца (`checker($picker, none)`); `--m-color-input-swatch` удалён. → `components/ui/color-input/index.vue`; unit `color-input/tests/variants.spec.ts`.
7. **file-upload/item.** Кнопкам действий добавлен класс `ui-file-upload__action` рядом с модификатором. → `components/fragments/file-upload/Item.vue`; unit `file-upload/tests/variants.spec.ts`.
8. **Записи в журнал:** textarea Q1 (TA-Q1), dropdown Q2 (DD-Q2) и Q3 (DD-Q3) — `decisions-fields.md`.
9. **Планы `inputs/*`:** `<implementation-status>` переписаны по правде у text-field, textarea, number-input, otp-input/{index,group}, dropdown, autocomplete, time-picker, date-picker, color-picker/{index,canvas,edit,swatches,preview}, color-input, file-upload/item — все `done`, `updated="2026-10-30"`; у text-field / textarea / number-input / otp-input / dropdown / autocomplete пометка «рендер не переснят — инфраструктура съёмки вне git»; у dropdown / autocomplete — «кламп высоты панели отложен (Q56-А, B4.2)». В «План работ» помечены **отменено**: text-field 8 и reveal, number-input 9, otp-input density, date-picker 7–8, time-picker 6 и сжатие циферблата в 7, dropdown 5 (ошибка загрузки, задержка индикатора), autocomplete 7; в «Готово» dropdown рендер — **отложено**.

Попутно: `file-upload/tests/a11y.spec.ts` «names the progress bar after its file» упал из-за параллельной правки `MProgressLinear` (ARIA ушла с корня на `role="progressbar"`, группа feedback); проверка перенесена на `[role="progressbar"]` строки — смысл теста тот же.

## Решения (ID → вариант → основание) — те же строки, что в журнале

См. `.cursor/handoff/plans-audit-2/decisions-fields.md`: F-01 (IME), S1 (Б), F-02 (OTP `min-height: 0`), F-03 (time-picker EN-04, группа на `__body`), F-04 (период на `MButton` + ветки `period.unselected/selected`), F-05 (мишень периода и зазор 8 на таче), F-06 (time-picker disabled ролями), N6 (инлайн у образца; alpha/превью — исключение), F-07 (color-input: узел цвета поверх шахматки), F-08 (мишень образцов, зазор 16), F-09 (hover-слой + scale), F-10 (Shift ±10 локально), F-11 (кольцо на бегунке), N7 (1), F-12 (BEM действий), TA-Q1, DD-Q2, DD-Q3, B4.2 (отложено), S6 (Б).

## Ломающие изменения и миграция

- **`MDropdown` / `MAutocomplete` (только типы).** Резолверы `itemTitle` / `itemValue` / `itemDisabled` типизированы как `keyof TItem | (item: TItem, index) => …`, `filter` — от `TItem`. В шаблоне `TItem` выводится из `items` — опечатка ключа теперь ошибка типа. В `h(MDropdown, …)` и `mount(MDropdown, { props })` вывода нет: `TItem` = `DropdownItemBase`, и ключ кроме `id` не проходит типы. Миграция: шаблон или props, собранные как `Record<string, unknown>`. Внутри кита потребителей с `h()` нет (vue-tsc чистый).
- **`MTimePicker`.** `role="group"`, `aria-*`, `id`, `data-*` и слушатели потребителя — на `.ui-time-picker__body`, а не на корне; корень берёт только `class` / `style`. Кто искал группу как корень (`wrapper.element`), ищет `[role="group"]`.
- **Период `MTimePicker`.** Опция — `MButton` (`ui-button`); класс `ui-time-picker__period-option--selected` удалён → `ui-button--selected` / `--unselected`. Ключи карты `period.shape`, `period.color.{container,label}`, `period.selected.{container,label}` → `period.unselected.{container.color,content.color,shape}`, `period.selected.{container.color,content.color,shape,weight}`; `disabled.opacity` → ветка `disabled.*`. Вид: нажатие — рипл вместо слоя 12 %; disabled периода — роли семьи кнопок (12 / 38 % on-surface), а не 38 % от своих цветов.
- **`MColorPicker`.** Подписи каналов «A %», «S %», «L %» → «A», «S», «L» с суффиксом «%»; `aria-valuetext` каналов-процентов теперь «52 %». Кастом-свойство `--m-color-picker-swatch` удалено (цвет инлайном).
- **`MColorInput`.** `--m-color-input-swatch` удалено; цвет — на `ui-color-input__swatch-color`.
- **На `pointer: coarse`:** зазор образцов color-picker 16 (был 8), зазор вертикального периода 8 (был 4).

## Не сделано и почему

- Кламп высоты панели dropdown / autocomplete — отложен (Q56-А, кирпичик B4.2, `usePopover` — не мой файл).
- Рендеры `current.webp` — инфраструктура съёмки вне git (§6 отчёта).
- Мишень 48 у полос hue / alpha color-picker (40) — в пункте 5 названы только образцы (N1: «только образцы color-picker и период time-picker»).
- Задержка индикатора (S6 → Б), ошибка загрузки (Q-11) — отменены решениями.
- Тип-тест вывода `TItem` (vitest typecheck) не добавлен: вывод подтверждает `vue-tsc` по существующим фикстурам и демо с `item-title="name"`.

## Вопросы (развилки без рекомендации)

1. **`h()` / `mount` у `MDropdown` после S1.** Без вывода generic ключи-резолверы кроме `id` не проходят типы.
   1) Оставить, как сейчас (строгие ключи в шаблоне; для `h()` — props как `Record<string, unknown>`). Цена: render-функции без кастов не пишутся.
   2) Ослабить резолверы в `MDropdownProps` до `string | (item: TItem) => …`. Цена: опечатка ключа в шаблоне снова не ловится.
   Рекомендация: 1 — шаблон основной путь кита; сделано по 1.
2. **Readonly-период time-picker.** `MButton` рисует рипл и на readonly-опции (слой hover скрыт правилом `--readonly`); убрать рипл можно только мягким disabled или правкой `MButton`. Рекомендация: оставить — нажатие ничего не меняет, фокус остаётся.

## Правки вне моих файлов, которые нужны

- `docs/system/{ru-RU,en-US}/decisions.md` — свести строки журнала `decisions-fields.md` (делает оркестратор). Запись B6.3a (`decisions.md:182`) дополнить: «после `compositionend` панель решает так же, как после ввода».
- `src/runtime/composables/menu/useMenuControl.spec.ts:76-78` — vue-tsc TS2345 (группа menu), не мой.

## Проверки (команда → результат; что упало и почему)

- `npx vitest run <13 папок группы> --coverage.enabled=false` → 33 файла, 605 тестов; 1 упал (`file-upload/tests/a11y.spec.ts`, параллельная правка `MProgressLinear`), тест переведён на `[role="progressbar"]`, повтор файла → 17 / 17.
- `npx eslint <мои папки и e2e>` → 0 ошибок.
- `npx stylelint <мои .vue и .scss>` → 0 ошибок.
- `npm run lint:scss` → 163 стиля, без депрекаций.
- `npx vue-tsc --noEmit` → 3 ошибки, все в `composables/menu/useMenuControl.spec.ts` (чужие); в файлах группы — 0 (до правки базово было 8 чужих: демо, timeline, checkbox — сейчас исправлены другими).
- `npx playwright test playground/fixtures/{autocomplete,otp-input,time-picker,color-picker,color-input,file-upload,dropdown} --output test-results/p2/fields` → 229 тестов: 228 прошли, 1 упал — `color-input.e2e.ts:48` («the picker takes its own arrow keys…»): клик перехватывал `<vite-error-overlay>` (ошибка сборки в чужих параллельно правимых стилях, не код теста); повтор одного теста → 1 / 1 прошёл. Новые e2e группы (IME, квадрат OTP, disabled и мишень периода, кольцо на бегунке, Shift ±10, hover-слой, мишень образцов) — в прошедших.

## Не проверено

- Глазами не смотрелось (по правилу владельца браузер сам не открываю): период time-picker на `MButton` (вид в светлой / тёмной теме, forced colors), disabled time-picker ролями, суффикс «%» в узких каналах color-picker (3 в ряд при 280), образец color-input с узлом цвета поверх шахматки, раздвинутые ряды на таче.
- IME проверен только в Chromium (CDP) и в unit; Firefox / Safari — нет.
- SSR первого кадра time-picker после переноса группы на `__body` — только unit (role/aria в разметке); серверный HTML пробой не снимался.
