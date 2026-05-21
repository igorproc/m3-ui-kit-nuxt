# Phase 1: Component Refinements - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the complete refactoring of the `AppBar` component within the PrimeTime UI Kit. It transitions the component's styles to a Zero-Runtime nested SCSS architecture using structured Sass token maps, standardizes its BEM styling structure, and implements a flexible decoupled slot-based grid layout aligned with Material Design 3 specifications.

</domain>

<decisions>
## Implementation Decisions

### SCSS Token Map Structure & Height Resolution
- **D-01 (Zero-Runtime SCSS Maps):** Implement the AppBar design tokens as a structured, hierarchical Sass map `$tokens` in `app/assets/stylesheet/components/app-bar/_index.scss` (similar to the pattern established in `list/item/_index.scss`). 
- **D-02 (Height Token Reservation):** Reserve a single global CSS custom property `--ui-app-bar-height` inside the SCSS token map. The value of this variable will resolve dynamically depending on the selected variant class (e.g. `center-aligned`, `small`, `medium`, `large`) using the `g($tokens, 'height-...')` deep-getter helper.
- **D-03 (Vue Layout Composable Integration):** Register the AppBar height in the parent layout system via the `useLayoutItem` composable using a single `readonly(ref('--ui-app-bar-height'))` sizeToken value. This eliminates runtime Vue logic for height calculations, moving height resolution entirely to CSS/SCSS.

### Decoupled Slot-Grid Architecture
- **D-04 (Dynamic Grid Layout):** Implement a dynamic grid layout using Vue computed properties (`gridTemplateAreas`, `gridTemplateRows`, `gridTemplateColumns`) based on the presence of the `nav`, `title`, and `actions` slots (using `!!$slots.nav`, etc.) to avoid rigid, hard-coded grid structures when slots are empty.
- **D-05 (Layout Override Slot):** Add a `container` slot that allows for full custom alignment. If the `container` slot is present, it acts as a complete layout override: the standard grid template areas are skipped, and the custom container content is rendered directly inside the AppBar body.

### Presentation-Only Scrolling Mechanics
- **D-06 (Presentation Scroll State):** Keep the AppBar component as a "dumb" presentational component. The scroll state must be passed to the component via a reactive `isScrolled` boolean prop (instead of adding local, non-performant scroll event listeners inside the AppBar component).
- **D-07 (Zero-Runtime CSS Scroll Styles):** When `isScrolled` is true, apply the BEM modifier `ui-app-bar--scrolled` to transition container background color (`#FEF7FF` -> `#F3EDF7`) and elevation/shadow (elevation 0 -> elevation 3) using performant CSS `transition` rules.

### the agent's Discretion
- The agent has full flexibility to arrange the detailed inner padding, margins, and icons spacing using BEM sub-selectors (`ui-app-bar__nav`, `ui-app-bar__title`, `ui-app-bar__actions`) matching M3 specs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Material Design 3 Specs
- [M3 App Bars Specs](https://m3.material.io/components/app-bars/specs) — Official Material Design 3 guidelines for top app bar behavior, sizes, elevations, and layout alignments.

### Snapshot Token Maps
- [Header Size Snapshots Directory](file:///d:/dev/primetime/ui/kit/.cursor/temp/snapshots/header/size) — Contains raw M3-compliant heights and typography specs.
  - [Small App Bar](file:///d:/dev/primetime/ui/kit/.cursor/temp/snapshots/header/size/small.htm) — Height: `64dp`, Title font: Title Large.
  - [Medium App Bar](file:///d:/dev/primetime/ui/kit/.cursor/temp/snapshots/header/size/medium_flex.htm) — Height: `112dp` (with subtitle: `136dp`), Title font: Headline Medium, Subtitle font: Title Small.
  - [Large App Bar](file:///d:/dev/primetime/ui/kit/.cursor/temp/snapshots/header/size/large_flex.htm) — Height: `120dp` (with subtitle: `152dp`), Title font: Headline Large, Subtitle font: Title Medium.

### Codebase Stylesheet Reference
- [List Item Stylesheet](file:///d:/dev/primetime/ui/kit/app/assets/stylesheet/components/list/item/_index.scss) — Reference implementation for Zero-Runtime component token Sass maps and BEM organization.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [useLayoutItem](file:///d:/dev/primetime/ui/kit/app/composables/useLayout.ts#L89) — Layout self-registration composable to integrate the AppBar height cleanly into Nuxt application layouts.
- [typescale Mixin](file:///d:/dev/primetime/ui/kit/app/assets/stylesheet/abstracts/_mixins.scss#L65) — SCSS typography utility to map M3 typescales (like `title-large`, `headline-medium`, `headline-large`) to actual CSS properties.

### Established Patterns
- **Zero-Runtime token maps:** Nesting CSS variables inside Sass component maps using `g()` and `map.get()` avoids client-side runtime style evaluations.
- **Dumb Presentation Components:** UI components only receive state via Vue props (`title`, `subtitle`, `variant`, `isScrolled`) and do not listen to window events directly.

### Integration Points
- `app/components/ui/app-bar/index.vue` — The core Vue component to be refactored.
- `app/assets/stylesheet/components/_app-bar.scss` — Component SCSS to be refactored into BEM-compliant stylesheet utilizing Sass maps.

</code_context>

<specifics>
## Specific Ideas
- The size token in `index.vue` will be simplified to `readonly(ref('--ui-app-bar-height'))`, and all variant-specific heights will be set dynamically via the BEM modifier classes in the SCSS stylesheet.

</specifics>

<deferred>
## Deferred Ideas
- None — all discussed topics remained strictly within the scope of the Phase 1 AppBar refactor.

</deferred>

---

*Phase: 1-Component Refinements*
*Context gathered: 2026-05-21*
