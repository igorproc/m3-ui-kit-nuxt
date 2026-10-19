# Prod-only override корня дочернего компонента: аудит и фиксы, 2026-10-19

## Класс дефекта

Родитель ставит свой BEM-класс на корень дочернего kit-компонента и задаёт свойство, которое задаёт и
корневое правило ребёнка, с той же специфичностью. В dev листы идут в порядке импорта (побеждает
родитель), в prod-сборке чанки грузятся в другом порядке (побеждает ребёнок). Правило из памяти:
override пишется составным селектором блока родителя (`& &__x`, `&.ui-surface`), который перевешивает
ребёнка.

## Почему составной селектор, а не `:where()` на MSurface

`:where(.ui-surface…)` опускает правила MSurface до (0,0,0). Тогда их перебивает или равняется с ними
любой тег/универсальный селектор из reset-а потребителя: Tailwind preflight `* { border-width: 0 }`,
`button { background-color: transparent }` при `tag="button"`. Пропал бы волосок `outlined` или заливка
`filled` — та же ошибка порядка, только у потребителя и вне контроля кита. Плюс это правка публичного
примитива для всех потребителей сразу. Составной селектор локален, и оба файла (alert, banner) уже
использовали `&.ui-surface` / `&--tonal.ui-surface`.

## Исправлено в этой сессии

| Компонент → ребёнок | Что ломалось в prod | Фикс |
| --- | --- | --- |
| MAlert → MSurface | `display: flex` против `.ui-surface { display: block }` | `display` перенесён в `&.ui-surface` |
| MBanner → MSurface | `display: grid` против `block`; `--tonal` фон `surface-container-high` против `.ui-surface--plain` `surface` | `display` — в `&.ui-surface`; варианты — `&--surface.ui-surface`, `&--tonal.ui-surface`. Forced-colors рамка теперь без вложенного `&.ui-surface`: тот же вес, что у `border-width: 0` корня, и стоит после него в том же листе |
| MBanner close → MButtonIcon → MButton | `color: on-surface-variant` (0,2,0) против `.ui-button.ui-button--text` (primary) и `.ui-button--current.ui-button--text` (inherit), обе (0,2,0) | `&.ui-surface &__close` (0,3,0), включая блок `prefers-reduced-motion` |
| MBreadcrumbs item link → MButton (text) | `.ui-breadcrumbs__link.ui-button` (0,2,0) `color` против `.ui-button.ui-button--text` (0,2,0) | `& &__link.ui-button` (0,3,0) |
| MOtpInput → MLoading (inline) | `.ui-otp-input__loading` `color` против `.ui-loading` (primary) и `.ui-loading--inline` (inherit), все (0,1,0) | `& &__loading` |
| Dropdown panel → MList | `padding-block` против `.ui-list` — сегодня то же значение (8rem), но из разных токенов | `& &__list` (латентный случай) |

Важно на будущее: цвета вариантов MButton уже весят два класса (`.ui-button.ui-button--text`), поэтому
override цвета кнопки требует трёх.

## Все найденные override корня ребёнка и их статус

Уже перевешивают, действий нет:
- file-upload item progress (`&__item-content &__item-progress`), color-picker format
  (`&__value-row &__format`), dropdown panel progress (`& &__progress`) — исправлены ранее в прогоне.
- MAlert close → MButtonIcon: `.ui-alert--{variant}.ui-alert--{type} .ui-alert__close` (0,3,0) — цвет и
  outline; `.ui-alert > .ui-alert__close` — position.
- MButtonIcon → MButton: `.ui-button.ui-icon-button…` (0,2,0+) — padding, width, радиусы, высота.
- MButtonGroup / MSplitButton → MButton: правила группы (0,3,0+) против (0,2,0) кнопки.
- MFabMenu → кнопка (width, height, радиусы, фон, цвет), MPagination → MButton (padding),
  MColorPicker → MDropdown (width).
- MTimeline item → MSurface: общих свойств нет.

Не совпадают по времени, действий нет:
- file-upload choose (MButton / MButtonIcon outlined):
  `.ui-file-upload__dropzone--accepting|refusing .ui-file-upload__choose.ui-button` (0,3,0) против
  `.ui-button.ui-button--outlined.ui-button--disabled` (0,3,0). Зона не входит в drag-состояние, пока
  неактивна (`fragments/file-upload/Dropzone.vue:96`), поэтому оба правила не применяются одновременно.

Латентные (то же значение), оставлены:
- MBanner close `height: 40rem` против `.ui-button.ui-icon-button.ui-button--default` (0,3,0),
  `40rem`. До фикса всегда побеждала кнопка, теперь ничья с тем же значением. Токены разные
  (`banner close.size` и высота density кнопки).
- MLoading `&__expressive { display: block }` против корня MShape `display: block`.

Ребёнок побеждает и в dev (другой класс дефекта, не исправлено, ждёт решения):
- MSearch clear: `.ui-search__clear { color: icon.color }` (0,1,0) проигрывает
  `.ui-button--current.ui-button--text { color: inherit }` (0,2,0) в любой сборке — иконка берёт
  `input.color` корня, правило мёртвое.
- MDatePicker mode, MSearch clear: `flex: 0 0 auto` против `.ui-button.ui-icon-button { flex-shrink: 0 }` —
  эффективно то же значение.

## Как искали

Сканер (`override-scan.mjs`, лежит в папке заметок сессий, в репозиторий не добавлен):
- компилирует все 127 SFC-стилей той же настройкой, что `shell/scss-smoke.mjs`;
- разбирает шаблоны через `@vue/compiler-sfc` и для каждого использования kit-компонента собирает классы
  элемента: статический `class`, литералы и шаблонные префиксы из `:class` (включая computed в скрипте и
  composables из `composables/` и `utils/`, например `rootClass` из `useButton`), объекты `v-bind` с
  `class:`, точку посадки при `inheritAttrs: false` + `v-bind="$attrs"` (menu, overlay), пропсы
  `*Class`, альтернативы `v-if` в корне, транзитивные корни (MAlert → MSurface, MButtonIcon → MButton);
- сопоставляет правила из всех листов (включая partial-ы, скомпилированные в другой SFC, как
  `file-upload/_parts.scss`), считает специфичность с `:where/:is/:not/:has` и сравнивает по longhand;
- для использований MButton модификаторы отфильтрованы по фактическим пропсам (таблица в скрипте).

Ограничения: модификаторы приближены сверху, предки в селекторе приближены, `:not()` в субъекте не
учитывается, использования в playground/docs не сканировались, классы из slot props
(`closeSlotProps.class`) проверены только через fallback-контрол.

## Изменённые файлы

- `src/runtime/components/ui/alert/index.vue`
- `src/runtime/components/ui/banner/index.vue`
- `src/runtime/components/fragments/breadcrumbs/item/index.vue`
- `src/runtime/components/ui/otp-input/index.vue`
- `src/runtime/components/fragments/dropdown/Panel.vue`

MSurface не менялся. Ничего не закоммичено.

## Проверки

- `npm run lint:scss` — 154 листа, без deprecations.
- `eslint` и `stylelint` по изменённым файлам — 0 ошибок.
- Полные `npm run lint` (91 ошибка) и `npm run lint:style` (582) красные из-за файлов вне задачи:
  `playground/render/{concept,gallery}` (исключены через `.git/info/exclude`), `coverage/*.css`
  (gitignore), `src/module.ts` (типографика владельца). Ни одна ошибка не в изменённых файлах.
- Повторный скан: после фиксов ни одной ничьей с разными значениями, кроме file-upload choose
  (не совпадает по времени, см. выше).
- Prod-сборка и e2e не запускались — нужно разрешение владельца.
