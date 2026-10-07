# Покрытие каталога M3 китом

Обновлено 2026-10-07. Каталог m3.material.io/components (35 компонентов на дату исследования)
против компонентов кита. Прежнее содержимое файла — сверка с Vuetify — в истории git.

## Компоненты M3 → кит

| Группа M3 | Компонент M3 | В ките | Вердикт | План |
|---|---|---|---|---|
| Buttons | Button groups | — | нет в ките | [group](button/group.md) |
| Buttons | Buttons | `MButton` | переработка | [button](button/index.md) |
| Buttons | Extended FABs | `MButtonExtendedFab` | переработка | [extended-fab](button/extended-fab.md) |
| Buttons | FAB menu | `MFabMenu` | переработка | [fab-menu](button/fab-menu.md) |
| Buttons | FABs | `MButtonFab` | переработка | [fab](button/fab.md) |
| Buttons | Icon buttons | `MButtonIcon` | переработка | [icon](button/icon.md) |
| Buttons | Segmented buttons | `MButtonSegmented` | дрейф | [segmented](button/segmented.md) |
| Buttons | Split buttons | `MButtonSplit` | переработка | [split](button/split.md) |
| Date & time pickers | Date pickers | `MDatePicker`, `MDialogDate` | переработка | [date-picker](inputs/date-picker.md) |
| Date & time pickers | Time pickers | `MTimePicker` | переработка | [time-picker](inputs/time-picker.md) |
| Loading & progress | Loading indicator | `MLoading` | дрейф | [loading](feedback/loading.md) |
| Loading & progress | Progress indicators | `MProgress` | дрейф | [progress](feedback/progress.md) |
| Navigation | Navigation bar | `MNavigationBar` | переработка | [navigation-bar](navigation/navigation-bar.md) |
| Navigation | Navigation drawer | `MNavigationDrawer` | переработка | [navigation-drawer](navigation/navigation-drawer.md) |
| Navigation | Navigation rail | `MNavigationRail` | переработка | [navigation-rail](navigation/navigation-rail.md) |
| Sheets | Bottom sheets | `MSheet` | дрейф | [sheet](overlays/sheet.md) |
| Sheets | Side sheets | — | нет в ките | [sheet](overlays/sheet.md) (раздел) |
| Прочие | App bars | `MAppBar` | дрейф | [app-bar](navigation/app-bar.md) |
| Прочие | Badges | `MBadge` | дрейф | [badge](feedback/badge.md) |
| Прочие | Cards | `MCard` | дрейф | [card](containment/card.md) |
| Прочие | Carousel | — | нет в ките | [carousel](../low-priority-compponents/carousel/index.md) |
| Прочие | Checkbox | `MCheckbox` | дрейф | [checkbox](form/checkbox.md) |
| Прочие | Chips | `MChip` (+ `MChipGroup`) | переработка | [chip](form/chip.md) |
| Прочие | Dialogs | `MDialog` | дрейф | [dialog](overlays/dialog.md) |
| Прочие | Divider | `MDivider` | дрейф | [divider](containment/divider.md) |
| Прочие | Lists | `MList`, `MListItem`, `MListSubheader` | переработка | [list](containment/list.md) |
| Прочие | Menus | `MMenu` | переработка | [menu](overlays/menu.md) |
| Прочие | Radio button | `MRadio`, `MRadioGroup` | дрейф | [radio](form/radio.md) |
| Прочие | Search | `MSearch` (только строка) | переработка | [search](inputs/search.md) |
| Прочие | Sliders | `MSlider` | переработка | [slider](form/slider.md) |
| Прочие | Snackbar | `MSnackbar` | переработка | [snackbar](feedback/snackbar.md) |
| Прочие | Switch | `MSwitch` | дрейф | [switch](form/switch.md) |
| Прочие | Tabs | `MTabs` | дрейф | [tabs](navigation/tabs.md) |
| Прочие | Text fields | `MTextField`, `MTextarea`, `MDropdown`, `MAutocomplete` | дрейф | [text-field](inputs/text-field.md), [textarea](inputs/textarea.md), [dropdown](inputs/dropdown.md), [autocomplete](inputs/autocomplete.md) |
| Прочие | Toolbars | `MToolbar` | переработка | [toolbar](navigation/toolbar.md) |
| Прочие | Tooltips | `MTooltip` (plain; rich нет) | дрейф | [tooltip](overlays/tooltip.md) |

**Итог по каталогу M3:**
- 32 из 35 компонентов в ките есть;
- 3 отсутствуют: button groups, side sheets, carousel;
- rich tooltip — вариант внутри tooltips;
- совпадения «как есть» нет ни у одного компонента из каталога.

Главные системные причины расхождений — шкалы масштаба, формы и цвета состояний (S1–S9 в
[common.md](common.md)).

## Компоненты кита вне каталога M3 (авторские)

Вид остаётся авторским (решение владельца), от M3 берётся только система.

| Компонент кита | Из какой части M3 выводится система | План |
|---|---|---|
| `MAlert`, `MBanner` | роли цвета, слой состояний, иконки | [alert](feedback/alert.md), [banner](feedback/banner/index.md) |
| `MAvatar` | аватары внутри app bar, search, list | [avatar](data/avatar.md) |
| `MBreadcrumbs`, `MPagination` | текстовые кнопки, тональный выбор | [breadcrumbs](navigation/breadcrumbs/index.md), [pagination](navigation/pagination.md) |
| `MChipGroup`, `MSelectionGroup`, `MSelectionItem` | выбор и roving | [chip-group](form/chip-group.md), [selection-group](form/selection-group.md), [selection-item](form/selection-item.md) |
| `MColorPicker`, `MColorInput` | слайдер, поля, выбор | [color-picker](inputs/color-picker/index.md), [color-input](inputs/color-input.md) |
| `MExpansionPanel(s)` | expandable list item | [expansion-panel](containment/expansion-panel.md) |
| `MFileInput`, `MFileUpload` | поля, кнопки, прогресс | [file-input](inputs/file-input.md), [file-upload](inputs/file-upload/index.md) |
| `MFormRenderer` | поля и кнопки | [form-renderer](form/form-renderer.md) |
| `MHotkey`, `useHotkey` | подписи сочетаний в меню | [hotkey-visual](foundation/hotkey.md), [hotkey](foundation/use-hotkey.md) |
| `MNumberInput`, `MOtpInput` | семейство полей | [number-input](inputs/number-input.md), [otp-input](inputs/otp-input/index.md) |
| `MRating` | иконки, выбор | [rating](form/rating.md) |
| `MTable` | data tables из Material 2, списки M3 | [table](data/table.md) |
| `MTimeline` | роли цвета, иконки | [timeline](data/timeline/index.md) |
| `MSystemBar` | — | [system-bar](foundation/system-bar.md) |
| `MSurface`, `MShape`, `MIcon` | стили M3: поверхности, формы, иконки | [surface](foundation/surface.md), [shape](foundation/shape.md), [icon](foundation/icon.md) |
| `MApp`, `MOverlay`, `MLazy`, раскладка | основы раскладки M3, scrim | [app](foundation/app.md), [overlay](overlays/overlay.md), [lazy](foundation/lazy.md), [layout](foundation/layout.md) |
| `MConfirmEdit` (снят) | — | [confirm-edit](inputs/confirm-edit.md) |
