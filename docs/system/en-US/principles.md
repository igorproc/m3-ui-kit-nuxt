# Principles

## 1. Creativity moves up an axis, it does not disappear

The system does not forbid design decisions. It relocates them. You stop deciding *what an
OTP field looks like* and start deciding *what axes a field has at all*. One creative
decision about an axis (`labelPlacement` instead of `hideLabel`) settles fifty future
micro-decisions — and those fifty become derivable, checkable, non-negotiable.

So: **the axis is authored, the component is derived.** If you are being creative about a
component, you are probably working at the wrong altitude.

## 2. There are two systems, not one

The visual spec describes **form**: shape, colour, placement, density, states. That is why
`badge`, `chip`, `text-field` and `otp-input` feel systematic.

`slider`, `table`, `date-picker`, `autocomplete` are mostly **behaviour**, about which the
visual spec says nothing. They are not outside the system — their half of it is simply
written in TypeScript instead of Sass, and was never declared a system. It exists and it is
consistent: attribute bags, `data-*` state, the `math → control → presentation` layering,
the "delete the component tag and the behaviour survives" contract.

Treat [behavior.md](behavior.md) as the equal of [axes.md](axes.md). A behaviour-heavy
component is not a licence to freestyle; it obeys a different chapter.

## 3. The five questions

Run a decision through these whenever you feel you are guessing. Each is derived from a
precedent already in the repo.

### Q1. Is this an axis or a value?

A boolean flag is almost always a collapsed axis that currently has one value.
`hideLabel: boolean` was an enum of one pretending to be a flag; it became
`labelPlacement: 'top' | 'float' | 'inset' | 'hidden'`. `scrub` became part of `controls`
the same way.

A flag is honest only when a second value cannot physically exist (`disabled`, `required`,
`autofocus`).

### Q2. Does the component already own the property this state needs?

A state is expressed with a property the variant already has. `outlined` shows an error by
colouring its border, `filled` by its container tone, `underline` by its line. None of them
grows a new property for the occasion — an `outlined` field does not gain a background on
error, because it has no background in any other state and animating one from `transparent`
snaps.

### Q3. Am I assigning a role, or picking a colour?

"`primary` means active" is a role: it holds across every component, forever. "`primary`
looks good here" is taste: it holds once. Roles are listed in
[color-and-state.md](color-and-state.md); if your colour is not on that list, you are
picking, not assigning.

### Q4. Who is the customer?

A variant with no real consumer inside the kit is a hypothesis, not a variant. `ghost` was
removed on exactly this ground: the customer the spec named (an editable table cell) does
not exist yet, so the variant does not either. Same rule forbids "just in case".

The corollary: when you delete something for want of a customer, record the condition that
brings it back — see [decisions.md](decisions.md).

### Q5. What constrains me from outside?

The strongest decisions are the ones where there was no choice:

- `compact` density is floored so a hit target never drops below the 24px WCAG 2.5.8 minimum.
- Height-based container queries are impossible: they need `container-type: size`, and a
  `contain: size` box collapses to zero when its height is `auto` — which a form column
  almost always is.
- Zero-runtime deliberately trades compiled CSS size for the absence of a runtime.

If you cannot name a single external constraint — accessibility, platform behaviour, an
existing token, a stated architectural trade — you are in the taste zone. That is where you
stop and ask, not where you decide quietly.

## 4. Where creativity is legitimate and required

Three places. Be bold in them.

**The choice of axes.** This is the authorship of the system. Nothing derives it.

**Defaults.** The strongest design statement the kit makes. `float` for text-field and
`top` for textarea is not "so nothing breaks" — it is a claim about how each field should
look when nobody chose.

**Refusals.** No caret. No `terminal`. No `underline` for textarea. No `complete` state.
The list of things deliberately absent is half the system, and it is worth as much thought
as the list of things present. Keep it visible in [decisions.md](decisions.md) rather than
scattered across summaries.

## 5. Anti-patterns

- Inventing a rule instead of asking, when two readings are equally reasonable.
- A new word for an axis that already has one (`size` vs `density` vs `scale`).
- A free-standing union that happens to overlap a canonical one instead of narrowing it.
- A state expressed only by colour.
- A variant added for a hypothetical consumer.
- Re-arguing a decision recorded in [decisions.md](decisions.md) without new information.
