# Vuetify → PrimeTime: проверенная дельта

## Существующие возможности → `components-should-update`

- `VAppBar`, `VAppBarNavIcon`, `VAppBarTitle` → `MAppBar` + `MButtonIcon` + slots.
- `VBottomNavigation` → `MNavigationBar`; `VBottomSheet` → текущий modal `MSheet`.
- `VBtn`, `VBtnGroup`, `VBtnToggle`, `VFab`, `VIconBtn` → button family.
- `VCard` и `VCardActions/Item/Subtitle/Text` → `MCard` props + media/header/default/actions slots.
- `VDatePicker`, Controls, Header, Month, Years → `MDatePicker`, HeaderNav, DayGrid, YearGrid.
  `VDateInput` → существующий `MDialogDate` family.
- `VDataTable`, Column, Footer, Headers, Row, Rows → `MTable`, type descriptors,
  Header и Pagination; server/virtual/grouping остаются gap внутри table plan.
- `VExpansionPanel`, Text, Title, Panels → expansion family и slots.
- `VField`, `VFieldLabel`, `VInput`, `VLabel`, `VMessages`, `VSelectionControl*`,
  `VCounter` → text-field/checkbox/radio/switch + form composables.
- `VFooter`, `VLayout`, `VLayoutItem`, `VMain` → layout family.
- `VList`, `VListItem`, Action, Media, Subtitle → list/list-item props и slots.
  `VListGroup` и `VListChildren` также покрыты существующей list family по
  проверке владельца; отдельные новые public/sub capabilities не требуются.
- `VMenu`, `VNavigationDrawer`, ProgressCircular/Linear, Radio/Group,
  RangeSlider, Responsive, Select, Slider/Thumb/Track, Snackbar, SpeedDial,
  Switch, SystemBar, Tab/Tabs, TextField, TimePicker/Clock/Controls/Field,
  Toolbar/Items/Title, Tooltip → соответствующие существующие семьи.
- `VDialogTransition` → dialog / vue-final-modal transition strategy.

## Реально отсутствующие возможности → отдельные планы

См. [roadmap.md](roadmap.md). Важные семантические решения: `VSheet` → новый
`MSurface` (потому что `MSheet` уже bottom sheet); `VTabsWindow*` → новый
generic `MWindow`; `VDatePickerMonths` отложен в
[`pendind-components`](../pendind-components/date-picker-months.md), потому что
существующий `MDatePicker` уже закрывает текущую подтверждённую задачу.

## Инфраструктура вне нового UI API

`VHover`/focus helper API остаётся в
[`pendind-components`](../pendind-components/hover-focused.md). Stale active
`useHover` plan удалён: renderless component/directive/composable boundary ещё
не утверждён.

`VChipGroupSymbol` является внутренним injection symbol, а не визуальной
capability. PrimeTime dedicated chip-group context документируется внутри
`MChipGroup` и не получает отдельный public component/roadmap item.

`VEmptyState` перенесён в
[`low-priority-compponents`](../low-priority-compponents/empty-state.md): его
текущая роль компонуется из существующих surface/icon/button primitives и не
блокирует более фундаментальные collection/navigation/data capabilities.

`VImg`/candidate `MImg` перенесён в
[`pendind-components`](../pendind-components/image.md): public component API
должен проектироваться вместе с image plugin/provider, `imgProxy`, source
factory, responsive transforms, SSR и security policy, а не как временный
тонкий wrapper.

`VSkeletonLoader` больше не считается одиночной vuetify-run capability. Работа
вынесена в отдельную системную фазу
[`phases/skeletons`](../phases/skeletons/index.md), охватывающую primitives,
recipes и layout/token parity для всех подходящих PrimeTime компонентов.

`VSlideGroup`/`VSlideGroupItem` — не carousel, а scrollable overflow strip,
однако семья перенесена в
[`low-priority-compponents`](../low-priority-compponents/slide-group/index.md):
текущие consumers используют wrap/native scroll до появления подтверждённого
спроса на arrows, drag, RTL normalization и active-item reveal.

`VCalendar` family перенесена в high-priority pending
[`calendar`](../pendind-components/calendar/index.md). Это dependency-gated
composite: реализация начинается после интеграционного тестирования date/time,
registry lifecycle, scroll/virtualization, drag, overlay, responsive SSR и
token foundations.

`VCarousel`/`VCarouselItem` перенесены в
[`low-priority-compponents`](../low-priority-compponents/carousel/index.md):
семья должна позднее компоновать `MWindow`, tested gesture/timer foundations и
image pipeline, не создавая второй panel engine или autoplay по умолчанию.

`VDataIterator` перенесён в
[`low-priority-compponents`](../low-priority-compponents/data-iterator.md):
при возвращении сначала рассматривается headless `useDataIterator`, общий для
table/card/list collections, после утверждения client/server data boundaries.

`VInfiniteScroll`, `VInfiniteScrollIntersect`, `VVirtualScroll` и
`VVirtualScrollItem` консолидированы в один approved headless
[`useVirtualScroll`](virtual-scroll.md). Loading/fetch/cursor/error остаются у
consumer; composable предоставляет range, geometry, boundaries, scroll state,
navigation и anchoring с deterministic SSR через `useSSRWindowSize`.

`VParallax` перенесён в
[`pendind-components`](../pendind-components/parallax.md) рядом с `MImg`:
composite должен переиспользовать будущие image provider/source/responsive
geometry contracts и tested motion policy, а не вводить параллельный `src` API.

`VPullToRefresh` перенесён в
[`low-priority-compponents`](../low-priority-compponents/pull-to-refresh.md):
touch gesture требует подтверждённого product flow и browser/device testing
scroll/overscroll/drag arbitration; data refresh остаётся у consumer.

`VTreeview` family перенесена в
[`pendind-components`](../pendind-components/treeview/index.md): recursive
composite требует approved normalization/cascade/lazy/keyboard contracts и
semantic role/tabindex extension существующего `MListItem` перед реализацией.

`VWindow` и вся `VStepper` family перенесены вместе в pending
[`window`](../pendind-components/window/index.md) и
[`stepper`](../pendind-components/stepper/index.md). Stepper зависит от Window;
обе семьи требуют отдельной mount/inert/motion/guard/focus integration phase.

`VSparkline`-derived bar/line/area/tooltip plans вынесены в отдельный
[`paid-charts-plab`](../paid-charts-plab/index.md). Lab должен решить единый
geometry/accessibility foundation, consolidated-vs-separate public API и
commercial package boundary до реализации.

`VDefaultsProvider`, `VThemeProvider`, `VLocaleProvider` покрываются Nuxt
module config, theme store и i18n. `VNoSsr` не получает PrimeTime-обёртку:
Nuxt `ClientOnly` и lazy hydration primitives уже закрывают эту задачу без
нового публичного API. Из app/provider набора отдельно планируется только
`MApp`.
