# Behaviour

The second half of the system. It governs components whose substance is interaction —
slider, table, date picker, autocomplete, overlay, virtual scroll — where the visual spec
has nothing to say. These are not exceptions to the system; they obey this chapter instead
of [axes.md](axes.md).

## Three layers

```
math / state machine        pure functions over values, no DOM
        ↓
control composable          DOM, events, ARIA — returns attribute bags
        ↓
presentation                a component (or a consumer's markup) that v-binds them
```

Reference implementation:
[`composables/slider/useSliderControl.ts`](../../../src/runtime/composables/slider/useSliderControl.ts)
sits between `createSlider.ts` (pure value math) and
[`components/ui/slider/index.vue`](../../../src/runtime/components/ui/slider/index.vue), which
lost ~120 lines of DOM logic and now consumes the same bags any third-party markup would.

## The escape-hatch contract

> Delete the component tag, keep `v-bind` plus the hook, and the behaviour is intact.

This is a promise the kit makes publicly, so it must be true by construction, not by
duplication. One code path: the shipped component is a *consumer* of the composable, never a
privileged one. If the component knows something the bags do not expose, the demo can lie
and eventually will.

### Naming

| Shape | Use |
|---|---|
| `rootAttrs`, `trackAttrs`, `rangeAttrs` | One bag per structural part, spread with `v-bind`. |
| `getThumbAttrs(index)` | A getter when the part repeats. |
| `UseXControlReturn` | Declare the public return type explicitly. Inferred types blow up `mkdist` with TS7056 — this is a build constraint, not a style preference. |

### The composable emits no classes and no `data-*`

Presentation is entirely the consumer's. A composable that leaks a class name or a `data-*`
attribute has decided how the markup looks, which is exactly what the escape hatch promises
it will not do. This is testable, and it is tested: each control composable has a spec that
mounts its bags onto anonymous markup and asserts no `class` and no `data-` key comes out.

The composable owns the *relationships* — `for` / `id`, `aria-describedby`, `aria-controls`
— because those are behaviour, not decoration. The component owns every class, including
state modifiers, as **BEM modifiers rather than `data-*`**: a `data-*` attribute reads as an
API surface, and consumers will start selecting on it.

> `useSliderControl` used to emit `data-orientation` / `data-state` / `data-disabled` /
> `data-readonly` — the case the rule was written against. They were removed (sweep run 2,
> W5-А): its bags now carry only roles, `aria-*`, handlers and geometry; a range's root bag is
> `role="group"`.

Geometry that CSS needs travels the same way, as custom properties on the bag
(`--m-slider-percent`, `--m-slider-progress`). This is the one sanctioned use of runtime
custom properties: they carry *live measurements*, not theme values. Component colour and
state stay build-time Sass — see [architecture.md](../../architecture.md).

## Rules

- **Positioning belongs to the part, not the caller.** `left: N%` plus
  `transform: translate(-50%, -50%)` beats `left: calc(N% - 24rem)`: the second bakes the
  part's size into the parent's arithmetic.
- **No `onMounted` for initial data.** `useFetch` / `useAsyncData`. `onMounted` is only for
  browser Web APIs.
- **Every listener and timer is cleaned up.** Prefer VueUse's `useEventListener`; otherwise
  `onBeforeUnmount`.
- **Cache measurement, invalidate on scroll and resize, throttle with rAF.** A pointer
  handler that calls `getBoundingClientRect` per move is a bug waiting for a long list.
- **SSR is part of the contract.** The server HTML must already carry `role`, `tabindex`,
  `aria-*` and the resting position; callback refs must not leak into markup. Test it.
- **One controller per interaction pattern.** Two independent keyboard controllers for the
  same pattern (`useSliderControl` and `createRangeKeyboardController`) is a known,
  deliberate duplication — do not add a third silently.

## Accessibility is a behavioural axis

ARIA roles and keyboard maps are decided in the composable, once, and inherited by every
consumer of it. Keyboard coverage for a range-like control is the baseline: arrows, Page,
Home, End, and Shift for the ×10 step.

Where a native element can do the work, it does. `<MOtpInput>` draws N cells over **one**
real `<input maxlength=N autocomplete="one-time-code">` — paste, SMS autofill, backspace
across cell boundaries and screen-reader naming all come free, where N separate inputs would
mean fighting the browser for each of them.

A form gets values, not titles. `<MDropdown>` and `<MAutocomplete>` submit one
`<input type="hidden">` per chosen value under `name` (a whole item by its `id`), as
`<select multiple>` does; the visible input, which holds a title, submits nothing. The date and
time pickers submit `YYYY-MM-DD` and `HH:mm` the same way. A pasted one-time code keeps its
separators out of `invalid`: "123-456" from an SMS is not a mistake.

## Overlays and feedback

- **Focus moves onto the surface, not its first control.** A modal (`<MDialog>`, `<MSheet>`,
  `<MOverlay>` with a trap) focuses itself when it opens; content that deserves focus says so
  with `autofocus`. Closing returns focus to where it was before.
- **A menu is a menu.** `<MMenu>` always opens at its anchor (`placement`, logical `start` /
  `end`, mirrored in RTL). Arrows wrap, Home / End jump, a letter jumps by typeahead, Escape
  closes and gives focus back; Tab closes and moves on from the trigger, as if the menu
  followed it in the DOM. A disabled item stays in the arrow order as `aria-disabled`. Content
  that is not a menu (a listbox, a colour picker) floats in a private popover panel with no
  menu role. Items: `<MMenuItem>` and `<MMenuGroup>`; custom item markup takes `getItemAttrs()`
  from `useMenuControl`.
- **A modal answers.** `<MDialog>` / `<MSheet>` slots get `{ confirm, cancel, close }`;
  `confirm(payload)` emits `confirm`, `cancel()` and a user dismissal (scrim, Escape, swipe)
  emit `cancel(reason)`, `close()` and the parent's `v-model` give no answer. `useModal().open()`
  resolves `{ status: 'confirmed', value }` (falsy payloads kept) or `{ status: 'cancelled',
  reason }` (`cancel`, `outside`, `escape`, `swipe`, `programmatic`, `parent-closed`).
  `$material.modal.confirm()` / `.alert()` build an `alertdialog` from caller-given labels.
- **Announcements go through a persistent region.** A region mounted together with its text
  is not reliably announced. The overlay host and every open modal hold a `role="status"` /
  `role="alert"` pair; `<MSnackbar>`, `<MAlert>` and `<MBanner>` write their message into the
  pair of the layer they render in (a layer without one gets their own) and are not live
  regions themselves. `announce="off"` is for content already in the server HTML.
- **A tooltip describes from the start.** Its surface is in the document from mount; the
  trigger takes `aria-describedby` from the default slot's `props` (or, when it does not bind
  them, on its first focusable element). It shows on hover and on keyboard focus, never on a
  click, and on a long press on touch.
- **A dismissed block keeps focus on the page.** Closing `<MAlert>` / `<MBanner>` from inside
  moves focus to what follows it, else to the nearest heading before it (`return-focus="false"`
  leaves it to the caller).
- **`<MBanner layout="auto">` follows the window, not its container.** The banner is a
  page-level surface; in a narrow column pick `inline` or `stacked`.
