# Семейство кнопок: реализация M3-планов (2026-10-07)

Реализованы планы `.cursor/plans/feature/components-should-update/button/*` (index, icon, fab,
extended-fab, split, segmented, group, fab-menu). Открытые вопросы владелец решал по одному перед
каждой фазой; решения записаны в статусах планов, в `docs/system/*/decisions.md` и ниже.

## Решения владельца, принятые по ходу

| Тема | Решение |
|---|---|
| СВ-1 pressed | остаётся 12% (без морфа нажатия 10% совпал бы с focus) |
| Значения | только из системных карт `_variables.scss`; значение вне шкалы — `calc()` из существующих ступеней. Шаг S2 (новые ступени скруглений) выброшен |
| Loading | только `MLoading inline` (размер `1em`, цвет `currentcolor`, тип `circular`); свой спиннер `button/_spinner.scss` удалён |
| Loading и фокус (В-6) | loading инертен, но фокусируем: `aria-disabled`, клик и submit гасятся в capture-обработчике |
| Toggle | `selected` + `v-model:selected` у `MButton`/`MButtonIcon`; выбранная — square (у кнопки-иконки square → round); text-toggle = цвета standard icon button; tonal выбранная — инверсия контейнера |
| Морф | S3/S4 отклонены, **кроме** двух мест: смена формы toggle (MButton/MButtonIcon/MButtonGroup) и FAB menu — на пружинах `M3_SPRING`, переведённых в CSS `linear()` (`utils/motion/shared/css.ts`) |
| Icon button | ось `width`; `elevated` снят из типа; без `color` — цвет контента контейнера (`ui-button--current`) |
| FAB | `density` 40 / 56 / 96 (не `size`); `tonal` = контейнер (дефолт), `filled` = роль; disabled остаётся |
| Split | `items` убран: правая кнопка не обязана быть меню. Слоты `#menu="{ close }"`, `#trailing`, событие `trailing`, `trailingAriaLabel`; шеврон по умолчанию всегда |
| Группы | только connected `MButtonGroup`; standard отложена. Segmented остаётся, переносы только по словам |
| FAB menu | disclosure; столбец в верхнем слое (popover); тень level 3; морф FAB на пружинах |

## Что изменено

**Новые файлы**
- `components/ui/button/group/{index.vue,props.ts,index.spec.ts}`, токены `components/button/group/_index.scss` — connected `MButtonGroup`.
- `components/ui/button/morph.ts` — переход toggle (форма fast spatial, цвет effects).
- `components/ui/fab-menu/morph.ts` — морф FAB menu; `components/fragments/fab-menu/Actions.vue` — пункты.
- `composables/useReducedMotion.ts` — общий ref reduced motion (один слушатель, читается после монтирования).
- `composables/button/useRetiredValueWarning.ts` — dev-предупреждения для снятых значений и пропов.
- `composables/button/useFabProps.ts` — `size` → `density` у FAB-семьи на один релиз.
- `utils/motion/shared/css.ts` — `springToCss`, `springTiming`, `transitionList`.
- Фикстуры и e2e: `playground/fixtures/button-group/*`, `playground/fixtures/fab-menu/*`; `waitForMotion` в `playground/e2e/support.ts`.

**Изменённые**: `MLoading` (строчная разметка, `inline` от окружения, толщина в токенах, замедление
под reduced motion, ленивый `MShape`); `MButton`, `useButton`, `m3-button-scheme` (`_functions.scss`),
токены кнопки; `MButtonIcon`; FAB и extended FAB; split; segmented и `useSegmentedButton` (ref
компонента); FAB menu и `useFabMenu`; alert и banner (сняты свои hover/pressed у кнопки закрытия —
теперь слой рисует сама кнопка). Удалён `button/_spinner.scss`.

## Ломающие изменения и миграция

| Компонент | Было | Стало | Миграция |
|---|---|---|---|
| `MButtonIcon` | `variant="elevated"` | нет в типе | `filled` или `tonal`; на релиз рисуется и предупреждает |
| `MButtonIcon` | цвет иконки по умолчанию primary | цвет контента контейнера | нужен primary — `color="primary"` |
| `MButtonFab`, `MButtonExtendedFab` | `size: sm \| md \| lg` | `density: compact \| default \| comfortable` | `size` работает релиз с предупреждением |
| `MButtonFab`, `MButtonExtendedFab` | `filled` = контейнер, `tonal` = surface, дефолт `filled` | `tonal` = контейнер (дефолт), `filled` = роль | явный `variant="filled"` → `tonal`, чтобы сохранить вид |
| `MButtonExtendedFab` | label-large на всех ступенях | title-medium (56), headline-small (96) | — (видимое изменение) |
| `MButtonSplit` | `items`, событие `select` | слот `#menu="{ close }"` | пункты — кнопки `.ui-menu__item` в слоте |
| `MButtonSplit` | `dropdown`, `dropdownAriaLabel`, `variant="text"` | `trailing`, `trailingAriaLabel`, без `text` | старое работает релиз с предупреждением |
| `MFabMenu` | `size`, `align: left \| right`, `variant`, `loading` | `density`, `align: start \| end`; `variant`/`loading` сняты | `size`/`left`/`right` — релиз с предупреждением |
| `MFabMenuItem` | `label?` | `label` обязателен | — |
| Все кнопки | loading = native `disabled` | `aria-disabled`, остаётся в Tab-порядке | — |

Видимые изменения без смены API: отступ `MButton default` 24 → 16, иконка 18 → 20; край outlined —
outline-variant у всех ролей; disabled-текст — on-surface-variant 38%; hover filled/tonal поднимает
тень на level 1; нажатие рисует только рипл (раньше фон 12% + рипл 12%); `MButton` без подписи —
квадрат кнопки-иконки с иконкой 24; segmented — минимум 58 и перенос только по словам.

## Проверка

- `npx vitest run` — 1277 / 1277.
- `npx playwright test` — 237 / 237 (все фикстуры, Chromium).
- `npm run lint`, `npm run lint:style` — без ошибок вне `playground/render/**` и `coverage/` (оба вне git).
- `npm run lint:scss` — 106 таблиц, без deprecations; `npm run typecheck` — без ошибок вне `playground/render/**`.
- Аудит: `data/button.json`, `data/fab-menu.json` обновлены, `_build.mjs --check` проходит, отчёты пересобраны.

## Допущения и риски

- Connected-группа: зазор 2 и внутренние углы 8 на всех ступенях. Compose и MDC задают их только для S, MDC применяет то же правило ко всем размерам.
- Disabled-контейнер остался 12% (у Expressive 10%): системная карта не трогалась вместе с СВ-1.
- FAB menu в браузерах без якорного позиционирования: столбец ставится JS и перемеряется по `transitionend` FAB.
- Морф идёт inline-стилем `transition`; у toggle он заменяет весь список переходов кнопки — новые переходы `MButton` нужно добавлять и в `button/morph.ts`.
- `useModal.spec.ts` один раз упал в полном прогоне vitest и проходит отдельно — нестабильность под нагрузкой, не связана с кнопками.
- Документация (DC-*) живёт в репозитории `docs` и не обновлялась; docs использует `MFabMenu` с несуществующими пропами `icon`/`label`.

## Не сделано

- Standard button group — отложена до заказчика.
- Предложения по UX из планов — не одобрялись.
- TK-03 (трекинг в `typescale`) — системная задача.
