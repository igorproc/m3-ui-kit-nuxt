# Аудит fields (w3) — 2026-10-18

> Статус: P1 закончен по всем трём компонентам, сохранён по команде оркестратора «СТОП» (лимит владельца).
> Не дописано: оценки «станет» по CSS — расчёт по Sass, не prod-сборка; пункты «Что не удалось проверить» ниже.

Группа: `MTextField` (+`useFieldShape`), `MTextarea` (+`MTextareaFooter`), `MNumberInput` (+`unit.vue`).
Фаза P1, `src/` не правился. Добавлены только фикстура `playground/fixtures/text-field/family.vue`
(prepend/append рядом с поднятым лейблом у всех трёх полей, длинный лейбл между иконками, scrub/stacked ×
`inset`, read-only + resizable textarea) и пробы `playground/probes/w3-fields/*.probe.ts`.

Заявки дирижёру (все `status: done`, артефакты — `test-results/conductor/<id>/`):

| id | что | итог |
|---|---|---|
| w3-fields-001 | e2e трёх полей на HEAD | **97 passed**, 0 failed (3.8 мин) |
| w3-fields-002 | `geometry.probe.ts` — анатомия в rem, 360/768/1280, ltr/rtl, 65 PNG | `anatomy-*.json` |
| w3-fields-003 | `chips-input.probe.ts` — input при 2 → 0 → 1 чипе | узел жив, фокус на месте |
| w3-fields-004 | `textarea-growth.probe.ts` — рост, шаг ручки, Escape, hover ручки | см. TA-B1, TA-B2 |
| w3-fields-005 | `states.probe.ts` — read-only по семье light/dark, смена темы, быстрый фокус | см. Q-2, FAM-3 |
| w3-fields-006 | `number.probe.ts` — цифры на фокусе, скраб в RTL, меню единиц | см. NI-B2, Г11 |
| w3-fields-007 | look — кольцо кнопки футера, ручка rest/hover/focus | IN-05 ок на 1280 |
| w3-fields-008 | `chips-empty.probe.ts` — первый чип в пустом multiple | **чип не появляется** |
| w3-fields-009 | `box.probe.ts` — нажатие по коробке, высота с чипами, сдвиги при гидрации | см. TF-B2, Q-10 |
| w3-fields-010 | look 768 — крупные кадры доказательств | stacked, unit, вырез |

Базовая карта `baseline/fields.md`: собственных скачков полей на hover/press/focus нет (сдвиги `focus dy 30/60` —
прокрутка страницы фокусом). Сдвиг при загрузке (`td`, 0.013–0.032) — см. FAM-4, к полям не относится.

Гипотезы брифа: **подтверждены** Г1 (в другой форме — хуже), Г2, Г6, Г7, Г8, Г9, Г10, Г12, Г13, Г14 (иначе);
**опровергнуты** Г5 для голого filled (55.99 на 360 и 1280; растёт только ряд — TF-A6), Г11 как дефект (геометрия
не меняется, `scrollWidth = clientWidth`); **не проверяемы** в Chromium Г3, Г4 (нужен браузер без `field-sizing`).

Сокращения: «REQ 002 1280» = `anatomy-1280-ltr.json`; числа — rem от верха нарисованного контейнера.

**Сводка.** 54 находки: A 20, B 11, C 12, D 9 (+2 справочные). Без развилки — 33, сразу в работу:
TF-B1, TF-B2, TF-B3, TF-A3…A8, TF-C1…C3, TF-D1…D3; TA-B2, TA-B3, TA-A2, TA-A6, TA-C1, TA-C4, TA-D1; NI-B1, NI-A1,
NI-B2, NI-A6, NI-B4, NI-C1, NI-C5, NI-D1…D3; FAM-1 (после Q-1). Развилок 17 (Q-1…Q-17), из них **СТОП** — Q-1
(противоречие `decisions.md`) и Q-12 (удаление публичного компонента).
Самое важное: **TF-B1** (первый чип в пустом multiple не появляется — у w4), **NI-B1** (половинки stacked в filled/inset
по 7.5rem, иконки срезаны), **TF-A3** (длинный лейбл outlined съедает верхнюю кромку до угла), **NI-A1** (единица
выше цифр), **Q-3/Q-4** (лейбл filled прижат к кромке, поддержка на 8 вместо 4 — вид всех полей кита).

---

## MTextField

Источники: план `inputs/text-field.md` (done, 2026-10-08), QA `text-field.json` (FAIL 19 — все приняты/фаза D,
MANUAL 17), базовая карта, concept.webp, REQ 001–005, 008–010.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| TF-B1 | B | `hasPrepend/hasAppend/hasRow` — `computed` по `useSlots()`, а он нереактивен: значение замерзает с первого рендера. В `multiple`-dropdown, начатом пустым, **выбранный чип не появляется никогда** (кнопка очистки появилась, ряда `__field` нет). Начатый с чипами — ряд не исчезает и при 0 чипов. Слот, появившийся позже (`#prepend`/`#append` по `v-if`), не получит обёртку и модификатор | `text-field/index.vue:168-170`; REQ 008 `chips-empty.json` (`afterPick: chips 0, hasRow false, clearButton true`) + `compact-empty-filled-after-pick.png`; REQ 003 (`hasRow: true` при 0 чипов) | читать `$slots` в рендере (условие шаблона / функция, вызываемая из шаблона), не `computed`; unit-спека с динамическим слотом; регрессия — e2e dropdown/autocomplete «первый чип в пустом multiple» (w4) | S | нет |
| TF-B2 | B | Нажатие по коробке вне нативного `input` не фокусирует поле: outlined — 0 из 4 точек (паддинги и полосы сверху/снизу), filled и underline — 2 из 4; у textarea 4 из 4 (`focusFromBox`). Две механики в семье | REQ 009 `box-press.json`; `textarea/index.vue:36,196-203` | одна механика семьи: `focusFromBox` на `__control` у text-field и number-input (нажатие на сам контейнер → `preventDefault` + `input.focus()`); проверить, что не конфликтует с открытием меню у dropdown (w4, регрессия у них) | S | нет |
| TF-B3 | B | Ряд чипов расширяет поле: `__field` `nowrap`, `__leading` `flex: 0 0 auto` — вклад ряда во внутреннюю (max-content) ширину поля полный; в auto-таблице колонка +243rem за 3 чипа, во flex-ряду поле 228 → 532px, сосед уезжает на новую строку (заявка w4, SEL-6) | аудит w4 `select-files.md` SEL-6 (`-001 h1-dropdown-ltr.json`, `-007 h1-flex-seeded.json`); `index.vue:315-342` | обнулить вклад ряда во внутреннюю ширину (`contain: inline-size` на `__field` или `width: 0; min-width: 100%` — выбор пробой в P2, гайд `css-layout`); ширину поля задаёт контейнер, ряд прокручивается внутри | S | нет |
| TF-A1 | A | Поднятый лейбл filled/`inset` прижат к верхней кромке: центр 10 (compact 8, comfortable 12), строка 1…19; M3 — центр 16 (body-small 12/16 с отступа 8, `contentPaddingWithLabel(top = 8)`), concept — «pad 24/8» | REQ 002 1280/768 `family-text-*`, `populated-filled` (`lbl 0.98..18.98 c 9.98`); кадр `768-ltr-text-field-family-tf-icons-filled-float.png`; `_index.scss:53-70` | вывести из токенов: центр = `value-top − 18/2` (лейбл ложится на строку значения), один и тот же `density-step()` в text-field и number-input | S | да → Q-3 |
| TF-A2 | A | Строка поддержки на 8 от коробки (`gap` 4 корня **и** `margin-top` 4); M3 — 4 (`supportingTextPadding(top = 4.dp)`), concept — «top 4». Так у всех трёх полей | REQ 002: `sup+7.97` у всех ключей; `index.vue:221,385` | убрать `support.margin.top` (×3) | S | да → Q-4 |
| TF-A3 | A | Длинный лейбл на outlined: лейбл обрезан многоточием на 172, а вырез `legend` открыт до 239 — верхняя кромка от конца лейбла до угла (и сам угол) **пропала** | REQ 002 768 `tf-long-outlined`: legend `12→239`, label `16→172 ELL`; кадр REQ 010 `09-long-outlined-notch.png`; то же у number-input (`ni-prepend-outlined-none`: 185 против 173) | `max-width` легенды = видимый максимум лейбла + 2 × `notch.padding` (арифметика в карте), во всех трёх полях | S | нет |
| TF-A4 | A | `underline` + `#prepend`: лейбл стоит с 0 — над иконкой, значение — с 40; лейбл и значение на разных вертикалях. Правило underline (`inset-inline-start: 0`) идёт после правила prepend при равном весе | REQ 002 `tf-icons-underline-*`: label `0→108`, prepend `0→24`; REQ 010 `10-underline-prepend.png`; `_label.scss:54-60,67-69` | у underline старт лейбла = старт значения (иконка + отступ), без перестановки правил по весу | S | нет |
| TF-A5 | A | Длинный overlay-лейбл с `#prepend` + `#append`: `label.max-width = 100% − 32` не учитывает старт 52, конец перед append и `scale(.75)` → видимый конец 208 заходит на коробку append (202.5) | REQ 002 1280 `tf-long-filled`: label `51.98→207.97 ELL`, append `202.5→226.5`; `_index.scss:88` | `max-width` лейбла по модификаторам `--prepend/--append` из тех же токенов, что старт/отступы | S | нет |
| TF-A6 | A | Высота поля растёт, когда есть ряд значения (`prefix/suffix`, чипы): `affixes` — 56.98 на 1280, 58.22 на 360 (голое filled — 55.99). Паддинги ряда выведены из `$border-width: 1rem`, а рамка < 1px рисуется целым пикселем; голый input спасает только то, что его content-box ниже строки | REQ 002/009 `affixes`; `_index.scss:23,53-70` | hairline `max(1px, 1rem)` в карте и паддинги ряда через `calc()` от неё (решение 2026-10-08); то же лечит TA-A2 | M | нет |
| TF-A7 | A | Hairline `1rem` вместо `max(1px, 1rem)` (`$border-width`) | `_index.scss:23` | вместе с TF-A6 | — | нет |
| TF-A8 | A | Длинное значение в не сфокусированном поле обрезается молча, без многоточия (лейблы уже с многоточием); у композитов это сводка выбора: «report.pdf, photo.\|» (заявка w4, FI-3, CT-02) | аудит w4 FI-3 (`-006 file-input-matrix-light.png`); `index.vue:283-310` | `text-overflow: ellipsis` у `__input` (в фокусе браузер показывает каретку и прокрутку как обычно) | S | нет |
| TF-C3 | C | Проп `loading` (из `makeStateProps` в `mFieldProps`) ничего не делает в text-field, textarea, number-input, color-input, file-input; читают его только dropdown и autocomplete (заявка w5) | `props.ts:88`; grep `loading` по файлам группы — 0; `dropdown/index.vue` 5, `autocomplete/index.vue` 6 | `mFieldProps` берёт только `disabled`; dropdown объявляет свой `loading` (w4, «Заявки») — §5.4 «пропы без эффекта» | S | нет |
| TF-C1 | C | Нет `defineSlots`: слот-пропсы `#error`/`#helper` (`{ message }`), `#prepend`/`#append`/`#leading-content` в IDE нетипизированы | `index.vue` (нет вызова) | `defineSlots` с JSDoc | S | нет |
| TF-C2 | C | Шимы «снято, работает ещё релиз»: `rounded` (+`MTextFieldRounded`, `RETIRED_ROUNDED_TO_SHAPE`, `useFieldShape`), `populated`, `type="number"` | `props.ts:31-41,96-100,137-141,20`; `index.vue:138,165-166`; `useFieldShape.ts` | удалить вместе со снятыми значениями (решение 2026-10-18); `useFieldShape` целиком — потребители берут `props.shape`; потребители вне группы — «Заявки» | S | нет |
| TF-D1 | D | Мёртвый токен `hover.label.color` | `_index.scss:144` | удалить | S | нет |
| TF-D2 | D | Правила индикатора `underline` — копия правил индикатора `filled` (hover, focused, error, error+hover, error+focused, disabled — те же роли); hover разнесён по 7 отдельным `@media (hover: hover)` | `_states.scss:192-247` против `:281-322`; скомпилированный CSS | один набор правил на `&--filled, &--underline` (слой и фон — только filled); один `can-hover` на партиал | S | нет |
| TF-D3 | D | Устаревшие комментарии: `useTextField.ts:9-10` (`controlClasses`, «vee-validate field path»), `index.vue:101` у `labelPlacement` («`float` keeps the shipped look») | файлы | переписать по факту | S | нет |

Сверх таблицы (не дефекты): быстрый фокус/блюр ничего не оставляет (REQ 005 `rapid-focus.json`, MO-03 → PASS); RTL —
логические старты совпадают с LTR на всех кейсах (REQ 002 1280-rtl, 360-rtl; RS RTL → PASS); композиты:
dropdown/file-input всегда передают `readonly` — гейт hover `:not(--disabled)` трогать только через Q-2.

Минимизация: выходной CSS **14 375 / 2 141** (байт / gzip, `css-sizes.json`). TF-D2 −0.6…0.8 KB, один `can-hover` −0.15 KB,
новые правила TF-A3/A4/A5 +0.2…0.3 KB → оценка **≈13.6–13.8 KB / ≈2.05 KB**. src 1462 строк → ≈1400 (шимы, D2);
общий SCSS семьи (FAM-1) — ещё −80…120 строк здесь.

## MTextarea

Источники: план `inputs/textarea.md` (done), QA `textarea.json` (FAIL 19 — приняты/фаза D, MANUAL 19), базовая
карта, concept.webp, REQ 001, 002, 004, 005, 007, 009, 010.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| TA-B1 | B | `transition: height` под `--auto-grow` почти мёртв: при вводе высота прыгает 24 → 48 → 72 за кадр (с `field-sizing` вычисленная `height` остаётся `auto` — переходить нечему); шаг ручки с клавиатуры без `autoGrow` — тоже скачок; Escape — скачок; перетаскивание — `none`. Анимируется только шаг ручки при `autoGrow` — три поведения одной высоты | REQ 004 `grow-typing.json` (`changes: 24@-3 → 48@29 → 72@296`), `grip-resizable-filled.json` (steps и escape: `jump`); `_parts.scss:118-129` | см. Q-7 (рекомендация — убрать переход) | S | да → Q-7 |
| TA-B2 | B | Ручка отвечает на hover, когда поле неактивно: disabled — слой 8% (`::before 0.08`), read-only — смена цвета + слой 8% при `cursor: default` и `tabindex=-1` | REQ 004 `grip-hover.json` (`disabled-filled`, `ta-readonly-resizable`); `_parts.scss:148-156` | hover ручки — только под `--interactive` | S | нет |
| TA-B3 | B | `pointermove` ручки: `commit → clampHeight → bounds → toPixels×2 → metrics` = 2 `getComputedStyle` + пересчёт `currentRows → toRows → metrics` = 3 на каждое движение, без rAF (`behavior.md`: «Cache measurement… throttle with rAF») | `useTextareaResize.ts:125-165,167-169,221-223` | метрики снимать на `pointerdown`, движение — через rAF | S | нет |
| TA-A1 | A | Строка поддержки на 8 от коробки (как TF-A2) | REQ 002 `sup+7.97`; `index.vue:225`, `_parts.scss:175` | Q-4 | S | да → Q-4 |
| TA-A2 | A | filled выше outlined на ширинах, где 1rem < 1px: 75 против 73.97 на 1280, 76.23 против 73.97 на 360 (рамка filled рисуется целым пикселем, рама outlined — паддингом 1rem) | REQ 002 `populated-filled`/`populated-outlined` | hairline `max(1px, 1rem)` и для рамки, и для `outlined.frame` | S | нет |
| TA-A3 | A | `#prepend` при `float`/`inset` (filled): лейбл с 16 стоит над украшением (17.5…37.5) — у text-field для этого контракт «старт значения» | REQ 002 `ta-icons-filled-float`; REQ 010 `11-textarea-prepend-float.png`; `_label.scss:27` | Q-5 | S | да → Q-5 |
| TA-A4 | A | Overlay-лейбл `body-medium × 0.75` = 10.5 (строка 15) против 12 у text-field/number-input и M3 (body-small 12) | REQ 002 `placement-float` (`lbl -7.5..7.5`); `_index.scss:28`, `_label.scss:35` | Q-6 | S | да → Q-6 |
| TA-A5 | A | Ручка в покое `outline-variant`: контраст 1.3:1 на filled-контейнере, ≈1.6:1 (light) / 2.0:1 (dark) на странице — ниже 3:1 WCAG 1.4.11 для единственного видимого признака ресайза | REQ 004 `grip-hover.json` (rest `rgb(198,198,198)` на `rgb(226,226,226)`), REQ 007 `grip-colours-dark` (`rgb(71,71,71)` на `rgb(19,19,19)`); кадр `04-grip-rest-outlined.png`; `_index.scss:117` | Q-9 | S | да → Q-9 |
| TA-A6 | A | У ручки нет нажатого/перетаскиваемого состояния (есть hover и focus); токен `layer.pressed` никто не читает — нарушение «5 состояний» | `_parts.scss:117-165`; `_index.scss:123` | `:active` и `--resizing` → слой `state-opacity(pressed)` / `(dragged)` | S | нет |
| TA-C1 | C | Нет `defineSlots`: `#error`/`#helper` (`{ message }`), `#counter` (`TextareaCounterState`), `#footer`, `#prepend`/`#append` | `index.vue` | `defineSlots` | S | нет |
| TA-C2 | C | Нет `defineExpose`: фокус/прокрутка потребителю — только через DOM | `index.vue` | Q-11 | S | да → Q-11 |
| TA-C3 | C | Модификаторы `--populated`, `--composer` стилями не читаются (только спеки) | `index.vue:182,190`; `tests/*` | Q-14 | S | да → Q-14 |
| TA-C4 | C | Шим `rounded` через `useFieldShape` | `index.vue:134,172` | удалить (TF-C2) | S | нет |
| TA-D1 | D | Мёртвое: токены `label.gap`, `input.rows`, ключ `grip.band` (значение живёт как `$grip-band`), `layer.pressed` (оживёт с TA-A6); декларация `line-height: input.line-height` в `__input` перекрыта `typescale` ниже; комментарий `_index.scss:11-12` («border width on focus») | `_index.scss:55,69,113,123`; `index.vue:325-328` | удалить / переписать | S | нет |

Сверх таблицы: кольцо фокуса кнопки футера не срезается `overflow: hidden` (запас ≈2.3px на 1280, REQ 007 `send-outline`,
кадр `01-send-focused.png`; IN-05 → PASS на 1280). Г3 (Escape на ручке в JS-пути) по чтению закрыт `ResizeObserver`
(`useTextareaResize.ts:294-302` пересинхронизирует после сброса высоты) — подтвердить нечем (нет браузера без
`field-sizing`). `field-sizing` — Baseline с 2026-06-16, JS-путь теперь только для старых браузеров.

Минимизация: **12 031 / 2 331** (index 11 605 / 2 081 + footer 426 / 250). Q-7 (−0.1 KB), TA-D1, гейт hover и слой
нажатия ручки (+0.15 KB) → **≈11.9–12.0 KB / ≈2.3 KB**; src 1770 → ≈1720 (+ FAM-1 −80…100).

## MNumberInput

Источники: план `inputs/number-input.md` (done), QA `number-input.json` (FAIL 21 — приняты/фаза D, MANUAL 13), базовая
карта, concept.webp, REQ 001, 002, 005, 006, 009, 010.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| NI-B1 | B/A | `controls="stacked"` + filled (любой) или `inset` (любой): **каждая половинка ▲/▼ сжата до 7.5** (на 768 — 7.5px, иконка 16 срезана): правило «зоны едут за значением» `margin-top: zone-offset` (вес 0,4,0) бьёт `margin: 0` половинок (0,2,0), и отступ применяется и к колонке, и к каждой кнопке. Цель нажатия ≪ 24 (WCAG 2.5.8); e2e меряет только колонку | REQ 010 `stacked-filled-halves` (`h 7.5, marginTop 14px, iconH 16`), кадр `01-stacked-filled-default.png`; REQ 002 `family-stacked-*`, `ni-stacked-inset-*`; `_label.scss:95-97` против `_zones.scss:223-229` | смещение — только `--split .ui-number-input__stepper`; e2e на высоту половинок | S | нет |
| NI-A1 | A | Единица (`unit`, static и menu) центрирована на середине коробки (28), а цифры — на 36, зоны — на 35: «px»/«MiB» висят выше значения; concept — единица на строке значения (LY-03 → FAIL) | REQ 002 `unit-menu`, `unit-static` (`unit c28`, `val c36`, `st 35`); REQ 010 `06-unit-static-filled.png`, REQ 006 `unit-open-ltr.png` | единица едет за значением тем же смещением, что зоны | S | нет |
| NI-B2 | B | Read-only не показывает фокус лейблом (кромка — да): лейбл остаётся `on-surface-variant`; `color-and-state.md`: «Read-only fields show focus like any other», textarea и text-field красят | REQ 005 `readonly-light/dark` (`readonly-filled-split focus label rgb(71,71,71)`); `_states.scss:104` (гейт `:where(--interactive)` с до-редизайна) | снять гейт с фокус-лейбла | S | нет |
| NI-B3 | B | Скраб в RTL — физический: тянешь вправо на 40px → +10 и в LTR, и в RTL | REQ 006 `scrub-ltr/rtl.json`; `useNumberScrub.ts:95` | Q-8 | S | да → Q-8 |
| NI-A2 | A | Лейбл filled прижат к кромке (общий `density-step`, как TF-A1) | REQ 002 `family-number-*` | Q-3 | S | да → Q-3 |
| NI-A3 | A | Строка поддержки на 8 (как TF-A2) | REQ 002 | Q-4 | S | да → Q-4 |
| NI-A4 | A | `#prepend` + overlay-лейбл: лейбл с 16 над иконкой (17.5…41.5) | REQ 002 `ni-prepend-filled-none`; REQ 010 `12-number-prepend-float.png`; `_label.scss:29` | Q-5 | S | да → Q-5 |
| NI-A5 | A | Зоны filled (split и stacked) лежат на индикаторе: низ зоны = низ контента (54.98 / 55), сверху 15 — зона читается как срез, прижатый ко дну, а не объект с отступом (craft §1). Это следствие потолка `min(imbalance, content − zone)` | REQ 002 `family-number-default` (`st 15..54.98`); кадр `768-ltr-number-input-matrix-family-text-default.png`; `_index.scss:52-74` | Q-17 | — | да → Q-17 |
| NI-A6 | A | Hairline `1rem` ×2 (`$border-width`, `scrub.border.width`) | `_index.scss:24,190` | `max(1px, 1rem)` (решение) | S | нет |
| NI-B4 | B | Вторая механика `:autofill` и литералы `0s 600000s` | `index.vue:372-375` | как у text-field/textarea: `background-clip: text` + `-webkit-text-fill-color` | S | нет |
| NI-C1 | C | Нет `defineSlots`: `#decrement`/`#increment` (`{ props, value, nextValue }`), `#scrub`, `#unit`, `#prepend`/`#append`, `#error`/`#helper` | `index.vue` | `defineSlots` | S | нет |
| NI-C2 | C | `defineExpose({ element })` — не `MFieldParts`; демо типизирует руками | `index.vue:274`; `demo/crm/details/CrmInlineEdit.vue:118` | Q-11 | S | да → Q-11 |
| NI-C3 | C | `unit.vue` в `components/ui/` → публичный `<MNumberInputUnit>` (имя ещё и совпадает с типом `MNumberInputUnit` из `props.ts`) | `playground/.nuxt/components.d.ts:74`; `render/gallery/menu.vue:170` | Q-12 (СТОП) | S | да → Q-12 |
| NI-C4 | C | Выбранная единица `secondary-container`, concept — `tertiary-container` «по плану MMenu» | `_index.scss:142` | Q-13 | S | да → Q-13 |
| NI-C5 | C | Шим `rounded` через `useFieldShape` | `index.vue:185,240` | удалить (TF-C2) | S | нет |
| NI-D1 | D | Мёртвые токены: `container.height`, `label.left`, `label.active` (`scale`, `raise.filled`), `stepper.split.width/height`, `stepper.stacked.height`, `scrub.gap` | `_index.scss:85,101,114,166,168,187` (grep `g($t, …)` — 0 читателей) | удалить | S | нет |
| NI-D2 | D | Шапка карты описывает «зоны во всю высоту» — в коде 40rem-объекты со смещением | `_index.scss:8-15` | переписать по факту | S | нет |
| NI-D3 | D | Две механики RTL-origin лейбла в семье: `transform-origin: left` + `:dir(rtl)` здесь против `--ui-*-start` у text-field/textarea | `_label.scss:40-46` | одна (войдёт в FAM-1) | S | нет |
| NI-D4 | D | Своя логика ошибки на `useField` при общей `useTextField` у двух других полей | `useNumberInputControl.ts:177-184` | Q-16 | M | да → Q-16 |

Сверх таблицы: цифры на фокусе теряют группировку и возвращают её на блюре (`1.234.567,89 ⇄ 1234567,89`) без изменения
геометрии (`scrollWidth = clientWidth`, `analyzeMotion` пуст) — решение плана, не дефект (REQ 006 `digits.json`).
Меню единиц висит от правильного края в LTR и RTL (REQ 006 `unit-menu-*`). Скраб и значение на одной линии и при
`inset` (REQ 002 `ni-scrub-inset-*`: 28 / 27.98).

Минимизация: **19 518 / 3 335** (index 17 115 / 2 538 + unit 2 403 / 797). NI-B1, NI-A1, NI-B4 ≈ ±0; мёртвые токены
вывода не дают → **≈19.4–19.5 KB / ≈3.3 KB**. src 2298 → ≈2250 (+ FAM-1 −80…120).

## Семья целиком (FAM)

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| FAM-1 | D | Три копии одного хрома и две механики выреза (text-field: прозрачная рамка + `fieldset` на `-1rem`; textarea/number-input: рамка → паддинг `frame`, `fieldset` на `0` с `border-color: inherit`), три копии строки поддержки, осей (`@each` shape + кэп `full`, density), overlay-лейбла, разные словари ролей в картах (`filled.indicator.*` против `filled.border.*`) | бриф §6, файлы `_label/_states/_parts` трёх полей | общие миксины в `assets/stylesheet/components/text-field/` (вырез одной механикой, поддержка, оси, overlay-лейбл), один словарь ролей; выходной CSS почти не меняется (каждый блок эмитит своё), src −250…350 строк | M | нет, **после Q-1** |
| FAM-2 | — | Оси на компонентных CSS-переменных (`--ui-<block>-height/-label-*/-input-padding-*/-radius/-inset/-start/…`) против `decisions.md` («Density implemented in pure Sass») и craft §10 | `text-field/index.vue:225-246`, `number-input/_parts.scss:286-317`, `textarea/index.vue:229-243` | Q-1 (СТОП) | — | да → Q-1 |
| FAM-3 | B | Смена темы: контейнер, индикатор, кромка и лейбл полей переливаются ≈165 мс (`state.duration`), текст страницы переключается за кадр — поля «отстают» от страницы (TH-08) | REQ 005 `theme-flip.json` (фон filled `226 → 192 → … → 53` за 181 мс, `main color` — сразу) | общекитовое: глушить переходы на время смены `data-definition` — не в файлах группы, см. «Заявки» | — | — |
| FAM-4 | — | Сдвиги при загрузке матриц (0.013–0.032): `td`/`tr`/корни полей растут на 3–5px в момент `document.fonts: loading → loaded` | REQ 009 `load-*.json` | к полям не относится (типографика/шрифты — незакоммиченная работа владельца); в отчёт оркестратору | — | — |

### Ретайр-шимы группы (решение 2026-10-18: удалить вместе со снятыми значениями)

| Шим | Снятое | Где | Потребители вне группы |
|---|---|---|---|
| `useRetiredPropWarning('rounded')` в `useFieldShape` + `RETIRED_ROUNDED_TO_SHAPE`, тип `MTextFieldRounded`, проп `rounded` в `mFieldProps` | `rounded: sharp/small/medium/large/pill` → `shape` | `text-field/{props.ts:31-41,96-100, useFieldShape.ts}`; вызовы в text-field, textarea, number-input | `useFieldShape`: dropdown `:215,261`, autocomplete `:256,313`, file-input `:132,174` (w4), color-input `:83,115` (w5); `:rounded` в `playground/render/gallery/{text-field,textarea,number-input}.vue` |
| `useRetiredPropWarning('populated')` | проп `populated` | `text-field/props.ts:137-141`, `index.vue:166` | нет |
| `useRetiredValueWarning('type', { number })` | `type="number"` у `MTextField` | `props.ts:20`, `index.vue:165` | `fragments/form-renderer/field/index.vue:20` |

Спеки, закрепляющие шимы (переписать вместе с удалением): `text-field/index.spec.ts:303-304`,
`textarea/tests/variants.spec.ts:48-49`, `number-input/tests/variants.spec.ts:45-46`.

---

## Развилки для владельца

**Q-1 (семья) — СТОП: противоречие `decisions.md`.** Плотность и форма полей задаются приватными CSS-переменными
(`--ui-text-field-height`, `-label-top`, `-radius`, `-inset`…), которые выставляет класс-модификатор. `decisions.md`
и craft §10 требуют чистый Sass (`@each`), переменная «известного на сборке» значения названа багом. Переход сделан
сознательно 2026-09-30 (summary `fields-outline-notch-and-state-axes`): отступ контента у outlined —
`max(16, min(радиус, высота/2) + 4)`, он зависит сразу от формы и плотности.
1. Оставить переменные и записать исключение в `decisions.md` («оси хрома полей — приватные переменные,
   выставляемые модификатором; цвета и состояния — по-прежнему Sass»). Выходной CSS не растёт; JS нет. Цена — правило
   с исключением. **(рекомендую:** метрика прогона — меньше CSS; вариант 2 добавляет ~+25% к блоку каждого поля, а
   переменные здесь не про состояния — те уже на Sass).
2. Чистый Sass: `@each` по density × shape × placement × variant. Оценка по скомпилированному CSS: text-field
   ≈ +3.4 KB (14.4 → ≈17.8), number-input ≈ +4…5 KB (зоны, смещения, радиусы зон по форме, `unit.vue` читает радиус
   зоны родителя), textarea ≈ +1 KB; итого **≈ +9…10 KB raw / +1…1.5 KB gzip** на группу, плюс матрица комбинаций
   outlined-отступа (large, full × 3 плотности) в каждом правиле, читающем отступ.
3. Гибрид: Sass для density/shape, переменная только для `outlined.inset` (единственное значение из `min()/max()` двух
   осей). ≈ +5…6 KB raw. Цена — и правило нарушено, и CSS растёт.

**Q-2 (семья): отвечает ли read-only поле на наведение?** Сейчас по-разному: text-field — да (слой 8%, кромка,
лейбл outlined), textarea и number-input — нет; фокус показывают все (кромкой). Композиты (dropdown, file-input) —
это text-field с `readonly`, им наведение нужно.
1. Да, как у editable — во всей семье. Compose M3: `readOnly` не меняет цвета полей; композиты не трогаем; уходят
   гейты `--interactive` у hover. **(рекомендую)**
2. Нет во всей семье. Тогда text-field должен отличать «read-only композита» от пользовательского — правка у w4/w5
   (передавать `readonly` через `inputAttrs`), риск регрессии у них.
3. Оставить разницу.

**Q-3 (семья): где стоит поднятый лейбл у filled и `inset`.** Сейчас центр 10 от верха (compact 8, comfortable 12) —
лейбл почти касается кромки (кадр `768-ltr-text-field-family-tf-icons-filled-float.png`). В M3 — 16 (отступ 8 +
строка 16), concept — так же.
1. Вывести из токенов: лейбл ложится на строку значения — центр = верх значения − 9 (15 / 9 / 19 для
   default / compact / comfortable; подъём 13 во всех плотностях). Одна формула вместо трёх чисел (craft §1:
   «derive the offset instead of picking it»). **(рекомендую)**
2. Ровно M3 на default (центр 16), остальные плотности пропорционально.
3. Оставить.
Меняет вид всех filled/`inset` полей кита (dropdown, autocomplete, file-input, color-input, поле даты) — скриншоты до/после.

**Q-4 (семья): отступ строки поддержки от коробки.** Сейчас 8 (gap 4 + margin 4), M3 и concept — 4.
1. 4: убрать `margin-top` у трёх полей. Формы становятся на 4 ниже на каждое поле. **(рекомендую)**
2. Оставить 8 и записать отклонение в `decisions.md`.

**Q-5 (textarea, number-input): лейбл рядом с `#prepend`.** У text-field поднятый лейбл начинается там, где значение
(контракт 52); у textarea и number-input он стоит на 16 — над иконкой (кадры REQ 010 `11-…`, `12-…`).
1. Тот же контракт во всей семье: старт = отступ + коробка украшения + зазор (textarea 16+20+8 = 44, number-input
   16+24+8 = 48); на вырезе outlined лейбл возвращается к началу, как у text-field. **(рекомендую)**
2. Оставить как есть (лейбл над иконкой).

**Q-6 (textarea): размер поднятого лейбла.** Сейчас `body-medium × 0.75` = 10.5, у text-field/number-input и в M3 — 12.
1. 12 (`body-large × 0.75`, как семья); вырез пересчитается сам. **(рекомендую)**
2. Оставить 10.5.

**Q-7 (textarea): анимация высоты.** Переход `height` живёт только в одном случае (шаг ручки с клавиатуры при
`autoGrow`); рост при вводе и Escape — мгновенные, и анимировать рост нельзя: с `field-sizing` высота остаётся `auto`.
1. Убрать переход: одна механика — высота меняется сразу во всех случаях; геометрию в потоке не анимируем (соседи не
   «едут»). **(рекомендую)**
2. Оставить переход для шагов ручки с клавиатуры всегда (не только при `autoGrow`); ввод и Escape — мгновенно.

**Q-8 (number-input): скраб в RTL.** Сейчас «вправо = больше» в обоих направлениях.
1. Логически: к концу строки = больше (в RTL — влево), как клавиатура слайдера кита
   (`createRangeKeyboardController.ts:20` зеркалит стрелки в RTL). **(рекомендую)**
2. Физически, как сейчас (привычка дизайн-инструментов, они LTR).

**Q-9 (textarea): цвет ручки в покое.** `outline-variant` даёт 1.3–2.0:1 — ниже 3:1 (WCAG 1.4.11), а ручка —
единственный видимый признак, что поле тянется.
1. `outline` в покое (≈3.5:1 на filled, ≈4.3:1 на странице, ≈3.9:1 в dark), hover — `on-surface-variant`, фокус —
   `primary`. **(рекомендую)**
2. Оставить как в M3-ручке шторки (там она декоративна; здесь ресайз есть и с клавиатуры) и записать исключение.

**Q-10 (text-field × dropdown/autocomplete): filled-поле с чипами выше остальных.** С двумя чипами filled
multiple — 64.97 (1280) / 66.21 (360) против 56; outlined не растёт. После TF-B1 это случится на первом же выборе —
поле «прыгнет» на 9–10 вниз.
1. Ряд чипов зарезервирован у filled multiple всегда (поле стабильной высоты, но выше соседей на ≈9). Правка в
   паддинге ряда text-field + модификатор у w4. **(рекомендую** — в объёме прогона**)**
2. Чипы в поле — высотой строки значения (24): поле остаётся 56, но нужна плотность у `MChip` (вне объёма).
3. Оставить рост.

**Q-11 (textarea, number-input): что поле отдаёт через `ref`.** text-field — `{ control, input }` (`MFieldParts`),
number-input — `{ element }`, textarea — ничего.
1. Все три — `{ control, input }` (input — свой элемент). Ломает `numberField.element` (демо
   `CrmInlineEdit.vue:118,136` — правка у оркестратора). **(рекомендую)**
2. Только добавить expose textarea, number-input не трогать.

**Q-12 (number-input) — СТОП: удаление публичного компонента.** `unit.vue` лежит в `components/ui/` и потому
публичен как `<MNumberInputUnit>`, хотя это часть поля.
1. Перенести в `components/fragments/number-input/` (публичный компонент исчезает; `render/gallery/menu.vue`
   импортирует путь — поправить). **(рекомендую)**
2. Оставить публичным и описать.

**Q-13 (number-input): цвет выбранной единицы в меню.** Сейчас `secondary-container` + галочка, concept —
`tertiary-container` «по плану MMenu».
1. Оставить, пока не решён план MMenu (меню вне объёма; одна роль выбора в меню кита). **(рекомендую)**
2. `tertiary-container` сейчас.

**Q-14 (textarea): классы без стилей.** `ui-textarea--populated` и `--composer` ничего не красят, их читают только спеки.
1. Удалить (кит 0.x, потребителей в ките нет). **(рекомендую)**
2. Оставить как публичные хуки для потребителя.

**Q-15 (семья): строка поддержки — общий компонент или только общий SCSS?** Разметка почти одинакова ×3.
1. Только SCSS-миксин (решение digest g1a «общая только SCSS»). **(рекомендую)**
2. Общий фрагмент-компонент.

**Q-16 (семья): одна логика ошибки.** text-field и textarea — через автоимпортируемый `useTextField` (берёт геттеры),
number-input — сам на `useField`.
1. Один внутренний `useFieldValidation(model, focused, props)` с реактивными пропсами для трёх control-композаблов;
   `useTextField` уходит из автоимпорта (известных внешних потребителей нет). **(рекомендую)**
2. Только сменить сигнатуру `useTextField` на пропсы, number-input не трогать.
3. Оставить.

**Q-17 (number-input): зоны filled лежат на индикаторе.** Это цена выравнивания зон по значению (потолок смещения,
решение 2026-10-08).
1. Оставить, исправить устаревшее описание в карте (и попросить поправить историю в craft §1). **(рекомендую)**
2. Уменьшить зоны filled, чтобы они центрировались по значению с отступом 4 — в compact зона станет < 24 (нельзя).
3. Центрировать зоны по середине коробки, как иконки M3 (вернётся расхождение зон и цифр — craft §1).

## Предложения сверх паритета (не шаги)

| Предложение | Выигрыш | Заказчик | Цена S/M/L | Рекомендация |
|---|---|---|---|---|
| `MFieldDensity` → `shared/types/props.ts` (сейчас тип плотности всего кита живёт в `text-field/props.ts`, его импортируют button, avatar, list, table, timeline) | правильная зависимость, без цикла «кнопка → поле» | весь кит | S (файлы оркестратора + импорты у w1/w2) | да, вместе с миграцией `density` из `decisions.md` |
| e2e «половинки stacked ≥ 24», «единица на строке значения», «вырез не шире лейбла», «первый чип в пустом multiple» | регрессия найденных дефектов | группа, w4 | S | да (в P2 вместе с правками) |
| `clearable`, подсказки клавиатуры по `type`, `v-model.trim/.lazy` (из плана text-field) | — | поиск/формы | S | только с заказчиком (В4) |

## Заявки на чужие файлы

1. **w4** `ui/dropdown/index.vue:215,261`, `ui/autocomplete/index.vue:256,313`, `ui/file-input/index.vue:132,174`; **w5**
   `ui/color-input/index.vue:83,115` — после удаления `useFieldShape` (TF-C2): `shape` брать из `props.shape`, проп
   `rounded` уходит из `mFieldProps`.
2. **w5** `ui/color-input/index.vue:2` — `MTextField` используется без импорта (нарушение §0.22).
3. **w4** — регрессионный e2e TF-B1 пишет w4 у себя (пустой multiple → выбор → чип виден; 2 → 0 чипов → ряд исчез);
   TF-B2 (фокус по нажатию на коробку) — проверить, что открытие меню по клику не задвоится; TF-B3 — e2e на ширину
   поля с чипами; Q-10 — модификатор у filled multiple; TF-C3 — объявить `loading` в `mDropdownProps` (его читают
   dropdown и autocomplete). **Когда сниму `rounded`/`useFieldShape` (TF-C2) — сообщу w4 через оркестратора**, они
   переведут свои вызовы.
4. **Оркестратор** `fragments/form-renderer/field/index.vue:18-25` — `MTextField type="number"` → `MNumberInput`
   (и «textarea» однострочным полем → `MTextarea`), иначе после TF-C2 тип перестанет компилироваться.
5. **Оркестратор** `playground/render/gallery/{text-field,textarea,number-input}.vue` — `:rounded` → `:shape`;
   `render/gallery/menu.vue:170,182` — путь `unit.vue`, если Q-12 → 1.
6. **Оркестратор** `playground/app/demo/crm/details/CrmInlineEdit.vue:118,136` — `numberField.element` → `input`, если
   Q-11 → 1.
7. **Оркестратор** (TH-08, FAM-3) — смена темы: переходы цвета у всех компонентов кита догоняют страницу ≈165 мс.
   Лечится в контроллере темы (`utils/theme/createThemeController.ts`) на время смены `data-definition` — общекитовое.
8. **Оркестратор** `docs/system/*/craft.md` §1 — история «Full-height zones have no midline» не совпадает с кодом
   (зоны — 40rem-объекты со смещением к значению); `decisions.md` — запись по итогам Q-1 и Q-7.
9. Не трогал, только отмечаю: противоречие таблицы ролей `color-and-state.md` (пусто → `outline-variant`) с кодом и M3
   (outlined в покое — `outline`) — по брифу не трогать без вопроса.

## Что не удалось проверить

- Г3, Г4 (JS-путь роста textarea: Escape на ручке, первый кадр SSR с `autoGrow`) — у дирижёра только Chromium, где есть
  `field-sizing`. По чтению Г3 закрыт `ResizeObserver`; Г4 реален для браузеров без `field-sizing` (Firefox < 152,
  Safari < 26.2).
- Нажатие по коробке у outlined number-input — в пробе поле оказалось вне вьюпорта (`hitElement: null`), вывод сделан
  по filled number-input и по коду (у `__control`/`__body` нет обработчика).
- Скринридер (DT-09/TS-06), авто-зум iOS (RS-11), `pointer: coarse` (RS-12), forced colors не перепроверялись пробой
  (e2e forced-colors зелёные в REQ 001).
- IN-05 (кольцо кнопки футера) — только на 1280.
- Размеры CSS «станет» — оценка по скомпилированному Sass (тот же компилятор, что `lint:scss`, сходится с базой до
  ±100 байт), не prod-сборка.

## Modern Web Guidance

- `form-fields-automatically-fit-contents` — «Explicit `width` and `height` properties override `field-sizing:
  content`»: подтверждает, что ручная высота ручки старше роста без второй механики; `field-sizing` — Baseline с
  2026-06-16, JS-путь `sync()` остаётся только для старых браузеров (Г3/Г4 — их зона).
- `animate-to-intrinsic-sizes` — `interpolate-size` анимирует смену вычисленного значения между ключевым словом и
  длиной; рост под `field-sizing` не меняет вычисленное `auto` — переход `height` у textarea не может сработать на
  вводе (основание рекомендации Q-7, вместо попытки «оживить» анимацию).
- `forms` — «expand clickable areas … using padding tricks» и связь `label for`/`aria-describedby`: основание TF-B2
  (вся коробка — цель нажатия поля) и проверки, что связи остаются в бэгах композаблов.
- Искал «отключить переходы цвета при смене темы» (`dark-mode-toggle`, `dark-mode`) — для группы не применимо,
  вынесено в заявку 7.
