# Phase 1: Component Refinements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 1-Component Refinements
**Areas discussed:** SCSS Token Map Structure & Height Resolution, Decoupled Slot-Grid Architecture, Presentation-Only Scrolling Mechanics

---

## SCSS Token Map Structure & Height Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Option 1 (Full M3 Token map) | Declare a full hierarchical map `$tokens` in the stylesheet and generate tokens via `@mixin generate-tokens` | |
| Option 2 (Local Sass Map) | Create a nested Sass map `$tokens` following the pattern of `list/item/_index.scss` | ✓ |
| Option 3 (Direct CSS variables) | Directly map variables without structured Sass maps | |

**User's choice:** Option 2. The user specified that we must create an SCSS token map in the style of `list/item/_index.scss` and reserve the single global CSS custom property name `var(--ui-app-bar-height)`.
**Notes:** The `sizeToken` registered in `useLayoutItem` will be simplified to a unified, read-only `ref('--ui-app-bar-height')`, and the actual height value will be dynamically set by the CSS class modifiers (`.ui-app-bar--small`, `.ui-app-bar--medium`, etc.) resolving the variable within the SCSS map.

---

## Decoupled Slot-Grid Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Option A (Dynamic Grid + Container Slot) | Build dynamic grid template areas based on slots presence, and expose a layout-override `container` slot | ✓ |
| Option B (Fixed grid + standard wrapping) | Keep standard layout wrapping with hidden regions, without a full-override slot | |

**User's choice:** Option A.
**Notes:** The slot `container` acts as a complete layout override. If the `container` slot is present, we skip the standard slots `nav`, `title`, and `actions` and render `container` directly, avoiding complex grid rules.

---

## Presentation-Only Scrolling Mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Option A (Presentation Prop) | Accept a reactive `isScrolled` boolean prop to dynamically apply a `.ui-app-bar--scrolled` class | ✓ |
| Option B (Local Event Listener) | Listen to scroll events inside the AppBar component itself | |

**User's choice:** Option A.
**Notes:** The component remains a dumb presentation component. All states are explicitly passed down as props to avoid adding heavy event listeners inside UI components.

---

## the agent's Discretion
- The layout margins, internal paddings, transition timings, and exact BEM class names are left to the agent's discretion, aligned with the M3 Figma snapshot data.

## Deferred Ideas
- None.
