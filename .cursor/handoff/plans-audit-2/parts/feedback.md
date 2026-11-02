# Feedback — аудит планов

Итог: сделано 52 · частично 14 · нет 17 · регресс 0 · отменено 8 · не проверено 2. Считались строки таблиц ниже;
строка «Г…», которая только ссылается на строки Ш, отдельно не считалась. Документация DC-* лежит вне кита
(`../docs_v3`) и посчитана как «нет», если примеры там стоят на удалённом API.

Прошлый аудит (2026-10-23) считал snackbar, progress и badge не начатыми, а alert, banner и loading — частичными.
Прогон 2 почти закрыл alert, badge, banner и snackbar. Его заявления подтверждены кодом и пробами: snackbar
inverse, `duration`, пауза на hover и фокусе, закрытие, постоянный регион в SSR, нет `trapFocus`; progress — зазор и
stop у linear, `max`/`valueText`, `NaN` → 0, reduced motion ×4; loading — `density`, contained, reduced motion
×2; badge — `announce`, `badge-anchor`, многоточие; alert — `color`, иконка тяжести, fade.

Не подтвердились четыре заявления:
- зазор у circular на экране не виден;
- contained с `type="shape"` сломан;
- у вкладок бейдж стоит на своих смещениях, а не на миксине;
- очередь снекбаров отложена (B4.9c).

Ни один тег `<implementation-status>` не верен: все семь планов помечены `planned`.

Правило, нарушенное во всех шести компонентах и не посчитанное по пунктам: литерал `1px solid CanvasText` в
`.vue`. Он стоит в `alert/index.vue:251`, `banner/index.vue:298,307`, `badge/index.vue:86`,
`snackbar/index.vue:234` и `progress/linear/index.vue:220` — в обход карты `$tokens`.

## feedback/alert.md — тег `planned` → факт `почти сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | иконка тяжести по умолчанию (TH-05) | сделано | `ui/alert/index.vue:106-111,123-124`, `props.ts:20`. Проба `alert-banner.probe.ts › first frame`: в SSR у info / success / warning / error глифы `outline-info` / `check-circle` / `warning-amber` / `error`. `› severity icon`: при `icon=false` 0 узлов, иконка 24rem | — |
| Ш2 | перенос (CT-04) и forced colors у tonal (TH-04) | сделано | `ui/alert/index.vue:193` (`overflow-wrap: anywhere`), `:249-253`. Проба `› long token at 360`: у alert `scrollWidth = clientWidth` = 326, страница не переполнена. `› forced colours`: у tonal `border-top-style: solid` | — |
| Ш3а | `'aria-label'` в пропсах слота `close` (A11-02) | сделано | `ui/alert/props.ts:50-60`, `index.vue:149-158`. Проба `› first frame` (JS выключен): у кастомной кнопки `aria-label=Dismiss notice` | — |
| Ш3б | имя закрытия по шаблону «`closeLabel`: `title`» (A11-04, концепт) | нет | `ui/alert/index.vue:68,154` отдают только `closeLabel`. Проба `› closing`: имя «Dismiss», заголовка в нём нет | S |
| Ш3в | `closeLabel` без английского дефолта (Q13) | сделано | `ui/alert/props.ts:27`; dev-warn `index.vue:160-165` (B8.5) | — |
| Ш4а | отступ под закрытие выведен из размера кнопки (TK-07) | сделано | `alert/_index.scss:34-41` (`calc(inset + 40 + inset)`) | — |
| Ш4б | отступы через `spacing()` (LY-04, TK-02) | нет | литералы `alert/_index.scss:39-40,46` (`12rem`, `12rem 16rem`, `4rem`) | S |
| Ш5 | мишень закрытия 48 (S8) | сделано | `MButtonIcon` → `touch-target` (`ui/button/index.vue:265-269`). Проба `› touch` (`pointer: coarse`): кнопка 40rem, мишень 48.0rem | — |
| Ш6 | переход появления и закрытия (MO-01) | сделано | `ui/alert/index.vue:2,256-272`, токены `alert/_index.scss:52-61`. Проба `› closing`: `ui-alert-fade-leave-active`, длительность 0.15s. Высота не анимируется — решение «Alert/banner, план» (`decisions-G2.md`) | — |
| Ш7а | живой регион до текста (вопрос 2 → W51-А) | сделано | `utils/feedback/useFeedbackBlock.ts:37-62`, `ui/alert/index.vue:132-140`. Проба `› announced`: в `.ui-live-region__assertive` пришло «Upload failed Try again.»; корень `role=group` без `aria-live`; регион на странице один | — |
| Ш7б | фокус после закрытия (вопрос 1 → W50-Б) | сделано | `useFeedbackBlock.ts:72-84`, `utils/focus/focusAfterRemoval.ts:16-31`. Проба `› closing`: Enter на закрытии → фокус на `after-alert` | — |
| Ш8 | документация (DC-01…05) | нет | `../docs_v3/app/examples/alert/severity.vue:4,10,16,22` и `form-result.vue:8,16` используют удалённый `type="…"`; кит его молча игнорирует | M |
| Тесты | unit и e2e из раздела «Тесты» | частично | unit: иконка (`tests/variants.spec.ts:87`), `aria-label` в SSR (`a11y.spec.ts:95`), регион (`a11y.spec.ts:29`) — есть; имени с заголовком нет. e2e: в `feedback.e2e.ts` есть только axe по матрице; длинного токена на 360, forced colors и Tab после закрытия нет (последнее — только unit `interaction.spec.ts:83`) | S |
| Правило | соседство частей без комбинатора (BEM, прецедент B4.5c) | частично | `ui/alert/index.vue:204` `&__title + &__body` — комбинатор `+` вместо модификатора | S |
| A | ось тяжести `type` → `color` (ОВ-2 → W52-А) | сделано | `ui/alert/props.ts:6,12`; `decisions.md:154` | — |
| Г1–Г4 | тяжесть без цвета; длинный текст; объявление; фокус | сделано | см. Ш1, Ш2, Ш7а, Ш7б. Проба axe по `audit-feedback` (light / dark) чистая | — |

Токены: совпадают 4 из 5 (роли тяжести, hairline `max(1px, 1rem)` `alert/_index.scss:44`, отступ под закрытие, цель
48); расхождение — отступы без `spacing()` (Ш4б).

## feedback/badge.md — тег `planned` → факт `почти сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | карта: точечные пути, нет `large.text` и `z-index`, токены `anchor.*`, `CanvasText` у большого | сделано | `badge/_index.scss:1-41`, `ui/badge/index.vue:73-111`. Проба `badge.probe.ts › forced colours`: у большого бейджа граница `solid`; у точки `forced-color-adjust: none`, фон `CanvasText`. `› sizes`: 16.0 × 16.0rem, отступ 4.00rem, точка 6 × 6rem | — |
| Ш2 | не live-регион по умолчанию, точка `aria-hidden` (БВ-1) | сделано | `ui/badge/index.vue:6-8`, `props.ts:24` (`announce` по умолчанию `off`). Проба `› semantics`: по умолчанию `role` и `aria-live` нет; при `announce="polite"` — `status` / `polite` | — |
| Ш3 | обрезка строки (БВ-3) и пустое значение (БВ-4) | сделано | `badge/_index.scss:21` (`4ch`), `ui/badge/index.vue:27-29,105-111`. Проба `› sizes`: «Новые» → 32.95rem с многоточием; `150` → «99+»; `0` → «0». Пустой бейдж не рендерится (`feedback.e2e.ts` «an empty badge renders nothing») | — |
| Ш4а | миксин `badge-anchor` + `anchor.*` (БВ-2 → W48-А) | сделано | `badge/_index.scss:31-41,47-57` | — |
| Ш4б | перевод навигации (bar / rail / drawer) | сделано | `fragments/navigation-item/index.vue:190-200`. Проба `› BadgedBox corner`: у bar и rail старт на 12.0rem от конца иконки, верх −1.99rem — в ltr и rtl | — |
| Ш4в | перевод вкладок на формулу BadgedBox | частично | вкладки держат свои токены: `tabs/_index.scss:81-90` (`top: -4rem`), `ui/tabs/tab/index.vue:201-210`. Проба `› BadgedBox corner` (tabs/matrix): старт 12rem — верно, верх −3.98rem вместо −2 (ltr и rtl) | S |
| Ш5 | тесты: фикстура `badge/matrix.vue` (содержимое × хост × dir), e2e геометрии в хостах | частично | unit `tests/{variants,interaction,a11y}.spec.ts` есть. e2e `feedback.e2e.ts` проверяет угол только на фикстурном якоре; `navigation.e2e.ts:160-178` проверяет bar/rail. Фикстуры `badge/matrix.vue` нет, угол во вкладках не проверяется | S |
| A | «`live`-проп не вводится» (БВ-1) | отменён | заменён пропом `announce: 'polite' \| 'off'` (Q43-А, `decisions.md:156`) | — |
| Г2–Г5 | не live-регион; пусто и длинная строка; forced colors; карта | сделано | см. Ш1–Ш3. Г1 — см. Ш4в | — |
| Г6 | lint / typecheck / vitest / e2e зелёные | не проверено | полные прогоны по брифу запрещены | — |

Токены: совпадают 6 из 6 (смещения, точечные пути, мёртвый токен, `z-index`, forced colors у большого, строка).
Базовые 6 / 16 / 4 / `corner-full` подтверждены пробой.

## feedback/banner/index.md — тег `planned` → факт `почти сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | закрытие первым в DOM (A11-09) | отменён | Q41 А+В (`decisions.md:155`): DOM «действия → закрытие»; в stacked закрытие рисуется в конце ряда действий (`ui/banner/index.vue:204-224`). Цель «Tab = экран» достигнута: проба `alert-banner.probe.ts › inline banner` — в ltr и rtl закрытие после действия и на экране, и в Tab; e2e `feedback.e2e.ts` (stacked) | — |
| Ш2 | `auto` по контейнерному запросу (RS-03) | отменён | Q42-А (`decisions.md:155`): `@media` окна, `ui/banner/index.vue:229-243` | — |
| Ш3а | разделитель и forced colors (TH-04) | сделано | разделитель остался `box-shadow` (`ui/banner/index.vue:293`), в forced colors — `border-block-end` (`:297-299`), у tonal — рамка (`:306-308`). Проба `› forced colours`: plain `border-block-end: solid`, tonal `solid` | — |
| Ш3б | перенос (CT-04) | сделано | наследуемый `overflow-wrap: break-word`. Проба `› long token at 360`: тело 303 = 303, правый край внутри корня | — |
| Ш4а | `'aria-label'` в пропсах слота (A11-02) | сделано | `ui/banner/props.ts:57-65`; unit `tests/a11y.spec.ts:99` | — |
| Ш4б | имя закрытия с заголовком (A11-04) | нет | `ui/banner/index.vue:68,134` — только `closeLabel` | S |
| Ш5а | слой закрытия на `state-opacity()` (ST-05, TK-04) | сделано | закрытие — `MButtonIcon`, его слой `::before` (`ui/button/index.vue:130-152`); модульных Sass-переменных нет | — |
| Ш5б | отступы через `spacing()` (LY-04, TK-02) | нет | литералы `banner/_index.scss:14-20,46-47` | S |
| Ш5в | мишень 48 | сделано | проба `› touch`: закрытие 40rem, мишень 48.0rem (`::after` `touch-target`) | — |
| Ш6 | переход (MO-01) | сделано | `ui/banner/index.vue:2,340-355`, `banner/_index.scss:55-66` | — |
| Ш7 | `surface` → канонический член (вопрос 1) | сделано | `plain`: `ui/banner/props.ts:17,35`, `banner/_index.scss:25` (B13.2b, `decisions.md:223`) | — |
| Ш8 | регион и фокус (общие с alert) | сделано | `ui/banner/index.vue:114-125`; unit `a11y.spec.ts:45`, `interaction.spec.ts:54`. Пробой проверен только общий механизм на alert | — |
| Ш9 | документация (DC-01…05) | не проверено | в `../docs_v3/app/examples/banner/*` удалённого API (`variant="surface"`) не нашлось; пункты DC по содержанию не сверялись | — |
| Правило | BEM: состояние модификатором, без `>` | частично | `ui/banner/index.vue:246` `&:not(:has(> .ui-banner__icon))` — структурный селектор с `>` вместо модификатора `ui-banner--icon` | S |
| Тесты | unit и e2e раздела | частично | unit: порядок DOM (`a11y.spec.ts:111`) и `aria-label` в SSR есть. e2e: stacked Tab и axe есть; forced colors нет (только эта проба). Контейнерный тест отменён вместе с Ш2 | S |
| Г | порядок фокуса, граница, вариант | сделано | см. Ш1, Ш3а, Ш7. «`auto` по ширине баннера» — отменено (Ш2) | — |

Токены: совпадают 2 из 4 (`state-opacity`, цель 48). Разделитель — частично: `box-shadow` плюс `border` только в
forced colors. Отступы — нет (Ш5б).

## feedback/banner/actions.md — тег `planned` → факт `сделан с отменами` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| И1 | ряд после закрытия в DOM | отменён | Q41 А+В (`decisions.md:155`) | — |
| И2 | `@container` вместо `@media` | отменён | Q42-А; `fragments/banner/actions/index.vue:48-56` на `@media` | — |
| И3 | `gap` и выравнивание из `actions.*` через `spacing()` | частично | токены `actions.gap` / `actions.margin.block` используются (`fragments/banner/actions/index.vue:41,45,50`), но значения — литералы `banner/_index.scss:46-47` | S |
| И4 | без роли; RTL — логический конец строки | сделано | `fragments/banner/actions/index.vue:1-8,40` (`flex-end` логический) | — |
| Тесты | условное монтирование, модификатор, порядок | сделано | `ui/banner/tests/variants.spec.ts:88-122`, `a11y.spec.ts:111` | — |

## feedback/loading.md — тег `planned` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | только строчная разметка в SSR (EN-09) | сделано | `ui/loading/index.vue:1-35` (`span` + `svg` от `MShape`). Проба `loading.probe.ts › first frame` (JS выключен): inline-индикаторы фикстур внутри `<p>`, блочных потомков 0. `› hydrates`: предупреждений о гидратации нет (`audit-feedback`, `loading/matrix`) | — |
| Ш2а | постоянный скрытый текст / регион (DT-09) | отменён | Q44-А (`decisions.md:160`): `role="progressbar"` без `aria-valuenow`, занятый хост говорит через `aria-busy`. Проба `› role and name`: `progressbar`, имя есть, `aria-live` нет | — |
| Ш2б | имя `label` без английского дефолта (CT-13, A11-04) | частично | дефолта нет, dev-warn есть (`ui/loading/index.vue:54-63`); проп по-прежнему `ariaLabel` (`props.ts:30`) — открыт **S7** | S |
| Ш3 | contained 48 / 38 (TK-06) | частично | spinner: контейнер 48.0rem, индикатор 38.0rem со смещением 5rem (проба `› density, contained`), цвета `primary-container` / `on-primary-container`. **shape: индикатор 48.0rem со смещением 5rem**, вылезает за контейнер и обрезан `contain: strict` (`ui/loading/index.vue:124`); снимок в scratchpad — серп вместо круга. Причина: `.ui-shape { width: 100%; height: 100% }` (`ui/shape/index.vue:55-56`) перебивает `inset` (`ui/loading/index.vue:160-163`) | S |
| Ш4 | reduced motion замедляет; forced colors (A11-18, TH-04) | сделано | `loading/_index.scss:18-30,72-73`, `ui/loading/index.vue:91-99,228-258`, `useShapeMorph.ts:144-147`. Проба `› reduced motion`: дуга 1.333 → 2.666 s, оборот 1.568 → 3.136 s, анимация не `none`; e2e `loading.e2e.ts` (морф, forced colors) | — |
| Ш5 | `delay` / `minDuration` (DT-11) | нет | в `ui/loading/props.ts:18-41` пропов нет; открыт **S6** (рек. Б — не делать) | S |
| Ш6 | inline от шрифта (LY-03) | сделано | `ui/loading/index.vue:141-150`, `loading/_index.scss:49-56`. Проба: 20.0rem в тексте 20.0rem; e2e — центровка по строке | — |
| Ш7а | судьба `circular` (вопрос 1) | сделано | `type: 'spinner' \| 'shape'` (`ui/loading/props.ts:15`, W46-Б) | — |
| Ш7б | ось `density` (вопрос 2) | сделано | `ui/loading/props.ts:23`, `index.vue:128-137`. Проба: 16 / 24 / 32rem у обоих типов. Ступени 24 / 48 / 64 из плана отменены W47-А («размеры прежние», `decisions.md:160,221`) | — |
| Ш8а | тесты (TS-07) | частично | есть: unit «смена type» (`tests/interaction.spec.ts:36`), «цикл не на сервере» (`ssr.spec.ts:16`); e2e reduced / forced / axe. Нет: unit «inline в `<p>` без mismatch» (`ssr.spec.ts` проверяет только цикл) и теста `delay`. Тест «регион до ожидания» отменён Q44-А | S |
| Ш8б | документация (когда loading, когда progress) | нет | `../docs_v3/app/examples/loading/activity.vue:27-28`, `transitions.vue:10-11` — удалённые `type="expressive" size="large"`; `types.vue:13` — `:size` | S |
| Т | движение на `--sys-motion-*` (TK-04, MO-05) | отменён | B8.8b (`decisions-G2.md`): петли — константы в карте (`loading/_index.scss:9-30`), потому что системные шаги сокращаются под reduce | — |
| Г1, Г4 | без mismatch; reduced motion замедляет | сделано | см. Ш1, Ш4. Г2 — см. Ш3 (частично), Г3 «объявляется один раз» — отменён Q44-А (Ш2а) | — |

Токены: совпадают 3 из 5 (контейнер 48, цвет contained, толщина спиннера в карте `loading/_index.scss:33-46`).
Фигура 38 — частично: у spinner верно, у shape 48. Движение — отменено (B8.8b).

## feedback/progress.md — тег `planned` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1а | зазор 4 у linear | сделано | `progress/_index.scss:68-72`, `ui/progress/linear/index.vue:117-122`. Проба `progress.probe.ts › linear anatomy` (×4 DPR): бар 239.6 · фон **4.12** · трек 231.4 · stop 4.12rem в ltr; в rtl ряд зеркален | — |
| Ш1б | stop indicator 4 у linear | сделано | `ui/progress/linear/index.vue:124-132`. Проба: последний отрезок `primary` 4.12rem у конца трека | — |
| Ш1в | stop indicator у wavy determinate | нет | `::after` есть только у `__track`, а у волны трек — `__wave--track` (`ui/progress/linear/index.vue:157-170`). Проба `› track role and stop`: у `wave--track::after` `content: none`. В концепте stop у wavy есть | S |
| Ш1г | трек `secondary-container` | сделано | `progress/_index.scss:69,90`. Проба: фон трека = `secondary-container` (rgb 212 = резолв роли) | — |
| Ш1д | зазор у circular | частично | в коде есть: `TRACK_GAP = 4` (`composables/progress/useProgress.ts:54-56,120-133`). На экране его нет: CSS `stroke-linecap: round` (`ui/progress/circular/index.vue:101-106`) перебивает атрибут `butt` (`:39`), а круглые концы по 2 единицы съедают 4 единицы зазора (Compose прибавляет к зазору толщину). Проба `› circular`: по окружности между дугой и треком 0.3° фона с одной стороны и 0° с другой (ждали ≈12.7° − колпачки) | S |
| К | дуга circular начинается в 12 часов и идёт по часовой (концепт) | нет | проба `› circular`: при 60% `primary` на 6, 9 и 12 часах, на 3 — трек, то есть старт в 6 часов. Путь стартует с 9 часов (`useProgress.ts:89`) + `rotate(-90deg)` (`ui/progress/circular/index.vue:97`). Так было и до прогона 2 (`6105ecc2`) — не регресс | S |
| Ш2 | токены: толщина, волна, радиус, движение (TK-02/04/06/07, MO-05) | частично | движение — на `--sys-motion-*` (значение) и в карте (петли, `progress/_index.scss:13-23,110-117`); толщины linear — в карте. Не сделано: (1) circular — литералы `3 / 4`, `× 1.5`, амплитуда `1.5 / 2`, `× 1.15` (`useProgress.ts:81-84,93-94,110`); (2) волна linear — в карте, но не по Compose: высота **14rem** против 10 (проба), период **20rem** против 40 (`mask-size` 13.33px), амплитуда 4, штрих 6 / 4 (`progress/_index.scss:38-39,102-107`); (3) радиус `999rem` (`ui/progress/linear/index.vue:81`) вместо `--sys-shape-corner-full` | M |
| Ш3 | RTL (LY-10) и reduced motion (A11-18) | сделано | `ui/progress/linear/index.vue:97-107` (`:dir(rtl)`); проба `› linear anatomy (rtl)`. Reduced motion: проба `› reduced motion` — circular 2s → 8s; e2e `feedback.e2e.ts` (linear 8s, wave 4s) | — |
| Ш4а | `max`, `valueText`, имя без дефолта + dev-warn (ST-01, DT-09, CT-13) | сделано | `ui/progress/props.ts:54,56,65`, `utils/progress/useProgressNameWarning.ts:9-18`. Проба `› value`: `max=10`, `now=3`, `valuetext` «3 of 10 files» | — |
| Ш4б | подпись вне `role="progressbar"`, связь через `aria-labelledby` (EN-03) | нет | слот внутри корня с ролью: `ui/progress/linear/index.vue:51`, `circular/index.vue:43`. Проба `› slot text`: `closest('[role=progressbar]')` = true | S |
| Ш4в | `aria-valuenow` округляется | нет | `ui/progress/linear/index.vue:17`, `circular/index.vue:15` отдают `clampedValue` как есть. Проба: «33.333333333333336» | S |
| Ш5а | forced colors (TH-04) | сделано | `ui/progress/linear/index.vue:218-233`, `circular/index.vue:141-144` | — |
| Ш5б | `contain: content` → `layout style` (CT-01) | нет | `ui/progress/linear/index.vue:80`, `circular/index.vue:76`. Обрезание волны пробой не ловилось | S |
| Ш5в | зажим `NaN` и диапазона (CT-07) | сделано | `useProgress.ts:72-77`. Проба: `NaN` → `aria-valuenow` 0, 150 → 100 | — |
| Ш6 | `expressive` → `wavy` | сделано | `ui/progress/props.ts:66-67`; дальше — открытый **S10** (ось `shape`) | — |
| Ш7 | `delay` (DT-11) | нет | пропа нет в `ui/progress/props.ts:51-68`; **S6** | S |
| Ш8а | тесты (TS-07) | частично | unit: зажим / `NaN` / `valuetext` (`tests/interaction.spec.ts:22-44`, `a11y.spec.ts:46`); e2e: RTL, reduced motion, волна, зазор / stop. Нет: округления `aria-valuenow`, `delay`, зазора у circular | S |
| Ш8б | документация (DC-01…05) | нет | `../docs_v3/app/examples/progress/wavy.vue:6,12,21` — удалённый `expressive` | S |
| О1 | `size` (вопрос 1) | сделано | ответ Q11-А — ось `density` (`ui/progress/props.ts:59`). Проба: linear 2 / 4 / 8rem, circular 24 / 40 / 48 | — |
| О2 | состояние ошибки (вопрос 2) | отменён | W45-Б, `decisions.md:51` | — |

Сверх строк таблицы: Г2 сделано; Г1 частично (Ш1в, Ш1д); Г3 нет (Ш2); Г4 частично (Ш4б, Ш4в).

Токены: совпадают 4 из 8 (трек, зазор linear, stop linear, движение). Частично — толщина (circular литералом) и
зазор circular (в коде есть, на экране нет). Нет — wavy по Compose и радиус.

## feedback/snackbar.md — тег `planned` → факт `почти сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | роли `inverse-*`, угол 4, ширина 600, отступы по Compose (TH-06, TK-02) | сделано | `snackbar/_index.scss:52-91`. Проба `snackbar.probe.ts › look`: фон = `inverse-surface`, текст = `inverse-on-surface`, угол 4rem, высота 48rem, отступы 16 / 16 (8 у края с действием), текст 14 / 20rem. Значения литералами, без `spacing()` | — |
| Ш2 | состояния действия, кнопка закрытия (ST-01, IN-07) | сделано | `ui/snackbar/index.vue:269-331`, `props.ts:31-36`. Проба `› action and close`: действие `inverse-primary`, 40rem; закрытие 40rem «Close»; правый отступ 8rem. `› touch`: мишени действия и закрытия 48.0rem | — |
| Ш3а | две строки, действие на своей строке, перенос (CT-03, CT-04, EN-03) | сделано | `ui/snackbar/props.ts:29`, `index.vue:37-44,242-259`. Проба `› long URL`: ширина 600.0rem, подпись переносится (384 = 384), действие под текстом, `dismiss` = `close` | — |
| Ш3б | пустой `label` без слота — ничего не рисовать и dev-warn (CT-07) | нет | `ui/snackbar/index.vue:41-43` рисует подпись без проверки; dev-warn (`:183-191`) — только про имя закрытия и `indefinite` | S |
| Ш4 | длительность и пауза (вопрос 1 → W44-А) | сделано | `utils/snackbar/useSnackbarTimer.ts:30-57`, `ui/snackbar/index.vue:32-35,157-162`. Пробы: при `duration` 1.5 с наведение держит плашку 2.5 с, потом `timeout`; фокус на действии держит 2.5 с; по умолчанию без действия плашка открыта на 3.3 с и закрыта к ~5.8 с (4 с) | — |
| Ш5а | очередь: одна за раз (CT-08 → B4.9c `$material.snackbar`) | нет | сервиса нет. Проба `› two open snackbars`: две плашки лежат друг на друге `[[592,757,84,32],[592,757,85,32]]`. «Отдельный кирпичик» — `decisions.md:157` | M |
| Ш5б | постоянный живой регион (DT-09) | сделано | `components/core/scope.vue:13-18`, `ui/snackbar/index.vue:13,109-121,164-181`. Проба `› first frame` (JS выключен): в SSR в `#ui-overlay-host` стоят `status/polite` и `alert/assertive`. `› message`: текст в polite-регионе хоста, регион один, у плашки нет `role` | — |
| Ш6 | над навигацией через инсеты layout, safe-area (RS-09, LY-10) | сделано | `snackbar/_index.scss:53-63`. Проба `› bottom inset`: зазор 16rem, при `--m3-layout-inset-bottom: 80rem` — 96rem. FAB вне зон layout не учитывается — с реальным FAB не проверено | — |
| Ш7 | удалить `trapFocus` (A11-12) | сделано | пропа нет (`ui/snackbar/props.ts`), W44-А без деприкации. Проба `› focus`: Tab → закрытие → дальше из плашки | — |
| Ш8 | движение на токенах (TK-06), forced colors (TH-04) | сделано | `snackbar/_index.scss:138-152`, `ui/snackbar/index.vue:233-235,306-308,328-330,357-359` (под reduce подъём снят) | — |
| Ш9а | тесты | частично | unit: таймер и пауза (`tests/interaction.spec.ts:53-97`, `useSnackbarTimer.spec.ts`), регион (`a11y.spec.ts:14-84`), Tab (`interaction.spec.ts:97`); e2e inverse + регион (`overlay.e2e.ts:135`). Нет: очередь и промис `show()`, пустой `label`; e2e над navigation bar на 360, длинного URL, forced colors | S |
| Ш9б | документация (DC-02…05) | нет | `../docs_v3/app/examples/snackbar/auto-dismiss.vue:20-33`, `undo.vue:41-43`, `from-dialog.vue:61-63` держат свой таймер вместо `duration` | S |
| A | события `action`, `dismiss(reason)`, слоты `#action` / `#default` вне `<p>` | сделано | `ui/snackbar/index.vue:37-62,98-101,145-155`. Проба: причины `timeout` / `close` | — |

Сверх строк таблицы: Г1 сделано; Г2 частично — закрывается сам, но очереди нет (Ш5а); Г3 сделано; Г4 сделано по
формуле инсета.

Токены: совпадают 8 из 9 (контейнер, текст, угол, ширина, высота 48 — пробой; 68 для двух строк получается
14 + 2 × 20 + 14 и не мерилось; действие, отступ снизу, движение). Отступы — частично: значения по Compose, но без
`spacing()`.

## Регрессии

Нет. Дефекты, которые нашли пробы, никогда не работали:
- старт дуги circular в 6 часов — так было и в `6105ecc2`;
- невидимый зазор circular и contained с `shape` — появились вместе с самой функцией в прогоне 2.

## Планы с неверным статусом (тег → факт, одна строка почему)

- `feedback/alert.md`: `planned` → почти сделан. Иконка, перенос, forced colors, регион, фокус и fade есть; нет
  имени закрытия с заголовком, `spacing()`, доков.
- `feedback/badge.md`: `planned` → почти сделан. Карта, семантика, обрезка, миксин и навигация есть; вкладки на
  своих смещениях.
- `feedback/banner/index.md`: `planned` → почти сделан. Сделано всё, кроме имени с заголовком, `spacing()` и
  селектора `:has(>)`; Ш1 и Ш2 отменены Q41 и Q42.
- `feedback/banner/actions.md`: `planned` → сделан с отменами (Q41, Q42).
- `feedback/loading.md`: `planned` → частично. SSR, density, contained, reduced motion есть; сломан contained
  с `shape`, нет `delay` (S6) и `label` (S7).
- `feedback/progress.md`: `planned` → частично. Linear-анатомия, RTL, reduced motion, `max`/`valueText` есть;
  circular без видимого зазора и со стартом в 6 часов, волна не по Compose, слот внутри роли.
- `feedback/snackbar.md`: `planned` → почти сделан. Вид M3, таймер, пауза, регион и инсеты есть; нет очереди
  и проверки пустого `label`.

## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные

Развилки самих планов отвечены: alert 1–2 (W50-Б, W51-А), banner 1 (B13.2b), badge БВ-1…4 (Q43-А, W48-А, W49-А,
B8.7b), loading 1–2 (W46-Б, W47-А, Q11-А), progress 1–2 (Q11-А, W45-Б), snackbar 1 (W44-А). Владелец не ответил
на три вопроса прогона 2 — у них есть рекомендации, но пока нет ответа:

- **S6** (loading / progress) — `delay` / `minDuration`. **А**: проп `active` + `delay` / `minDuration`.
  **Б**: не делать. Рек. **Б**.
  - Сидит в `src/runtime/components/ui/loading/props.ts:18-41` (пропов нет; показ по `v-if`, без `active`) и
    `src/runtime/components/ui/progress/props.ts:51-68` (нет `delay`).
  - Журнал: `decisions-G2.md`, строки W46-Б / W47-А и «Прогресс, план».
- **S7** (loading) — переименовать `ariaLabel` → `label`. **А**: `label`. **Б**: оставить `ariaLabel`.
  Рек. **Б**.
  - `src/runtime/components/ui/loading/props.ts:30`, `src/runtime/components/ui/loading/index.vue:11` (биндинг)
    и `:59` (dev-warn читает `props.ariaLabel`).
- **S10** (progress) — флаг `wavy: boolean` → ось `shape: 'flat' | 'wavy'`. **А**: ось. **Б**: оставить флаг.
  Рек. **А**.
  - Проп: `src/runtime/components/ui/progress/props.ts:66-67`.
  - Прокидка: `progress/index.vue:33`, `linear/index.vue:9,23`, `circular/index.vue:9,39`.
  - Геометрия: `composables/progress/useProgress.ts:33,83,87,94,108`.

## Пункты в занятых родителем файлах

Нет. Снекбар только читает `--m3-layout-inset-*`, которые публикует занятый `useLayout.ts`, и правок там не требует.
Исправления — в `ui/loading`, `ui/shape`, `ui/progress`, `ui/tabs/tab` и `tabs/_index.scss`; эти файлы не заняты.

## Пробы (файл → тесты → прошло/упало, ключевые измерения)

Сводный прогон: `npx playwright test -c playwright.probe.config.ts playground/probes/plans-audit-2/feedback --output test-results/plans-audit-2/feedback`,
окно 1280 × 800, 1rem ≈ 0.667px. Итог: 31 прошло · 9 упало · 1 пропущена. Все падения — измеренные дефекты
выше. Ещё одна проба (SSR loading) падала из-за моего слишком широкого селектора — исправлено, перезапуск прошёл.
Общий хелпер: `playground/probes/plans-audit-2/feedback/_helpers.ts` — цвета ролей и разбор скриншота в
странице, потому что PNG-библиотеки в репо нет.

- `alert-banner.probe.ts` → 10 / 10 прошло. SSR: `aria-label` слота и глифы тяжести. `icon=false` → 0. На 360
  нет переполнения у alert и banner. Forced colors: везде `solid`. Закрытие: fade 0.15s, фокус → следующий
  контрол. Регион: assertive «Upload failed Try again.», регион один. Tab в inline-баннере совпадает с экраном
  в ltr и rtl. Axe light / dark чистые. Мишени закрытия 40 → 48rem на coarse.
- `badge.probe.ts` → 3 прошло, 2 упало. Размеры 16 × 16, отступ 4, точка 6, «99+», «0», «Новые» 32.95rem;
  `announce` по умолчанию без роли; forced colors в порядке. Bar / rail: 12 / −1.99rem в ltr / rtl.
  **Вкладки: 12 / −3.98rem** (упало ×2).
- `loading.probe.ts` → 4 прошло, 1 упало, 1 пропущена (снимки: только с `PROBE_SHOTS`). SSR inline в `<p>` без
  блочных узлов; гидратация без предупреждений. Размеры 16 / 24 / 32. contained spinner 48 / 38;
  **contained shape 48 / 48 со смещением 5** (упало). inline 20 = 20. Reduced motion: дуга 1.333 → 2.666 s.
  Снимки `loading-contained-shape.png` и `circular-60.png` — в scratchpad сессии.
- `progress.probe.ts` → 3 прошло, 5 упало.
  - Прошло: linear-анатомия (зазор 4.12rem, stop 4.12rem, зеркально в rtl) и reduced motion (circular 2 → 8 s).
  - Упало: wavy 14rem вместо 10; у wavy нет stop; `aria-valuenow` «33.333333333333336»; слот внутри
    `progressbar`; circular без видимого зазора и со стартом в 6 часов.
  - Плотности linear 2 / 4 / 8rem.
- `snackbar.probe.ts` → 11 прошло, 1 упало. SSR-регион в хосте. Вид: inverse, угол 4, 48rem, 16 / 8, 14 / 20.
  Действие `inverse-primary` 40rem. Пауза на hover и фокусе работает. По умолчанию 4 с. Регион один. Длинный URL
  укладывается в 600rem, действие под текстом. Инсет 16 → 96rem. В RTL контролы у начала строки. Мишени 48 на
  coarse. **Две плашки рисуются одна на другой** (упало: очереди нет).

## Добавленные фикстуры

- `playground/fixtures/feedback/audit-feedback.vue`: alert × 4 тяжести, `icon=false`, длинный токен, кастомный
  `#close`, закрытие с фокусом, появляющийся alert; баннеры inline / stacked с длинным токеном / tonal; progress
  (⅓, `NaN`, 150, `max` + `valueText`, плотности, wavy, слот, circular); loading (contained spinner и shape,
  inline shape в `<p>`); бейджи (150, 0, `polite`, 7).
- `playground/fixtures/feedback/audit-snackbar.vue`: snackbar на 1.5 с; с действием и закрытием на 1.5 с; длинный
  URL, `below`, `indefinite`; по умолчанию; вывод причины `dismiss`.
