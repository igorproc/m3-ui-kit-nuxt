# Overlays — аудит планов

Итог: сделано 44 · частично 22 · нет 13 · регресс 0 · отменено 12 · не проверено 2 (по строкам таблиц ниже;
документация DC-* — docs_v2/v3 вне репо — не считалась).

Прошлый аудит (2026-10-23) считал dialog/sheet/tooltip не начатыми, menu заблокированным, overlay/modals
частичными. Прогон 2 почти закрыл dialog, sheet, tooltip и overlay. В menu сделаны клавиатура, имя, `MMenuItem`/`MMenuGroup`
и разделение меню и поповера. Не сделаны кламп высоты, разметка триггера, Expressive-анатомия и
«смонтированное открытым». Заявления журнала G2 подтверждены пробами. Расхождение одно: поверхности тултипа нет в
SSR — так решено (Q19-В). `dir` у телепортированного меню из RTL-поддерева родитель починил во время аудита: первый
прогон — `ltr`, перепрогон — `rtl`.

## overlays/dialog.md — тег `planned` → факт `почти сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | токены и ритм (План работ) | сделано | проба `dialog.probe.ts › basic dialog`: фон = `surface-container-high` (rgb 232 = резолв токена), радиус 28.0rem, ширина 280rem (min 280 / max 560), padding 24, заголовок→тело 16, тело→действия 24, без иконки `text-align: start`, с иконкой `center`, иконка→заголовок 16, иконка 24; `dialog/_index.scss:8-64`, `ui/dialog/index.vue:131-164` (`wrap-reverse` `:160`, `overflow-wrap` `:135,:149`, без `overflow: hidden`) | — |
| Ш1-лог | логические свойства LY-10 (План работ) | частично | физические `max-width` / `min-width` / `max-height` (`ui/dialog/index.vue:105-107`) и `margin: 0 0 …` у заголовка (`:133`) | S |
| Ш2 | `max-block-size` + прокрутка тела (План работ, Г2) | сделано | проба `› 360x350`: верх заголовка 18.8px ≥ 0, низ действий 331 ≤ 350, тело прокручивается, `overscroll-behavior: contain`; `dialog/_index.scss:13`. Окно 320 × 350 не мерилось | — |
| Ш2-разд | разделители над/под телом при прокрутке (scroll-driven) | нет | в `ui/dialog/index.vue` нет `animation-timeline`; журнал G2 (`decisions-G2.md:49`) «не делал» | S |
| Ш2-скр | вставка скроллбара `--ui-scrollbar-inset-block` | отменён | правило владельца «CSS-переменные только у layout» (память `css-vars-only-in-layout`); переменные `--ui-scrollbar-inset-*` из кита удалены (`summary/sweep-run-2_2026-10-24.md`, «Найдено») | — |
| Ш3 | имя без английского fallback, dev-warn, `#title`, `props.ts` | сделано | `ui/dialog/index.vue:27,81-89`, `dialog/props.ts`; проба `› focus`: имя «Reset settings?» через `aria-labelledby` | — |
| Ш4 | события `cancel` / `confirm`, scoped `#actions` | сделано | проба `› matrix`: Esc → `cancel:escape`, Accept → `confirm:accepted`; `ui/dialog/index.vue:78-79` | — |
| Ш5 | reduced motion — fade без масштаба | сделано | `ui/dialog/index.vue:195-197`, токены `--sys-motion-*` `dialog/_index.scss:65-77` | — |
| Ш6 | роль `alertdialog` + `aria-describedby` | сделано | проба `› confirm preset`: `role=alertdialog`, имя «Delete project?», описание «This cannot be undone.» | — |
| Ш7 | full-screen | отменён | `docs/system/ru-RU/decisions.md:49` (W31-В) | — |
| Тесты | фикстуры `dialog/{matrix,stress}.vue`, e2e (axe, autofocus, стопка действий, forced colors, reduced motion) | частично | есть только `fixtures/overlay/matrix.vue` + `overlay.e2e.ts:22-58` (высокий диалог, confirm, Esc); папки `fixtures/dialog/` нет; e2e стопки, forced colors, reduced motion нет | M |
| Г1–Г5 | Готово, когда | сделано | см. Ш1–Ш6; вопросы 1–2 закрыты (W31-В, W32-А) | — |

Токены: совпадают 10 из 10 (контейнер, форма, три паузы, выравнивание, ряд действий, высота, действия, движение).

## overlays/sheet.md — тег `planned` → факт `почти сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | токены и дрейф | сделано | проба `sheet.probe.ts › 412x360`: фон = `surface-container-low` (243), пилюля = `on-surface-variant` (71), радиус 28rem, `overflow: visible`; `› wide`: ширина 639.98rem; forced colors ручки `ui/sheet/index.vue:120-123`; пути `g()` точечные | — |
| Ш1-лог | логические свойства | частично | `max-width` / `max-height` физические (`ui/sheet/index.vue:80-81`); отступы уже `padding-inline` / `-block-end` | S |
| Ш2 | `top.gap` 72, `max-block-size`, прокрутка, safe area | сделано | проба: верх листа 72.02rem, низ = 360 = высоте окна, тело прокручивается; safe area `ui/sheet/index.vue:97-98` (вырез пробой не эмулировался) | — |
| Ш2-свайп | свайп внутри прокручиваемого тела | сделано | по Q18-А свайп только за ручку: проба `› swipe`: протяжка тела на 200px лист не закрыла; `decisions.md:144` | — |
| Ш3 | ручка-кнопка (`<button>`, имя, кольцо, тултип, Enter) | отменён | `decisions.md:144` «ручка … декоративна», kit-bugs B4.5e; зона 48 сделана: проба 48.0 × 48.0rem, пилюля 32 × 4rem | — |
| Ш3-В4 | ручка только когда жест возможен | сделано | проба `› persistent`: ручки нет, Esc не закрывает; `ui/sheet/index.vue:50` (W36-Б) | — |
| Ш4 | имя (dev-warn) и события | сделано | `sheet/props.ts:17`, `ui/sheet/index.vue:58-65`; `cancel`/`confirm` — общий `useModalResult` (проба на диалоге), причина `swipe` | — |
| Ш5 | reduced motion — fade без сдвига | сделано | `ui/sheet/index.vue:165-167` | — |
| Ш6 | порог 56 + учёт скорости | нет | проба `› swipe`: быстрый взмах ручки на 60px (~112rem) лист не закрыл; `composables/overlay/useOverlaySwipe.ts:55` — только порог; `overlay/props.ts:41` `swipeThreshold: 80` — в px, не в rem | S |
| Ш8 | side sheet | отменён | `decisions.md:50` (W33-Г) | — |
| Ш9 | standard и partially expanded | отменён | `decisions.md:50` (W34-А, W35-А) | — |
| Тесты | фикстуры `sheet/{matrix,stress}.vue`, e2e (ручка, свайп, forced colors, reduced motion) | частично | только `overlay/matrix.vue` + `overlay.e2e.ts:59` | M |
| Г1, Г2, Г4, Г5 | Готово, когда | сделано | см. выше; проба `axe.probe.ts`: открытый лист чист. Г3 (ручка-кнопка) отменён с Ш3 | — |

Токены: совпадают 8 из 10; порог жеста — нет (Ш6), индикатор фокуса ручки — отменён (ручка декоративна).

## overlays/tooltip.md — тег `planned` → факт `сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | токены и движение | сделано | проба `tooltip.probe.ts › hover`: фон = `inverse-surface`, текст = `inverse-on-surface`, радиус 4rem, min 40 × 24rem, max 200rem, padding 4/8, шрифт 12rem; scale 0.8 `tooltip/_index.scss:66-68`; reduced motion `ui/tooltip/index.vue:215-217` | — |
| Ш2 | зазор 4 из одного места | сделано | проба: зазор 3.98rem; `ui/tooltip/index.vue:79` `TOOLTIP_OFFSET = '4rem'`, `usePopover.ts:106-111`; `content.offset` удалён | — |
| Ш3-связь | `aria-describedby` на фокусируемом, постоянная связь | сделано | проба `› links`: у 4 кнопок `aria-describedby` → `role=tooltip` с текстом, узел в DOM и скрыт до показа (авто-путь); слот-пропсы — `overlay/matrix.vue` | — |
| Ш3-SSR | текст описания в DOM уже в SSR | отменён | решение Q19-В «в DOM с момента монтирования» (`decisions.md:145`). Побочно: при пути через слот-пропсы серверный HTML ссылается на несуществующий id (`ssr.probe.ts`: `aria-describedby="v-0-6"`, элемента нет до гидратации) | — |
| Ш3-пусто | пустой текст не открывает и не связывается | частично | проба: не открывается; но связь на пустой `role=tooltip` ставится (`composables/tooltip/useTooltipControl.ts:156-165`), план: «связь не ставится» | S |
| Ш3-показ | только `:focus-visible`, Esc без смены фокуса, слушатель Esc только у открытого, «один за раз», hoverable | сделано | проба `› keyboard`: Tab показывает, Esc скрывает, фокус остаётся; клик и уход указателя — скрыт; `› one at a time`: наведение на B закрыло A, указатель на тултипе его держит; `useTooltipControl.ts:133-148` | — |
| Ш3-спека | `useTooltipControl` + unit-спека на анонимной разметке | частично | композабл есть, `composables/tooltip/*.spec.ts` нет | S |
| Ш4 | `placement`, `v-model:open`, `disabled` | сделано | `tooltip/props.ts:23-25`, `ui/tooltip/index.vue:75` | — |
| Ш5 | rich без действий (W37-Б, W38-А) | сделано | проба `› rich`: радиус 12rem, max 320rem, subhead 14rem (`title-small`), текст 14rem, тень; базовые линии M3 (28 / 24) приближены padding 12/16/16 + gap 4 (`tooltip/_index.scss:36-40`) | — |
| Ш6 | долгое нажатие на таче (W39-А) | не проверено | код `useTooltipControl.ts:99-123`; touch-пробы не было | — |
| Тесты | фикстуры `tooltip/{matrix,stress}.vue`, e2e | частично | одна проверка `overlay.e2e.ts:115` | M |
| Г1–Г4 | Готово, когда | сделано | см. выше; проба `axe.probe.ts`: тултип чист | — |

Токены: совпадают 9 из 9 (действия rich и caret вне объёма по W38-А и В4).

## overlays/menu.md — тег `planned` → факт `частично` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1-д2 | закрытое меню без слушателей document | сделано | `ui/menu/index.vue:198-200`, unit `menu/tests/interaction.spec.ts:275` | — |
| Ш1-д3 | возврат фокуса туда, откуда открыли | сделано | проба `menu.probe.ts › keyboard`: Esc → `menu-trigger`; `useMenuControl.ts:89-97` | — |
| Ш1-д5 | z-index без литералов | частично | в `useMenu` литерала нет, но `composables/popover/usePopover.ts:135` `DEFAULT_Z_INDEX = '999'` жив (меню и тултип перекрывают его `ticket.zIndex`); база `useStack.ts:86` 2000 не на шкале `z()` | S [занят] |
| Ш1-д6 | меню, смонтированное открытым | нет | проба `› mounted open`: поверхность в DOM, `display: none`, не `:popover-open`; `ui/menu/index.vue:22-27` — `<transition>` без `appear`. Побочно невидимое меню держит блокировку прокрутки: проба `dialog.probe.ts › scroll lock` — `html.style.overflow = hidden` сразу после загрузки | S |
| Ш1-dis | вид disabled без hover/pressed | сделано | `ui/menu/index.vue:272-276` (после hover/active в каскаде); проба: Cut `aria-disabled=true`, в порядке стрелок | — |
| Ш1-CT | CT-03 / CT-04 | частично | `overflow-wrap: anywhere` есть (`menu/item/index.vue:122`); `min-width: 0` у `.ui-menu__item-label` нет (`ui/menu/index.vue:279-281`) | S |
| Ш1-LY | `text-align: start`; длительности на токенах; reduced motion | сделано | `ui/menu/index.vue:258,313-315`, `menu/_index.scss:71-83` | — |
| Ш2-лог | логические `start` / `end`, RTL | сделано | проба `› RTL page`: `bottom-start` правым краем к правому краю триггера (Δ 0), `end-start` слева от триггера (`sRight = tLeft`) | — |
| Ш2-кламп | кламп высоты (`position-try-order`, запас 48 / 8 + safe area, `ResizeObserver`, прокрутка группы) | нет | проба `› height clamp`: окно 200px, низ меню 229px (за краем на 29px), `max-height: none`, `overflow-y: visible`; grep `position-try-order\|max-block-size\|ResizeObserver` по menu/popover пуст; `decisions.md:81` отдаёт кламп `usePopover` | M [занят] |
| Ш2-origin | `--ui-menu-origin` после переворота | частично | `composables/menu/useMenu.ts:77` считает от запрошенного placement, фактическую сторону знает только `usePopover` | S [занят] |
| Ш2-остров | `dir` телепортированной поверхности (RTL-поддерево) | сделано (родитель, во время аудита) | первый прогон `› RTL island`: `direction: ltr`, правые края расходились на 9.7px; перепрогон (`--output test-results/plans-audit-2/overlays`): `direction: rtl`, ближайший `[dir]` = `rtl`, правые края совпали (Δ 0). Ограничение в `decisions.md:147` устарело | — |
| Ш3-клав | стрелки по кругу, Home/End, typeahead, Esc, Tab, Shift+Tab | сделано | проба `› keyboard`: открытие → `item-copy`; End → `item-paste`; ↓ с конца → copy; ↑ с начала → paste; «d» → Delete, «d» → Duplicate; Esc → триггер, меню закрыто; Tab → `after-menu`, меню закрыто; Shift+Tab → триггер | — |
| Ш3-имя | `aria-labelledby` триггера, разделение `$attrs` (EN-04) | сделано | проба `› roles`: `aria-labelledby` = id триггера; `utils/menu/attrs.ts` | — |
| Ш3-триггер | `#activator` + `triggerAttrs` (`aria-haspopup`, `aria-expanded`, `aria-controls`), Enter / ArrowDown / ArrowUp на триггере (A11-06) | нет | проба `› roles`: у триггера все три `null`, у поверхности нет `id`; проба `› trigger keys`: ArrowDown на триггере меню не открывает; потребители размечают сами (`button/split/index.vue:39`, `fragments/number-input/Unit.vue:22`, `fragments/toolbar/overflow.vue:5`) | M |
| Ш3-бэги | `useMenuControl` на бэгах + спека на анонимной разметке | частично | `composables/menu/useMenuControl.ts:65-76` по-прежнему сам раздаёт `role` и `tabIndex` найденным `button` (план это убирает); `useMenuControl.spec.ts` нет | M |
| Ш3-обход | `a[href]` и `aria-disabled` в обходе | сделано | `useMenuControl.ts:45`; проба: Cut на стрелках | — |
| Ш4 | роль поверхности (Q16-Б) | сделано | `dropdown`, `autocomplete`, `color-input` импортируют `fragments/popover/index.vue`; проба `axe.probe.ts`: открытое меню чистое; `search` остаётся на `MMenu` (WIP владельца, `decisions.md:151`) | — |
| Ш5-пункт | `MMenuItem` / `MMenuGroup` (Q14-А) | сделано | проба `› roles`: группы `role=group` + `aria-labelledby` («Clipboard», «View»), `menuitemcheckbox` с `aria-checked=true` и галочкой; `menu/item/index.vue`, `menu/group/index.vue` | — |
| Ш5-Expr | Expressive: группы (зазор 2, углы 16/8, `surface-container-low`), selected `tertiary-container` + форма 12, vibrant | нет | ждёт вопросов 4–5 (не отвечены, `decisions.md:149`); проба `› geometry`: радиус 4rem, фон = `surface-container` (238), отступ по блоку 0; модификатор `--selected` ставится (`menu/item/index.vue:6`), правил у него нет | L |
| Ш5-потреб | перевод потребителей на `MMenuItem` | частично | unit — да (`fragments/number-input/Unit.vue`); `fragments/toolbar/overflow.vue:21` на CSS-рецепте `.ui-menu__item` | S |
| Ш6 | `absolute` удалён, `origin` → `placement` | сделано | `decisions.md:48` (Q13-А), `:147` (Q26-А); `menu/props.ts` | — |
| Т-строка | подпись `body-large`, шорткат `label-small`, иконка→текст 8, иконки 20, вставка пункта 4 | нет | проба `› geometry`: подпись 14rem (`label-large`), шорткат 12rem (`body-small`), gap 12rem, padding 12rem без вставки; `menu/_index.scss:27,30,34,46` | S |
| Т-слой | hover / pressed слоем `::before` цветом контента | нет | подмена фона `ui/menu/index.vue:261-269` | S |
| Т-forced | selected / disabled в forced colors (`Highlight` / `GrayText`) | нет | в `ui/menu/index.vue:238` только рамка поверхности | S |
| Г1 | у якоря, переворот, кламп, зеркалирование | частично | всё, кроме клампа (Ш2-кламп) | — |
| Г2 | axe чистый на меню, dropdown, autocomplete, color-input | частично | меню — проба чистая; поля в этой группе не мерились | — |
| Г3 | клавиатура APG, возврат фокуса | частично | нет клавиш и разметки триггера (Ш3-триггер) | — |
| Г4 | пункт Expressive standard / vibrant | нет | Ш5-Expr | — |
| Г5 | без слушателей у закрытого, без литералов z-index | частично | Ш1-д5 | — |
| Г6 | SFC ≤ 400 строк | сделано | `ui/menu/index.vue` 324 строки | — |
| Тесты | фикстуры `menu/{matrix,stress}.vue`, `menu.e2e.ts`, unit «смонтировано открытым → `:popover-open`», `useMenuControl.spec.ts` | частично | e2e только в `overlay.e2e.ts:11-112` (axe, Tab, Esc, `bottom-start` в обоих направлениях); `menu/tests/variants.spec.ts:17` проверяет рендер открытого меню, но не `:popover-open` | M |

Токены: совпадают 7 из 21 (supporting text, метка группы, разделитель, disabled, фокус, анимация, удалённая позиция без якоря);
7 ждут вопросов 4–5 (цвет и форма группы, зазор, вертикальный отступ, высота 44, форма пункта, selected); 7 — нет (строки Т-*, отступ от окна 48 / 8).

## overlays/overlay.md — тег `planned` → факт `почти сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | порядок открытия и фокус (A11-12) | сделано | по решению B4.6 фокус на контейнере (`decisions.md:143`). Проба `dialog.probe.ts › focus`: после Enter фокус на корневом `<dialog>`, Tab → «Cancel», после Esc → `open-icon-dialog`; `ui/overlay/index.vue:257-267` | — |
| Ш2 | `aria-haspopup` от потребителя, `aria-controls` | сделано | решение B4.8: `ui/overlay/index.vue:214-219` (modal → `dialog`, popover — без; `aria-controls` только пока корень отрисован) | — |
| Ш3 | прокрутка панели `MOverlay` (страховка CT-10) | нет | `ui/overlay/index.vue:318-331`: панель `align-items: center` без `overflow-y` и `margin-block: auto`; голый `MOverlay` с высоким содержимым режется (диалог и лист решили это сами — пробы) | S |
| Ш4 | алиасы удалённых пропов (EN-11) | отменён | `decisions.md:39` (без алиасов до стабильной версии, 2026-10-18) | — |
| Ш5-guard | `gesture-guard` через `spacing(16)` | сделано | `overlay/_index.scss:24` | — |
| Ш5-contrast | scrim 50% под `prefers-contrast: more` (TH-11) | нет | grep `prefers-contrast` по `src/runtime` пуст | S |
| Ш6 | запись решения о reduced motion | сделано | `decisions.md:162` (W40-Б: локальный `0s` удалён, fade на сокращающихся токенах) | — |
| Ш8 | пружины после S4 | отменён | `decisions.md:24` (S4) | — |
| Г1 | фокус внутри после открытия | сделано | Ш1 | — |
| Г2 | высокое содержимое прокручивается внутри панели | частично | только у `MDialog` / `MSheet` (свои `max-height`), панель — нет (Ш3) | — |
| Г3 | старые имена пропов с предупреждением | отменён | `decisions.md:39` | — |
| Тесты | unit: фокус, Esc у верхнего, `persistent`, счётчик блокировки; e2e 360 × 350 с высоким содержимым | частично | unit `ui/overlay/tests/{variants,interaction,a11y}.spec.ts`, `useScrollLock.spec.ts` есть; e2e голого `MOverlay` с высоким содержимым нет | S |

Токены: совпадают 3 из 4 (scrim 32%, `gesture-guard`, reduced motion; контраст — нет); движение scrim на пружине — отменено (S4).
`> *` в `.ui-overlay__panel` (`ui/overlay/index.vue:328`) — принятое исключение `decisions.md:119`.

## overlays/modals.md — тега нет → факт `частично`
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| М1 | типы `ModalResult`, `ModalDismissReason`, поведенческие тесты (migration 1) | сделано | `composables/modal/useModal.ts:56-62`; причины шире плана (`swipe`, `decisions.md:141`); unit `useModal.spec.ts:73-137` (payload `false`/`0`/`''`, причины, Esc) | — |
| М2 | сервис поверх адаптера VFM (migration 2) | отменён | VFM удалён целиком (`.cursor/summary/overlay-top-layer-vfm-removal_2026-10-01_1200.md`); в `src` и `package.json` нет `vue-final-modal` | — |
| М3 | инъекция сервиса + composable + типы Nuxt (migration 3, plugin) | сделано | имя `$material.modal` вместо `$modals` — правило владельца (память «Kit services via $material»); `plugins/material.ts:22-24,49`; `useModal()` берёт ближайший контекст (`useModal.ts:100`) | — |
| М3-open | one-shot `open(component, { props })` → `Promise<ModalResult>` на сервисе (service-api) | частично | у сервиса `open(id)` по id (`createModalService.ts:139`), компонент открывается только хэндлом `useModal({ component }).open()` | S |
| М4 | `openModal()` → deprecated-обёртка (migration 4) | отменён | `decisions.md:39` (без шимов); `openModal` в `src` нет | — |
| М5 | сервис на рантайме `MOverlay` (migration 5) | сделано | `ui/overlay/index.vue:147,159,208` регистрирует модалку в `$material.modal` | — |
| М6 | пресеты `confirm` / `alert` (migration 6, m3-ux) | сделано | проба `dialog.probe.ts › confirm preset`: `alertdialog` с именем и описанием, «Keep» → `false`; асинхронный `onConfirm` → `loading` (`fragments/modal-preset/index.vue:68-79`); поля — `decisions.md:142` (W42-А: `confirmLabel` / `cancelLabel` / `color` вместо `confirmText` / `tone`) | — |
| М7 | удалить legacy в major (migration 7) | отменён | нечего удалять (М4) | — |
| A-closeTop | `closeTop(reason)` | нет | в `ModalService` (`createModalService.ts:48-86`) его нет | S |
| A-closeAll | `closeAll(reason)` и политика `persistent` | частично | `closeAll()` без причины, закрывает и `persistent` (`decisions.md:141`, W43-А); хэндл отдаёт `programmatic` | S |
| Вложенность | `parent-closed`, дочерняя модалка `useModal`, возврат фокуса в родителя (nesting, m3-ux) | не проверено | код `useModal.ts:100,125`, `ui/overlay/index.vue:175-178`; grep `parent-closed` по `*.spec.ts` пуст, пробы нет | S |
| Тесты | список `<tests>` плана | частично | нет: конкурирующие события, вложенность, `closeAll` + `persistent`, безопасный SSR-хост | M |

## Регрессии

Не найдено. Все дефекты ниже были известны в планах или прошлом аудите и не были починены.

## Планы с неверным статусом (тег → факт, одна строка почему)

- `overlays/dialog.md`: `planned` → почти сделан. Ш1–Ш6 в коде и подтверждены пробами, Ш7 отменён; нет только разделителей прокрутки и тестов.
- `overlays/sheet.md`: `planned` → почти сделан. Токены, высота, свайп за ручку и имя есть; нет только порога по скорости.
- `overlays/tooltip.md`: `planned` → сделан. Все шаги есть; мелочи — связь у пустого тултипа и unit-спека композабла.
- `overlays/overlay.md`: `planned` → почти сделан. Нет прокрутки панели и контрастного scrim.
- `overlays/menu.md`: `planned` → частично. Клавиатура, имя, пункты и поповер сделаны; кламп, триггер, Expressive и «смонтированное открытым» — нет.
- `overlays/modals.md`: тега нет → частично. Результат, сервис и пресеты есть; нет `closeTop`, one-shot `open(component)` и тестов вложенности.

## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные

- `menu.md`, вопрос 4 — имя оси standard / vibrant: `variant: 'elevated' | 'tonal'` · `color: MColor` · новое слово `tone`
  (в плане рекомендован вариант 1, владельцу не задавался — `decisions-G2.md:39`, `decisions.md:149`).
- `menu.md`, вопрос 5 — Expressive-группы или baseline по умолчанию: Expressive · baseline + группы по желанию · только baseline
  (в плане рекомендован 1; от него зависят 7 токенов, Ш5-Expr и Г4).

Остальные вопросы групп закрыты: dialog 1–2 (W31-В, W32-А), sheet 1–4 (W33-Г, W34-А, W35-А, W36-Б), tooltip 1–4
(W38-А, W37-Б, W39-А, Q19-В), overlay 1 (B4.8), menu 1–3 (Q13-А, Q16-Б, Q14-А), modals (W42-А, W43-А).

## Пункты в занятых родителем файлах

- menu Ш2-кламп — `composables/popover/usePopover.ts`, `placement.ts` [занят] (`decisions.md:81` закрепил кламп за `usePopover`).
- menu Ш1-д5 — `DEFAULT_Z_INDEX = '999'` в `composables/popover/usePopover.ts:135` [занят] (+ `useStack.ts:86` — не занят).
- menu Ш2-origin — фактическая сторона после flip живёт в `usePopover` [занят], потребитель — `composables/menu/useMenu.ts:77`.
- `dir` у телепортированной поверхности — родитель починил во время аудита: перепрогон `menu.probe.ts › RTL island`
  даёт `rtl` и Δ 0 (первый прогон — `ltr`, Δ 9.7px).
- Двойная блокировка прокрутки (`composables/overlay/useScrollLock.ts` [занят]) — чинит родитель. В этой группе двойного
  захвата не воспроизвёл: диалог открыт → `html` `overflow: hidden`, закрыт → `''`. Найдена смежная утечка: невидимое
  «смонтированное открытым» меню (Ш1-д6) держит блокировку с загрузки. Чинится в `ui/menu/index.vue` (`appear`), файл не занят.

## Найдено по ходу (вне пунктов планов)

- `composables/overlay/useOverlayDismiss.ts:71-82`: каждый `MOverlay`, в том числе закрытый, держит `window keydown` и
  `useClickOutside` — та же болезнь EN-10, что меню уже вылечило `pause/resume`.
- `playground/fixtures/overlay/audit-overlays.vue` (новый файл в существующей папке) отдавал 404, пока не сделал
  `touch playground/app/utils/fixtures.ts`. В брифе сказано, что такой файл подхватывается сам; это неверно для
  текущего сервера.

## Пробы (файл → тесты → прошло/упало, ключевые измерения)

Папка `playground/probes/plans-audit-2/overlays/`, окно 1280 × 800, Chromium, dev :3200. Итоговый перепрогон —
каждый файл отдельно, с `--output test-results/plans-audit-2/overlays`; результаты совпали с первым прогоном, кроме
`RTL island`.

- `menu.probe.ts` — 8 тестов: 4 прошли / 4 упали.
  - Прошли:
    - `keyboard` — вся последовательность APG, см. Ш3-клав;
    - `geometry` — пункт 48rem, радиус 4, padding 12, gap 12, подпись 14, шорткат 12, фон = surface-container,
      у триггера Δ 0;
    - `RTL page` — Δ 0, `end-start` слева;
    - `RTL island` — `rtl`, Δ 0 после починки родителем.
  - Упали:
    - `mounted open`: `display: none`, не `:popover-open`;
    - `trigger keys`: ArrowDown не открывает;
    - `roles`: у триггера нет `aria-haspopup` / `expanded` / `controls`;
    - `height clamp`: окно 200, низ 229.
- `dialog.probe.ts` — 6 тестов: 5 прошли / 1 упал.
  - `focus` упал по ожиданию пробы (ждал тег `DIALOG` в строке, а получил `data-test` корневого `<dialog>`): фактически
    фокус на контейнере, как требует B4.6.
  - Измерения: 280rem / радиус 28 / ритм 16·16·24 / центр только с иконкой; 360 × 350 — прокрутка тела; пресет
    `alertdialog` → `false`; `scroll lock`: при загрузке `hidden` (невидимое меню), после закрытия диалога `''`.
- `sheet.probe.ts` — 4 теста: 3 прошли / 1 упал.
  - Прошли: верх 72.02rem, ширина 639.98rem, ручка 48 × 48 / пилюля 32 × 4, `persistent` без ручки.
  - Упал `swipe`: взмах на 60px не закрывает (нет учёта скорости).
- `tooltip.probe.ts` — 6 тестов: 6 прошли.
  - Связь до фокуса; inverse-роли, радиус 4, min 40 × 24, зазор 3.98rem.
  - Показ только с клавиатуры, Esc без смены фокуса, один за раз, hoverable, пустой не открывается.
  - Rich: 12 / 320 / 14 / 14.
- `ssr.probe.ts` (JS выключен) — 1 тест: упал.
  - В SSR нет `role=menu`, `<dialog>` и `role=tooltip`; `data-fixture-ready` на сервере не ставится.
  - У тултипа со слот-пропсами `aria-describedby="v-0-6"` указывает на отсутствующий в HTML элемент.
- `axe.probe.ts` — 1 тест: прошёл. Открытые меню, тултип, диалог и лист — без нарушений WCAG 2.2 A/AA.

## Добавленные фикстуры

- `playground/fixtures/overlay/audit-overlays.vue`. Что в ней:
  - меню на `MMenuItem` / `MMenuGroup` (`?placement=` из query);
  - RTL-остров `dir="rtl"`;
  - меню, смонтированное открытым;
  - четыре тултипа: plain, второй, пустой, rich;
  - диалоги с иконкой и без;
  - пресет `$material.modal.confirm`;
  - `persistent`-лист.
- Для регистрации сделан `touch playground/app/utils/fixtures.ts` (содержимое не менялось).
