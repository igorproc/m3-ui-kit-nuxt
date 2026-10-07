# Карта планов: кит как прямой наследник M3

Обновлено 2026-10-07. Исследование соответствия кита последней версии Material 3 (Material You,
редакция Expressive) по всем 67 компонентам кита и по компонентам M3, которых в ките нет.

- **Как читать план и что значат вердикты** — [common.md](common.md): системный слой S1–S10,
  открытые системные вопросы, шаблон плана, правила рендеров.
- **Покрытие каталога M3** — [coverage-matrix.md](coverage-matrix.md).
- **Порядок работ волнами** — [roadmap.md](roadmap.md).

Все планы лежат в `components-should-update/<категория>/` (папка `vuetify-run/` удалена, её планы перенесены сюда).
Рендеры (`current.webp` — настоящий компонент кита, `concept.webp` — целевой вид) лежат в
`../renders/<name>/`.

## Решения владельца, принятые в ходе исследования (2026-10-07)

| Решение | Где записано |
|---|---|
| Эталон — последняя M3 (Material You / Expressive); планы про компоненты кита, не про docs | [common.md](common.md) §1 |
| Компоненты, которых нет в M3, развиваются в текущем видении (вердикт `авторский`), без редизайна | [common.md](common.md) §1, §3 |
| Expressive-анимации в вебе не делаем: пружины (S4) и морф формы (S3) отклонены; статичная форма состояния допустима | [common.md](common.md) S3, S4 |
| Ось масштаба — только `density` с тремя ступенями `compact \| default \| comfortable`; XS–XL нет. Кнопки: 32 / 40 / 56 | [common.md](common.md) S5 |
| `tonal` у кнопок — `<role>-container`, как в ките | [button/index.md](button/index.md) |
| Split-кнопка без «круглого» открытого состояния | [button/split.md](button/split.md) |
| В каждом плане — раздел «Предложения по UX» (расширения сверх паритета, решает владелец) | [common.md](common.md) §5 |
| Планы `components-should-update/` разложены по категориям | эта карта |

## Сводка вердиктов

| Вердикт | Сколько | Компоненты |
|---|---:|---|
| `совпадает` | 1 | shape |
| `дрейф` | 20 | layout, icon, tabs, card, divider, sheet (bottom), dialog, tooltip (plain), checkbox, radio, switch, badge, text-field, textarea, dropdown, autocomplete, app-bar, progress, loading, segmented |
| `переработка` | 18 | button, icon button, FAB, extended FAB, split, fab-menu, chip, slider, navigation-bar, navigation-rail, navigation-drawer, menu, list, toolbar, snackbar, search, date-picker, time-picker |
| `нет в ките` | 4 | button group, side sheet, rich tooltip, carousel |
| `авторский` | 27 | list-subheader, surface, overlay, app, lazy, form-renderer, system-bar, chip-group, rating, selection-group, selection-item, otp-input, number-input, expansion-panel(s), alert, banner, table, pagination, breadcrumbs, timeline, avatar, color-picker, color-input, file-input, file-upload, hotkey, confirm-edit (снят) |

## Дефекты, найденные рендерами (не было в аудите)

Это поведение, видимое глазом на `current.webp`. Каждый дефект — первый шаг в своём плане.

| Компонент | Дефект | План |
|---|---|---|
| toolbar | выбранный пункт не подсвечивается ни в single, ни в multiple | [toolbar](navigation/toolbar.md) шаг 1 |
| timeline | рейка рвётся между элементами | [timeline](data/timeline/index.md), [divider](data/timeline/divider.md) |
| file-input | лейбл налезает на значение при выбранных файлах | [file-input](inputs/file-input.md) шаг 1 |
| file-upload | `autoStart` не запускает файлы начальной модели | [file-upload](inputs/file-upload/index.md) шаг 1 |
| autocomplete | начальное `v-model` не показывается до blur (и в SSR) | [autocomplete](inputs/autocomplete.md) шаг 1 |
| date-picker | вид годов открывается на 1926 | [date-picker](inputs/date-picker.md) |
| menu | меню с изначально открытым `v-model` невидимо | [menu](overlays/menu.md) |
| segmented | в узком контейнере подписи ломаются по буквам (следствие переносов фазы D) | [segmented](button/segmented.md), [color-picker](inputs/color-picker/index.md) вопрос 1 |
| color-picker | образец не выбирается при другом регистре или формате модели | [color-picker](inputs/color-picker/index.md) шаг 1 |
| hotkey | `arrowup` рисуется как «ARROWUP» | [hotkey-visual](foundation/hotkey.md) шаг 1 |
| loading | `inline` внутри `<p>` даёт hydration mismatch | [loading](feedback/loading.md) шаг 1 |
| rating | заливка звезды смещена на 8 — «двойная звезда» | [rating](form/rating.md) |
| split | «×» — это `plus` с `rotate(45deg)`, разделитель — волосяная линия | [split](button/split.md) |
| text-field | `float`-лейбл анимируется 150 мс вопреки решению «лейбл не движется»; `inset` у outlined уходит в вырез | [text-field](inputs/text-field.md) |

## Все планы

### Кнопки — `components-should-update/button/`

| Компонент | Вердикт | План | Рендеры |
|---|---|---|---|
| MButton (семейство) | переработка | [index](button/index.md) | `button` |
| MButtonIcon | переработка | [icon](button/icon.md) | `button-icon` |
| MButtonFab | переработка | [fab](button/fab.md) | `button-fab` |
| MButtonExtendedFab | переработка | [extended-fab](button/extended-fab.md) | `button-fab` |
| MButtonSplit | переработка | [split](button/split.md) | `button-split` |
| MButtonSegmented | дрейф | [segmented](button/segmented.md) | `button` |
| MButtonGroup | нет в ките | [group](button/group.md) | `button-group` |
| MFabMenu | переработка | [fab-menu](button/fab-menu.md) | `fab-menu` |

### Поля и пикеры — `components-should-update/inputs/`

| Компонент | Вердикт | План | Рендеры |
|---|---|---|---|
| MTextField | дрейф | [text-field](inputs/text-field.md) | `text-field` |
| MTextarea | дрейф (+авторское) | [textarea](inputs/textarea.md) | `textarea` |
| MNumberInput | авторский | [number-input](inputs/number-input.md) | `number-input` |
| MOtpInput | авторский | [otp-input](inputs/otp-input/index.md) (+ field, group, separator) | `otp-input` |
| MDropdown | дрейф | [dropdown](inputs/dropdown.md) | `dropdown` |
| MAutocomplete | дрейф | [autocomplete](inputs/autocomplete.md) | `autocomplete` |
| MSearch | переработка | [search](inputs/search.md) | `search` |
| MDatePicker + MDialogDate | переработка | [date-picker](inputs/date-picker.md) | `date-picker` |
| MTimePicker | переработка | [time-picker](inputs/time-picker.md) | `time-picker` |
| MColorPicker | авторский | [color-picker](inputs/color-picker/index.md) (+ canvas, edit, preview, swatches) | `color-picker` |
| MColorInput | авторский | [color-input](inputs/color-input.md) | `color-picker` |
| MFileInput | авторский | [file-input](inputs/file-input.md) | `file-upload` |
| MFileUpload | авторский | [file-upload](inputs/file-upload/index.md) (+ dropzone, item, list) | `file-upload` |
| MConfirmEdit | авторский (снят) | [confirm-edit](inputs/confirm-edit.md) | `confirm-edit` |

### Выбор и формы — `components-should-update/form/`

| Компонент | Вердикт | План | Рендеры |
|---|---|---|---|
| MChip | переработка | [chip](form/chip.md) | `chip` |
| MChipGroup | авторский | [chip-group](form/chip-group.md) | `chip-group` |
| MCheckbox | дрейф | [checkbox](form/checkbox.md) | `checkbox` |
| MRadio (+group) | дрейф | [radio](form/radio.md) | `radio` |
| MSwitch | дрейф | [switch](form/switch.md) | `switch` |
| MSlider | переработка | [slider](form/slider.md) | `slider` |
| MRating | авторский | [rating](form/rating.md) | `rating` |
| MSelectionGroup / Item | авторский | [selection-group](form/selection-group.md), [selection-item](form/selection-item.md) | — |
| MFormRenderer | авторский | [form-renderer](form/form-renderer.md) | `form-renderer` |

### Навигация — `components-should-update/navigation/`

| Компонент | Вердикт | План | Рендеры |
|---|---|---|---|
| MNavigationBar | переработка | [navigation-bar](navigation/navigation-bar.md) | `navigation-bar` |
| MNavigationRail | переработка | [navigation-rail](navigation/navigation-rail.md) | `navigation-rail` |
| MNavigationDrawer | переработка | [navigation-drawer](navigation/navigation-drawer.md) | `navigation-drawer` |
| MTabs | дрейф | [tabs](navigation/tabs.md) | `tabs` |
| MAppBar | дрейф | [app-bar](navigation/app-bar.md) | `app-bar` |
| MToolbar | переработка | [toolbar](navigation/toolbar.md) | `toolbar` |
| MBreadcrumbs | авторский | [breadcrumbs](navigation/breadcrumbs/index.md) (+ item, divider) | `pagination` |
| MPagination | авторский | [pagination](navigation/pagination.md) | `pagination` |

### Оверлеи — `components-should-update/overlays/`

| Компонент | Вердикт | План | Рендеры |
|---|---|---|---|
| MDialog | дрейф | [dialog](overlays/dialog.md) | `dialog` |
| MSheet (+ side sheet) | дрейф / нет в ките | [sheet](overlays/sheet.md) | `sheet` |
| MMenu | переработка | [menu](overlays/menu.md) | `menu` |
| MTooltip | дрейф / rich нет в ките | [tooltip](overlays/tooltip.md) | `tooltip` |
| `$modals` | — | [modals](overlays/modals.md) (прежний план API) | — |
| MOverlay | авторский | [overlay](overlays/overlay.md) | — |

### Контейнеры — `components-should-update/containment/`

| Компонент | Вердикт | План | Рендеры |
|---|---|---|---|
| MCard | дрейф | [card](containment/card.md) | `card` |
| MList (+item, subheader) | переработка | [list](containment/list.md), [list-subheader](containment/list-subheader.md) | `list` |
| MDivider | дрейф | [divider](containment/divider.md) | `divider` |
| MExpansionPanel(s) | авторский | [expansion-panel](containment/expansion-panel.md) | `expansion-panel` |
| MCarousel | нет в ките | [carousel](../low-priority-compponents/carousel/index.md) (+ item) | `carousel` |

### Обратная связь — `components-should-update/feedback/`

| Компонент | Вердикт | План | Рендеры |
|---|---|---|---|
| MBadge | дрейф | [badge](feedback/badge.md) | `badge` |
| MProgress | дрейф | [progress](feedback/progress.md) | `progress` |
| MLoading | дрейф | [loading](feedback/loading.md) | `progress` |
| MSnackbar | переработка | [snackbar](feedback/snackbar.md) | `snackbar` |
| MAlert | авторский | [alert](feedback/alert.md) | `alert` |
| MBanner | авторский | [banner](feedback/banner/index.md) (+ actions) | `alert` |

### Данные — `components-should-update/data/`

| Компонент | Вердикт | План | Рендеры |
|---|---|---|---|
| MTable | авторский | [table](data/table.md) | `table` |
| MTimeline (+item) | авторский | [timeline](data/timeline/index.md) (+ item, divider) | `timeline` |
| MAvatar | авторский | [avatar](data/avatar.md) | `timeline` |
| MHotkey / useHotkey | авторский | [hotkey-visual](foundation/hotkey.md), [hotkey](foundation/use-hotkey.md) | `hotkey` |

### Основа — `components-should-update/foundation/`

| Компонент | Вердикт | План | Рендеры |
|---|---|---|---|
| Раскладка (layout, main, container, row, col, spacer, responsive) | дрейф | [layout](foundation/layout.md) | `layout` |
| MShape | совпадает | [shape](foundation/shape.md) | `surface` |
| MIcon | дрейф | [icon](foundation/icon.md) | `icon` |
| MSystemBar | авторский | [system-bar](foundation/system-bar.md) | `icon` |
| MSurface | авторский | [surface](foundation/surface.md) | `surface` |
| MApp | авторский | [app](foundation/app.md) | — |
| MLazy | авторский | [lazy](foundation/lazy.md) | — |

## Что не переписывалось

- `pendind-components/*` (stepper, treeview, calendar, window и др.) — компонентов нет ни в ките,
  ни в M3, кроме `date-picker-months.md`, на который ссылается план date-picker.
- `low-priority-compponents/*`, кроме carousel (это компонент M3).
- `paid-charts-plab/*`, `phases/*`, `layout-zone-gaps.md`, `overlay-top-layer.md`.
- Папка `vuetify-run/` удалена 2026-10-07 по решению владельца: все переписанные планы перенесены сюда
  по категориям. `virtual-scroll.md` (план композабла `useVirtualScroll`) перенесён в
  [foundation/virtual-scroll.md](foundation/virtual-scroll.md). `summary.md` и `reuse-map.md`
  (история инициативы Vuetify) удалены, они есть в истории git.
