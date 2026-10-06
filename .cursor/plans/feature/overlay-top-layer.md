# Overlays on the native top layer (menu / tooltip / dialog) + vue-final-modal removal

<identity>Area: overlay family — `MOverlay`, `MDialog`, `MDateDialog`, `MSheet`, `MNavigationDrawer`, `MMenu`, `MTooltip`, `MSnackbar`, `usePopover`, `useMenu`, `useStack`, `useModal` · Status: implemented (phases 0–6), awaiting visual review — see `.cursor/summary/overlay-top-layer-vfm-removal_2026-10-01_1200.md` · Trigger: audit "MDialog, MMenu, MTooltip vs v-dialog, v-menu, v-tooltip" (critical: no flip/shift at viewport edges) + decision to drop `vue-final-modal` following modern-web-guidance</identity>

<problem>
1. Collision: `MMenu` never flips or shifts. Anchor path (`useMenu.ts` `menuStyle`) sets `position-area` with no `position-try-fallbacks`; JS path pins to `rect.bottom/left` with no flip/clamp — `usePopover` already has flip/clamp but `useMenu` calls it without `surface`/`placement`/`flip`. `MTooltip` hand-rolls its own math (not `usePopover`), measures during the `scale(0.95)` enter transition, has `nowrap` without `max-width`, top placement only.
2. Stacking: overlays teleport into `#ui-overlay-host` and get z-index from `useStack`. A modal opened with `showModal()` lives in the top layer and makes the page `inert`, so menu/tooltip/snackbar rendered the old way would sit under it and be unclickable. Dialog, menu, tooltip and snackbar must move to the top layer together.
3. `vue-final-modal` still backs `MDateDialog`, `MNavigationDrawer`, `openModal()`, `ModalsContainer` (core/global-container.vue), `plugins/vue-final-modal.client.ts`, `package.json`. `MOverlay` re-implements focus trap / Esc / scrim in JS instead of `<dialog>`.
4. The audit's "whole page scrolls horizontally" symptom is not confirmed: overlays are `position: fixed` inside a fixed host. Only possible if an ancestor of `.ui-app` gets `transform`/`filter`/`backdrop-filter`/`contain` (docs_v2 glass look?). Moot once overlays are in the top layer; ask the user for a screenshot if it matters before phase 2.
</problem>

<decisions>
- Positioning: native CSS anchor positioning (`position-area` + `position-try-fallbacks: flip-block, flip-inline`) with the kit's own JS fallback (fixed + measured flip/shift). No Floating UI.
- Browser support: native features behind feature detection; fallbacks hand-written in the kit; no polyfill packages (`@oddbird/*`, `interestfor`).
- Programmatic modals are not exported as standalone helpers. App-wide API lives on `useNuxtApp().$material.modal`; declarative `<MDialog v-model>` stays.
- `useModal` mirrors the vue-final-modal `useModal` API minus: `zIndexFn`, `teleportTo`, `modalId` (always generated, exposed as `id`), `overlayStyle`/`contentStyle`. `focusTrap` becomes a separate `useFocusTrap`.
- Close-trigger props are named `${action}On${Trigger}`: `clickToClose` → `closeOnOutside`, `escToClose` → `closeOnEscape`, `swipeToClose` → `closeOnSwipe`, `threshold` → `swipeThreshold`. `MMenu.closeOnBackdrop` is left as is.
- `persistent: true` wins over `closeOnOutside` / `closeOnEscape` / `closeOnSwipe`; programmatic `close()` and v-model still close (current `MOverlay` behavior).
- `open()` resolves with the result on close; the handle also keeps a reactive transition status that is settled on transition end and propagated (see <lifecycle>).
- `persistent` stays as a shortcut next to `closeOn*`.
- `displayDirective: 'if' | 'show'` (`visible` dropped — a closed `<dialog>` is `display: none` natively, so it equals `show`).
- Parent → child cascade (`M3ModalContext`) stays: closing a parent closes its children.
- Teleport into `#ui-overlay-host` stays (keeps theme inheritance, avoids interactive content nested in trigger buttons); top layer works regardless of DOM position.
</decisions>

<browser-support>
| Feature | Status | Kit fallback |
|---|---|---|
| `<dialog>` + `showModal()` | widely available | — |
| Popover API | newly available (2025-01) | detect `'popover' in HTMLElement.prototype`; else `position: fixed` + z-index from the stack |
| CSS anchor positioning | limited | JS measured flip/shift (`popover/placement.ts`) |
| `<dialog closedby>` | no Safari | own click-on-scrim handler |
| `overlay` / `allow-discrete` exit animation | `overlay` Chrome-only | not needed: scrim + content are real elements inside a full-viewport `<dialog>`, animated by Vue `<transition>` |
| `popover="hint"` / `interestfor` | no Safari | tooltip uses `popover="manual"` + kit hover/focus logic |
</browser-support>

<architecture>
- Feature flags: one module in `shared/constants` (`supportsPopover`, `supportsAnchor`, `supportsDialogClosedBy`), read once on the client.
- Modal surface: `<dialog>` stretched to the viewport, transparent `::backdrop`; inside it the kit scrim element and the content element, each in its own `<transition>` (`overlayTransition` / `contentTransition`). `background: 'interactive'` renders the same `<dialog>` with `popover="manual"` (top layer, no `inert`).
- Popover surfaces: `MMenu` → `popover="auto"` (`manual` when outside-close is off); `MTooltip`, `MSnackbar` → `popover="manual"`.
- Stack: moves from the hidden `nuxtApp._m3OverlayStack` to `$material.overlays`, created by the `material` plugin (per request on SSR, singleton on client). `useStack()` becomes a thin accessor — consumers unchanged. Its jobs after the migration: "who is topmost" for `manual` popovers (Esc, dismissal), z-index in the no-popover fallback, `overlayBehavior: 'auto'` (dim only the topmost scrim), re-raising an active snackbar when a new modal opens.
- Modal service: `$material.modal` holds registries and `dynamicModals`; a client-only host in `core-scope` replaces `ModalsContainer` and renders them (`<KeepAlive>` when `keepAlive`).
- Positioning math: pure functions in `composables/popover/placement.ts` (parse placement, main-axis flip, cross-axis shift, available-height clamp) shared by `usePopover`; keeps `usePopover.ts` under 400 lines.
</architecture>

<api>
`useModal(options)` — handle for a programmatic modal.
- Options: `component`, `attrs` (props + `on*` listeners, typed by component), `slots` (string | component | `useModalSlot({ component, attrs })`), `defaultModelValue`, `keepAlive`.
- Handle: `id`, `status` (reactive, see <lifecycle>), `open(): Promise<Result>`, `close()`, `patchOptions(partial)`, `destroy()`, `options` (read-only).
- Result: `confirm` → payload or `true`; `cancel` → `false`; dismissed / v-model false → `null`. Consumer `onConfirm`/`onCancel` run first, then the modal closes.

`useNuxtApp().$material.modal`
- `open(id)`, `close(id)`, `toggle(id, show?)`, `closeAll()`, `get(id)`.
- Registries: `modals`, `openedModals`, `openedModalOverlays`, `dynamicModals`.
- Declarative modals expose `id` via `defineExpose`, so they are addressable too.

Shared modal-layer props (one props object, spread into `MOverlay`, `MDialog`, `MSheet`, `MNavigationDrawer`, `MDateDialog`):
`modelValue`, `displayDirective: 'if' | 'show'`, `hideOverlay`, `overlayBehavior: 'auto' | 'persist'`, `overlayTransition`, `contentTransition`, `overlayClass`, `contentClass`, close-on-outside, close-on-escape, `persistent`, `background: 'interactive' | 'non-interactive'`, `lockScroll`, `reserveScrollBarGap`, close-on-swipe (`'none' | 'up' | 'right' | 'down' | 'left'`), swipe threshold, `showSwipeBanner`, `preventNavigationGestures`.

Events: `update:modelValue`, `beforeOpen({ stop })`, `opened`, `beforeClose({ stop })`, `closed`, `clickOutside`. Slots: `default`, `swipe-banner`.

`useFocusTrap(target, options)` — `initialFocus` (selector | element | `false`), `returnFocus`, `loop`, `immediate`. Used by the modal layer (Tab otherwise escapes `showModal()` into browser chrome) and by `background: 'interactive'`. Replaces `MOverlay.onPanelKeydown`.

Internal: current `composables/modal/useModal.ts` context registration is renamed `useModalContext`; `openModal()` is removed.
</api>

<lifecycle>
`status: 'closed' | 'opening' | 'open' | 'closing'` — same type as `PopoverStatus`, shared.
- open: `beforeOpen` (stoppable) → mount/`showModal()` → `opening` → both transitions (`overlay`, `content`) ended → `open` + `opened`.
- close: `beforeClose` (stoppable) → `closing` → children closed first (cascade) → both leave transitions ended → `dialog.close()` → `closed` + `closed` event → `open()` promise resolves.
- "Transition ended" is conditional: a missing/disabled transition or `prefers-reduced-motion` settles immediately instead of waiting for `transitionend`.
- Propagation: every status change reaches the component emits, the handle's `status` / attrs listeners, and the parent context (so a parent can await its children). The `$material.modal` registries do not receive status or lifecycle events — they only track membership (added on open, removed once `closed`).
</lifecycle>

<phases>
0. Foundation — feature flags; `popover/placement.ts` + unit tests (flip on each edge, shift, fits nowhere). **Done** (only `supportsAnchorPositioning` so far; popover/closedby flags land with phases 2/4).
1. Collision fix — `usePopover`: `position-try-fallbacks`, JS flip+shift via placement.ts; `useMenu` on full `usePopover`. **Done** — see `.cursor/summary/overlay-popover-collision_2026-10-01_0300.md`. Height clamp deferred: `max-height` against the `position-area` shrinks instead of flipping; needs a scroll container on the surface, agreed together with the dropdown panel max-height.
2. `MMenu` → popover top layer; drop the self-made backdrop; retest dropdown, autocomplete, color-input, number-input/unit.
3. `MTooltip` → `popover="manual"` + `usePopover`; `max-width` token; hoverable content (WCAG 1.4.13 — behavior change from `pointer-events: none`).
4. Modal layer — `useFocusTrap`; `MOverlay` on `<dialog>` with the lifecycle above; shared props; `$material.overlays`; `MSnackbar` → `popover="manual"`. `MDialog`, `MSheet`, confirm-edit follow.
5. VFM removal — `useModal` + `$material.modal` + host in `core-scope`; `MDateDialog`, `MNavigationDrawer` onto `MOverlay`; delete plugin, `ModalsContainer`, `module.ts` registration, dependency + lockfile (explicit approval before touching `package.json`); rewrite specs that assume VFM's `<body>` teleport.
6. Docs — docs overlay page, changelog, `.cursor/summary/`.
</phases>

<breaking>
VFM class names and transitions (`vfm-fade`, `vfm-slide-*`, `.vfm__*`, `vue-final-modal/style.css`); `clickToClose` / `escToClose` renamed on `MDialog`, `MSheet`, `MDateDialog`, `MNavigationDrawer`; `openModal()` removed; `MOverlay` prop renames; tooltip becomes hoverable. Warrants a major version.
</breaking>

<validation-gates>
`npm run lint`, `lint:style`, `lint:scss`, `test` green per phase. Unit: placement math, lifecycle transitions (including no-transition / reduced-motion), result resolution, cascade close, focus trap. Visual checks are done by the user (menu at the right/bottom edge, menu + tooltip + snackbar inside a modal, nested modals with `overlayBehavior`, Safari light-dismiss, exit animations in Firefox/Safari).
</validation-gates>

<open-questions>
None — all forks resolved (see <decisions>, <lifecycle>).
</open-questions>
