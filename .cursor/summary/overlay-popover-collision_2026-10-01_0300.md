# Overlay: flip/shift меню у краёв вьюпорта (фазы 0–1 плана overlay-top-layer)

**Дата:** 2026-10-01
**Репозиторий:** `kit`
**План:** `.cursor/plans/feature/overlay-top-layer.md` (фазы 0–1 из 6)

## Зачем

Аудит «MDialog, MMenu, MTooltip vs v-dialog, v-menu, v-tooltip»: у `MMenu` нет flip/shift у
края экрана.

- **Нативный путь** (`useMenu.menuStyle`) ставил `position-area`, но не задавал
  `position-try-fallbacks`, поэтому браузеру некуда было переворачивать меню.
- **JS-путь** прибивал меню к `rect.bottom/left`. В `usePopover` flip и clamp уже были, но
  `useMenu` вызывал его как `usePopover(model)`, без `surface`, `placement` и `flip`.

## Что сделано

- **`composables/popover/placement.ts`** (новый). Чистые функции: `parsePlacement`,
  `placementToArea`, `computePopoverPosition`. Порядок: сначала переворот по главной оси,
  затем по поперечной (start↔end), в конце сдвиг внутрь вьюпорта. Каждая ось переворачивается,
  только если противоположная сторона реально помещается. Сюда же переехали типы
  `PopoverSide/Align/Placement/Rect`: из `usePopover` они больше не реэкспортируются, иначе
  Nuxt auto-import предупреждает о дубликатах.
- **`shared/utils/support.ts`** (новый). `supportsAnchorPositioning()` требует и
  `anchor-name`, и `position-try-fallbacks`: движок, который умеет anchor, но не умеет
  flip, уходит на JS-путь.
- **`usePopover`**:
  - нативный путь получил `position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline`
    (при `flip: false` не ставится);
  - JS-путь считает позицию через `computePopoverPosition`;
  - вьюпорт берётся как `documentElement.clientWidth/Height`, без полосы прокрутки;
  - размер поверхности меряется через `offsetWidth/Height`: layout-размер не искажается
    `scale()` во время анимации появления.
- **`useMenu`**. Тонкий адаптер: `origin → placement` (`*right*` → `bottom-end`,
  `top/bottom/center` → `bottom`, иначе `bottom-start`), опциональные `trigger` и `surface`
  пробрасываются в `usePopover`, наружу добавлен `reposition`. `position-area` в нативном пути
  остался прежним.
- **`MMenu`**. Сам больше ничего не меряет: удалены `updatePosition`, `onMounted` и
  слушатели scroll/resize — их взял на себя `usePopover`. Меряется обёртка `.ui-menu`
  (`$positioned`), а не `__surface`, потому что анимация масштабирует именно `__surface`.

- **`MMenu` scroll-lock**. Новый prop `lockScroll` (по умолчанию `true`): пока меню открыто,
  блокируется прокрутка страницы через общий `useScrollLock` с подсчётом ссылок (тот же, что у
  `MOverlay`), поэтому меню внутри модалки при закрытии не разблокирует страницу. Требование
  было ещё в `.cursor/plans/feature/vuetify-run/overlay.md` («одинаковые scroll-lock semantics
  в dialog, sheet и menu»).
- **Лаб-страница `docs_v2/app/pages/lab/overlay.vue`** + `components/lab/overlay/MenuTrigger.vue`.
  Переключатели origin, content (short/wide/tall), match-width, lock-scroll. Показывает,
  какой путь позиционирования выбран. Есть сетка 3×3 в потоке, кнопки, прибитые `fixed` к
  краям экрана, реальные потребители (dropdown, autocomplete, color-input, number-input/unit)
  и запас высоты для прокрутки.

## Тесты

- `placement.spec.ts`: flip у каждого края, оба угла, горизонтальные стороны, смещение
  (offset), центрирование, сдвиг, когда не помещается нигде, `flip: false`, ещё не измеренная
  поверхность.
- `menu/index.spec.ts`: +2 теста — в нативном пути есть try-fallbacks; без поддержки
  fallbacks включается JS-путь.
- **Ловушка.** В окружении nuxt/happy-dom `vi.spyOn(CSS, 'supports')` не доходит до `CSS`,
  который видит модуль (`window.CSS !== globalThis.CSS`), а happy-dom отвечает `true` на всё.
  Нужен `vi.stubGlobal('CSS', …)`. Старый тест `uses the anchor width…` проходит только
  благодаря этому `true`.
- Полный прогон: 103 файла и 1105 тестов зелёные. `eslint .` — 0 ошибок.
- `vue-tsc`: единственная ошибка `menu/index.spec.ts(25)` была и на `main` до изменений.

## Не сделано / дальше

- Ограничение высоты по доступному месту **отложено**: при `max-height: 100%` от области
  `position-area` меню сжимается, а не переворачивается. Нужен отдельный скролл-контейнер
  у поверхности, согласовать вместе с `--m-dropdown-panel-max-height` дропдауна.
- `--ui-menu-origin` (transform-origin анимации) не меняется после flip. Можно поправить
  через `@container anchored(fallback: flip-block)` (Chrome 143+) как прогрессивное улучшение.
- Флаги поддержки popover и `closedby` появятся в фазах 2 и 4, когда станут нужны.
- Визуальная проверка — за пользователем: меню у правого и нижнего края, dropdown,
  autocomplete, color-input, number-input/unit; в Chrome (нативный путь) и в браузере без
  anchor (JS-путь).
