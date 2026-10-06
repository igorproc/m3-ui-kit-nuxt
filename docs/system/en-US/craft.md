# Craft

The rest of this folder describes what a component **is**: its axes, its anatomy, the decisions
already taken. This chapter is about how it must **look** — and, more precisely, about the ways
a Material 3 component quietly stops being one.

The failure mode is not ugliness. It is regression into a different system: Material 2 with its
elevations and its heavier chrome, or a form toolkit — Bootstrap, shadcn — with its hairlines,
its swapped backgrounds and its rings. Those regressions arrive one reasonable-looking property
at a time, and each of them can be named.

Every rule below is followed by the actual failure that produced it. A rule without its failure
is folklore, and folklore gets ignored the first time it is inconvenient.

---

## 1. Why a Material component ends up looking like Bootstrap

Four mistakes account for almost all of it. They are independent, and a component usually has
several at once.

### The hairline

**Material never draws a divider inside a control.** It separates by *tone* and *shape*. A
1px rule between the parts of one object is the single strongest visual signal that a component
came from a form toolkit rather than a design system.

`<MNumberInput>` had three of them at once — `−` │ value │ unit │ `+`. That is
`input-group` verbatim. `<MTextarea>`'s composer footer had a fourth, plus a surface a full
tone *below* its own container, so two distant surfaces met inside one border.

The replacement is not "a thinner line". It is a step of surface tone, a corner radius of its
own, and an inset from the container edge — the zone becomes an object sitting inside the box
instead of a slice cut out of it.

> **Trap.** `filled` containers already sit on `surface-container-highest`. There is no tone
> above it. There the step is a state layer over the container, not the next surface. Check
> which surface you are on before reaching for "one tone up".

### The background swap

A state that replaces `background-color` is not a state layer. The MD3 state layer is an
**overlay in the element's own ink** at a fixed opacity — 8% hover, 12% pressed — painted over
whatever surface is underneath.

The difference is not pedantry. A pre-mixed hover colour cannot sit on a transparent container,
which is why the old textarea carried `filled.hover.surface` *and* `ghost.hover.surface` as
separate tokens: two colours for one state, because a mix has to know what it is mixing with.
One `::before` layer replaced both.

```scss
&::before {
  position: absolute;
  inset: 0;
  z-index: -1;              // over the surface, under the value
  background-color: g($t, 'input.color');
  content: '';
  opacity: 0;
}
```

> **Trap.** `z-index: -1` escapes to the nearest stacking context. Give the container
> `isolation: isolate` or the layer will slide behind an ancestor's background.

### The property grown for a state

**A variant expresses a state with the property it already owns.** `outlined` owns a border →
error moves `border-color`. `filled` owns a container → error moves its tone. `underline` owns
a line → error moves the line.

An `outlined` field that grows a background on error has invented a surface that exists in none
of its other states, and has to animate it from `transparent`, which snaps while the border
eases. Two states of one variant should differ in a value, never in a property list.

### The midline two things can disagree about

`<MNumberInput>`'s icons sat on the container's vertical centre while the value sat lower —
pushed down by the asymmetric padding that clears a floating label. Two objects, two different
notions of "middle", visibly out of line.

The fix was not a nudge. Full-height zones **have no midline**: a zone that spans the whole box
cannot disagree with anything about where its centre is. And it adds no height of its own, which
is what a nested icon button with its own `min-height` was doing to the row.

The general move: when two things must align, look for the axis on which they are allowed to
disagree and remove it, rather than measuring one against the other.

> Where the value genuinely does sit low — a label inside a `filled` box — derive the offset
> instead of picking it: `(padding.top − padding.bottom) / 2`. A derived number survives a
> token change; a measured one does not.

---

## 2. Axis discipline

### A flag is an axis with one value

`scrub` was a boolean while `split` and `stacked` were values of `controls` — but a field cannot
be a split stepper *and* a drag handle. Three mutually exclusive things, one of them wearing a
different type. It became `controls: 'split' | 'stacked' | 'scrub' | false`.

`hideLabel` was the same shape: an enum of one, next to a family that already had
`labelPlacement`.

**Test:** can two of these be true at once? If not, they are one axis. Do they answer the same
question? If yes, they are one axis, whatever their types say.

### Narrow the enum; never switch the mechanism

`<MTextarea>` narrows `variant` to `'filled' | 'outlined'`. `<MOtpInput>` narrows
`labelPlacement` to `'top' | 'hidden'` — a code has no single container for a label to float
into, so two of the four placements are impossible.

Narrowing keeps one vocabulary. Introducing `hideLabel` because "here it is only two values"
gives the reader two ways to say one thing, and the second one has to be replaced the day a
third value appears.

### Share the design language, not the props factory

`<MOtpInput>` deliberately does **not** spread `mFieldProps`. The arithmetic:

| gains | costs |
|---|---|
| `required`, `helperText`, `rounded` | `autocomplete` must be pinned to `one-time-code` and never exposed |
| | `labelPlacement` — three of four values impossible |
| | `variant` — type overridden anyway |
| | `placeholder` — a per-cell pattern here, not a hint |

Three to four is not inheritance, it is family resemblance bought on credit. The shape axis and
the colour roles are shared through the **tokens**, which is where a shared look belongs.
`mFieldProps` describes "a field with one control in a container"; an OTP is a fixed-length code
behind N drawn cells.

> A prop you must immediately neuter is a trap for whoever reads the API table.

### A slot beats a prop when the content is an action

What stands beside an OTP field is "Didn't get a code? Resend", a countdown, "Paste from
clipboard". Those are actions, not strings — `#support`, not `helperText`. The inherited prop
would not have fitted even if inheritance had been free.

Where the element carries accessibility wiring, the slot fills **content only**. `<MOtpInput>`'s
`<label>` carries the `id` that `aria-labelledby` points at and the `for` that ties it to the
input; hand the element out and a consumer can silently ship an unnamed field.

---

## 3. One home per default

A default that lives in two places will eventually disagree with itself, and only one of the two
copies appears in the generated API table.

`rows` had **three** copies of `3`: the prop default, a `?? 3` in `useTextareaControl`, and
`DEFAULT_ROWS = 3` in `useTextareaResize`.

**The default belongs to the prop. A composable takes a resolved configuration, not a wish
list** — fields the component always supplies are required in the composable's props interface,
so it cannot invent a second opinion.

```ts
export interface OtpValueProps {
  length: number                          // required: the default is the prop's
  mode: 'numeric' | 'alphanumeric'
  groups?: number[]                       // optional: absence means "no grouping"
}
```

Optional stays optional only where absence is itself the meaning.

### What is extracted into a constant, and what is not

- **Numbers and booleans** — literals on the prop. `rows: 3`, `step: 1`. Wrapping them hides
  the value behind a name in the API table and buys nothing.
- **Phrases** — `shared/constants/messages.ts`. Gathered so a message source can be attached
  later; the props stay, so changing one string never means touching the map.
- **Icon names** — `shared/constants/icons.ts`, used as `:name="ICONS.add"`. A literal icon
  name in a template is unfindable and untranslatable to another icon set.
- **Facts about how the component works** — `shared/constants/otp.ts` holds the alphabets, the
  digit blocks `NFKC` does not fold, and `autocomplete: 'one-time-code'`. These are not defaults
  a user picks; no prop configures them.

---

## 4. Silence is the enemy

The expensive bugs in this kit have all been silent. None of them threw.

| failure | what it looks like | what catches it |
|---|---|---|
| `g()` misses a token path | the declaration vanishes; the rule never renders | `g()` now `@error`s on a dot path |
| a dash path splits a key that contains a dash | same, and it has been happening for years | the same check, as a warning |
| a Sass error in an SFC | reaches the consumer's dev server | `npm run lint:scss` |
| a Sass deprecation | drowns in other warnings | the same check, reported separately |
| a dev-only `console.warn` | invisible under Vitest | nothing — accepted, documented |

`nuxt-module-build` copies the runtime verbatim and Vitest renders in jsdom without a
preprocessor: **nothing in the kit's own pipeline compiles component SCSS.** That is why
`scripts/scss-smoke.mjs` exists.

Turning the token check on found **102 dead paths across 19 components** — rules that have never
rendered. `grid-name`, `min-height`, `hover-color`: the legacy dash separator splits a key that
itself contains a dash. Fixing one of those does not "clean up code", it **turns CSS on**, and
the component's current appearance is the appearance *without* that rule. Treat each as a visual
change, not a refactor.

> Compiling is not correctness. After adding a generated rule, read the emitted CSS once —
> `min-height: null` compiles perfectly and produces nothing.

---

## 5. The escape hatch, and what it forbids

Three layers: pure logic → behavior composable → one possible markup.

**The contract:** delete the component tag, keep the composable and `v-bind` on raw markup, and
the behavior is intact. Which means the composable **produces no classes and no `data-*`** —
presentation is entirely the consumer's.

This is not a style preference, it is testable, and each control composable has a spec that
mounts its attr bags onto anonymous `<div>`/`<i>` markup with no kit class names anywhere. A
composable that leaks a class name cannot pass it.

Consequences worth knowing before you fight them:

- The composable owns the *relationships* — `for`/`id`, `aria-describedby`, `aria-controls` —
  because those are behavior, not decoration.
- The component owns every class, including state modifiers. BEM modifiers, not `data-*`
  attributes: `data-*` reads as an API surface consumers will start selecting on.
- Anything the composable exposes for iteration should already be shaped for the template.
  `groups: OtpCell[][]` beats handing back ranges and an index helper.

---

## 6. Accessibility decisions that are really design decisions

**One real input under a drawn grid.** `<MOtpInput>` is a single
`<input maxlength=N autocomplete="one-time-code">` laid transparently over N drawn cells. The
alternative — N inputs — means re-implementing paste, SMS autofill, backspace across a boundary
and caret movement, and it announces N unnamed fields. Every drawn cell is `aria-hidden`; the
value lives in the input.

**A state is never colour alone.** The error state needs a non-colour carrier — a glyph in the
support line, and the message text. `error` set without `errorMessage` is exactly the case where
the glyph is the only thing left.

**Focus is a colour change.** No ring, no border thickening, no blinking. A width change has to
be paid back in padding, and neither transitions smoothly, so both snap while the colour eases.

> The one exception costs the whole rule. A blinking caret was drafted for the OTP active cell,
> then dropped: it would have been the only blinking element in the kit and a direct exception
> to "focus is colour". The cell border says the same thing, and WCAG 2.4.7 is satisfied by it.

**Density is a semantic axis, not a measured one.** It cannot be derived from the container:
a height query needs `container-type: size`, which stops the container measuring itself from its
content and collapses an auto-height column to zero. Width would work mechanically and still be
wrong — a 320px field is a thumb target in onboarding and a mouse target in a settings sidebar.
`compact` is floored so a hit target never drops below the 24×24 of WCAG 2.5.8; a derived
density would cross that silently.

**The kit ships no user-facing copy it cannot translate.** `<MOtpInput>` has no default label —
it warns in dev when neither the prop nor the `#label` slot is given, because the alternative is
an English name reaching a screen reader in a Russian app, or silence reaching it in any app.

---

## 7. Motion is feedback

Colour, and the height of a box that grows. Nothing moves position; a label that animates on
focus makes the resting state ambiguous and breaks autofill.

**One mechanism per browser, never two.** The textarea's growth used to run `field-sizing:
content` in CSS *and* write inline `style.height` from JS. Chrome obeyed one, Firefox the other,
and `rows`/`maxRows` were ignored wherever the native path won.

**A gesture is absolute, not incremental.** The number-input scrub snapshots the value at
`pointerdown` and recomputes `base + steps × step` on every move. Dragging back to the starting
point restores the original value exactly, and a modifier pressed mid-gesture rescales the whole
drag instead of leaving a seam.

---

## 8. Coordinate spaces, and the off-by-one they hide

Caret positions outnumber cells by one: a six-digit code has seven caret positions, and the
seventh sits past the last cell. Clamping the caret onto the last cell —
`Math.min(caret, length - 1)` — produced two bugs from one line: a full field lit a cell for no
reason, and the first ArrowLeft did nothing, because the caret moved 6 → 5 while the clamped
index stayed at 5.

**Do not clamp one coordinate space onto another to make the types line up.** If the caret is
past the grid, no cell is active. That is the truth, and it is also the answer to "why does the
last cell look selected".

Related: **a draft is not a value.** While the user types, the visible string is authoritative;
`-`, `1.` and `""` are legitimate intermediate states. Never clamp on a keystroke — a field that
rewrites `1` to the minimum `10` while the user is on the way to `100` is broken. Clamp on
commit, and report the pull-back so the consumer can explain it.

---

## 9. Test smells

**A test that encodes a bug.** `never points past the last position` asserted the clamped
behaviour above. When the fix landed, the test failed — correctly. Before rewriting a failing
test, check whether it was describing the defect.

**jsdom is not a browser, and the gaps are behavioural.** `element.focus()` fires no focus event
for a node outside the document — focus tests need `attachTo: document.body`.
`selectionchange` never fires; dispatch it. `import.meta.dev` is `false`, so a dev-only warning
cannot be asserted without weakening the guard in production code — leave it uncovered and say
so in a comment.

**Watch the right event.** The OTP caret was tracked on `click` and `keyup`. A held arrow key
repeats `keydown` and fires `keyup` once, so the highlight froze while the key was down and
teleported on release. `selectionchange` is the only event that reports every way a caret moves:
key repeat, pointer, drag-selection, and programmatic `setSelectionRange`.

---

## 10. Zero-runtime is a trade, not a slogan

Resolving everything in Sass means the output CSS is larger — a density axis emits every
height-dependent rule three times. **That is the trade being bought**, not a smell to optimise
away. The alternative, custom properties per component state, moves the cost to every render on
every user's machine.

Custom properties stay legal for one thing: **live geometry** that only the runtime can know —
`--m-textarea-rows`, `--m-slider-percent`. A value that is knowable at build time and expressed
as a custom property is a bug.

---

## 11. Scrollbars

A rounded scroll container drew its scrollbar edge to edge — into the curve and over the border.
Two causes, and neither of them threw.

**`border-radius` does not clip a scrollbar.** The track runs the full height of the box whatever
its corners do, so the kit shortens it instead: the global scrollbar rule gives the track
`margin-block: var(--ui-scrollbar-inset-block)`, and every rounded scroll container in the kit
sets that property to its own corner radius. One of yours needs exactly one line:

```scss
.my-panel {
  --ui-scrollbar-inset-block: var(--sys-shape-corner-extra-large);

  overflow-y: auto;
  border-radius: var(--sys-shape-corner-extra-large);
}
```

Pass the token the radius comes from, not a number — a measured inset does not survive the next
shape change. The property is reset on every element, so it never reaches a scroll container
nested inside yours; the reset has no specificity, so your class wins on its own element.

**The standard properties switch the styled scrollbar off.** Since Chrome 121 an element that
sets `scrollbar-width` or `scrollbar-color` loses every `::-webkit-scrollbar` rule: the inset
thumb, its rounded ends, its hover tone, and the track margin above. The kit sets the standard
pair only under `@supports not selector(::-webkit-scrollbar)` — Firefox, today. Do not add
either property to a component "for Firefox"; in Chrome it quietly replaces the kit's scrollbar
with the plain one. `scrollbar-width: none` to hide a scrollbar is the exception — hiding is all
it is asked to do.

This is the one custom property the kit asks a consumer to set, and it does not contradict
section 10: it is not a component state but the single input of a rule every scroll container
shares.

> **Trap.** The margin shortens a vertical scrollbar only, and Firefox has no track margin at
> all — there the thin scrollbar still reaches the corners.

---

## Where this chapter ends

The other files in this folder answer "what is this component and which axes does it have".
This one answers "why does it look wrong". When a statement here hardens into something that is
no longer decided per component — a rule with no remaining judgement in it — move it to
[axes.md](axes.md), [color-and-state.md](color-and-state.md) or
[decisions.md](decisions.md), and leave the failure story here.

Whatever moves, moves **in both locales**. A rule that exists in one language only is not a
rule.
