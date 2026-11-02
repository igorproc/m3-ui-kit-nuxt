# Containment + data — аудит планов

Итог: сделано 93 · частично 9 · нет 3 · регресс 0 · отменено 9 (по пунктам).

Объём сверки: `containment/{card,divider,expansion-panel,list,list-subheader}.md`, `data/{avatar,table}.md`,
`data/timeline/{index,item,divider}.md`. Документация (DC-*, шаги «документация») не учитывалась: страницы живут в
отдельном репо `docs_v3/content/en/components/*`, как и в прошлом аудите. Концепты глазами не сравнивались — расхождения
концепта с кодом здесь только там, где их отменил владелец (растянутая ссылка карточки, тоны статуса timeline).
Строки `decisions.md` — `docs/system/ru-RU/decisions.md` на 2026-10-30.

## containment/card.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | CT-04/07/09, IN-05, RS-01, LY-04, TK-06, точечные пути, форма из `$theme-shape-link` (План работ) | сделано | `components/ui/card/index.vue:107-198`, `assets/.../card/_index.scss:13-89`; проба `card.probe.ts › geometry` — padding 16, gap 12, угол 12, медиа 16:9 (1.778) во всю ширину внутри рамки, `overflow-wrap: break-word`, `flex-wrap: wrap` у действий; `› long word` — длинное слово без переполнения (0 px), 5 действий в 280 — в 2 ряда, `overflow-clip-margin` медиа при фокусе ссылки внутри = 5rem (в покое 0) | — |
| Ш2 | статичная без состояний, `variant` сужен (План работ) | сделано | `card/_states.scss:10` (всё под `--link`), `card/props.ts:11`; проба `› static card` — hover не меняет фон/тень, `::before` нет, курсор `auto` | — |
| Ш3 | интерактивная карточка по решению владельца — корень-ссылка `tag="link"` (План работ) | сделано | `card/_states.scss:10-102`, `composables/card/useCard.ts:47-65`; проба — слой hover 0.08 / focus 0.10 / pressed 0.12, тень 1→2 на hover, кольцо на самой карточке, у outlined в фокусе рамка `on-surface`, Tab обходит статичные и отключённые, Enter переходит; отключённая — `<a>` без `href`, `role="link"`, `aria-disabled="true"` (и в SSR) | — |
| В1 | растянутая ссылка в заголовке, режим `interactive`/кнопка, событие `click` (Открытые вопросы) | отменён | `decisions.md:26` | — |
| Г2 | действия внутри интерактивной карточки — отдельные цели | отменён | `decisions.md:26`; вместо этого dev-предупреждение `card/useCardWarnings.ts:46-52` | — |
| A | `headingLevel` без дефолта; `mediaAspectRatio`; `disabled` только у ссылки + предупреждение | сделано | `card/props.ts:23-31`, `useCard.ts:62`, `useCardWarnings.ts:38-42`; SSR-проба — 15 `h3.ui-card__title`, `article[aria-labelledby]` | — |
| Г1, Г3, Г4 | статичная не реагирует, ссылка — слой/тень/кольцо/disabled; `variant` сужен, литералов нет; дефекты закрыты | сделано | пробы выше; forced colors — `forced-colors.probe.ts`: рамка elevated `CanvasText`, кольцо `Highlight` | — |
| Тесты | фикстуры, e2e, unit по эталону | сделано | `playground/fixtures/card/{matrix,stress}.vue`, `card.e2e.ts`, `card/tests/{variants,interaction,a11y}.spec.ts` | — |

Токены: совпадают 9 из 9 (dragged вне объёма по самому плану, В4).

## containment/divider.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | линия рамкой, `max(1px, 1rem)`, без `width/height: 100%`, вертикаль `align-self: stretch` / inline `1lh` (План работ) | сделано | `divider/index.vue:38-57`; `divider.probe.ts` — в узком родителе переполнение 0 px; на окне 360 (1rem = 0.47 px) толщина 1 px; вертикаль в тексте и в блоке 24rem (= 1lh) | — |
| Ш2 | ось `inset: start\|center\|end` по логическим сторонам, вертикаль — `margin-block` | сделано | `divider/props.ts:15-21`, `index.vue:60-68`; проба LTR/RTL — start 16rem с начала строки (в RTL справа), center 16/16, end 16 с конца; вертикаль 16 сверху/снизу; линия внутри рамки-родителя | — |
| Ш2 | алиас `inset: true → start` с предупреждением | отменён | `decisions.md:39` (алиасы снятых значений не делаются) | — |
| Ш3 | семантика по контексту (владелец: вариант 3) | сделано | `divider/index.vue:21-24`; проба — в `MList` `li aria-hidden` без роли, вне списка `div role="separator" aria-orientation`; так же в SSR | — |
| Г1, Г2, Г4 | inset не выходит за родителя; start/center/end; forced colors и узкий экран | сделано | пробы выше; forced colors — рамка 1 px `CanvasText` | — |
| Г3 | в меню — separator | сделано | вне списка `MDivider` — separator; меню своё деление рисует рамкой `MMenuGroup` (`menu/group/index.vue:46`), `MDivider` там не используется | — |
| Тесты | фикстуры, e2e, unit | сделано | `fixtures/divider/*`, `divider.e2e.ts`, `divider/tests/*` | — |

Токены: совпадают 4 из 4 (отступ меню — не здесь, по плану).

## containment/expansion-panel.md — тег `done` → факт `частично` (тег неверен — только правило rem)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | `inert`, `span` в кнопке, предупреждение без имени, `aria-disabled` в `mandatory`, явный `MIcon`, CT-03/04, LY-10, reduced motion (План работ) | сделано | `composables/expansion-panel/useExpansionPanelControl.ts:112-127`, `expansion-panel/index.vue:20-42,61,84-90,193-212`; `expansion-panel.probe.ts` — Tab из свёрнутой панели с формой уходит на следующую панель, регион `inert`, Enter открывает (Tab → `field-name`), Space закрывает; в mandatory открытая `aria-disabled="true"`, Enter её не закрывает; `text-align: start`; reduced motion 0.3 s → 0.1 s | — |
| Ш2 | слой `::before`, `focus-ring(inset)`, `overflow: clip`, disabled по ролям, точечные пути, форма из ссылки | сделано | проба — hover: слой 0.08, фон кнопки прозрачный; `outline-offset: -2px`; корень `overflow: clip`, угол 12; заголовок min 56, padding 12/24, gap 16 | — |
| Ш3 | `useExpansionPanelControl` + спека, EN-04, EN-05, `#trailing`, `headingLevel` | сделано | `useExpansionPanelControl.ts` (+`.spec.ts`), `expansion-panel/props.ts:26,36`; проба — `data-test` потребителя оказывается на кнопке; `h3` вокруг кнопки (и в SSR) | — |
| Ш4 | ритм группы (владелец: segmented) | сделано | `assets/.../expansion-panel/_index.scss:25-31`; проба — зазор 1.99rem, углы [12,4] [4,4] [4,12] | — |
| Ш5 | `loading` снят | сделано | `expansion-panel/props.ts:13-27` — пропа нет | — |
| E-1 | предустановленная панель группы открыта в SSR | сделано | `ssr.probe.ts` (JS выкл.) — открытый регион 48 px, закрытый 0; серверный HTML — `aria-expanded="true"`, у свёрнутых `inert` | — |
| Г1–Г4 | — | сделано | пробы выше; RTL — шеврон у начального края (16 px от левого края в RTL); forced colors — контур раскрытой `CanvasText`, disabled `GrayText` | — |
| Тесты | — | сделано | `fixtures/expansion-panel/*`, `expansion-panel.e2e.ts`, `tests/*` у панели и группы | — |
| Правило rem | forced colors: `outline: 1px` / `outline-offset: -1px` литералами в `.vue` | частично | `expansion-panel/index.vue:315-316` | S |

Токены: совпадают 7 из 7.

## containment/list.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | слой `::before`, disabled по частям, отключённая ссылка, `#empty`, логические отступы, `overflow-wrap`, токены, мёртвые ключи, `video`, `outline` из перехода (План работ) | сделано | `list/item/index.vue:147-312`, `assets/.../list/item/_states.scss`; `list.probe.ts` — переход `background-color, color`; `overflow-wrap: break-word`; длинное слово — переполнение 0; `items=[]` → один `li.ui-list__empty`; отключённая ссылка без `href`, Tab её пропускает | — |
| Ш2 | Expressive-геометрия + `secondary-container` (владелец) | сделано | `list/item/_index.scss:35-50`; проба — padding 10/16, gap 12, зазор между строками 0, угол 4 → выбранная 16 (и под hover 16), фон выбранной = `secondary-container`, текст `on-secondary-container`, hover-слой 0.08 поверх | — |
| Ш3 | `ul`/`li`, `li`-обёртка у интерактивной, `aria-current` / `aria-pressed` | сделано | `list/index.vue:3,46`, `composables/list/useListItemControl.ts:54-69`; проба — `ul`; кнопка / ссылка / `div[role=button]` внутри `li`; статичная выбранная `aria-current="true"`, кнопка `aria-pressed`, ссылка `aria-current="page"`; SSR — `<li class="ui-list__row"><button` | — |
| Ш4 | `loading` снят; `lines` число → clamp + `title` | сделано | `list/item/props.ts:32-62`, `item/index.vue:127-131,202-220`; проба — `line-clamp: 1`, `title` с полным текстом | — |
| Ш5 | записи в `decisions.md` (segmented, reorder, swipe, expandable) | сделано | `decisions.md:25` | — |
| CT-09 | заглушка голой картинки (прошлый аудит) | сделано | `list/item/index.vue:253-267`; проба на новой фикстуре `list/audit-media` — битая картинка 56×56 и видео 100×56 на `surface-container-highest`; `MAvatar` с битым `src` — инициалы «AL», `role="img"` | — |
| О | ось `density`: compact 2 и 3 строки не держат 60 / 76 | частично | токены `list/item/_index.scss:22-23`, а отступ 10 (`:38-39`) и зазор supporting 4 (`:75,83`) от плотности не зависят; проба `list.probe.ts › row heights` на `list/audit-density` — compact-2 = 67.95rem (ждали 60), compact-3 = 87.94rem (ждали 76); compact-1 44, default 56/72/88, comfortable 64/80/96 — верно. Развилка ниже | S |
| Г1–Г4 | — | сделано | клавиатура: Tab только по включённым интерактивным строкам, Enter и Space у эмулированной кнопки дают по клику, кольцо внутрь (−2px); RTL — leading справа; forced colors — выбранная с контуром `Highlight`, disabled `GrayText`; файлы ≤ 400 строк | — |
| Тесты | — | сделано | `fixtures/list/*`, `list.e2e.ts`, `list/{tests,item/tests,subheader/tests}` | — |
| Правило rem | forced colors: `outline: 1px` / `-1px` литералами | частично | `assets/.../list/item/_states.scss:70-71` | S |

Токены: совпадают 14 из 14 (дефект плотности — ось, строкой выше).

## containment/list-subheader.md — тег `done` → факт `частично` (тег неверен — только правило `>`)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | точечные пути, `isolation`, `scroll-margin-block-start` (LY-09), `spacing()` (План работ) | сделано | `list/subheader/index.vue:48-88`, `list/index.vue:73-78`; проба — `scroll-margin-top` строки под липкой подписью 48rem, Shift+Tab не оставляет фокус под подписью | — |
| Ш2 | заливка sticky (владелец: проп `surface` у `MList`) | сделано | `list/types.ts:8-25`, `subheader/_index.scss:24-36`; проба — заливка = роль для `surface`, `surface-container-low`, `surface-container` | — |
| Ш3 | тег по контексту (владелец: `li` без роли) | сделано | `subheader/index.vue:36`, `decisions.md:83`; проба — `li`, `role` нет | — |
| Г1–Г4 | — | сделано | inset 52rem совпадает с началом текста строки в LTR и RTL (проба), `z-index: 1` внутри изолированного списка | — |
| Правило `>` | `&:has(> .ui-list-subheader--sticky)` — нет в принятых исключениях | частично | `list/index.vue:76`; исключения — `decisions.md:119` (только app, overlay, timeline); обоснование есть лишь в `.cursor/summary/m3-polish-containment-data_2026-10-19_0021.md:115` | S |

Токены: совпадают 5 из 5.

## data/avatar.md — тег `done` → факт `частично` (тег неверен — только правило rem)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | ось `density` 24/40/56 | сделано | `avatar/props.ts:21-25`, `assets/.../avatar/_index.scss:12-28`; `avatar.probe.ts` — 24 / 39.98 / 55.99rem у картинки, инициалов, иконки и битого; иконка 16/24/32 | — |
| Ш1 | алиас `size` с предупреждением | отменён | `decisions.md:39` | — |
| Ш2–Ш5 | ранняя ошибка, имя при запасном варианте, обводка рамкой и forced colors, токены | сделано | `composables/avatar/useAvatar.ts:64-72,106-113`; проба — битое → «BI» + `role="img" aria-label`, `alt` сохраняет имя после падения, `alt=""` — без роли; outlined — `border` solid, `box-shadow: none`; forced colors — tonal и outlined с рамкой `CanvasText`; SSR — бокс ступени зарезервирован | — |
| A | `variant` через `Extract<MVariant>` | сделано | `avatar/props.ts:15` | — |
| Г1–Г4 | — | сделано | пробы выше | — |
| Тесты | — | сделано | `fixtures/avatar/*`, `avatar.e2e.ts`, `avatar/tests/*` | — |
| Правило rem | forced colors: `border: 1px solid CanvasText` литералом | частично | `avatar/index.vue:133` | S |

Токены: совпадают 2 из 2.

## data/table.md — тег `done` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | слой hover поверх выбора, токены (План работ) | сделано | `assets/.../table/_rows.scss:29-84`; `table.probe.ts` — фон выбранной = `secondary-container` и под курсором не меняется, слой ячейки 0.08 | — |
| Ш2 | состояния данных, слоты, `aria-busy`, постоянный `role="status"` | сделано | `utils/table/model.ts:35-42`, `useTableControl.ts`; SSR — `aria-busy="true"`, строка-сообщение `--loading` | — |
| Ш2 | DT-10 (устаревшие данные), DT-11 (задержка показа индикатора) | нет | отложено в заметках плана; DT-11 ждёт S6 (`owner-questions.md`, рек. Б) | S |
| Ш3 | mixed «выбрать все», `aria-selected`, имена чекбоксов | сделано | `fragments/table/header/index.vue:9-14`; проба — `indeterminate=true` без `aria-checked`, Space → выбрана вся страница, ещё Space → страница снята; чекбокс строки назван «Desk lamp»; `aria-selected="true"` | — |
| Ш4 | числа и перенос | сделано | проба — `text-align: end`, `tabular-nums`, `nowrap`, текст у конца ячейки в LTR и RTL; SKU `overflow-wrap: anywhere`, узкая колонка без переполнения | — |
| Ш5 | сортировка | сделано | проба — Enter: `aria-sort` ascending → descending → none, кольцо внутрь (−2px); резерв иконки `header/index.vue:37-42` | — |
| Ш6 | `density` 40/52/64, шапка +4 | частично | проба `› density` — compact-строка с чекбоксом 41.48rem (ждали 40): чекбокс 40rem + волосок разделителя 1 px; default 51.98, comfortable 63.98, шапка 44/56/68 — верно. Токены `table/_index.scss:13,39`, `cell.checkbox` `:78-82` | S |
| Ш7 | фокусируемая прокрутка, затухание края | сделано | проба — `tabindex="0"`, `role="region"`, имя из `aria-label`, ArrowRight прокручивает (0 → 80); маска на `ui-table-fade`. Заметка: атрибуты региона появляются только после гидратации (`useTableControl.ts:52-81`, `ssr.probe.ts` — широкая таблица прокручивается, но без `tabindex`/`role`) — не вид, поэтому статус не снижаю | — |
| Ш8 | подвал: диапазон, `pageSizeOptions`, `loading` блокирует навигацию | сделано | проба — «1–5 of 7» → выбор 10 → «1–7 of 7», 7 строк; при загрузке фокус остаётся на «Next page», `select` — `aria-disabled` + `--disabled`; RTL — шевроны `scale: -1 1` (своим правилом `fragments/table/pagination/index.vue:224-226`, не через `MIcon mirror` из `decisions.md:164`) | — |
| Ш8 | первая и последняя страница | отменён | S3 в `.cursor/handoff/sweep-run-2/owner-questions.md` (рек. Б «не добавлять, поправить план»); основание — Q47-А, `decisions.md:193`. Ответа владельца на S3 в журналах нет — отмена по рекомендации | — |
| Ш9 | `caption` и атрибуты на `<table>` | сделано | SSR — `data-test`/`aria-label` на `<table>`, `caption.ui-table__caption` | — |
| Ш10 | тесты | сделано | `fixtures/table/*`, `table.e2e.ts`, `table/tests/*`, `utils/table/model.spec.ts`, спеки композаблов | — |
| A | `stickyHeader` | отменён | Q-9 m3-polish: `.cursor/summary/m3-polish-containment-data_2026-10-19_0021.md:11` («липкой шапки нет»). **В `decisions.md` (ru и en) по-прежнему не записан** | S |
| A | `column.maxWidth` | отменён | `decisions.md:29` | — |
| В1 | ось `selection` (одиночный выбор) | отменён | `decisions.md:28` | — |
| Г1–Г4 | — | сделано | пробы выше; forced colors — выбранная строка с контуром `Highlight` | — |
| Правило CSS-переменных | `--ui-table-fade` (`@property`, keyframes, `var()`) у обычного компонента | частично | `table/index.vue:250-258,288,293`; прецедент `--ui-chip-group-fade-*` одобрен только для чипов (`decisions.md:136`) | S |
| Правило `>` | `:has(> .ui-table-container__viewport:focus-visible)`, `row:hover > .ui-table__cell` | частично | `table/index.vue:301`, `assets/.../table/_rows.scss:81`; в `decisions.md:119` не записаны | S |
| Правило rem | forced colors `1px` литералами | частично | `table/_rows.scss:90-91`, `fragments/table/pagination/index.vue:204` | S |

Токены: совпадают 4 из 4 (плотность — с оговоркой Ш6).

## data/timeline/index.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш7 | непрерывная рейка, значок и статус, колонка opposite по условию, контейнерное схлопывание, forced colors и перенос, токены, индекс в контексте (План работ) | сделано | `timeline/item/index.vue:155-356`, `timeline/context.ts:77-81`, `assets/.../timeline/_index.scss`; `timeline.probe.ts` — швов между элементами 0rem; точка 16, рейка 40, отступы плотностей 12/20/32; колонок 3 со временем и 2 без; статус «Done»/«Failed» визуально скрыт, рейка `aria-hidden`; узкая alternate — одна колонка (и в SSR без JS), широкая — две стороны; длинное значение без переполнения, `break-word`; forced colors — рейка рамкой 1 px, точка `CanvasText` | — |
| B9.3 | `--contained` (прогон 2) | сделано | `item/index.vue:84,228-257`; проба — у filled/outlined/elevated padding 12/16, угол 12, край 1 px, точка на центре первой строки (±0.7rem) | — |
| Г1–Г4 | — | сделано | RTL — время, точка, содержимое зеркалятся; SSR — стороны alternate start/end/start/end до гидратации | — |

Токены: совпадают 2 из 2. Заметка: `decisions.md:191` пишет «пункт timeline всё ещё задаёт `anywhere`», а код уже `break-word` (`item/index.vue:195,284`) — запись устарела.

## data/timeline/item.md — тег `done` → факт `частично` (тег неверен — открыт S8)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| A | `status: { tone, label }` → строка | отменён | `decisions.md:27` («Удалено / отвергнуто», с условием возврата). Прошлый аудит: API изменён агентом без подтверждения — теперь записан при сведении sweep-run-2; явного «да» владельца в журналах нет | — |
| A | `color` сужен до `MAccentColor` (S8, рек. А — расширить до всех ролей `MColor`) | нет | `timeline/props.ts:11,51`; `fragments/timeline/divider/index.vue:33,38,65` (`@each` по 4 ролям); карта `assets/.../timeline/_index.scss:59-68` (4 роли). Фикстура `fixtures/timeline/matrix.vue:16,36` уже объявляет `MColor` (S4) | S |
| В1 | акцент outlined → вариант 2 (убрать обещание) | сделано | `timeline/props.ts:47-51` | — |
| — | колонка времени только при `time`/`#opposite`; `datetime` + dev-предупреждение; перенос; готово-когда | сделано | проба — колонок 2 без времени; `<time datetime>`; `item/index.vue:79,100-106` | — |

## data/timeline/divider.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Анатомия 1–3, поведение, Г | одна линия на элемент, точка `CanvasText` в forced colors, пунктир `border-style: dashed`, `aria-hidden` | сделано | `fragments/timeline/divider/index.vue:1-84`, `item/index.vue:168-188,259-264`; проба — швов 0, forced colors точка `rgb(0,0,0)` с `forced-color-adjust: none`, рейка `aria-hidden="true"` | — |

## Регрессии

Нет. Прошлый пропуск list (заглушка картинки строки) закрыт — проба на `list/audit-media`.

## Планы с неверным статусом (тег → факт, одна строка почему)

- `containment/list.md` done → частично: compact-строки в 2 и 3 строки 68/88rem вместо 60/76 (+ px в forced colors).
- `data/table.md` done → частично: compact-строка с чекбоксом 41.5rem; `--ui-table-fade`; `>` и px без записи; DT-10/11 не сделаны.
- `data/timeline/item.md` done → частично: тоны точки сужены до 4 ролей, S8 открыт.
- `containment/expansion-panel.md`, `data/avatar.md` done → частично: только px-литералы в forced colors.
- `containment/list-subheader.md` done → частично: только `:has(> …)` вне списка исключений.

## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные

Неотвеченных развилок в планах группы нет. Открыты с рекомендацией: S3 (Б), S8 (А) — `owner-questions.md`. Новая
развилка из находки (нужен ответ владельца, правило плотности — бизнес-решение):

**list.md, ось `density`: compact в 2 и 3 строки.**
1. Плотность управляет и отступами: compact — padding 6 и supporting-gap 0 (2 строки 56→min 60, 3 строки 72→min 76). Цена: меняется вид compact-списков с подстрокой.
2. Поднять токены compact до фактической высоты (68 / 88). Цена: compact многострочный перестаёт быть плотнее default (72 / 88).
3. Оставить и записать: compact уплотняет только однострочные строки (случай дропдауна). Цена: мёртвые значения 60 / 76 в карте.

Рекомендация: 1 — проп описан как «насколько высоко рисуется форма», и значения 60 / 76 уже обещаны картой.

## Пункты в занятых родителем файлах

Нет. Зависимость: нажатие строки `MListItem` показывает только ripple (`item/index.vue:5`, `directives/ripple.ts` — [занят], чинит родитель); слоя pressed у строки нет по замыслу (`list/item/_index.scss:129-132`).

## Пробы (файл → тесты → прошло/упало, ключевые измерения)

Запуск: `npx playwright test -c playwright.probe.config.ts playground/probes/plans-audit-2/containment --output test-results/plans-audit-2/containment`.
Итог: 38 тестов, 36 прошло, 2 упало (оба — находки). Окно 1280: 1rem = 0.667 px.

- `card.probe.ts` → 5 → 5 прошло: padding 16 / gap 12 / угол 12; слой 0.08/0.10/0.12; Tab мимо статичных и отключённых; RTL — действия у левого края; clip-margin медиа 5rem при фокусе.
- `divider.probe.ts` → 5 → 5: inset 16rem по логическим сторонам в LTR/RTL; 1 px на 360; `li aria-hidden` в списке.
- `expansion-panel.probe.ts` → 5 → 5: заголовок 56, padding 12/24; Tab мимо свёрнутого; Enter/Space; mandatory `aria-disabled`; зазор группы 2, углы 12/4; reduced motion 0.3→0.1 s; шеврон в RTL слева.
- `list.probe.ts` → 7 → 6 прошло, **упал `row heights`**: compact-2 67.95rem, compact-3 87.94rem (ждали 60 / 76).
- `avatar.probe.ts` → 3 → 3: 24/40/56; иконка 16/24/32; имя после падения картинки.
- `table.probe.ts` → 6 → 5 прошло, **упал `density`**: compact 41.48rem (ждали 40); mixed → Space → вся страница; сортировка asc/desc/none; ArrowRight прокручивает широкую таблицу; фокус на «Next page» при загрузке.
- `timeline.probe.ts` → 5 → 5: швов 0; колонок 3/2; alternate схлопывается по ширине ленты; contained 12/16, угол 12; RTL зеркалится.
- `ssr.probe.ts` (JS выкл.) → 1 → 1: `data-fixture-ready` сервер не ставит; открытая панель 48 px, закрытая 0; list default-2 72rem; card padding 16, медиа 16:9; узкая alternate в одну колонку; широкая таблица без `tabindex`/`role` до гидратации.
- `forced-colors.probe.ts` → 1 → 1 (только лог): у divider, card, panel, list, table, timeline, avatar край виден (`CanvasText` / `Highlight` / `GrayText`).

## Добавленные фикстуры

- `playground/fixtures/list/audit-media.vue` — битая картинка, видео без постера, `MAvatar` с битым `src` в `#leading`.
- `playground/fixtures/list/audit-density.vue` — `MList` × три плотности × 1/2/3 строки.

Примечание по правилу BEM: `:where(img, video)` (`card/index.vue:159`, `list/item/index.vue:253,261`) и `:where(h1…h6, p)` (`list/subheader/index.vue:82`) — селекторы тегов для содержимого слота потребителя без классов кита; это допустимое исключение «обёртка слота», но в `decisions.md:119` оно не перечислено.
