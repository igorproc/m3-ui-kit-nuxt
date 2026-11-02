# Axes

An **axis** is a named dimension of variation that means the same thing in every component
that has it. The kit's vocabulary is small on purpose: one word, one meaning.

## Canonical unions

Declared once in [`shared/types/props.ts`](../../../src/runtime/shared/types/props.ts), with
runtime definitions in [`shared/utils/props/index.ts`](../../../src/runtime/shared/utils/props/index.ts).

| Axis | Union | Means |
|---|---|---|
| `color` | `MColor` — `primary \| secondary \| tertiary \| error \| info \| success \| warning`; most components take `MAccentColor` (the first four), `MAlert` the four severities (`info \| success \| warning \| error`) | Semantic role, never a hue. |
| `variant` | `MVariant` — `elevated \| filled \| tonal \| outlined \| text \| plain` | Surface treatment: how the box is drawn and how much emphasis it carries. |
| `density` | `MFieldDensity` — `compact \| default \| comfortable`, default `default`. Declared in [`text-field/props.ts`](../../../src/runtime/components/ui/text-field/props.ts), not here; every other component aliases or narrows it | Scale. The single word for "how big / how tight", across the whole kit. |
| `shape` | `MShape` — the MD3 corner scale | Corner radius tier, mirrors `$theme-shape-link`. |
| `tag` | Per component | Which element the component renders as its wrapper. |

Component-local axes that are shared by a family, not by the kit, live with that family —
`MFieldLabelPlacement` in
[`text-field/props.ts`](../../../src/runtime/components/ui/text-field/props.ts), spread into
other fields via `mFieldProps`.

## Component axes

Axes that one component (or a few) owns. Each word is reserved below: a new component that
needs the meaning takes the word, and nothing else may take the word.

| Axis | Where | Values (default) | Means |
|---|---|---|---|
| `density` | `MLoading`, `MProgress`, `MSlider` (and the fields, buttons, avatar, list item, timeline) | `compact \| default \| comfortable` (`default`); `MSliderDensity` drops `compact` | Loading: indicator 16 · 24 · 32. Progress: a linear bar 2 · 4 · 8 thick, a circular ring 24 · 40 · 48 across. Slider: `default` is M3 XS (track 16), `comfortable` M3 M (track 40, inset icon). |
| `hierarchy` | `MTabs` | `primary \| secondary` (`primary`) | Where the tab row stands in the page: `primary` under the app bar, `secondary` inside the content. Not emphasis and not a colour role. |
| `scheme` | `MToolbar` | `standard \| vibrant` (`standard`) | The colour scheme of the whole bar: `vibrant` swaps its colour role. Not `variant`, which is a surface treatment. |
| `removal` | `MChip` | `none \| button \| whole` (`none`) | How the chip is removed: not at all, by a separate remove button beside the main action (the M3 input chip), or the whole chip is the remove button (a value in a field). Emits `remove`; named by `removeLabel`. |
| `origin` | `MSlider` | `start \| center` (`start`) | Where a single thumb's active track starts: the minimum or the middle (a centered slider). No effect on `range`; there is room for `end`. |
| `placement` | `MMenu` (`bottom-start`), `MTooltip` (`top`), the private popover (`bottom-start`); `MDropdown` passes `menuPlacement` (`bottom-start`) | `top \| bottom \| start \| end`, optionally followed by `-start \| -center \| -end` (`PopoverPlacement`) | The side of the anchor a floating surface opens on and the edge it aligns to. Logical words only: `start` / `end` follow the writing direction, and the surface flips when it does not fit. There are no physical `left` / `right`. |

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
| `hierarchy` | The level of a navigation row in the page (`MTabs`). | Emphasis or colour. |
| `scheme` | A colour scheme that swaps the role of a whole component (`MToolbar`). | Surface treatment — that is `variant`. |
| `removal` | How an item is removed (`MChip`). | Whether it is shown. |
| `origin` | Where a value's fill starts (`MSlider`). | Where a surface opens — that is `placement`. |
| `placement` | Where a floating surface opens against its anchor, in logical words. | A part inside a component — that is `<x>Placement`. |
| `<x>Placement` | Where a part sits (`labelPlacement`, `iconPlacement`, `actionPlacement`). | Alignment inside a part. |

### Note on `tag`

Two shapes exist today: `<MButton>` takes semantic values (`button | link`) and resolves the
element itself; `<MSurface>` takes the raw element name. Both are defensible — the semantic
form protects the button's accessibility contract, the raw form suits a passive container.
Follow whichever the component you are in already uses, and prefer the semantic form when
the element choice carries meaning.

## Current state

Narrowing correctly today: `alert` (`color`, `variant`), `avatar` (`variant`, `shape`),
`banner`, `surface`, `card`, `chip` and the button family (`variant`), `dropdown` and
`autocomplete` (`variant`, to `filled | outlined`), `slider` (`density`, to
`default | comfortable`); every component with an accent colour narrows `color` to
`MAccentColor` (except `MTimelineItem`, which takes every `MColor` role, S8-А).
`MTooltipVariant` adds `rich` to `Extract<MVariant, 'plain'>` — a taken exception, said so at
the declaration. The second taken exception is `MProgress` `shape: 'flat' | 'wavy'`: there
`shape` is the line's form, not the corner scale; it replaced the `wavy` flag under "an axis,
not a flag" (S10-А, 2026-10-30).

Family axes shared correctly: `mFieldProps` across `text-field`, `textarea`, `number-input`,
`dropdown`, `autocomplete`, `file-input`; `mChoiceFieldProps` (`path`, `name`, the support
line) across `checkbox`, `switch`, `radio`, `radio-group`, `slider`, `rating`.

An axis can also be *borrowed* by a component outside the family that has to line up with
it: `MListItemDensity` is `MFieldDensity`, taken whole, because a dropdown row and the field
that opens it must be the same height at the same density. `MButtonDensity`,
`MAvatarDensity`, `MTimelineDensity`, `MLoadingDensity` and `MProgressDensity` borrow it the
same way. Borrowing means aliasing the existing type, never re-typing its members.

`<MOtpInput>` deliberately does **not** spread `mFieldProps`, and the reasoning is worth
reading before you assume a field-shaped component should: three inherited props against
four that must be neutered or overridden. The shared look travels through the tokens
instead — see [craft.md](craft.md).

Free-standing unions that overlap a canonical axis: `text-field`, `textarea`,
`number-input` — the documented exception above. `surface` and `banner` were narrowed with
`Extract<>` on 2026-10-24 ([decisions.md](decisions.md#resolved)).

## Open questions

Real conflicts in the code. They need a decision, not a guess. Until each is answered,
follow the existing local convention of the component you are in and do not propagate it.

### OQ-1. The step set for `density` — closed

Closed on 2026-10-24 (Q11-А): the steps are `compact | default | comfortable`, as decided on
2026-10-07, and `size` is gone from the kit (`loading` and `progress` were the last). A
component that cannot use a step narrows the union (`MSliderDensity`) instead of inventing
one. See [decisions.md](decisions.md#resolved).

### OQ-2. `type` means two different things

Native passthrough (`MButtonType`, `MTextFieldType`) and component taxonomy (`MChipType`,
`MLoadingType` — `spinner | shape`, `MToolbarType` — `floating | docked`, `MAppBarType`,
`MProgress`'s `linear | circular`) share the word. The worst case is gone: `MAlertType`
(`info | success | warning | error`) was a *semantic colour role* wearing the name `type`,
and the alert now takes `color` (W52-А, 2026-10-24).

The rest is deliberately left open (Q12-Б): `type` genuinely carries a different meaning in
each place it appears, and reserving it now would force renames before the right split is
known. Do not introduce `type` on anything new until this is resolved.
