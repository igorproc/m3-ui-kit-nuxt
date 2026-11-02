# form — фаза 2

## Сделано (пункт → что изменилось → файлы)

1. **checkbox Ш7/Ш8** — галочка и черта нарисованы своим SVG-путём (геометрия Compose в боксе 18,
   `pathLength="1"`): прорисовка `stroke-dashoffset` 1 → 0 на `medium-3` + `emphasized-decelerate`,
   снятие на `short-3` + `emphasized-accelerate`, масштаб 0.6 → 1 сохранён, прозрачность глифа —
   `short-1` + `linear`; reduced motion укорачивает системно (`medium-3` → `short-2`). Значения — в
   карте (`icon.stroke`, `icon.dash`, `icon.scale`, `motion.fade`). `stress.vue`: длинная подпись с
   `required` и поддержкой, URL, длинная ошибка, смешанные письменности, 12 строк с «выбрать все» в
   частичном выборе. e2e: стресс (axe ltr/rtl, переполнение на 360/768/1366), подпись переносится у
   бокса 18, «выбрать все» ↔ частичный выбор, длительность прорисовки и её укорочение при reduced
   motion, `short-1`/`linear` у глифа, forced colors для checked / mixed / error.
   `components/ui/checkbox/{index.vue,tests/variants.spec.ts,tests/a11y.spec.ts}`,
   `utils/choice/checkMark.ts` (новый), `assets/stylesheet/components/checkbox/_index.scss`,
   `playground/fixtures/checkbox/{stress.vue (новый),checkbox.e2e.ts}`.
2. **radio Ш1б/Ш4б/Ш7** — смена `value` у смонтированной радио перерегистрирует тикет (выбранная
   остаётся выбранной, модель группы следует новому значению); dev-предупреждение у безымянной группы;
   `stress.vue` (длинные подпись/ошибка/описание группы, URL, 16 вариантов, меняющийся `value`,
   безымянная группа) + e2e (axe ltr/rtl, переполнение, подпись после контрола в обоих направлениях,
   смена `value` → модель `b2`, предупреждение только у безымянной). Unit: смена `value` доходит до
   модели, выбранная радио несёт модель.
   `components/ui/radio/{index.vue,group/index.vue,tests/interaction.spec.ts}`,
   `playground/fixtures/radio/{stress.vue (новый),radio.e2e.ts}`.
3. **switch** — нажатая ручка — круг 28 (`flex-shrink: 0` у `__thumb`); ось `icons` (none / selected /
   both × off / on / disabled) в `matrix.vue`; `stress.vue` (длинная подпись, URL с `icons="both"`,
   ошибка, 12 настроек) + e2e (нажатая ручка 28×28 в обоих значениях, размеры ручки и наличие глифа по
   оси, глиф 16, стресс). `components/ui/switch/index.vue`,
   `playground/fixtures/switch/{matrix.vue,stress.vue (новый),switch.e2e.ts}`.
4. **chip** — generic `TValue` у `value` (`MChipPropsOptions<TValue>`, `generic="TValue = unknown"`);
   у `removal="button"` мишень 48 перенесена с обёртки на кнопки (главное действие — `::before`,
   удаление — `::after`); в `matrix.vue` — elevated (assist/filter/suggestion, выбранный, disabled) и
   input-чипы (аватар + удаление, иконка + удаление, `whole`, disabled); `stress.vue` (длинная подпись,
   URL, длинный input с аватаром, один символ, смешанные письменности, 40 чипов) + e2e (стресс,
   многоточие при высоте 32, тени elevated, стрелки и Enter у input-чипа, аватар 24, мишени на таче и
   тап над чипом). `components/ui/chip/{index.vue,props.ts}`,
   `assets/stylesheet/components/chip/_states.scss`, `playground/fixtures/chip/{matrix.vue,stress.vue
   (новый),chip.e2e.ts}`.
5. **chip-group** — удаление последнего чипа больше не роняет фокус на `body`: ряд снимает свой
   временный `tabindex="-1"` только по `focusout` самого ряда (раньше его сбрасывал `focusout`,
   который Chromium шлёт с удаляемого чипа). Новые фикстуры `chip-group/matrix.vue` (single, multiple +
   `max` + `required`, disabled, смешанный набор, данные `items`, поле с ошибкой, вертикаль, прокрутка,
   удаление, вставка в середину), `stress.vue` (120 чипов, длинные подписи, прокрутка, пустые данные) и
   `chip-group.e2e.ts` (axe, одна остановка Tab, кольцо стрелок ltr/rtl, вертикаль, пропуск по `max`,
   вставка, перенос фокуса и ряд после последнего, поле с ошибкой, кольцо крайнего чипа не обрезано).
   Unit на обработчик `focusout`. `components/ui/chip-group/{index.vue,tests/keyboard.spec.ts}`,
   `playground/fixtures/chip-group/*` (новая папка).
6. **slider** — dev-предупреждение `origin` на `range`; `&--dragging * { transition: none !important }`
   заменён модификаторами `ui-slider-track--dragging` (`__segment`, `__tick`) и
   `ui-slider-thumb--dragging` (`__handle`, `__value`), трек получил проп `isDragging`; `stress.vue`
   (0…1 000 000 шаг 0.01 с рублями `Intl`, такой же range, длинная подпись, 100 тиков, шаг 0.001,
   range с `origin`) + e2e. `components/ui/slider/index.vue`,
   `components/fragments/slider/{root,track,thumb}/index.vue`,
   `playground/fixtures/slider/{stress.vue (новый),slider.e2e.ts}`.
7. **rating** — `stress.vue`: `length` 10 и 20 (с половинами) в колонке 320 c `overflow-x: auto`,
   длинные подпись и ошибка; e2e: axe ltr/rtl, переполнение, ячейки 48 не сжимаются, End даёт 20,
   нажатие на последний значок прокрученной шкалы даёт 10. Файлы родителя (`rating/index.vue`,
   `utils/rating/pointer.ts`) не тронуты. `playground/fixtures/rating/{stress.vue (новый),rating.e2e.ts}`.
8. **selection-group N4 (а)** — scope `#default` в режиме данных отдаёт `rows` (VNode строк:
   `#item` на запись или `#empty`); потребитель ставит `<component :is="rows" />` внутрь обёртки с
   `groupAttrs`. Взятые из scope строки группа после слота не рисует, не взятые — рисует, как раньше;
   решение синхронно в рендере, SSR отдаёт строки один раз. `groupPatternAttrs` отдаёт
   `aria-disabled` отключённой группы. Фикстуры `selection-group/matrix.vue` (эталонная разметка:
   карточки `radiogroup` из данных, toggle-кнопки `MSelectionItem` под `max`, `listbox` multiple,
   отключённая группа `checkbox`, строки, оставленные группе) и `stress.vue` (1000 элементов) +
   `selection-group.e2e.ts` (axe light/dark × ltr/rtl и на 1000, строки внутри обёртки, серверный
   кадр, `aria-disabled`, блок по `max`, время выбора и «выбрать все» на 1000). Unit: строки в обёртке,
   выбор, `#empty`, нет `rows` вне данных, `rows` не попадает в spread, SSR, `aria-disabled`.
   `components/ui/selection-group/{index.vue,tests/*.spec.ts}`, `composables/selection/context.ts`
   (тип `rows`), `utils/selection/patternAttrs.ts`, `playground/fixtures/selection-group/*` (новая
   папка). `useSelectionGroup.ts` родителя не тронут.
9. **form-renderer** — постоянный `role="status"` (визуально скрыт) с пропом `statusText`; сводка
   ошибок: адаптер уже отдаёт карту ошибок через `CreateFormConfig.onValidationError` (vee-validate
   передаёт `ctx.errors`) — контракт не менялся. Сводка — `MAlert color="error"` над полями
   (`tabindex="-1"`, `announce="off"`, заголовок `errorSummaryTitle`), строки по порядку конфигурации,
   ссылки `#<id контрола>`, клик ставит фокус в поле; после неудачной отправки фокус на сводку, после
   успешной сводка исчезает. Dev-предупреждения: нет заголовка сводки (при показе), степперы `number`
   без `props.incrementLabel/decrementLabel`. Радиогруппа в `fieldset` получила `aria-labelledby` на
   легенду. Фикстуры `form-renderer/{matrix,stress}.vue` + e2e. Unit: имя радиогруппы, статус, сводка
   (порядок, фокус, ссылка → фокус поля, исчезновение).
   `components/ui/form-renderer/{index.vue,tests/a11y.spec.ts}`,
   `components/fragments/form-renderer/{field/index.vue,summary/index.vue (новый)}`,
   `composables/form-renderer/useErrorSummary.ts` (новый),
   `assets/stylesheet/components/form-renderer/_index.scss` (`summary.gap` 16 — ради axe `target-size`, `summary.indent`),
   `playground/fixtures/form-renderer/*` (новая папка).
10. **Планы** — `<implementation-status>` всех десяти `form/*.md` → `done`, `updated="2026-10-30"`;
    в «План работ» помечены **отменено**/**отложено**: switch Ш3 (`inset-inline-start`), chip Ш8,
    slider Ш5 (`useResizeObserver`), selection-group Ш1 и Ш3, selection-item Ш2, form-renderer Ш2
    (геттер `config`) и документация Ш7.

Все стресс-фикстуры группы — со своим корневым классом (`fixture-<имя>-stress`): общий глобальный
`.fixture-stress__narrow` других фикстур (`display: grid`) ломал раскладку.

## Решения (ID → вариант → основание) — те же строки, что в журнале

`.cursor/handoff/plans-audit-2/decisions-form.md`, F2-01…F2-16:
- F2-01 checkbox → свой SVG-путь, прорисовка на enter/exit, `short-1`/`linear`, без морфа → таблица токенов плана, S3/S4.
- F2-02 radio → перерегистрация вместо геттера; модель следует выбранной радио → реестр индексирует по значению; как у нативной радио.
- F2-03 radio → dev-предупреждение безымянной группы → образец `MChipGroup`.
- F2-04 switch → `flex-shrink: 0` у ручки → корень овала.
- F2-05 chip → `MChipPropsOptions<TValue>` в `chip/props.ts` → приём `MDropdownPropsOptions` без зависимости от файла dropdown.
- F2-06 chip → мишень у обеих кнопок, обёртка без мишени → S8; цена — мишень удаления заходит на конец подписи ≈ 7rem.
- F2-07 chip-group → `focusout` только от самого ряда → корень дефекта.
- F2-08 slider → dev-предупреждение, поведение прежнее → W2-А.
- F2-09 slider → BEM-модификаторы трека и ручки вместо `*` + `!important`; модификатор корня оставлен → правила кита.
- F2-10 selection-group → `rows` (VNode) в scope; взяли — рисует потребитель, нет — группа → N4 (а); SSR один раз; без тихой потери строк.
- F2-11 selection-group → `aria-disabled` у отключённой группы → ВГ-1.
- F2-12 form-renderer → `statusText` + `sr-only` `role="status"` → DT-09, образец file-upload.
- F2-13 form-renderer → сводка на `onValidationError` без смены контракта, `MAlert`, фокус, ссылки → FM-11, запрет менять адаптер.
- F2-14 form-renderer → dev-предупреждение по полю `number` → N5 (а).
- F2-15 form-renderer → `aria-labelledby` радиогруппы на легенду → аудит a11y.
- F2-16 rating → колонка 320 прокручивается, ячейки 48 → W26-А.

## Ломающие изменения и миграция

- **MCheckbox**: глиф — `<svg class="ui-checkbox__icon"><path class="ui-checkbox__mark">`, а не
  `MIcon` с `ICONS.check`/`ICONS.remove`. Стили потребителя по `.ui-checkbox__icon .ui-icon` /
  `font-size` глифа перестают действовать; цвет по-прежнему — `color` на `.ui-checkbox__icon`. В ките
  потребителей таких стилей нет.
- **MChip `removal="button"`**: у обёртки `<span class="ui-chip--multi">` больше нет `::after`-мишени
  (на таче); мишени — на `__action::before` и `__remove::after`. Своё оформление `__action::before`
  у потребителя конфликтует с мишенью.
- **MChip**: компонент стал generic (`TValue` выводится из `value`) — тип `value` в шаблонах
  потребителя проверяется строже; рантайм тот же.
- **MSlider**: корень больше не гасит переходы у всех потомков при перетаскивании — только у частей
  кита (сегменты, тики, ручка, капсула). Своё содержимое слотов (`#value`, `#label`) при
  перетаскивании анимируется по своим правилам. Класс `ui-slider-root--dragging` остался.
- **MSelectionGroup**: scope `#default` в режиме данных получил `rows`; кто его взял, тот рисует
  строки сам (раньше строки всегда шли после слота). `groupAttrs` отключённой группы несут
  `aria-disabled`. Аддитивно для тех, кто `rows` не трогает.
- **MFormRenderer** (видимое): после неудачной отправки над полями появляется сводка `MAlert` и
  получает фокус; в форме есть скрытый `role="status"`. Новые пропы `errorSummaryTitle`,
  `statusText` — без дефолтов (без заголовка сводка рисуется без заголовка + dev-предупреждение).
- **MRadioGroup**: группа без имени предупреждает в деве — внутри кита все вызовы названы
  (`form-renderer` — легендой, demo `NewOrderDeliveryFields.vue` — `aria-labelledby`).

## Не сделано и почему

- Позитивный случай dev-предупреждения о степперах `number` не проверен: в Vitest `import.meta.dev`
  = `false`, а e2e-фикстура с безымянными степперами упала бы на axe `button-name`.
- Документация в репозитории `docs` (шаги планов) — вне репозитория кита.

## Вопросы (развилки без рекомендации)

Нет.

## Правки вне моих файлов, которые нужны

- `src/runtime/composables/useFormSchema.ts` (JSDoc `FormFieldConfig.props`) → упомянуть, что полю
  `number` со степперами нужны `incrementLabel` и `decrementLabel` → API-документация конфигурации.
- `docs/system/{ru-RU,en-US}/decisions.md` → свести F2-01…F2-16 (оркестратор).

## Проверки (команда → результат; что упало и почему)

- `npx vitest run src/runtime/components/ui/{checkbox,radio,switch,chip,chip-group,slider,rating,selection-group,form-renderer} src/runtime/composables/slider src/runtime/utils/rating --coverage.enabled=false`
  → 35 файлов, 630 тестов, зелёные. По пути падали 2 новые спеки сводки form-renderer: корень поля
  радио в dev — фрагмент (комментарий перед `<fieldset>`), `$el` — текстовый якорь; починено в
  `useErrorSummary` (`nextElementSibling` якоря).
- `npx eslint <мои папки и фикстуры>` → 0 ошибок (было 1: неиспользуемая группа в регэкспе e2e).
- `npx stylelint <мои .vue и .scss>` → 0 ошибок.
- `npm run lint:scss` → «163 stylesheets compiled, no deprecations» (на первом прогоне падали только
  чужие `menu`/`dropdown`/`search` — их чинила группа menu).
- `npx vue-tsc --noEmit` → в моих файлах 0; были 2 (`fixtures/chip-group/matrix.vue` — `item`
  `unknown` в `#item`, теперь подпись по `index`; `selection-group/index.vue` — приведение
  generic-SFC к `Component` через `unknown`). Осталось чужое: `composables/menu/useMenuControl.spec.ts`
  (×3).
- `npx playwright test playground/fixtures/form-renderer --output test-results/p2/form` → 13/13
  (раньше страницы отдавали 500 из-за чужой SCSS-ошибки в `MDropdown`; после неё упали 2 моих:
  axe `target-size` у строк сводки — промежуток 4 → 16; `check()` радио перекрыт нарисованным
  кругом — клик по подписи).
- `npx playwright test playground/fixtures/{checkbox,radio,switch,chip,chip-group,slider,rating,selection-group} --output test-results/p2/form`
  → 155/156; упавший «выбрать все» кликал по скрытому нативному инпуту под нарисованным боксом —
  тест кликает по подписи, перезапуск 1/1. Предыдущие прогоны (до паузы) ломал `vite-error-overlay`
  из чужих файлов (`dropdown/_index.scss:53`, `surface.border.radius`): он перехватывал клики и
  `page.mouse` во всех фикстурах; в последнем прогоне оверлей мелькнул один раз, на итог не повлиял.
- По пути найдено и исправлено в фикстурах: общий глобальный `.fixture-stress__narrow` других
  стресс-фикстур (`display: grid`) растягивал чип — у стресс-фикстур группы теперь свой корневой класс.

## Не проверено

- Глазами — ничего (тёмная тема, forced colors скриншотами, анимация прорисовки галочки).
- Только Chromium. Время выбора на 1000 элементов мерилось на dev-сервере (пороги 500 / 1500 мс),
  prod-сборку не мерил.
- Чтение сводки ошибок и `role="status"` скринридером — только по разметке (фокус, `aria-*`), живьём
  NVDA/VoiceOver не слушал.
