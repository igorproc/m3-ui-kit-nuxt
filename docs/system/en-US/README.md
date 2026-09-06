# The system

This folder is the kit's constitution: the decisions that are **no longer taken per
component**. It exists so that designing a component is a derivation, not an invention.

A UI kit is a set of components. A design system is a set of decisions the components are
derived from. The difference is testable with one question:

> **Can the system answer a question about a component that does not exist yet?**

`<MOtpInput>` was never drawn in the spec. Its variants, its colour roles and its rejection
of a blinking caret were all *derived* — from the field family's variant set, from the rule
that `primary` means activity, from the fact that focus is expressed by colour everywhere
else in the kit. That derivation is the system working. The moment a component has to be
invented from taste, the system is silent, and that silence is the bug to fix — in the
system, not in the component.

## When to open what

| File | Open it when |
|---|---|
| [principles.md](principles.md) | You feel you are guessing. Five questions that turn taste back into derivation. |
| [craft.md](craft.md) | The component looks wrong and you cannot say why. How an M3 component regresses into Material 2 or a form toolkit, one property at a time. |
| [axes.md](axes.md) | You are adding or narrowing a prop. Which axis is this, what is it called, what are its legal values. |
| [color-and-state.md](color-and-state.md) | You are picking a colour or drawing a state. |
| [behavior.md](behavior.md) | The component is mostly interaction (drag, keyboard, focus, overlay). |
| [checklist.md](checklist.md) | Before you start a component, and before you call it done. |
| [decisions.md](decisions.md) | You are about to add something that was already rejected, or you want to know why something is missing. |

## What this is not

It is not the token reference (see [architecture.md](../../architecture.md)), not the SCSS
migration protocol (`.cursor/rules/m3_architecture.md`), and not a component catalogue
(that is `docs_v2`). It is the layer above all three: the vocabulary they share.

## Status

Every rule here is either already enforced in the code or is a precedent that was argued
once and should not be re-argued. Where the code currently contradicts itself, the conflict
is written down as an **open question** rather than silently resolved — see the bottom of
[axes.md](axes.md). Open questions need a human decision; they are not licence to pick.

A decision recorded here is not automatically shipped: some are settled in principle and
still waiting for their migration. Those say so explicitly in
[decisions.md](decisions.md).
