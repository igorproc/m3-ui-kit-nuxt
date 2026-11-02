# docs_v3 — обновление после фазы 2 (остановлено по слову координатора, 2026-10-30)

Работа остановлена по команде координатора «СТОП по docs_v3». Файл, который правился в момент
остановки (`number-input/accessibility.md` EN + RU), доведён до целого состояния. После этого в
`../docs_v3` ничего не правилось и не запускалось. В `../docs_v2` не трогалось ничего.

Правки делали родитель и пять форков: A — feedback + foundation, B — navigation + containment,
C — form, D — menu + overlays, E — fields. Список файлов собран по mtime (`find -newer` от начала
сессии, 17:34) и сверен с отчётами форков.

## Общее для всех файлов

- **Оригиналы нигде не сохранены.** docs_v3 — не git-репозиторий, резервных копий не делалось.
  Прежний текст частично остался только в транскриптах агентов (результаты `Read`).
- **Создан один файл:** `app/examples/tooltip/rich.vue`. Остальные существовали и изменены.
  Birth time у файлов сбит, потому что Edit/Write пишут атомарно, поэтому «создан» определено по
  отчёту форка, а не по `stat`.
- **`content/en/reference/decisions.md`** изменён в 19:11, но не нами. По брифу его пишет
  оркестратор; ни родитель, ни форки его не трогали — ни один отчёт форка его не называет.
- **Причины правок.** «ф2» — изменение кита фазы 2. «ранняя волна» — незакоммиченное изменение
  кита из волн до фазы 2 (sweep-run-2, kit-bugs, волна 10-24). Страницы писались 10-19/20 и
  разошлись с кодом и по ним, а бриф требовал привести затронутые страницы к коду целиком.

## Родитель

| Файл | Что поменялось | Причина |
|---|---|---|
| `content/changelog/0.6.0.md` | • `summary`: +1 предложение (меню, прогресс, модалки). • Строка про colour preview переписана: `--m-color-picker-preview`, `--m-color-picker-alpha`; у `--swatch-color` нет преемника (цвет инлайном, `.ui-color-input__swatch-color`); `--m-color-picker-swatch` / `--m-color-input-swatch` названы удалёнными. • **Breaking** +21 пункт: progress `shape` (`expressive`/`wavy` удалены), роль на индикаторе, слот = подпись + `value-text`, плоский трек у wavy; toolbar `layout`→`orientation`; рецепт `ui-menu__item` → `MMenuItem`/`getItemAttrs()`; пункты меню без roving; `usePopover` без `z-index: 999`; checkbox SVG-глиф; chip generic и мишени `removal="button"`; dropdown/autocomplete generic `TItem`; time-picker атрибуты на `__body`, период на `MButton`; подписи каналов color-picker; `swipeThreshold` в rem (56) + взмах; имя закрытия alert/banner; пустой snackbar; compact `MListItem` 60/76; DOM `MTable` (`__checkbox`, `__ring`, без `--ui-table-fade`); автоимпорты lazy/icon/surface/virtual-scroll. • **Features** +10: `MMenuItem`/`MMenuGroup`/`useMenuControl`, `#activator`, `variant`, `usePopover.placement`, `$material.modal.open(component, …)` + `closeTop/closeAll(reason)`, `MFormRenderer` `status-text`/`error-summary-title`/сводка, `MSelectionGroup` `rows` + `aria-disabled`, `activeIcon` у вкладок, все роли `MTimelineItem.color`, `clamShell`. • **Changes** +25 (вид прогресса и меню, split, number-input, icon-button, checkbox, slider, radio, dialog, overlay, tooltip, time-picker, color-picker, app-bar/nav-bar safe-area, rail, nav-bar warn, pagination, tabs, hotkey, lazy, shape, icon, virtual-scroll, file-upload). • **Fixes** +14. | ф2 (все отчёты phase2) |
| `content/en/components/number-input/accessibility.md` | • Таблица: `aria-valuetext` — число и за ним единица. • Callout «статичный `unit` не входит в `aria-valuetext`» заменён абзацем «единица звучит со значением ("12 kg"), и статичная, и выбранная». | Код `useNumberInputControl.ts:191-197` (на нём держится N7 color-picker, ф2); на HEAD этого не было |
| `content/ru/components/number-input/accessibility.md` | То же по-русски (строка таблицы и абзац вместо callout). | То же |

## Форк A — feedback + foundation

| Файл | Что поменялось | Причина |
|---|---|---|
| `content/en/components/progress/index.md` | Переписана: `density` вместо `size`; `shape="wavy"` (плоский трек); `max`, `value-text`; округление `aria-valuenow`; зазор 4 и stop, старт кольца в 12 по часовой, RTL; нет дефолтного `aria-label` (dev-warn); слот — подпись; роль и `aria-*` на внутреннем элементе | ф2 (S10, роль, подпись, геометрия) + ранняя волна (`density`, `max`, без дефолтного имени) |
| `app/examples/progress/wavy.vue` | `expressive` → `shape="wavy"` | ф2 |
| `app/examples/progress/sizes.vue` | `size` → `density` | ранняя волна |
| `app/examples/progress/setup-steps.vue` | `max` + `value-text` | ранняя волна |
| `content/en/components/loading/index.md` | `type="spinner\|shape"`, `density`, `contained`, роль `progressbar` вместо `status`, reduced motion | ф2 (contained shape) + ранняя волна |
| `app/examples/loading/{types,transitions,activity}.vue` | Новое API `type`/`density` | ранняя волна |
| `content/en/components/snackbar/index.md`, `accessibility.md` | Переписаны: `duration` (4 с / 10 с с действием), пауза при hover/фокусе, `dismiss`, `action-placement`, `#action`, `closable`/`close-label`; пустой `label` → не рисуется; постоянный live-region; `trap-focus` удалён | ф2 (пустой label) + ранняя волна |
| `app/examples/snackbar/{auto-dismiss,from-dialog,undo}.vue` | Убраны собственные таймеры (у снекбара свой `duration`) | ранняя волна |
| `content/en/components/alert/index.md`, `accessibility.md` | `color` вместо `type`, иконка серьёзности по умолчанию, `close-label` без дефолта, имя «`close-label`: заголовок», `return-focus`, корень `role="group"`, live-region | ф2 (имя закрытия) + ранняя волна |
| `app/examples/alert/{form-result,read-only,severity}.vue` | `type` → `color`, `close-label` | ранняя волна |
| `content/en/components/banner/index.md`, `accessibility.md` | `variant="plain"` вместо `surface`, имя закрытия с заголовком, `return-focus`, раскладка stacked | ф2 (имя, `--icon`) + ранняя волна |
| `app/examples/banner/{section-tonal,sync-off}.vue` | `variant="plain"`, `close-label` | ранняя волна |
| `content/en/components/badge/index.md` | `announce` (по умолчанию `off`), пустой бейдж не рисуется, многоточие | ранняя волна |
| `content/en/components/icon-button/index.md`, `accessibility.md` | Выбранная кнопка заливает `ic:outline-*` глиф; мишень 48 только на таче; `soft-disabled` | ф2 (W70-А) + ранняя волна |
| `app/examples/icon-button/toggle.vue` | Один `ic:outline-favorite`, заливку даёт `selected` | ф2 (W70-А) |
| `content/en/components/button/index.md`, `accessibility.md` | Мишень 48 только на таче, `soft-disabled` | ранняя волна |
| `content/en/components/icon/index.md` | Ключи `ICONS` как имя, dev-предупреждения о кривом и неизвестном имени, `filled`/`mirror`/`label`, класс `ui-icon__glyph` | ф2 (ICON-1/2) + ранняя волна |
| `content/en/foundations/icons.md` | Те же факты об иконках (заливка, предупреждения) | ф2 + ранняя волна |
| `content/en/foundations/motion.md` | Таблица reduced motion (морф формы ~100 мс) | ф2 (SH-6) |
| `content/en/components/shape/index.md` | 36 ключей (`clamShell`), reduced motion, проп `label` | ф2 (Ш1, Ш6) + ранняя волна (`label`) |
| `content/en/components/hotkey/index.md` | `label-medium`, нажатие `secondary-container` | ф2 (HK-1) |
| `content/en/components/lazy/index.md`, `accessibility.md` | Активатор `role="button"` только после монтирования; `aria-busy`, `fallback-delay`, `error-text`/`retry-label`, фокус на границе | ф2 (LZ-1) + ранняя волна |
| `app/examples/lazy/{comments,on-view}.vue` | Добавлены `error-text` / `retry-label` (иначе dev-warn) | ранняя волна |
| `content/en/components/app/index.md` | Пропы `skip-link-label`, `skip-link-target` | ранняя волна |

## Форк B — navigation + containment

| Файл | Что поменялось | Причина |
|---|---|---|
| `content/en/components/toolbar/index.md` | Переписан: `layout` → `orientation`; выбор при `multiple` или привязанном `v-model` (в т. ч. `undefined`), callout «решается при монтировании» удалён; `type` `floating\|docked`, `scheme`, `#fab`, `max-visible`/`more-label`, `aria-label`, поле пункта `ariaLabel`, `aria-pressed` | ф2 (S9, NAV2-12) + ранняя волна |
| `content/en/components/toolbar/accessibility.md` | `role="toolbar"` + `aria-orientation`, имя из пропа, Tab-стопы вместо стрелок, меню «ещё», forced colors | ранняя волна |
| `app/examples/toolbar/actions.vue` | `:layout` → `orientation`; Floating/Vertical/Docked + `scheme`; убран `role="group"` | ф2 + ранняя волна |
| `app/examples/toolbar/text-style.vue` | Убран `role="group"` (перебивал `role="toolbar"`) | ранняя волна |
| `content/en/components/app-bar/index.md`, `content/ru/components/app-bar/index.md` | Прибитая панель вне `m-layout` обходит safe-area (`content-box`, оговорка про `width: 100%`); medium/large типографика, удалён callout `center-aligned`, `align="center"` только у small, перенос заголовка, `scroll-behavior="collapse"`, `sticky` вне раскладки | ф2 (NAV2-01) + ранняя волна |
| `content/en/components/app-bar/accessibility.md`, `content/ru/components/app-bar/accessibility.md` | Корень `<header>` (в `m-layout-header` — `<div>`), `tag`, `heading-level`, копия заголовка `aria-hidden` | ранняя волна |
| `app/examples/app-bar/configurator.vue` | Выравнивание только для small | ранняя волна |
| `content/en/components/breadcrumbs/index.md`, `accessibility.md` | Нет дефолтного `aria-label` (dev-warn), scroll открывается на текущей крошке, затухание краёв, перенос в wrap | ранняя волна |
| `app/examples/breadcrumbs/custom.vue` | `aria-label` | ранняя волна |
| `content/en/components/navigation-bar/index.md` | Dev-warn 3–5 / 3–6; safe-area вне раскладки; `icon-placement`, `activeIcon`/`disabled`/`badge`/`badgeLabel`, `select` на каждое нажатие, высота 64, перенос подписи | ф2 (NAV2-02/03) + ранняя волна |
| `content/en/components/navigation-bar/accessibility.md` | Нет имени «Primary», без roving, бейдж `aria-hidden`, forced colors | ранняя волна |
| `app/examples/navigation-bar/phone.vue` | `badgeLabel` | ранняя волна |
| `content/en/components/navigation-drawer/index.md`, `accessibility.md` | `swipe-threshold` 56 rem + взмах; `side` `start\|end`, `items`/`section`, `v-model:current`, `select`, `#activator`, размеры, без имени-фолбэка, reduced motion | ф2 (OV-03) + ранняя волна |
| `app/examples/navigation-drawer/site-menu.vue` | `side` `start\|end`, `close-on-swipe` по краю | ранняя волна |
| `content/en/components/navigation-rail/index.md` | Переписан: вне раскладки — высота контейнера, ≤ `100dvh`; `MNavigationRailItem` удалён, `v-model:expanded`, `#header` с `toggleAttrs`, `mode`, `select`; anatomy на классы `ui-navigation-rail__item` / `ui-navigation-item*` (старые классы падали в спеке anatomy в baseline) | ф2 (NAV2-04) + ранняя волна |
| `content/en/components/navigation-rail/accessibility.md` | Переписан: Tab-стопы, `toggleAttrs`, модальная поверхность, бейдж | ранняя волна |
| `app/examples/navigation-rail/mail-shell.vue` | `v-model:expanded` + `#header` | ранняя волна |
| `app/examples/navigation-rail/anatomy.vue` | Комментарий про высоту вне раскладки | ф2 |
| `content/en/components/pagination/index.md`, `accessibility.md` | Мишень 48 только по блоку, зазор не нажимается; нет английских дефолтов (dev-warn), `page-label`, `aria-disabled` на границах, фокус на текущую, kebab-ключи слот-`props`, RTL-шевроны | ф2 (NAV2-07) + ранняя волна |
| `app/examples/pagination/{archive,results,window}.vue` | Подписи контролов; archive — `v-bind="control"` + `soft-disabled` | ранняя волна |
| `content/en/components/tabs/index.md`, `accessibility.md` | Переписаны: `activeIcon` и залитая пара глифа, бейдж + `badgeLabel`; `hierarchy`, `layout`, `icon-placement`, `#tab`, имя tablist, route-табы `<nav>`, `aria-disabled`, RTL | ф2 (NAV2-09/10) + ранняя волна |
| `app/examples/tabs/{product-panels,issue-tabs}.vue` | `aria-label` | ранняя волна |
| `content/en/components/list/index.md` | Compact: отступ 6, подстрока без зазора → 60/76 | ф2 (N3) |
| `content/en/components/list/accessibility.md` | `scroll-margin` только у строк после липкого подзаголовка; `aria-current` у статичной `selected`-строки | ф2 (LS-1) + ранняя волна |
| `content/en/components/table/index.md`, `accessibility.md` | Compact-строка с чекбоксами 40; select-all mixed, `aria-disabled` в футере | ф2 (T-6) + ранняя волна |
| `content/en/components/timeline/index.md` | `color` — все роли `MColor` (info/success/warning); контейнерные `variant` дают отступы/форму | ф2 (S8) + ранняя волна |

## Форк C — form

| Файл | Что поменялось | Причина |
|---|---|---|
| `content/en/components/checkbox/index.md`, `accessibility.md` | Глиф — SVG-штрих; корень-обёртка, `v-model:indeterminate`, строка поддержки (`helper-text`, `error-message`, `error`, `required`, `#helper`, `#error`), `name` из `path`, `id` на инпут; убраны `loading` и устаревшие callout | ф2 (F2-01) + ранняя волна |
| `app/examples/checkbox/consent.vue` | На `error-message` | ранняя волна |
| `app/examples/checkbox/export-columns.vue` | «Выбрать все» с `:indeterminate` | ранняя волна |
| `content/en/components/radio/index.md`, `accessibility.md` | Смена `value` перерегистрирует, dev-warn безымянной группы; `label`, `mandatory`, `required`, строка поддержки группы | ф2 (F2-02/03) + ранняя волна |
| `content/en/components/switch/index.md`, `accessibility.md` | Нажатая ручка 28; ось `icons`, `#icon`, RTL, видимая ошибка, disabled ролями | ф2 (F2-04) + ранняя волна |
| `content/en/components/chip/index.md`, `accessibility.md` | Generic `value`; мишени 48 у кнопок `removal="button"`; `variant`, `removal`, `remove-label`, `remove`, `#avatar`, `#selected-icon`, `aria-pressed`, тултип обрезки | ф2 (F2-05/06) + ранняя волна |
| `app/examples/chip/recipients.vue` | `removal="button"` + `@remove` | ранняя волна |
| `content/en/components/chip-group/index.md`, `accessibility.md` | Фокус после удаления; `label`, `path`, строка поддержки, Tab к последнему чипу | ф2 (F2-07) + ранняя волна |
| `app/examples/chip-group/limit.vue` | `label` + `helper-text` | ранняя волна |
| `content/en/components/slider/index.md`, `accessibility.md` | Dev-warn `origin` у range, переходы гасятся только у частей кита; `density`, `origin="center"`, `format-value`, `path`, атрибуты на бегунки, без суффиксов start/end, RTL | ф2 (F2-08/09) + ранняя волна |
| `app/examples/slider/working-hours.vue` | Убран неверный комментарий | ранняя волна |
| `content/en/components/rating/index.md`, `accessibility.md` | `label`, `value-text`, строка поддержки, без английских дефолтов, readonly — Tab-стоп | ранняя волна |
| `content/en/components/selection-group/index.md`, `accessibility.md` | `rows` в scope `#default`, `aria-disabled` в `groupAttrs`; `pattern`, `selectAll` соблюдает `max` | ф2 (F2-10/11) + ранняя волна |
| `content/en/components/form-renderer/index.md` | Переписан: сводка ошибок (`error-summary-title`), `status-text`, dev-warn степперов `number`; `submit-label`, `v-model`, `submitted`/`invalid`, `textarea`, `select`, `props` радио на группу; убраны 5 устаревших ограничений | ф2 (F2-12…15) + ранняя волна |
| `content/en/guides/forms-and-validation.md` | Только раздел про renderer: пример, таблица типов, сводка, ограничения | ф2 + ранняя волна |

## Форк D — menu + overlays

| Файл | Что поменялось | Причина |
|---|---|---|
| `content/en/components/menu/index.md`, `accessibility.md` | Переписаны: `#activator`, `<m-menu-item>`, `<m-menu-group>`, `variant`, `placement`/`anchor`, Tab/Shift+Tab закрывают, typeahead, возврат фокуса, `useMenuControl()`; убраны `absolute`/`origin` и рецепт `ui-menu__item` | ф2 (MN1–MN22) + ранняя волна (`placement`) |
| `app/examples/menu/{overflow,sort}.vue` | `#activator` + `m-menu-item`; в sort — группы radio и checkbox | ф2 + ранняя волна |
| `content/en/components/split-button/index.md`, `accessibility.md` | Триггер — правая половина, пункты `<m-menu-item>`, клавиши и фокус | ф2 (MN5, MN19) |
| `app/examples/split-button/{save-options,send-reply,report-link}.vue` | `button.ui-menu__item` → `m-menu-item` | ф2 (MN5) |
| `content/en/components/number-input/accessibility.md` | Меню единиц через Menu (клавиши, галочка); `increment/decrement/unit-label` без дефолтов (+ правка родителя об `aria-valuetext`, см. выше) | ф2 + ранняя волна |
| `content/ru/components/number-input/accessibility.md` | То же по-русски | ф2 + ранняя волна |
| `app/examples/number-input/{units,controls,quantity}.vue` | `increment-label` / `decrement-label` | ранняя волна |
| `content/en/components/dialog/index.md`, `accessibility.md` | Scope `{ confirm, cancel, close }`, `cancel(reason)`, `role="alertdialog"`, `#title`, без английского имени, прокрутка тела, разделители при прокрутке, стопка действий, фокус на диалог / `autofocus` | ф2 (OV-01/02) + ранняя волна |
| `content/en/components/sheet/index.md`, `accessibility.md` | Свайп с ручки: порог 56rem, 125rem/с, slop 8rem; `ariaLabel`; ручка только при свайпе; высота и прокрутка | ф2 (OV-03) + ранняя волна |
| `content/en/components/overlay/index.md`, `accessibility.md` | Scrim 50% при `prefers-contrast: more`; запасная прокрутка (оговорка Safari < 17.6); `swipeThreshold` в rem, `swipeTarget`, `dismiss`; у popover нет `aria-haspopup` | ф2 (OV-07/08) + ранняя волна |
| `content/en/components/tooltip/index.md`, `accessibility.md` | Переписаны: `variant` plain/rich, `subhead`, `placement`, `disabled`, `v-model:open`, слот `{ props }`; долгое нажатие, тап не показывает, один за раз; `aria-describedby` с монтирования, в SSR нет, у пустого нет | ф2 (OV-04…06) + ранняя волна |
| `app/examples/tooltip/rich.vue` | **Создан**: пример rich-тултипа | ранняя волна (документирование `variant="rich"`) |
| `content/en/guides/overlays-and-modals.md` | Результат `open()` `{ status, value \| reason }`, `close(reason?)`, `$material.modal.open(component, { props, slots, parent })`, `closeTop/closeAll(reason)` и `persistent`, `confirm()`/`alert()`, снекбар, меню и тултип | ф2 (OV-10…12) + ранняя волна |
| `content/en/guides/rtl-and-i18n.md` | Меню и тултип берут направление триггера; `origin` убран из «не зеркалится» | ф2 + ранняя волна |
| `app/examples/guides/dialog-flows.vue` | Убран `useTimer` (у снекбара свой таймер) | ранняя волна |
| `app/examples/guides/programmatic-modal.vue`, `app/examples/guides/parts/modal-confirm.vue` | Новый формат результата модалки | ранняя волна |
| `app/pages/wireframes/gemini.vue` | Меню моделей: `#activator` + `m-menu-item role="menuitemradio"` вместо `button.ui-menu__item` | ф2 (MN5) |
| `app/components/theme/Trigger.vue` | `absolute origin="top right"` → `placement="bottom-end"` | ранняя волна (`absolute`/`origin` удалены) |

## Форк E — fields

| Файл | Что поменялось | Причина |
|---|---|---|
| `content/en/components/time-picker/index.md` | Период — две `MButton` (выбранная `primary-container`, жирная, квадратные углы), на таче мишень 48 и зазор 8; disabled 38 % ролей; атрибуты на `.ui-time-picker__body`; таблица фраз без дефолтов («Needed»); в пример «In a dialog» добавлены `hour-label` / `minute-label` | ф2 (F-03…06) + ранняя волна (фразы) |
| `content/en/components/time-picker/accessibility.md` | Группа = `__body`, без «Select time», фразы без дефолтов, `GrayText` у disabled | ф2 + ранняя волна |
| `app/examples/time-picker/{anatomy,horizontal,hour-cycle,pickup,typed}.vue` | Подписи частей и тексты ошибок (иначе dev-warn) | ранняя волна |
| `content/en/components/date-picker/index.md`, `accessibility.md` | `mode-toggle` выключен по умолчанию, `pattern-letters`, фразы без дефолтов | ранняя волна |
| `app/examples/date-picker/anatomy.vue` | `mode-toggle` с подписями (чинит anatomy `ui-date-picker__mode`, падавший в baseline) | ранняя волна |
| `app/examples/date-picker/{busy-days,delivery,form}.vue` | Подписи календаря | ранняя волна |
| `app/examples/date-picker/dialog-field.vue` | `cancel-label` / `confirm-label` (кнопки были пустыми) | ранняя волна |
| `app/examples/date-picker/localised.vue` | `patternLetters` вместо `placeholder`, `mode-toggle` | ранняя волна |
| `content/en/components/color-picker/index.md` | Каналы буквами, `%` — единица («52 %»); образцы 32 с мишенью 48, hover-слой 8 %, зазор 16 на таче | ф2 (N7, F-08/09) |
| `content/en/components/color-picker/accessibility.md` | Shift+стрелка ±10, кольцо на бегунке, hover-слой | ф2 (F-10/11) |
| `content/en/components/color-input/index.md`, `accessibility.md` | Поповер `role="dialog"` с ловушкой Tab вместо `MMenu`, возврат фокуса Escape/кнопкой, непрозрачный образец без альфы | ранняя волна (+ ф2 F-07 косвенно) |
| `content/en/components/dropdown/index.md` | Generic `TItem` (опечатка ключа — ошибка типа, `h()`/`mount` — `Record<string, unknown>`); `messages.remove`; `menu-placement` логический (`'bottom-start'`); высота панели 6.5/5.5/4.5 строки, галочка в конце; проп `name`; убрана ссылка «Menu — поверхность панели» | ф2 (S1, DD-Q2/Q3) + ранняя волна |
| `content/en/components/dropdown/accessibility.md` | Чип множественного выбора (имя из `messages.remove`) | ранняя волна |
| `content/en/components/autocomplete/index.md`, `accessibility.md` | Тип элемента из `items`, `filter` от элемента, `name`, IME открывает панель, `messages.remove` | ф2 (F-01, S1) + ранняя волна |
| `content/en/components/otp-input/index.md` | Ячейка 48, в узкой колонке ячейки квадратные | ф2 (F-02) |
| `app/examples/dropdown/limit.vue`, `app/examples/autocomplete/multiple.vue` | `messages.remove: 'Remove {title}'` | ранняя волна |
| `content/en/getting-started/7.upgrading.md`, `content/ru/getting-started/7.upgrading.md` | Строка colour preview разбита: `--m-color-picker-preview`; `--swatch-color` — нет (инлайн, `.ui-color-input__swatch-color`); `--m-color-picker-alpha`. + строки: подписи каналов, класс периода → `ui-button--selected/--unselected`, `menu-placement`, `messages.remove`, generic, фразы пикеров без дефолтов, `mode-toggle`, атрибуты `MTimePicker` на `__body` | ф2 (N6, F-04, N7, S1) + ранняя волна |
| `content/ru/components/dropdown/{index,accessibility}.md`, `content/ru/components/autocomplete/{index,accessibility}.md` | То же, что EN | ф2 + ранняя волна |
| `content/ru/components/otp-input/index.md` | Абзац о квадратных ячейках | ф2 (F-02) |

## Правка осталась неполной относительно задуманного

- **`content/changelog/0.6.0.md`.** Пункты фазы 2 внесены. Изменения ранних волн, найденные форками,
  **не внесены**: это расширение scope, решение за оркестратором. Среди них:
  - menu: `absolute`/`origin` → `placement`;
  - `useModal().open()`: формат результата `{ status, value | reason }`;
  - progress: `size` → `density`, `max`, нет дефолтного имени;
  - loading: `type`, `density`, `contained`;
  - snackbar: `trapFocus` и новое API;
  - alert: `type` → `color`; banner: `surface` → `plain`;
  - toolbar: `type`, `scheme`, `maxVisible`;
  - app-bar, nav-bar, rail, drawer, pagination, tabs;
  - form-controls: строка поддержки, `path`;
  - date-picker: фразы и `modeToggle`;
  - dropdown: `menu-placement`, `name`, `messages.remove`;
  - color-input: поповер-диалог;
  - tooltip: новое API.

  Полные списки — в отчётах форков (транскрипты агентов). Progress записан от 0.5.0
  (`expressive` → `shape="wavy"`), а промежуточный `wavy` упомянут как «pre-release».
- **`app/components/theme/Trigger.vue`** — заменён только `placement`. Панель темы внутри
  `<m-menu>` сломана правками меню фазы 2: Tab закрывает меню, `max-width: 280rem` меньше ширины
  панели 360. Нужен выбор владельца:
  1. `<m-overlay mode="popover">` / `usePopover` — рекомендация форка;
  2. перекрыть ширину классом — Tab это не починит;
  3. оставить как есть.
- **Не начато (остановка):**
  - `content/en/foundations/color.md:79` (`<m-alert type="success">` → `color`);
  - `content/en/guides/app-shells.md:71` (`:expanded` → `v-model:expanded`);
  - `content/en/guides/migration.md:17` (алиас `center-aligned` уже удалён);
  - `content/en/guides/forms-and-validation.md`, таблица «What a bound field does»;
  - `content/en/guides/rtl-and-i18n.md`: стр. 29 — `MESSAGES`, стр. 54 и 127 — слайдер;
  - `content/en/components/layout/accessibility.md` — своя skip-ссылка, а у `<m-app>` есть встроенная;
  - RU `button/*`: `soft-disabled`, мишень на таче;
  - `content/en/components/search` — docked-вид WIP владельца;
  - `aria-label` у `m-tabs` / `m-breadcrumbs` в шелле и вайрфреймах.
- **Шелл docs:** `app/components/shell/` (рейл) — baseline-спека `Shell.nuxt.spec.ts` падает
  (`.ui-navigation-rail-item` 0 из 7). Шелл, видимо, на удалённом `MNavigationRailItem`. Не трогал.

## Проверки

- **Baseline до правок** (`npx vitest run`) — 7 упавших из 1256, все не от наших правок:
  - `shared/catalog.spec.ts` — пути `number-input/unit`, `navigation-rail/item`, `main`;
  - `kit-docs/components.spec.ts` — таймаут 5 с;
  - `kit-docs/tokens.spec.ts` — папка `slider`;
  - Anatomy `date-picker` (`ui-date-picker__mode`) и `navigation-rail` (`ui-navigation-rail-item*`) —
    позже исправлены форками E и B;
  - `Shell.nuxt.spec.ts` ×2.
- **Форки:**
  - `npx eslint` и `npx stylelint` по изменённым примерам → 0 у всех пяти;
  - `npx vitest run --project unit content.config.spec.ts content.mdc.spec.ts` → 570/570
    (A, C; D — 376 + 194);
  - E: Anatomy «picker» → 2/2, `examples.nuxt.spec.ts -t "time-picker|date-picker|dropdown/limit|autocomplete/multiple"` → 13/13.
- **Полный прогон после правок не выполнялся** (стоп): `npm run test`, `npm run lint`,
  `npm run lint:style` целиком и `examples.nuxt.spec.ts` по всем примерам. Особенно нужен
  `examples.nuxt.spec.ts` для примеров A, B, C, D и Anatomy rail.
- Grep после правок: удалённые имена (`ui-menu__item`, `MToolbarLayout`, `--m-color-*-swatch`,
  `ui-toolbar--layout`, `__period-option--selected`, `ui-table-fade`, `expressive`/`wavy` у
  progress, `layout=` у toolbar, `absolute`/`origin` у `m-menu`, порог свайпа 80 px) остались
  только в changelog и таблицах `7.upgrading.md` как «было → стало».
