# navigation — фаза 2

## Сделано (пункт → что изменилось → файлы)

1. **app-bar: safe-area вне `m-layout`, переходы через карту.** Прибитый (`sticky`) бар вне раскладки
   (`useLayoutZone() === null`) получает модификатор `ui-app-bar--safe-area`: `box-sizing: content-box`,
   `padding-block-start: env(safe-area-inset-top)`, боковые `calc(4 + env(left/right))`. Внутри `m-layout`
   (зона, `m-layout-header`, `m-layout-main`) класса нет — вырез отдаёт зона, двойного счёта нет.
   `transition` читает `container.motion.*` вместо `var(--sys-motion-*)` в `.vue`. Правки родителя
   (`$with-subtitle` с `:has()`, `title/index.vue`) не тронуты.
   Файлы: `assets/stylesheet/components/app-bar/_index.scss`, `components/ui/app-bar/index.vue`,
   `app-bar/tests/variants.spec.ts` (+4 теста), `playground/fixtures/app-bar/app-bar.e2e.ts` (+1, вырезы через CDP).
2. **breadcrumbs: арифметика в карте.** `calc(-1 * …)` отступа (`:146`) → `list.scroll.margin.block`;
   те же выражения у маски края (6 мест) → `list.scroll.fade.offset`, `list.scroll.fade.mask.size`.
   `margin-block: 0` на `pointer: coarse` (правка родителя) сохранён.
   Файлы: `assets/stylesheet/components/breadcrumbs/_index.scss`, `components/ui/breadcrumbs/index.vue`.
3. **navigation-bar.**
   - `spacing()` в карте общего пункта (6 = `calc(spacing(4) + spacing(2))`, размеры остались rem).
   - Safe-area вне `m-layout` (модификатор `ui-navigation-bar--safe-area`): `padding-block-end` и боковые
     `env()`, у Centered — `calc(поле% + env)` из карты (функция `centered()`),
     `min-height: calc(64 + env(bottom))`, `border-box` сохранён.
   - Dev-предупреждение о числе пунктов: вне 3–5 при `iconPlacement: top`, вне 3–6 при `start`; пустой
     список не предупреждает.
   - Новая фикстура `navigation/stress.vue`: 6 пунктов на 360, длинная подпись, слово без пробелов,
     бейджи 999 и точка, пустой бар, рейл с `#header` и `v-model:expanded`, развёрнутый рейл с длинными подписями.
   - Новый `navigation/stress.e2e.ts`: axe и переполнение на `WIDTHS`, подписи в пределах пункта,
     dev-предупреждение, forced colors (бар и рейл), reduced motion, кольцо рейла, safe area через CDP.
   - Stress-фикстура нашла дефект: неразрывное слово в подписи `top` выходило за пункт на соседей.
     Исправлено `max-width: 100%` у `&--top &__label`.
   Файлы: `assets/stylesheet/components/{navigation-item,navigation-bar}/_index.scss`,
   `components/fragments/navigation-item/index.vue`, `components/ui/navigation-bar/index.vue`,
   `navigation-bar/tests/variants.spec.ts` (+2 теста; хрупкая проверка `'mdi:star"'` → регэксп, см. «Проверки»),
   `playground/fixtures/navigation/{stress.vue,stress.e2e.ts}`.
4. **navigation-drawer: `spacing()` в карте.** Шорткат шапки `4 8 12` разложен на атомарные
   `header.padding.block.start/end` и `header.padding.inline`. Фолбэки `env(…, 0px)` заменены на `0rem`.
   Файлы: `assets/stylesheet/components/navigation-drawer/_index.scss`, `components/ui/navigation-drawer/index.vue`.
5. **navigation-rail.**
   - `transition` → `container.motion.*`; `top` и `height` (`calc(100dvh − …)`) → `container.in-page.*`
     и `container.in-scroller.height` в карте; поля и промежутки → `spacing()`.
   - Вне `m-layout` — модификатор `ui-navigation-rail--standalone`: `height: 100%` (высота контейнера)
     и `max-height: 100dvh`. Пример: фикстура 480 → рейл 480, раньше был 1200.
   - IN-05: скроллящий список получает `padding-block` = ширина + отступ кольца (5rem) и возвращает их
     `margin-block: -5rem` (`list.ring.*`). Кольцо первого и последнего пункта развёрнутого рейла не обрезается,
     пункты не сдвигаются.
   - e2e forced colors и reduced motion — в `navigation/stress.e2e.ts`.
   Файлы: `assets/stylesheet/components/navigation-rail/_index.scss`, `components/ui/navigation-rail/index.vue`,
   `components/fragments/navigation-rail/content.vue`, `navigation-rail/tests/variants.spec.ts` (+1 тест).
6. **pagination.** Кнопка страницы получила `@include touch-target(block)` (было: обе оси) — как в
   `decisions.md` «Мишень 48». Два e2e мишеней переписаны: кнопка растёт только по блоку, ряд на таче
   идёт с шагом 48, зазор между страницами не принадлежит ни одной. Старые тесты закрепляли обе оси,
   то есть расходились с записью решения.
   Файлы: `components/ui/pagination/index.vue`, `playground/fixtures/pagination/pagination.e2e.ts`.
7. **tabs.**
   - Hairline ряда `list.border.width: max(1px, 1rem)`. Отступы → `spacing()` (52 = `48 + 4`),
     `content.padding` атомарно.
   - Минимум 24 у индикатора: `min-inline-size: 24rem` у `__tab-content` primary
     (`primary.indicator.min-width`).
   - `activeIcon` у `MTabItem` и `MTab`. Без него выбранная вкладка рисует залитую пару `ic`-глифа
     (`MIcon filled`), вкладка-маршрут — по `isExactActive`; в SSR тоже.
   - Бейдж ставится миксином `badge-anchor(large|small)`: large −2 / 12, точка 0 / 6. Было −4.
     Ключи `badge.large/small` из карты убраны, точка отмечена своим модификатором
     `ui-tabs__tab-badge--dot` вместо `.ui-badge--small` чужого блока.
   - В `tabs/matrix.vue` добавлен ряд «I / X» (`data-test="short"`).
   - Новые e2e: залитый глиф, минимум 24, hairline на 360, угол бейджа в LTR и RTL, forced colors
     (индикатор Highlight, disabled GrayText), reduced motion.
   Файлы: `assets/stylesheet/components/tabs/_index.scss`, `components/ui/tabs/{index.vue,props.ts,tab/index.vue,tab/props.ts}`,
   `components/fragments/tabs/tab-content/index.vue`, `tabs/tests/variants.spec.ts` (+5 тестов),
   `playground/fixtures/tabs/{matrix.vue,tabs.e2e.ts}`.
8. **toolbar.**
   - `hasModel` теперь реактивен. Инстанс выбора создаётся всегда, а режим модели определяется на каждом
     рендере и в обработчиках: `multiple` или привязанный `v-model`. Привязку видит `useBoundProp()` —
     ключ `modelValue` в vnode props. Поэтому модель с начальным `undefined` или привязанная после
     монтирования включает выбор.
   - **S9 = А:** `layout` → `orientation` (ломающее, без алиаса). Документация модуля `useToolbar.ts`
     приведена к факту.
   Файлы: `components/ui/toolbar/{index.vue,props.ts}`, `composables/useToolbar.ts`,
   `toolbar/tests/{interaction,variants,a11y}.spec.ts` (+2 теста модели, переименование),
   `playground/fixtures/toolbar/matrix.vue:40`.
9. Клавиатура toolbar (B5.6d) и ссылки `to` у bar/rail/drawer (B5.1a) не делались: отложены Q56-А.
10. **Статусы десяти планов обновлены** (`updated="2026-10-30"`):
    - done: app-bar, breadcrumbs/index, breadcrumbs/item, breadcrumbs/divider, pagination, tabs;
    - partial: navigation-bar, navigation-drawer, navigation-rail (осталось `to`), toolbar (осталась клавиатура APG).
    Шаги «Документация» помечены **отложено**. Шаги toolbar помечены: 3 — отложено (B5.6d),
    5 — алиасы отменены, 8 — safe-area у docked отменена.

## Решения (ID → вариант → основание) — те же строки, что в журнале

Полный текст — `.cursor/handoff/plans-audit-2/decisions-navigation.md`, NAV2-01…18. Кратко:

| ID | Решение |
|---|---|
| NAV2-01 | Вырез у app-bar только при `sticky` и вне `m-layout`, через `content-box` + padding. Основание: план «прибит к верху окна» и логика carve. |
| NAV2-02 | Вырез у nav-bar всегда вне `m-layout`, `border-box`, `min-height` + inset. Основание: бару задают ширину. |
| NAV2-03 | Предупреждение о числе пунктов: 3–5 при `top`, 3–6 при `start`, пустой список молчит. Основание: таблица плана. |
| NAV2-04 | Рейл вне `m-layout`: `height: 100%` и `max-height: 100dvh`. |
| NAV2-05 | Запас под кольцо в списке рейла, возвращённый отрицательным полем. |
| NAV2-06 | Отступ и маска крошек — в карте. |
| NAV2-07 | `touch-target(block)` у страницы, e2e приведены к решению. |
| NAV2-08 | `min-inline-size: 24` у содержимого primary-вкладки. |
| NAV2-09 | Бейдж вкладки через `badge-anchor`, модификатор `--dot` свой. |
| NAV2-10 | `activeIcon` у вкладок, иначе `MIcon filled`. |
| NAV2-11 | Hairline `max(1px, 1rem)`, `spacing()` в карте tabs. |
| NAV2-12 | Toolbar: инстанс выбора всегда, режим модели через `useBoundProp`. |
| NAV2-13 | S9-А: `layout` → `orientation`, без алиаса. |
| NAV2-14 | Drawer: `spacing()`, атомарная шапка, фолбэки в `0rem`. |
| NAV2-15 | Nav-item: `spacing()`, размеры остаются rem. |
| NAV2-16 | `container.motion` в картах app-bar и rail, высоты рейла в карте. |
| NAV2-17 | Отдельный `stress.e2e.ts`: лимит 400 строк. |
| NAV2-18 | Dev-предупреждение проверяет e2e по консоли, в CI `skip`; в Vitest `import.meta.dev = false`. |

## Ломающие изменения и миграция

1. **`MToolbar` `layout` → `orientation`** (значения те же, `horizontal | vertical`).
   Тип `MToolbarLayout` → `MToolbarOrientation`, класс `ui-toolbar--layout-*` → `ui-toolbar--orientation-*`.
   Алиаса нет. Миграция: `layout="vertical"` → `orientation="vertical"`. Потребители вне моих файлов:
   - `playground/render/gallery/toolbar.vue:24` — `layout="vertical"` (локальная доска, вне git);
   - `ui/docs/app/components/docs/component/toolbar/Playground.vue:8,16` — `:layout`;
   - `ui/docs_v2/app/utils/docs/playgrounds/navigation.ts:66-68` — `layout` в `defaults`, `controls`, `bindings`;
   - `ui/docs_v3/app/examples/toolbar/actions.vue:16` — `:layout`.
   Внутри кита других потребителей нет.
2. **Пагинация на таче:** мишень кнопки страницы больше не растёт по инлайн-оси. Тап в зазор 8 между
   страницами ничего не нажимает — так записано в решении.
3. **app-bar вне `m-layout` с `sticky` (по умолчанию):** `box-sizing: content-box`. Если потребитель задаёт
   такому бару явную ширину (`width: 100%`), то боковые поля 4 + вырез добавятся к ней: бар выйдет за
   контейнер на 8rem и больше. При ширине `auto` (обычный случай) ничего не меняется.
4. **tabs:** из карты удалены ключи `badge.large.*` и `badge.small.*`. Внешних читателей нет.

## Не сделано и почему

- Ссылки `to` у bar/rail/drawer (B5.1a) и клавиатура toolbar (B5.6d) — отложены Q56-А.
- Все шаги «Документация» и демо `ui/docs/app/components/mix/MixNavigation.vue` (`#item`) — вне репо кита.
- `var(--sys-motion-easing-linear)` у scroll-driven маски крошек (`breadcrumbs/index.vue:211`) остался
  в `.vue`: его нет в моём списке, и это не переход.

## Вопросы (развилки без рекомендации)

Нет.

## Правки вне моих файлов, которые нужны

- `src/runtime/utils/text-field/supportLine.ts` → вынести `useBoundProp` в общее место
  (например `shared/utils/props/`). Зачем: теперь им пользуется и toolbar, а импорт из `text-field`
  в навигацию — случайная связь. Владелец файла — группа полей. Работает и без переноса.
- Сборка `useLayout.ts` / `utils/layout/**` правок не требует: двойного счёта нет, `layout.e2e.ts` зелёный.

## Проверки (команда → результат; что упало и почему)

- `npx vitest run` по папкам `ui/{app-bar,breadcrumbs,navigation-bar,navigation-drawer,navigation-rail,pagination,tabs,toolbar}`
  и `fragments/navigation-item`:
  - первый прогон — 640 тестов, 4 упали. Три — мои тесты dev-предупреждений: в Vitest
    `import.meta.dev = false`, тесты удалены, проверка перенесена в e2e. Четвёртый —
    `navigation-bar … draws the activeIcon` проверял `'mdi:star"'`; его сломала параллельная правка `MIcon`
    (класс `ui-icon__glyph` после имени). Заменил на регэксп `/mdi:star(?![-\w])/`, смысл теста прежний;
  - повторы — 250/250 (nav-bar, tabs, toolbar) и 252/252 (nav-item, bar, rail, toolbar) зелёные.
- `npx eslint` по моим папкам и фикстурам → 0 ошибок.
- `npx stylelint` по моим `.vue` и `.scss` → в первый раз 3 ошибки `scss/operator-no-unspaced`
  (`-$ring`), исправлено на `$ring * -1` → 0 ошибок.
- `npm run lint:scss` → 8 из 163 падают, все чужие (`menu/group`, `menu/item`, `dropdown`, `autocomplete`,
  `search`, `fragments/{dropdown,search}`: ключи `group.divider`, `item.disabled`, `surface.border`).
  Мои файлы компилируются.
- `npx playwright test` по `navigation|tabs|toolbar|pagination|app-bar|breadcrumbs` с `--output test-results/p2/navigation`:
  - первый прогон — 136 прошло, 13 упало. Одиннадцать — `vite-error-overlay intercepts pointer events`
    (оверлей dev-сервера от ошибок компиляции в чужих файлах). Одно — axe во время HMR-перезагрузки.
    Одно — настоящий дефект подписи `top` с неразрывным словом, исправлен;
  - перезапуск `--last-failed` — 12 прошло, 1 снова упал на оверлее (drawer axe);
  - второй перезапуск — 1/1 прошёл. Итог: всё зелёное.
- `npx playwright test playground/fixtures/layout` (только прогон после правок баров) → 49/49.
- `npx vue-tsc --noEmit`, отфильтрованный по моим файлам → в первый раз 2 ошибки TS2769 в моём
  `toolbar/tests/interaction.spec.ts` (тип обработчика `onUpdate:modelValue`), исправлено → 0.

## Не проверено

- Глазами ничего: вырезы и forced colors проверены вычисленными стилями и геометрией, не скриншотами.
- Только Chromium. Вырезы — через CDP `Emulation.setSafeAreaInsetsOverride`, на реальном iOS не проверял.
- Dev-предупреждение о числе пунктов проверено e2e только на dev-сервере (в CI тест пропускается).
- Прод-сборка и полный `npm run test` — у оркестратора.
- Вариант «app-bar вне `m-layout` с явной `width`» (см. ломающие изменения, п. 3) тестом не покрыт.
