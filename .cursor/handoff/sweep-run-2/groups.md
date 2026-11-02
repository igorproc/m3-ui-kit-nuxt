# Sweep run 2 — группы, зоны файлов и списки

Id пунктов — из `.cursor/handoff/kit-bugs/questions.md` (Q, приложения A/B) и аудита
`.cursor/handoff/sweep-run/plans-audit_2026-10-23.md`. «Q-А» = делать по рекомендации варианта А.
Пункты из Q56 «Крупные — в план кирпичиков» (B4.2 clamping, B4.9c сервис снекбаров, B5.1a ссылки rail/bar,
B5.6d клавиатура toolbar, B5.7d compact-пагинация, B5.8a click API крошек, B7.3c required у file-upload,
B6.10f onError, B2.3b, B13.3b) **не делаются**. P3 = шаги планов, ждут ответов на W-вопросы.

## G1 · Выбор и формы

Компоненты: checkbox, radio (+group), switch, chip, chip-group, slider (+`fragments/slider`, `composables/slider`),
rating, selection-group, selection-item, form-renderer (+`fragments/form-renderer`). Добавляет общий миксин
мишени 48 (S8) в `abstracts/_mixins.scss` и применяет его у своих контролов.

P2:
- B6.1b (ошибка у switch), B6.1c (`id`/`name`), B6.1d (default slot), Q28-Б (строка поддержки у checkbox/switch/radio),
  Q29-Б (убрать `loading`), B6.1f (indeterminate; по modern-web: `input.indeterminate`, убрать лишние `:aria-checked`
  у checkbox/radio/switch). **indeterminate у MCheckbox сделай первым** — его ждёт G5 (B9.2b).
- Радио: круглое кольцо фокуса (аудит). Чип: `aria-pressed` у отдельного filter-чипа (аудит), B8.9a, B8.9b, слой `::before`
  вместо смесей — только если нет W-вопроса. Chip-group: B8.9c, B8.9d.
- Rating: B8.10a, B8.10b (`pan-y`), английское имя (B8.5). Selection-group: B8.10c, Q45-А (док).
- Slider: N.9 (форматтер, `#value`, `ariaValuetext`), `touch-action` по оси (modern-web §3.2, click-jump на таче — на
  `pointerup`), B5.9b (RTL).
- Switch: B5.9d (RTL).
- Form-renderer: B6.10a, B6.10b, B6.10c, B6.10e, B6.10g, Q36-А (док).
- Hairline `max(1px, 1rem)` в своих файлах (B9.4 / B13.2d).
P3: планы checkbox, radio, switch, chip, chip-group, slider, rating, selection-group (W-вопросы группы «выбор»).

## G2 · Оверлеи и feedback

Компоненты: dialog (+`dialog/date` — только общая часть с dialog, пикер — G4), sheet, tooltip, overlay, menu,
`composables/modal`, `composables/overlay`, `composables/popover`, snackbar, progress, loading, badge, alert, banner.

P2:
- Menu (план заблокирован, но эти пункты одобрены): B4.1b, B4.1d, B4.1g, B4.1h, Q13-А, Q15-А, B4.1f (typeahead,
  Q56-А), Q26-А (+ логические слова в `placementToArea`, modern-web). Q14-А (`MMenuItem`/`MMenuGroup`) и Q16-Б
  (`fragments/popover`) — делать, если успеваешь; это L.
- Dialog/sheet: B4.4a, B4.4b (+ `overscroll-behavior: contain`), B4.5b, B4.5c, B4.5d, Q17-А, Q18-А, B4.6.
- Tooltip: B4.7b, B4.7c, Q19-В (по modern-web: поверхность всегда в DOM, `aria-describedby` постоянно через slot-props).
- Overlay: B4.8 (`omit` для popover-режима).
- Snackbar: B4.9a, B4.9b (статус-регион в том же teleport-таргете), Q20-А — **CSS снекбара твой**, публикацию инсетов
  на `:root` делает G3.
- Progress/loading: N.2, N.6, B8.8b (замедление, не `none`), B8.8c (`:dir(rtl)` без фолбэка), Q11-А (`size` → `density`;
  тип `MSize`/`MLoadingSize` убирает G6 по твоему сообщению), Q44-А.
- Badge: Q43-А, B8.7b, B8.7c. Alert/banner: B8.6a, Q41-А+В, Q42-А (док), B13.2b (после B13.2a от G6).
- Английские имена (B8.5) у progress, close, dialog, sheet.
P3: планы dialog, sheet, tooltip, overlay, modals, snackbar (длительность/пауза/закрытие), progress, loading, badge, alert, banner.

## G3 · Навигация, layout, оболочка, иконка

Компоненты: tabs, navigation-bar, navigation-rail, navigation-drawer, app-bar, toolbar, pagination, breadcrumbs
(+`fragments/breadcrumbs`, `fragments/tabs`), layout (+`composables/layout`, `useLayout.ts`), app, system-bar, icon,
main, container, row, col, spacer, responsive, `components/core`.

P1: новые спеки прошлой волны (tabs/preset, layout/main…) тоже переводятся в `tests/`.
P2:
- Найдено прошлой волной: rail вне aside в full-height main (sticky/height), кнопки страниц при `MPagination :disabled`
  (soft-disabled), английские имена rail/bar/drawer/breadcrumbs (B8.5), reduced motion у drawer (укорачивать, не 0s),
  RTL развёрнутого rail и бейджей rail/bar, Q27-А (`mirror` у `MIcon`, поставить на шевроны пагинации/навигации),
  внутренности layout вне автоимпорта (`carve`, `buildLayoutCss`, `createLayoutRegistry`, `createScrollLock`,
  `createLayoutZone` → `utils/layout/`, класс B1.7a), удалить устаревший `<m-main>` (без алиаса).
- Q20-А: layout публикует инсеты и на `:root` (для снекбара G2).
- e2e `app.e2e.ts:143` «many overlay owners still share one host» (два listbox в хосте) — разобраться.
- Одобренные шаги layout: алиасы классов окна (шаг 8) и `container` у `m-container` (шаг 10); safe-area у боковых зон.
P3: шаги планов tabs, navigation-bar/rail/drawer, app-bar, toolbar, pagination, breadcrumbs, icon (`filled`), layout.

## G4 · Поля и пикеры

Компоненты: text-field, textarea, number-input, dropdown, autocomplete, date-picker (+`dialog/date`), time-picker,
color-picker, color-input, file-input, file-upload, otp-input (+соответствующие `fragments/` и `composables/`).
**search — WIP владельца, не трогать.**

P1: `text-field/index.spec.ts` → `text-field/tests/`; у уже разбитых — добить пробелы матрицы и a11y.
P2:
- Q30-А, B6.2b (док), B6.3a, B6.3b, B6.3c, IME-guard в `useAutocomplete` (modern-web), аудит: autocomplete с
  асинхронными `items` показывает id вместо заголовка.
- B6.4a, Q31-А, B6.4d, Q32-А (number-input, textarea Resize, пикеры), Q33-А, Q34-А, scrub `touch-action` (modern-web).
- B7.1a, B7.1d, B7.1f, Q37-А, Q38-А, N.7 (Q51-Б), B7.2a–e, B7.3a, B7.3d, B7.3f, Q39-А, N.10 (Q52-А, только `min-width`).
- Аудит: color-picker hsl/hsla, file-upload/file-input — все причины отказа, date-picker — disabled-день ролями и мишени
  (и e2e «48 target» должен проверять 48), time-picker — PageUp/Down по плану, otp separator в disabled.
P3: шаги планов dropdown/autocomplete/date-picker/time-picker/color-picker, не заблокированные menu.

## G5 · Containment, данные, foundation

Компоненты: card, list (+item, subheader), divider, expansion-panel(s), table (+`fragments/table`), timeline (+item,
divider), avatar, surface, shape, lazy, hotkey (+`composables/hotkey`), confirm-edit, `composables/useVirtualScroll`.

P2:
- N.3 + N.4 (корень): `overflow-wrap: anywhere` → `break-word` на корнях card и list item (modern-web), проверить chips/segmented.
- B9.1 (Q46-А), B9.2b (mixed select-all — после indeterminate от G1), Q47-А, `<select :disabled>` в подвале таблицы
  теряет фокус (класс B9.2a), B9.3, B9.4 (MSurface, MHotkey), Q48-А, Q49-А, B1.7a (внутренности hotkey → `utils/hotkey/`),
  B9.7a, B9.7e, B13.3c (`useReducedMotion` в virtual-scroll).
- e2e `virtual-scroll.e2e.ts:105` (RTL horizontal) — разобраться.
- Аудит: заглушка картинки строки списка.
P3: шаги планов list, table (DT-*), timeline, если есть.

## G6 · Кнопки, тема, упаковка, директивы, общие типы

Компоненты: button family (button, icon, fab, extended-fab, group, segmented, split), fab-menu, `utils/button`,
`composables/button`, `directives/**`, `utils/theme/**`, `src/module.ts`, `src/options/**`, `shared/types/**`,
`package.json`, `README.md`, `docs/configuration.md`.

P1: button family и fab-menu → `tests/` по эталону.
P2:
- e2e `fab-menu.e2e.ts:203` «without anchor positioning the column ends 8 above…» падает с 2026-10-24, когда окно e2e
  по умолчанию стало 1366 (rem ≈ 0,711 px): у `menu-density-compact` зазор 8,63rem при допуске 0,5rem (≈ 0,45 CSS px).
  Реши: допуск в CSS-пикселях (≤ 1 px) или баг замера высоты в JS-пути `usePopover` — с доказательством.
- B8.1, B8.2a, Q40-Б (+ `(pointer: coarse)` по modern-web), B8.3a, B8.3b, B8.4a, B8.4b, B13.3d, N.4 — проверить после G5.
- Тема: Q1-Б (по modern-web: блок `@media (prefers-color-scheme: dark)` в `themeScss.ts`), Q3-А, Q4-Б, Q5-А, B2.4a,
  B2.4b, B2.4c, B2.5a.
- Упаковка: Q54-А, Q55-А (владелец принял: `sass` в peerDependencies), B1.2b, B1.6a, B1.6b, B1.6c, B1.6d.
- Типы: B13.2a (`plain` в `MVariant`) — сообщи G2 для B13.2b; по сообщению G2 — удалить `MSize`/`MLoadingSize` (Q11-А).
- Доки: README (валидация, sass), `docs/configuration.md` — по своим пунктам (Q57-А).
P3: планы button-family, если есть открытые шаги.
