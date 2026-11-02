# Foundation — аудит планов

Итог: сделано 61 · частично 11 · нет 5 · регресс 0 · отменено 11 (по пунктам).

Планы: layout, app, system-bar, icon, shape, surface, hotkey, use-hotkey, lazy, virtual-scroll.
Пробы — `playground/probes/plans-audit-2/foundation/*.probe.ts`, окно 1280×800, если не указано иное;
вырезы экрана эмулированы CDP `Emulation.setSafeAreaInsetsOverride` (так делает и `layout.e2e.ts`), поэтому
`env(safe-area-inset-*)` проверен геометрией, а не только правилами CSS.

## foundation/layout.md — тег `planned` → факт `частично` (тег неверен: шаги 1–6, 8, 10 сделаны, нет только панелей)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | токены сетки на `spacing()`, `max-width` и `pane.fixed.width` ключами карты (План работ) | сделано | `assets/stylesheet/components/grid/_index.scss:28-46` | S |
| Ш2 | safe-area: прибитые зоны, боковые зоны, `m-container` (План работ; G3 «Safe-area боковых зон») | сделано | `utils/layout/carve.ts:194-199`, `utils/layout/css.ts:85-124`, `container/index.vue:94-95`; проба `layout.probe.ts › side zones … (ltr/rtl)` — 1366×600, вырезы L47/R31: ltr aside-start `border-left` 47, rtl `border-right` 31, ширина aside минус вырез = 199.99rem, шапка во всю ширину L47/R31, `--m3-layout-safe-inline-start` на `html` = 47 / 31; `› portrait top cutout` — шапка 79.5px = 64rem + 47, app bar с y=47, `--m3-layout-inset-top` = высоте шапки | S |
| Ш3 | `scrollbar-gutter: stable` у main в `full-height` (План работ) | сделано | `layout/main.vue:42`; проба `› full-height main` — `overflow-y: auto`, `stable`, `tabindex=0` (и в серверном HTML без JS) | S |
| Ш4 | `m-responsive` не режет кольцо фокуса (План работ) | сделано | `responsive/index.vue:34-35`; проба `› m-responsive` — `overflow: clip`, `overflow-clip-margin` 4.99rem | S |
| Ш5 | деприкация `<m-main>` (План работ) | сделано (сверх: удалён без алиаса) | папки `components/ui/main` нет; `decisions-G3.md:19`, `docs/layout.md:110` | S |
| Ш6 | таблица «класс окна → навигация → зоны», рецепт на `useBreakpoint().is` (План работ) | сделано | `docs/layout.md:351-437` | M |
| Ш7 | панели `m-layout-pane`, `useListDetail`, ручка (План работ) | нет | отложено владельцем 2026-10-07 «отдельная задача после шагов 1–6» (`layout.md:211`); `pane.fixed.width` объявлен, но не используется | L |
| Ш8 | алиасы классов окна (План работ; G3 «Шаг 8», `WindowClassFlags`) | сделано | `utils/viewport/windowClass.ts:15-34`, `createBreakpoints.ts:34`; проба `› window class aliases` (фикстура `audit-layout/window-class`): 360/600/767 — compact, 768/840/1199 — medium = expanded, 1200/1600/1919 — large, 1920 — extraLarge, как в `decisions.md:179` | S |
| Ш9 | переход сетки на пружину (План работ) | отменён | S4, `decisions.md:24` | — |
| Ш10 | `container` у `m-container` (План работ; G3 «Шаг 10») | сделано | `container/index.vue:5-15,54,175`, `col/index.vue:44,111`; проба `› container mode` — `container-type: inline-size`, имя `m-container`, 4 трека в узкой панели против 12 у оконной сетки, у `m-col` класс `m-col--cq-desktop-xs-span-6`; без JS тоже 4 трека (`› container grid … server HTML`) | M |
| Г1 | литералов в `grid/_index.scss` нет, `lint:scss` проходит (Готово, когда) | сделано (код) | 1200/1600/360 — значения ключей карты, как велит Ш1; `lint:scss` не запускался — не проверено | S |
| Г2 | в landscape с вырезом контент и зоны не уходят под вырез (Готово, когда) | сделано | см. Ш2 | — |
| Г3 | `<m-main>` предупреждает в dev (Готово, когда) | отменён | удалён без шима: `decisions-G3.md:19`, правило «без шимов до стабильной» | — |
| Г4 | таблица соответствия классов M3 и зон кита в доках (Готово, когда) | сделано | `docs/layout.md:357-363` | — |
| Q20 | инсеты layout на `html` (прогон 2) | сделано | `utils/layout/css.ts:135-154`; проба `› Q20` — на `html` top 64rem, inline-start 200rem, inline-end 240rem, `scroll-padding-top` 64rem; с вырезами inline-start = 200rem + вырез (266rem ltr / 243.6rem rtl) | S |
| — | первый кадр SSR без JS (правило кита) | сделано | проба `› layout/matrix server HTML` — без JS: `<style id="m-layout-…">` ×2, шапка `position: fixed`, y=0, 64rem; aside 200rem / 240rem; main встык с aside и ниже шапки; `[data-fixture-ready]` на сервере не ставится | — |
| — | геометрия зон в rem (1280×800) | сделано | проба `› zones of layout/matrix` — header 63.98rem, aside-start 199.99rem, aside-end 240rem, main начинается ровно у края aside | — |

Токены: совпадают 4 из 5; длительность перестройки сетки на пружине S4 — отменена (Ш9).
Оси: класс окна — алиасами (вариант 2 вопроса 1); панели — Ш7; колонки по контейнеру — Ш10.
Наблюдение, без статуса: переходы `.m-layout` читают `var(--sys-motion-*)` прямо в `.vue`, мимо карты токенов
(`layout/index.vue:70-71`); сгенерированные селекторы зон — `#id > [data-m3-zone=…]` (`utils/layout/css.ts:213`),
это идентификатор зоны, не состояние.

## foundation/app.md — тег `planned` → факт `сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1, Г1 | EN-04: `rootElement` — живой ref (План работ) | сделано | `app/index.vue:61-63`, спека `app/tests/variants.spec.ts:58-65` | S |
| Ш2, Г2 | docs-страница MApp, три пути подключения (План работ, Готово) | отменён | docs_v2 вне репо (решение владельца 2026-10-07); в репо краткий раздел `docs/architecture.md:169-175` | — |
| Ш3 | ссылка из `core/scope.vue` на доки кита (План работ) | сделано | `components/core/scope.vue:2-4` → `docs/architecture.md` | S |
| Ш4 | пропы и типы в `props.ts` (План работ) | сделано | `app/props.ts` | S |
| Ш5 | ссылка «Перейти к содержимому» (План работ, UX) | сделано | `app/index.vue:7-13`; проба `app.probe.ts › skip link` (фикстура `app/audit-skip-link` с собственным `MApp`): первый Tab-стоп, скрыта `clip-path: inset(50%)`, в фокусе `clip-path: none`, кольцо 2px solid, высота 40rem, Enter → `#audit-content`, следующий Tab — первая кнопка цели | S |
| Тесты | e2e ссылки «Перейти к содержимому» (Тесты) | частично | все 4 теста `app.e2e.ts:176-213` всегда уходят в `test.skip`: `playground/app/app.vue` не задаёт `skip-link-label`, а значит поведение в общем прогоне не проверяется | S |
| UX | тема `system` с первого кадра (Q1-Б, прогон 2) | сделано | `utils/theme/themeScss.ts:61-76`; проба `› system follows prefers-color-scheme` без JS, cookie `system`: `html[data-definition=system]`, light — `--md-sys-color-surface` #f9f9f9, фон `.ui-app` rgb(249,249,249); dark — #131313 / rgb(19,19,19), `color-scheme: dark`; хост оверлеев ×1 | — |
| Правило | BEM без `>` (правила кита) | частично | `app/index.vue:111` — `.ui-app__overlay-host > * { pointer-events: auto }` | S |

Токены: совпадают 2 из 2 (фон/текст, слой хоста).
Мелочь: второй `MApp` проверяется через `process.env.NODE_ENV` (`app/index.vue:49`), остальной кит — через `import.meta.dev`.

## foundation/system-bar.md — тег `planned` → факт `сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | точечные пути и `spacing()` (План работ) | сделано | `system-bar/index.vue:57-96`, `assets/.../system-bar/_index.scss:18-21` | S |
| Ш2 | одна строка с многоточием, `min-height` (План работ) | сделано | `index.vue:64,88-93`; проба `system-bar.probe.ts › geometry` на 360: высота 23.97rem, `white-space: nowrap`, `text-overflow: ellipsis`, текст обрезан, низ бара = верх app bar | S |
| Ш3 | размер иконки наследованием, без чужого класса (План работ) | сделано | `index.vue:75-82`; проба: иконка в `append` 15.98rem | S |
| Ш4 | safe-area (План работ; перенесён в layout Ш2) | сделано | проба `› top cutout` 390×844, вырез 47: у бара прозрачная `border-top` 47px, `background-clip: border-box` (цвет бара под вырезом), содержимое 24rem, текст с y=49, app bar сразу под баром | S |
| Ш5 | спеки регистрации (План работ) | сделано [занят] | `system-bar/tests/{variants,interaction,a11y}.spec.ts`, 17 кейсов | — |
| Ш6 | документация (План работ) | отменён | docs_v2 вне репо (как у остальных планов 2026-10-07) | — |

Токены: совпадают 4 из 4.
Наблюдение: `--ui-system-bar-height` объявляется на `:root` из стиля компонента (`index.vue:57-59`) — это
размер для вклада в зону layout (как `--ui-app-bar-height-*`), не CSS-переменная состояния.

## foundation/icon.md — тег `planned` → факт `частично` (тег неверен: всё, кроме toggle-кнопок)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1 | резерв `1em` и dev-предупреждение о пустом / неизвестном имени (План работ) | частично | квадрат есть: `icon/index.vue:35-36`, проба `icon.probe.ts › 1em square` — 20/24rem при font-size 20/24. Предупреждение только о пустом и синтаксически неверном имени (`composables/icon/iconName.ts:31-41`); `ic:outline-nonexistent` в правильном формате молчит, а план (Поведение) обещает «неизвестное имя» | S |
| Ш2 | `label` → `role="img"` + `aria-label` (План работ) | сделано | `composables/icon/useIconControl.ts:39-41`; серверный HTML `icon/matrix`: без label `aria-hidden="true"`, с label `role="img" aria-label="Favorite"` | S |
| Ш3a | проп `filled`: `outline-x` → `baseline-x` (План работ) | сделано | `iconName.ts:23-26` | S |
| Ш3b, Г3 | активный пункт навигации — залитый глиф (План работ; W70-А) | сделано | `fragments/navigation-item/index.vue:24-27,105-108`; проба `› active destination` — активные `i-ic:baseline-send`, остальные `i-ic:outline-*` в bar/rail/drawer | S |
| Ш3c | `filled` у chip filter и segmented (План работ) | отменён | `decisions.md:214` — «у чипов и segmented выбор остаётся галочкой» (W70-А) | — |
| Ш3d | залитый глиф у выбранной toggle-кнопки-иконки (План работ; W70-А) | нет | `decisions.md:214`, колонка миграции: «`selected` у `MButtonIcon` — ещё нет»; `button/icon/index.vue:20` только отдаёт `selected` в слот, глиф выбирает потребитель | S–M |
| Ш4 | документация (План работ) | отменён | docs_v2 вне репо | — |
| Q27 | `mirror` в RTL (прогон 2, G3) | сделано | `icon/index.vue:58-60`; проба `› mirror follows :dir()` (фикстура `icon/audit-mirror`): rtl `scale: -1 1`, ltr `none`; поддерево `dir=rtl` в ltr-странице зеркалится, `dir=ltr` в rtl — нет; с собственным `transform: rotate(90deg)` потребителя оба свойства живут вместе; класс `ui-icon--mirror` в серверном HTML | S |
| Правило | BEM без тег-селекторов и чужих классов (правила кита) | частично | `icon/index.vue:40` `.iconify`, `:50` `svg` — стили лезут в разметку `@nuxt/icon`; класс можно отдать самому `<icon class="ui-icon__glyph">` | S |

Токены: совпадают 2 из 2 (`currentColor`, `1em`).
Концепт: rest/active на «таблетке» совпадает в навигации; пары у toggle-кнопок нет (Ш3d).

## foundation/shape.md — тег `planned` → факт `частично` (тег неверен: нет только ClamShell и сверки Expressive)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1, Г1 | ClamShell, 35 фигур Compose (План работ, Готово) | нет | в каталоге 35 ключей = 34 фигуры Compose + `hexagon` (`assets/icon/shapes.ts`); заблокировано: нет кэша Gradle с исходниками, геометрию не выдумываем | S–M |
| Ш2, Г2 | декоративная скрыта, значимая названа (План работ) | сделано | `shape/index.vue:2-11`; проба `shape.probe.ts` — без label `aria-hidden=true`, `focusable=false`, без роли; с label `role=img`, имя «12 sided cookie» | S |
| Ш3, Г3 | общий кэш интерполяторов (План работ) | сделано | `composables/useShapeMorph.ts:80-82,179-188`; спеки `useShapeMorph.spec.ts:123-154` | M |
| Ш4 | сверка пружин с Compose (План работ) | частично | Standard — таблица по константам кита; Expressive — `it.todo` (`utils/motion/index.spec.ts:299`) | S |
| Ш5 | документация (План работ) | отменён | docs_v2 вне репо | — |
| Ш6 | reduced motion укорачивает морф (План работ) | частично | проба: полный морф затихает за 620 мс с креном, под reduce — за 262 мс без крена, промежуточные кадры есть. Но правило из статуса «> short4 → short2» не применено: берётся calm-пружина (`useShapeMorph.ts:147`), 262 мс > short4 (200 мс) | S |

Токены: совпадают 1 из 3 (Standard по константам); Expressive не сверена с Compose; CSS-токены пружин отменены S4.
Развилки 1 (имена — вариант 3) и 2 (`label` — вариант 1) решены.

## foundation/surface.md — тег `planned` → факт `сделан` (тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1, Г1 | точечные пути, пресеты `@each` (План работ) | сделано | `surface/index.vue:28-55` | S |
| Ш2 | hairline (План работ; G5 B9.4) | сделано | `assets/.../surface/_index.scss:10,33` `max(1px, 1rem)` по `decisions.md` «Тонкая обводка»; проба `surface.probe.ts` на 360 (1rem = 0.47px): `outlined` 1px; в forced colors `filled` / `elevated` получают 1px solid | S |
| Ш3 | `MSurfaceVariant` через `Extract<>` (План работ; G5 B13.2a) | сделано | `surface/props.ts:13` | S |
| Ш4, Г3 | таблица выбора контейнера в доках (План работ) | отменён | docs_v2 вне репо | — |
| UX | dev-предупреждение `@click` без роли | сделано | `composables/surface/useSurfaceClickWarning.ts`, `index.vue:16`; проба: ни у одного пресета нет `role` | S |
| Г2 | новые ступени формы применяются без правки компонента | сделано (механизм) | классы формы генерирует `@each $theme-shape-link` (`index.vue:64-68`); самих ступеней Expressive (S2) в `_variables.scss:192-201` и `MShape` (`shared/types/props.ts:62-70`) ещё нет — это системная задача S2 | — |

Токены: совпадают 4 из 4. Развилка 2 (hairline) закрыта решением; развилка 1 (`tone`) открыта — ниже.

## foundation/hotkey.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш3 | нормализация имён, «недоступно» в имени, карта озвучки (План работ) | сделано | `utils/hotkey/format.ts`, `presentation.ts:31`, `labels.ts:21-24`; проба `hotkey.probe.ts › view` — `arrowup` / `ArrowUp` / `up` / `UP` / `arrow-up` → «Alt+↑», имя «Alt Up» у всех; disabled — «Control K, unavailable» | S |
| Ш4 | платформа с сервера, резерв широкой формы, реактивный проп (План работ) | сделано | `utils/hotkey/platform.ts:21-40`; проба `› server` — с `Sec-CH-UA-Platform: "macOS"` сервер рисует «⌘K» с именем «Command K», без подсказок — «Control K» (резервный слой добавляется только на клиенте, если платформа другая) | S |
| Ш5 | нажатие тоном без движения, forced colors, токены (План работ) | сделано | `hotkey/index.vue:142-155,174-197`; проба: при удержании Ctrl+K у клавиши `--pressed`, `transform`/`translate` = none, сдвиг 0px; рамка 1px, `min-block-size` 20rem | S |
| Ш6 | документация (План работ) | отменён | docs_v2 вне репо | — |
| Т | шрифт клавиши «label-medium с трекингом» (Токены; концепт) | частично | трекинг теперь даёт `typescale` (`abstracts/_mixins.scss:153`), но ступень `label-small` (`assets/.../hotkey/_index.scss:12`; проба 11rem / 16rem), а концепт и строка токенов — `label-medium` | S |
| К | нажатие — `secondary-container` (концепт) | частично | код красит слой `on-surface-variant` × `state-opacity(pressed)` (`_index.scss:19-22`); движения нет, тон другой | S |

Токены: совпадают 3 из 4 (disabled через `state-opacity`, hairline, `spacing()`; шрифт — выше).
Наблюдение: `aria-disabled="true"` стоит на `role="img"` (`hotkey/index.vue:86`); в ARIA 1.2 `aria-disabled` у `img` не поддерживается. Смысл уже несёт имя «…, unavailable», axe не возражает.

## foundation/use-hotkey.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| И1–И3, Г1 | одна `normalizeKey`, озвучка из сообщений, `ariaKeyShortcuts` в модели (Изменения, Готово) | сделано | `utils/hotkey/registry.ts:73-77`, `presentation.ts:32` | S |
| Q48 | сопоставление по `key` или `code` (прогон 2) | сделано | `registry.ts:73-77,124`; проба `› mod+K`: настоящий Ctrl+KeyK → 1; `key:'л', code:'KeyK'` + ctrl → 1; `key:'k', code:'KeyL'` → 1; ctrl+shift+k → 0 (exact); набор в поле → 0 | S |
| Q49 | `scope` удалён (прогон 2) | сделано | `registry.spec.ts:193-196`; в `shared/types/hotkey.ts` и `utils/hotkey` нет `scope`/`pushScope` | S |
| IME | композиция не запускает сочетания (прогон 2) | сделано | `registry.ts:136`, `utils/keyboard/ime.ts`; проба: ctrl+k с `isComposing` → 0; meta+k на windows → 0 | S |
| B1.7a | внутренности в `utils/hotkey` (прогон 2) | сделано | `composables/hotkey/` — только `useHotkey.ts`, `provideHotkeyLabels.ts` | S |

## foundation/lazy.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш7, Ш9 | `aria-busy`, постоянный alert с повтором, фокус при `once=false`, активатор с клавиатуры, резерв, общий IO, `fallbackDelay`, fade без сдвига, тесты (План работ) | сделано | `composables/lazy/useLazyControl.ts:106-123,187-216,286-288,342`, `useLazyIntersection.ts:17-60`, `assets/.../lazy/_index.scss`; проба `lazy.probe.ts`: активатор `role=button tabindex=0`, Enter → `--active`, фокус остался внутри; pending — `aria-busy="true"`; ошибка — `role=alert` «Preview failed to load» и кнопка «Try again»; у активной границы постоянный пустой alert ×1 | M |
| Ш8 | документация (План работ) | отменён | docs_v2 вне репо, решение владельца 2026-10-07 (`lazy.md:91`) | — |
| — | первый кадр SSR: граница со своим контролом (правило кита) | частично | проба `› server HTML` без JS: `idle-own-control-on-interaction` приходит как `role="button" tabindex="0"` с классом `--activator`, хотя в заглушке своя кнопка. Лишний Tab-стоп и роль снимаются только после гидрации: `placeholderFocusable` выставляет `syncPlaceholder()` на клиенте (`useLazyControl.ts:106,120,187-191`) | S |
| Правило | производные значения — в карте токенов (правила кита) | частично | `lazy/index.vue:187` `typescale('body-medium')` — литерал в `.vue`, мимо карты | S |

Токены: совпадают 2 из 2 (сдвиг убран — fade без смещения; длительность на `--sys-motion-*`, пружина S4 отменена).

## foundation/virtual-scroll.md — тег `done` → факт `сделан` (тег верен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш1–Ш8 | `logicalScroll`, машина состояний, бэги, общие утилиты, размер файлов, спеки, фикстуры (План работ) | сделано | `composables/virtual-scroll/useVirtualScroll.ts:139,183,256-260` (368 строк), `utils/viewport/logicalScroll.ts`; пробы `virtual-scroll.probe.ts`: RTL-лента начинается у инлайн-начала (зазор 0, и без JS тоже); 30× ArrowLeft в RTL → `scrollLeft` −1200, диапазон 0–5 → 3–13, `isAtStart` false; в LTR зеркально +1200. Вертикаль с клавиатуры: PageDown → 0–12, End → 991–999 и `isAtEnd`, Home → 0–8 и `isAtStart`, в DOM ≤ 13 строк. stress «в конец»: сразу после — `settling`, потом `idle`, 12 строк в DOM | M |
| Ш9 | страница в docs_v2 (План работ) | отменён | docs_v2 вне репо | — |
| Ш10 | измеряемая переменная высота (План работ) | нет | отложено владельцем (`virtual-scroll.md:312`) | L |
| Г8 | «Открытые вопросы закрыты владельцем» (Готово, когда) | нет | вопросы 1–3 без решения — ниже | — |
| SSR | настоящий начальный диапазон на сервере (Как должно быть) | сделано | проба без JS: vertical-constant 0–26 (27 строк от высоты окна 800, не от вьюпорта 320rem), после `measure()` на клиенте 0–8, как описывает контракт; спейсер `block-size: 48000px` — `itemSize` в CSS px (вопрос 1) | — |
| RM | reduced motion (прогон 2, B13.3c) | сделано (код) | `useVirtualScroll.ts:256-260` читает `prefersReducedMotion()` в момент прокрутки; пробой не мерилось (у кнопок stress `behavior: auto`) — покрыто спекой `useVirtualScroll.navigation.spec.ts` | S |

Наблюдение: у горизонтальной ленты End/Home нативно ничего не делают (Chromium двигает по ним только
блочную ось), работают стрелки. Раздел «Поведение» плана перечисляет «стрелки, Page, Home, End» без этой оговорки.

## Сквозное
| # | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| B1.7a | «Внутренности кита — в `utils/**`, вне автоимпорта» (`decisions.md:178`) | частично | `addImportsDir(runtime('composables/**'))` (`src/module.ts:168`) выставляет потребителю `createLazyState`, `transitionLazy`, `resolveLazyView`, `observeLazyIntersection`, `useLazyControl`, `useLazyWarnings` (`composables/lazy/*`), `resolveIconName`, `findIconNameProblem`, `useIconControl` (`composables/icon/*`), `useSurfaceClickWarning`, `useGridContext`/`provideGridContext`, `buildMeasurement`/`computeRange` (`composables/virtual-scroll/geometry.ts:38,93`). Layout и hotkey уже вынесены, эти — нет | M |

## Регрессии

Нет. Найденные дефекты (первый кадр lazy с собственным контролом, `>`/тег-селекторы) выглядят как
недоделки: прежней рабочей версии в аудите 2026-10-23 и журналах прогона 2 нет.

## Планы с неверным статусом (тег → факт, одна строка почему)

- `layout.md`: `planned` → частично: сделаны шаги 1–6, 8, 10 и Q20; нет только панелей (Ш7, отложены владельцем).
- `app.md`: `planned` → сделан: все шаги в коде, docs-страница вынесена в docs_v2.
- `system-bar.md`: `planned` → сделан: шаги 1–5, safe-area получена через layout (проба).
- `icon.md`: `planned` → частично: нет залитого глифа у toggle-кнопки-иконки (W70-А), предупреждение о неизвестном имени неполное.
- `shape.md`: `planned` → частично: нет ClamShell и сверки Expressive; правило reduced motion из статуса («→ short2») в коде не то.
- `surface.md`: `planned` → сделан: шаги 2–3, которые в плане «перенесены», закрыты решениями B9.4 и B13.2a.

## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные

- `surface.md` в.1 — ось `tone` (lowest…highest): 1) нет, API `tag/variant/shape`; 2) да, необязательный `tone` поверх `filled`. (В плане рекомендован 1.)
- `virtual-scroll.md` в.1 — единицы `itemSize` при vw-корне: 1) px, пересчёт у потребителя; 2) rem × размер корня из `useSSRWindowSize`; 3) мерить первую строку. (В плане — 2 при первом потребителе в ките, до тех пор 1.)
- `virtual-scroll.md` в.2 — `initialOffset` не прокручивает контейнер: 1) композабл прокручивает к нему при подключении; 2) оставить потребителю и задокументировать; 3) убрать `initialOffset`. (В плане рекомендован 1.)
- `virtual-scroll.md` в.3 — `geometry.ts` автоимпортируется: 1) перенести в `utils/virtual-scroll/`; 2) оставить. (В плане рекомендован 1; см. «Сквозное».)
- `lazy.md` в.1 — `once=false` и фокус внутри: 1) не размонтировать, пока фокус внутри; 2) `v-show`. В коде уже вариант 1 (`useLazyControl.ts:156-160,206-216`), но решения владельца в журналах нет.

## Пункты в занятых родителем файлах

Чинит родитель (в счёт статусов не входят):
- Бар внутри `m-layout-main` отдаёт свой размер зоне main: `useLayoutItem` вызывает `host.contribute` при любом виде хоста (`composables/useLayout.ts:227-233`), и на `html` попадает `--m3-layout-<main>-size`.
- `windowY` не читает начальную прокрутку — `utils/layout/zone.ts:54-76`.
- Двойная блокировка скролла и модульное состояние `lockCount` / `previous` — `composables/overlay/useScrollLock.ts:26-27`.
- Спеки system-bar (`components/ui/system-bar/tests/**`) — Ш5 system-bar сделан, правки там за родителем.

## Пробы (файл → тесты → прошло/упало, ключевые измерения)

Все запускались против dev-сервера :3200 с `--output test-results/plans-audit-2/foundation`.
- `layout.probe.ts` → 12 → 12 прошло. Зоны 64 / 200 / 240rem; инсеты на `html` 64 / 200 / 240rem; классы окна на 10 ширинах; вырезы L47/R31 в ltr и rtl, верхний вырез 47; без JS сетка, fixed-шапка и контейнерная сетка (4 трека) уже в серверном HTML.
- `app.probe.ts` → 4 → 4 прошло. `system` без JS: light #f9f9f9 / dark #131313; хост ×1; ссылка «Перейти к содержимому» работает (на audit-фикстуре).
- `system-bar.probe.ts` → 2 → 2 прошло. 24rem, иконка 16rem, многоточие; вырез 47 забирает бар, app bar под ним.
- `icon.probe.ts` → 5 → 5 прошло. `mirror` по `:dir()` (и в поддеревьях), композиция с `rotate`; активная навигация — `baseline`; квадрат 1em.
- `hotkey.probe.ts` → 3 → 3 прошло. key/code, IME, exact, поле ввода; SSR «⌘K» по client hints; нажатие без сдвига; шрифт 11rem.
- `lazy.probe.ts` → 2 → 2 прошло (первый прогон упал на неверном `data-test` в самой пробе, исправлено). Enter активирует, `aria-busy`, alert; без JS граница со своим контролом — `role=button`.
- `virtual-scroll.probe.ts` → 5 → 5 прошло. RTL `scrollLeft` −1200 стрелками; End/Home по вертикали; SSR 0–26 → клиент 0–8.
- `shape.probe.ts` → 1 → 1 прошло. Морф 620 мс → 262 мс под reduced motion, без крена.
- `surface.probe.ts` → 1 → 1 прошло. Волосок 1px при 1rem = 0.47px; forced colors — рамки у filled/elevated.

Не проверено: `npm run lint:scss` (layout Г1), визуально тёмная тема и forced colors скриншотами.

## Добавленные фикстуры

- `playground/fixtures/audit-layout/window-class.vue` — флаги `useBreakpoint().is.compact…extraLarge` (новая папка, `touch playground/app/utils/fixtures.ts` сделан).
- `playground/fixtures/icon/audit-mirror.vue` — `MIcon mirror` в ltr/rtl-поддеревьях и с `rotate` потребителя.
- `playground/fixtures/app/audit-skip-link.vue` — вложенный `MApp` со `skip-link-label` (второй `MApp` даёт dev-предупреждение и второй хост — только для пробы).
