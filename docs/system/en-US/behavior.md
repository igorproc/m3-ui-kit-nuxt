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

> `useSliderControl` still emits `data-orientation` / `data-state` / `data-disabled` /
> `data-readonly`. It predates the rule and is the case the rule was written against — do
> not copy it into a new composable.

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
