# Дефекты «найдено, не чинилось» + rating (2026-10-30)

Девять дефектов из итогов sweep-run-2 (раздел «Найдено, не чинилось») и rating, у которого план
стоял `done`, а код с концептом расходился. Развилки владельца: В1-Б, В2-Б, В3-1. Работа автономная,
ничего не закоммичено. Параллельно идёт сессия `plans-audit-2` (аудит планов Playwright-пробами,
потом доводка по планам). Мои файлы на время работы были для неё заблокированы.

## Что сделано

| # | Дефект | Корень | Исправление | Файлы |
|---|---|---|---|---|
| Р1–Р3 | rating: левая половина звезды давала предыдущее значение, превью гасило все значки, правый клик фиксировал | значение округлялось по ширине всего ряда с зазорами; hover-правило приглушало каждую заливку; `pointerup` без проверки кнопки | `utils/rating/pointer.ts` — пункт под указателем + доля глифа, округление вверх до шага; слой `ui-rating__preview` под заливкой; фиксация только после основного `pointerdown` на контроле (`pointerleave`/`pointercancel` сбрасывают) | `rating/index.vue`, `utils/rating/pointer.ts` (+spec), тесты rating, `fixtures/rating/rating.e2e.ts`, статус в `form/rating.md` |
| Д8 | пресет `multiple` эмитился переупорядоченным при монтировании | сравнение модели с порядком | множество: сравнение без порядка, изменение — в порядке DOM (В2-Б) | `composables/selection/useSelectionGroup.ts`, `selection-group/tests/interaction.spec.ts` |
| Д6 | две блокировки скролла на `<html>`: при перекрёстном отпускании страница замерзала | у каждой свой снимок `overflow` | один счётчик на элемент `utils/scroll/overflowLock.ts` для `useScrollLock` и `utils/layout/scroll` | эти три файла + `overflowLock.spec.ts` |
| Д2 | `windowY` зоны layout = 0 у восстановленной прокрутки | читался только из событий scroll | чтение при монтировании и при смене `mainEl` / `fullHeight` | `utils/layout/zone.ts`, `layout/tests/interaction.spec.ts` |
| Д1 | бар в `main` отдавал размер зоне main; в aside отдал бы высоту в ширину | вклад без учёта оси | вклад только по оси хозяина, `main` вкладов не берёт | `composables/useLayout.ts`, `system-bar/tests/interaction.spec.ts` (`it.todo` → тест) |
| Д3 | составной `MAppBarTitle` с подзаголовком: в SSR бар низкий | класс корня считается до setup ребёнка | `ui-app-bar__headline--subtitle` + `:is(.ui-app-bar--subtitle, :has(…))`; JS-класс остаётся фолбэком | `app-bar/index.vue`, `app-bar/title/index.vue`, `app-bar/tests/variants.spec.ts`, `fixtures/app-bar/*` (no-JS e2e) |
| Д4 | на таче прозрачное поле скроллера крошек забирало тапы соседей | отрицательный margin возвращал запас 8 под мишень | на `pointer: coarse` `margin-block: 0` (В1-Б); на точном указателе — как было | `breadcrumbs/index.vue`, `fixtures/breadcrumbs/breadcrumbs.e2e.ts` |
| Д5 | зажатая клавиша на удалённом элементе глушила клавиатурную рябь следующего | флаг на модуль | флаг `keyboardActive` в `_ripple` элемента | `directives/ripple.ts` (+spec) |
| Д7 | поверхность из RTL-поддерева на LTR-странице: текст и выравнивание LTR | телепорт теряет `dir`, логический `position-area` читается по корню | `usePopover().surfaceDir` (dir триггера, если он против корня) на поверхностях popover/menu/tooltip, `placementToArea(…, mirrored)` | `composables/popover/{placement,usePopover}.ts` (+specs), `composables/menu/useMenu.ts`, `fragments/popover`, `menu`, `tooltip`, `fixtures/overlay/subtree-dir.*` |
| Д9 | `MTextField` / `MTextarea` без имени молчали | — | dev-предупреждение как у number-input; e2e проверяет, что композиты с именем не предупреждают | `text-field/index.vue`, `textarea/index.vue`, `text-field/tests/a11y.spec.ts` (`it.todo` убран), `fixtures/text-field/nameless.*` |

Решения записаны в `docs/system/{en-US,ru-RU}/decisions.md` («Архитектурные размены», 5 строк).

## Проверка

- Vitest целиком: 336 файлов, 5133 зелёных + 1 `it.todo` (motion, не мой).
- ESLint: в моих файлах 0; 37 ошибок — в пробах `playground/probes/plans-audit-2/**` соседней сессии.
- Stylelint 0, `lint:scss` 162 стиля без депрекаций.
- vue-tsc: только ошибки, которые были до меня (WIP-демо `MColor` → `MAccentColor` и `fixtures/timeline/matrix.vue` — это S4/S8, их закрывает фаза 2 `plans-audit-2`).
- e2e на dev :3200: rating 13, app-bar 19, breadcrumbs 19, text-field+textarea 77, overlay/subtree-dir 1 — зелёные; layout, system-bar, chip-group, overlay, dropdown, autocomplete, fab-menu, button — 288 прошло, 2 упали на навигации во время HMR (`Execution context was destroyed`, `ERR_ABORTED`) и прошли при повторе. Полный прогон на prod-сборке не делал: его в конце фазы 2 делает `plans-audit-2`.

## Допущения и риски

- Rating: до нуля указатель не доходит — 0 даёт `clearable` или клавиатура (как и раньше по плану).
- Д3: без `:has()` (старые браузеры) первый кадр как прежде, после гидрации класс исправляет высоту.
- Д4: на таче строка крошек в режиме прокрутки выше на 16 — так выбрано в В1-Б.
- Д7: `dir` у поверхности ставится только после замера триггера при открытии; тултип, который в DOM с монтирования, до первого показа наследует направление корня.
- Параллельные прогоны: Vitest с coverage и Playwright без `--output` у двух сессий ломают друг друга (общие `coverage/.tmp` и `test-results`); свои прогоны я запускал с `--coverage.enabled=false` и `--output "$TEMP/pw-parent"`.
- Визуально (скриншотами) ничего не проверено.
