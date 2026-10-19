# M3-polish — группа «Кнопки» (w1), 2026-10-19

Аудит: `.cursor/handoff/m3-polish/audit/buttons.md` (P1, 2026-10-18). Реализация P2 — по GO оркестратора:
решения Q-1…Q-12 приняты по рекомендации, Q-9 (density/ступени/живой текст `MLoading`) — СТОП у владельца,
API `MLoading` не трогался.

## Решения (Q → что сделано)

| Q | Решение | Где |
|---|---|---|
| Q-1 | Конечный радиус `calc(h / 2)` вместо `full = 999rem` только у морфа и смешанных углов: toggle `MButton`/`MButtonIcon`, `MButtonGroup`, половины split, открытый FAB menu (28). Обычные кнопки — 999 | `button/_index.scss` (`button-step()`: `round`), `group/_index.scss`, `fab-menu/_index.scss`, `button/index.vue`, `icon/index.vue`, `split/index.vue`, `group/index.vue` |
| Q-2 | Слой `::before` (hover 8, focus 10), нажатие — только рипл; рипл пунктам FAB menu | `button/fab/_surface.scss` (FAB + extended), `segmented/index.vue`, `fab-menu/index.vue`, `fragments/fab-menu/Actions.vue` |
| Q-3 | Равные сегменты (`grid-auto-columns: 1fr`, как material-web) + место под галочку в каждом сегменте; подпись без иконки центрируется сдвигом `translate` (композитор), соседи и группа стоят | `segmented/index.vue`, `segmented/_index.scss` (`graphic.*`) |
| Q-4 | Обратный каскад: пункты уходят дальний-первым, вниз, на кривой выхода. **Сверено с Compose** `FloatingActionButtonMenu.kt` (androidx-main): закрытие ведёт один счётчик `staggerAnim` к 0 на SlowEffects, видим пункт с `index >= itemCount - value` — верхние (дальние) уходят первыми, ближний к FAB — последним; открытие — наоборот. Совпадает | `Actions.vue` (`--ui-fab-enter/--ui-fab-leave`), `fab-menu/index.vue` |
| Q-5 | Угол фигуры = амплитуда × |скорость|; в покое 0°; прерывание продолжает угол | `composables/useShapeMorph.ts` |
| Q-6 | `useButton` → `utils/button/` (классы остаются, автоимпорта нет); туда же `useButtonNameWarning` | `utils/button/{useButton,useButton.spec,useButtonNameWarning}.ts` |
| Q-7 | Слот-проп `{ selected }` у `MButton` (default/prepend/append) + смена глифа в фикстуре | `button/index.vue`, `fixtures/button/matrix.vue` |
| Q-8 | Split: `inheritAttrs:false` — class/style на корень, остальное на главную кнопку; типизированные `type/tag/to` | `split/{index.vue,props.ts}` |
| Q-10 | Константы дуги circular (1333 мс, кривая, ×4, 360/306, ×2 под reduce) — в карте компонента с источником M3 | `components/loading/_index.scss` |
| Q-11 | Синглтон `useReducedMotion` остаётся (запись в decisions — оркестратор) | — |
| Q-12 | `loading` у segmented удалён | `segmented/props.ts` |
| Q-12 (w2, межгрупповое) | Отключённая ссылка-кнопка: `<a>` без `href`/`to`, `role="link"`, `aria-disabled`; `href`, переданный потребителем, тоже снимается | `utils/button/useButton.ts` на `#kit/utils/link`, `button/index.vue` (`inheritAttrs:false` + `withoutDestination`) |

## Сделано (пункты «нет» аудита)

- **MButton:** forced colors — подпись выбранной кнопки читается (`forced-color-adjust: none` + Highlight/HighlightText; было — подложка Canvas поверх Highlight); disabled-контент `on-surface` 38% (M3; правка тела `m3-button-scheme` по разрешению); hairline `max(1px, 1rem)`; outlined платит рамку паддингом (ширина не зависит от варианта); мёртвый `transform` в переходах; генерация схем без дублей, disabled раз на вариант — партиал `button/_schemes.scss`.
- **MButtonIcon:** выбранная square → круг ступени; шим `elevated` удалён.
- **FAB / extended FAB:** одна карта схем (`fab.$schemes`) и один миксин; без своего перехода цвета у иконки; шим `size` + `useFabProps` удалены. Extended: сворачивается подпись (inline-size/opacity/отступ), кнопка `auto` следует за ней — без скачка 132 → 56 и «качания» 56 → 48 → 56; подпись в одну строку на время сворачивания и в свёрнутом виде.
- **Split:** правая половина в loading — `aria-disabled` (держит фокус, В-6); без `>`-селекторов; шимы `dropdownAriaLabel`, `dropdown`, `variant="text"` удалены.
- **Segmented:** hairline из карты; forced colors — один блок; `defineModel`; один тип пункта (`SegmentedItem`; `MSegmentedItem`/`MButtonGroupItem` — алиасы); ре-экспорт типа удалён.
- **Group:** `defineModel` (проп `modelValue` из `props.ts` убран, `v-model` тот же); dev-предупреждение называет `aria-label`.
- **FAB menu:** ящик не пересоздаётся — класс `--open` ведёт пункты в обе стороны (MO-03: быстрый тоггл без скачков); обе иконки смонтированы; JS-путь позиционирования меряет ящик после показа и следует за морфом FAB по кадрам; столбец с сервера появляется без входа; мёртвый `transition: transform` глифа; шимы `size`, `align: left/right`, ре-экспорт типа удалены.
- **MLoading / useShapeMorph / useTimer:** цикл expressive стартует в `onMounted` (на сервере — нет); `useTimer` вне браузера ничего не планирует; под reduce морф идёт calm-кривой без поворота, цикл вдвое реже; прерывание стартует от живой формы и угла; `easeM3Standard` удалён; inline-индикатор центрируется по высоте прописных (`vertical-align: calc((1cap - 1em) / 2)`).
- **Фикстуры:** `loading/{matrix,stress}.vue` (новые), `button/dynamic.vue` (смена состояний на лету), `button/matrix.vue` (глиф toggle, ссылки); хелпер `fixtures/button/motion.ts` (нарисованный радиус).

## Тесты и гейты

- `npx eslint` (пути группы) — 0; `npx stylelint` — 0; `npm run lint:scss` — 0 (154 stylesheets, no deprecations); `vue-tsc` — ошибок в путях группы нет (чужие: table w2, time-picker w5 — на момент прогона).
- Vitest: 22 файла / 298 тестов зелёные (button-семья, fab-menu, loading, shape, useShapeMorph, useTimer, useReducedMotion, utils/button, utils/motion, utils/morph, tooltip, otp-input).
- e2e у дирижёра: REQ 015 (button + group + fab-menu) — 107/110, два падения FAB menu от чужого `vite-error-overlay` (на перезапуске зелёные), одно — extended FAB (исправлено); REQ 016 (button + fab-menu + loading) — 103/104, падение — допущение теста (`Math.round(-0.3) = -0`), исправлено; REQ 017 (повтор extended FAB + группа) — 19/19; REQ 020 (fab-menu после фикса JS-пути на `default`) — 23/23.
- Новые регрессии: нарисованный радиус toggle без снапа и задержки (4 кнопки × 2 направления), углы split 4 / группы 8 нарисованы, морф пилюли группы и круга FAB menu по кадрам, forced colors подписи выбранных (кнопка, группа), segmented без внешнего сдвига, extended FAB без качания/скачка высоты/сдвига иконки, split в loading держит фокус, отключённая ссылка без href и Tab, FAB menu: позиция в JS-пути, обратный каскад, быстрый тоггл, MLoading под reduce без скачков, поворот в одну сторону, inline по центру строки, forced colors, axe и переполнение.

## Проверено скриншотами / пробами / не проверено

- Пробы «после» (REQ 018, те же сценарии, что 001/007/008 до правок):
  - toggle `MButton`/`MButtonIcon`: нарисованный угол двигается с кадра клика (было: стоял ≈133 мс), 90% пути — за ≈83 мс, наибольший шаг 24% (было: 56% в квадрат и 100% за кадр в круг); reduce — 31% (было 70%/100%);
  - extended FAB: ширина 132 ↔ 56 без качания, наибольший шаг 15.7rem/кадр (≈20% пути; было 76rem за кадр + 56 → 48 → 56);
  - FAB menu JS-путь: столбец на 8.1 над FAB у compact и comfortable (было −7.9 и 48.1), край пунктов совпадает с краем FAB (0.7; было 23.3). У `default` (FAB не морфится) край ещё уходил на 23.3 — ящик мерился, прижатый к краю вьюпорта; исправлено `inline-size: max-content` у ящика, e2e JS-пути теперь на всех трёх ступенях (REQ 020 зелёный).
- Скриншоты «после» (REQ 019, light/dark × ltr/rtl, forced colors): равные сегменты с центрированными подписями; внутренние углы split 4 и группы 8 видны; forced colors — подписи выбранной кнопки и сегмента читаются (Highlight/HighlightText); FAB — слой hover поверх контейнера. Пункты FAB menu (REQ 021): столбец ровно над FAB по краю, слой hover на пункте, после Escape фокус на FAB; середину каскада снимок не поймал (look ждёт конца переходов) — порядок проверен e2e.
- Не проверено: Firefox/Safari (JS-путь FAB menu — эмуляцией в Chromium); вид в брендовых палитрах docs (тема playground монохромная); скринридеры.

## Ломающие изменения и миграция

| Было | Стало |
|---|---|
| `MButtonFab`/`MButtonExtendedFab`/`MFabMenu` `size="sm\|md\|lg"` | `density="compact\|default\|comfortable"` |
| `MFabMenu align="left\|right"` | `align="start\|end"` |
| `MButtonSplit` `dropdownAriaLabel`, `@dropdown`, `variant="text"` | `trailingAriaLabel`, `@trailing`, `outlined` |
| `MButtonIcon variant="elevated"` | `filled` / `tonal` |
| `MButtonSegmented loading` | — (не делал ничего) |
| `MButtonSplit` атрибуты (`aria-*`, `data-*`) на обёртке | на главной кнопке; `class`/`style` — на корне |
| `import type { MFabMenuItem } from '…/fab-menu/index.vue'`, `{ MSegmentedItem } from '…/segmented/index.vue'` | из `…/props` |
| `easeM3Standard` (автоимпорт) | `{ transition: 'standard' }` |
| `useButton`, `useButtonNameWarning` в автоимпорте | внутренние (`#kit/utils/button/*`) |
| Отключённая `MButton tag="link"`: `href` + `tabindex=-1` | `<a>` без `href`, `role="link"`, `aria-disabled` |
| Нажатие FAB/extended/segmented: фон 12% + рипл | только рипл; hover/focus — слой |
| Segmented: ширина сегментов по содержимому | равные сегменты (как M3) |

## Открытые вопросы

- Q-9 (владелец): ступени/`density` `MLoading`, contained, живой текст вместо `aria-label` (DT-09), `delay/minDuration` (DT-11).
- `composables/button/useRetiredValueWarning.ts` — удалить, когда чужие группы снимут свои шимы (команда оркестратора).
- Реэкспорт типов семьи в публичную точку — оркестратор (список ниже).

## Риски и долги

- Equal-width segmented меняет вид существующих групп (короткие сегменты шире) — решение Q-3.
- `MButton` стал `inheritAttrs:false` (атрибуты биндятся вручную через `mergeProps`) — поведение то же, но это новый путь для всех потребителей `MButton`.
- Split: `data-test`/атрибуты теперь на главной кнопке — e2e чужих групп, ищущие корень split по `data-test`, сломаются (в ките таких нет).
- Интерактивное позиционирование FAB menu в JS-пути — rAF на время морфа (~325 мс), только без anchor positioning.

## Выходной CSS (собственная компиляция SFC, байты / gzip; база prod — `baseline/css-sizes.json`)

| Компонент | Было | Стало |
|---|---|---|
| button (+ icon-button) | 21025 + 1612 / 1770 + 321 | 12693 + 1818 / 1613 + 322 |
| fab | 9543 / 1048 | 3122 / 785 |
| extended-fab | 13064 / 1462 | 6085 / 1185 |
| segmented | 9055 / 1137 | 4398 / 1009 |
| split | 2139 / 394 | 2626 / 460 |
| button-group | 592 / 201 | 1439 / 276 |
| fab-menu (+ Actions) | 4637 + 5479 / 811 + 942 | 2123 + 2927 / 596 + 900 |
| loading | 2557 / 812 | 2571 / 824 |
| **Итого** | **69 750** | **39 849 (−43%)** |

Split и группа выросли: внешние углы теперь по ступеням (3×). Финальные prod-цифры — прогон P3.
Строки src (группа, `git diff --stat`): +1315 / −1462 (с тестами и фикстурами).

## Заявки оркестратору

Реэкспорт типов в публичную точку (`shared/types/props` / `package.json ./types`):
`MButtonProps`, `MButtonDensity`, `MButtonShape`, `MButtonTag`, `MButtonType`, `MIconButtonVariant`, `MIconButtonWidth`
(`components/ui/button/props.ts`); `MFabVariant`, `MFabProps` (`button/fab/props.ts`); `MExtendedFabProps`
(`button/extended-fab/props.ts`); `MSplitButtonVariant`, `MSplitButtonProps` (`button/split/props.ts`);
`MSegmentedItem`, `MSegmentedModelValue`, `MSegmentedProps` (`button/segmented/props.ts`); `MButtonGroupItem`,
`MButtonGroupModelValue`, `MButtonGroupVariant`, `MButtonGroupProps` (`button/group/props.ts`); `MFabMenuItem`,
`MFabMenuAlign`, `MFabMenuProps` (`fab-menu/props.ts`); `MLoadingType`, `MLoadingSize`, `MLoadingProps`
(`loading/props.ts`).
