# Дорожная карта: от исследования к реализации

Обновлено 2026-10-07. Порядок выведен из зависимостей между планами: сначала система и общие
примитивы, на которые опираются десятки компонентов, затем семейства. Каждая волна проходит
процессом фазы D:
- агенты в worktree;
- фикстуры `matrix` и `stress` + e2e;
- аудит обновляется;
- коммиты по одному смыслу.

Карта планов — [index.md](index.md).

## Волна 0 — решения владельца (блокируют всё остальное)

| Вопрос | Где | Рекомендация |
|---|---|---|
| СВ-1: pressed 10% (Expressive) или 12% | [common.md](common.md) | 10%, но без морфа (S3 отклонён) pressed станет равен focus — пересмотреть с учётом этого |
| СВ-3: набор иконок и заливка выбранных | [common.md](common.md) | пары `ic:outline` / `ic:baseline` сейчас |
| Hairline: `1rem` или `1px` для обводок | [surface](foundation/surface.md) вопрос 2 | общий токен `1px` |
| Q10–Q17 фазы D (loading-кнопка, ошибка поля, английские строки, …) | `.cursor/summary/qa-fix-showcase-fields_2026-10-07_0100.md` | см. сводку фазы D |
| Закрывает ли «всё ок» по fab, extended-fab, icon, segmented их вопросы рекомендациями | [button](button/index.md) | — |
| Роль drawer рядом с развёрнутым рейлом | [navigation-drawer](navigation/navigation-drawer.md) вопрос 1 | drawer для `end` и длинных меню |

## Волна 1 — система (S2, S6–S9, density)

1. Шкала форм Expressive в `--sys-shape-corner-*` (S2).
2. Emphasized-типографика (S6), `letter-spacing` в миксине `typescale`.
3. Цель нажатия 48 (S8) — общий миксин расширителя.
4. Ветка `selected` в картах компонентов (S9).
5. `density` вместо `size`:
   - avatar 24 / 40 / 56;
   - loading 24 / 48 / 64;
   - progress — убрать ось;
   - кнопки 32 / 40 / 56.
6. Запись решений в `docs/system/*/decisions.md` (обе локали):
   - S3 и S4 отклонены;
   - `density` из трёх ступеней;
   - авторские компоненты;
   - `tonal` кнопок.

## Волна 2 — общие примитивы (на них стоят 15+ компонентов)

| Примитив | Кто ждёт | План |
|---|---|---|
| Внутренний popover: кламп высоты, RTL, перемер, `appear` | menu, dropdown, autocomplete, tooltip, search view, color-input, split | [menu](overlays/menu.md) |
| `MMenuItem` / `MMenuGroup`, роль поверхности не `menu` для listbox | dropdown, autocomplete, color-input | [menu](overlays/menu.md) |
| Порядок открытия и фокус в `MOverlay` (A11-12), прокрутка панели | dialog, sheet, drawer | [overlay](overlays/overlay.md) |
| Общий постоянный живой регион | snackbar, alert, banner, lazy, file-upload | [snackbar](feedback/snackbar.md) |
| Общий roving-контроллер (вынос, без третьего) | toolbar, chip-group, swatches, navigation | [selection-group](form/selection-group.md) ВГ-3 |
| Общий пункт навигации | navigation bar, rail, drawer | [navigation-bar](navigation/navigation-bar.md) вопрос 5 |
| Indeterminate у checkbox | table, list | [checkbox](form/checkbox.md) |
| Нормализация клавиш в `format.ts` | hotkey, menu, button (hotkey-подписи) | [hotkey](foundation/use-hotkey.md) |

## Волна 3 — быстрые дефекты, найденные рендерами

Каждый — S. Их можно делать параллельно со второй волной.
1. Выбор в toolbar.
2. Рейка timeline.
3. Лейбл file-input.
4. `autoStart` у file-upload.
5. Начальное значение autocomplete.
6. Год 1926 в date-picker.
7. Переносы segmented по буквам.
8. Сравнение образцов color-picker.
9. `arrowup` в hotkey.
10. Hydration в loading.
11. «Двойная звезда» в rating.
12. Анимация `float`-лейбла в text-field.

Полный список с ссылками — в [index.md](index.md).

## Волна 4 — действия и выбор (M3)

- Семейство кнопок:
  - `density`, `shape`, toggle;
  - icon button с шириной;
  - лестница FAB;
  - split без разделителя;
  - новый `MButtonGroup`.
- Chip (elevated, галочка, удаление), checkbox, radio, switch (иконки в ручке).
- Slider (ручка-полоска, зазор, stop indicators).
- FAB menu.

## Волна 5 — навигация и контейнеры (M3)

- Navigation bar 64 с таблеткой, rail (collapsed / expanded / modal), drawer, tabs (индикатор по
  содержимому, secondary, scrollable).
- App bar (шрифты, перенос, сворачивание), toolbar (docked 64, vibrant, APG).
- Card (интерактивная), list (Expressive-геометрия, `ul`), divider (inset-ось).
- Dialog (fullscreen, `alertdialog`), sheet (+ side sheet), tooltip (rich), snackbar (инверсия,
  длительности, очередь).
- Search view, badge (размещение), progress (зазор, stop), loading (contained).

## Волна 6 — поля и пикеры

- Общие для полей:
  - индикатор disabled 38%;
  - error hover;
  - caret;
  - строка поддержки 16.
- Date picker (поверхность, типографика, без Cancel/OK во встроенном), time picker (селекторы,
  AM/PM, клавиатура циферблата).
- Dropdown и autocomplete (роль выбора `secondary-container`, галочка в конце).
- OTP (`variant`, режимы `mask`), number-input, textarea.
- Color picker и input, file input и upload.

## Волна 7 — авторские компоненты данных и обратной связи

- Table: состояния данных, выбор, плотность, подвал.
- Pagination, breadcrumbs, timeline, avatar.
- Alert, banner, hotkey, form-renderer, rating, expansion-panel, chip-group, system-bar.

## Волна 8 — новое и отложенное

- Слой панелей раскладки (list-detail) — после вопроса 2 в [layout](foundation/layout.md).
- Carousel — после появления заказчика.
- Отложенные компоненты по своим условиям продвижения (карта — [index.md](index.md), раздел
  «Отложенные компоненты»):
  - stepper вместе с window;
  - treeview — после шага 3 плана list и indeterminate у checkbox;
  - calendar — на сетке date-picker;
  - image и parallax;
  - empty-state — сначала общий фрагмент для слотов `#empty`;
  - pull-to-refresh;
  - slide-group — как примитив прокрутки для chip-group и tabs;
  - data iterator;
  - лаборатория графиков — по коммерческому решению.
- `MConfirmEdit` — после решения владельца.
- Предложения по UX, одобренные владельцем, — по мере решений.
