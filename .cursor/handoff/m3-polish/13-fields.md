# Бриф группы «Поля» (`w3-fields`)

> Читается вместе с `00-common.md`. Состояние на 2026-10-18 (ветка `components/redisign-update`,
> HEAD `c9da731`; вся переработка группы — в этом коммите «feat(components): save»). Незакоммиченное в
> рабочем дереве (`src/module.ts`, `shared/types/kit.ts`, `utils/typography/**`) к группе не относится.
> Пути ниже — от `src/runtime/`, если не сказано иное. **Ф** — факт (код/план/summary/решение),
> **Г** — гипотеза по чтению кода, проверяется пробой.

## 0. Компоненты и файлы

Префиксы: ui = `components/ui/`, cmp = `composables/`, st = `assets/stylesheet/components/`; план —
`.cursor/plans/feature/components-should-update/inputs/<name>.md` (все `state="done"`, 2026-10-08), QA —
`.cursor/summary/runs/quality/data/<name>.json`, concept — `.cursor/plans/feature/renders/<name>/concept.webp`,
фикстуры — `playground/fixtures/<name>/{matrix,stress}.vue + <name>.e2e.ts` (e2e есть у всех трёх).

| Компонент | M3? | Файлы (строк) | src всего |
|---|---|---|---|
| `MTextField` | M3 filled/outlined + авторский `underline` | ui/text-field/{index.vue 416, props.ts 144, useFieldShape.ts 25}; cmp/text-field/{useTextField 97, useTextFieldControl 177}; st/text-field/{_index 211, _label 136, _states 256} | 1462 |
| `MTextarea` (+`MTextareaFooter`) | M3 multiline + авторские ручка/футер | ui/textarea/{index.vue 362, footer.vue 101, props.ts 52}; cmp/textarea/{useTextareaControl 301, useTextareaResize 314}; st/textarea/{_index 191, _label 104, _parts 130, _states 215} | 1770 |
| `MNumberInput` (+`unit.vue`) | **авторский** (§0.27) | ui/number-input/{index.vue 391, unit.vue 276, props.ts 70}; cmp/number-input/{useNumberInputControl 307, useNumberValue 302, useNumberScrub 106}; st/number-input/{_index 277, _label 146, _parts 72, _states 207, _zones 144} | 2298 |

Спеки: `ui/text-field/index.spec.ts`, `ui/textarea/tests/*`, `ui/number-input/tests/*` + спеки трёх
control-композаблов. `fragments/`, `utils/` у группы нет. `useFieldShape` лежит в `ui/text-field/`, чтобы
не попасть в автоимпорт (план text-field).

CSS (мой замер тем же Sass, что `lint:scss`, expanded / compressed, байт): text-field 15 833 / 14 282 ·
textarea 13 149 / 11 577 · footer 601 / 427 · number-input 18 785 / 17 052 · unit 2 874 / 2 412.
Официальная метрика — выходной CSS из prod-сборки, `.cursor/temp/m3-polish/baseline/css-sizes.json` (P0). `lint:scss` на HEAD:
152 стиля, 0 deprecations, **0 дефисных путей** во всём ките.

**Адресация в заявках.** `data-test` уходит **на нативный контрол** (`<input>`/`<textarea>`), не на
корень (`useControlAttrs`). Корень — `.ui-text-field:has([data-test="enabled-filled"])` (e2e:
`xpath=ancestor::…`, `text-field.e2e.ts:8`). Пример пробы в `00-common` §2.5 написан уже с этой адресацией.

`data-test` в матрицах: text-field `<state>-<variant>` (state: `enabled populated helper required
readonly error flagged disabled`; variant: `filled outlined underline`; лейбл `float`),
`placement-{top,float,inset,hidden}` (outlined + prepend), `affixes`, `suffix-outlined`,
`error-append-<variant>`, `density-<d>`; stress: `long-label long-word-helper long-word-error zero
placeholder mixed-script toggle-field` (+ кнопка `toggle-error`). Textarea `<state>-{filled,outlined}`
(state: `enabled populated helper required counter resizable readonly error flagged disabled grow-empty
grow-full over-limit`), `placement-*`; stress: `long-label long-word-helper long-word-error capped
near-limit mixed-script` (футер, кнопка `send`), `disabled-composer`. Number-input
`<state>-<variant>-<controls>` (state: `empty populated error bare-error readonly disabled`; controls:
`split stacked scrub none`), `density-*`, `family-{text,number,stacked}-<d>`, `unit-menu`,
`unit-static`, `keyboard`, `keyboard-next`; stress: `long-label long-label-outlined long-scrub long-unit
long-word empty huge negative locale mixed-script`.

**Пробелы фикстур (Ф):** нет `#prepend`/`#append` у textarea и number-input; нет underline + prepend и
filled + prepend + append с длинным лейблом у text-field; `labelPlacement` у text-field только на
outlined; нет stacked/scrub × `inset`. Фикстуры — твои файлы (не `src/`).

## 1. Решения владельца — не переспрашивать

Семейные (все три поля):
- Фокус = **только цвет рамки** (без кольца, утолщения, смены стиля; `color-and-state.md`). Фокус старше
  ошибки на рамке, лейбл/текст/глиф — error (Q7 фазы D). Read-only показывает фокус.
- Плавающий лейбл **не анимируется**; `float` — позиция на верхней кромке с первого кадра,
  плейсхолдер виден в покое (text-field Q1 → 1; `decisions.md` «Floating label never animates»).
- Вырез outlined — **только `fieldset`/`legend`** (SSR-верно, без JS). Подложка и clip-path+JS
  отвергнуты (память `ssr-first-paint-correct`, digest g2 §3).
- Лейбл рядом с prepend — **52rem, контракт** (12 + 24 + 16, `text-field/_index.scss:31-34`); на вырезе
  возвращается к началу контента. У `split` — 60rem. **Слотам prepend/append max-width не ставить.**
- Строка поддержки **всегда зарезервирована** (16), `role="alert"` смонтирован всегда, helper вне
  региона, ошибка не только цветом (глиф); `aria-invalid` — только при видимой ошибке (Q8).
- Disabled: контент 38%, outline 12%, индикатор filled 38%, filled-контейнер **4%
  `disabled-container-subtle`** (единственное исключение, `decisions.md`); helper 38% — исключение WCAG.
- Hover filled — слой `::before` 8% в чернилах контента; outlined — **только кромка** (+ лейбл
  `on-surface`). Error+hover — `on-error-container`. Каретка `primary` / `error`.
- `inheritAttrs: false` + `useControlAttrs` (Q9): `class`/`style` на корень, остальное на контрол.
- Ось `shape` (`none | extra-small | medium | large | full`), `rounded` — алиас с dev-warn на релиз;
  `full` у filled ограничен `large`. `density` — `compact 44 | default 56 | comfortable 64`, только у
  однострочных; у textarea **density нет** («бесполезна»).
- Лейбл `top` = `body-medium` во всей семье (Q3 → 1).
- Отвергнуто: `ghost`, `code`, `terminal`, `underline` у textarea/number-input/dropdown, `inline`-лейбл,
  `MFieldGroup` сейчас, общий `FieldRoot`-компонент («общая только SCSS», digest g1a), колесо мыши,
  `slider-bound`, отдельные пропы scrub/split/stacked, разделители внутри контрола.
- Логика композитов (чипы) — в композитах, не в `MTextField` (digest g1a). `text-field/index.vue` > 400
  строк — принятое исключение, выносить `<style>` владелец отказался.
- Хайрлайн = `max(1px, 1rem)` во всех outlined-картах — решение 2026-10-08, переводить при касании.

`MTextField`: `underline` остаётся (`decisions.md`); счётчика **нет** (Q4 → 2, `decisions.md`); reveal
**нет** (Q6 → 2); `prefix`/`suffix` — пропы-строки (Q5 → 1); `type="number"` и `populated` — dev-warn;
filled 56 = высота плотности (LY-02).

`MTextarea`: лейбл по умолчанию `top`; overlay-лейбл поднят сразу, `float`/`inset` различаются только на
outlined; счётчик в строке поддержки, `over` при display-only лимите; рост — **одна механика на
браузер** (`field-sizing` или `sync()`), ручная высота старше `autoGrow` до Escape; ручка 44×5, цель
72×24, `role="separator"`; футер в disabled гаснет ролями + `inert`, read-only — только `inert`, слоты
футера получают `{ disabled, readonly }` (ST-06, 2026-10-08).

`MNumberInput`: одна ось `controls`; зоны — тональные объекты на ступень круглее коробки, слой 8/12% +
ripple, **формы нажатия нет** (Q1 → 1); зона на границе гаснет целиком; `type="text"` + `inputmode`;
клампить только на коммите; Enter коммитит и не мешает сабмиту; Escape откатывает, без правки уходит
наверх; зоны вне Tab; unit только переименовывает; `alertAttrs` отдельно от `supportAttrs`.

## 2. Что осталось от прошлых раундов

**MTextField**
- Шаг 8 (счётчик) и reveal **не делались по решению** (Q4 → 2, Q6 → 2) — не хвост, не предлагать.
- Открытые вопросы фазы D (все три поля) — §3; плюс общий миксин `:autofill` и `letter-spacing` в
  `typescale`. Поднимать, только если находка аудита их касается.
- `fragments/form-renderer/field/index.vue:18-25` — `MTextField type="number"` (dev-warn) и «textarea»
  однострочным полем: вне группы, major у дашбордов (`integration-and-dashboards_2026-10-08.md`).
- UX-предложения плана (не шаги): `clearable`, подсказки клавиатуры по `type`, `v-model.trim/.lazy`.

**MTextarea**
- Шаг 6 («футер ролями»), числившийся в «Не сделано» inputs-summary, **закрыт** решением владельца
  вечером 2026-10-08 (ST-06 → PASS). Хвоста нет.
- Открыто ещё IN-04 (нужен ли ручке `focus-ring` как «не-полю»), остальное — §3.
- UX-предложения: Ctrl/⌘+Enter → `submit`, каретка в зоне видимости при росте.

**MNumberInput**
- Хвост «scrub + filled + float/inset — значение на 8rem ниже» (summary 2026-09-30, digest g2) —
  **починен (Ф):** ветка паддинга исключает scrub (`number-input/_label.scss:88-102`), e2e «the scrub
  handle and the value share one line» (`number-input.e2e.ts:223`) зелёный 2026-10-08. Покрыт только
  `populated-filled-scrub` (float); scrub × `inset` и outlined — осмотр №6 (§9).
- Концепты скраба A–D (2026-09-30, «не про M3») **не решены** — не поднимать без нужды.
- Unit-меню на `MMenu` — **вне объёма**. Наше в `unit.vue`: триггер и опции (`.ui-menu__item` удвоен для
  веса, `:250`); выбранная единица `secondary-container` (`_index.scss:142`), а concept/план —
  `tertiary-container` «по плану MMenu / S9» (Ф: расхождение, только развилкой). Физический `origin` по
  `direction` при открытии (`unit.vue:129-135`) — проблема MMenu.
- Дашборды: `locale="ru-RU"` и подписи степперов передаются руками в каждом поле
  (`demo/orders/NewOrderCustomerFields.vue:61-72`, `demo/crm/new-deal/CrmNewDealFields.vue:32-44`,
  `demo/crm/details/CrmInlineEdit.vue:38-53`); пожелание «валюта» (сейчас `unit="₽"`). Локали приложения
  нет — CT-13 кита, не группы.
- UX-предложения: автоповтор при удержании зоны, `showRange`, выражения в черновике.

## 3. QA-аудит: что открыто

Принятые отклонения (не чинить): RS-04/05/06 (vw-корень; у textarea RS-06 — номинал 72×24 исправлен),
TS-04 (нет скриншотной регрессии), DC-01…05 (docs-репозиторий), IN-04 и ST-07 (фокус = цвет 1rem),
TK-09 (strict-value линтер отложен), FM-03 (адаптер vee-validate).

FAIL, требующие решения владельца (фаза D, не шаги группы) — **text-field:** ST-01 (нет визуального
read-only/validating, `index.vue:175`), IN-08, FM-04, FM-06, CT-02 (`_label.scss:36-39` многоточие),
CT-11 (`index.vue:321` скрытый скролл чипов), TH-11. **textarea:** ST-01, IN-08, FM-04, FM-06, CT-11
(`_parts.scss:121-125`), TH-11, A11-17 (`useTextareaResize.ts:205`), RS-12, EN-11. **number-input:**
ST-01, IN-08, FM-06, FM-08 (`useNumberInputControl.ts:188`), CT-02, CT-13 (`props.ts:63-67`), RS-06/07/12
(`_zones.scss:66-92`), TH-11. Суть: IN-08 `aria-disabled`; FM-04 момент показа ошибки (общий `useField`);
FM-06 визуальное validating; CT-02 обрезанный лейбл; CT-11 намёк на прокрутку; TH-11 `prefers-contrast`;
A11-17 одноклик вместо перетаскивания; RS-12 цель на `pointer: coarse`; EN-11 деприкация снятых
`underline`/`code`; FM-08 минус на iOS; CT-13 английские дефолты и локаль.

MANUAL — кандидаты в заявки (жирным — важные для «прыгает»):
- **text-field:** ST-07/TH-03 (контраст рамки покой↔фокус), CT-06 (text spacing), CT-12 (эмодзи/CJK,
  `mixed-script`), LY-03 (иконки 24 против значения во всех density), LY-07 (вырез на разных
  `surface-container`), RS-01 (320: outlined `full` + prepend + append), **RS-02** (смена ширины — вырез и
  лейбл не расходятся), RS-11/A11-13 (нет `scroll-margin`), TH-02, **TH-08** (переходы при смене темы),
  **MO-03** (быстрый фокус/блюр — ничего не застревает), EN-11, DT-09/TS-06 (скринридер — не дирижёр).
- **textarea:** ST-07, **IN-05** (кольцо кнопки футера у края при `overflow: hidden` контейнера), CT-06,
  CT-07, CT-12, LY-03 (украшение 20 против строк), LY-07, RS-01, **RS-02** (ширина при autoGrow в JS-пути),
  RS-07, RS-10, RS-11, TH-02, TH-03 (ручка `outline-variant` < 3:1?), TH-08, A11-13, **MO-03** (рывки при
  перетаскивании ручки + Escape во время autoGrow), TS-06.
- **number-input:** CT-06, CT-12, **LY-02** (в ряд с text-field — e2e только на 1280), **LY-03** (зоны и
  единица против цифр при float/inset), LY-07 (≤200 со split + unit), RS-01, RS-02, RS-11 (авто-зум iOS),
  TH-02 (filled-зона 8%), TH-03, TH-08, EN-11, TS-06.

## 4. Движение и анимации в группе

**Нашего морфа в группе нет (Ф):** `springToCss`, `useShapeMorph`, `useReducedMotion` не используются —
действует §6.3. Reduced motion сжимает только medium+ (`base/_animations.scss:44-58`), 150 мс цвета
остаются — по правилу «укорачивает, а не выключает».

Переходы группы — все на `state.duration`/`state.easing` (`short-3` + `standard`): `border-color`,
`background-color`, `color`, `opacity` (text-field `index.vue:270-272,367`, `_label.scss:17,113`,
`_states.scss:75`; textarea `index.vue:265-267,280`, `_label.scss:18,81`, `_parts.scss:24,41`;
number-input `index.vue:324-326`, `_label.scss:15,123`, `_parts.scss:55`, `_states.scss:32`,
`_zones.scss:36`; `unit.vue:209`). Особые:
- **textarea `_parts.scss:118`** — `transition: height` (`short-2` + `standard-decelerate`) только под
  `--auto-grow`; `--resizing` → `none` (`:127-129`).
- number-input `index.vue:372-375` — `:autofill { transition: background-color 0s 600000s, color 0s
  600000s }`: **литералы** (§0.6) и вторая механика автозаполнения (у text-field/textarea —
  `background-clip: text`).
- `unit.vue:240` — `transform: rotate(180deg)` каретки при открытии; `v-ripple` на степперах
  (`index.vue:40,100,117,130`) и триггере единицы (`unit.vue:17`).

Лейбл переходит только по `color` (e2e `text-field.e2e.ts:125-148`); ширина рамки постоянна, вырез
открыт/закрыт размещением, не состоянием.

**Гипотезы «прыгает/бегает»** (файл:строка → заявка из §9):

- **Г1. Пересоздание `<input>` у `MTextField`.** `index.vue:45-82` — две ветки (`v-if="hasRow"` →
  `<div class="__field __row"><input>`, `v-else` → `<input>`), `hasRow` = `leading-content || prefix ||
  suffix` (`:170`). Dropdown/autocomplete кладут `#leading-content` по `v-if="hasChips"`
  (`ui/dropdown/index.vue:44-46`, `ui/autocomplete/index.vue:41-43`; `hasChips = multiple && selected > 0`).
  Переход 0 ↔ 1 чип монтирует новый input → теряются фокус, каретка, IME; `focused` может остаться
  `true`. Корень у нас (одна разметка ряда всегда), симптом у w4. → №2.
- **Г2. `transition: height` у textarea почти мёртв.** С `field-sizing: content` вычисленная `height`
  остаётся `auto` — переходить нечему; в JS-пути `sync()` пишет `'auto'`, читает `scrollHeight` и пишет px
  (`useTextareaResize.ts:175-190`) — auto→px не интерполируется. Анимируется только шаг ручки с
  клавиатуры (px→px) и только при `autoGrow`; Escape снапает. Три поведения одной высоты (craft §7
  разрешает анимацию роста). → №3.
- **Г3. Escape на ручке в JS-пути (нет `field-sizing`, Firefox).** `reset()` (`useTextareaResize.ts:171-173`)
  снимает высоту, а `sync()` не зовётся (watch `useTextareaControl.ts:273-277` смотрит только
  model/rows/maxRows/autoGrow) → поле схлопывается до `rows` до следующего ввода. Chromium не покажет;
  проверяй unit-спекой (в jsdom, вероятно, `CSS.supports('field-sizing')` = false; `scrollHeight` замокать).
- **Г4. SSR предзаполненного `autoGrow` в JS-пути:** сервер рисует `rows`, после гидрации `sync()`
  растит (против `ssr-first-paint-correct`). Только не-Chromium — пометь «не проверено», если у дирижёра
  нет Firefox/WebKit.
- **Г5. Высота filled text-field на узком экране.** `__control` — `min-height` (`index.vue:266`) при рамке
  1rem со всех сторон (`:268`); рамка < 1 CSS px рисуется целым пикселем, ряд значения уже заполняет
  высоту (LY-02) → контрол растёт. Number-input ушёл на фиксированную `height` ровно поэтому
  (`index.vue:316-319`); e2e сравнивает только на 1280 (`number-input.e2e.ts:200-208`). → №1.
- **Г6. Filled-лейбл выше, чем в M3.** `density-step` (`text-field/_index.scss:53-70`): `top = h/2`,
  `translateY(calc(-50% - raise)) scale(.75)` → центр лейбла на `h/2 − raise` = 10rem от верха (8 compact,
  12 comfortable), видимый бокс ≈ 1…19rem. M3: отступ 8 + body-small 16 → центр 16, лейбл вплотную к
  значению 24…48. То же в number-input (`_index.scss:52-74`). → №1 + `shot` против concept.
- **Г7. Строка поддержки в 8rem от коробки, а не 4.** Корень-колонка с `gap` 4rem (`index.vue:221`) **и**
  `margin-top` 4rem (`:385`); то же textarea (`index.vue:225` + `_parts.scss:71`), number-input
  (`index.vue:293` + `_parts.scss:52`). Concept: «Supporting text … top 4». → №1.
- **Г8. underline + prepend: лейбл на иконке.** `_label.scss:67-69` (`inset-inline-start: 0`) идёт после
  правила prepend (`:54-60`) при равном весе; паддинг underline 0 (`_states.scss:149`) бьёт `--prepend`
  (`index.vue:275-277`). У underline ряд без паддинга под лейбл (`_label.scss:83-95`) — поднятый лейбл
  (≈1…19) и значение (16…40) делят полосу. → №5.
- **Г9. Длинный overlay-лейбл с prepend + append.** `label.max-width = 100% − 32rem` (`_index.scss:88`) не
  учитывает старт 52rem → на узком filled-поле лейбл уходит под append. Stress `mixed-script` — outlined
  (лейбл на вырезе) и это не ловит. → №5.
- **Г10. `#prepend` у textarea и number-input:** правила 52rem нет, overlay-лейбл стоит на `--ui-*-inset`
  (textarea `_label.scss:27`, number-input `_label.scss:29`; учтён только `split`), значение — после
  украшения. Семья ведёт себя по-разному; фикстур нет.
- **Г11. Цифры меняются на фокусе.** `useNumberValue.ts:256-265`: фокус рендерит черновик без группировки
  (`1.234.567,89` → `1234567,89`), блюр — обратно. Решение плана, не дефект; владельцу — только если на
  скриншоте читается как рывок. → №8.
- **Г12. Смена темы.** Переходы цвета на всех контролах → поля «переливаются» 150 мс (TH-08). Тема —
  `data-definition` на `<html>` (`utils/theme/createThemeController.ts:223`). → №7.
- **Г13. Скраб в RTL.** `useNumberScrub.ts:95` — физический `dx` (`composables/useDrag.ts` направления не
  знает): в RTL тянешь к концу строки — значение уменьшается. Развилка Q-6.
- **Г14. Шов stacked.** `_zones.scss:71` — ▲/▼ разделены `gap` 1rem: на 360 шов < 1px (RS-07). → №6.
- **Г15.** Длинная ошибка переносится и растит поле (резерв — одна строка); M3 так же — факт, не развилка.
- Проверено чтением, не баг: ручка textarea `left: 50%` + `translateX(-50%)` (`_parts.scss:15,23`) в RTL
  симметрична; каретка единицы вращается `transform`'ом.

## 5. Кастомизация: что есть и где дыры

Есть (Ф): слоты `prepend`/`append` у всех; text-field `leading-content`, `helper`, `error`; textarea
`footer`, `counter`, `helper`, `error` (+ `MTextareaFooter` `start`/`end`/default с `{ disabled, readonly }`);
number-input `decrement`/`increment` (`{ props, value, nextValue }`), `scrub`, `unit`, `helper`, `error`.
Escape hatch — `useTextFieldControl`, `useTextareaControl`(+`Resize`), `useNumberInputControl`(+`Value`,
`Scrub`), бэги без `class`/`data-*`. `inputAttrs` у text-field. Expose: text-field `{ control, input }`
(`index.vue:200`), number-input `{ element }` (`index.vue:274`).

Дыры (Г, кроме помеченных):
- **Ф: нет `defineSlots`** у `MTextField`, `MTextarea`, `MNumberInput` — слот-пропсы (`#error`,
  `#counter`, `#increment`…) в IDE нетипизированы (реплика «нет подсказок в ide» — P1).
- **Ф: expose разнобой.** `MTextarea` ничего не отдаёт (фокус/скролл — только через DOM);
  `MNumberInput` отдаёт `{ element }`, не `MFieldParts` — демо типизирует руками
  (`demo/crm/details/CrmInlineEdit.vue:118`). Выравнивание = новое API → развилка.
- **Ф: `MNumberInputUnit` публичный.** `ui/number-input/unit.vue` регистрируется как `MNumberInputUnit`
  (`playground/.nuxt/components.d.ts:74`), хотя это приватная часть (`00-common` §0.23 → `fragments/`).
  Перенос = снятие публичного компонента (стоп-правило) → развилка.
- **Ф: композабл на геттерах.** `useTextField` берёт `error: () => boolean`, `externalError: () => string`
  (`useTextField.ts:43-45`) — владелец просил ref/реактивные пропсы (digest g2 §2). Он в автоимпорте:
  смена сигнатуры — ломка escape hatch, сверь потребителей.
- Нет `#label`: вырез строится копией строки в `legend` (`notchText`) — слот его сломает; без заказчика нет.
- Токены потребитель не переопределит: `material-map()` (`abstracts/_functions.scss:70-85`) возвращает
  карту как есть, префикс не используется — общекитовое, только в отчёт.
- `locale: 'en-US'` (`number-input/props.ts:48`), английские `MESSAGES.textareaResize`,
  `numberIncrement/Decrement/Unit` (`messages.ts:17-20`) — политика CT-13, не решать в группе.
- Ф: классы `ui-textarea--populated` (`index.vue:182`), `--composer` (`:190`) стилями не читаются, только
  спеками (`textarea/tests/*`). Удалять — после вопроса (потребитель мог зацепиться).
- Ручка textarea в read-only рендерится (`tabindex=-1`); concept read-only+focus — «no grip».

## 6. Минимизация и оптимизация

Файлы: `text-field/index.vue` 416 (исключение), `number-input/index.vue` 391, `textarea/index.vue` 362 —
у края; общий SCSS их сократит. Композаблы ≤ 314.

**Главное — три копии одного хрома с двумя механиками (Ф):**
- **Вырез outlined ×3, две механики.** text-field: рамка контрола прозрачная, `fieldset` на `inset: -1rem`,
  состояния красят `__outline` (`index.vue:268`, `_label.scss:103-114`, `_states.scss:115-143`).
  textarea/number-input: рамка контрола → паддинг `outlined.frame`, `fieldset` на `inset: 0` с
  `border-color: inherit`, состояния красят контрол (`textarea/_states.scss:64-97`,
  `number-input/_states.scss:68-101`; причина — их `overflow: hidden`). Владелец: «общий код выреза на три
  поля лучше трёх копий» (digest g2). Разметка `fieldset/legend` + `notchText` — ×3.
- **Строка поддержки ×3** — разметка почти байт-в-байт (`text-field/index.vue:94-126`,
  `textarea/index.vue:69-103`, `number-input/index.vue:142-173`) и SCSS ×3. SCSS-миксин — без вопроса;
  общий фрагмент-компонент против «общая только SCSS» (digest g1a) — развилка.
- **Оси ×3:** `@each` density (text-field `index.vue:225-234`, number-input `_parts.scss:11-24`),
  `@each` shape + кэп `full` у filled (×3), карта `shape` (×3), `density-step()` ×2 почти одинаковы
  (`text-field/_index.scss:53-70`, `number-input/_index.scss:52-74`), `$on-surface`/`$disabled-content`
  (×3), `state.duration/easing` (×3).
- **Overlay-лейбл ×3, две механики RTL-origin:** переменная `--ui-text-field-start`/`--ui-textarea-start`
  (`text-field/index.vue:215,252-254`) против `transform-origin: left` + `:dir(rtl)` на лейбле
  (`number-input/_label.scss:40-46`).
- **Разные имена ролей в картах:** text-field `filled.indicator.*`, `outlined.outline.*`, `error.color`;
  textarea/number-input `filled.border.*`, `focused.border.*`, `error.border.*`. Общий миксин потребует
  одного словаря.
- **Две логики ошибки:** text-field/textarea — `useTextField`, number-input сам на `useField`
  (`useNumberInputControl.ts:181-184`). Бэг text-field выкидывает unset-ключи (`useTextFieldControl.ts:109-111`,
  ради мёржа с бэгом композита), у остальных — `false`/`undefined`.
- **Две механики `:autofill`** (см. §4) — у number-input ещё и литералы.

Мёртвое (Ф, мой обход листьев `$tokens` против `g()` в файлах группы):
- text-field: `hover.label.color` (`_index.scss:144`).
- textarea: `label.gap` (`:55`), `input.rows` (`:69`), `grip.band` (`:113`, сам ключ не читается — только
  `$grip-band` внутри карты), `layer.pressed` (`:123`).
- number-input: `container.height` (`:85`), `label.left` (`:101`), `label.active.scale`,
  `label.active.raise.filled` (`:114`), `stepper.split.width/height` (`:166`), `stepper.stacked.height`
  (`:168`), `scrub.gap` (`:187`).
- Устаревшие комментарии: `textarea/_index.scss:11-12` («border width on focus» — фокус давно только
  цвет); `number-input/_index.scss:8-15` («зоны во всю высоту контейнера») — зоны теперь 40rem-объекты с
  `align-self: center` и смещением (`_zones.scss:16`, `_label.scss:95-101`), см. craft §1 «midline»;
  `useTextField.ts:9-10` (`controlClasses`, «vee-validate field path»).
- `>`-селекторов, `data-*`, `transition: all`, голых `:hover`, дефисных путей в группе нет (Ф).

Прочее:
- **Ф: оси на компонентных CSS-переменных** (`--ui-text-field-height/-label-top/-label-raised-*/
  -input-padding-*/-radius/-inset/-start/-label-notch-shift`, аналоги `--ui-textarea-*`,
  `--ui-number-input-*` + зоны). Против `decisions.md` («Density implemented in pure Sass, not three CSS
  custom properties»), `craft.md` §10 и §0.8 общего брифа. История: 2026-08-16 «1 го» на «переменные
  только для хрома поля» (digest g1a, validity?), 2026-09-30 оси сознательно переведены на переменные
  (summary `fields-outline-notch-and-state-axes`), 2026-10-08 у time-picker такие переменные запрещены. На
  них стоят расчёты карт (`outlined.inset` = `min(var(--ui-*-radius), var(--ui-*-height)/2)`,
  `label.prepend.notch.shift`, `label.split.*`). **Развилка Q-1, не чинить молча.** `--m-textarea-rows/
  -max-rows` — живая геометрия из пропов, законно (`behavior.md`).
- **Хайрлайн:** `$border-width: 1rem` ×3 (`text-field/_index.scss:23`, `textarea:21`, `number-input:24`) +
  `scrub.border.width` (`number-input/_index.scss:190`). Перевод на `max(1px, 1rem)` не механический: он в
  Sass-арифметике (`$value-top - $border-width`, `-1 * $border-width`, высота `legend`) → станет `calc()`,
  а паддинги LY-02 выведены из 1rem (связано с Г5). Скриншоты до/после.
- `pointermove` ручки: на каждое движение `commit → clampHeight → bounds → toPixels → metrics` =
  два `getComputedStyle` (`useTextareaResize.ts:125-140,221-223`) — кэшировать метрики на старте жеста
  (`behavior.md` «Cache measurement»).
- Из опыта кнопок (§5.4 общего): `_states`-партиалы уже есть у всех трёх; общий SCSS-миксин семьи
  (вырез, поддержка, оси, overlay-лейбл) клади в **свою** папку `assets/stylesheet/components/text-field/`
  (`abstracts/` — оркестратора).

## 7. Связи с другими группами

Кто потребляет группу (grep `src/runtime`, без спек):

| Что | Где | Владелец |
|---|---|---|
| `MTextField` | `ui/dropdown/index.vue:226`, `ui/autocomplete/index.vue:267`, `ui/file-input/index.vue:126` | w4 |
| `MTextField` | `fragments/color-picker/Edit.vue:74`, `fragments/date-picker/input/index.vue:26`; `ui/color-input/index.vue:2` — **без импорта** (нарушение §0.22, сообщить) | w5 |
| `MTextField` | `fragments/form-renderer/field/index.vue:2-25,67` | формы, вне групп |
| `MNumberInput` | `fragments/color-picker/Edit.vue:75` (`controls=false`, compact) | w5 |
| `mFieldProps` + `fieldDensityProp` | `dropdown/props.ts:11`, `color-input/props.ts:10`, `file-input/props.ts:14` (+ textarea, number-input) | w4, w5 |
| `MTextFieldVariant` | `dropdown/props.ts:12`, `color-input/props.ts:11`, `otp-input/props.ts:16` | w4, w5 |
| `useFieldShape` | `dropdown/index.vue:215`, `autocomplete/index.vue:256`, `color-input/index.vue:83`, `file-input/index.vue:132` | w4, w5 |
| `MFieldParts` | `dropdown/index.vue:209`, `autocomplete/index.vue:249`, демо `CrmInlineEdit.vue:90` | w4 |
| **`MFieldDensity`** (тип density всего кита живёт в `text-field/props.ts:80`) | `button/props.ts:11`, `avatar/props.ts:11`, `list/item/props.ts:9`, `table/types.ts:6`, `composables/timeline/context.ts:19` | w1, w2 |
| BEM `ui-text-field__*` в спеках/e2e | `autocomplete/tests/*` (38 вхождений), `color-input/index.spec.ts` (11), `dropdown/tests/*` (9 + `helpers.ts:48`), `file-input/index.spec.ts` (9); e2e `fixtures/{autocomplete,color-input,dropdown,file-input}/*.e2e.ts` | w4, w5 |

Как композиты используют поле (не ломать): dropdown и file-input **всегда передают `readonly`**
(`dropdown/index.vue:34`, `file-input/index.vue:22`) — поэтому hover/фокус-лейбл text-field гейтятся по
`:not(--disabled)`, а не по «interactive», как у textarea/number-input (`textarea/_states.scss:13`,
`number-input/_states.scss:12,104`). Попытка «выровнять» гейт сломает hover у dropdown и file-input.
Композиты: `v-model:focused`, `inputAttrs` (бэг комбобокса мёржится под бэгом поля), `ref` →
`control` (якорь поповера; корень не годится — в нём строка поддержки) и `input` (фокус на открытии,
`dropdown/index.vue:288`, `autocomplete/index.vue:340`), слоты `prepend`/`append`/`leading-content`.

Демо (не править): `demo/orders/NewOrderCustomerFields.vue:30,61`, `NewOrderDeliveryFields.vue:81`
(textarea autoGrow + counter), `demo/crm/new-deal/CrmNewDealFields.vue:32,102`, `CrmDateField.vue:5`
(readonly + `#append` с `MButtonIcon`), `demo/crm/details/CrmInlineEdit.vue:27,38`.

Что группа потребляет: `MIcon`; `MMenu` (`unit.vue:87`, **вне объёма**); `v-ripple`;
`composables/useField.ts`, `useControlAttrs.ts`, `useDrag.ts`, `useGlobalListener.ts` (общие — правка через
оркестратора); `composables/button/useRetiredValueWarning.ts` (w1); `shared/utils/number` (кодек —
оркестратор, `shared/utils/**`); `shared/constants/{icons,messages}.ts` (только дописывать).

Сломается у соседей: BEM/разметка text-field → спеки и e2e w4/w5; `MFieldParts` → dropdown,
autocomplete, демо; `mFieldProps`/`MTextFieldVariant`/`useFieldShape` → w4/w5; `MFieldDensity` → w1/w2.
Починка Г1 — у нас, регрессия — e2e dropdown/autocomplete (через оркестратора/w4).

## 8. Рекомендуемый порядок и объём

1. **MTextField первым** — на нём стоят w4/w5, textarea и number-input берут его пропсы, шейп и (после
   выноса) общий SCSS. Аудит: Г1, Г5–Г9, Г12, мёртвое, `defineSlots`.
2. **Общий SCSS семейства** (вырез одной механикой, строка поддержки, оси, overlay-лейбл, словарь ролей)
   — после ответа на Q-1 (custom properties), иначе придётся переписывать дважды. M–L.
3. **MTextarea** — Г2–Г4, Г7, Г10, кэш метрик ручки, мёртвые токены/классы, expose. M.
4. **MNumberInput** — Г5, Г7, Г10, Г11, Г13, Г14, второй `:autofill`, дубль логики ошибки, мёртвые
   токены, `MNumberInputUnit`. M.

Пока ждёшь дирижёра: unit-спека Г3, черновик общего миксина в scratch (не в `src/`), сверка e2e-допущений
(px vs rem, `data-test` на input).

Кандидаты в развилки (формулируй по §5.6 после проб):
- **Q-1** Оси на `--ui-*` против `decisions.md`/craft §10 (§6): (1) оставить и записать исключение «оси
  полей» — CSS не растёт; (2) `@each`-генерация — по правилу, но density × shape × variant ×
  placement раздуют CSS и затянут `outlined.inset`/notch-shift в матрицу; (3) гибрид — переменные только
  для того, что считается внутри `min()/max()` от радиуса и высоты.
- **Q-2** Гейт hover/фокус-лейбла в read-only — единый для семьи (text-field тогда должен отличать
  read-only композита от пользовательского) или оставить разницу.
- **Q-3** Overlay-лейбл textarea `body-medium × 0.75 = 10.5` (`textarea/_index.scss:28`, `_label.scss:35`)
  против `body-large × 0.75 = 12` у text-field/number-input (M3 — body-small 12).
- **Q-4** Рост textarea: сделать анимацию реальной (одна механика) или убрать мёртвый переход (Г2).
- **Q-5** Лейбл при `#prepend` у textarea/number-input — контракт 52rem или нет (Г10).
- **Q-6** Скраб в RTL — физическое «вправо = больше» или логическое (Г13).
- Если пробы подтвердят: вертикаль filled-лейбла (Г6), отступ поддержки 8 → 4 (Г7) — меняют вид всех
  полей кита; выбранная единица `secondary` vs concept `tertiary`; `MNumberInputUnit` → `fragments/`;
  expose (`MFieldParts` у number-input, expose у textarea); фрагмент строки поддержки vs миксин.
- Не развилка: Г1, Г3, Г8, Г9, мёртвые токены/комментарии, `:autofill` одной механикой, кэш метрик,
  `defineSlots`, фокус-лейбл read-only у number-input (`_states.scss:104` гейтит `--interactive`, а
  `color-and-state.md`: «Read-only fields show focus like any other»; сначала `git log -S`).

Противоречие в конституции, **не трогать без вопроса**: таблица ролей `color-and-state.md` («пусто →
`outline-variant`, есть содержимое → `outline`», «выведено из семейства полей») против кода и M3
(outlined в покое всегда `outline`: `text-field/_index.scss:179`, `textarea:45`, `number-input:88`).

Modern Web Guidance, вероятные id: `form-fields-automatically-fit-contents`, `animate-to-intrinsic-sizes`,
`forms`, `accessible-error-announcement`, `style-parent-with-has`, `reduce-style-repetition`,
`design-token-reactivity`, `precise-text-alignment`.

## 9. Стартовые заявки дирижёру

`probe.ts`/`look.probe.ts` готовит оркестратор в P0 (на HEAD в `playground/e2e/` только `support.ts`,
`playground/probes/` нет). Базовую карту `.cursor/temp/m3-polish/baseline/fields.md` прочитай, когда
появится, и не дублируй её. Корень поля в селекторах — `.ui-<block>:has([data-test="…"])`.

1. **`look` геометрия (Г5–Г7).** `/number-input/matrix` при `[360,800]`, `[768,800]`, `[1280,800]`: для
   `family-{text,number,stacked}-{compact,default,comfortable}` — `js` высота `__control`,
   `label.top/bottom − control.top`, `support.top − control.bottom`, всё / `remInPx`; `shot` default.
2. **`probe` пересоздание input (Г1).** `/autocomplete/matrix`, `/dropdown/matrix`,
   `[data-test="multiple-filled"]` (стартует с 2 чипами): запомнить узел, фокус, убрать чипы до нуля,
   выбрать опцию с клавиатуры; вернуть `isConnected` старого узла, `activeElement === старый`, класс
   `ui-text-field--focused`. Фикстуры w4 — только чтение.
3. **`probe` рост textarea (Г2).** `/textarea/matrix` `grow-empty-filled`: набрать 4 строки,
   `traceMotion` `height` у textarea, корня и соседней строки таблицы, `analyzeMotion`. Затем
   `resizable-filled` и `grow-full-filled`: фокус на `.ui-textarea__grip`, ArrowDown ×2, Escape.
4. **`shootStates` read-only по семье (Q-2).** text-field `readonly-filled`, `readonly-outlined`; textarea
   `readonly-filled`; number-input `readonly-filled-split`, `readonly-outlined-split` — rest/hover/focus,
   light и dark: цвет лейбла, слой `::before`, кромка.
5. **`look` лейбл и иконки (Г8, Г9, CT-12).** После добавления в text-field matrix строк «underline +
   prepend» и «filled + prepend + append + длинный лейбл»: `shot` 360 и 1280, ltr/rtl; stress
   `mixed-script`, `long-label`.
6. **`look` scrub и зоны (хвост 8rem, Г14, LY-03).** `/number-input/matrix` `populated-filled-scrub`,
   `populated-outlined-scrub`, `populated-filled-stacked`, `populated-filled-split`: `js` центр
   `__scrub`/`__stepper` против центра input, `shot` 360 и 1280. Добавить scrub × `inset` и повторить.
7. **`probe` смена темы (Г12).** `/text-field/matrix?theme=light`: `js`
   `document.documentElement.setAttribute('data-definition','dark')`, `traceMotion` `border-color`/
   `background-color` контрола `enabled-filled` и `__outline` у `enabled-outlined`, 400 мс.
8. **`look` число на фокусе (Г11).** `/number-input/stress` `locale`, `huge`: `shot` + `js input.value`
   до фокуса, в фокусе, после блюра.
9. **`look` футер и ручка (IN-05, TH-03).** `/textarea/stress`: Tab до `[data-test="send"]`, `shot`
   поля `mixed-script` (кольцо не срезано `overflow: hidden`); `/textarea/matrix` `resizable-outlined` —
   ручка rest/hover/focus, light/dark.
10. **`run` базовая регрессия.** `specs: playground/fixtures/{text-field,textarea,number-input}` — что на
    HEAD всё зелёное (последний прогон 2026-10-08: 236 passed на 9 спеках вместе с w4).
