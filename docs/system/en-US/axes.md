# Axes

An **axis** is a named dimension of variation that means the same thing in every component
that has it. The kit's vocabulary is small on purpose: one word, one meaning.

## Canonical unions

Declared once in [`shared/types/props.ts`](../../../src/runtime/shared/types/props.ts), with
runtime definitions in [`shared/utils/props/index.ts`](../../../src/runtime/shared/utils/props/index.ts).

| Axis | Union | Means |
|---|---|---|
| `color` | `MColor` — `primary \| secondary \| tertiary \| error` | Semantic role, never a hue. |
| `variant` | `MVariant` — `elevated \| filled \| tonal \| outlined \| text \| plain` | Surface treatment: how the box is drawn and how much emphasis it carries. |
| `density` | **Value set not settled — see OQ-1.** | Scale. The single word for "how big / how tight", across the whole kit. |
| `shape` | `MShape` — the MD3 corner scale | Corner radius tier, mirrors `$theme-shape-link`. |
| `tag` | Per component | Which element the component renders as its wrapper. |

Component-local axes that are shared by a family, not by the kit, live with that family —
`MFieldLabelPlacement` in
[`text-field/props.ts`](../../../src/runtime/components/ui/text-field/props.ts), spread into
other fields via `mFieldProps`.

## Rule: narrow, never re-declare

A component that supports a subset of an axis **derives** it:

```ts
export type MAlertVariant = Extract<MVariant, 'tonal' | 'outlined'>
export type MAvatarShape = Extract<MShape, 'full' | 'large' | 'medium' | 'small'>
```

It does not write a lookalike union. A free-standing copy compiles fine and then drifts: the
day `MVariant` gains a member, the copy silently does not, and the two meanings of the word
part company without a single error.

The one legitimate exception is a family axis that is genuinely a *different* dimension
wearing a familiar name — the field `variant` (`filled | outlined | underline`) is the
shape of the input boundary, not the emphasis scale of a button. When you take that
exception, say so in a comment at the declaration, as `mFieldProps` does.

## Rule: an axis is not a flag

See [principles.md](principles.md#q1-is-this-an-axis-or-a-value). A boolean that names a
position, a mode or a style is a collapsed enum. Expand it before it ships.

## Rule: one word, one meaning

| Word | Reserved for | Not for |
|---|---|---|
| `variant` | Surface treatment / boundary style. | Severity, purpose, behaviour strategy. |
| `color` | `MColor` semantic role. | Arbitrary hues or brand accents. |
| `density` | **Scale, in all its forms.** The kit has one word for it: not `size`, not `scale`. | — |
| `shape` | Corner scale. | Silhouette or layout. |
| `mode` | A strategy the component runs (`lazy`, `overlay`, `time-picker`). | Anything with a visual meaning. |
| `tag` | The wrapper element the component renders as. | Anything about how it looks. |
| `type` | Unsettled — see OQ-2. Do not adopt it for anything new. | — |
| `<x>Placement` | Where a part sits (`labelPlacement`). | Alignment inside a part. |

### Note on `tag`

Two shapes exist today: `<MButton>` takes semantic values (`button | link`) and resolves the
element itself; `<MSurface>` takes the raw element name. Both are defensible — the semantic
form protects the button's accessibility contract, the raw form suits a passive container.
Follow whichever the component you are in already uses, and prefer the semantic form when
the element choice carries meaning.

## Current state

Narrowing correctly today: `alert` (`variant`), `avatar` (`variant`, `shape`).

Family axes shared correctly: `mFieldProps` across `text-field`, `textarea`, `number-input`,
`autocomplete`, `file-input`.

`<MOtpInput>` deliberately does **not** spread `mFieldProps`, and the reasoning is worth
reading before you assume a field-shaped component should: three inherited props against
four that must be neutered or overridden. The shared look travels through the tokens
instead — see [craft.md](craft.md).

Free-standing unions that overlap a canonical axis: `text-field`, `textarea`,
`number-input`, `dropdown`, `surface`, `banner`. The field trio is the documented exception
above; the rest are tracked in [decisions.md](decisions.md) with their migrations pending.

## Open questions

Real conflicts in the code. They need a decision, not a guess. Until each is answered,
follow the existing local convention of the component you are in and do not propagate it.

### OQ-1. The step set for `density`

The word is settled: `density` is the kit's only name for scale (see
[decisions.md](decisions.md)). The **values** are not. Three spellings exist —
`sm | md | lg`, `small | medium | large`, `compact | default | comfortable` — and picking
between them is not a naming question.

The kit's sizing is fluid: `root-scale()` rescales the root font size per breakpoint, so
every `rem` already moves with the viewport. A fixed three-step ladder on top of that may be
the wrong shape entirely — the honest answer has to come from real consumption: which steps
products actually reach for, and where the fluid scale already covers the need. Decide from
usage data, not from taste.

### OQ-2. `type` means two different things

Native passthrough (`MButtonType`, `MTextFieldType`) and component taxonomy (`MChipType`,
`MAlertType`, `MLoadingType`, `MToolbarType`, `MAppBarType`) share the word. Worse,
`MAlertType = info | success | warning | error` is a *semantic colour role* wearing the name
`type` — the one thing the kit already has a canonical axis for.

Deliberately left open: `type` genuinely carries a different meaning in each place it
appears, and reserving it now would force a rename before the right split is known. Do not
introduce `type` on anything new until this is resolved.
