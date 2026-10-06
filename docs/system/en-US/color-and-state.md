# Colour and state

## Colour is a role, never a hue

`MColor` is `primary | secondary | tertiary | error`. A component asks for a *role* and the
theme decides the pixels. There is no place in a component where a colour is chosen because
it looks right.

### The role table

Derived from the field family and binding on anything with the same shape of meaning —
cells, chips, items in a list, steps, segments.

| Situation | Role |
|---|---|
| Empty / no content | `outline-variant` |
| Has content | `outline` |
| Active — the thing the user is acting on right now | `primary` |
| Error | `error` (plus `error-container` where a container exists) |
| Disabled | the same property at the disabled opacity, never a different colour |

**`primary` belongs to activity alone.** Having content is not emphasis, it is having
content. This is why `<MOtpInput>` has no `complete` visual: if `primary` marks the active
cell, painting a finished code in it merges two roles — and by the time the code is
complete there is no active cell. Confirmation is the application's job, not the field's.

## States

Every interactive component handles five: **initial, hover, pressed, focused, disabled**.
Hover and pressed are `color-mix` at the MD3 opacities, resolved at build time. The
opacities live in one map (`$theme-state-link`: hover 8%, focus 10%, pressed 12%,
dragged 16%, disabled container 12% / content 38%) and are read with `state-opacity()` —
never a literal:

```scss
@include can-hover {
  &:hover {
    background: color-mix(in srgb, #{$color} state-opacity(hover), transparent);
  }
}
```

Every `:hover` rule sits inside `@include can-hover` (`@media (hover: hover)`), so a tap on
a touch screen does not leave the state stuck. Keep `:focus-visible` and other states
outside it. `npm run lint:scss` fails on a bare `:hover`.

### One property per state

A state is expressed with a property the variant already owns. `outlined` errors on
`border-color`, `filled` on container tone, `underline` on its line. Nothing grows a new
property for a state — see [principles.md](principles.md#q2-does-the-component-already-own-the-property-this-state-needs).

### A state is never colour-only

Colour alone fails colour-blind users and low-contrast displays. Pair it: an icon, a border,
a message, a position. The support line under a field is reserved height for exactly this
reason — the layout must not move when an error appears.

### Focus is colour, not motion

Across the whole kit, focus is a colour change: no ring, no thickened border, never an
animation. A width change has to be paid back in padding, and neither transitions smoothly,
so both snap while the colour eases. `<MOtpInput>` has no blinking caret for this
reason: it would have been the only blinking element in the kit, and the active cell's ring
already satisfies WCAG 2.4.7.

Focus outranks error on the edge: an invalid field takes the focus colour while it is
focused, and the error stays in the label, the message and its icon — which a state must
have anyway. Read-only fields show focus like any other. Every other control (buttons,
chips, items, thumbs) uses the shared `@include focus-ring`. In forced colors an error edge
is dashed: a system colour for it can vanish on a light contrast theme, a line style cannot.

The one case where a caret and a ring genuinely disagree — returning to edit a fully typed
code, where the caret sits *after* a character while the ring highlights the cell — was
judged too rare to buy a new mechanism.

### Labels do not move

A floating label sits on the container's top edge and stays there. Animating it makes the
resting state ambiguous and breaks autofill. `float` is a *position*, not a transition.

### Elevation is a level, never a shadow

A shadow is one of the MD3 levels 0–5, read with `elevation(n)` — never a literal
`box-shadow`. The levels are `--sys-elevation-level0…5` on `:root`, tinted from the theme's
`shadow` role. A state that raises a component moves it exactly one level up (elevated
button and card 1 → 2 on hover, FAB 3 → 4); `elevation()` fails the build on any other key.

## Tokens

Colour and state values come out of the component's own `$tokens` map via `g($t, 'a.b.c')`.

**Use the dot separator.** The legacy dash form cannot address a key that itself contains a
dash (`active-outline`, `min-height`, `hover-color`) — it splits the key and resolves to
`null` silently. That is how all four `<MOtpInput>` cell states shipped rendering nothing.
Convert a file wholly when you touch it; mixing the two separators in one file is the exact
mechanism that produced the bug.

`npm run lint:scss` is what catches this. Run it after any `<style>` or token-map change.
