# verify-g4: B8, B9, N.2, N.3, N.4, N.6 (working tree = HEAD 64fb4dc + uncommitted)

Paths relative to `kit/src/runtime`. `npm run lint:scss`: 156 sheets, clean, no "unresolved legacy token path" block (so no dead dash-form rules).

## B8. Buttons, feedback, chips

### B8.1 Selected text icon toggle without `color`
status: present — `assets/stylesheet/components/button/_schemes.scss:75-83`: `.ui-button--current.ui-button--text {color: inherit}` (0,2,0) comes after `.ui-button.ui-button--text` (0,2,0) and wins. A selected text toggle has no scheme rule of its own (`selected == base`, `abstracts/_functions.scss:200`, nothing emitted at `_schemes.scss:35-45`), so it stays `inherit`.
kind: bug
fix: `&--current` skips selected: `&.ui-button--text:not(.ui-button--selected)` (outlined has its own 3-class selected rule); the comment at `_schemes.scss:69-74` states that intent.

### B8.2a Compact FAB / extended FAB (40) get no 48 target
status: present — `button/fab/index.vue:51`, `button/extended-fab/index.vue:84` (`overflow: hidden` would clip an `::after`; no target rule). Only `button/index.vue:266-271` has one (`--compact`, `.ui-icon-button`). Compact = 40.
kind: bug
fix: drop `overflow: hidden` on the FAB roots (the ripple container clips itself; the extended label clips, `extended-fab/index.vue:111`) and reuse the button's `::after` target rule.

### B8.2b Icon-only `MButton` in `MButtonGroup` gets no 48 target
status: present — `button/index.vue:266-267` covers `--compact` and `.ui-icon-button`, not `--icon-only`. Group items are `UiButton` at default = 40 (`button/group/index.vue:6-17`), neighbours 2rem apart.
kind: fork
fix: extend `--icon-only` boxes under 48.
question: Как давать 48-мишень icon-only кнопкам в MButtonGroup, если соседи в 2rem друг от друга?
А: со всех сторон, как у compact: просто, но мишени соседей перекрываются у стыка.
Б: только по блочной оси (40×48): соседей не задевает.
В: не трогать (40 проходит WCAG 2.5.8 AA).
Рекомендация: Б — без перехвата у стыка.

### B8.3a No name warning for icon-only group items / segmented
status: present — `button/group/index.vue:55` warns only about the group name; `composables/button/useSegmentedButton.ts:112` never warns about an item with `icon` and no `label`/`ariaLabel`; `button/segmented/index.vue` has no name warning at all.
kind: bug
fix: dev `watchEffect` in `useSegmentedButton` for icon-only items without `ariaLabel`; group-name warning in segmented.

### B8.3b `selected` on `tag="link"` still emits
status: present — `utils/button/useButton.ts:80` (`onClick: toggle`), `:109-113` (`toggle` checks `isToggle`/`isDisabled`, not `isLink`); the link branch sets no `aria-pressed`.
kind: bug
fix: `toggle()` returns early for links.

### B8.4a `v-ripple` never ripples on Space
status: present — `directives/ripple.ts:290` (`['Enter', 'Space']`) vs `e.key` at `:249-250`; Space's `key` is `' '`.
kind: bug
fix: default `['Enter', ' ']`; map a passed `'Space'` to `' '`.

### B8.4b `v-click-outside` keeps the mount-time handler
status: present — `directives/click-outside.ts:8-19` closes over the mounted `binding`; no `updated` hook.
kind: bug
fix: add `updated(el, binding)` that rebuilds `el._clickOutside`.

### B8.5 English default names
status: present — `alert/props.ts:23`, `banner/props.ts:38` (`'Close'`); `navigation-bar/props.ts:17`, `navigation-rail/props.ts:18` (`'Primary'`); `navigation-drawer/index.vue:10`; `dialog/index.vue:9`; `progress/props.ts:20`; `rating/props.ts:16` and `rating/index.vue:14` (`aria-valuetext` "N of M").
kind: bug
fix: as `decisions.md:36-37` (MLoading, dropdown): no default, dev warning when unnamed (progress, rating, dialog, close), a rating value-text prop. A lone landmark (rail, bar, drawer) needs no name. Global phrases stay deferred (B13.3).

### B8.6a Close slot `ariaLabel` renders `arialabel` in SSR
status: present — `alert/index.vue:119`, `banner/index.vue:110`: the slot `props` bag has the camelCase key (types `MAlertCloseSlot`/`MBannerCloseSlot`); Vue's SSR renderer lowercases it on a native `v-bind`.
kind: bug
fix: key `'aria-label'` in both bags and types, no alias.

### B8.6b Close sits after the actions in Tab order
status: present — `alert/index.vue:50-58`, `banner/index.vue:51-59` (actions slot, then close). The banner's stacked grid puts close in row 1 and actions in row 2 (`:173-177`), so Tab order is the reverse of the visual one.
kind: fork
question: В каком порядке по Tab стоят крестик и действия баннера/алерта?
А: оставить DOM (действия, крестик): dismiss как последнее действие; в stacked Tab расходится с видимым.
Б: крестик в DOM перед действиями + grid-area: в inline фокус уходит на правый крестик раньше левых действий.
В: DOM как есть, в stacked визуально поставить крестик после действий.
Рекомендация: А — расхождение только в stacked, лечится В.

### B8.6c `MBanner layout="auto"` follows the window width
status: present — `banner/index.vue:187,212` and `fragments/banner/actions/index.vue` use `@media (min-width: auto-threshold)`. The root is itself the grid, so a container query cannot target it.
kind: fork
question: Должен ли `layout="auto"` реагировать на ширину контейнера, а не окна?
А: оставить media query и задокументировать (в узкой колонке ставить `inline`/`stacked`).
Б: обёртка с `container-type: inline-size`, grid внутрь: точно для колонок, но +1 узел и ломает стили на корне.
В: ResizeObserver: нарушает «SSR first paint correct».
Рекомендация: А — M3-баннер на всю ширину, Б меняет DOM ради редкого случая.

### B8.7a `MBadge` is always a live region
status: present — `badge/index.vue:5-6` (`role="status" aria-live="polite"`, also on a dot or an empty badge).
kind: fork
question: Должен ли MBadge быть live-регионом по умолчанию?
А: нет, проп `announce` (по умолчанию `off`), как у MAlert/MBanner.
Б: `status` только у значка с текстом, не у точки и пустого.
Рекомендация: А — значок обычно описан хостом, `status` на каждом экземпляре — шум.

### B8.7b No value and no `dot` = empty circle
status: present — `badge/index.vue:9` renders the label only for `!dot && displayValue`, but `--large` applies to any `!dot` (`:50`), so an empty circle stays; the slot sits inside that `v-if`, so slot-only content never renders.
kind: bug
fix: render nothing (root `v-if`) with no value, slot or `dot`; let the slot render without `value`.

### B8.7c `MBadge` vanishes in forced colours
status: partly — the dot is handled (`badge/index.vue:90-94`). `--large` (`:73`) has no forced-colors rule: the fill becomes Canvas, only bare text remains.
kind: bug
fix: `@include forced-colors { border: 1px solid CanvasText }` in `&--large`.

### B8.8a `MProgress`/`MLoading` still use `size`
status: present — `progress/props.ts:17`, `loading/props.ts:16` (`small|medium|large`); `decisions.md:95` lists the rename as pending.
kind: fork
question: Переименовывать ли `size` → `density` у MLoading/MProgress сейчас?
А: да, `density: compact|default|comfortable` (small→compact, …), без алиаса.
Б: ждать OQ-1 (как сейчас).
В: оставить `size` как задокументированное исключение (физический размер).
Рекомендация: А — слово `density` решено владельцем, значения как у кнопок.

### B8.8b `MProgress` ignores reduced motion
status: present — no reduced-motion handling in `components/ui/progress/**` (loops `linear/index.vue:179-203`, `circular/index.vue:132,136`; transitions `linear:138`, `circular:127`). `MLoading` has it (`loading/index.vue:214-229`).
kind: bug
fix: same recipe as MLoading: slow indeterminate loops ×2, value transitions `none`.

### B8.8c `MProgress` ignores RTL
status: present — `linear/index.vue:137` (`transform-origin: left center`), `:189,198` (`left: -145.167%`/`-54.8889%`), positive `translateX` keyframes (`:231-300`).
kind: bug
fix: mirror the linear root under `:dir(rtl)` (`scaleX(-1)`) with a `[dir=rtl]` fallback; circular stays.

### B8.8d `MLoading` status has only an `aria-label`
status: present — `loading/index.vue:10-11` (`role="status"` + `:aria-label`, no text); a live region announces text changes, not its name.
kind: fork
question: Какой доступный контракт у самостоятельного MLoading?
А: `role="progressbar"` (без `aria-valuenow`) + `aria-label`: именуется, но сам не озвучивается.
Б: `role="status"` + скрытый текст из `ariaLabel`: анонс при появлении, но ненадёжно у динамически смонтированного региона.
Рекомендация: А — пустой `status` ничего не анонсирует; busy хост озвучивает через `aria-busy`.

### B8.9a Selected chip text/container mismatch
status: present — `assets/stylesheet/components/chip/_index.scss:15` (`on-primary-container`) over `:22` (`secondary-container`).
kind: bug
fix: `on-secondary-container` (M3 filter chip).

### B8.9b Pressed chip shifts 1rem (deferred)
status: present — `chip/index.vue:174` (`translateY(1rem)` on `:active`). Not M3; contradicts `craft.md` §7 "nothing moves position".
kind: bug
fix: remove the transform; the 12% layer is already the pressed cue.

### B8.9c `MChipGroup` arrows follow mount order
status: present — `chip-group/index.vue:204` (`views.push`), comment `:136` "Registration order is DOM order". Reordered `items` or a `v-if` chip keep a stale slot; `focusable()`, `activeView` (`:229`), `moveFocus` use it.
kind: bug
fix: sort `focusable()` by `compareDocumentPosition` of the element at use time.

### B8.9d `MChipGroup` loses focus on unmount
status: present — `chip-group/index.vue:208-212`: cleanup only splices the view and stops the ticket; a focused chip that is removed sends focus to `body`.
kind: bug
fix: in that cleanup, if the view's element is `document.activeElement`, focus the DOM neighbour first.

### B8.10a `MRating` "double star"
status: present — `rating/_index.scss:11-12` (item 48rem, icon 32rem). The empty glyph is centred (`rating/index.vue:168-176`); the fill layer (`:182`) puts the full glyph at its start, clipped to `fill*100%` of the 48 box: the glyphs are offset by (48 − glyph)/2 and a fraction clips the wrong share.
kind: bug
fix: put both glyphs in one icon-sized box and clip the fill to `fill*100%` of that box.

### B8.10b `MRating` `touch-action: none` blocks scroll
status: present — `rating/index.vue:158`; no touch drag exists (touch skips preview `:109`, commits on `pointerup` `:124`).
kind: bug
fix: `touch-action: pan-y` (or `manipulation`).

### B8.10c `MSelectionGroup` `selectAll` ignores `max`
status: present — `composables/selection/useSelectionGroup.ts:180` delegates to `createGroup.selectAll` (`registry/createGroup.ts:190-195`), which selects every enabled item; `max` lives only in `selectById`/`selectionLimitReached` (`useSelectionGroup.ts:91-94,107-111`).
kind: bug
fix: `selectAll` loops the enabled tickets through `selectById` until the limit.

### B8.10d `MSelectionGroup` fragment root drops `class`/`aria`
status: present — `selection-group/index.vue:1-22` has no single root (slot + `v-if` template), so Vue drops attrs with a dev warning.
kind: fork
question: Должен ли MSelectionGroup иметь собственный корневой элемент?
А: оставить безголовым, задокументировать (атрибуты вешает потребитель на свою обёртку).
Б: корневой `div` с пробросом атрибутов: +1 узел в flex/grid потребителя.
В: проп `tag`: без него без обёртки, с ним корень.
Рекомендация: А — компонент authored и безголовый по замыслу.

## B9. Containment and data

### B9.1 Static selected `MListItem` announces nothing
status: present — `composables/list/useListItemControl.ts:63-64` returns `{}` for a non-interactive row, while `list/item/index.vue:136` still adds `ui-list-item--selected`.
kind: fork
question: Что сообщать ассистивным технологиям про статичную выбранную строку?
А: `aria-current="true"` на `li` (валидно, но «текущий» ≠ «выбранный»).
Б: ничего, но dev-warning «selected без interactive».
Рекомендация: А — `aria-selected` на `listitem` недопустим.

### B9.2a `MTable` prev/next natively `disabled` (focus lost)
status: present — `fragments/table/pagination/index.vue:38,49` (`:disabled="loading || range.page <= 1"`; native `disabled`, `useButton.ts:93`). Next sets `loading`, the focused button turns disabled and focus drops to `body` on every page request.
kind: fork
question: Как сохранять фокус на prev/next таблицы (и MPagination, B5.7), когда они недоступны?
А: «мягкий» disabled: `aria-disabled` + глушение клика (как `loading` в `useButton`), новый режим MButtonIcon; общий механизм.
Б: native `disabled` + перенос фокуса на соседнюю кнопку/регион: без новой API, но больше JS и догадок о цели.
Рекомендация: А — одна причина в B5.7 и B9.2, такая семантика в ките уже есть.

### B9.2b `MTable` has no mixed select-all
status: present — `fragments/table/header/index.vue:8-10` (own comment); `useTableSelection` returns `isMixed` but `table/index.vue:189` drops it; `MCheckbox` has no `indeterminate` (B6.1).
kind: gap
fix: add `indeterminate` (`aria-checked="mixed"`) to `MCheckbox`, then pass `isMixed` to the header.

### B9.2c Scroll region unnamed with `aria-labelledby`
status: fixed — `composables/table/useTableControl.ts:80` falls back to `labelledBy` (no spec).
kind: bug
fix: none.

### B9.2d `TableData` rejects interfaces
status: fixed — `components/ui/table/types.ts:40-46` (`id` only); `tests/helpers.ts:6` uses an `interface Row`.
kind: bug
fix: none.

### B9.2e Footer vs `MPagination`
status: present — private footer `fragments/table/pagination/index.vue`; `.cursor/plans/.../data/table.md:189` calls it an open owner question.
kind: fork
question: Встраивать ли публичный MPagination в подвал MTable?
А: оставить приватный компактный подвал (решено при создании MPagination).
Б: подвал на MPagination (первая/последняя/номера): один компонент, но подвал тяжелее.
Рекомендация: А — подвал закрывает случай таблицы; B9.2a чинится общим механизмом.

### B9.3 `MTimelineItem` filled/outlined: no padding, `none` corner
status: present — `timeline/item/index.vue:33-37` passes only `variant` (MSurface default `shape: 'none'`, `surface/props.ts:22`); `&__content` has `padding-block` only (`:240-242`, tokens `timeline/_index.scss:13,74`).
kind: bug
fix: for `variant != plain` add inline padding and a corner (e.g. medium) via a BEM modifier; the first-line offsets (`timeline/_index.scss:25-33`) derive from the block padding and must follow.

### B9.4 Hairlines still `1rem`
status: present — under `assets/stylesheet/components/`: `surface/_index.scss:30` (outlined), `hotkey/_index.scss:13`, `chip/_index.scss:26`; also `tabs:12`, `alert:39`, `banner:30`, `otp-input:42` (ring), `navigation-rail:21` (ring shadow). Other maps use `max(1px, 1rem)`.
kind: bug
fix: map-local `$hairline: max(1px, 1rem)` (`decisions.md:98`).

### B9.5a Dash-form `g()` in system-bar, surface, lazy (dead rules)
status: fixed — none of the three has a dash-form `g()` left; `lint:scss` shows no unresolved path (no rule resolves to `null`).
kind: bug
fix: none.

### B9.5b Dash-form `g()` still in banner and 24 more SFCs
status: present — about 310 calls in 25 SFCs (banner 27, switch 34, checkbox 22, dialog 20, chip 20, radio 19). All resolve (lint clean); legacy form only.
kind: gap
fix: mechanical `-`→`.` per component.

### B9.6a `useHotkey` matches `KeyboardEvent.key`
status: present — `composables/hotkey/registry.ts:111` (`normalizeKey(event.key) === mainKeys[0]`); no `event.code` anywhere. Russian layout gives `key:'ы'` for physical S, Option+letter gives `ß`, Shift+1 gives `!`.
kind: fork
question: По какому полю useHotkey сопоставляет клавишу?
А: `key` ИЛИ `code` (для букв/цифр ещё `KeyS`/`Digit1`): работают ru-раскладка, Option+буква, Shift+цифра; на AZERTY чуть шире срабатывание.
Б: для букв/цифр только `code`: независимо от раскладки, но подсказка MHotkey на AZERTY покажет не ту букву.
В: `key` как есть + опция `byCode`.
Рекомендация: А — чинит все случаи без смены API.

### B9.6b `useHotkey` `scope` is a no-op without `pushScope`
status: present — `registry.ts:134` filters by scope only while `currentScope !== undefined`; nothing in the kit calls `pushScope`/`popScope` (`:209-218`); `options.scope` (`shared/types/hotkey.ts:81`) does nothing until the app does.
kind: fork
question: Оставлять ли `scope` у useHotkey?
А: убрать `scope`, `pushScope`/`popScope` из публичной поверхности (оверлеи покрыты `isOnTopLayer`); заодно снимает автоимпорт-коллизии (B1.7).
Б: сделать рабочим: `useHotkeyScope('editor')` (push/pop в `onScopeDispose`) + доки.
Рекомендация: А — потребителя нет, до 1.0 полуготовый API убираем.

### B9.7a `MLazy once=false` never unmounts without `v-model:active`
status: cannot-verify — the code reads correct (`useLazyControl.ts:246-251` deactivates on `!isIntersecting`; `:224-226` writes the local `defineModel` fallback), and specs bind an explicit ref (`useLazyControl.spec.ts:222`) or v-model (`ui/lazy/index.spec.ts:179-206`). Possible runtime cause: the collapsed placeholder (no `minHeight`) re-enters the 200px `rootMargin` and reactivates.
kind: bug
fix: add an unbound component spec (`once:false`, leave viewport → content unmounts); if it fails, add hysteresis or require `minHeight`.

### B9.7b `MApp` `rootElement` = `null`
status: fixed — `app/index.vue:61-63`, spec `app/index.spec.ts:66-76` (be02c6a). Nit: `MAppExposed` (`app/props.ts:15`) types it `ShallowRef`, the instance unwraps it.
kind: bug
fix: type it `HTMLElement | null`.

### B9.7c `MShape` SVG not `aria-hidden`
status: fixed — `shape/index.vue:6-8` (`role="img"` when named, else `aria-hidden="true"`).
kind: bug
fix: none.

### B9.7d `MIcon` loads client-side (shift, deferred)
status: partly — the shift is addressed (`.ui-icon` fixed box, be02c6a); the glyph still comes from `@nuxt/icon` (`icon/index.vue:7-10`), so SSR presence depends on the consumer's config.
kind: doc
fix: document `icon.serverBundle`/`clientBundle` for first-paint glyphs.

### B9.7e `useConfirmEditTransaction.draft` is shallow
status: present — `composables/confirm-edit/useConfirmEditTransaction.ts:48` (`shallowRef(clone(...))`): `v-model="tx.draft.value.name"` does not update `dirty`; only `setDraft` does. The clone is plain data, so deep reactivity is safe.
kind: bug
fix: `ref(clone(...))` for `draft` (keep `committed` shallow).

## N. Showcase bugs

### N.2 `m-progress circular expressive` hydration mismatch
status: present — `composables/progress/useProgress.ts:90-92`: `x`/`y` are raw `Math.sin/cos` products concatenated into `d`; server and browser strings differ in the last digits.
kind: bug
fix: round to 3 decimals before building `d`.

### N.3 `m-chip-group :wrap="false"` shrinks chips
status: present — `chip-group/index.vue:267-273` (`nowrap` + `overflow-x: auto`) but `.ui-chip` (`chip/index.vue:128-146`) has no `flex-shrink: 0`; in a card the inherited `overflow-wrap: anywhere` (`card/index.vue:116`) worsens it.
kind: bug
fix: `flex-shrink: 0` on `.ui-chip` (no parent-class selector, so prod CSS order is safe).

### N.4 `m-button-segmented` breaks labels mid-word
status: present — cause: `card/index.vue:116` sets `overflow-wrap: anywhere` on the card root; it inherits into the segmented button, where each `1fr` column's min-content becomes one glyph, so columns shrink and words wrap. `segmented/index.vue:171-173` has no reset; the scroll fallback never engages.
kind: bug
fix: `overflow-wrap: normal` on `.ui-segmented-button`; check chips and tabs for the same.

### N.6 `m-progress expressive linear`: wave path wider than the element
status: present — `useProgress.ts:109-120`: fixed width 1000 (to x≈1020), no `viewBox`; svg `overflow: visible` (`linear/index.vue:160`). The leak is probably hidden by `contain: content` (`:97`), but (1) in a container >1020 the wave stops short; (2) the determinate bar is `scaleX(value/100)` (`:36`) over that path, so the drawn length is ≈ `1020*value` px whatever the container (20% of 350px draws ~58%) and the period is squeezed.
kind: bug
fix: one tileable period (`<pattern>`/CSS mask) at `width: 100%`; clip the active wave with `clip-path: inset(0 calc(100% - v%) 0 0)` instead of `scaleX`; `overflow: hidden` on `.ui-progress__wave`.
