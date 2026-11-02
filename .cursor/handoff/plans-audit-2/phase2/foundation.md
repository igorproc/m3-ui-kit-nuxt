# foundation — фаза 2

## Сделано (пункт → что изменилось → файлы)

1. **W70-А** — выбранная `MButtonIcon` заливает глиф: кнопка отдаёт контекст `provideGlyphFill(() => selected === true)`, `MIcon` в слоте рисует `baseline`-пару (`outline-star` → `baseline-star`), если задан свой `filled` или контекст. Невыбранная и обычная кнопка гасят заливку сверху. Слот `{ selected }` остаётся.
   `src/runtime/utils/icon/glyphFill.ts` (+ `glyphFill.spec.ts`), `utils/icon/useIconControl.ts`, `components/ui/button/icon/index.vue`, `components/ui/icon/props.ts` (JSDoc), `components/ui/button/icon/tests/variants.spec.ts`.
2. **app** — e2e ссылки «Перейти к содержимому» теперь идут: `playground/app/app.vue` задаёт `skip-link-label` только на `/app/matrix`, у фикстуры `app/matrix` — `id="main"`, `test.skip` в `beforeEach` заменён проверкой `href="#main"` и цели. `> *` у хоста оверлеев **не менял** — см. «Не сделано».
   `playground/app/app.vue`, `playground/fixtures/app/{matrix.vue,app.e2e.ts}`.
3. **icon** — (а) dev-предупреждение о корректном по форме, но неизвестном имени: на dev-сервере при SSR, только для набора `ic`, по локальному `@iconify-json/ic` (зависимость кита, без сети, в браузер данные не попадают). Проверено живьём на :3200 временной фикстурой (удалена): `[m-icon] \`outline-nonexistent-glyph\` draws \`ic:outline-nonexistent-glyph\`, which the \`ic\` set does not have…`; на `icon/matrix` предупреждений 0. (б) стили `.iconify` / `svg` → класс `ui-icon__glyph` на самом глифе.
   `utils/icon/{knownGlyphs.ts,knownGlyphs.spec.ts,iconName.ts,iconName.spec.ts,useIconControl.ts}`, `components/ui/icon/index.vue`, `components/ui/icon/tests/{variants,a11y}.spec.ts`, `playground/fixtures/icon/icon.e2e.ts` (проба «поздний глиф» узнаёт загрузку по `mask-image`, а не по ширине — ширину 1em глиф теперь держит и до загрузки).
4. **shape** — исходники Compose нашлись в кэше Gradle (`material3-android-1.5.0-alpha22-sources.jar`, `graphics-shapes-android-1.0.1-sources.jar`).
   - Ш1: ClamShell по `MaterialShapes.clamShell()` — алгоритм `RoundedPolygon` (сглаживание 0: дуги + прямые), `normalized()`, сетка 380 с полями 30. Ключ `clamShell` (36 фигур: 35 Compose + `hexagon`). Скрипт генерации — вне репо (scratchpad), в репо только результат: `assets/icon/shapes.ts`, `assets/icon/shapes/Shape=Clam shell.svg`.
   - Ш4: `M3_SPRING` = `StandardMotionTokens` (сверено); effects общие с `ExpressiveMotionTokens`; `it.todo` заменён спекой: переход `expressive` держит жёсткость 380 Compose, затухание 0.6 вместо 0.8 — сознательно. `utils/motion/index.spec.ts`.
   - Ш6: reduced motion — `reduceTransition` (дольше `short4` → `short2`, без крена, кривая сохраняется) вместо calm-пружины 262 мс. `composables/useShapeMorph.ts`, `useShapeMorph.spec.ts`.
5. **hotkey** — шрифт клавиши `label-medium`; нажатие — фон `secondary-container`, текст `on-secondary-container`, переход фона и цвета `short-3`, слой `::before` удалён. `assets/stylesheet/components/hotkey/_index.scss`, `components/ui/hotkey/index.vue`, `playground/fixtures/hotkey/hotkey.e2e.ts` (forced colors: тон нажатия ждётся `expect.poll`, т. к. фон теперь с переходом).
6. **lazy** — активатор только после монтирования: серверный HTML и гидрация без `role="button"`/`tabindex`/`--activator`; после монтирования граница без своего контрола — кнопка, как раньше. `typescale('body-medium')` → ключ `alert.message.typography`. `utils/lazy/useLazyControl.ts`, `components/ui/lazy/index.vue`, `assets/stylesheet/components/lazy/_index.scss`, `components/ui/lazy/tests/a11y.spec.ts` (SSR-спека ×2), `playground/fixtures/lazy/lazy.e2e.ts` (серверный HTML).
7. **virtual-scroll** — в.1: `itemSize` и `initialOffset` в CSS px (JSDoc в `types.ts`); в.2: при подключении контейнер у начала прокручивается к `initialOffset` (`instant`); в.3: `geometry.ts` → `utils/virtual-scroll/`, `VirtualRange` реэкспортирует `types.ts`; Home/End у сфокусированной горизонтальной ленты берёт композабл (только на самом контейнере, без модификаторов). `composables/virtual-scroll/{useVirtualScroll.ts (395 строк),types.ts,useVirtualScroll.navigation.spec.ts}`, `utils/virtual-scroll/{geometry.ts,geometry.spec.ts}`, `playground/fixtures/virtual-scroll/virtual-scroll.e2e.ts` (End/Home ltr и rtl).
8. **B1.7a** — перенесено из `composables/**` (автоимпорт) в `utils/**`: `icon/{iconName,useIconControl}`, `lazy/{lazyMachine,useLazyControl,useLazyIntersection,useLazyWarnings}`, `surface/useSurfaceClickWarning`, `grid/useGridContext`, `virtual-scroll/geometry` (+ спеки). Импорты поправлены в `components/ui/{icon,lazy,surface,container,col}/index.vue`. Публичными остались `useVirtualScroll` (+ типы) и `useShapeMorph` — в `docs/`, README и docs_v2 перенесённые имена не встречаются. `src/module.ts` не понадобился.
9. Журнал: surface в.1 → 1, lazy в.1 → 1 — `.cursor/handoff/plans-audit-2/decisions-foundation.md`.
10. `<implementation-status>` и «План работ» обновлены: `foundation/{app,hotkey,icon,layout,lazy,shape,surface,system-bar,use-hotkey,virtual-scroll}.md`, `button/icon.md` (docs-шаги — **отменено**, панели layout и переменная высота — **отложено**).

## Решения (ID → вариант → основание) — те же строки, что в журнале

- W70-А → контекст `utils/icon/glyphFill`, без нового пропа → имя глифа знает только потребитель, SSR верен.
- B1.7a → внутренности в `utils/{icon,lazy,surface,grid,virtual-scroll}`; `VirtualRange` реэкспорт из `types.ts` → тип публичного `range`.
- surface в.1 → 1 (не вводить `tone`) → рекомендация плана.
- lazy в.1 → 1 (уже в коде) → рекомендация плана.
- VS в.1 → 1 (px, JSDoc), 2 — при первом потребителе из кита → рекомендация плана.
- VS в.2 → 1 (`instant`, только у начала) → рекомендация плана; `instant` не даёт `scroll-behavior: smooth` потребителя анимировать первый кадр.
- VS в.3 → 1 → рекомендация плана.
- VS Home/End → композабл на горизонтальном контейнере, без модификаторов, только фокус на контейнере → браузер двигает по ним лишь блочную ось.
- ICON-1 → предупреждение только SSR + dev + набор `ic` → без сети и без 4 МБ в клиенте.
- ICON-2 → `ui-icon__glyph` → BEM.
- APP-1 → `> *` оставлен → принятое исключение `decisions.md`.
- APP-2 → подпись ссылки только на `/app/matrix` → не добавлять Tab-стоп всем фикстурам.
- SH-1 → ClamShell по Compose → исходники в кэше Gradle.
- SH-4 → Standard сверен, `expressive` 0.6/380 сознательно → план.
- SH-6 → `reduceTransition` → правило статуса плана.
- HK-1 → `label-medium`, `secondary-container` → токены плана и концепт.
- LZ-1 → активатор только на клиенте → наличие своего контрола известно только из DOM.
- LZ-2 → ступень шрифта в карте → правило карты токенов.

## Ломающие изменения и миграция

- **Автоимпорт.** Из приложения потребителя пропали глобальные имена: `createLazyState`, `isLazyMounted`, `transitionLazy`, `resolveLazyView`, `observeLazyIntersection`, `useLazyIntersection`, `useLazyControl`, `useLazyWarnings`, `resolveIconName`, `findIconNameProblem`, `useIconControl`, `useSurfaceClickWarning`, `useGridContext`, `provideGridContext`, `buildMeasurement`, `computeRange` и их типы (`LazyEvent/View/State`, `LazyControl*`, `Lazy*Attrs`, `IconControlProps`, `Icon*Attrs`, `UseIconControlReturn`, `GridContext`, `VirtualMeasurement`). Миграция — явный импорт из `#kit/utils/<папка>/<файл>` (кит 0.x, без шимов).
- **Вид.** `MHotkey`: клавиша крупнее (`label-medium`), нажатие — тон `secondary-container`. `MButtonIcon` с `selected`: `MIcon` с `outline-*`-именем в слоте рисуется залитым — потребитель, который сам менял пару через `{ selected }`, получает тот же результат; кто держал контурный глиф у выбранной кнопки намеренно, увидит заливку. `MShape`/`MLoading type="shape"` под reduced motion: морф 100 мс по своей кривой вместо 262 мс calm.
- **Поведение.** `MLazy` в `on-interaction` без JS (и до гидрации) не объявляет корень кнопкой. `useVirtualScroll`: с `initialOffset > 0` контейнер у начала прокручивается сам; у горизонтальной ленты Home/End на самом контейнере перехвачены (`preventDefault`).

## Не сделано и почему

- **`.ui-app__overlay-host > *` → BEM.** Не менял: `docs/system/ru-RU/decisions.md:119` — «Принятые исключения … `> *` в `app __overlay-host` и `overlay __panel`» (2026-10-23, обёртка слота чужих детей). Все поверхности кита (overlay, popover, menu, tooltip, snackbar) уже сами ставят `pointer-events: auto`; правило нужно только для контента потребителя, телепортированного в `#ui-overlay-host`. Без `>` возможны два пути, оба меняют контракт: убрать правило (такой контент станет некликабельным) или сделать хост полосой нулевой высоты без `pointer-events: none` (абсолютно позиционированный контент потребителя с `inset`/процентами по блочной оси потеряет высоту). Аудит отметил пункт «частично», не учтя исключение.
- **Page-клавиши у горизонтальной ленты** не делались: в пункте — только End/Home; браузер по PageUp/PageDown тоже двигает лишь блочную ось. Нужно — так же, как Home/End, ~10 строк, но `useVirtualScroll.ts` уже 395 строк.
- **Предупреждение о неизвестном имени** — только для набора `ic` и только при SSR на dev-сервере; SPA (`ssr: false`) и имена других коллекций получают лишь предупреждение самого `@nuxt/icon` (`[Icon] failed to load icon`).

## Вопросы (развилки без рекомендации)

1. **Пружины toggle-кнопок.** `button/morph.ts` (не мой файл) пишет «M3 Expressive springs as in Compose's ToggleButton (shape: fast spatial …)», а берёт `M3_SPRING.spatial.fast` = Standard 0.9/1400; у Compose Expressive fast spatial — 0.6/800 (`ExpressiveMotionTokens`, сверено). Варианты: 1) оставить Standard и поправить комментарий (без перелёта, согласно «без Expressive-движения»); 2) перейти на Expressive 0.6/800 (видимый перелёт углов, как в Compose). Рекомендации в планах нет.
2. **`> *` у хоста оверлеев** — если владелец хочет снять и это исключение, выбрать: 1) убрать правило и задокументировать, что свой контент в хосте ставит `pointer-events: auto` сам; 2) хост — полоса нулевой высоты без `pointer-events: none`.

## Правки вне моих файлов, которые нужны

- `button/morph.ts` — комментарий или пружина по вопросу 1.
- `playground/app/utils/fixtures.ts` — только `touch` (mtime) дважды: временная фикстура-проба для живой проверки предупреждения иконки, удалена.
- `shell/extract-shapes.js` — пути `app/assets/...` устарели (`src/runtime/assets/...`); я его не запускал, ClamShell добавлен в `shapes.ts` вручную тем же форматом, что даёт генератор (ключ `clamShell` из `Shape=Clam shell.svg`).

## Проверки (команда → результат; что упало и почему)

- `npx vitest run` по `utils/{icon,lazy,grid,surface,virtual-scroll,motion}`, `composables/{virtual-scroll,hotkey}`, `useShapeMorph.spec.ts`, `components/ui/{icon,button/icon,lazy,shape,hotkey,surface,app,container,col,row,layout,responsive}` → 55 файлов, 944/944.
- `npx eslint` по своим файлам → 0 (одна `padded-blocks` в `utils/motion/index.spec.ts` исправлена).
- `npx stylelint` по своим `.vue`/`.scss` → 0.
- `npm run lint:scss` → мои файлы чисто; упал только чужой `navigation-bar/index.vue:34` (`padding-inline: $margin` — карта вместо значения).
- `npx vue-tsc --noEmit` → 10 ошибок, все чужие (`menu/index.vue` ×6, `toolbar/tests` ×2, `selection-group`, `fixtures/chip-group/matrix.vue`); в моих файлах 0.
- `npx playwright test playground/fixtures/{app,icon,shape,surface,hotkey,lazy,virtual-scroll} --output test-results/p2/foundation` → 157 из 161 (путь `app` захватил и `app-bar`). Упали: `app` «switching the theme…», «system definition…», `app-bar` axe (dark, rtl) — `<vite-error-overlay>` перехватывал клики (чужая ошибка Sass в `dialog/index.vue:13` `max.width`, HMR-оверлей шлётся всем вкладкам); `icon` «a glyph that loads late…» — из-за моей правки (глиф держит 1em до загрузки), проба переписана на `mask-image`. Повтор: 9 из 10, `icon` «loads late» снова упал на том же оверлее `dialog`.
- `npx playwright test playground/fixtures/{icon,button,layout} --output test-results/p2/foundation` (button и layout — только прогон) → упало около 20 тестов `button`, все из-за окружения: `[data-fixture-ready]` не появился за 30 с (HMR-перезагрузки от параллельных правок) или клик перехватил `<vite-error-overlay>`. На dev-сервере падают чужие SCSS: `menu/group/index.vue:9` (`group.divider.width`), `dialog/index.vue:13` (`max.width`), а стили `dropdown`, `autocomplete`, `search` отдают 404. Повтор `--last-failed`: 10 упавших, причины те же (одна — `traceMotion … reading 'stop'`: страницу перезагрузили посреди трассы). `layout` в упавших нет.
- Живые пробы на :3200 (оверлей убран скриптом) вместо заблокированных e2e. W70-А на `button/family`: `icon-toggle-round-filled` до клика `aria-pressed=false`, глиф `i-ic:outline-add`, после клика `true` и `i-ic:baseline-check`. «Поздний глиф» на `icon/stress`: до ответа `/api/_nuxt_icon` `mask-image: none`, квадрат 16×16, после — `url(data:…)`, текст сдвинулся на 0,00 / 0,00.

## Не проверено

- Prod-сборка: что динамический `import('./knownGlyphs')` под `import.meta.dev` вырезается из клиентского и серверного бандла (по коду ветка мёртвая, Rollup не должен эмитить чанк) — `npm run build` гоняет оркестратор.
- Зелёного прогона `icon` «a glyph that loads late…» и `button/*` нет: их блокировали оверлей и перезагрузки от чужих правок. Логика обоих проверена пробами (см. выше), но прогон нужно повторить, когда чужие SCSS починят.
- Вид ClamShell глазами (фигура в `shape/matrix` появляется автоматически, axe и спеки каталога проходят).
- Нажатие `MHotkey` в тёмной теме глазами.
