# Ошибки кита — все вопросы разом (2026-10-23)

Источник: §13 `showcase/kit-context.md` (B1–B10, B13) + новые баги эксперимента Showcase (`report.md` §4, N.1–N.11).
B11 (принятые компромиссы) и B12 (отсутствующие компоненты) сюда не входят: это не ошибки.
Каждый пункт перепроверен **на текущем рабочем дереве** (HEAD `64fb4dc` + твои незакоммиченные правки: починка
мержа wave-1, search v2). Подробные отчёты с `путь:строка`: `verify/verify-g1..g4.md`.

| Итог проверки | Подпунктов |
|---|---|
| уже починено | 10 (приложение D) |
| очевидный баг — одна правка, без выбора | 109 (приложение A) → один вопрос Q53 |
| развилка — нужен твой выбор | 59 → после склейки дублей **Q1–Q52** |
| пробел-фича (не дефект) | 22 (приложение B) → Q56 |
| документация / упаковка | 24 (приложение C) → Q57 |

**Как ответить одной строкой:** `всё по рекомендации, кроме Q7=Б, Q20=В; Q53 без B8.9b`.
Буквы у вариантов — А/Б/В; рекомендация у каждого вопроса своя. После ответов — план реализации волнами,
кода до этого не трогаю.

Попутные уточнения проверки:
- N.1 (`m-tabs`): корень точнее, чем в отчёте Showcase, — `MTabs` создаёт выбор через `createSingle` без
  `reactive: true`, поэтому заданный не-первый `v-model` не применяется после регистрации вкладок (и SSR рисует первый).
- N.5: та же проблема `<client-only>`-placeholder, что у снекбара, есть у `MMenu`.
- B1.1: опубликованный 0.5.0 без `TableColumn`/`SortState` и типов кнопок; в исходниках и локальном `dist/` они есть —
  нужен только релиз 0.6.0 (твой шаг).
- Уже починено твоими правками: MSearch `v-model:focused` (search v2), мёртвое правило цвета clear у MSearch.

---

## Часть 1. Развилки

### Тема и SSR

**Q1 · B2.1** — `definition: 'system'` renders light in SSR
`system` на SSR всегда светлая и перекрашивается после гидратации. Как чинить?
- **А** Оставить, дефолт `light`, написать про вспышку в `configuration.md` (как docs_v3). Ноль кода.
- **Б** CSS-only: для `system` отдавать блоки палитры с `@media (prefers-color-scheme: dark)`; первая отрисовка верна без JS, цена - лишний блок CSS в head.
- **В** Client Hint `Sec-CH-Prefers-Color-Scheme` - только Chromium, нужен `Accept-CH`.
- *Рекомендация:* Б - единственный вариант с верной первой отрисовкой на всех браузерах.

**Q2 · B2.2a** — Module default contrast `medium`
Дефолтный контраст `medium`, а M3 baseline - `standard`. Менять?
- **А** Дефолт `standard`; `medium` ставят явно (README так и делает).
- **Б** Оставить `medium` (читается лучше, но не M3 по умолчанию).
- *Рекомендация:* А - кит позиционируется как M3.

**Q3 · B2.2b** — Per-theme `contrast` has no effect
Поле `contrast` у темы не читается. Реализовать или убрать?
- **А** Приоритет cookie > тема > `theme.default` (cookie без значения = «не выбрано»); SSR остаётся верным.
- **Б** Удалить поле из типов и доков.
- *Рекомендация:* А - доки обещают, правка локальная.

**Q4 · B2.2c** — `theme.default.variant` / `neutralChroma` unread
`theme.default.variant`/`neutralChroma` объявлены, но не читаются. Что делать?
- **А** Подключить как дефолт для тем без своего значения.
- **Б** Удалить из типов и доков.
- *Рекомендация:* Б - то же задаётся у темы.

**Q5 · B2.3a** — `semanticColors` replaces instead of merging
Своя `semanticColors` вытесняет `success/warning/info`. Мерджить?
- **А** Мердж поверх дефолтов (убрать дефолт - `success: false`).
- **Б** Оставить замену, записать в доки.
- *Рекомендация:* А - согласуется с per-theme мерджем и словом «Extra».

**Q6 · B2.5b** — Theme colour transitions lag ~165 ms
Цвета при смене темы доезжают из-за transition компонентов. Гасить?
- **А** На время смены ставить класс-модификатор на `<html>`, отключающий transition.
- **Б** Оставить, закрыть как deferred.
- *Рекомендация:* Б - косметика, А добавляет глобальное состояние.

### Layout

**Q7 · B3.1** — `.m-layout-main` always scrolls, `sticky` inside never sticks
main всегда `overflow-y:auto`, sticky внутри не липнет. Что делать?
- **А** `auto` только в `full-height` (модификатор из контекста лейаута), иначе `overflow: visible; overflow-x: clip`; sticky работает, широкий контент обрезается, а не скроллится в main.
- **Б** Оставить, обход только в доках.
- *Рекомендация:* А - контракт в доках уже «скроллит только full-height»; в store обход пришлось писать руками.

**Q8 · B3.2** — `container-type` makes main the containing block for `fixed`
`main-content` делает main containing block для fixed (FAB уезжает). Как быть?
- **А** Оставить, в доках: FAB/снекбар класть вне main (`m-layout-item`/`app.vue`).
- **Б** Контейнер включается явным пропом `container` на `MLayoutMain`; по умолчанию `fixed` работает как ждут.
- *Рекомендация:* Б - тихая поломка `fixed` хуже одной опции для `@container`.

**Q9 · B3.3** — Small `MAppBar` + 56 `MSearch` overlaps by 8
Малый `MAppBar` с 56rem `MSearch` растёт до 72rem при резерве 64. Чинить где?
- **А** У малого бара `padding-block: 0` (min-height 64 центрирует 48rem-кнопки); бар равен токену.
- **Б** Потребитель ставит `size-token="72rem"` на `m-layout-header` (в доки).
- *Рекомендация:* А - JS-замер ломает SSR first paint, `padding.block` нужен только medium/large.

**Q10 · B3.5a (+ B3.5c)** — Nested `m-layout` behaves as root
Вложенный `m-layout` ведёт себя как корневой (`min-height:100dvh`, sticky -> `fixed` от viewport). Какой контракт?
- **А** Поддержать: `m-layout--nested` (`min-height: 0`), sticky-зоны вложенного остаются в потоке.
- **Б** Не поддерживать: «зоны только у корневого» + dev-warn на вложенный.
- *Рекомендация:* А - код уже особо обрабатывает `nested`, значит вложенность задумана; в потоке - SSR-верный вариант без fixed.

### Открытые решения (`docs/system`)

**Q11 · B13.1a (+ B13.2c, B8.8a)** — Закрыть OQ-1 и перевести MLoading/MProgress `size` → `density`
Решение 2026-10-07 (density = compact|default|comfortable) в `docs/system` всё ещё «открыто», а MLoading/MProgress живут на `size: small|medium|large`. Закрываем?
- **А** да, сейчас: OQ-1 решён, `size` → `density` (small→compact, medium→default, large→comfortable), `MSize`/`MLoadingSize` удалить без алиаса
- **Б** ждать, держать OQ-1 открытым
- **В** оставить `size` у индикаторов как задокументированное исключение (физический размер)
- *Рекомендация:* А — слово и шаги уже решены, отстали доки и два компонента.

**Q12 · B13.1b** — OQ-2 meaning of `type`
Как развести два смысла `type`?
- **А** `type` только для нативного passthrough; таксономия на свои оси (chip `kind`, toolbar `variant`, app-bar `density`, alert - роль). Ломающие переименования без алиасов.
- **Б** Не переименовывать, правило «не вводить `type` в новом» остаётся.
- *Рекомендация:* Б сейчас, А вместе с миграцией alert.

### Оверлеи

**Q13 · B4.1a** — MMenu default `absolute=false` pins top 72 / right 32 over a backdrop
Что делать с режимом без якоря?
- **А** Удалить, `absolute` убрать без алиаса. Минус: внешний код на «угол окна» получит меню у триггера.
- **Б** Оставить, дефолт `absolute: true`. Минус: мёртвые токены и вторая ветка разметки.
- **В** Не менять. Минус: дефолт неверен.
- *Рекомендация:* А — меню M3 всегда у якоря (plan menu Q1).

**Q14 · B4.1c** — MMenu has no `MMenuItem`
Чем рисовать пункт меню?
- **А** Новый `MMenuItem` + `MMenuGroup`. Минус: ещё одна строка рядом с `MListItem`.
- **Б** Ветка «menu» в `MListItem`. Минус: ветка ради одного потребителя; другая роль цвета выбора.
- **В** Оставить рецепт `.ui-menu__item` + доку. Минус: роли/`aria-checked`/disabled на потребителе.
- *Рекомендация:* А (plan menu Q3).

**Q15 · B4.1e** — MMenu Tab trapped
Что делает Tab в открытом меню?
- **А** Закрывает меню без возврата фокуса (APG). Минус: отступление от «trap держит Tab».
- **Б** Оставить запертым. Минус: один tab-stop, выход только Esc.
- *Рекомендация:* А — правило trap про модальные; у меню есть Esc, APG требует закрытия (plan menu step 3).

**Q16 · B4.3** — MColorInput popover `role=menu` around a picker, button says `dialog`
Как развести меню и панель с чужим виджетом?
- **А** Проп `MMenu role: 'menu' | 'none'`. Минус: «меню, которое не меню» в API.
- **Б** Внутренний примитив `fragments/popover/` на `usePopover`, MMenu только меню. Минус: L-работа; плюс чистый axe.
- *Рекомендация:* Б, А как промежуточный (plan menu Q2).

**Q17 · B4.5a** — MDialog/MSheet `confirm`/`cancel` never emitted
Как MDialog/MSheet отдают результат в `useModal`?
- **А** Слот `#actions="{ confirm, cancel, close }"`, Esc/scrim = `cancel` (как `MDialogDate`). Минус: Esc даёт `false`, не `null`.
- **Б** Убрать мёртвые emits, результат `null`, оборачивать своим компонентом. Минус: `useModal(MDialog)` пуст.
- **В** Встроенные кнопки `confirmLabel`/`cancelLabel` без дефолтов. Минус: дублирует `MDialogDate`.
- *Рекомендация:* А.

**Q18 · B4.5f** — MSheet no `touch-action`
Откуда начинается свайп закрытия листа на таче?
- **А** Только за ручку (`touch-action:none` на ней). Минус: целиться в ручку; плюс — тело скроллится.
- **Б** За весь лист `touch-action:none`. Минус: вертикальный скролл тела мёртв.
- *Рекомендация:* А — как drag handle в M3.

**Q19 · B4.7a** — MTooltip `aria-describedby` on inner span, only while visible
Как довести `aria-describedby` до фокусируемого элемента?
- **А** Slot-props `#default="{ props }"`, потребитель `v-bind`. Минус: без правки вызова связи нет.
- **Б** Авто: первый фокусируемый потомок через `setAttribute`. Минус: правит чужую разметку, ломается при позднем появлении.
- **В** Оба (слот основной, авто запасной). Минус: два пути.
- *Рекомендация:* В (plan tooltip Q4).

**Q20 · B4.9d** — MSnackbar fixed over nav bar / FAB
Как снекбару не перекрывать нижний бар/FAB?
- **А** Layout публикует инсеты и на `html`; `bottom: calc(var(--m3-layout-inset-bottom,0px) + 16rem)`. Минус: FAB не зона layout.
- **Б** Проп `offset`. Минус: каждое приложение дублирует высоту.
- *Рекомендация:* А.

### Навигация

**Q21 · B5.2b** — Rail inside `MLayoutMain` is "hosted" (100% wide)
Должен ли рейл в `MLayoutMain` быть hosted?
- **А** Hosted только в aside/start-зоне; в main своя ширина.
- **Б** Оставить, документировать. Минус: ловушка (порядок CSS в prod, B10).
- *Рекомендация:* А — hosted придуман для aside.

**Q22 · B5.3b** — Bar: rounded at elevation 2
Вид контейнера bar/rail?
- **А** Плоский M3 (угол 0, без тени, `surface-container`); «остров» — задача layout.
- **Б** Остров как осознанное отклонение в `decisions.md`.
- **В** Ось вида `MVariant` filled|elevated.
- *Рекомендация:* А (plan bar Q1; и для рейла).

**Q23 · B5.4b (+ B5.9e (RTL))** — Drawer `side` mixes logical and physical
Как называть сторону drawer?
- **А** `side: 'start' | 'end'`, `left/right` удалить без алиасов, углы/translate логические. Минус: breaking.
- **Б** Оставить физические, весь CSS физический. Минус: RTL не зеркалится.
- *Рекомендация:* А (алиас из плана не нужен по вашему правилу).

**Q24 · B5.7a (+ B9.2a)** — Prev/Next теряют фокус (MPagination и подвал MTable)
Когда «Next»/«Last» становятся недоступны (последняя страница, загрузка), это нативный `disabled` — фокус падает на `body`. В таблице это происходит на каждом запросе страницы.
- **А** «мягкий» disabled: `aria-disabled` + глушение клика, кнопка остаётся в Tab-порядке — общий режим кнопки (расширяет решение В-6, сейчас оно только для `loading`)
- **Б** нативный `disabled` + перенос фокуса на кнопку текущей страницы/соседа (без новой API, но больше JS и догадок)
- *Рекомендация:* А — одна причина в двух местах, семантика уже есть у `loading` (и как в APG для пагинации).

**Q25 · B5.8b** — MBreadcrumbs `scroll` never reveals current
Как показать текущую крошку в `scroll`?
- **А** `scrollIntoView` после mount. Минус: скачок после гидрации (против SSR first paint).
- **Б** CSS `scroll-snap-type:x proximity` + `scroll-snap-align:end` на текущей; без JS, без поддержки остаётся начало.
- **В** Дефолт `wrap`. Минус: меняет вид.
- *Рекомендация:* Б.

**Q26 · B5.9f** — RTL menu `origin`
Как сделать размещение MMenu RTL-зависимым?
- **А** `origin` → `placement` логический `start|end`, физические удалить без алиаса. Минус: breaking.
- **Б** `useMenu` зеркалит `left/right` по direction. Минус: `left` перестаёт значить «слева».
- *Рекомендация:* А — как у drawer.

**Q27 · B5.9g** — RTL `MIcon` doesn't mirror
Как зеркалить направленные иконки?
- **А** Проп `mirror` у `MIcon` (`:dir(rtl) scaleX(-1)`); кит ставит на свои глифы.
- **Б** `MIcon` сам по списку имён. Минус: скрытая магия.
- *Рекомендация:* А.

### Поля и выбор

**Q28 · B6.1a** — Checkbox/radio/switch: aria-invalid, no error message
Показывать ли у MCheckbox/MSwitch/MRadio текст ошибки? (при `path` причина сейчас видна только цветом и aria-invalid)
- **А** нет, текст рисует приложение (как в M3; ошибка адаптера снаружи недоступна).
- **Б** да, строка поддержки (`helperText`/`errorMessage`/`error`), резерв только когда есть что показать (решение 2026-10-19).
- **В** не рисовать, отдать `errorMessage` через слот.
- *Рекомендация:* Б — consent-чекбокс с валидацией иначе не назовёт причину; правило резерва уже есть.

**Q29 · B6.1e** — `loading` ignored
Что делать с `loading` у MCheckbox/MSwitch?
- **А** реализовать (MLoading вместо ручки/галочки, aria-busy).
- **Б** убрать из пропсов (только `disabled`, как radio) — до 1.0 без шимов.
- *Рекомендация:* Б — мёртвый проп хуже отсутствующего.

**Q30 · B6.2a** — `name` sits on the visible input (forms post the label)
`name` у MDropdown/MAutocomplete постит заголовок, а не значение — как отдавать значение форме?
- **А** скрытые `<input type="hidden">` со значением (объект без `itemValue` — `item.id`), по одному на значение при `multiple`; видимый input без `name`.
- **Б** оставить, документировать «отправляйте из v-model».
- *Рекомендация:* А — единый приём в ките, семантика `<select multiple>`.

**Q31 · B6.4b** — `null` unit + `units`: shows the first, model stays null, nothing checked
`units` задан, `v-model:unit` = null — что считать выбранной единицей?
- **А** первая; компонент пишет её в модель при монтировании (модель = экран).
- **Б** ничего не выбрано — триггер пуст, пункты без галочки.
- **В** показывать первую без записи + dev-warning «передайте начальный unit».
- *Рекомендация:* А — модель не расходится с тем, что видит пользователь.

**Q32 · B6.4c (+ B6.6c, B7.1c, B8.5, B5.7c, B6.10c)** — Английские фразы по умолчанию (`MESSAGES` и имена)
В ките остались английские дефолты: number-input (Increase/Decrease/Unit), textarea (Resize), date/time-пикеры (все подписи), pagination (First page…), form-renderer (Submit), имена Progress/Close/Rating/Dialog. Правило — «кит не шипит английский копирайт». Что делаем?
- **А** убрать все дефолты: проп/`messages` без значения + dev-warning (как dropdown/search); `locale: 'en-US'` оставить — это формат, а не текст
- **Б** оставить fallback, пока не появится общий источник фраз через `materialKit.messages` (B13.3b)
- **В** сделать B13.3b сейчас: `materialKit.messages` с английскими дефолтами в конфиге модуля, компоненты читают оттуда
- *Рекомендация:* А — правило уже действует, прецедент в этой ветке; B13.3b — отдельной задачей.

**Q33 · B6.6a** — `MTextField type="search"` keeps the native cancel button
Прятать ли нативную «×» у `MTextField type="search"`?
- **А** прятать (как MSearch); очистка — `#append` или MSearch.
- **Б** оставить (рабочая, но без имени/локали/токенов кита).
- *Рекомендация:* А — для поиска есть MSearch с настоящей кнопкой.

**Q34 · B6.6b** — `MOtpInput` paste `123-456` emits `invalid ['-']`
Вставка `123-456` проходит, но эмитит `invalid ['-']` — что считать ошибкой?
- **А** разделители (пробел, дефис, NBSP) при вставке молча игнорируются; `invalid` — для прочих символов.
- **Б** при вставке `invalid` не эмитится, если очищенный код полный.
- **В** оставить, потребитель фильтрует.
- *Рекомендация:* А — отформатированный код из SMS/почты не ошибка.

**Q35 · B6.9** — Field axes use private `--ui-*` vars
Оси полей живут в приватных `--ui-*` вопреки decisions.md (density в чистом Sass) — переписывать?
- **А** развернуть в Sass `@each` по осям (zero-runtime, но CSS полей вырастет кратно: density × shape × label × variant).
- **Б** принять как задокументированное исключение (живая геометрия от комбинации осей), записать в decisions.md.
- *Рекомендация:* Б — А раздувает вывод ради принципа.

**Q36 · B6.10d** — Config is read once
MFormRenderer читает `config` один раз — делать реактивным?
- **А** оставить (beta), документировать: смена схемы = `:key` на рендерере.
- **Б** пересоздавать форму при смене `config` (введённое теряется; нужна поддержка в адаптере).
- *Рекомендация:* А — до конца beta реактивная схема не нужна, «собрать вручную» остаётся.

### Пикеры, цвет, файлы

**Q37 · B7.1b** — MDatePicker: `modeToggle` по умолчанию
У MDatePicker переключатель «календарь/ввод» включён по умолчанию (с английскими подписями), у MTimePicker — выключен и подписи обязательны. Выравнять?
- **А** да, как у времени: `modeToggle: false`, подписи обязательны при включении (dev-warning)
- **Б** оставить включённым у даты
- *Рекомендация:* А — одна логика у двух пикеров.

**Q38 · B7.1e** — 12h ArrowUp 11 AM → 12 AM
На 12-часовом циферблате ArrowUp на 11 AM даёт 12 AM (период сохраняется) — менять?
- **А** оставить — период переключается отдельно, как в нативном `<input type=time>` и M3-диалоге.
- **Б** шаг через 12 переносит период (11 AM → 12 PM, 11 PM → 12 AM).
- *Рекомендация:* А — совпадает с платформой.

**Q39 · B7.3b** — `MFileUpload :multiple=false` limits each pick, not the queue
`:multiple="false"`: что делать со вторым выбором при занятой очереди?
- **А** новый файл заменяет прежний (идущая загрузка отменяется) — как нативный single input.
- **Б** отказ с причиной (`maxFiles`), пока прежний не удалён.
- *Рекомендация:* А — привычная семантика одного файла.

### Кнопки, фидбек, чипы

**Q40 · B8.2b** — Icon-only `MButton` in `MButtonGroup` gets no 48 target
Как давать 48-мишень icon-only кнопкам в MButtonGroup, если соседи в 2rem друг от друга?
- **А** со всех сторон, как у compact: просто, но мишени соседей перекрываются у стыка.
- **Б** только по блочной оси (40×48): соседей не задевает.
- **В** не трогать (40 проходит WCAG 2.5.8 AA).
- *Рекомендация:* Б — без перехвата у стыка.

**Q41 · B8.6b** — Close sits after the actions in Tab order
В каком порядке по Tab стоят крестик и действия баннера/алерта?
- **А** оставить DOM (действия, крестик): dismiss как последнее действие; в stacked Tab расходится с видимым.
- **Б** крестик в DOM перед действиями + grid-area: в inline фокус уходит на правый крестик раньше левых действий.
- **В** DOM как есть, в stacked визуально поставить крестик после действий.
- *Рекомендация:* А — расхождение только в stacked, лечится В.

**Q42 · B8.6c** — `MBanner layout="auto"` follows the window width
Должен ли `layout="auto"` реагировать на ширину контейнера, а не окна?
- **А** оставить media query и задокументировать (в узкой колонке ставить `inline`/`stacked`).
- **Б** обёртка с `container-type: inline-size`, grid внутрь: точно для колонок, но +1 узел и ломает стили на корне.
- **В** ResizeObserver: нарушает «SSR first paint correct».
- *Рекомендация:* А — M3-баннер на всю ширину, Б меняет DOM ради редкого случая.

**Q43 · B8.7a** — `MBadge` is always a live region
Должен ли MBadge быть live-регионом по умолчанию?
- **А** нет, проп `announce` (по умолчанию `off`), как у MAlert/MBanner.
- **Б** `status` только у значка с текстом, не у точки и пустого.
- *Рекомендация:* А — значок обычно описан хостом, `status` на каждом экземпляре — шум.

**Q44 · B8.8d** — `MLoading` status has only an `aria-label`
Какой доступный контракт у самостоятельного MLoading?
- **А** `role="progressbar"` (без `aria-valuenow`) + `aria-label`: именуется, но сам не озвучивается.
- **Б** `role="status"` + скрытый текст из `ariaLabel`: анонс при появлении, но ненадёжно у динамически смонтированного региона.
- *Рекомендация:* А — пустой `status` ничего не анонсирует; busy хост озвучивает через `aria-busy`.

**Q45 · B8.10d** — `MSelectionGroup` fragment root drops `class`/`aria`
Должен ли MSelectionGroup иметь собственный корневой элемент?
- **А** оставить безголовым, задокументировать (атрибуты вешает потребитель на свою обёртку).
- **Б** корневой `div` с пробросом атрибутов: +1 узел в flex/grid потребителя.
- **В** проп `tag`: без него без обёртки, с ним корень.
- *Рекомендация:* А — компонент authored и безголовый по замыслу.

### Списки и данные

**Q46 · B9.1** — Static selected `MListItem` announces nothing
Что сообщать ассистивным технологиям про статичную выбранную строку?
- **А** `aria-current="true"` на `li` (валидно, но «текущий» ≠ «выбранный»).
- **Б** ничего, но dev-warning «selected без interactive».
- *Рекомендация:* А — `aria-selected` на `listitem` недопустим.

**Q47 · B9.2e** — Footer vs `MPagination`
Встраивать ли публичный MPagination в подвал MTable?
- **А** оставить приватный компактный подвал (решено при создании MPagination).
- **Б** подвал на MPagination (первая/последняя/номера): один компонент, но подвал тяжелее.
- *Рекомендация:* А — подвал закрывает случай таблицы; B9.2a чинится общим механизмом.

**Q48 · B9.6a** — `useHotkey` matches `KeyboardEvent.key`
По какому полю useHotkey сопоставляет клавишу?
- **А** `key` ИЛИ `code` (для букв/цифр ещё `KeyS`/`Digit1`): работают ru-раскладка, Option+буква, Shift+цифра; на AZERTY чуть шире срабатывание.
- **Б** для букв/цифр только `code`: независимо от раскладки, но подсказка MHotkey на AZERTY покажет не ту букву.
- **В** `key` как есть + опция `byCode`.
- *Рекомендация:* А — чинит все случаи без смены API.

**Q49 · B9.6b** — `useHotkey` `scope` is a no-op without `pushScope`
Оставлять ли `scope` у useHotkey?
- **А** убрать `scope`, `pushScope`/`popScope` из публичной поверхности (оверлеи покрыты `isOnTopLayer`); заодно снимает автоимпорт-коллизии (B1.7).
- **Б** сделать рабочим: `useHotkeyScope('editor')` (push/pop в `onScopeDispose`) + доки.
- *Рекомендация:* А — потребителя нет, до 1.0 полуготовый API убираем.

### Новые баги из Showcase

**Q50 · N.1b** — Mount emits `update:modelValue` of first tab
Писать ли авто-выбранный первый таб в `v-model`?
- **А** Да (как сейчас): родитель знает текущий; route-driven вкладки передают `:model-value` из роута. Описать в доке.
- **Б** Нет: model null, эмит только по действию. Минус: родитель не знает текущий таб.
- *Рекомендация:* А после N.1a.

**Q51 · N.7** — `m-dialog-date` returns `Date` for a `null` model
`v-model:date = null` отдаёт `Date` — что отдавать при пустой модели?
- **А** оставить Date (обход — стартовать с `''`).
- **Б** проп `valueType: 'date'|'string'|'number'` (по умолчанию 'date') для пустой модели.
- **В** при `null` всегда `YYYY-MM-DD` (ломает ожидающих Date).
- *Рекомендация:* Б — явный формат для форм с `null`, умолчание не меняется.

**Q52 · N.10** — `m-autocomplete`/`m-dropdown`: panel = field width, rows break mid-word
Панель в узком поле равна его ширине и рвёт слова — как лечить?
- **А** компонентный токен `panel.min-width` (rem): `min-width` перекрывает `width: anchor-size(width)`, панель шире узкого поля.
- **Б** `overflow-wrap: break-word` вместо `anywhere` (слова не рвутся, пока помещаются).
- **В** оставить, документировать минимальную ширину поля.
- *Рекомендация:* А + Б как сопутствующая правка — читаемость не зависит от ширины поля, системные токены не нужны.

---

## Часть 2. Пакетные вопросы

**Q53 — 109 очевидных багов (приложение A).** У каждого одна понятная правка без выбора поведения
(часть — прямо по твоим правилам: удаление алиасов B1.4a–e, hairline B13.2d/B9.4, без английских дефолтов).
Три пункта ты раньше откладывал: B8.9b (сдвиг нажатого чипа на 1rem), B13.3c, B13.3d.
- **А** чинить все, волнами по группам, с colocated-тестами и e2e затронутых фикстур; вычеркни, что не трогать
- **Б** сейчас только N.* и то, во что упёрлись приложения (оверлеи, layout, поля), остальное позже
- *Рекомендация:* **А** — правки мелкие и независимые, по одной они дороже.

**Q54 · B1.2c — `vue` в peerDependencies закреплён точно (`3.5.39`).**
- **А** диапазон `^3.5.35` — потребитель не обязан ставить ровно эту версию
- **Б** оставить точный пин (если он намеренный)
- *Рекомендация:* **А**, если пин не осознанный.

**Q55 · B1.2a — `sass` нужен потребителю, но не объявлен.** Кит отдаёт SCSS, без `sass` сборка падает.
- **А** объявить `sass` в `peerDependencies` (ставить ничего не надо, но это новая запись в манифесте — нужно твоё ОК)
- **Б** только строка в README
- *Рекомендация:* **А** — честный манифест, ошибка на установке вместо падения сборки.

**Q56 — 22 пробела-фичи (приложение B).**
- **А** мелкие сделать вместе с багами: indeterminate у чекбокса + mixed select-all в таблице (B6.1f, B9.2b),
  форматтер значения слайдера (N.9), событие повторного выбора в rail/bar (B5.1b), `#activator` у drawer (B5.4c),
  `headingLevel` у app bar (B3.6b), типы `plain`/`surface` (B13.2a/b), дочистка dash-form `g()` (B9.5b),
  generic `TItem` из `items` (B6.2c), typeahead в меню (B4.1f). Крупные — в план кирпичиков (сессия
  «План первой волны»): сервис снекбаров (B4.9c), clamping панелей (B4.2), ссылки в rail/bar (B5.1a), клавиатура
  toolbar (B5.6d), compact-пагинация (B5.7d), click API крошек (B5.8a), `required` у file-upload (B7.3c),
  `onError` в form-renderer (B6.10f), семантика + контраст (B2.3b), фразы через `materialKit.messages` (B13.3b)
- **Б** всё в план кирпичиков, сейчас только баги
- **В** отложить
- *Рекомендация:* **А**.

**Q57 — 24 пункта документации и упаковки (приложение C).**
- **А** пачкой: README (валидация, sass), changelog 0.6.0 «Breaking», `docs/system`, `architecture.md`, доки layout;
  релиз 0.6.0 на npm — твой шаг
- **Б** позже, после багов
- *Рекомендация:* **А** — вместе с багами, иначе доки отстанут ещё раз.

**Q58 — Как исполнять.**
- **А** одна сессия последовательно: дешевле по лимиту, дольше по времени
- **Б** как M3-polish: 3 Opus-воркера по группам (подключение/тема/layout · оверлеи/навигация · поля/пикеры/кнопки/данные)
  + Haiku-дирижёр для e2e на `:3200`; быстрее, дороже (грубая оценка — 0.5–1 пятичасового окна)
- *Рекомендация:* **Б** — 109 багов + развилки независимы по группам; e2e нужен в любом случае.

---

## Приложение A. Очевидные баги (109)

- B1.2c `vue` pinned exactly — peer `^3.5.35` (unless the pin is deliberate).
- B1.4a `useThemeStore` — delete (owner rule: no pre-1.0 aliases).
- B1.4b Theme `preset` — drop the field and the `?? data.preset` fallback.
- B1.4c `MAppBar type="center-aligned"` — remove the union member, two computeds, spec case.
- B1.4d `MLayoutAside position left/right` — narrow to `'start' | 'end'`.
- B1.4e `MLayoutItem area` and siblings — remove them all; fix the doc line.
- B1.6a `$material-kit-*` not forwarded — `@forward "~material-kit-config"` in `forward.scss`, or fix the comment.
- B1.6b Function `additionalData` dropped — wrap it: `(src, file) => prelude + await previous(src, file)`.
- B1.6c 7 loud comments per sheet — turn into `//`.
- B1.6d `bp-tablet` = `min-width: 1199px` — point at `tablet-xs`/`desktop-xs` (what `useBreakpoint` and the layout use) or delete; update layout.md.
- B1.7a Hotkey internals auto-imported — move internals to `R/utils/hotkey/*` (0.6.0 `useButton` precedent); keep `useHotkey`, `provideHotkeyLabels`.
- B2.4a Undeclared key / invalid custom HEX renders no tokens — fall back to the default palette when the key is undeclared or `customColor` is null; validate in `setCustomColor`.
- B2.4b Invalid `themes[].color` not validated at build — `findInvalidSeed` with `HEX_SEED_PATTERN`, throw in `setup`.
- B2.4c `_m3-fallback` lacks semantic roles and `scrim` — add `scrim` + semantic tokens (from `DEFAULT_SEMANTIC_COLORS`) to both files.
- B2.5a `setColorFromImage` cross-origin — try/catch -> `null`; document the CORS need.
- B3.4a Pinned zone is `fixed` without its size-token height — emit `min-block-size: var(--m3-layout-<id>-size)` for every sized fixed zone.
- B3.4c `m-layout-item` without `kind` becomes a 2nd main — require `kind` (type) + dev `console.warn` when missing; no default.
- B3.4d `insets.left/right` hold start/end — rename to `inline-start/inline-end` (`--m3-layout-inset-inline-*`, `insets.start/end`), no alias.
- B3.5b `m-layout-item kind="main"` lacks `min-height: 0`/overflow — `m-layout-item--main` class with the same minima (and the scroll modifier).
- B3.6a `MAppBar sticky` only affects registration — `ui-app-bar--sticky` modifier bound to `props.sticky`.
- B13.2d Hairline sweep — mechanical sweep to `max(1px, 1rem)` (decided, `decisions.md:99`).
- B13.3c `useVirtualScroll` own reduced-motion copy — build `useReducedMotion` on `prefersReducedMotion()` (low priority).
- B13.3d `useClickOutside` on a closed FAB menu — `watch(isOpen, open => open ? outside.resume() : outside.pause(), { immediate: true })`.
- N.5 `m-snackbar` under `m-layout` -> "Unregistered element <span>" — gate the `teleport` with a `useMounted()` `v-if` instead of a root `<client-only>` (comment node, no span); same for `MMenu`.
- N.8 `m-layout-main full-height` not focusable — expose `fullHeight` in the layout zone context; `tabindex="0"` + focus-visible ring only under the same `m-layout-main--scroll` modifier as B3.1 (page-scroll main must not be a tab stop).
- N.11a `process` untyped (TS2591) — `import.meta.dev`.
- N.11b TS2352 on the runtime-config cast — `as unknown as ...`.
- B4.1b MMenu `role=menu` unnamed, attrs on wrapper — `aria-*`/`id` → `.ui-menu__surface`, `class`/`style` → wrapper; name = `aria-labelledby` trigger id / consumer `aria-label`, dev warning if none.
- B4.1d MMenu disabled items aren't `menuitem` — give every item `role=menuitem`; disabled → `aria-disabled`, kept in arrow order, click swallowed.
- B4.1g MMenu 200/250 ms literals ignore reduced motion — `--sys-motion-*` tokens (collapse in `base/_animations.scss:44`); reduced → fade, no scale.
- B4.1h MMenu Escape focuses trigger's `parentElement`; pick returns nowhere — drop `getTriggerEl`; `focusTrap.rememberFocus()` before open, return there.
- B4.4a MDialog height: no max-height, `overflow:hidden` — `max-height: calc(100dvh - 2*margin)`, `.ui-dialog__content { overflow-y:auto; min-height:0 }`, headline/actions pinned.
- B4.4b MSheet height: same — token `max.height`, `.ui-sheet__content` scrolls; pairs with B4.5f.
- B4.5b MDialog `autofocus` fails — with B4.6, MOverlay/MDialog focuses `[autofocus]` after the trap activates.
- B4.5c MDialog headline always centred — M3 centres only with an icon: drop `text-align` from `&__headline`, keep the `__icon + __headline` rule.
- B4.5d MSheet has no name — `ariaLabel`/`title` prop + dev warning, no English default.
- B4.6 `useFocusTrap` focuses first focusable by default — default `initialFocus` = target (`tabindex=-1`); MOverlay passes `() => root.value`; content owns autofocus.
- B4.7b MTooltip opens on click focus — show on focus only if target `:focus-visible`.
- B4.7c MTooltip 150 ms literal — `--sys-motion-duration-short-2`; reduced motion → fade, no scale.
- B4.8 MOverlay activator `aria-haspopup` — `dialog` (or omit) for popover mode + `aria-controls`.
- B4.9a MSnackbar `surface`, not inverse — `inverse-surface`/`inverse-on-surface`/`inverse-primary`, corner 4 (plan snackbar step 1).
- B4.9b MSnackbar live region mounts with the text — persistent `role=status` in the overlay host, snackbar swaps its text (plan step 5).
- B5.2a Rail: hover on active pill → pressed opacity — keep active indicator opaque; hover/pressed as a separate `::before` layer (plan ST-03).
- B5.3a Bar: active by colour only — indicator pill 64×32 `secondary-container` (plan bar step 2).
- B5.4a Drawer content doesn't scroll — `__content { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain }`.
- B5.5a MTabs tablist can't be named — `ariaLabel`/`ariaLabelledby` on the tablist + dev warning.
- B5.5b MTabs panels no `id`, `aria-controls` always set — `:id="panelId(selected)"`, `aria-labelledby`, `tabindex=0`.
- B5.5c MTabs preset non-first `v-model`: SSR first paint wrong — same as N.1a.
- B5.6a MToolbar icon+label renders only icon — render icon (`prepend`) + label in `MButton` (plan A11-02).
- B5.6b MToolbar no `aria-pressed` — `aria-pressed` on toggle items (single mode too).
- B5.6c MToolbar no role/name — `role=toolbar`, `aria-orientation`, `ariaLabel` prop + dev warning.
- B5.7b MPagination camelCase slot props → `arialabel` in SSR — keys `'aria-label'`, `'aria-current'`.
- B5.7c MPagination English labels — remove English defaults; `pageLabel(page, current)` prop; dev warning (plan CT-13).
- B5.9a RTL arrows: tabs, bar — swap Left/Right by computed `direction` at key time.
- B5.9b RTL slider — flip percent/pointer maths/arrows in RTL (as `fragments/color-picker/Canvas.vue:65-138`).
- B5.9c RTL linear progress — `:dir(rtl) { transform: scaleX(-1) }` on the track.
- B5.9d RTL switch — `inset-inline-start`; flip translate sign under `:dir(rtl)`.
- N.1a Preset non-first `v-model` not applied (first stays highlighted) — wrap `register` in MTabs: the ticket equal to `modelValue` is selected at once (SSR-safe, before `'force'` falls back); add a non-first preset spec.
- B6.1b Switch has no error look — `ui-switch--error` modifier + error track/outline tokens in the switch map, as checkbox.
- B6.1c User `id` replaced; `name` without `path` dropped — `id = attrs.id ?? useId()`; declare a `name` prop (as radio), bind `name ?? path`.
- B6.1d Default slot renders only with `label` — `v-if="label || $slots.default"`.
- B6.3a `#hint` vanishes on the first keystroke — drop the `queryReady` term in `onInput` (`canOpen()` already knows the `hint` slot).
- B6.3b First remote keystroke may not open the panel — decide in a post-flush tick, or reopen when `canOpen()` turns true while focused and query ready.
- B6.3c `noResults` never shows with `:filter="false"` — pass «query typed and ready» into `panelState`: rows=0 + query → `no-results`, `empty` only without a query.
- B6.4a Static `unit` not announced — put the unit label into `aria-valuetext` (or an id'd span in `aria-describedby`).
- B6.4d `MNumberInputUnit` public by accident — move to `components/fragments/number-input/Unit.vue` (fragments are not registered), import explicitly.
- B6.10a `textarea` is single-line — render `MTextarea` for `textarea`.
- B6.10b `search` lacks `type` — `:type="field.type === 'search' ? 'search' : undefined"`.
- B6.10c "Submit" is English — `submitLabel` prop with no default (+ dev-warning when the default button is used without it).
- B6.10e Optional `number` can't be empty — `yup.number().nullable()` for non-required numbers (`required()` still rejects `null`).
- B6.10g Radios get no shared `name` — `:name="field.name"` on each radio, or `MRadioGroup`.
- B7.1a `MTimePicker` shows `errorMessage` only with `error` — accept `errorMessage` alone (in `hasError`/`supportShown`), as date picker does.
- B7.1d Time hours/minutes radiogroup unnamed — `aria-labelledby` = headline id, else `aria-label` = `ariaLabel`.
- B7.1f `selectYear` doesn't clamp to min/max — clamp the month into `[bounds.min, bounds.max]` months.
- B7.2a Popover format change rewrites `v-model` without `change` — `commit('format')` after `setFormat` rewrites the model.
- B7.2b `auto` starts as hex — init from `detectFamily(model.value) ?? 'hex'`.
- B7.2c Every blur commits (unchanged too) — commit only when `draft !== displayValue`.
- B7.2d `:picker=false` leaves a live button — render an aria-hidden swatch `<span>` when `!picker`.
- B7.2e Hex keeps alpha — with a no-alpha format, keep `a = 1`.
- B7.3a `MFileInput` clear drops focus to `body` — focus the field input in `clear()`.
- B7.3d `queue` (and `upload`) read once — `upload: (f, ctx) => props.upload?.(f, ctx)`; document `queue` as setup-time.
- B7.3f `start(id)` keeps old `error`/`progress` — clear both in `start(id)` (or delegate to `retry`).
- B8.1 Selected text icon toggle without `color` — `&--current` skips selected: `&.ui-button--text:not(.ui-button--selected)` (outlined has its own 3-class selected rule); the comment at `_schemes.scss:69-74` states that intent.
- B8.2a Compact FAB / extended FAB (40) get no 48 target — drop `overflow: hidden` on the FAB roots (the ripple container clips itself; the extended label clips, `extended-fab/index.vue:111`) and reuse the button's `::after` target rule.
- B8.3a No name warning for icon-only group items / segmented — dev `watchEffect` in `useSegmentedButton` for icon-only items without `ariaLabel`; group-name warning in segmented.
- B8.3b `selected` on `tag="link"` still emits — `toggle()` returns early for links.
- B8.4a `v-ripple` never ripples on Space — default `['Enter', ' ']`; map a passed `'Space'` to `' '`.
- B8.4b `v-click-outside` keeps the mount-time handler — add `updated(el, binding)` that rebuilds `el._clickOutside`.
- B8.5 English default names — as `decisions.md:36-37` (MLoading, dropdown): no default, dev warning when unnamed (progress, rating, dialog, close), a rating value-text prop. A lone landmark (rail, bar, drawer) needs no name. Global phrases stay deferred (B13.3).
- B8.6a Close slot `ariaLabel` renders `arialabel` in SSR — key `'aria-label'` in both bags and types, no alias.
- B8.7b No value and no `dot` = empty circle — render nothing (root `v-if`) with no value, slot or `dot`; let the slot render without `value`.
- B8.7c `MBadge` vanishes in forced colours — `@include forced-colors { border: 1px solid CanvasText }` in `&--large`.
- B8.8b `MProgress` ignores reduced motion — same recipe as MLoading: slow indeterminate loops ×2, value transitions `none`.
- B8.8c `MProgress` ignores RTL — mirror the linear root under `:dir(rtl)` (`scaleX(-1)`) with a `[dir=rtl]` fallback; circular stays.
- B8.9a Selected chip text/container mismatch — `on-secondary-container` (M3 filter chip).
- B8.9b Pressed chip shifts 1rem (deferred) — remove the transform; the 12% layer is already the pressed cue.
- B8.9c `MChipGroup` arrows follow mount order — sort `focusable()` by `compareDocumentPosition` of the element at use time.
- B8.9d `MChipGroup` loses focus on unmount — in that cleanup, if the view's element is `document.activeElement`, focus the DOM neighbour first.
- B8.10a `MRating` "double star" — put both glyphs in one icon-sized box and clip the fill to `fill*100%` of that box.
- B8.10b `MRating` `touch-action: none` blocks scroll — `touch-action: pan-y` (or `manipulation`).
- B8.10c `MSelectionGroup` `selectAll` ignores `max` — `selectAll` loops the enabled tickets through `selectById` until the limit.
- B9.3 `MTimelineItem` filled/outlined: no padding, `none` corner — for `variant != plain` add inline padding and a corner (e.g. medium) via a BEM modifier; the first-line offsets (`timeline/_index.scss:25-33`) derive from the block padding and must follow.
- B9.4 Hairlines still `1rem` — map-local `$hairline: max(1px, 1rem)` (`decisions.md:98`).
- B9.7a `MLazy once=false` never unmounts without `v-model:active` — add an unbound component spec (`once:false`, leave viewport → content unmounts); if it fails, add hysteresis or require `minHeight`.
- B9.7e `useConfirmEditTransaction.draft` is shallow — `ref(clone(...))` for `draft` (keep `committed` shallow).
- N.2 `m-progress circular expressive` hydration mismatch — round to 3 decimals before building `d`.
- N.3 `m-chip-group :wrap="false"` shrinks chips — `flex-shrink: 0` on `.ui-chip` (no parent-class selector, so prod CSS order is safe).
- N.4 `m-button-segmented` breaks labels mid-word — `overflow-wrap: normal` on `.ui-segmented-button`; check chips and tabs for the same.
- N.6 `m-progress expressive linear`: wave path wider than the element — one tileable period (`<pattern>`/CSS mask) at `width: 100%`; clip the active wave with `clip-path: inset(0 calc(100% - v%) 0 0)` instead of `scaleX`; `overflow: hidden` on `.ui-progress__wave`.

## Приложение B. Пробелы-фичи (22)

- B2.3b Semantic colours ignore contrast — contrast-aware tones per semantic seed (feature work).
- B3.6b No landmark / heading — `headingLevel` on `MAppBar`/`MAppBarTitle`, no default (MCard precedent) rendering `h{n}`.
- B13.2a `plain` -> `MVariant` — decided (`decisions.md:96`): add to `MVariant`, `MSurfaceVariant = Extract<MVariant, ...>`. Typing only.
- B13.2b `MBannerVariant` `surface` — decided (`decisions.md:97`); after B13.2a rename to `plain`, narrow with `Extract<>`; no alias.
- B13.3b Phrases via `materialKit` config — `materialKit.messages` merged into `MESSAGES` (owner defines scope vs "no English default copy").
- B4.1f MMenu no typeahead — reuse `composables/dropdown/useTypeahead.ts`.
- B4.2a Clamping: dropdown/autocomplete/search panels — clamp `max-block-size` to free space − margin (native `position-try-order: most-height` + JS fallback), as plan menu step 2.
- B4.2b Clamping: MMenu surface, tooltip — same clamp in `usePopover`; the menu group scrolls (`overflow-y:auto`).
- B4.9c MSnackbar no queue — `useNuxtApp().$material.snackbar.show({label, action, duration}) → Promise`, one at a time; `<MSnackbar v-model>` stays.
- B5.1a Rail/bar items are buttons, not links — optional `to` → `NuxtLink` + `aria-current` (plans A11-01).
- B5.1b Pressing the active item emits nothing — `emit('select', id, event)` on each activation.
- B5.4c Drawer doesn't forward `#activator` — forward MOverlay `#activator` (+ `aria-controls`).
- B5.6d MToolbar no keyboard — APG roving via the shared controller.
- B5.7d MPagination no compact mode — `layout: 'pages' | 'compact'` (plan UX, recommended).
- B5.8a MBreadcrumbs no click API — per-item `onClick`/`href`, or the `item` slot (`index.vue:22-30`).
- B6.1f No indeterminate — `indeterminate` prop → `input.indeterminate`, dash glyph, `aria-checked="mixed"` (M3 has the state).
- B6.2c Generic `TItem` from the model, not `items` — type the SFC props through the existing `MDropdownProps<TItem,TValue>` (`props.ts:120`).
- B6.10f No `onError` — `onError` from the adapter's failed submit.
- B7.3c `required` not exposed — error props (+ optional `path`), `aria-required`/`validate()` for the group.
- N.9 `m-slider`: no value formatter, `ariaValuetext` not forwarded — `formatValue(value, index)` prop feeding thumb label and `ariaValuetext`; forward `#value`; drop the English fallback (dev-warning instead).
- B9.2b `MTable` has no mixed select-all — add `indeterminate` (`aria-checked="mixed"`) to `MCheckbox`, then pass `isMixed` to the header.
- B9.5b Dash-form `g()` still in banner and 24 more SFCs — mechanical `-`→`.` per component.

## Приложение C. Документация и упаковка (24)

- B1.1 Version / published types — bump to 0.6.0 and republish (owner's release step).
- B1.2a `sass` undeclared — peerDependency `sass` (needs owner OK, "no new deps") or one README line.
- B1.2b `nuxt` peer vs claims — one floor everywhere.
- B1.2d `vee-validate`/`yup` optional peers — README Validation: "install `vee-validate` and `yup` yourself".
- B1.3a Overlay renames / `openModal` / VFM removal undocumented — Breaking block in the 0.6.0 changelog (docs_v2 repo).
- B1.3b Fields forward attrs to the native control — one changelog line + a sentence in `docs/system/en-US/behavior.md`.
- B1.7b Stale props fail silently — none in code (owner rule: no legacy errors); both are in 0.6.0 Breaking.
- B3.4b Size copied onto `html` — document "pinned-zone size tokens must live on `:root` or be literals".
- B3.6c Under main it adds to main's zone — document "put `MAppBar` in `m-layout-header`"; optional dev warn.
- B10.1 Mechanism — keep rule A10 (compound selector).
- B10.3a `.ui-checkbox` `color` single class — consumers use a compound selector (A10).
- B10.4 Workaround / scanner — optionally commit it under `shell/` as a script.
- B13.3a Deferred items in B3-B9 — none.
- B4.5e MSheet drag handle unfocusable — decorative `aria-hidden`; document Esc as keyboard dismissal.
- B6.2b Without `messages` clear/toggle are nameless — keep (no English copy); document «pass `messages.clear`/`toggle`».
- B6.5b MSearch Enter: no `preventDefault`, submits when empty — document «`submit` also fires for an empty query; guard in the handler».
- B6.5c MSearch clear button nameless without `clear-label` — none; pass `:messages="{ clear }"`.
- B6.7 Chip-row field asks ~60rem in auto-width contexts — none; size from the container.
- B6.8 Support line not reserved by default; composites' own errors shift layout — none; bind `error`/`errorMessage` (even empty) or `path`.
- B7.3e Remount restarts `auto-start` (shared `queue`?) — document «keep `v-model` next to `:queue`».
- B9.7d `MIcon` loads client-side (shift, deferred) — document `icon.serverBundle`/`clientBundle` for first-paint glyphs.

## Приложение D. Уже починено (10)

- B1.5 `<core-scope>` vs `<MApp>` — fixed — `docs/architecture.md:176-189`, README:120 describe it; `core-scope` already holds the modal container (`R/components/core/scope.vue`), so `useModal` works. Residual: `architecture.md:193-196` still says "detached effect scope"; it is the `material` plugin now.
- B10.2 Fixed set — fixed — all compound selectors: `file-upload/_parts.scss:165`, `color-picker/index.vue:268`, `fragments/dropdown/Panel.vue:181,190`, `alert/index.vue:149`, `banner/index.vue:131,244`, `fragments/breadcrumbs/item/index.vue:79`, `otp-input/index.vue:319`.
- B10.3b `MSearch` clear colour rule dead — fixed — in the working tree the rule is gone: `.ui-search__clear` is only `flex: 0 0 auto` (`R/components/ui/search/index.vue:308-310`; HEAD had `color: icon.color`). The icon inherits the bar colour.
- B4.1i MMenu no `lockScroll` — fixed — `components/ui/menu/props.ts:13`, `menu/index.vue:226-236`
- B6.5a MSearch `v-model:focused=true` doesn't focus — fixed — model removed in search v2 (`components/ui/search/index.vue:159-160` only `modelValue`/`open`); `focus()` exposed (`:252`)
- B9.2c Scroll region unnamed with `aria-labelledby` — fixed — `composables/table/useTableControl.ts:80` falls back to `labelledBy` (no spec).
- B9.2d `TableData` rejects interfaces — fixed — `components/ui/table/types.ts:40-46` (`id` only); `tests/helpers.ts:6` uses an `interface Row`.
- B9.5a Dash-form `g()` in system-bar, surface, lazy (dead rules) — fixed — none of the three has a dash-form `g()` left; `lint:scss` shows no unresolved path (no rule resolves to `null`).
- B9.7b `MApp` `rootElement` = `null` — fixed — `app/index.vue:61-63`, spec `app/index.spec.ts:66-76` (be02c6a). Nit: `MAppExposed` (`app/props.ts:15`) types it `ShallowRef`, the instance unwraps it.
- B9.7c `MShape` SVG not `aria-hidden` — fixed — `shape/index.vue:6-8` (`role="img"` when named, else `aria-hidden="true"`).
