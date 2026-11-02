# Showcase — сводный отчёт (2026-10-20)

Вопрос владельца: можно ли уже сейчас строить на ките Vuance UI красивые адаптивные приложения, насколько это
удобно и каких кирпичиков не хватает. Ответ собран из 5 приложений в `D:\dev\primetime\ui\showcase\apps\*`
(подробности — `FINDINGS.md` каждого), кит был read-only, визуальная проверка — Haiku-QA (Playwright, 393 / 768 /
1024 / 1280 / 1920, light + dark).

## 1. Вердикт

**Да, можно — и быстро, пока экран укладывается в словарь кита.** Простое приложение («умный дом») собрано за
~40 минут без единого своего компонента и со 123 строками своего SCSS; один HEX-сид дал цельную палитру light/dark.
Сложные приложения получились «на 4 из 5» по виду (почта выглядит как Gmail на M3), но удобство — 3 из 5: каждое
упёрлось в 3–8 недостающих кирпичиков и в 5–10 мест, где пришлось лезть во внутренние `.ui-*` классы.
Главное, чего не хватает, — не экзотика, а **составные паттерны**: строка/карточка с вторичными действиями,
статичный тег, empty state, очередь снекбаров, ширина/full-screen у диалога, панель результатов поиска.

| Приложение | Экранов | Удобство | Красота | Своих компонентов | Объём / своего SCSS | QA (финал) |
|---|---|---|---|---|---|---|
| home «Умный дом» (простое) | 1 + детали | 4/5 | 3.5/5 | 0 | ~0.7k строк / 123 | home-2 OK |
| mail «Inbox» | 6 | 3/5 | 4/5 | 3 (~290 строк) | ~4.5k / ~800 | mail-2 OK |
| store «Atelier» | 6 | 3/5 | 4/5 | 8 (~1.2k строк) | ~6.4k / ~2.2k | store-2 OK |
| tasks «Planner» | 5 | 3/5 | 4/5 | 7 (канбан ~600, календарь ~330) | ~3.6k / ~1.3k | tasks-2 NOT OK¹ |
| finance «Ledger» | 3 | 4/5 | 4/5 | 5 (StatTile, график, DateRange, деньги, мобильный список) | ~2.4k / ~900 | finance-2 OK² |

¹ остался баг кита `m-tabs` (активный таб на прямом заходе) + фикс таблицы участников не перепроверен.
² открыто: редактор бюджетов на /transfer не показывает перерасход; ряд чипов на 768 упирается в край (внутренний скролл).

QA-статистика: 10 заявок (≤ 2 на приложение) — 5 OK (с замечаниями у части), 4 NOT OK, все исправлены к финальным
заявкам, кроме tasks. Своего кода по пяти приложениям ~18.6k строк (vue/ts/scss), своих компонентов-кирпичиков 23.

## 2. Недостающие кирпичики (по числу приложений, которые в них упёрлись)

| Кирпичик | Где понадобился | Как обошли |
|---|---|---|
| **Строка списка / карточка со вторичными действиями** (ссылка + чекбокс/звезда/меню; M3 list item с trailing action) | mail, tasks, store | stretched `::after` у ссылки + свой hover-слой + `z-index`; `m-card tag="link"` запрещает кнопки, у карточки товара нет «В корзину» |
| **Статичный тег / метка** (не `<button>`, не live region) | mail, tasks, store, home | свой `span` + `color-mix` (LabelTag ×2, «New/Sale», «Live») |
| **Empty state** | mail, store, tasks | свой компонент (MailEmptyState, EmptyState) или `m-icon` + текст |
| **Очередь/сервис снекбаров** (таймер, замена, отступ от bottom bar/FAB) | mail, store, tasks | `useState` + `useTimer` + один `m-snackbar` в `app.vue` (useMailToast, useToast) |
| **Ширина и full-screen у dialog/sheet; side sheet** | mail, store, tasks | `content-class` + перекрытие `.ui-dialog`/`.ui-sheet`; корзина = `m-navigation-drawer side="right"`; свой `max-height`+скролл |
| **Панель результатов поиска** | mail | `m-search` + `m-menu absolute match-width` с `role=listbox` + `m-list` |
| **Carousel/gallery, image-плейсхолдер/скелетон** | store | scroll-snap галерея, SVG-плейсхолдер |
| **Stepper** | store | свой CheckoutStepper (`m-progress` на phone) |
| **Price/money** (валюта, старая цена, скидка) | store, finance | `Intl.NumberFormat` в своём компоненте |
| **Маркетинговые блоки**: section heading / hero, footer | store | SectionHeading, SiteFooter |
| **Rating summary** (средняя + распределение) | store | `m-rating readonly` + `m-progress` |
| **Kanban / DnD-список** | tasks | ~600 строк поверх `useDrag` (хит-тест, автоскролл, клик после драга, touch-хэндл, «Move to…» с клавиатуры) |
| **Календарь-месяц** | tasks | `createCalendar` + `useDateGridControl` (escape hatch сработал отлично) |
| **Avatar group «+N»** | tasks | `m-avatar` + перекрытие |
| **Contextual action bar** (массовые действия) | tasks, mail | свой BulkBar / `m-toolbar` вручную с `role=toolbar` |
| **Charts, KPI/stat tile, date range field, карточный режим таблицы на phone** | finance (+tasks для таблицы) | свои StatTile, CashflowChart (SVG), DateRangeField, список по дням вместо таблицы |
| Мелочи: `MMenuItem`, бейдж, прикреплённый к якорю, trailing-контрол в шапке `m-card`, FAB-слот в rail | tasks, store, home, mail | сырой `ui-menu__item`, обёртки `position: relative`, свой `#header` |

## 3. Трение API (повторялось в нескольких приложениях)

- **Публичные типы неполны**: `MIconName`, `MNavigationBarItem/RailItem`, `DropdownItemBase`, `MBreadcrumbItem`,
  `MSegmentedItem` — только deep import из исходников (в опубликованном пакете так нельзя); `MIconName`-литерал
  расширяется до `string` в данных → TS2322 в каждом массиве `items` с иконками.
- **`m-autocomplete`/`m-dropdown #item`** типизирован по модели, а не по `items`; `leading`-зона строки недоступна
  (аватар — инлайном); панель = ширина поля, в узком поле строки рвутся по слогам.
- **Валидация (`useFormSchema`)**: обязательный чекбокс пропускает `false`, нет `setValues`, свои сообщения только у
  `required`, `submit` типизирован как `void | Promise`.
- **Перекрытие внутренних `.ui-*`** нужно регулярно (mail — 8 мест): ширина диалога, фон rail на тоне aside, отступ
  снекбара, `m-layout-main` overflow для sticky.
- **Слоты, которых не хватает**: поиск/ссылки в `m-app-bar`, «после supporting» в `m-list-item`, trailing в шапке
  `m-card`, FAB в rail; `m-checkbox`/`m-radio` — default-слот только вместе с `label`.
- **Двойные модалки на одно поле**: дата = `m-text-field` + `m-dialog-date`, время = `m-dialog` + `m-time-picker`.
- **Тема**: `variant: 'expressive'` у тёплого сида дал голубые secondary/tertiary — ловушка, вернулись к `tonalSpot`;
  `m-app-bar` не выравнивается по `m-container`.

## 4. Новые баги кита (найдены экспериментом; кит не правили)

| Компонент | Что | Где в исходниках | Обход в приложении |
|---|---|---|---|
| `m-tabs` | при монтировании `mandatory: 'force'` эмитит `update:modelValue` первого таба (навигация по нему уводит с прямого URL) **и** не применяет не-первый `v-model`: выбраны оба, подсвечен первый | `composables/registry/createSelection.ts` `apply()` → `unselect(last)` молча выходит при `mandatory` | `to` на табах без обработчика; подсветку не обойти |
| `m-progress type="circular" expressive` | hydration mismatch на каждой загрузке: `d` волны из `Math.sin/cos` без округления, сервер ≠ браузер | `composables/progress/useProgress.ts` `circularPath` | `<client-only>` |
| `m-chip-group :wrap="false"` | чипы сжимаются и переносят подписи вместо горизонтального скролла | `components/ui/chip-group/index.vue` (`--scroll` без `flex-shrink: 0`) | `.ui-chip { flex: none }` |
| `m-button-segmented` | в узком контейнере подписи рвутся посреди слова («Hea/t») | — | icon-only сегменты |
| `m-snackbar` под `m-layout` | `[m-layout] Unregistered element <span>`: placeholder `<client-only>` на первом уровне | `snackbar/index.vue` + `layout/index.vue` 47–57 | снекбар в `app.vue` |
| `m-progress expressive linear` | путь волны фиксированной ширины 1000 выходит за элемент (right ≈ 1074px при окне 393) | `progress/linear` | — |
| `m-dialog-date` | при `null`-модели отдаёт `Date`, а не `YYYY-MM-DD` | — | нормализация в `@update:date` |
| `m-layout-main` `full-height` | скролл-регион не фокусируется — клавиатура не скроллит main (axe `scrollable-region-focusable`) | `components/ui/layout/main.vue` | `tabindex="0"` на main |
| `m-slider` | нет форматтера значения: `showValue` показывает «350», не «$350»; `ariaValuetext` есть в `useSliderControl`, но `MSlider` его не пробрасывает | `components/ui/slider` | свой `<output>` |
| `m-autocomplete`/`m-dropdown` | панель = ширина поля (`match-width`), в узком поле строки рвутся по слогам и налезают | — | одноколоночная раскладка полей |
| typecheck приложений | `ui/app/index.vue(49)` `process` (TS2591, нет node-типов); `utils/theme/createMaterialTheme.ts(23)` TS2352 при разнородных темах (часть с `variant`) | — | игнор |
| **HEAD** | мерж `64fb4dc` сломал `useShapeMorph.ts` (не парсился) — починено владельцем в рабочем дереве 04:16, не закоммичено | `.cursor/summary/merge-wave-1-fix_2026-10-20.md` | — |

Подтверждены (уже были в §13 kit-context): `m-layout-main` ломает sticky и `position: fixed` (FAB); dialog/sheet/drawer
не скроллят контент; `m-dialog` не эмитит `confirm/cancel`; снекбар без очереди и поверх bottom bar; rail/bar — кнопки,
не ссылки; нет indeterminate у чекбокса; small app bar + search = 72 vs 64.

## 5. Адаптив

- **Оболочка — сильная сторона.** `m-layout` + зоны собирают shell за ~40 строк. Лучший рецепт эксперимента (mail):
  размер зоны из CSS-переменной (`size-token="--mail-bottom-nav-height"` = 80rem на phone / 0 выше) +
  `@container main-content` для list-detail → оболочка верна на всех 5 ширинах **без JS-брейкпоинтов** и без
  гидрационного flip. Стоит описать в доках как канонический приём.
- `m-container`/`m-col` закрыли сетки 1/2/3/4 колонки без media-query (home, store).
- **Телефон (vw-масштаб, 1rem = W/767 ≈ 0.51px на 393)**: всё читаемо, но тексты 12–14rem = 6–7 CSS px — для почты и
  таблиц мелко (агенты приняли как фичу кита, не обходили). `m-table` на телефоне — ячейки рвутся по буквам; нужен
  карточный режим или свой список (finance сделал второе).
- **768 (1rem = 1px, canvas уже, чем 1199)**: таблицам и двухколоночным формам тесно; «планшетных» колонок нет.
- На /project (tasks) кадры QA на 393 расходились — похоже на гидрационный flip `v-if` по брейкпоинту; это довод делать раскладку CSS.

## 6. Что работает отлично (не трогать)

- Тема из одного HEX-сида; `typography.typeface` меняет характер витрины одной строкой (Fraunces + Inter в store).
- `m-layout` (зоны, sticky, full-height, end-aside для панели задачи), `m-container`/`m-col`.
- `m-table` (серверная модель, `#cell-<key>`, выбор через страницы), `m-chip-group`, `m-otp-input`, `m-dialog-date`,
  `m-number-input`, `m-rating`, `m-timeline`, `m-breadcrumbs`, `m-pagination`, `m-alert`/`m-banner`, medium `m-app-bar`.
- `useModal` + обёртка → `await confirm(...)`; `useHotkey` + `m-hotkey` (подсказка = реальное сочетание, глохнет при модалке);
  `useControlAttrs` (id/aria на нативный контрол); escape hatches `useDateGridControl`/`createCalendar`.
- Прелюдия SCSS (`typescale`, `spacing`, `media-*`, `focus-ring`, `state-opacity`): свои компоненты выглядят родными.

## 7. Что предлагаю дальше (решать тебе)

1. Баги из §4 — особенно `m-tabs` (ломает route-driven вкладки) и hydration `m-progress expressive`.
2. Кирпичики первой очереди (упёрлись ≥3 приложения): list item / card с вторичными действиями, static tag,
   empty state, snackbar-сервис на `$material` (очередь + таймер + отступы от зон), ширина/full-screen у dialog/sheet.
3. Публичные типы в `./types` (иконки, items навигации/dropdown/breadcrumbs/segmented).
4. Рецепт «shell без JS-брейкпоинтов» (size-token из CSS-переменной + container query) — в docs_v3.
5. Витринный набор (carousel, stepper, price, image/skeleton, footer) и данные (kanban, month calendar, charts) —
   вторая очередь, по решению.

## 8. Как посмотреть самому

Из `D:\dev\primetime\ui\showcase`: `npm run dev:mail` (3301), `dev:store` (3302), `dev:tasks` (3303),
`dev:finance` (3304), `dev:home` (3305). Скриншоты QA — `showcase\.qa\shots\<заявка>\`, ответы QA — `showcase\.qa\res\`.
