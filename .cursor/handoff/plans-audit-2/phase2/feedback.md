# feedback — фаза 2

## Сделано (пункт → что изменилось → файлы)

1. **alert и banner.**
   - Имя закрытия «`closeLabel`: `title`» (A11-04). Оно же уходит в `props['aria-label']` слота `close`. Если заголовок задан только слотом, имя — `closeLabel`. Файлы: `src/runtime/utils/feedback/useFeedbackBlock.ts` (`closeNameWithTitle`), `src/runtime/components/ui/{alert,banner}/index.vue`.
   - Отступы через `spacing()`, шорткаты разложены на `block` / `inline`. Файлы: `src/runtime/assets/stylesheet/components/{alert,banner}/_index.scss` (в том числе `actions.*` у `BannerActions`).
   - Alert: `&__title + &__body` убран, `__content` стал колонкой с `gap`.
   - Banner: `:not(:has(> .ui-banner__icon))` заменён на модификатор `ui-banner--icon`.
   - Unit: имя с заголовком (в DOM и в SSR слота), заголовок слотом, модификатор иконки. Файлы: `ui/{alert,banner}/tests/{a11y,variants}.spec.ts`.
   - e2e: длинный токен на 360, forced colors, имена закрытий, Tab после закрытия, axe light / dark. Файлы: `playground/fixtures/feedback/blocks.vue`, `blocks.e2e.ts`.
2. **loading.**
   - `contained` + `type="shape"`: индикатор 38, смещение 5 в контейнере 48. Составной селектор `.ui-loading--contained .ui-loading__shape.ui-shape`, концы `auto`, размеры в карте (`contained.indicator.size`). Файлы: `ui/loading/index.vue`, `assets/stylesheet/components/loading/_index.scss`.
   - Unit «inline в `<p>`»: в SSR только phrasing-элементы, один `<p>`, гидратация без mismatch — для обоих типов. Файл: `ui/loading/tests/ssr.spec.ts`.
   - e2e геометрии contained в ltr и rtl. Файлы: `playground/fixtures/loading/{matrix.vue,loading.e2e.ts}`.
3. **progress.**
   - Ось `shape: 'flat' | 'wavy'` вместо `wavy` (S10 = А).
   - Circular:
     - видимый зазор 4: круглые концы, в штрихе `gap + stroke`, `min(значение, зазор)`;
     - старт в 12 часов по часовой;
     - дуга при 0 и трек при 100% не рисуются;
     - геометрия кольца — в TS-карте по Compose: амплитуда 1.6, длина волны 15, толщина плотности; длина пути — сумма отрезков.
   - Linear-волна по Compose: высота 10, период 40 / 20, амплитуда 3, штрих — толщина плотности. Трек у `wavy` плоский, со stop и зазором.
   - Радиус `corner-full`, `contain: layout style`, `aria-valuenow` округлён.
   - Подпись-слот вне `role="progressbar"`, связь через `aria-labelledby`. Роль и прочие fallthrough-атрибуты — на внутреннем элементе; `class` и `style` — на корне.
   - Файлы:
     - `ui/progress/{props.ts,index.vue,linear/index.vue,circular/index.vue}`;
     - `composables/progress/{useProgress.ts,circularTokens.ts}` (`circularTokens.ts` новый);
     - `utils/progress/{useProgressbar.ts,useProgressNameWarning.ts}` (`useProgressbar.ts` новый);
     - `assets/stylesheet/components/progress/_index.scss`.
   - Unit: `ui/progress/tests/{variants,a11y}.spec.ts`, `composables/progress/useProgress.spec.ts`.
   - e2e:
     - `playground/fixtures/feedback/progress.e2e.ts` (новый): высота и период волны, stop у wavy, радиус, `contain`, старт и направление кольца, зазор, имя от подписи, axe, forced colors;
     - `matrix.vue` и `feedback.e2e.ts` переведены на `shape="wavy"`, добавлены подписанные индикаторы.
4. **snackbar.**
   - Пустой `label` без слота: плашка не рисуется, таймер и стек не запускаются, при открытии — dev-warn (CT-07).
   - Отступы через `spacing()`: 14 = `calc(spacing(12) + spacing(2))`, `action.padding` разложен на `block` / `inline`.
   - Файлы: `ui/snackbar/index.vue`, `assets/stylesheet/components/snackbar/_index.scss`, `ui/snackbar/tests/{variants,interaction}.spec.ts`.
   - e2e: на 360 плашка в 16 над navigation bar, длинный URL, forced colors, пустое сообщение и его dev-warn, axe. Файлы: `playground/fixtures/feedback/snackbar.vue`, `snackbar.e2e.ts`.
5. **badge.**
   - Фикстура: содержимое (точка, 7, 42, 999, `99+`, «Новые», пусто) × хост (иконка 24, icon button, bar, rail) × dir.
   - e2e: угол по формуле `BadgedBox` в ltr и rtl на иконке, в icon button, в bar и в rail; пустое значение; `99+` и многоточие; forced colors; axe по THEMES × DIRECTIONS.
   - Файлы: `playground/fixtures/badge/matrix.vue`, `badge.e2e.ts` (новая папка).
6. **S6 / S7** — не делались, записаны в журнал (F2-16, F2-17).
7. **Планы.** Обновлены `<implementation-status>` всех семи планов `feedback/*.md`. Отменённые и отложенные шаги помечены в «План работ».
   - `done`: alert, banner, banner/actions, loading, progress.
   - `partial`: snackbar (очередь отложена, B4.9c) и badge (вкладки — группа navigation).
   - Пометки в «План работ»: alert 8, banner 1 / 2 / 9, banner/actions (строки 1–2 таблицы), loading 2 / 5 / 8, progress 6 / 7 / 8, snackbar 5 / 7 / 9, badge 4 (вкладки).

## Решения (ID → вариант → основание) — те же строки, что в журнале

Журнал: `.cursor/handoff/plans-audit-2/decisions-feedback.md`, строки F2-01 … F2-22. Кратко:
- F2-01: имя закрытия «`closeLabel`: `title`»; если заголовок задан слотом — только `closeLabel` (текст слота в SSR не прочитать).
- F2-02: заголовок и тело alert разделяет `gap` колонки, а не модификатор.
- F2-03: модификатор `ui-banner--icon`.
- F2-04: отступы — `spacing()`; размеры остаются литералами rem в карте.
- F2-05: contained shape — составной селектор, концы `auto`.
- F2-06: зазор circular по Compose: круглые концы, `gap + stroke`, `min(sweep, gap)`.
- F2-07: старт кольца в 3 часа плюс поворот −90° дают 12 часов.
- F2-08: токены кольца — TS-карта `circularTokens.ts`, потому что `d` и штрихи — SVG-атрибуты для SSR.
- F2-09: волна linear по Compose, трек у `wavy` плоский (концепт и Compose).
- F2-10: радиус `corner-full`.
- F2-11: роль на внутреннем элементе. Подпись: у linear под баром, у circular сбоку.
- F2-12: `aria-valuenow` округляется до 1% порядка `max`, но не грубее целого.
- F2-13: `contain: layout style`.
- F2-14: S10 = А.
- F2-15: пустой снекбар не показывается и не тикает.
- F2-16 / F2-17: S6 = Б, S7 = Б.
- F2-18: фикстура бейджа без вкладок.
- F2-19: axe снекбара — на 1366.
- F2-20: e2e снекбара и alert / banner — в `fixtures/feedback/`, чужие папки фикстур не созданы.
- F2-21: радиус и толщина плоского кольца по Compose не менялись (вне списка).
- F2-22: `aria-valuemax` — сырой проп `max`, как было; при `max ≤ 0` расходится с геометрией (берёт 100).

## Ломающие изменения и миграция

- **`MProgress` / `MProgressLinear` / `MProgressCircular`.**
  - Пропа `wavy` больше нет: `<MProgress wavy>` → `<MProgress shape="wavy">`. Алиаса нет.
  - DOM:
    - `role="progressbar"` и `aria-*` перешли с корня на `.ui-progress__indicator` (linear) или `<svg class="ui-progress__svg">` (circular);
    - туда же уходят fallthrough-атрибуты, кроме `class` и `style`;
    - размер кольца задан на `<svg>`;
    - без слота бокс корня прежний.
  - Слот по умолчанию теперь подпись рядом с индикатором, и она называет progressbar (`aria-labelledby`). Значение («40%») передавайте через `valueText`, а не слотом.
  - Классы волны: `.ui-progress__wave--active` → `.ui-progress__wave`. `.ui-progress__wave--track` удалён: у волны плоский `.ui-progress__track`.
  - Вид:
    - волна linear 14 → 10 при `default`, период 20 → 40;
    - волнистое кольцо: штрих 6 → 4, 10 → 8 волн, амплитуда 2 → 1.6;
    - кольцо начинается в 12 (было 6), зазор виден;
    - при 0 нет точки-дуги, при 100% нет трека.
  - Потребители `wavy` внутри кита — в моих файлах их нет. Вне моих:
    - `playground/fixtures/feedback/audit-feedback.vue:149` — `wavy` → `shape="wavy"`, или файл уходит вместе с audit-фикстурами;
    - `playground/render/gallery/progress.vue` — вне git, всё ещё на старом `:expressive`;
    - `../docs_v3/app/examples/progress/wavy.vue` — на удалённом `expressive`.
- **`MSnackbar`.** Пустой `label` без слота больше не рисует пустую плашку: ничего не показывается, таймаут не наступает.
- **`MAlert` / `MBanner`.** Имя кнопки закрытия теперь включает заголовок. Тест на точное имя «Dismiss» нужно поменять на «Dismiss: <title>».

## Не сделано и почему

- Документация `../docs_v3` (alert, loading, progress, snackbar) — вне репо кита, §6 отчёта.
- Очередь снекбаров `$material.snackbar` — B4.9c, Q56-А, §6.
- Бейдж во вкладках на `badge-anchor` и e2e угла во вкладках — группа navigation.
- `delay` / `minDuration` (S6 = Б), `label` у `MLoading` (S7 = Б).
- Радиус и толщина плоского кольца по Compose: при боксе 40 кольцо 18 / 4, а у нас из-за viewBox 48 выходит 15 / 3.33. Этого нет в моём списке, и тогда viewBox пришлось бы считать от плотности — заметка на будущее.

## Вопросы (развилки без рекомендации)

Развилок без рекомендации нет. Владельцу стоит просмотреть два выбора, сделанных по плану, концепту и Compose:
- F2-11 — подпись linear под баром, circular сбоку. В плане сказано просто «рядом».
- F2-09 — трек у `wavy` плоский. Сейчас в ките он волнистый; плоский — как в концепте и Compose.

Ещё S10: ось `shape` у `MProgress` значит «форма линии», а в `axes.md` `shape` — шкала скруглений. Это записать в `axes.md` или переименовать.

## Правки вне моих файлов, которые нужны

- `docs/system/{ru-RU,en-US}/decisions.md:161` — `wavy` заменить на ось `shape`, перенести строки F2-01 … F2-22 (оркестратор).
- `docs/system/*/axes.md` — оговорка про `shape` у `MProgress` (S10).
- `src/runtime/assets/stylesheet/components/tabs/_index.scss:81-90` и `src/runtime/components/ui/tabs/tab/index.vue:201-210` — бейдж на `badge-anchor(large|small)`, плюс e2e угла в фикстуре tabs (группа navigation).
- ~~`dropdown/_index.scss:53`~~ — к повторному прогону починено группой menu, правка больше не нужна.
- `playground/fixtures/feedback/audit-feedback.vue:149` — `wavy` → `shape="wavy"`, или удалить вместе с audit-фикстурами.
- `playground/probes/plans-audit-2/feedback/progress.probe.ts` (вне git) — ищет `.ui-progress__wave--track`, а `testId` теперь указывает на элемент с ролью.

## Проверки (команда → результат; что упало и почему)

- `npx vitest run src/runtime/components/ui/{alert,banner,loading,progress,snackbar,badge} src/runtime/composables/progress src/runtime/utils/snackbar --coverage.enabled=false` → 21 файл, 289 тестов, все зелёные. После выноса `useProgressbar` повторно прогнаны progress и composables: 4 файла, 105 тестов, зелёные.
- `npx eslint <мои src, фикстуры feedback / loading / badge>` → 0 ошибок.
- `npx stylelint <мои .vue / .scss>` → 1 ошибка (`scss/dollar-variable-empty-line-before` в `loading/_index.scss`), исправлена; повтор — 0.
- `npm run lint:scss` → в первом прогоне 8 из 163 падали, все чужие (`dropdown/_index.scss:53` и `ui/menu/{group,item}`); после снятия паузы — «163 stylesheets compiled, no deprecations».
- `npx playwright test playground/fixtures/feedback playground/fixtures/loading playground/fixtures/badge --output test-results/p2/feedback`:
  - последний полный прогон — 59 прошло, 5 упало; повтор упавших спеков — 17 прошло, 2 упало;
  - каждый мой тест прошёл хотя бы в одном прогоне;
  - причины падений внешние: `vite-error-overlay` перехватывает клики (Sass-ошибка в `dropdown/_index.scss:53`, см. выше) и HMR-перезагрузки от параллельных правок («Execution context was destroyed»);
  - по ходу исправлены мои ошибки: угол зазора в тесте кольца и `left` у contained shape в rtl;
  - axe на 360 с открытым снекбаром даёт `target-size` у закрытия 40rem — это vw-шкала (RS-04/05/06), поэтому axe снекбара гоняется на 1366;
  - **после снятия паузы** (чужая SCSS починена, overlay нет): тот же прогон — **64 прошло, 0 упало**.
- `npx vue-tsc --noEmit` → ошибки только в `playground/fixtures/chip-group/matrix.vue` и `src/runtime/components/ui/selection-group/index.vue`, не мои. В моих файлах 0.

## Не проверено

- Prod-сборка и prod-e2e: порядок чанков. Составные селекторы стоят там, где родительский класс садится на корень ребёнка.
- Озвучка реальными скринридерами (NVDA / VoiceOver): `aria-labelledby` подписи и округлённое `aria-valuenow` проверены только по атрибутам и `getByRole(name)`.
- Firefox / Safari: `mask` у волны, `:not(a, b)` у кольца, хит-тест штриха — e2e только Chromium.
- Визуальная форма волны (квадратичная кривая против синуса Compose): проверены только высота, период и маска, пиксели не сравнивались.
- Пропущенные dev-warn (пустой снекбар) проверены только в dev-e2e; в prod тест пропускается.
