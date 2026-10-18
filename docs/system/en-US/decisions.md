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
| Segmented list style, row reorder, row swipe, expandable row (M3 Expressive) | No customer in the kit; section groups are built from `MListSubheader` and disclosure from `MExpansionPanel`. | A settings screen made of segmented groups, a sortable list or a row gesture appears. |
| A button card (`MCard` as `<button>`) and a "stretched link" with actions on top | A clickable card is navigation: `tag="link"` makes the whole card the link. An action in place is an `MButton` in `#actions`. | A card that acts in place and still carries its own actions gets a customer. |
| Status tones on `MTimelineItem` (`success | warning | info`) | They have no M3 role (`MColor`), so a tone → role mapping would be invented. A hidden `status` word and the `icon` carry the meaning; `color` carries the role. | The system gains success and warning roles. |
| Single-row selection on `MTable` (a `selection` axis) | No customer. Opening a record is `row-click`, with a control in the cell as the keyboard path. | A list → detail screen is built on a table. |
| `column.maxWidth` on `MTable` | Browsers ignore `max-width` on table cells. `width` plus wrapping (`overflow-wrap: anywhere`) caps a long value. | — |
| A character counter on `MTextField` | Long input is `MTextarea`, with the counter in the support row. | A single-line field with a hard limit appears. |
| A docked date picker (`MDateField`) | The recipe is field → `MDialogDate`. | Dense filters and tables need one. |
| A date range picker | No customer; the docs promise is withdrawn. | A customer appears. |
| `MDialogTime` | The recipe is `MDialog` + `MTimePicker` + `validate()`. | The first customer appears. |
| Time picker rich colours and ScrollField | The Material3 API is still moving. | The API stabilises. |
| `MConfirmEdit` as a component | Confirmed editing is the `useConfirmEditTransaction` composable plus a recipe. | Two products build the same markup. |
| The English default `aria-label="Loading"` on `MLoading` | The kit ships no copy that cannot be in the app's language. A host (button, table, OTP) announces being busy itself through `aria-busy` and hides the indicator; a standalone indicator is named by the consumer, with a dev warning when it is not. | — |

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
| A section label inside `ul` is a plain `li` with no role | axe (rule `list`) rejects any direct child of `ul` with an explicit role other than `listitem`, so `li role="presentation"` is out. Cost: a screen reader counts the label as an item; the text reads in order and an `<h3>` in the slot keeps heading navigation. Nested groups (`MListGroup`) were rejected earlier. |
| `MList` is a `ul` without `role="list"` | With the explicit role axe switches to `aria-required-children` and rejects a heading in a label. Cost: Safari VoiceOver may not announce a `list-style: none` list. |
| Collapsed `MExpansionPanel` content is `inert` | Fields in a closed panel leave the tab order and the accessibility tree (A11-11). Cost: find-in-page does not find text in closed panels — the `hidden="until-found"` proposal covers that. |
| `MTimeline` rail ends come from `:first-child`/`:last-child`, not the registry | A registry knows the last item only after all have registered, so the server rendered every item as last. A structural selector is right in SSR. |
| `MTimeline`'s time column is decided by CSS `:has()`, not JS | It is a timeline-level decision the server must render right. Without `:has()` the three columns stay. |
| `MTable` draws a row's state layer on every cell | A `tr` cannot reliably hold a `::before` layer. |
| A dropdown panel row matches the field height (44 / 56 / 64), not M3's 48 | The panel continues the field. |
| `MOtpInput` has no `density` axis | The 48 cell is the touch target for a code. |
| The time model is always a 24-hour `HH:mm` string | `hourCycle` only changes the display, `h23` by default. |
| `MTable` row selection lives in the model and survives page changes; "select all" covers the current page; rows that vanish from the data are not dropped from the selection by the table | With server pagination the table cannot tell a row on another page from a deleted one, and selecting across all pages needs all the data. The app removes deleted records from its `v-model`. Owner decision 2026-10-08. |
| The system key `disabled-container-subtle: 4%` in `$theme-state-link` is the one exception to "derive new values with `calc()` from existing ones" | M3 fills a disabled filled field with `on-surface` at 4% (Compose `DisabledContainerOpacity = 0.04`), which no existing opacity yields. Owner decision 2026-10-08; any further exception needs the owner again. |
| A disabled field's helper text is 38%, as in M3, although axe reports it as a contrast failure | WCAG 1.4.3 exempts inactive components, but axe knows that only for text inside `disabled` / `aria-disabled`. `expectNoAxeViolations` skips `color-contrast` inside a root with the `--disabled` modifier. Owner decision 2026-10-08. |
| `spacing()` takes any step from a consumer (`spacing(96)` → `96rem`); the 4-unit scale binds only the kit's own code | The module injects the kit's abstracts into the app's styles, so the kit's internal discipline became a ban on any gap the user might need. Strictness is the `$spacing-strict` flag, set only by `lint:scss` for `src/runtime`. Owner decision 2026-10-08. |

## Settled, migration pending

Decided in principle; the code has not been moved yet. Each is a breaking public API change
and gets its own task. Do not half-apply them — follow the existing local convention until
the migration lands.

| Decision | Reason | Migration |
|---|---|---|
| `density` is the kit's only word for scale | `size` (`sm \| md \| lg`), `MLoadingSize` (`small \| medium \| large`) and `MFieldDensity` (`compact \| default \| comfortable`) were three spellings of one idea. The word is settled; the step set is not — see [axes.md](axes.md#oq-1-the-step-set-for-density). | `avatar` moved (2026-10-07). Still to rename `size` → `density` in `loading`, `progress`; retire `MSize`. Values wait on OQ-1. |
| `plain` joins the canonical `MVariant` | `MSurfaceVariant` already added it as a free-standing member. It is a legitimate fifth surface treatment, not a component quirk. | Add to `MVariant`; `MSurfaceVariant` becomes `Extract<MVariant, …>`. |
| `MBannerVariant`'s `surface` member is a naming mistake | `surface` names a component, not a treatment. The value it means already exists in the canonical union. | Rename to the canonical member and narrow with `Extract<>`. |
| A hairline is `max(1px, 1rem)` in every outlined component | The kit's root scales with the viewport width (`1rem` is a design pixel), so on a narrow screen `1rem` falls below one device pixel and the line fades or disappears. `max()` keeps at least one pixel; nothing changes on a wide screen. Owner decision 2026-10-08; expressed in component maps, no system token. | `divider`, `avatar`, `table` have moved. Sweep the remaining maps with a `1rem` stroke (fields, card, chips, buttons, …) as a task of its own. |

## Resolved

| Decision | How it landed |
|---|---|
| `<MDropdown>` keeps its own `variant` for now | Closed by the dropdown rework: it spreads `mFieldProps` + `fieldDensityProp` and narrows `variant` to `Extract<MTextFieldVariant, 'filled' \| 'outlined'>`. `<MAutocomplete>` is the same component plus a filter, so it takes the same props from `mDropdownProps`. |

## Open

Live in [axes.md](axes.md#open-questions): the step set for `density` (OQ-1) and the two
meanings of `type` (OQ-2). Both need a human decision.
