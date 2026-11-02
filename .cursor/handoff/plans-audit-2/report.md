# Аудит планов редизайна против кода — 2 (2026-10-30)

Сверены все 85 планов `.cursor/plans/feature/components-should-update/**` и системный слой `common.md` (S1–S10)
с `src/runtime/**` **рабочего дерева** (≈686 незакоммиченных файлов). Исходники кита не правились, ничего не
закоммичено. Девять аудиторов по группам, у каждого — подробная таблица по пунктам с `file:line` и пробами:
`parts/{form,overlays,feedback,navigation,foundation,fields,pickers,containment,buttons}.md`. Здесь — сводка,
поправки оркестратора и всё, что нужно для фазы 2.

Пробы: `playground/probes/plans-audit-2/<группа>/*.probe.ts` (вне git), dev-сервер :3200, Chromium 1280×800
(1rem ≈ 0.667 CSS px), размеры — в rem через `remInPx`. **345 проб: 313 прошли, 31 упали, 1 пропущена.** 30
падений — измеренные дефекты (ниже), 1 — неверное ожидание самой пробы (`overlays/dialog.probe.ts › focus`).
Запуск: `npx playwright test -c playwright.probe.config.ts playground/probes/plans-audit-2/<группа> --output test-results/plans-audit-2/<группа>`.

## 1. Итог

| | Сделано | Частично | Нет | Регресс | Отменено / отложено решением | Не проверено |
|---|---:|---:|---:|---:|---:|---:|
| Сумма отчётов групп | 542 | 110 | 72 | 0 | 95 | 10 |
| **После поправок (§1.1)** | **542** | **101** | **70** | **0** | **102** | **10** |

Из 70 «нет» ≈ 15 — документация вне репо кита (docs_v2/v3) и 5 — непереснятые рендеры `current.webp`;
собственно кода — ≈ 50.

**Планы:** тег верен у 32 из 85; неверен у 52; у `overlays/modals.md` тега нет. Подробно — §4.

### 1.1. Поправки оркестратора к отчётам групп

- **`1px` в `@include forced-colors` — не нарушение.** Исключение записано в `agent-brief.md` §4 («Только rem…
  Исключение: `1px` внутри `@include forced-colors`»). Проверено: все найденные литералы
  (`expansion-panel/index.vue:315`, `list/item/_states.scss:70`, `avatar/index.vue:133`, `table/_rows.scss:90`,
  `fragments/table/pagination/index.vue:204`, `alert/index.vue:251`, `badge/index.vue:86` и др.) стоят внутри
  миксина. −4 «частично» у containment; expansion-panel и avatar — сделаны, теги верны.
- **Q56-А отложил крупные пункты в «план кирпичиков»** (`.cursor/handoff/kit-bugs/questions.md:404-414`):
  очередь снекбаров B4.9c (`decisions.md:157` — «отдельный кирпичик»), кламп панелей B4.2, ссылки в rail/bar
  B5.1a, клавиатура toolbar B5.6d (`decisions.md:112`). Аудиторы записали их «нет/частично» — переведены в
  «отложено». Файла «плана кирпичиков» в репо нет (§6).
- **Tooltip без поверхности в SSR — по решению** Q19-В (`decisions.md:145`: «в DOM с момента монтирования»).
  Побочный дефект остаётся: при пути через слот-пропсы серверный HTML ссылается `aria-describedby` на id,
  которого в HTML нет (§8).
- **Вопросы 4–5 плана menu имеют рекомендацию** (вариант 1 у обоих, `overlays/menu.md:336,345`) — это не
  «развилка без рекомендации».

## 2. Топ-10 пропусков (код кита, не отложены, файлы свободны)

| # | Что | Где | Доказательство | Объём |
|---|---|---|---|---|
| 1 | Меню, смонтированное открытым, невидимо (`display: none`, не `:popover-open`) и с загрузки держит блокировку прокрутки `html` | `ui/menu/index.vue:22-27` (`<transition>` без `appear`) | `overlays/menu.probe.ts › mounted open`, `dialog.probe.ts › scroll lock` | S |
| 2 | Триггер меню без `#activator`/`triggerAttrs` (`aria-haspopup/expanded/controls`), ArrowDown/Up/Enter на триггере не открывают (A11-06); `useMenuControl` сам раздаёт `role`/`tabIndex`, спеки нет | `composables/menu/useMenuControl.ts:65-76` | `menu.probe.ts › roles`, `› trigger keys` | M |
| 3 | MProgress: у circular зазор 4 не виден (CSS `stroke-linecap: round` перебивает `butt`), дуга стартует в 6 часов; `aria-valuenow` не округлён (`33.333…`); слот внутри `role="progressbar"`; у wavy нет stop; волна 14/20 вместо 10/40; литералы толщины в `useProgress.ts` | `progress/circular/index.vue:39,97,101-106`, `useProgress.ts:81-110`, `linear/index.vue:17,51,81,157-170` | `feedback/progress.probe.ts` (5 падений) | M |
| 4 | MLoading `contained` + `type="shape"`: индикатор 48 вместо 38, сдвинут и обрезан `contain: strict` | `.ui-shape { width/height: 100% }` (`ui/shape/index.vue:55-56`) перебивает `inset` (`ui/loading/index.vue:160-163`) | `feedback/loading.probe.ts › density, contained` | S |
| 5 | W70-А не доделан: залитый глиф у выбранной `MButtonIcon` и у активной вкладки (`activeIcon` у `MTabItem`); навигация bar/rail/drawer — сделана | `button/icon/index.vue:20`, `fragments/tabs/tab-content/index.vue:7`, `tabs/props.ts:18`; `decisions.md:214` «миграция ждёт» | `buttons/toggle.probe.ts`, `navigation/tabs.probe.ts` | S–M |
| 6 | MSwitch: нажатая ручка — овал 24×28 вместо круга 28 (контейнер 24 flex, ручка сжимается) | `switch/index.vue:162-173,286-291` | `form/switch.probe.ts › press` | S |
| 7 | Мишени 48 на таче, которые план обещает: у чипа `removal="button"` мишень висит на обёртке `<span>` (тап мёртв); образцы color-picker 32×32 и полосы hue/alpha 40 без мишени; период time-picker 38 без мишени | `chip/index.vue:2-11,179`; `fragments/color-picker/Swatches.vue:149-219`; `time-picker/_parts.scss:134-152` | `form/chip.probe.ts`, `pickers/color.probe.ts`, `pickers/time.probe.ts`, `buttons/target.probe.ts` | S |
| 8 | Autocomplete + IME: после `compositionend` панель сама не открывается (Chromium шлёт последний `input` до `compositionend`, `onInput` выходит) | `composables/autocomplete/useAutocomplete.ts:161-163,209`; образец — `utils/search/useSearchControl.ts:240` | `fields/select-keyboard.probe.ts` | S |
| 9 | Контролы формы: у радио нет реактивного `value` в регистрации (сменили `value` → группа отдаёт старый) и нет dev-предупреждения у безымянной группы; у slider нет dev-предупреждения `origin` на `range` (W2-А); chip-group после удаления последнего чипа роняет фокус на `body` | `radio/index.vue:97-100`, `radio/group/index.vue`; `slider/index.vue:186`; `chip-group/index.vue:29,203-206` | `form/radio.probe.ts` (2), `slider.probe.ts`, `chip-group.probe.ts` | S |
| 10 | MFormRenderer: нет постоянного `role="status"` результата, нет сводки ошибок (FM-11); axe `button-name` на степперах `number`, радиогруппа в `fieldset` без имени | `form-renderer/index.vue`, `fragments/form-renderer/field/index.vue:126-132,160-183` | `form/form-a11y.probe.ts` | S–M |

Дальше по весу: Expressive-анатомия меню (L, вопросы 4–5 → вариант 1); hairline tabs `1rem` вместо
`max(1px, 1rem)` и минимум 24 у индикатора; обрезанное кольцо фокуса крайних пунктов развёрнутого rail; S8 по
таблице (табл. §7); MTable compact со столбцом чекбоксов 41.5 вместо 40; list compact на 2–3 строки (развилка);
свайп листа по скорости и порог в rem; прокрутка голой панели `MOverlay`, scrim под `prefers-contrast: more`,
разделители прокрутки диалога; `closeTop`/`open(component)` у `$material.modal`; имя закрытия alert/banner
«`closeLabel`: `title`»; бейдж во вкладках не на `badge-anchor`; холст color-picker (Shift ±10, кольцо на
бегунке); disabled time-picker через `opacity`; сжатые ячейки OTP не квадратные; лишний Tab-стоп lazy в SSR;
автоимпорт внутренностей (B1.7a); пустой `label` у snackbar; связь тултипа с пустым текстом; стресс-фикстуры
и e2e у chip-group, selection-group, form-renderer, menu, dialog, sheet, tooltip.

## 3. Таблица по компонентам: всё несделанное

Сделанные и отменённые пункты свёрнуты в счётчики — их таблицы и доказательства в `parts/<группа>.md`.
`[занят]` — файл родительской сессии. Объём: S — до часа, M — полдня, L — день+.

### Выбор (`parts/form.md`)

| План | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| checkbox | Ш7 прорисовка галочки `stroke-dashoffset`, прозрачность глифа `short-1`/`linear` | частично | `checkbox/index.vue:176-202` | S |
| checkbox | Ш8 `stress.vue`, forced colors в e2e кроме mixed | частично | `playground/fixtures/checkbox/` | S |
| radio | Ш1б геттер `value` в регистрации | нет | `radio/index.vue:97-100`; `radio.probe.ts › value change` | S |
| radio | Ш4б dev-предупреждение у безымянной группы (FM-07) | нет | `radio/group/index.vue`; `› nameless group` | S |
| radio | Ш7 `stress.vue`, RTL-фикстура | частично | — | S |
| switch | Г1 нажатая ручка 28 (сейчас 24×28) | частично | `switch/index.vue:162-173,286-291`; `switch.probe.ts › press` | S |
| switch | Ш7 ось `icons` в `matrix.vue`, `stress.vue` | частично | — | S |
| chip | A generic `TValue` | нет | `chip/props.ts:37` | M |
| chip | S8 мишень у `removal="button"` | частично | `chip/index.vue:2-11,179`; `chip.probe.ts › coarse` | S |
| chip | Ш9 matrix без input-чипа/elevated, нет `stress.vue` | частично | — | S |
| chip-group | Ш6 фокус после удаления последнего чипа | частично | `chip-group/index.vue:29,203-206`; `chip-group.probe.ts › removing` | S |
| chip-group | Ш9 фикстуры `chip-group/{matrix,stress}`, e2e | частично | папки нет | M |
| slider | СЛ-2 dev-предупреждение `origin` на `range` (W2-А) | нет | `slider/index.vue:186` | S |
| slider | Ш3п `&--dragging * { … !important }` | частично | `fragments/slider/root/index.vue:48-50` | S |
| slider | Ш7 `stress.vue` | частично | — | S |
| rating [занят] | указатель/превью/правый клик — исправлены родителем в ходе аудита; Ш6 `stress.vue` | частично | `form/rating.probe.ts` 5/5 зелёные | S |
| selection-group | Ш2 `groupAttrs` в режиме данных (строки — соседи `#default`), нет `aria-disabled` у отключённой группы | частично | `selection-group/index.vue:1-26`, `utils/selection/patternAttrs.ts:27-34` | M |
| selection-group | Ш4/Ш5 фикстура на 1000, e2e + axe | нет / частично | — | S |
| form-renderer | Ш3б постоянный `role="status"` | нет | `form-a11y.probe.ts` | S |
| form-renderer | Ш4 сводка ошибок `MAlert` + фокус (FM-11) | нет | G1-31: у адаптера нет карты ошибок | M |
| form-renderer | a11y степперов `number` и имя радиогруппы в `fieldset` | частично | `field/index.vue:126-132,160-183` | S |
| form-renderer | Ш7 e2e и фикстуры | частично | — | S |

### Оверлеи (`parts/overlays.md`)

| План | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| dialog | Ш1-лог физические `max/min-width`, `margin` у заголовка | частично | `ui/dialog/index.vue:105-107,133` | S |
| dialog | Ш2 разделители над/под телом при прокрутке | нет | нет `animation-timeline` | S |
| dialog | тесты: `fixtures/dialog/{matrix,stress}`, e2e стопки/forced/reduced | частично | только `overlay/matrix.vue` | M |
| sheet | Ш1-лог физические `max-width/height` | частично | `ui/sheet/index.vue:80-81` | S |
| sheet | Ш6 порог 56 + скорость, порог в rem | нет | `useOverlaySwipe.ts:55`, `overlay/props.ts:41` (`80` px); `sheet.probe.ts › swipe` | S |
| sheet | тесты | частично | — | M |
| tooltip | связь на пустой `role=tooltip` | частично | `useTooltipControl.ts:156-165` | S |
| tooltip | unit-спека `useTooltipControl` | нет | — | S |
| tooltip | долгое нажатие на таче | не проверено | `useTooltipControl.ts:99-123` | — |
| tooltip | тесты `tooltip/{matrix,stress}` | частично | — | M |
| menu | д6 смонтированное открытым | нет | топ-1 | S |
| menu | д5 `DEFAULT_Z_INDEX = '999'`, база `useStack` 2000 вне `z()` | частично | `usePopover.ts:135` [занят], `useStack.ts:86` | S |
| menu | CT-03 `min-width: 0` у подписи пункта | частично | `ui/menu/index.vue:279-281` | S |
| menu | origin после переворота | частично | `useMenu.ts:77` ← `usePopover` [занят] | S |
| menu | триггер: `#activator`, `triggerAttrs`, клавиши | нет | топ-2 | M |
| menu | `useMenuControl` на бэгах + спека | частично | `useMenuControl.ts:65-76` | M |
| menu | Expressive: группы, `surface-container-low`, selected `tertiary-container`, vibrant (в. 4–5 → вар. 1) | нет | `menu.probe.ts › geometry` | L |
| menu | строка пункта: `body-large`, шорткат `label-small`, зазор 8, иконка 20, вставка 4 | нет | `menu/_index.scss:27,30,34,46` | S |
| menu | слой `::before` вместо подмены фона; selected/disabled в forced colors | нет | `ui/menu/index.vue:238,261-269` | S |
| menu | `fragments/toolbar/overflow.vue` на `MMenuItem` | частично | `:21` | S |
| menu | тесты: `menu/{matrix,stress}`, `menu.e2e.ts`, `useMenuControl.spec.ts` | частично | — | M |
| overlay | Ш3 прокрутка голой панели `MOverlay` | нет | `ui/overlay/index.vue:318-331` | S |
| overlay | Ш5 scrim под `prefers-contrast: more` | нет | grep пуст | S |
| overlay | e2e голого `MOverlay` с высоким содержимым | частично | — | S |
| modals | `open(component)` на сервисе, `closeTop(reason)`, `closeAll(reason)` | частично / нет | `createModalService.ts:48-86,139` | S |
| modals | вложенность `parent-closed` — спеки/пробы | не проверено | — | S |
| modals | тесты списка `<tests>` | частично | — | M |

### Feedback (`parts/feedback.md`)

| План | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| alert | Ш3б имя закрытия «`closeLabel`: `title`» (A11-04) | нет | `ui/alert/index.vue:68,154` | S |
| alert | Ш4б отступы через `spacing()` | нет | `alert/_index.scss:39-40,46` | S |
| alert | `&__title + &__body` (комбинатор) | частично | `ui/alert/index.vue:204` | S |
| alert | e2e: длинный токен на 360, forced, Tab после закрытия | частично | — | S |
| badge | Ш4в вкладки на формуле BadgedBox (верх −4 вместо −2) | частично | `tabs/_index.scss:81-90`; `badge.probe.ts` (2) | S |
| badge | фикстура `badge/matrix.vue`, e2e угла во вкладках | частично | — | S |
| banner | Ш4б имя закрытия с заголовком | нет | `ui/banner/index.vue:68,134` | S |
| banner | Ш5б, И3 `spacing()` | нет / частично | `banner/_index.scss:14-20,46-47` | S |
| banner | `:not(:has(> .ui-banner__icon))` вместо модификатора | частично | `ui/banner/index.vue:246` | S |
| loading | Ш3 contained + shape | частично | топ-4 | S |
| loading | Ш2б `label` (S7 → рек. Б: оставить `ariaLabel`) | — | `ui/loading/props.ts:30` | — |
| loading | Ш5 `delay`/`minDuration` (S6 → рек. Б: не делать) | отменено по рек. | `ui/loading/props.ts:18-41` | — |
| loading | unit «inline в `<p>` без mismatch» | частично | `ssr.spec.ts` | S |
| progress | Ш1в stop у wavy; Ш1д зазор circular; К старт с 12 часов; Ш2 токены волны/толщины/радиуса; Ш4б подпись вне роли; Ш4в округление; Ш5б `contain` | нет / частично | топ-3 | M |
| progress | S10 → ось `shape: 'flat' \| 'wavy'` (рек. А) | нет | `ui/progress/props.ts:66-67`, `linear/index.vue:9,23`, `circular/index.vue:9,39`, `useProgress.ts:33,83,87,94,108` | S |
| snackbar | Ш3б пустой `label` без слота — не рисовать + dev-warn | нет | `ui/snackbar/index.vue:41-43` | S |
| snackbar | `spacing()` вместо литералов | частично | `snackbar/_index.scss:52-91` | S |
| snackbar | тесты: пустой label, e2e на 360 над nav-bar, forced | частично | — | S |

### Навигация (`parts/navigation.md`)

| План | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| app-bar [занят] | Ш5 `windowY` (чинит родитель), safe-area бара вне `m-layout` | частично | `utils/layout/carve.ts:128-133` [занят] | S |
| app-bar [занят] | переходы `var(--sys-motion-*)` в `.vue` мимо `g()` | частично | `app-bar/index.vue:~185-194` | S |
| breadcrumbs [занят] | Ш5 перекрытие на таче (родитель уже: `margin-block: 0`), `calc(-1 * …)` в `.vue` | частично | `breadcrumbs/index.vue:146,154-157` | S |
| navigation-bar | Ш1 `spacing()` вместо литералов | частично | `navigation-item/_index.scss:16-91` | S |
| navigation-bar | Ш4 safe-area у самого бара вне layout | частично | `env()` нет | S |
| navigation-bar | dev-предупреждение вне 3–5 пунктов | нет | `navigation-bar/index.vue:33-72` | S |
| navigation-bar | тесты: stress, forced, safe-area в e2e | частично | — | S |
| navigation-drawer | Ш1 `spacing()` | частично | `navigation-drawer/_index.scss:9-67` | S |
| navigation-rail | Ш1 `transition`/`calc(100dvh − …)` в `.vue`; вне `m-layout` рейл игнорирует высоту контейнера | частично | `navigation-rail/index.vue:163,171` | S |
| navigation-rail | Ш4 кольцо фокуса крайних пунктов развёрнутого рейла обрезано (IN-05) | частично | `fragments/navigation-rail/content.vue:80-102`; `forced-focus.probe.ts` | S |
| navigation-rail | тесты: forced, reduced в e2e | частично | — | S |
| pagination | мишень растёт по обеим осям, а `decisions.md:176` — «только по блочной» | частично | `pagination/index.vue:294` | S |
| tabs | Ш1 hairline `1rem` → `max(1px, 1rem)` (`decisions.md:212`) | частично | `tabs/_index.scss:16` | S |
| tabs | Ш4 минимум 24 у индикатора (строка токенов плана) | частично | `tabs/index.vue:166` | S |
| tabs | А `activeIcon`/залитый глиф активной (W70-А) | нет | `tab-content/index.vue:7`, `props.ts:18` | S |
| tabs | тесты: forced, reduced | частично | — | S |
| toolbar | `hasModel` вычисляется один раз | частично | `toolbar/index.vue:93` | S |
| toolbar | S9 → `layout` → `orientation` (рек. А) | нет | `toolbar/props.ts:25,32`, `index.vue:7,145,196,202-203,272-285`, `tests/a11y.spec.ts:64-65`, `tests/variants.spec.ts:66-78`, `fixtures/toolbar/matrix.vue:40` | S |
| все | шаги «Документация» (8) | нет | вне репо кита | — |

### Foundation (`parts/foundation.md`)

| План | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| layout | Ш7 панели `m-layout-pane`, `useListDetail` | отложено владельцем | `foundation/layout.md:211` | L |
| layout | переходы `.m-layout` читают `var(--sys-motion-*)` в `.vue` | наблюдение | `layout/index.vue:70-71` | S |
| app | e2e ссылки «Перейти к содержимому» всегда `test.skip` — `playground/app/app.vue` не задаёт `skip-link-label` | частично | `app.e2e.ts:176-213` | S |
| app | `.ui-app__overlay-host > *` | частично | `app/index.vue:111` (не в исключениях `decisions.md:119`) | S |
| icon | Ш1 dev-предупреждение о неизвестном (корректном по форме) имени | частично | `composables/icon/iconName.ts:31-41` | S |
| icon | Ш3d залитый глиф у выбранной `MButtonIcon` (W70-А) | нет | `button/icon/index.vue:20` | S–M |
| icon | `.iconify`, `svg` — стили по чужим классам/тегам | частично | `icon/index.vue:40,50` | S |
| shape | Ш1 ClamShell (35-я фигура) | нет, блок | нет кэша Gradle, геометрию не выдумываем | S–M |
| shape | Ш4 сверка Expressive-пружин (`it.todo`) | частично | `utils/motion/index.spec.ts:299` | S |
| shape | Ш6 reduced motion «> short4 → short2» (сейчас 262 мс calm-пружиной) | частично | `useShapeMorph.ts:147`; `shape.probe.ts` | S |
| hotkey | шрифт `label-small` вместо `label-medium`; нажатие слоем вместо `secondary-container` (концепт) | частично | `hotkey/_index.scss:12,19-22` | S |
| lazy | первый кадр SSR: граница со своим контролом — лишние `role=button tabindex=0` до гидрации | частично | `useLazyControl.ts:106,120,187-191`; `lazy.probe.ts › server HTML` | S |
| lazy | `typescale('body-medium')` в `.vue` мимо карты | частично | `lazy/index.vue:187` | S |
| virtual-scroll | Ш10 переменная высота | отложено владельцем | `virtual-scroll.md:312` | L |
| virtual-scroll | Г8 вопросы 1–3 закрыты владельцем | нет | рекомендации плана: в.1 — 1 сейчас; в.2 — 1; в.3 — 1 | S |
| сквозное | B1.7a: внутренности lazy/icon/surface/grid/`virtual-scroll/geometry.ts` в `composables/**` автоимпортируются | частично | `src/module.ts:168` | M |

### Поля (`parts/fields.md`)

| План | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| text-field, textarea, number-input, dropdown, otp-input | Г «рендер `current.webp` переснят» | нет | все от 2026-10-07; инфраструктура съёмки вне git (`common.md` §4) | S |
| textarea | Q1 (счётчик в строке поддержки) — запись в `decisions.md` | нет | — | S |
| dropdown | Г2 запись Q2/Q3 (галочка в конце, полстроки) в `decisions.md` | нет | записан только Q1 (`decisions.md:89`) | S |
| dropdown, autocomplete | A generic `TItem` из `items` (S1 → рек. Б: `MDropdownProps<TItem,TValue>`) | нет | `dropdown/index.vue:175,201`, `props.ts:84,130`; `autocomplete/index.vue:211,239` | M |
| dropdown, autocomplete | Г3 кламп высоты панели | отложено (Q56-А B4.2) [занят] | `usePopover.ts:239` | M |
| dropdown | задержка индикатора (S6 → рек. Б) | отменено по рек. | — | — |
| autocomplete | IME: открытие после композиции | частично | топ-8 | S |
| search (WIP, только статус) | Ш4 docked на `MMenu` (axe, e2e `test.fail`), Ш5 рецепт полноэкранного, Ш6 демо с результатами, Ш7 тесты не по эталону, `index.vue` 459 строк | частично / нет | `search/index.vue:147`, `search.e2e.ts:264-267` | — |
| otp-input/group | Г1 сжатые ячейки квадратом (26×31, 17.5×31) | частично | `_cells.scss:28-45`; `otp-number.probe.ts` | S |

### Пикеры и файлы (`parts/pickers.md`)

| План | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| time-picker | Ш1 `inheritAttrs: false` | частично | `ui/time-picker/index.vue` | S |
| time-picker | Ш3 период на механике toggle (S9), а не свои `<button>` | частично | `fragments/time-picker/period/index.vue:6-14`, `_parts.scss:134-152` | S |
| time-picker | Т мишень 48 у периода | нет | `time.probe.ts › coarse pointer` | S |
| time-picker | disabled — `opacity` 0.38 тела, а не роли (`color-and-state.md:48-50`) | частично | `ui/time-picker/index.vue:310-312` | S |
| color-picker | Ш8 inline `--m-color-picker-{alpha,swatch,preview}` против «CSS-переменные только у layout» | частично | `index.vue:41`, `Swatches.vue:29`, `Preview.vue:6`; `color.probe.ts` | S |
| color-picker/canvas | Shift ±10; кольцо фокуса на бегунке, а не на поле | частично | `Canvas.vue:99-105,172-174` | S |
| color-picker/edit | буквы каналов зашиты, отступление не в `decisions.md` | частично | `Edit.vue:99-110`, `props.ts:6-7` | S |
| color-picker/swatches | мишень 48; hover-слой (сейчас только `scale`) | нет / частично | `Swatches.vue:149-219` | S |
| color-input | inline `--m-color-input-swatch` | частично | `color-input/index.vue:57,71` | S |
| file-upload/item | кнопки действий только с модификатором без класса элемента | частично | `fragments/file-upload/Item.vue:42-74` | S |
| date-picker, time-picker, color-*, file-* | шаги «Документация» (6) | не проверено | вне репо | — |

### Containment и данные (`parts/containment.md`)

| План | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| list | О compact на 2–3 строки: 68/88 вместо 60/76 | частично | `list/item/_index.scss:22-23,38-39,75`; `list.probe.ts › row heights` | S (развилка §5) |
| list-subheader | `&:has(> .ui-list-subheader--sticky)` вне исключений | частично | `list/index.vue:76` | S |
| table | Ш2 DT-10 устаревшие данные; DT-11 задержка индикатора (S6 → рек. Б) | нет / отменено по рек. | — | S |
| table | Ш6 compact со столбцом чекбоксов 41.5 вместо 40 | частично | `table/_index.scss:13,39,78-82`; `table.probe.ts › density` | S |
| table | `--ui-table-fade` против правила CSS-переменных | частично | `table/index.vue:250-258,288,293` | S |
| table | `>` в `:has(> …)` и `row:hover > .ui-table__cell` | частично | `table/index.vue:301`, `_rows.scss:81` | S |
| table | `stickyHeader` (Q-9) не записан в `decisions.md` (ru/en) | нет | — | S |
| timeline/item | S8 → тоны до всех ролей `MColor` (рек. А) | нет | `timeline/props.ts:11,51`, `fragments/timeline/divider/index.vue:33,38,65`, `timeline/_index.scss:59-68` | S |

### Кнопки (`parts/buttons.md`)

| План | Пункт | Статус | Доказательство | Объём |
|---|---|---|---|---|
| button | Т трекинг label-large (TK-03) — следствие S6 | нет | `abstracts/_mixins.scss:140-145`; `geometry.probe.ts` — `letter-spacing: normal` | S |
| button/icon | Ш4″ залитый глиф выбранной (W70-А) | нет | см. топ-5 | M |
| fab | лестница 40/56/96 (владелец) не записана в `decisions.md` | — | `button-family-m3_2026-10-07.md:18` | S |
| group | standard group отложена — не записано в `decisions.md` | — | там же `:20` | S |

## 4. Планы с неверным статусом

| План | Тег | Факт | Почему |
|---|---|---|---|
| form/checkbox, radio, switch, chip, chip-group, slider, selection-group, form-renderer | done | частично | см. §3 «Выбор» |
| form/rating | done | частично на старте → сделан (кроме stress) | указатель по ряду, превью гасило заливку, правый клик фиксировал; родитель исправил во время аудита |
| overlays/dialog, sheet, overlay | planned | почти сделан | нет разделителей/скорости свайпа/прокрутки панели и тестов |
| overlays/tooltip | planned | сделан | мелочи: пустая связь, спека |
| overlays/menu | planned | частично | §3 |
| overlays/modals | — | частично | тега нет |
| feedback/alert, badge, banner/index, snackbar | planned | почти сделан | §3 |
| feedback/banner/actions | planned | сделан (с отменами Q41/Q42) | — |
| feedback/loading, progress | planned | частично | §3 |
| navigation/app-bar, breadcrumbs/index, navigation-bar, -drawer, -rail, tabs, toolbar | planned | частично | §3 |
| navigation/breadcrumbs/item, breadcrumbs/divider, pagination | planned | сделан | pagination — кроме доков |
| foundation/app, system-bar, surface | planned | сделан | — |
| foundation/layout, icon, shape | planned | частично | layout — нет только панелей (отложены) |
| inputs/search | done | частично | WIP владельца |
| inputs/otp-input/group | done | частично | сжатые ячейки не квадрат |
| inputs/text-field, number-input, otp-input/index | done | частично формально | не переснят только рендер |
| inputs/textarea | done | частично | рендер + запись Q1 |
| inputs/time-picker, color-picker/{index,canvas,edit,swatches} | done | частично | §3 |
| containment/list, list-subheader; data/table, timeline/item | done | частично | §3 |

Тег верен (32): form/selection-item; foundation/hotkey, use-hotkey, lazy, virtual-scroll; inputs/dropdown и
autocomplete (`partial`, но текст плана устарел: шаги 3–4 / 6 сделаны в прогоне 2), confirm-edit,
otp-input/field, otp-input/separator, date-picker, color-picker/preview, color-input, file-input,
file-upload/{index,dropzone,item,list}; containment/card, divider, expansion-panel; data/avatar,
timeline/index, timeline/divider; все 8 `button/*` (group — «частично по решению»).

## 5. Развилки

### 5.1. Развилки планов без рекомендации

**Нет.** Все открытые вопросы планов либо закрыты (W-, Q-, B-ответы в `decisions.md` и журналах), либо имеют
рекомендацию плана: menu в.4–5 → 1; surface в.1 (`tone`) → 1 (не вводить); virtual-scroll в.1 → 1 сейчас,
в.2 → 1, в.3 → 1; lazy в.1 → 1 (уже в коде, не записано). Вопросы S1–S10 прогона 2 — с рекомендацией (фаза 2
берёт их по рекомендации).

### 5.2. Новые развилки, найденные аудитом (в планах их нет — нужен владелец)

| # | Где | Вопрос | Варианты | Рекомендация аудитора |
|---|---|---|---|---|
| N1 | S8, `common.md:50` ↔ `decisions.md:176` | объём мишени 48 на таче | 1) расширить `touch-target` на `MButton default` (40), сегменты segmented (38), образцы color-picker (32), период time-picker (38); 2) compact-only, поправить `common.md` | 1 для образцов и периода (по блочной оси); `default`/segmented — решение владельца |
| N2 | S6 ↔ правило «без новых системных токенов» | emphasized-типографика требует `--md-sys-typescale-*-emphasized-*` и ветку `$theme-typography-link` | 1) добавить (исключение из правила); 2) отказаться от S6, записать | — (конфликт двух решений владельца) |
| N3 | list, ось `density` | compact в 2–3 строки (60/76 обещаны картой, факт 68/88) | 1) плотность управляет и отступами (padding 6, gap 0); 2) поднять токены до 68/88; 3) записать «compact уплотняет только однострочные» | 1 |
| N4 | selection-group, `pattern` в режиме данных | куда надеть `groupAttrs`, если строки рендерятся соседями `#default` | а) рендер-функция строк в scope `#default`; б) экспорт `groupPatternAttrs` + обёртка вокруг; в) в режиме данных без `pattern` | а |
| N5 | form-renderer, поле `number` | имена степперов без английских дефолтов | а) требовать `field.props.incrementLabel/decrementLabel` + dev-warn; б) словарь подписей у рендерера; в) `number` без степперов | а |
| N6 | color-picker / color-input | динамический цвет значения без CSS-переменных | 1) inline `background` в `style`; 2) записать исключение «цвет значения» в `decisions.md` | 2 для alpha/превью, 1 для образца |
| N7 | color-picker/edit | буквы каналов «R/G/B/A %/H/S %/L %» | 1) записать как нотацию, «%» — в суффикс; 2) ключи в `messages` | 1 |

Не развилки (правило системы уже отвечает, фаза 2 делает): disabled time-picker ролями (`color-and-state.md:48-50`,
как date-picker); минимум 24 у индикатора tabs (строка токенов плана); запись решений в `decisions.md` (S2
отклонён, лестница FAB 40/56/96, standard group отложена, `stickyHeader`, textarea Q1, dropdown Q2/Q3, lazy в.1,
API статуса timeline); `>`/тег-селекторы — чинить в коде, где можно, иначе вписать исключение (обёртка слота
`:where(img, video)` у card/list, `:where(h1…h6, p)` у subheader).

## 6. Отложено решениями — фаза 2 не берёт без слова владельца

| Что | Где решено | Затронутые планы |
|---|---|---|
| Q56-А «план кирпичиков»: очередь снекбаров B4.9c, кламп панелей B4.2, ссылки `to` в rail/bar/drawer B5.1a, клавиатура toolbar B5.6d (+ B5.7d, B5.8a, B7.3c, B6.10f, B2.3b, B13.3b) | `kit-bugs/questions.md:404-414`, `decisions.md:112,157` | snackbar Ш5а, menu Ш2-кламп, dropdown Г3, nav-bar Ш5, drawer Ш6, rail Ш9, toolbar Ш3. **Файла «плана кирпичиков» в репо нет** |
| Панели layout (`m-layout-pane`, `useListDetail`) | владелец 2026-10-07, `layout.md:211` | layout Ш7 |
| Переменная высота virtual-scroll | `virtual-scroll.md:312` | virtual-scroll Ш10 |
| ClamShell | блок: нет исходников Compose (кэш Gradle) | shape Ш1 |
| Документация в docs_v2/v3 | вне репо кита | ≈ 15 шагов «Документация» |
| Рендеры `current.webp` | инфраструктура съёмки временная, вне git (`common.md` §4) | text-field, textarea, number-input, dropdown, otp-input |
| Морф/пружины (кроме двух исключений), pressed 12%, ступени скруглений S2 | `decisions.md:24`, СВ-1, summary `button-family-m3_2026-10-07.md` | S1–S4 |

## 7. Системный слой S1–S10

| ID | Статус | Где не применено / что осталось |
|---|---|---|
| S1 pressed | отменён (12%) | — |
| S2 скругления Expressive | отменён | не записан в `decisions.md`; `common.md` и `roadmap.md` всё ещё «добавить» |
| S3 морф / S4 пружины | отменены, 2 исключения (toggle-кнопки, FAB menu) | `common.md` и `index.md` не знают исключений |
| S5 `density` | сделан | `roadmap.md` (loading 24/48/64, progress без оси) расходится с кодом |
| S6 emphasized | **нет** | развилка N2; трекинга нет в `typescale` (`_mixins.scss:140-145`) |
| S7 иконки | частично | W70-А: `MButtonIcon` selected, активная вкладка |
| S8 мишень 48 | частично | `touch-target` (`_mixins.scss:189-209`) применён у кнопок compact/icon/FAB/ext FAB, group, checkbox, radio, switch, chip, date-picker, pagination, breadcrumbs, snackbar. Нет: чип `removal="button"` (мёртвая), образцы color-picker, полосы hue/alpha (40), период time-picker; спорно (N1): `MButton default`, segmented; search (WIP) — удаление запроса 40 |
| S9 ветка `selected` | частично | полный контракт только у кнопок; у прочих `checked`/`on`/`active`/`current` и разные ключи (`container/content`, `container/color`, `container/label`, `color`) |
| S10 роли цвета | сделан | — |

## 8. Найдено вне планов

- `useOverlayDismiss.ts:71-82`: каждый `MOverlay`, в том числе закрытый, держит `window keydown` и click-outside
  (класс EN-10; меню это уже вылечило `pause/resume`). S.
- Tooltip через слот-пропсы: в серверном HTML `aria-describedby="v-0-6"` указывает на отсутствующий элемент
  (`overlays/ssr.probe.ts`). S.
- MTable: `tabindex`/`role="region"` у широкой таблицы появляются только после гидрации (`useTableControl.ts:56-81`).
- Шевроны подвала таблицы зеркалятся своим правилом, а не `MIcon mirror` (`fragments/table/pagination/index.vue:224-226`).
- MHotkey: `aria-disabled` на `role="img"` (`hotkey/index.vue:86`) — в ARIA 1.2 не поддерживается.
- MApp: второй `MApp` проверяется через `process.env.NODE_ENV` (`app/index.vue:49`), остальной кит — `import.meta.dev`.
- Горизонтальная лента virtual-scroll: End/Home нативно не работают, план обещает.
- Устаревшие записи `decisions.md`: `:147` (ограничение `dir` у телепортированных — родитель починил), `:191`
  (timeline всё ещё `anywhere` — в коде `break-word`).
- Справочники: `coverage-matrix.md`/`index.md` числят button group и rich tooltip «нет в ките» (есть);
  `agent-brief.md:9` — старый путь репозитория.
- Бриф аудита ошибался: новый файл фикстуры в существующей папке сервер **не** подхватывает сам — нужен
  `touch playground/app/utils/fixtures.ts`.
- `vue-tsc`: красный только в WIP-демо и `fixtures/timeline/matrix.vue` (S4, `MColor` → `MAccentColor`); аудит-фикстуры чистые.

## 9. Пункты в занятых родителем файлах

| Файл | Пункт | Кто |
|---|---|---|
| `composables/popover/usePopover.ts` | кламп высоты меню и панелей dropdown/autocomplete (B4.2, отложен Q56-А); `DEFAULT_Z_INDEX = '999'` (`:135`); фактическая сторона после переворота для `--ui-menu-origin` | фаза 2 / кирпичики |
| `composables/slider/createRangeKeyboardController.ts` | Shift ±10 у холста color-picker — можно сделать локально в `Canvas.vue:99-105`, файл не нужен | фаза 2 локально |
| `components/ui/app-bar/**` | `windowY`, safe-area бара вне `m-layout`, переходы мимо `g()`; SSR подзаголовка `MAppBarTitle`, вклад бара в main | родитель |
| `utils/layout/carve.ts`, `useLayout.ts:227-233`, `zone.ts:54-76` | safe-area бара вне layout; вклад бара в main; начальная прокрутка | родитель |
| `components/ui/breadcrumbs/**` | перекрытие на таче (в дереве уже `margin-block: 0`), `calc(-1 * …)` в `.vue` (`:146`) | родитель |
| `components/ui/rating/**`, `fixtures/rating/` | указатель/превью/правый клик — исправлено (пробы зелёные); `stress.vue` | родитель |
| `composables/selection/useSelectionGroup.ts` | порядок `multiple` | родитель |
| `directives/ripple.ts` | рипл на Space, модульный `keyboardRipple` | родитель |
| `components/ui/text-field/index.vue`, `textarea/index.vue` | dev-предупреждение о безымянности | родитель |
| `composables/overlay/useScrollLock.ts` | двойная блокировка (аудитом не воспроизведена; смежная утечка — невидимое открытое меню, чинится в свободном `ui/menu/index.vue`), модульное состояние | родитель |
| `components/ui/system-bar/tests/**` | — (план сделан) | — |

## 10. Вопросы S1–S10 прогона 2 — где они в коде (для фазы 2, по рекомендации)

| # | Рек. | Место |
|---|---|---|
| S1 | Б | `dropdown/index.vue:175,201` → `MDropdownProps<TItem,TValue>` (`dropdown/props.ts:130`); `autocomplete/index.vue:211,239` |
| S2 | В | не делать — time-picker шаг 7 отменён |
| S3 | Б | не добавлять, поправить `data/table.md` Ш8 |
| S4 | А | `demo/crm/data/crmTypes.ts:82`, `demo/orders/data/history.ts:15`, `fixtures/timeline/matrix.vue:16,36` (vue-tsc ещё видит `demo/crm/details/CrmDealActivity.vue:15`, `demo/orders/OrderDetailsSheet.vue:69`, `fixtures/timeline/matrix.vue:61`) |
| S5 | А | строки из вопроса: `crm/tasks/CrmTasksTab.vue:15`, `orders/OrdersSideColumn.vue:15`, `crm/new-deal/CrmDateField.vue`, `orders/NewOrderDeliveryFields.vue` |
| S6 | Б | не делать (loading/progress/dropdown/table) |
| S7 | Б | оставить `ariaLabel` (`ui/loading/props.ts:30`) |
| S8 | А | `timeline/props.ts:11,51`, `fragments/timeline/divider/index.vue:33,38,65`, `timeline/_index.scss:59-68` |
| S9 | А | toolbar `layout` → `orientation`: места — §3 «Навигация» |
| S10 | А | `progress/props.ts:66-67`, `progress/index.vue:33`, `linear/index.vue:9,23`, `circular/index.vue:9,39`, `useProgress.ts:33,83,87,94,108` |

## 11. Пробы и фикстуры

| Группа | Файлов | Тестов | Прошло | Упало | Все падения — |
|---|---:|---:|---:|---:|---|
| form | 9 | 54 | 46 | 8 | дефекты §3 |
| overlays | 6 | 26 | 19 | 7 | 6 дефектов + 1 ожидание пробы |
| feedback | 5 + хелпер | 41 | 31 | 9 (+1 skip) | дефекты |
| navigation | 7 + хелпер | 48 | 48 | 0 | — |
| foundation | 9 | 35 | 35 | 0 | — |
| fields | 8 + хелпер | 40 | 39 | 1 | IME |
| pickers | 4 | 25 | 25 | 0 | — |
| containment | 9 | 38 | 36 | 2 | дефекты |
| buttons | 7 | 38 | 34 | 4 | S8 |

Добавлены фикстуры (20 файлов, ESLint и Stylelint чистые, vue-tsc их не ругает): `app/audit-skip-link.vue`,
`autocomplete/audit-async.vue`, `checkbox/audit-long.vue`, `chip/audit-anatomy.vue`, `chip/audit-group.vue`,
`feedback/audit-feedback.vue`, `feedback/audit-snackbar.vue`, `icon/audit-mirror.vue`, `list/audit-density.vue`,
`list/audit-media.vue`, `navigation/audit-rail-toggle.vue`, `number-input/audit-bounds.vue`,
`overlay/audit-overlays.vue`, `radio/audit-form.vue`, `slider/audit-geometry.vue`, `switch/audit-icons.vue`,
`audit-form/{form-renderer,selection-group}.vue`, `audit-layout/window-class.vue`, `audit-rating/pointer.vue`.
Они не в git и не связаны с e2e; удалить или превратить в `stress.vue` — решение фазы 2.

## 12. Не проверено

Глазами — ничего (тёмная тема, forced colors скриншотами, анимации; концепты сверены по геометрии и ролям
пробами, а не визуально). Только Chromium. Полные `lint`/`lint:scss`/`test`/e2e не запускались (группы гоняли
scoped vitest/eslint/stylelint по своим файлам — зелёные). Долгое нажатие тултипа на таче, вложенность модалок,
рецепт полноэкранного поиска и всё в docs_v2/v3.
