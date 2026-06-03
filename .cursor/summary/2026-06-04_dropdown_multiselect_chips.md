# Dropdown: multi-select (`multiple`) + chips/slot display

**Дата:** 2026-06-04
**Затронуто:** `ui/dropdown`, `material/showcase` (демо)

## Запрос
Добавить мультивыбор: при включённом флаге меню не закрывается на клик по пункту (можно накликать несколько), а выбранные элементы отображаются чипсами с возможностью кастомизации через слот (обёртка-слот на каждый элемент).

## Решение — `ui/dropdown/index.vue`
- Новый проп **`multiple?: boolean`** (default `false`). В этом режиме `modelValue` — массив значений.
- `select()`: в `multiple` — тоггл членства в массиве и **меню остаётся открытым** (`return` до `isOpen=false`); в одиночном — как раньше (set + close).
- `isSelected()`: в `multiple` — `modelValue.includes(val)`.
- `remove(item)`: убирает значение из массива (для крестика на чипсе).
- `valueOf()` / `resolveItem()`: единая нормализация `value ?? id ?? raw`; `resolveItem` поднимает значение обратно до объекта-источника (сначала `items`, потом `options`) ради лейбла; неизвестные значения дают `{ value, label: String(value) }`.
- `selectedItems` (computed): резолвнутые выбранные записи для рендера чипсов.
- В триггер (`m-text-field`) `model-value` теперь `multiple ? '' : selectedLabel` — в мультирежиме инпут пустой, его место занимают чипсы.

### Слоты отображения выбранного
- `#selected` — переопределяет всю область чипсов, биндинги: `{ items: selectedItems, remove }`.
- `#chip` — обёртка на КАЖДЫЙ элемент, биндинги: `{ item, index, remove: () => remove(item) }`.
- Дефолт (если слоты не заданы): `m-chip variant="input"` с лейблом и трейлинг-иконкой `ICONS.close`, вызывающей `remove`.

### CSS
- Чипсы рендерятся в `#prepend` слоте поля. Поле — `pointer-events: none` (тоггл ловит обёртка), поэтому `&__chips { pointer-events: auto }`, иначе крестик не кликался бы.
- `&__field--multiple :deep(.ui-text-field__control) { height: auto; flex-wrap: wrap }` — поле растёт под чипсы и переносит их (`:deep` уже используется в этом не-scoped стиле для `.ui-menu__surface`).

## Демо — `material/showcase.vue`
Добавлен блок «Multi-select (Chips Slot)»: `<UiDropdown multiple variant="outlined" :options>` c `dropdownValMultiple = ref(['option1','option3'])`.

## Статус
- `npm run lint` (eslint) — 0 ошибок (есть pre-existing `no-explicit-any` warnings, унаследованные от исходного файла с `defineModel<any>`).
- `npm run lint:style` — 0 ошибок.
- ⚠️ Требуется визуальная проверка в браузере (см. ниже).

## Доп. правки (тот же день)

### `:focused` на поле триггера
- Добавлен computed `hasSelection` (`multiple` → есть чипсы; одиночный → есть `selectedLabel`) и `fieldFocused = isOpen || hasSelection`.
- В `m-text-field` прокинут `:focused="fieldFocused"` → label «всплывает» и поле в focused-виде, когда меню открыто ИЛИ есть выбранное значение. Заодно решает прежний нюанс с перекрытием label чипсами в мультирежиме.

### КЛЮЧЕВОЙ фикс: «открывается только один дропдаун»
- Симптом: открывался только первый (filled), остальные не реагировали.
- Причина (по консоли): **teleport hydration mismatch** (`hydrateTeleport` → `logMismatchError`). Несколько `<teleport to="#ui-overlay-host">` при SSR оставляют рассинхронные teleport-якоря (комментарии) в хосте; при гидратации корректно подключается только первый, остальные молча ломаются.
- Решение в `ui/menu/index.vue`: обернуть `<teleport>` в **`<client-only>`** — оверлеям SSR не нужен, якорей на сервере больше нет → нечему рассинхронизироваться. Anchor-div (для позиционирования) остаётся SSR-рендерным отдельным корнем.

## TODO / возможные доработки
- Типизация `any` в `select/isSelected/remove` — можно ужесточить дженериком, если потребуется убрать warnings.
- Не связано с задачей, но в консоли видны pre-existing warning'и в showcase: `MBadge` `max="99"` (надо `:max="99"`) и `MIcon name=undefined`.
