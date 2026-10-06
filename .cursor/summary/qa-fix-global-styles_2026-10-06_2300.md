# QA-аудит: глобальные стили (фаза C)

**Дата:** 2026-10-06
**Предыдущий шаг:** `qa-fix-infra-and-bugs_2026-10-06_1900.md` (фазы A и B).
Часть работы делали агенты в отдельных worktree, их ветки перенесены в main через cherry-pick.

## Новые абстракции (`assets/stylesheet/abstracts`)

| Что | Где | Зачем |
|---|---|---|
| `$theme-state-link` + `state-opacity(key)` | `_variables`, `_functions` | Непрозрачности MD3: hover 8, focus 10, pressed 12, dragged 16, disabled 12/38 |
| `can-hover` | `_mixins` | Любое правило с `:hover` лежит внутри `@media (hover: hover)` |
| `sr-only` | `_mixins` | Визуально скрыто, но доступно скринридеру |
| `$theme-spacing-link` + `spacing(px)` | `_variables`, `_functions` | Шкала 4dp: `spacing(16)` → `16rem`, шаг вне шкалы — ошибка |
| `$theme-focus-link` + `focus-ring($offset \| inset)` | `_variables`, `_mixins` | Кольцо 3rem `secondary` у всех контролов, кроме полей |
| `forced-colors` | `_mixins` | Точка входа для стилей Windows High Contrast |
| `$theme-elevation-link` + `elevation(0..5)`, `base/_elevation.scss` | агент C10 | Тени MD3 из `--md-sys-color-shadow` |
| `z()` с ошибкой на неизвестный ключ, `overlay-host` | агент C11 | Одна шкала слоёв страницы |

## Решения пользователя

- Прозрачности state-layer строго по MD3: pressed у switch стал 12%, активная опция dropdown — 10%.
- Шкала отступов заведена сразу, перевод компонентов на неё — по ходу работы.
- Кольцо фокуса 3rem `secondary`. Поля по-прежнему показывают фокус сменой цвета (принцип из
  `docs/system`). Отдельный цвет фокуса для error и read-only — **открытый вопрос фазы D**.
- Тени по MD3. Нижние поверхности тоже без тени, направленной вверх. Docked toolbar — уровень 0.
- Скроллбары: переменные `--ui-scrollbar-inset-block` и `--ui-scrollbar-inset-inline`.
- Reduced motion укорачивает анимации, а не выключает их. Компоненты, где анимация выключается
  полностью, пока оставлены как есть.
- `scroll-padding` пишет только внешний `<m-layout>`.

## Защита `lint:scss` (`shell/scss-smoke.mjs`)

Проверка падает в четырёх случаях:
- `:deep`, `:slotted` или `:global` вне `scoped`;
- суффикс после псевдокласса (`:hover-x`);
- в CSS попала невычисленная функция кита (`g`, `z`, `spacing`, `state-opacity`, `elevation`);
- `:hover` вне `can-hover`.

Кроме SFC компилируются и SCSS-файлы, импортированные из TS.

## Forced colors (C7, три агента)

- **Контролы.** Кнопки и FAB получили рамку `ButtonText`. Выбранные и отмеченные состояния
  (чипы, checkbox, radio, switch, slider, вкладки, rating) рисуются цветом `Highlight`.
  Иконки починены в MIcon через `forced-color-adjust: preserve-parent-color`: без этого все
  глифы пропадали.
- **Индикаторы.** Progress, loading, divider, badge, timeline, navigation, списки, пагинация,
  календари, часы, таблица.
- **Поверхности и поля.** Поверхности получили рамку `CanvasText`. У полей фокус → `Highlight`,
  ошибка → `Mark`, disabled → `GrayText`.

## Что осталось

- **Фаза D:** button, text-field, textarea, number-input, otp-input, dropdown, autocomplete.
- Длительности анимаций, зашитые числами (slider, time-picker, календари, меню, тултип,
  progress, спиннеры), перевести на токены.
- `usePopover` и `useMenu` держат `z-index: 999` в JS — это вне шкалы.
- **docs_v2:** снят MConfirmEdit; `--sys-elevation-level-2` нужно заменить на `level2`;
  в `.docs-aside-drawer` добавить `--ui-scrollbar-inset-block`.
