# Menu: FSM composable + teleport host + emit-based outside-click

**Дата:** 2026-06-04
**Затронуто:** `ui/menu`, `composables/menu`, `core/global-container`, `ui/dropdown`, `ui/button/split`

## Проблема
`UiMenu` телепортился в `<body>`, из-за чего:
- surface рендерился прижатым к левому краю вьюпорта (две причины: `position-area: bottom left` уводил бокс влево от триггера; CSS `.ui-menu--absolute { width: 100% }` растягивал контейнер на всю ширину вьюпорта);
- лаг и наезд на header при скролле (нет управляемого стекинг-контекста, потеря theme-scope вне `<body>`);
- дублирующийся `onClickOutside` в `Menu` и в `Dropdown` конфликтовал.

## Решение (по образцу разделения ответственности из `0/packages/0/src/components/Checkbox`)

### 1. Чистый FSM-composable `composables/menu/useMenu.ts`
- DOM-free state machine (как `composables/slider/createSlider.ts`): держит `status` (`closed | opening | open | closing`), позиционную математику (`menuStyle`), детект CSS Anchor, генерацию `anchorName` (через `useId`).
- `model` — единственный источник правды; `status` лишь анимационный guard, поэтому `close()`/`open()` срабатывают даже посреди незавершённой анимации.
- Транзиентные `opening`/`closing` снимаются хуками `onAfterEnter`/`onAfterLeave` (`<transition>` в компоненте).
- `originToArea()` чинит `position-area`: `bottom span-right` (left-origin) / `bottom span-left` (right) / `bottom` (центр) — surface выравнивается по краю триггера и растёт вниз, а не уезжает влево.

### 2. Компонент `ui/menu/index.vue` — только DOM
- Замер `getBoundingClientRect` триггера, listeners `scroll`/`resize` (`useEventListener`), `onClickOutside`, установка `anchor-name` на триггер — всё в компоненте.
- Телепорт в `#ui-overlay-host` (обычный `to`, **без `defer`** — см. ниже).
- `v-if` surface привязан к **`modelValue`** (не к status-computed): иначе во время `closing` элемент не удалялся, leave-анимация не запускалась, `onAfterLeave` не срабатывал → `status` навсегда застревал в `closing` (меню «не закрывалось / открывалось только одно»).
- `onClickOutside($menu, …)` принимает **ref**, а не `.value`: surface за `v-if`, при setup `null`; vueuse резолвит элемент в момент клика. Раньше регистрация в `onMounted` по `$menu.value === null` молча не вешалась.
- `defineOptions({ inheritAttrs: false })` + `v-bind="$attrs"` на `.ui-menu`: у компонента 2 корня (anchor + teleport), иначе Vue ругается «Extraneous non-props attributes (class)…». Так класс потребителя (`ui-dropdown__menu`) корректно ложится на surface-обёртку.
- Меню автономно: при outside-click эмитит `click-outside` И само закрывается (если `closeOnBackdrop`). Триггер передаётся в `onClickOutside({ ignore })`, чтобы повторный клик по триггеру тогглил, а не давал double-fire.
- CSS `--absolute`: `width: 100%` → `width: max-content` (`match-width` переопределяет инлайн-шириной).

### ⚠️ Почему НЕ `<teleport defer>`
`defer` (Vue 3.5) рассчитан на таргет, рендерящийся позже в ТОМ ЖЕ шаблоне. С таргетом в другом дереве он ронял патч из watcher-коллбэка: `Cannot read properties of null (reading 'emitsOptions')` в `shouldUpdateComponent`. Решение — гарантировать существование таргета порядком монтирования (хост первым в `app.vue`), а `defer` убрать.

### 3. Attach-хост `app/app.vue`
- `<div id="ui-overlay-host">` добавлен **первым дочерним узлом в `app.vue`, вне `<client-only>`**.
  - Почему не в `global-container`/`core-scope`: тот лежит в `<client-only>` последним, монтируется ПОСЛЕ `MMenu` → `<teleport>` не находил таргет. Хост в `app.vue` присутствует в SSR-разметке и монтируется раньше любого меню.
- `position: fixed; inset: 0; z-index: z('dialog')`, без transform/filter (fixed-дети резолвятся от вьюпорта → нет containing-block trap, нет лага/наезда на header).
- `pointer-events: none` на слое, `> * { pointer-events: auto }` — клики ловят только сами surface.

### 4. Потребители
- `ui/dropdown`: удалён собственный `onClickOutside` + `dropdownRef`; добавлен `@click-outside="isOpen = false"`.
- `ui/button/split` (`UiSplitButton`, где меню реально используется): удалён `v-click-outside`; добавлен `@click-outside="closeMenu"`. Попутно объединена дублирующая сигнатура emits `click|dropdown` (был lint-error `unified-signatures`). Из `&__menu-container` убраны layout-офсеты (`position/top/right/margin-top`) — меню телепортируется и позиционируется само; класс теперь реально доходит до `.ui-menu` (из-за `inheritAttrs:false`), и старый `top:100%` ломал бы fixed/anchor-позицию.

## Статус
- `npm run lint` и `npm run lint:style` — 0 ошибок по затронутым файлам.
- Проверено в браузере: позиционирование dropdown и split-button menu — корректное.
- Исправлено по итогам ревью в браузере: краш `emitsOptions` (убран `defer`), «не закрывается / открывается только одно» (v-if на `modelValue`), не работавший outside-click (ref в `onClickOutside`), warning про class (`inheritAttrs:false`).
- ⚠️ Требуется повторная визуальная проверка: закрытие по клику снаружи / по триггеру / по выбору пункта, переключение между двумя меню, поведение при скролле.

## TODO / возможные доработки
- Рассмотреть `opening`/`closing` для блокировки повторных триггеров, если потребуется строгий guard (сейчас намеренно разрешён re-open посреди анимации).
- Унести `z('dialog')` слой в общий список z-index, если появятся другие overlay-хосты.
