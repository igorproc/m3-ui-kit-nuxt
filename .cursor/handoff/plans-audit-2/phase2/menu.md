# menu — фаза 2

## Сделано (пункт → что изменилось → файлы)

1. **Смонтированное открытым (Ш1-д6).** `<transition appear>`: enter-хук на первом рендере вызывает `showPopover()`,
   перемер и берёт блокировку прокрутки (только показанное меню держит `overflow: hidden`), снятие — при закрытии.
   Имя триггера разрешается и для смонтированного открытым. Тот же `appear` + перемер в `fragments/popover`.
   — `components/ui/menu/index.vue`, `components/fragments/popover/index.vue`.
2. **Триггер (A11-06).** Слот `#activator="{ props, isOpen, open, close, toggle }"`; `props` = `triggerAttrs`
   (`id`, `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` → id поверхности, только пока она в DOM,
   click → toggle, ArrowDown / ArrowUp → открыть на первом / последнем). Enter / Space — нативный клик кнопки,
   фокус на первый пункт. Без `#activator` работает прежний путь «родитель — триггер». На активатор переведены
   split-кнопка, единица number-input и меню «⋮» toolbar. — `ui/menu/{index.vue,types.ts}`,
   `ui/button/split/index.vue`, `fragments/number-input/Unit.vue`, `fragments/toolbar/overflow.vue`.
3. **`useMenuControl` на бэгах.** `triggerAttrs` / `menuAttrs` / `getItemAttrs` (чистая `menuItemAttrs`), свой
   watcher фокуса (запомнить → первый / последний пункт → вернуть). Ролей и `tabIndex` найденным кнопкам не
   раздаёт; пункты ищутся по роли, все вне Tab-порядка. `MMenuItem` берёт бэг из контекста меню
   (`components/ui/menu/context.ts`). Спека на анонимной разметке: без `class` / `data-*`, ARIA, клавиши,
   разметка без бэга не трогается. — `composables/menu/useMenuControl{.ts,.spec.ts}`, `ui/menu/item/index.vue`.
4. **Expressive (вопросы 4 → 1, 5 → 1).** `variant: 'elevated' | 'tonal'` (standard / vibrant). Без групп
   поверхность — одна группа: угол 16, `surface-container-low`, отступы 2 / 4, тень 2. С `MMenuGroup` —
   прозрачная колонка, группы через 2, углы 16 / 8 по позиции (линия между группами удалена). Selected —
   `tertiary-container` (vibrant — `tertiary`) + форма 12. Вид dropdown / autocomplete / color-input не
   изменился: их панель — `fragments/popover` со своей картой `popover`. `search` получает `--panel` (без отступов
   и предела ширины), свой фон / угол / тень он перекрывает как раньше. — `assets/stylesheet/components/menu/
   {_index,_colors}.scss`, `ui/menu/{index.vue,props.ts,group/index.vue}`.
5. **Строка пункта.** 44, подпись `body-large`, шорткат `label-small`, иконка→текст 8, иконки 20, вставка 4,
   форма 4 / края 12; слой состояний `::before` цветом контента (8 / 10 / 12, у disabled нет); forced colors:
   selected `Highlight` / `HighlightText`, disabled `GrayText`; `min-width: 0` у подписи + предел ширины 280
   (CT-03 / CT-04). Стили строки целиком в `MMenuItem`. — `ui/menu/item/index.vue`, `menu/_colors.scss`.
6. **z-index и origin.** `DEFAULT_Z_INDEX = '999'` удалён (z-index только из опции, у меню — тикет стека).
   `usePopover.placement` — фактическое размещение: JS-путь из `computePopoverPosition`, нативный —
   `observePlacement()` по прямоугольникам после раскладки. `--ui-menu-origin` и origin popover — от него.
   — `composables/popover/{usePopover,placement}.ts` (+ спеки), `composables/menu/useMenu.ts`.
7. **Фикстуры и e2e.** `playground/fixtures/menu/{matrix,stress}.vue`, `menu.e2e.ts` (35 тестов): axe по
   THEMES × DIRECTIONS и stress, переполнение на WIDTHS, смонтированное открытым → `:popover-open`, разметка
   триггера, Enter / Space / ArrowDown / ArrowUp, стрелки / Home / End / typeahead / Esc / Tab / Shift+Tab,
   disabled, геометрия и цвета Expressive, hover-слой, forced colors, reduced motion, RTL, переворот → origin,
   длинное слово, меню над модальным диалогом, 40 пунктов. Unit: `ui/menu/tests/*` переписаны под `MMenuItem`
   и активатор; добавлены «смонтировано открытым → `showPopover`», variant / grouped, `observePlacement`,
   `joinPlacement`, z-index и фактическое placement в `usePopover.spec.ts`.
8. **План.** `overlays/menu.md`: `<implementation-status state="partial">`, шаги помечены сделано / отложено.

## Решения (ID → вариант → основание)

| ID | Пункт | Решение | Основание |
|---|---|---|---|
| MN1 | вопрос 4 | `variant: Extract<MVariant, 'elevated' \| 'tonal'>` | рекомендация плана, O1 |
| MN2 | вопрос 5 | меню = группы; без `MMenuGroup` поверхность — одна группа | рекомендация плана, O1 |
| MN3 | признак групп | регистрация `MMenuGroup` в контексте, класс `--grouped` | без `:has()` и фолбэка |
| MN4 | бэги | пункты по роли, все `tabindex="-1"`, без roving | пункт 3, APG |
| MN5 | рецепт `.ui-menu__item` | не пункт меню, стили строки — в `MMenuItem` | план, без шимов |
| MN6 | Enter / Space | нативный клик; keydown — только стрелки | двойной toggle при отмене Space |
| MN7 | активатор | id из бэга → `getElementById` | старый путь остаётся |
| MN8 | смонтированное открытым | `appear`; блокировка в enter-хуке | пункт 1 |
| MN9 | `fragments/popover` | тот же `appear` | дефект класса в своём файле |
| MN10 | строка | 44 / 4 / 12 / 8 / 20; формы 4 / 12 / 12 | таблица плана |
| MN11 | цвета | standard / vibrant по плану, disabled 38 % | план; иконки vibrant — допущение |
| MN12 | слой | `::before` 8 / 10 / 12 | `craft.md` §1, S1 |
| MN13 | forced colors | `Highlight` / `GrayText`, рамки групп | план |
| MN14 | ширина | max 280, снимается `--matched` / `--panel` | CT-03 |
| MN15 | `search` | `--panel` | не менять WIP |
| MN16 | z-index | без литерала, из тикета | `craft.md` §12 |
| MN17 | origin | `usePopover.placement` | пункт 6 |
| MN18 | `surface.border.radius` | оставлен ради dropdown | компиляция чужих SFC |
| MN19 | split | якорь — корень, триггер — trailing | позиция не меняется |
| MN20 | unit | свой selected-цвет удалён | `number-input.md:98` |
| MN21 | toolbar | `MMenuItem` | Ш5-потреб |
| MN22 | кламп | не делать | Q56-А / B4.2 |

Полные формулировки — `.cursor/handoff/plans-audit-2/decisions-menu.md`.

## Ломающие изменения и миграция

- **Рецепт `button.ui-menu__item` больше не пункт меню** (MN5): меню не ставит роль, не превращает `disabled` в
  `aria-disabled`, не включает такой элемент в стрелки, стили строки грузятся вместе с `MMenuItem`.
  Миграция: `<MMenuItem label=… :disabled=… @select=…>` или бэг `useMenuControl().getItemAttrs()`.
- **Пункты без roving:** у всех `tabindex="-1"` (раньше первый — `0`).
- **Вид меню:** угол 4 → 16, фон `surface-container` → `surface-container-low`, отступы 2 / 4, пункт 48 → 44,
  подпись `label-large` → `body-large`, шорткат `body-small` → `label-small`, ширина ≤ 280 (кроме `matchWidth`),
  линии между группами нет (зазор 2).
- **`usePopover`** больше не пишет `z-index: 999` по умолчанию; новое поле возврата `placement`.
- **`useMenuControl`** (внутренний): опции `{ open, triggerId, menuId, surface, fallbackReturn, rendered?,
  labelledBy? }`, возврат `{ triggerAttrs, menuAttrs, getItemAttrs, hostsForeignWidget }`.
- **Number-input:** выбранная единица — `tertiary-container` вместо `secondary-container`.
- **Split:** нажатие на основное действие при открытом меню закрывает меню (раньше весь корень был триггером).

## Не сделано и почему

- Кламп высоты, запас 48 / 8, `ResizeObserver`, прокрутка группы — отложено Q56-А / B4.2 (бриф).
- Рецепт разделителя (`MDivider` в меню, отступ 12 / 2) и `min-height: 32` метки группы — заказчика в ките нет,
  в список промта не входило.
- База `useStack` 2000 → `z()` — файл вне группы (ниже).
- Документация DC-01…05 — docs_v2/v3 вне репо.

## Вопросы (развилки без рекомендации)

- Нет. Допущение: иконки vibrant — `on-tertiary-container` (строка плана «у vibrant иконки → `tertiary`»
  неоднозначна; если имелся в виду цвет иконок на hover / в selected, это одна строка в `-menu-variant`).

## Правки вне моих файлов, которые нужны

- `assets/stylesheet/components/dropdown/_index.scss:53` → `scrollbar-inset` читать из `../popover/index`
  (`surface.border.radius`, то же значение `extra-small`); затем удалить ключ `surface.border.radius` из карты
  меню (MN18).
- `assets/stylesheet/components/number-input/_index.scss:179-184` → удалить неиспользуемую ветку `unit.selected`.
- `assets/stylesheet/components/toolbar/_index.scss:74-79` → удалить неиспользуемый `menu.icon.size`.
- `composables/useStack.ts:86` → база z-index из шкалы (план, долг 5).
- `playground/app/demo/orders/{OrderRowActions,OrdersBulkBar,OrdersProfileMenu}.vue`,
  `playground/app/demo/crm/shell/CrmMenuItem.vue` → рецепт `.ui-menu__item` на `MMenuItem` (иначе без ролей,
  стрелок и стилей строки).
- `docs/system/{ru-RU,en-US}/behavior.md` («Пункты — `<MMenuItem>` и `<MMenuGroup>` или рецепт `.ui-menu__item`»)
  → без рецепта; `#activator` + `triggerAttrs`; сводка решений MN1–MN22 в `decisions.md`.

## Проверки (команда → результат; что упало и почему)

- `npx vitest run src/runtime/components/ui/menu src/runtime/composables/menu src/runtime/composables/popover
  src/runtime/components/fragments/popover src/runtime/utils/menu src/runtime/components/ui/button/split
  src/runtime/components/ui/number-input/tests/unit.spec.ts src/runtime/components/ui/toolbar
  src/runtime/components/ui/fab-menu src/runtime/components/ui/tooltip --coverage.enabled=false` → 25 файлов,
  441 тест, зелёно (первый прогон: 2 падения origin в happy-dom — нулевые прямоугольники читались как «снизу»;
  `observePlacement` теперь не читает неразложенную поверхность).
- `npx eslint <мои файлы и папки>` → 0.
- `npx stylelint <мои .vue и .scss>` → 0 (первый прогон: 10 × `selector-class-pattern` на плоских
  `.ui-menu__item-*`; заменены на `#{$b}__…`).
- `npm run lint:scss` → 163 / 163 (до паузы падали 6 SFC dropdown / autocomplete / search из-за удалённого
  `surface.border.radius`, MN18).
- `npx playwright test playground/fixtures/menu --output test-results/p2/menu` → 35 / 35 (1 перепрогон: клик по
  `aria-disabled` пункту Playwright считает «not enabled» — `click({ force: true })`).
- `npx playwright test playground/fixtures/{overlay,dropdown,autocomplete,color-input,button,number-input,toolbar,search,fab-menu}
  --output test-results/p2/menu` → 337 / 337 (search docked axe остаётся `test.fail()` — `role="menu"` вокруг
  listbox, WIP владельца).
- `npx vue-tsc --noEmit` → 3 ошибки в моей спеке (тип аргумента), исправлено; других ошибок в выводе не было.

## Не проверено

- JS-путь `observePlacement` / переворот без CSS anchor positioning в реальном браузере (Firefox / Safari) —
  e2e только Chromium; unit покрывает геометрию.
- Forced colors и reduced motion — эмуляция Chromium.
- Демо `playground/app/demo/**` с рецептом — не открывались (правка вне группы).
