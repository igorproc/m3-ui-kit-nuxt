# Overlay: top layer + удаление vue-final-modal (фазы 2–6 плана overlay-top-layer)

**Дата:** 2026-10-01
**Репозитории:** `kit`, `docs_v2`, `docs` (только зависимость)
**План:** `.cursor/plans/feature/overlay-top-layer.md`. Фазы 0–1 описаны в `overlay-popover-collision_2026-10-01_0300.md`.

## Зачем

Нативный `showModal()` делает всю страницу `inert`, а сам диалог попадает в top layer. Поэтому
меню, тултип и snackbar должны тоже жить в top layer, иначе внутри модалки они оказываются под
затемнением и не кликаются. Заодно убран vue-final-modal (VFM): его API повторён в kit.

## Модальный слой (kit)

- **`MOverlay`**:
  - В режиме `modal` корень — `<dialog>`, открывается через `showModal()`.
  - В режиме `popover` и при `background: 'interactive'` корень — `popover="manual"`
    (без Popover API используется `dialog.show()` плюс z-index из стека).
  - Scrim и контент — обычные элементы внутри растянутого на весь экран `<dialog>`, каждый в
    своём `<transition>` (`overlayTransition` / `contentTransition`). Поэтому анимация выхода
    не зависит от CSS-свойства `overlay`, которое есть только в Chrome.
  - Корень рендерится через `teleport v-if`, а не `ClientOnly`: при SSR якорей нет.
- **Новые composables в `composables/overlay/`**:
  - `useOverlayLifecycle` — FSM `closed → opening → open → closing → closed`. Фаза завершается
    по хукам `<transition>`, а не по `transitionend`; `beforeOpen` и `beforeClose` можно
    остановить через `stop()`.
  - `useTopLayer` — `showModal()` / `showPopover()` / `show()`, все вызовы идемпотентны.
  - `useFocusTrap` — зацикливает Tab, фокусирует начальный элемент, возвращает фокус.
  - `useOverlaySwipe` — закрытие свайпом поверх `useDrag`.
- **Props** (`overlay/props.ts`, объект `mModalLayerProps`). Его разворачивают `MDialog`,
  `MSheet`, `MNavigationDrawer` и `MDialogDate`, а `pickModalLayerProps()` передаёт их дальше:
  - `displayDirective: 'if' | 'show'`, `hideOverlay`, `overlayBehavior: 'auto' | 'persist'`;
  - `overlayTransition`, `contentTransition`, `overlayClass`, `contentClass`;
  - `closeOnOutside`, `closeOnEscape`, `closeOnSwipe`, `swipeThreshold`, `showSwipeBanner`;
  - `persistent` важнее всех `closeOn*`;
  - `background`, `lockScroll`, `reserveScrollBarGap`, `preventNavigationGestures`, `parent`.
- **События:** `beforeOpen` / `beforeClose` (с `stop()`), `opened`, `closed`, `clickOutside`.
  Компоненты-обёртки их не объявляют, события проходят к `MOverlay` через fallthrough.
- **Esc:**
  - у модального `<dialog>` — нативное событие `cancel`; kit всегда делает `preventDefault` и
    закрывает, только если сам на вершине стека;
  - если браузер закрыл диалог принудительно, kit либо синхронизирует v-model, либо, при
    `persistent`, снова открывает диалог;
  - у немодальных оверлеев — глобальный keydown.
- **Каскадное закрытие:** `useModalContext` (бывший контекстный `useModal`). У `M3ModalContext`
  есть `status` и `close(): Promise`. Родитель закрывает детей, дожидается их и только потом
  закрывается сам. Если ребёнок отказался закрыться, родитель остаётся открытым.
- **Стек** хранится в `$material.overlays`, а не в скрытом `nuxtApp._m3OverlayStack`. Добавлены
  флаг `modal` и `topModal`: он нужен для `overlayBehavior: auto`, когда затемняет только
  верхняя модалка.
- **Программные модалки:**
  - `useModal({ component, attrs, slots, defaultModelValue, keepAlive })` возвращает `{ id,
    status, options, open, close, patchOptions, destroy }` плюс хелпер `useModalSlot`;
  - `open()` резолвится при закрытии: `confirm` → payload или `true`, `cancel` → `false`,
    иначе `null`;
  - `$material.modal` (`composables/modal/createModalService.ts`) — это `get`, `open`, `close`,
    `toggle`, `closeAll` и реестры `modals`, `openedModals`, `openedModalOverlays`,
    `dynamicModals`; реестр хранит только принадлежность, без статуса;
  - хост — `core/global-container.vue`, заменил `ModalsContainer`.
- **Компоненты:**
  - `MNavigationDrawer` — на `MOverlay`, сдвигается сама поверхность (токены `motion.*`);
  - `MSheet` — закрывается свайпом вниз через `closeOnSwipe: 'down'`, своего drag больше нет;
  - `MDialogDate` — на `MOverlay`, стиль `.ui-date-dialog-backdrop` удалён;
  - `MDialog` — роль и `aria-modal` теперь на нативном `<dialog>`.
- **Top layer для остальных:**
  - `MMenu` и `MTooltip` — `popover="manual"`, вызов `showPopover` в хуке `@enter`;
  - `MTooltip` — на `usePopover` (flip/shift, CSS anchor), держится при наведении
    (WCAG 1.4.13, задержка 100 мс), токен `content.max-width`, перенос строк;
  - `MSnackbar` — `popover="manual"` и заново поднимается в top layer, когда открывается новая
    модалка.
- **Удалено:**
  - плагин `vue-final-modal.client.ts` и его регистрация в `module.ts`;
  - `stylesheet/vendors/` — в `_modal.scss` было правило `.ui-navigation-drawer` со scrim-фоном;
  - зависимость `vue-final-modal` в `kit` и в `docs`;
  - `openModal()`.
- **`useScrollLock.lock(reserveScrollBarGap)`** — отступ под полосу прокрутки теперь
  опциональный.

## Правка: куда телепортируются плавающие поверхности

- **Проблема.** Тултип и меню всегда телепортировались в `#ui-overlay-host`. Пока открыт
  модальный `<dialog>`, всё вне его поддерева инертно, popover'ы в top layer тоже. Поэтому
  тултип и меню внутри диалога рисовались поверх, но не получали ни наведения, ни кликов.
  Вдобавок внутри popover-оверлея они наследовали `pointer-events: none`.
- **Решение.** `composables/overlay/useOverlayTarget.ts`: `MOverlay` через provide/inject
  отдаёт свой корень, а `MTooltip`, `MMenu`, `MSnackbar` и вложенный `MOverlay` берут цель через
  `useOverlayTeleportTarget()`. Порядок выбора: ближайший оверлей → `#ui-overlay-host` →
  `body`. Snackbar вне оверлея остаётся в `body`, как раньше, — это стабильно для SSR.
  Плавающим поверхностям явно задан `pointer-events: auto`.
- **Попутно.** `popover` привязан через `:popover.attr`. Как DOM-свойство Vue записывал на
  модальный `<dialog>` строку `popover="undefined"`, а атрибут при `undefined` просто снимается.

## Правка: snackbar, ловушка фокуса в меню, scroll lock без CLS

- **`MSnackbar`** рендерится только на клиенте и телепортируется так же, как остальные
  оверлеи: в ближайший оверлей, иначе в `#ui-overlay-host`. Раньше он уходил в `body`.
  Хак с `onMounted` ради гидрации атрибута `popover` больше не нужен.
- **Ловушка фокуса (правило пользователя).** Она только переводит фокус на сам контейнер и не
  выпускает из него Tab. Внутренним фокусом распоряжается компонент.
  - `MMenu` подключает `useFocusTrap($menu, { initialFocus: surface })`, после чего сам
    фокусирует первый пункт; стрелки, Home/End и Esc — его зона.
  - Если в меню чужой виджет (listbox дропдауна), ловушка не включается: фокус остаётся в поле.
  - `getFocusableElements` пропускает `tabindex="-1"`, иначе меню с roving tabindex «текло».
  - Диалог не менялся: у пользователя там всё работало.
- **`useScrollLock`.** Взято у primetime.su (там `html { scrollbar-gutter: stable }` плюс
  блокировка VFM `overflow: hidden; padding-right` на `body`; этот padding добавлял лишний
  сдвиг на 4px).
  - Теперь блокировка — это `overflow: hidden` и `scrollbar-gutter: stable` на `<html>`.
    Ширина под полосу прокрутки остаётся зарезервированной, поэтому не сдвигаются ни контент,
    ни `position: fixed`-бары.
  - Без поддержки `scrollbar-gutter` используется прежний `padding-right` на `body`.
  - Если полосы прокрутки нет (overlay-скроллбары или страница не прокручивается), ничего не
    резервируется.
  - Новая проверка `supportsScrollbarGutter()` и спека `useScrollLock.spec.ts`.
  - Как на primetime.su: в `base/_scrollbar.scss` добавлен `html { scrollbar-gutter: stable }`,
    то есть место под скроллбар зарезервировано всегда. Это поведение по умолчанию для всех
    потребителей kit; docs_v2 его не переопределяет.

## Правка: ловушка фокуса на корне модалки и prop `trapFocus`

- **Ловушка `MOverlay` висела на `.ui-overlay__panel`, а не на корне.** Из-за этого Tab
  выпускал фокус в интерфейс браузера в двух случаях:
  - фокус стоял на самом `<dialog>` (после `showModal()` или клика по затемнению), и Shift+Tab
    шёл мимо обработчика;
  - фокус был в snackbar или меню, телепортированных в `<dialog>` рядом с панелью.
- **Исправление.** Ловушка вешается на корень. Начальный фокус не изменился: первый focusable,
  у пользователя в диалоге это работало.
- **`trapFocus`.**
  - У `MOverlay` (входит в `mModalLayerProps`): по умолчанию включено для модалки с
    неинтерактивным фоном; можно включить для popover-режима или `background: interactive`.
  - У `MSnackbar`, по умолчанию `false` — rich snackbar, как в Google Meet. При открытии фокус
    переходит на сам snackbar, Tab ходит по его действиям по кругу, при закрытии фокус
    возвращается назад.
- **Лаба.** Snackbar для диалога перенесён внутрь диалога: снаружи он был бы инертным. Добавлены
  отдельный snackbar на странице и переключатель `snackbar: trap-focus`.

## docs_v2

- Плейграунды (`playgrounds/navigation.ts`): `clickToClose` → `closeOnOutside`,
  `escToClose` → `closeOnEscape`, `scrim` → `hideOverlay`.
- `layout/base/aside/drawer/shell.vue`: удалены `:scrim` и `teleport-to`,
  `transition` заменён на `content-transition`.
- `server/generated/component-api*` перегенерирован командой `node scripts/sync-docs.mjs`.
- Лаба `/lab/overlay`, новая `components/lab/overlay/ModalSection.vue`:
  - диалог, внутри которого меню, тултип, snackbar и «диалог в диалоге» с третьим уровнем;
  - `useModal()` через `ConfirmDialog.vue`, `MSheet`, `MNavigationDrawer`;
  - переключатели `persistent`, `closeOn*`, `background`, `overlayBehavior`.

## Проверка

- kit: 105 файлов и 1122 теста зелёные.
- `eslint .` — 0 ошибок. `lint:style` — чисто. `lint:scss` — чисто; одна известная ошибка
  legacy-пути в time-picker была и до изменений.
- `vue-tsc`: новых ошибок нет (98 против 103 на `main`).
- Новые спеки: `overlay/index.spec.ts` (14 тестов), `modal/useModal.spec.ts`,
  `overlay/useFocusTrap.spec.ts`.
- Тесты оверлеев используют `global.stubs.transition = false` и ждут кадры: фазы жизненного
  цикла завершаются по хукам transition.
- docs_v2 (после `npm run build` в kit — тесты docs берут `kit/dist`): 104 из 106.
  - Упали `component-catalog` (раздел token-map) и `basic-playground` (`m-card` не
    резолвится).
  - Оба падения воспроизводятся и без правок docs_v2. К оверлеям не относятся.

## Breaking (для changelog)

- В `MDialog`, `MSheet`, `MNavigationDrawer`, `MDialogDate`: `clickToClose` / `escToClose`
  переименованы в `closeOnOutside` / `closeOnEscape`.
- В `MOverlay`: `scrim` → `hideOverlay` (с инверсией), `transition` → `contentTransition`;
  `teleportTo` удалён; события `click:outside`, `dismiss`, `after:enter`, `after:leave`
  заменены на `clickOutside`, `opened`, `closed`.
- `openModal()` удалён. Вместо него `useModal()` / `$material.modal`. Контекстный `useModal`
  переименован во внутренний `useModalContext`.
- Классы и переходы VFM (`vfm-*`, `.vfm__*`, `vue-final-modal/style.css`) исчезли.
- `MMenu`: `lockScroll` по умолчанию `true`.
- `MTooltip`: подсказка наводится курсором и переносит длинный текст.
- `MSheet`: вместо собственного drag используется `closeOnSwipe`.

## Осталось / риски

- **Визуально ничего не проверялось.** Нужна проверка в браузерах:
  - вложенные диалоги;
  - меню, тултип и snackbar внутри диалога;
  - Esc по слоям;
  - анимации выхода в Firefox и Safari;
  - swipe у sheet;
  - drawer справа.
- **Chrome закрывает диалог принудительно** при повторном Esc без user activation. На это
  есть обработчик `onNativeClose`, но в браузере он не проверен.
- **`useModal` с компонентом, который не пробрасывает `closed`** (то есть не построен на
  `MDialog`/`MOverlay`): `open()` никогда не резолвится. Это задокументировано.
- **Changelog-версия не создана**: номер версии решает пользователь.
