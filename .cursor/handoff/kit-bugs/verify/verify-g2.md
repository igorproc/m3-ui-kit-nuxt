# verify-g2: B4, B5, N.1 (working tree @ 64fb4dc + uncommitted; read-only, nothing executed)
Paths relative to `kit/src/runtime`. Questions are also drafted in `.cursor/plans/feature/components-should-update/{overlays,navigation,feedback}/*.md`.

## B4 Overlays

### B4.1a MMenu default `absolute=false` pins top 72 / right 32 over a backdrop
status: present — `components/ui/menu/props.ts:9`; `assets/stylesheet/components/menu/_index.scss:10-11`
kind: fork
fix: remove the unanchored branch + tokens (all internal consumers pass `absolute`).
question: Что делать с режимом без якоря?
А: Удалить, `absolute` убрать без алиаса. Минус: внешний код на «угол окна» получит меню у триггера.
Б: Оставить, дефолт `absolute: true`. Минус: мёртвые токены и вторая ветка разметки.
В: Не менять. Минус: дефолт неверен.
Рекомендация: А — меню M3 всегда у якоря (plan menu Q1).

### B4.1b MMenu `role=menu` unnamed, attrs on wrapper
status: present — `components/ui/menu/index.vue:31` (`$attrs` on `.ui-menu`), `:40-46`
kind: bug
fix: `aria-*`/`id` → `.ui-menu__surface`, `class`/`style` → wrapper; name = `aria-labelledby` trigger id / consumer `aria-label`, dev warning if none.

### B4.1c MMenu has no `MMenuItem`
status: present — only the recipe `components/ui/menu/index.vue:294-331`
kind: fork
fix: item component (menuitem/checkbox/radio, selected, disabled).
question: Чем рисовать пункт меню?
А: Новый `MMenuItem` + `MMenuGroup`. Минус: ещё одна строка рядом с `MListItem`.
Б: Ветка «menu» в `MListItem`. Минус: ветка ради одного потребителя; другая роль цвета выбора.
В: Оставить рецепт `.ui-menu__item` + доку. Минус: роли/`aria-checked`/disabled на потребителе.
Рекомендация: А (plan menu Q3).

### B4.1d MMenu disabled items aren't `menuitem`
status: present — `components/ui/menu/index.vue:120-121,124-130` (filter drops disabled)
kind: bug
fix: give every item `role=menuitem`; disabled → `aria-disabled`, kept in arrow order, click swallowed.

### B4.1e MMenu Tab trapped
status: present — `components/ui/menu/index.vue:158`; pinned by `index.spec.ts:132`
kind: fork
fix: per choice; rewrite that spec.
question: Что делает Tab в открытом меню?
А: Закрывает меню без возврата фокуса (APG). Минус: отступление от «trap держит Tab».
Б: Оставить запертым. Минус: один tab-stop, выход только Esc.
Рекомендация: А — правило trap про модальные; у меню есть Esc, APG требует закрытия (plan menu step 3).

### B4.1f MMenu no typeahead
status: present — `components/ui/menu/index.vue:160-185`
kind: gap
fix: reuse `composables/dropdown/useTypeahead.ts`.

### B4.1g MMenu 200/250 ms literals ignore reduced motion
status: present — `components/ui/menu/index.vue:354,357,366`
kind: bug
fix: `--sys-motion-*` tokens (collapse in `base/_animations.scss:44`); reduced → fade, no scale.

### B4.1h MMenu Escape focuses trigger's `parentElement`; pick returns nowhere
status: partly — pick/close now returns via the trap (`composables/overlay/useFocusTrap.ts:122-134`, `menu/index.vue:189`); Escape still uses `anchorRef.parentElement`, ignores `anchor` (`menu/index.vue:140-146`); trap remembers `activeElement` only (Safari doesn't focus on click)
kind: bug
fix: drop `getTriggerEl`; `focusTrap.rememberFocus()` before open, return there.

### B4.1i MMenu no `lockScroll`
status: fixed — `components/ui/menu/props.ts:13`, `menu/index.vue:226-236`
kind: -
fix: - ("no height cap" half → B4.2b)

### B4.2a Clamping: dropdown/autocomplete/search panels
status: partly — row-count cap token `assets/stylesheet/components/dropdown/_index.scss:41-46` + dropdown `maxHeight` (`components/ui/dropdown/props.ts:111`); not viewport-aware
kind: gap
fix: clamp `max-block-size` to free space − margin (native `position-try-order: most-height` + JS fallback), as plan menu step 2.

### B4.2b Clamping: MMenu surface, tooltip
status: present — `components/ui/menu/index.vue:274-292`, `composables/popover/usePopover.ts:169-224` (flip/shift only)
kind: gap
fix: same clamp in `usePopover`; the menu group scrolls (`overflow-y:auto`).

### B4.3 MColorInput popover `role=menu` around a picker, button says `dialog`
status: present — `components/ui/menu/index.vue:43` vs `components/ui/color-input/index.vue:57`; dropdown/autocomplete have the same listbox-in-menu issue
kind: fork
fix: per choice.
question: Как развести меню и панель с чужим виджетом?
А: Проп `MMenu role: 'menu' | 'none'`. Минус: «меню, которое не меню» в API.
Б: Внутренний примитив `fragments/popover/` на `usePopover`, MMenu только меню. Минус: L-работа; плюс чистый axe.
Рекомендация: Б, А как промежуточный (plan menu Q2).

### B4.4a MDialog height: no max-height, `overflow:hidden`
status: present — `components/ui/dialog/index.vue:79-96`
kind: bug
fix: `max-height: calc(100dvh - 2*margin)`, `.ui-dialog__content { overflow-y:auto; min-height:0 }`, headline/actions pinned.

### B4.4b MSheet height: same
status: present — `components/ui/sheet/index.vue:50-62,84-89`
kind: bug
fix: token `max.height`, `.ui-sheet__content` scrolls; pairs with B4.5f.

### B4.5a MDialog/MSheet `confirm`/`cancel` never emitted
status: present — declared `components/ui/dialog/index.vue:59-62`, `sheet/index.vue:31-34`, never emitted; `useModal` maps them `composables/modal/useModal.ts:136-145`; `MDialogDate` emits (`dialog/date/index.vue:150-174`)
kind: fork
fix: per choice.
question: Как MDialog/MSheet отдают результат в `useModal`?
А: Слот `#actions="{ confirm, cancel, close }"`, Esc/scrim = `cancel` (как `MDialogDate`). Минус: Esc даёт `false`, не `null`.
Б: Убрать мёртвые emits, результат `null`, оборачивать своим компонентом. Минус: `useModal(MDialog)` пуст.
В: Встроенные кнопки `confirmLabel`/`cancelLabel` без дефолтов. Минус: дублирует `MDialogDate`.
Рекомендация: А.

### B4.5b MDialog `autofocus` fails
status: present — `showModal()` runs while the panel is `v-show`-hidden (`components/ui/overlay/index.vue:56`, `useOverlayLifecycle.ts:109-110`); trap ignores `[autofocus]` (`useFocusTrap.ts:67-72`)
kind: bug
fix: with B4.6, MOverlay/MDialog focuses `[autofocus]` after the trap activates.

### B4.5c MDialog headline always centred
status: present — `components/ui/dialog/index.vue:119` (`:124-126` repeats for icon)
kind: bug
fix: M3 centres only with an icon: drop `text-align` from `&__headline`, keep the `__icon + __headline` rule.

### B4.5d MSheet has no name
status: present — `components/ui/sheet/index.vue:2-18` (no prop/warning; `'Dialog'` English fallback of MDialog `dialog/index.vue:9` is B8.5)
kind: bug
fix: `ariaLabel`/`title` prop + dev warning, no English default.

### B4.5e MSheet drag handle unfocusable
status: present — `components/ui/sheet/index.vue:11`
kind: doc
fix: decorative `aria-hidden`; document Esc as keyboard dismissal.

### B4.5f MSheet no `touch-action`
status: present — swipe target is the whole panel (`components/ui/overlay/index.vue:256`), pointer events (`composables/useDrag.ts`), no `touch-action` → touch drag becomes pan → `pointercancel`
kind: fork
fix: per choice.
question: Откуда начинается свайп закрытия листа на таче?
А: Только за ручку (`touch-action:none` на ней). Минус: целиться в ручку; плюс — тело скроллится.
Б: За весь лист `touch-action:none`. Минус: вертикальный скролл тела мёртв.
Рекомендация: А — как drag handle в M3.

### B4.6 `useFocusTrap` focuses first focusable by default
status: present — `composables/overlay/useFocusTrap.ts:26,71`; MOverlay uses the default (`components/ui/overlay/index.vue:137`); menu/snackbar already pass the container (`menu/index.vue:158`, `snackbar/index.vue:86`)
kind: bug
fix: default `initialFocus` = target (`tabindex=-1`); MOverlay passes `() => root.value`; content owns autofocus.

### B4.7a MTooltip `aria-describedby` on inner span, only while visible
status: present — `components/ui/tooltip/index.vue:9-14` (focus is on the slotted button; node is `v-if`)
kind: fork
fix: per choice; keep the description text in DOM always (hidden node).
question: Как довести `aria-describedby` до фокусируемого элемента?
А: Slot-props `#default="{ props }"`, потребитель `v-bind`. Минус: без правки вызова связи нет.
Б: Авто: первый фокусируемый потомок через `setAttribute`. Минус: правит чужую разметку, ломается при позднем появлении.
В: Оба (слот основной, авто запасной). Минус: два пути.
Рекомендация: В (plan tooltip Q4).

### B4.7b MTooltip opens on click focus
status: present — `components/ui/tooltip/index.vue:6` (`@focusin="show"`)
kind: bug
fix: show on focus only if target `:focus-visible`.

### B4.7c MTooltip 150 ms literal
status: present — `components/ui/tooltip/index.vue:152,158`
kind: bug
fix: `--sys-motion-duration-short-2`; reduced motion → fade, no scale.

### B4.8 MOverlay activator `aria-haspopup`
status: partly — modal now `dialog`, popover mode still `menu` (`components/ui/overlay/index.vue:205-209`)
kind: bug
fix: `dialog` (or omit) for popover mode + `aria-controls`.

### B4.9a MSnackbar `surface`, not inverse
status: present — `assets/stylesheet/components/snackbar/_index.scss:24,26,40`
kind: bug
fix: `inverse-surface`/`inverse-on-surface`/`inverse-primary`, corner 4 (plan snackbar step 1).

### B4.9b MSnackbar live region mounts with the text
status: present — `components/ui/snackbar/index.vue:13-19` (`role=status` under `v-if`)
kind: bug
fix: persistent `role=status` in the overlay host, snackbar swaps its text (plan step 5).

### B4.9c MSnackbar no queue
status: present — no snackbar service on `$material`
kind: gap
fix: `useNuxtApp().$material.snackbar.show({label, action, duration}) → Promise`, one at a time; `<MSnackbar v-model>` stays.

### B4.9d MSnackbar fixed over nav bar / FAB
status: present — `snackbar/_index.scss:10` (`bottom:16rem`); layout inset vars live only on `#<layoutId>` (`composables/layout/css.ts:147-150`), unreachable from the overlay host
kind: fork
fix: per choice.
question: Как снекбару не перекрывать нижний бар/FAB?
А: Layout публикует инсеты и на `html`; `bottom: calc(var(--m3-layout-inset-bottom,0px) + 16rem)`. Минус: FAB не зона layout.
Б: Проп `offset`. Минус: каждое приложение дублирует высоту.
Рекомендация: А.

## B5 Navigation

### B5.1a Rail/bar items are buttons, not links
status: present — `components/ui/navigation-rail/item/index.vue:2-10`, `navigation-bar/index.vue:11-19`
kind: gap
fix: optional `to` → `NuxtLink` + `aria-current` (plans A11-01).

### B5.1b Pressing the active item emits nothing
status: present — `components/ui/navigation-rail/index.vue:114-117`, `navigation-bar/index.vue:115-118`
kind: gap
fix: `emit('select', id, event)` on each activation.

### B5.2a Rail: hover on active pill → pressed opacity
status: present — `assets/stylesheet/components/navigation-rail/_index.scss:36-40`, `item/index.vue:130-137`
kind: bug
fix: keep active indicator opaque; hover/pressed as a separate `::before` layer (plan ST-03).

### B5.2b Rail inside `MLayoutMain` is "hosted" (100% wide)
status: present — `components/ui/navigation-rail/index.vue:7,217-223`; `composables/useLayout.ts:262-279` (any host)
kind: fork
fix: per choice.
question: Должен ли рейл в `MLayoutMain` быть hosted?
А: Hosted только в aside/start-зоне; в main своя ширина.
Б: Оставить, документировать. Минус: ловушка (порядок CSS в prod, B10).
Рекомендация: А — hosted придуман для aside.

### B5.3a Bar: active by colour only
status: present — `components/ui/navigation-bar/index.vue:233-235`, tokens `navigation-bar/_index.scss:29-31`
kind: bug
fix: indicator pill 64×32 `secondary-container` (plan bar step 2).

### B5.3b Bar: rounded at elevation 2
status: present — `assets/stylesheet/components/navigation-bar/_index.scss:15,17` (rail `navigation-rail/_index.scss:19-21`)
kind: fork
fix: per choice.
question: Вид контейнера bar/rail?
А: Плоский M3 (угол 0, без тени, `surface-container`); «остров» — задача layout.
Б: Остров как осознанное отклонение в `decisions.md`.
В: Ось вида `MVariant` filled|elevated.
Рекомендация: А (plan bar Q1; и для рейла).

### B5.4a Drawer content doesn't scroll
status: present — `components/ui/navigation-drawer/index.vue:21-23,54-80`
kind: bug
fix: `__content { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain }`.

### B5.4b Drawer `side` mixes logical and physical
status: present — prop `left|right` (`navigation-drawer/props.ts:8`), logical margins (`index.vue:58,85`), physical `translateX` (`:108,113`) → in RTL it sits right but slides from the left
kind: fork
fix: per choice.
question: Как называть сторону drawer?
А: `side: 'start' | 'end'`, `left/right` удалить без алиасов, углы/translate логические. Минус: breaking.
Б: Оставить физические, весь CSS физический. Минус: RTL не зеркалится.
Рекомендация: А (алиас из плана не нужен по вашему правилу).

### B5.4c Drawer doesn't forward `#activator`
status: present — `components/ui/navigation-drawer/index.vue:2-25`
kind: gap
fix: forward MOverlay `#activator` (+ `aria-controls`).

### B5.5a MTabs tablist can't be named
status: present — `components/ui/tabs/index.vue:3-7` (attrs fall to root div)
kind: bug
fix: `ariaLabel`/`ariaLabelledby` on the tablist + dev warning.

### B5.5b MTabs panels no `id`, `aria-controls` always set
status: partly — `MTabPanel` has `id`/`aria-labelledby` (`components/ui/tabs/panel/index.vue:3-6`); default-slot panel does not (`tabs/index.vue:23-29`) while active tab's `aria-controls` points at it (`tab/index.vue:15`)
kind: bug
fix: `:id="panelId(selected)"`, `aria-labelledby`, `tabindex=0`.

### B5.5c MTabs preset non-first `v-model`: SSR first paint wrong
status: present — preset applied only by the `immediate` watcher before tabs register (`components/ui/tabs/index.vue:52-59`); SSR renders the first tab
kind: bug
fix: same as N.1a.

### B5.6a MToolbar icon+label renders only icon
status: present — `components/ui/toolbar/index.vue:25-31`
kind: bug
fix: render icon (`prepend`) + label in `MButton` (plan A11-02).

### B5.6b MToolbar no `aria-pressed`
status: present — `components/ui/toolbar/index.vue:138-158`
kind: bug
fix: `aria-pressed` on toggle items (single mode too).

### B5.6c MToolbar no role/name
status: present — `components/ui/toolbar/index.vue:2-5`
kind: bug
fix: `role=toolbar`, `aria-orientation`, `ariaLabel` prop + dev warning.

### B5.6d MToolbar no keyboard
status: present — no `keydown` in `components/ui/toolbar/index.vue`
kind: gap
fix: APG roving via the shared controller.

### B5.7a MPagination Next/Last natively `disabled` (focus lost)
status: present — `components/ui/pagination/index.vue:14,29,74,89`; `utils/button/useButton.ts:93` (В-6: only `loading` stays focusable)
kind: fork
fix: per choice.
question: Как не терять фокус на границе?
А: `aria-disabled` вместо `disabled`, кнопка в Tab-порядке. Минус: нужен soft-disabled у `MButton` (В-6 принят только для loading).
Б: На краю фокус уходит на кнопку текущей страницы. Минус: фокус «прыгает»; локально, подходит и `MTable` (B9.2).
Рекомендация: Б — не расширяет API кнопки (В-6).

### B5.7b MPagination camelCase slot props → `arialabel` in SSR
status: present — `components/ui/pagination/props.ts:56-76`, `index.vue:127-148`
kind: bug
fix: keys `'aria-label'`, `'aria-current'`.

### B5.7c MPagination English labels
status: present — `components/ui/pagination/index.vue:120-122`, defaults `props.ts:19-28`
kind: bug
fix: remove English defaults; `pageLabel(page, current)` prop; dev warning (plan CT-13).

### B5.7d MPagination no compact mode
status: present — `components/ui/pagination/props.ts`
kind: gap
fix: `layout: 'pages' | 'compact'` (plan UX, recommended).

### B5.8a MBreadcrumbs no click API
status: present — `components/ui/breadcrumbs/props.ts:17` (by design)
kind: gap
fix: per-item `onClick`/`href`, or the `item` slot (`index.vue:22-30`).

### B5.8b MBreadcrumbs `scroll` never reveals current
status: present — `components/ui/breadcrumbs/index.vue:130-133`; no scroll code
kind: fork
fix: per choice.
question: Как показать текущую крошку в `scroll`?
А: `scrollIntoView` после mount. Минус: скачок после гидрации (против SSR first paint).
Б: CSS `scroll-snap-type:x proximity` + `scroll-snap-align:end` на текущей; без JS, без поддержки остаётся начало.
В: Дефолт `wrap`. Минус: меняет вид.
Рекомендация: Б.

### B5.9a RTL arrows: tabs, bar
status: present — `components/ui/tabs/index.vue:96-100`, `navigation-bar/index.vue:148-155`; pattern: `components/ui/chip/index.vue:89-96`
kind: bug
fix: swap Left/Right by computed `direction` at key time.

### B5.9b RTL slider
status: present — `composables/slider/useSliderControl.ts:205,302,320-322,363,398` (physical `left`, `clientX`, arrows)
kind: bug
fix: flip percent/pointer maths/arrows in RTL (as `fragments/color-picker/Canvas.vue:65-138`).

### B5.9c RTL linear progress
status: present — `components/ui/progress/linear/index.vue:36,137`
kind: bug
fix: `:dir(rtl) { transform: scaleX(-1) }` on the track.

### B5.9d RTL switch
status: present — `components/ui/switch/index.vue:113,157`
kind: bug
fix: `inset-inline-start`; flip translate sign under `:dir(rtl)`.

### B5.9e RTL drawer `side`
status: present — see B5.4b
kind: fork
fix: resolved by B5.4b (А).
question: см. B5.4b.
Рекомендация: А.

### B5.9f RTL menu `origin`
status: present — `composables/menu/useMenu.ts:60-64`; color-input compensates by hand `components/ui/color-input/index.vue:278-286`
kind: fork
fix: per choice.
question: Как сделать размещение MMenu RTL-зависимым?
А: `origin` → `placement` логический `start|end`, физические удалить без алиаса. Минус: breaking.
Б: `useMenu` зеркалит `left/right` по direction. Минус: `left` перестаёт значить «слева».
Рекомендация: А — как у drawer.

### B5.9g RTL `MIcon` doesn't mirror
status: present — `components/ui/icon/props.ts`; per-component hacks (`fragments/breadcrumbs/divider/index.vue:53`); pagination chevrons unmirrored (`ui/pagination/index.vue:17,32`)
kind: fork
fix: per choice.
question: Как зеркалить направленные иконки?
А: Проп `mirror` у `MIcon` (`:dir(rtl) scaleX(-1)`); кит ставит на свои глифы.
Б: `MIcon` сам по списку имён. Минус: скрытая магия.
Рекомендация: А.

## N.1 m-tabs

### N.1a Preset non-first `v-model` not applied (first stays highlighted)
status: present — `components/ui/tabs/index.vue:48` (`createSingle` without `reactive:true` → plain Map `size`, `composables/registry/createRegistry.ts:159-161`), so `[modelValue, sel.size]` watcher (`:52-59`) never re-runs after tabs register; `'force'` mandates first (`createSelection.ts:94-100,158`), `selectedValue` watcher writes it back to the model (`:61-63`). Report's root (`apply()`→silent `unselect`) is inexact: `apply` ends in `model.select`, which clears (`createModel.ts:103-111`); it just never runs. Rail/bar/toolbar share the pattern (late items won't re-apply)
kind: bug
fix: wrap `register` in MTabs: the ticket equal to `modelValue` is selected at once (SSR-safe, before `'force'` falls back); add a non-first preset spec.

### N.1b Mount emits `update:modelValue` of first tab
status: present — `components/ui/tabs/index.vue:61-63`, comment `:45-47`; after N.1a only for null/unmatched model; with only `:model-value` bound `defineModel` also overwrites its local value
kind: fork
fix: per choice.
question: Писать ли авто-выбранный первый таб в `v-model`?
А: Да (как сейчас): родитель знает текущий; route-driven вкладки передают `:model-value` из роута. Описать в доке.
Б: Нет: model null, эмит только по действию. Минус: родитель не знает текущий таб.
Рекомендация: А после N.1a.
