# Accessibility Spec (Phase C) — обязательный контракт для агентов

Цель: довести overlay/composite-виджеты до WAI-ARIA соответствия (Tier-1 keyboard +
Tier-2 ARIA). Следуй WAI-ARIA Authoring Practices (APG) для каждого паттерна.

## Эталоны в ките (ЧИТАЙ перед работой — там уже всё сделано правильно)
- **Roving focus + keyboard**: `app/components/ui/tabs/index.vue` (onKeydown: Arrow/Home/End,
  focusByOffset, roving tabindex; `tab/index.vue` — role="tab", :tabindex, :aria-selected,
  aria-controls). Копируй этот паттерн для клавиатурной навигации.
- **role=slider + keyboard + value attrs**: `app/components/ui/slider/*`.
- **Native input + label + aria-invalid/describedby**: `app/components/ui/text-field/index.vue`,
  `checkbox`, `radio` (используют `useId()` — он auto-imported, НЕ импортируй вручную).
- **Dynamic button/a + aria-disabled**: `app/components/ui/button/index.vue`.

## Общие правила
1. **`useId()`** — auto-imported (Vue). Используй для связывания id (aria-controls/labelledby/describedby).
2. Keyboard-обработчики делай **inline в компоненте** (как tabs), НЕ создавай новый shared-композабл
   (во избежание конфликтов между агентами). Чистка слушателей — через существующие kit-примитивы
   (`useGlobalListener`/`useEventListener`) или `@keydown` в шаблоне.
3. **Zero-Runtime M3 неизменен**: визуальные состояния — в SCSS через `g($t,…)` + `color-mix`.
   `:focus-visible` кольцо — обычный CSS (outline), это не «цветовой токен состояния», но цвет бери
   из темы (`map.get($theme-color-link,'secondary')` или существующий outline-токен), без хардкода hex.
4. Не ломай существующие пропсы/эмиты/v-model (Phase A заморозила API). Не трогай чужие кластеры.
5. **Verify**: в конце `npx eslint <свои файлы>` (0 errors) и убедись, что не добавил vue-tsc ошибок
   в своих файлах (`npx vue-tsc --noEmit -p .nuxt/tsconfig.json` — твои файлы не должны появиться).
   Dev-сервер НЕ запускай.
6. Формат отчёта: изменённые файлы; какие роли/клавиши/aria добавлены на компонент; подтверждение lint.

## Паттерны (APG)
- **combobox/listbox** (dropdown): trigger — focusable element с `role="combobox"`,
  `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls=<listboxId>`; на trigger keydown:
  Enter/Space/ArrowDown открывают, Esc закрывает. Панель — `role="listbox"` (id), опции —
  `role="option"` + `aria-selected`. Клавиатура в открытом списке: Arrow/Home/End — перемещение
  active option (roving или aria-activedescendant), Enter — выбор, Esc — закрыть+вернуть фокус на trigger.
- **menu**: surface `role="menu"`; прямые элементы-пункты — `role="menuitem"` (если items слотируются,
  на открытии назначь роль/tabindex детям surface через querySelectorAll и管ируй фокус, ИЛИ задокументируй
  и поддержи и `[role=menuitem]`, и `button` как пункты). Открытие: фокус на первый пункт; Arrow/Home/End —
  перемещение; Esc/Tab — закрыть + вернуть фокус на триггер. Backdrop `aria-hidden` НЕ должен быть в tab-order
  (убери focusable `<button>` backdrop → `<div>` или `tabindex="-1"`/`pointer` без фокуса).
- **grid** (date day-grid/year-grid): контейнер `role="grid"`, строки `role="row"`, ячейки —
  кнопки в `role="gridcell"`; `aria-selected` на выбранной; стрелки перемещают фокус по сетке (roving),
  PageUp/PageDown — месяц/год (если уже есть nav), Home/End — край строки.
- **dialog** (dialog, dialog/date, navigation-drawer): передай в vue-final-modal `role="dialog"`,
  `aria-modal="true"`, и свяжи заголовок: `aria-labelledby=<headlineId>` (или `aria-label`).
  Focus trap у vue-final-modal обычно есть — проверь `:content-props`/атрибуты.
- **icon-only кнопки** (button/icon, button/fab, table/pagination prev/next): требуют доступного имени —
  проп `ariaLabel`/`aria-label` (прокинь как fallthrough attr, либо добавь проп `label` для AT).
- **nav active** (navigation-bar/rail): активный пункт `aria-current="page"`; `<nav aria-label="…">`;
  roving по пунктам (Arrow), как в tabs.
- **expansion-panel**: к существующему `aria-expanded` добавь `aria-controls=<regionId>`, region —
  `role="region"` + `aria-labelledby=<headerId>` (useId уже импортирован там).
- **tooltip**: есть `role="tooltip"` — добавь `aria-describedby` связь с триггером и закрытие по Esc.
- **table sort**: заголовок-сортировка — внутренний `<button>` (не `@click` на `<th>`),
  `<th scope="col">`, `aria-sort="ascending|descending|none"` на `<th>`.
- **interactive list-item**: когда `interactive` и tag по умолчанию div — добавь `role="button"`,
  `tabindex="0"`, обработку Enter/Space (или используй `<button>`); `:focus-visible` уже есть в CSS.
