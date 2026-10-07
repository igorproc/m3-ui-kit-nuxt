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
| `underline` for the selection family (`<MDropdown>`, `<MAutocomplete>`) | It is the only field shape with no container, and these put chips, a clear button and a menu anchor *inside* the box; a row of chips on a bare line has nothing holding it. It is also the Material 2 "standard" field, which M3 dropped. | Never for these two. If `underline` itself is reconsidered, that is a question for the whole field family. |
| Primitive arrays as `items` (`['Moscow', 'SPb']`) | `id` is mandatory on an item, so a bare string cannot be one. One `.map(v => ({ id: v, label: v }))` at the call site buys a resolver with no `typeof` branch in it. | — |
| Animated shape change (S3) and M3 Expressive springs (S4) are not used in components | A morph mechanism costs bundle for an effect a web UI already carries with colour and the state layer. A state's shape is static (a selected toggle is square, with no transition), and transitions run on the `--sys-motion-*` tokens. **Exceptions** (owner's decisions, 2026-10-07): the `<MFabMenu>` FAB turns into the close button on `M3_SPRING` springs (size and corners spatial, colour effects); toggle buttons (`selected` on `<MButton>` / `<MButtonIcon>`, the buttons of `<MButtonGroup>`) reach their selected shape on a spring (shape fast spatial, colour effects), like Compose's `ToggleButton`. A plain button and a press never change shape. The springs are sampled into CSS `linear()` (`springToCss`), so no per-frame loop ships. The JS springs of `MShape` and the loading indicator stay as they were. | A second component needs a morph — through the same `springToCss` recipe, not a new mechanism. |

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
| Selection in the dropdown family is **model-first**, not registry-first | A field holds a value before it holds options: a form loads `countryId` and the list arrives two ticks later. A selection that exists only as a registered ticket drops that value the moment the first option registers — and, worse, emits the shortened array back. Values with no matching item stay in the model and render from a fallback row. |
| Keyboard order comes from the data, not from the registry | `createRegistry.register` appends at the end, so an item inserted into the middle of a mounted list lands last in the registry while sitting third in the DOM. The rows are already `v-for`-ed from an array; that array is the order. Children still report their own state through the context. |
| An item's identity is its `id`, and the default comparator uses it | Two fetches of one record are two objects, so `===` loses the selection on every refetch. `id` is the one thing an item is required to declare. |
| Rows blocked by `max` are skipped by the arrows, not just marked | APG allows either. At the limit the only legal move is to deselect, and walking onto rows that cannot be chosen offers moves that do nothing. They keep `aria-disabled` and the disabled look. |
| The panel's `maxHeight` travels as a custom property | Live geometry supplied at runtime — the one case the zero-runtime rule allows. The token is the fallback, so a hundred options are capped without a prop. |
| Clamping the panel to the space actually available is `<MMenu>`'s job, not the dropdown's | Neither of the menu's two positioning paths clamps today, and the same gap affects tooltip and popover through `usePopover`. Fixing it inside the dropdown would fix one of three. |
| `<MButtonFab>` and `<MButtonExtendedFab>` keep `disabled` | M3 advises hiding a FAB rather than disabling it. The kit keeps `disabled` as an extension: "submit" forms disable the main action until the form is valid, and dropping the prop is a breaking change with nothing gained. |

## Settled, migration pending

Decided in principle; the code has not been moved yet. Each is a breaking public API change
and gets its own task. Do not half-apply them — follow the existing local convention until
the migration lands.

| Decision | Reason | Migration |
|---|---|---|
| `density` is the kit's only word for scale | `size` (`sm \| md \| lg`), `MLoadingSize` (`small \| medium \| large`) and `MFieldDensity` (`compact \| default \| comfortable`) were three spellings of one idea. The word is settled; the step set is not — see [axes.md](axes.md#oq-1-the-step-set-for-density). | Rename `size` → `density` across `avatar`, `loading`, `progress`; retire `MSize`. Values wait on OQ-1. |
| `plain` joins the canonical `MVariant` | `MSurfaceVariant` already added it as a free-standing member. It is a legitimate fifth surface treatment, not a component quirk. | Add to `MVariant`; `MSurfaceVariant` becomes `Extract<MVariant, …>`. |
| `MBannerVariant`'s `surface` member is a naming mistake | `surface` names a component, not a treatment. The value it means already exists in the canonical union. | Rename to the canonical member and narrow with `Extract<>`. |

## Resolved

| Decision | How it landed |
|---|---|
| `<MDropdown>` keeps its own `variant` for now | Closed by the dropdown rework: it spreads `mFieldProps` + `fieldDensityProp` and narrows `variant` to `Extract<MTextFieldVariant, 'filled' \| 'outlined'>`. `<MAutocomplete>` is the same component plus a filter, so it takes the same props from `mDropdownProps`. |

## Open

Live in [axes.md](axes.md#open-questions): the step set for `density` (OQ-1) and the two
meanings of `type` (OQ-2). Both need a human decision.
