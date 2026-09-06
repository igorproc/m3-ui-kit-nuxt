# Decisions

A closed question stays closed until something new arrives. This is the register of what was
argued once — half of it is what the kit deliberately **does not** have.

Reopen an entry only with new information: a real customer, a changed platform behaviour, a
constraint that no longer holds. Add an entry whenever you reject something for a reason you
would otherwise have to re-derive.

## Removed / rejected

| Decision | Reason | Reopen when |
|---|---|---|
| `variant="ghost"` removed from the field family | No consumer in the kit — only tests and lab pages. Breaking API change; nearest replacement is `outlined`. | The named customer exists: an editable table cell / inline edit. |
| `terminal` field shape dropped | Niche. | A product need appears. |
| `underline` rejected for `<MTextarea>` | A single line under a multi-line block reads as an unclosed box. | — |
| `inline` (two-column) label placement not shipped on single fields | Its value is that every row's label column is the same width; one field has nothing to align with, so a per-field column just eats width. | `MFieldGroup` exists — it belongs there. |
| Blinking caret in `<MOtpInput>` | Focus is expressed by colour everywhere in the kit; this would be the only blinking element. The active cell's ring already satisfies WCAG 2.4.7. | — |
| `complete` visual state in `<MOtpInput>` | `primary` means *active*; painting a finished code in it merges two roles, and at completion there is no active cell. Confirmation belongs to the application. The `complete` **event** stays. | — |
| `hideLabel: boolean` | An enum of one pretending to be a flag. Became `labelPlacement`. | — |
| `MFieldGroup` (the spec's `row` shape) | Deferred, not rejected. | Taken up as its own task; `inline` placement returns with it. |

## Architectural trades

| Decision | Reason |
|---|---|
| Density is a **choice**, not derived from available space | A 320px field is a thumb target in onboarding and a mouse target in a settings sidebar, at the same width. |
| Height-based container queries are not used | They require `container-type: size`; a `contain: size` box collapses to zero when its height is `auto`, which a form column almost always is. Only `inline-size` is safe, and width is a poor proxy. |
| Density implemented in pure Sass, not three CSS custom properties | The custom-property version would be half the source, but zero-runtime deliberately buys the absence of a runtime with compiled CSS size. `@each` over three steps keeps the *source* compact; only the output grows, which is the intended trade. |
| `compact` floored at the 24px WCAG 2.5.8 hit-target minimum | Accessibility floor, not taste. |
| Floating label never animates | A moving label makes the resting state ambiguous and breaks autofill. The spec bans the motion, not the position. |
| Field defaults: `float` for text-field and number-input, `top` for textarea | Chosen so the axis introduction changed nothing visually — and because each is the right resting look for that field. |
| `<MOtpInput>` is one native input under N drawn cells | Paste, SMS autofill, cross-cell backspace and screen-reader naming all work for free; N inputs means fighting the browser for each. |
| `sanitize()` keeps NFKC normalisation and Arabic-Indic → ASCII digit mapping | A code pasted from an Arabic SMS must work. |
| `g()` dot separator is canonical; dash is legacy and warns | A dash path cannot address a key containing a dash, and resolved to `null` silently for ~99 call sites. |
| `createRangeKeyboardController` left as a second keyboard controller | Known duplication with `useSliderControl`, consciously not touched. Do not add a third. |

## Settled, migration pending

Decided in principle; the code has not been moved yet. Each is a breaking public API change
and gets its own task. Do not half-apply them — follow the existing local convention until
the migration lands.

| Decision | Reason | Migration |
|---|---|---|
| `density` is the kit's only word for scale | `size` (`sm \| md \| lg`), `MLoadingSize` (`small \| medium \| large`) and `MFieldDensity` (`compact \| default \| comfortable`) were three spellings of one idea. The word is settled; the step set is not — see [axes.md](axes.md#oq-1-the-step-set-for-density). | Rename `size` → `density` across `avatar`, `loading`, `progress`; retire `MSize`. Values wait on OQ-1. |
| `plain` joins the canonical `MVariant` | `MSurfaceVariant` already added it as a free-standing member. It is a legitimate fifth surface treatment, not a component quirk. | Add to `MVariant`; `MSurfaceVariant` becomes `Extract<MVariant, …>`. |
| `MBannerVariant`'s `surface` member is a naming mistake | `surface` names a component, not a treatment. The value it means already exists in the canonical union. | Rename to the canonical member and narrow with `Extract<>`. |
| `<MDropdown>` keeps its own `variant` for now | It re-declares the field boundary axis without being a field. The component is queued for its own rework, and deciding its family before that work starts would prejudge it. | Revisit when the dropdown rework begins: either it takes `mFieldProps` or its axis earns a documented justification. |

## Open

Live in [axes.md](axes.md#open-questions): the step set for `density` (OQ-1) and the two
meanings of `type` (OQ-2). Both need a human decision.
