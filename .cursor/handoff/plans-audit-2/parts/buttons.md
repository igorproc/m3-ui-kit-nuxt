# Buttons (+ системный слой S1–S10, справочники) — аудит планов

Итог: сделано 55 · частично 3 · нет 3 · регресс 0 · отменено 20 (по пунктам: 71 пункт восьми планов
`button/*` + 10 пунктов S1–S10). Только планы кнопок: сделано 53 · нет 2 · отменено 16.

Источник правды — рабочее дерево `src/runtime/**` на 2026-10-30. Пробы:
`playground/probes/plans-audit-2/buttons/*.probe.ts`, 38 тестов, 34 прошли, 4 упали. Все четыре
падения — это пробелы S8, которые проба и должна была показать (см. «Пробы»). Окно 1280: 1rem = 0.667px,
поэтому размеры сверены с допуском ±0.5rem.
Дополнительно в пределах группы: ESLint и Stylelint по файлам семьи кнопок — 0 ошибок; vitest по
`button/**`, `fab-menu/**`, `utils/button`, `composables/button`, `useFabMenu.spec.ts` — 28 файлов,
403/403. `typecheck`, `lint:scss` и e2e по брифу не запускались, их статус — «не проверено».

Решения владельца, на которые опираются отметки «отменено»:
- `docs/system/ru-RU/decisions.md:24` — S3/S4 отклонены. Два исключения: морф toggle-кнопок и морф FAB menu
  на пружинах `springToCss`.
- `decisions.md:176` — мишень 48 только при `pointer: coarse`.
- `decisions.md:221` — density, три ступени.
- `.cursor/summary/button-family-m3_2026-10-07.md:11-21` — СВ-1 оставлен на 12%; S2 выброшен; лестница FAB
  40/56/96; split без `items`; standard group отложена. В decisions.md записано не всё, см. «Справочники».
- Память владельца: `no-legacy-shims-pre-stable` (снятые значения убираются без dev-предупреждений).

## button/index.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш3 | ветки `density`/`shape`/`selected`; ось `density`; мёртвый `text-inline` удалён | сделано | `assets/stylesheet/components/button/_index.scss:20-53`, `abstracts/_functions.scss:139-177`, `utils/button/useButton.ts:57-76`; `text-inline` в картах не найден; проба `geometry › MButton density × shape`: высота 32/40/56, отступ 12/16/24, зазор 4/8/8, иконка 20/20/24, square 12/12/16 | — |
| Ш4 | `shape`, `selected` → `aria-pressed`, цвета toggle по вариантам (S9) | сделано | `button/index.vue:231-245`, `_schemes.scss:26-54`; проба `toggle › MButton toggle`: клик, Space и Enter переключают `aria-pressed`; выбранная кнопка — 12rem у всех пяти вариантов; у ссылки `aria-pressed` нет | — |
| Ш4′ | «выбранная форма без анимации перехода» | отменён | decisions.md:24 (исключение 2): `button/morph.ts:18-26` — `border-radius 230ms linear(…)` inline; проба `toggle › toggle transition`. При reduced motion — `short-4 standard` (проба `reduced motion`) | — |
| Ш5 | цель 48 у compact, `overflow: hidden` снят с корня | сделано (только тач) | `button/index.vue:264-269`; проба `target › button family`: compact на тач-контексте 32 → блок −8 (попадание на 22.5 есть, на 26 нет); на мыши `::after` = `none` | — |
| Ш6 | один носитель нажатия, слой фокуса 10%, тени filled/tonal hover 1, elevated pressed 1 | сделано | `button/index.vue:129-155, 271-291`; проба `system › S1`: hover 0.08, focus 0.10, фон при нажатии не меняется, рипл ≈0.11 в моменте | — |
| Ш6′ | pressed 10% (СВ-1) | отменён | summary `button-family-m3_2026-10-07.md:11`; `_variables.scss:21` = 12% | — |
| Ш7 | край outlined = outline-variant (В-2) | сделано | `_functions.scss:165` | — |
| Ш7′ | disabled-текст on-surface-variant | отменён | M3-polish: on-surface 38% (`m3-polish-buttons_2026-10-19_0030.md:26`, `_index.scss:76`) | — |
| Ш8 | фокусируемый disabled/loading (В-6) + `softDisabled` | сделано | `useButton.ts:49-112`, decisions.md:108; SSR-проба: у `split-loading` `aria-busy=true`, `aria-disabled=true`, `disabled=false` | — |
| Т | трекинг label-large (TK-03) | нет | `abstracts/_mixins.scss:140-145`: `typescale` без `letter-spacing`; проба: `letterSpacing: normal` на всех ступенях | S (системно, см. S6) |
| Г7, тесты | видимые изменения в summary; фикстуры density×shape, toggle, selected+disabled; `tests/{variants,interaction,a11y}` | сделано | `button-family-m3_2026-10-07.md:45-53`; `playground/fixtures/button/matrix.vue:44-118`; `components/ui/button/tests/*` (403 юнита зелёные) | — |
| Г6 | линтеры, typecheck, vitest, e2e | не проверено | запускались только scoped ESLint/Stylelint/vitest (0 ошибок); typecheck и e2e — нет | — |

Токены: совпадают 12 из 15. Расхождения:
- трекинг label-large отсутствует («нет»);
- pressed и disabled-container 12% — отменено (СВ-1);
- disabled-текст on-surface — отменено (M3-polish).

## button/icon.md — тег `done` → факт `сделан` (тег верен по объёму плана; W70-А добавлен позже)
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш2 | `density` × `width` | сделано | `button/icon/index.vue:48-76`, `_index.scss:84-90`; проба `geometry › MButtonIcon`: ширины 28/32/40 · 32/40/52 · 48/56/72 при высоте 32/40/56, иконки 20/24/24 | — |
| Ш3 | `shape` | сделано | проба: радиус square 12/12/16 | — |
| Ш4 | toggle: `aria-pressed`; round → 12, square → round (половина высоты); слот `{ selected }` | сделано | `icon/index.vue:19-21, 69-73`; проба `toggle › MButtonIcon toggle`: 20 → 12 и 12 → 20; selected+disabled держит 12 | — |
| Ш4′ | «без анимации формы» | отменён | decisions.md:24 (исключение 2) | — |
| Ш4″ | выбранная кнопка-иконка рисует `filled`-пару глифа (S7, W70-А) | нет | decisions.md:214 («Решено, миграция ждёт»: «`selected` у `MButtonIcon` — ещё нет»); `icon/index.vue` не передаёт `filled` ни в `MIcon`, ни через inject. В пробе глиф меняет только фикстура (`i-ic:outline-check`) | M |
| Ш5 | цвет standard/outlined без `color` — цвет контента контейнера (В-3) | сделано | `icon/index.vue:4`, `_schemes.scss:77-86` | — |
| Ш6 | `elevated` снят из типа | сделано | `button/props.ts:61` (шим удалён — no-legacy-shims) | — |
| Ш7 | `MButton` без подписи = геометрия кнопки-иконки (В-4) | сделано | `button/index.vue:249-262`; проба: 40×40, иконка 24 | — |
| Г4 | цель ≥ 48 на всех ступенях | сделано (только тач) | `button/index.vue:266-269`; проба: compact narrow 28×32 и default 40 → 48 по обеим осям | — |
| S1 | pressed 10% | отменён | СВ-1 | — |

Токены: совпадают по таблице плана. Tonal осознанно остаётся `<role>-container`; standard наследует цвет
(В-3 → вариант 2).

## button/fab.md — тег `done` → факт `сделан в редакции владельца` (тег верен)
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1/Г1 | лестница 56/80/96, радиусы 16/20/28, иконки 24/28/36 | отменён | владелец решил: density = 40/56/96 (summary `button-family-m3_2026-10-07.md:18`, тег плана). Проба: 40/56/96, радиусы 12/16/28, иконки 24/24/36. **В decisions.md не записано** | — |
| Ш1 | два набора: `tonal` = контейнер, `filled` = роль × primary/secondary/tertiary/error | сделано | `button/fab/_index.scss:7-20`, `fab/_surface.scss:46-53` | — |
| Ш2 | `variant` сужен до `Extract<…, 'tonal' \| 'filled'>` | сделано | `fab/props.ts:15` | — |
| Ш2′ | dev-предупреждения для снятых значений | отменён | память no-legacy-shims; шим удалён (тег плана) | — |
| Ш3 | pressed 10% | отменён | СВ-1 | — |
| Ш4 | потребители (FAB menu, extended FAB) на той же лестнице | сделано | `fab-menu/props.ts:30`, `extended-fab/props.ts:11` | — |
| — | цель 48 у compact FAB (B8.2a) | сделано | `fab/index.vue:82-85`; проба: 40 → 48 по обеим осям на таче | — |
| В-3 | disabled сохранён | сделано | decisions.md:82 | — |

Токены: совпадают тени 3/4/3, слой 8/10, кольцо. Расхождения с M3 — только отменённые выше (лестница,
pressed).

## button/extended-fab.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | ступени S и L (56: r16, отступ 16, зазор 8, иконка 24, title-medium; 96: r28, отступ 28, зазор 16, иконка 32, headline-small) | сделано | `extended-fab/_index.scss:24-28`; проба: default 56/16/16/24/16rem шрифт; comfortable 96/28/28/32/24rem шрифт (вес 400, emphasized нет, см. S6) | — |
| Ш1′ | ступень M (80, r20) | отменён | лестница владельца 40/56/96; ступень 40 — значения кита (`_index.scss:25`) | — |
| Ш2 | цветовые наборы общие с FAB | сделано | `extended-fab/_index.scss:21` (`fab.$schemes`) | — |
| Ш3 | `expanded`: свёртывание, имя сохраняется, dev-предупреждение без иконки | сделано | `extended-fab/index.vue:23-27, 58-64, 154-166`; проба: свёрнутая 55.97 × 55.99, `getByRole('button',{name:'Compose'})` виден. Подпись не `sr-only`: `inline-size: 0` + `opacity: 0`, имя остаётся в дереве доступности | — |
| Ш4 | pressed 10% | отменён | СВ-1 | — |
| — | цель 48 у compact | сделано | `extended-fab/index.vue:172-175`; проба: блок 40 → 48 | — |

## button/fab-menu.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | явные импорты, `type="button"`, `ICONS`, слой цветом контента, forced colors, stagger/room — в токенах | сделано | `fab-menu/index.vue:86-96`, `fragments/fab-menu/Actions.vue:14, 117-157`, `fab-menu/props.ts:38-39`, `fab-menu/_index.scss:28-86` | — |
| Ш2 | disclosure: `aria-expanded`/`aria-controls`, Escape, возврат фокуса, ArrowDown на верхний пункт, `activatorAttrs` в слот | сделано | `composables/useFabMenu.ts:103-121`; проба `keyboard › FAB menu` (ltr и rtl): ArrowDown на закрытом FAB → `expanded=true`, фокус «Message», `aria-controls` → существующий `#id`; Escape → закрыто, фокус на FAB; Tab с открытого FAB → верхний пункт; выбор → закрыто, фокус на FAB; клик снаружи закрывает | — |
| Ш3 | `v-model:open`, пустой список не открывается, `disabled` у пункта, `loading` удалён | сделано | `fab-menu/index.vue:97, 106`, `props.ts:19`; проба: `menu-empty` → `expanded=false` | — |
| Ш4 | пункт — пилюля 56, отступ 24, иконка впереди, title-medium, зазоры 4 и 8 | сделано | проба `geometry › FAB menu actions`: h 56, отступ 24/24, шрифт 16, зазор 3.98, порядок `[ui-icon, label]`, тень есть; столбец над FAB — 8 | — |
| Ш5 | открытая кнопка — круг 56 цвета роли (В-4 → вариант 1) | сделано | `fab-menu/index.vue:268-288`; проба: открытый FAB 56, радиус 28 | — |
| Ш5′ | «без анимации морфа» | отменён | decisions.md:24 (исключение 1): `fab-menu/morph.ts` | — |
| Ш6 | длинные подписи, прокрутка, предупреждение при > 6 пунктах | сделано (по коду) | `fab-menu/_index.scss:41`, `index.vue:211-217, 297-300` | — |
| Ш7 | RTL, `align: start \| end` | сделано | проба rtl: начало пункта = начало FAB (851 = 851) | — |
| Ш8 | reduced motion | сделано (по коду) | `fab-menu/_index.scss:76-86`, `Actions.vue:101-104` | — |
| Ш9 | фикстуры `matrix`/`stress` + `fab-menu.e2e.ts` | сделано | `playground/fixtures/fab-menu/*` | — |
| e2e | «without anchor positioning the column ends 8 above…», прогон 2 падал при 1366 | в пробе проходит | проба `fab-menu-anchorless` (повтор теста на 1280/1366/1920, JS-путь и CSS anchor): зазор 7.992 / 8.016 / 8.000, край ≤ 0.016. Сам e2e не запускался | — |
| Г5 | `_build.mjs --check fab-menu` | не проверено | — | — |

## button/group.md — тег `done` («частично по решению владельца») → факт `частично по решению` (тег верен)
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш2 | общий движок выбора с segmented | сделано | `group/index.vue:47-55` → `composables/button/useSegmentedButton.ts` | — |
| Ш3 | standard group | отменён (отложено) | тег плана, summary `button-family-m3_2026-10-07.md:20`. **В decisions.md не записано** | — |
| Ш4 | connected: зазор 2, внутренние углы 8, крайние и выбранная — половина высоты; цвета toggle | сделано | `group/_index.scss:10-18`, `group/index.vue:79-100`; проба: зазор 1.99, внутренние 8, крайние/пилюля 16/20/28; нажатие форму не меняет (8 → 8 при нажатии, 20 после выбора) | — |
| Ш4′ | «selected → full без анимации» | отменён | decisions.md:24 (исключение 2) | — |
| Ш5 | переполнение в меню | отменён | В-4 → вариант 2 (тег) | — |
| Ш6 | фикстуры + e2e | сделано | `playground/fixtures/button-group/{matrix,stress}.vue`, `button-group.e2e.ts` | — |
| П | клавиатура: radiogroup + стрелки; `multiple` + `aria-pressed` | сделано | проба `keyboard › connected group` | — |
| П | dev-предупреждение без имени группы | сделано | `group/index.vue:51` | — |
| П | мишень icon-only только по блочной оси | сделано | `group/index.vue:105-109`, `targets.e2e.ts` | — |

## button/segmented.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | мин. ширина 58 | сделано | `segmented/_index.scss:27`; проба: сегменты-иконки 59.48, равные сегменты по 91.92 | — |
| Ш1 | слой фокуса 10% | сделано | `segmented/index.vue:147-152` | — |
| Ш1 | pressed 10% | отменён | СВ-1 (нажатие — рипл) | — |
| Ш2 | общий движок | сделано | `useSegmentedButton.ts`; проба: radiogroup, одна Tab-остановка (`tabindex -1/0/-1/-1`), стрелки обходят disabled, Home/End, RTL зеркалит стрелки | — |
| Ш3 | слот `#item` | отменён | В-2 → вариант 2 (тег) | — |
| Находка | перенос только по словам, прокрутка ряда | сделано | `segmented/index.vue:90-100`, decisions.md:98, 191 | — |

## button/split.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | токены: `gap` 2, `inner` 4, ступени; разделителя нет | сделано | `button/_index.scss:94-104`; проба: зазор 1.99, внутренние 4, правая кнопка 48/48/56, иконка 22/22/26, конечный отступ ведущей 10/12/24 | — |
| Ш2 | две кнопки, шеврон по состоянию | сделано | `split/index.vue:31-51`; проба: `arrow-down` → Enter → `arrow-up`, `aria-expanded=true`, стрелки в меню, Escape → фокус на «More save options» | — |
| Ш3 | `density`; `variant` без `text` | сделано | `split/props.ts:15, 22-25` | — |
| Ш4 | `loading` (В-2 → 1), `#prepend` | сделано | `split/index.vue:15, 21-26, 33-36, 91-96`; SSR-проба | — |
| Ш5 | `#menu` (В-1 решён иначе: `items` убран) | сделано | summary `button-family-m3_2026-10-07.md:19` | — |
| Ш6 | находка про `MMenu` + `client-only` передана в план меню | сделано | `overlays/menu.md:162-164` | — |
| Г1 | углы не меняются при открытом меню | сделано | проба `split corners`: 4/20 → 4/20, ширина 48 → 48 | — |
| П | мишень compact на обеих половинах, в зазор не заходит | сделано | проба: обе половины 32 → 48 по блочной оси; точка в зазоре попадает в `ui-split-button__wrapper` | — |

## Системный слой S1–S10 (`common.md` §2)
| ID | Статус | Доказательство | Где не применено |
|---|---|---|---|
| S1 pressed / СВ-1 | отменён | владелец: 12% (summary `button-family-m3_2026-10-07.md:11`; `_variables.scss:21`). Нажатие кнопок — только рипл (decisions.md:97); проба S1: hover 0.08, focus 0.10, фон при нажатии не меняется | — |
| S2 шкала скруглений Expressive | отменён | summary `button-family-m3_2026-10-07.md:12` («S2 выброшен»); память no-new-system-tokens; `base/_shapes.scss:3-14`, `_variables.scss:192-201`; проба: `--sys-shape-corner-large-increased`, `-extra-large-increased`, `-extra-extra-large` = null. **В decisions.md не записано, `common.md` S2 и `roadmap.md` (волна 1, п. 1) всё ещё говорят «добавить»** | — |
| S3 морф | отменён (с 2 исключениями) | decisions.md:24: toggle MButton/MButtonIcon/MButtonGroup (`button/morph.ts`) и FAB menu (`fab-menu/morph.ts`) на `springToCss`; обычная кнопка — без `border-radius` в transition (проба `plain`) | — |
| S4 пружины | отменён (с теми же исключениями) | decisions.md:24; переходы — `--sys-motion-*` | — |
| S5 `density`, 3 ступени | сделано | decisions.md:221; `MSize` удалён; кнопки 32/40/56 (проба); `density` у avatar, button-family, color-input, file-input, list item, loading, progress, search, slider, text-field, timeline | — |
| S6 emphasized-типографика | нет | `base/_fonts.scss`: 60 переменных `--md-sys-typescale-*` = 15 baseline × 4, emphasized нет; `$theme-typography-link` без ветки `emphasized` (`_variables.scss:213-314`); `typescale` без трекинга (`_mixins.scss:140-145`); проба: emphasized-переменных и `tracking` нет | extended FAB comfortable (headline-small, вес 400 — проба), заголовки app bar, FAB menu, кнопки (TK-03) — все на baseline |
| S7 иконки / СВ-3 | частично | СВ-3 закрыт W69-Б (decisions.md:54): `MIcon filled` (`icon/props.ts:17-18`); навигация рисует `filled` (decisions.md:165, `fragments/navigation-item`) | выбранная `MButtonIcon` — W70-А (decisions.md:214, «миграция ждёт»); `MButton` toggle — тоже только руками через слот `{ selected }` |
| S8 мишень 48 | частично | миксин `abstracts/_mixins.scss:189-209` (`pointer: coarse`, `both \| block`), decisions.md:176. Применён: `button/index.vue:266-269` (compact + все MButtonIcon), `fab/index.vue:84`, `extended-fab/index.vue:174`, `group/index.vue:108` (block), `choice/_control.scss:116` (checkbox, radio), `switch/index.vue:159`, `chip/index.vue:179`, `date-picker/_parts.scss:166, 258`, `pagination/index.vue:294`, `fragments/breadcrumbs/item/index.vue:89`, `snackbar/index.vue:281`. Проба (тач): compact, icon, FAB, ext FAB, split, checkbox, radio, chip — 48 | **MButton `default` 40 (M3 S)** — `::after: none` (проба; `common.md:50` требует XS/S, а `index.md` и decisions.md:176 — только compact); **сегменты `MButtonSegmented`** 38–40 — нет мишени (проба); **образцы `MColorPicker`** 32×32 — нет (проба; `color-picker/_index.scss:80-82`); **период `MTimePicker` horizontal** 38 — нет (проба; `time-picker/_index.scss:55`); ползунки цвета — своя мишень 40 (`color-picker/_index.scss:14`); удаление недавнего запроса в search — 40 (`search/_index.scss:83`, WIP владельца) |
| S9 общая ветка `selected` | частично | у семьи кнопок полная пара `selected`/`unselected` на каждый вариант (`_functions.scss:149-176`) и выбранная форма в ступени (`button/_index.scss:20-31`); `selected` есть ещё у segmented, chip, list item, table, toolbar, date/time picker, color swatches, number-input | общего контракта нет: ключи разные (`container/content` у кнопок и segmented, `container/color` у date-picker, `container/label` у time-picker, только `color` у list item); у navigation-item и menu — `active`, у checkbox и radio — `checked`, у breadcrumbs, pagination и date-picker — `current`; формы в ветке нет нигде, кроме кнопок |
| S10 роли цвета | сделано (ничего не делать) | проба: `--md-sys-color-primary-fixed-dim`, `--on-tertiary-fixed-variant` есть; `surface-tint` и `surface-variant` не выводятся (`utils/theme/themeScss.ts:12-15`) | — |

## Справочники
- **roadmap.md** (обновлён 2026-10-07, статусов нет):
  - Волна 0 закрыта целиком: СВ-1 = 12%; СВ-3 = W69-Б; hairline `max(1px, 1rem)` (decisions.md, «Решено,
    миграция ждёт»: остался `MTabs`).
  - Волна 1:
    - S2 — отменён, а roadmap всё ещё «добавить»;
    - S6 — нет;
    - S8 — сделано, но только на тач;
    - S9 — частично;
    - п. 6 (запись решений) — сделано.
  - Волна 1, п. 5 (`density`) расходится с кодом в двух местах:
    - roadmap ждёт «loading 24/48/64», а decisions.md:160 даёт 16 · 24 · 32;
    - roadmap ждёт «progress — убрать ось», а у `MProgress` есть `density` (`progress/props.ts:24`, Q11-А).
  - Волна 4 по кнопкам сделана. Лестница FAB — в редакции владельца 40/56/96, `MButtonGroup` — только connected.
- **coverage-matrix.md** (2026-10-07). Компоненты «нет в ките»:
  - Button groups — `MButtonGroup` есть (`components/ui/button/group/`), но только connected; матрица устарела.
  - Side sheets — кода нет (`sheet/props.ts` без стороны). План — раздел в `overlays/sheet.md`, тег
    `planned` от 2026-10-07, ждёт вопросов 1–2.
  - Carousel — кода нет. План — `.cursor/plans/feature/low-priority-components/carousel/{index,item}.md`.
  - Вердикты семьи кнопок («переработка» / «дрейф» / «нет в ките») устарели: все восемь планов
    реализованы.
- **index.md**:
  - В «Сводке вердиктов» среди «нет в ките» числится rich tooltip, а он есть (`tooltip/props.ts:14`,
    `MTooltipVariant = … | 'rich'`). Button group тоже уже есть.
  - Строка решений «S3/S4 отклонены; статичная форма допустима» не знает двух исключений
    (decisions.md:24).
- **common.md**:
  - S2 и S6 говорят «добавить»: S2 выброшен, S6 не начат.
  - S3 говорит «допустима только статичная форма» — расходится с исключениями.
  - S8 называет «кнопки XS/S», код — только compact (XS).
  - Текст СВ-1 и СВ-3 не отмечен как закрытый.
- **agent-brief.md:9**: путь репозитория `C:\dev\projects\internal\m3-ui-kit-nuxt` устарел (сейчас
  `D:\dev\primetime\ui\kit`). Запрет на «пружины и морф в компоненте, где их ещё нет» (`:149`) совпадает
  с decisions.md.

## Регрессии
Не найдено. Отличия от прежнего вида — по решениям владельца, а не поломки:
- мишень 48 на мыши раньше была у любого указателя, теперь только на таче — Q40-Б, decisions.md:176;
- `MButtonIcon` больше не даёт 48 на мыши.

## Планы с неверным статусом (тег → факт, одна строка почему)
Неверных тегов нет. Оговорки:
- `icon.md` `done`: W70-А (залитый глиф) решён позже, 2026-10-24, и не сделан.
- `group.md` `done`: сам текст тега говорит «частично» (standard отложена).
- Теги `index.md` («цель 48 у compact») и `icon.md` («цель 48 у всех ступеней») не упоминают, что мишень
  теперь только на таче.

## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные
Неотвеченных в `button/*` и в СВ-1…СВ-3 нет: все В-вопросы закрыты владельцем (теги планов, summary
`button-family-m3_2026-10-07.md`). Найдено аудитом, нужен ответ владельца:
- **S8, объём мишени 48.** `common.md:50` требует мишень у кнопок XS/S, `index.md` и decisions.md:176 —
  только compact. Варианты:
  1. Расширить `touch-target` на `MButton default`, сегменты segmented, образцы color-picker и период
     time-picker. Совпадает с M3 (48 у всех контролов ниже 48). Цена: S на каждый компонент; соседние
     образцы с зазором 8 и сегменты встык нужно растить только по блочной оси.
  2. Оставить compact-only и исправить `common.md` S8. Ноль работы, но на таче образцы 32 и сегменты 38
     остаются ниже 48.
  - Рекомендация: 1 для образцов (32 — самая маленькая цель кита) и для периода time-picker, по блочной
    оси. Для `default` 40 и сегментов — по решению владельца.
- **Запись решений в decisions.md.** Отказ от S2, лестница FAB 40/56/96 и отложенная standard group есть
  только в summary и тегах планов. Рекомендация: внести строками в «Архитектурные размены» (обе локали).
  Вопрос владельцу — только «вносить ли».

## Пункты в занятых родителем файлах
- `directives/ripple.ts`: рипл на Space и модульное состояние `keyboardRipple` — [занят], чинит родитель.
  Проба показала рипл на нажатии мышью (≈0.11 в моменте); Space/Enter переключают toggle (проба
  `toggle`), сам рипл на клавиатуре не мерился.
- `composables/popover/**`: позиционирование столбца FAB menu и меню split идёт через `usePopover`.
  Проблем не найдено: anchorless-проба проходит, у split меню открывается. Правок не требуется.

## Пробы (файл → тесты → прошло/упало, ключевые измерения)
Запуск: `npx playwright test -c playwright.probe.config.ts playground/probes/plans-audit-2/buttons --output test-results/plans-audit-2/buttons`.

- `geometry.probe.ts` — 10 тестов, 10 прошли. `extended FAB folds` один раз упал под параллельной
  нагрузкой (фиксированное ожидание 800 мс) и прошёл при повторе. Измерено:
  - MButton: 32/40/56; отступ 12/16/24; иконка 20/20/24; square 12/12/16; трекинг `normal`;
  - MButtonIcon: density × width — как в таблице плана;
  - FAB: 40/56/96, радиусы 12/16/28, иконки 24/24/36; extended FAB: 40/56/96, шрифт 14/16/24;
  - свёрнутый extended FAB — 55.97 × 55.99;
  - split: зазор 2, углы 4, правая кнопка 48/48/56; группа: зазор 2, углы 8/пилюля; segmented: 40, ≥ 58;
  - icon-only MButton: 40/24; открытый FAB menu: 56/r28, пункты h 56, отступ 24, зазор 4.
- `toggle.probe.ts` — 7 тестов, 7 прошли. `aria-pressed` переключают клик, Space и Enter; выбранная —
  12rem; selected+disabled — 12; у ссылки `aria-pressed` нет. Обычная кнопка при нажатии остаётся 999,
  без `border-radius` в transition. У toggle inline transition — `border-radius 230ms linear(…)`, при
  reduced motion — `short-4 standard`. Кнопка-иконка: 20 → 12 и 12 → 20. Группа: 8 → (нажатие) 8 →
  (выбор) 20.
- `target.probe.ts` — 3 теста, 1 прошёл, 2 упали (4 мягкие проверки).
  - На мыши: `::after: none`, мишени нет.
  - На таче мишень 48 есть у compact (блок −8), icon (−8/−10, −4/−4), compact FAB, ext FAB (блок −4),
    у обеих половин split (зазор свободен), checkbox, radio, chip.
  - Мишени нет у MButton default 40, у сегмента segmented 38, у образца цвета 32×32 и у периода
    time-picker 38. Это и есть 4 упавшие проверки.
- `keyboard.probe.ts` — 8 тестов, 8 прошли. Segmented ltr/rtl: стрелки обходят disabled, rtl зеркалит,
  Home/End. Multiple: Space меняет `aria-pressed`. Группа — тот же движок. Split: две остановки Tab,
  Enter открывает меню, шеврон смотрит вверх, Escape возвращает фокус; Alt+↓ не реализован (это
  UX-предложение, не одобрено). FAB menu ltr/rtl: ArrowDown на закрытом FAB, Escape, Tab, выбор, клик
  снаружи; пустое меню не открывается.
- `ssr.probe.ts` (JS выключен) — 2 теста, 2 прошли.
  - В серверном HTML уже есть: `ui-button--selected` + `aria-pressed=true` и радиус 12 в первом кадре;
    compact 32; отключённая ссылка — без `href`, `role=link`, `aria-disabled`.
  - Segmented и группа: `radiogroup` и `aria-checked`, у группы пилюля 20; split: `aria-haspopup=menu`,
    `aria-expanded=false`; FAB menu: `aria-expanded=false`, имя есть.
  - `[data-fixture-ready]` на сервере не ставится — так и задумано.
- `fab-menu-anchorless.probe.ts` — 6 тестов, 6 прошли. Зазор 7.99 / 8.02 / 8.00 при 1280 / 1366 / 1920,
  в JS-пути и с CSS anchor; край ≤ 0.016.
- `system.probe.ts` — 2 теста, 2 прошли. S2: новых углов нет. S6: emphasized и tracking нет. S10:
  fixed-роли есть, `surface-tint` нет. S1: 0 / 0.08 / 0.10, нажатие — рипл.

## Добавленные фикстуры
Нет: хватило существующих фикстур `button/{matrix,family}`, `button-group/matrix`,
`fab-menu/{matrix,stress}`, `checkbox|radio|chip|color-picker|time-picker/matrix`.
