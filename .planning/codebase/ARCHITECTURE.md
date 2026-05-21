# Architecture

**Analysis Date:** 2026-05-21

## Pattern Overview

**Overall:** Modular, compile-time extensible UI Component Kit built on Nuxt 4 and Vue 3.

**Key Characteristics:**
- **Zero-Runtime Styling:** Static SCSS compiler mappings with CSS Custom Properties resolving theme details.
- **Dynamic Theme Compilation:** Compiles custom Material Design 3 palettes at build/server start time using seed colors.
- **Isomorphic Design:** Components built to work in both server-side rendered (SSR) environments and dynamic hydration/client states.
- **Composable-Driven Logic:** Decouples heavy interactions (e.g. dial touch tracking, coordinates math) into dedicated Composables.

## Layers

**Module Layer (Compile Time):**
- Purpose: Orchestrates project compilation, sets up Nuxt options, and generates dynamic theme configurations.
- Contains: Nuxt module configurations, SCSS token injections, and Material-Color theme conversions.
- Location: `app/modules/kit/module.ts`
- Depends on: `@material/material-color-utilities`
- Used by: Nuxt build engine.

**Component Layer:**
- Purpose: Provides premium, responsive, highly interactive Material 3 compliant UI components.
- Contains: Vue Single File Components (SFC) structured with `<template>`, `<script setup>`, and component-specific style scopes.
- Location: `app/components/ui/**/*.vue`
- Depends on: Composables layer, CSS/SCSS styling layer, and standard UI constants.
- Used by: Host application pages and the interactive documentation playground.

**Composables Layer:**
- Purpose: Reactive functional abstractions for DOM queries, size recalculations, and advanced control loops.
- Contains: Vue composables (`useTimePicker`, `useFormBuilder`, `useBreakpoint`).
- Location: `app/composables/**/*.ts`
- Depends on: Vue APIs and VueUse utilities.
- Used by: Component layer and page layouts.

**Store Layer:**
- Purpose: Manages global client states, cookie-based persistence, and reactive window tracking.
- Contains: Pinia stores (`themeStore`, `windowSizeStore`, `dialogStore`).
- Location: `app/store/*.ts`
- Depends on: Shared constants, cookies, and VueUse core.
- Used by: Components and layouts to coordinate universal actions.

**Styling Layer:**
- Purpose: Controls the visual look, animation transitions, layout specifications, and M3 design tokens.
- Contains: SCSS stylesheets grouped into `abstracts/` (helpers, custom maps, typescales) and `components/` (styles referencing tokens).
- Location: `app/assets/stylesheet/**/*.scss`
- Depends on: Dynamic SCSS templates compiled during start.
- Used by: Component layer and layouts.

**Shared Layer:**
- Purpose: Standardizes TypeScript contracts, cookie keys, and UI schemas across compilation and execution boundaries.
- Contains: Constants, interfaces, types.
- Location: `shared/**/*.ts`
- Used by: Compile-time Nuxt modules, Pinia stores, and Vue components.

## Data Flow

**Interactive Dial Drag & Drop (e.g., TimePicker):**

1. User touches or clicks on the TimePicker Dial center (`app/components/ui/time-picker/dial/index.vue`).
2. Event listener captures raw coordinates via `onPointerDown`.
3. Coordinates passed to local helper `updateTimeFromEvent` where center-offset trigonometry calculation (`Math.atan2`, `Math.hypot`) determines selected hour/minute.
4. Calculated value updates the local `keyboardRef` state.
5. Reactive computed variables update the `v-model` binding on the parent component (`app/components/ui/time-picker/index.vue`).
6. Custom SVG knob transition rotates dynamically based on calculated angle styling.

**State Management & Theme Initialization:**
- Client-side initial load triggers `useThemeStore` (`app/store/theme.ts`).
- Theme settings (dark mode definition, active palette, contrast) are hydrated from user cookies.
- HTML tag attributes (`data-definition`, `data-pallet`, `data-contrast`) are set dynamically.
- Global styles resolve variable assignments matching selectors, e.g., `[data-definition="dark"][data-pallet="m3"] { --md-sys-color-primary: ... }` without client-side CSS recalculations (fully Zero-Runtime).

## Key Abstractions

**Custom Token Maps:**
- Purpose: Maps component styling definitions statically inside SCSS files, resolving variable lookups safely.
- Examples: `$tokens` inside `app/assets/stylesheet/components/time-picker/_dial.scss`.
- Pattern: Deep SCSS maps fetched via custom function helpers `g()` and `material-map()`.

**Interactive Dial Picker Engine:**
- Purpose: Manages math conversions and active input toggles (hours to minutes) when picking time.
- Examples: `useTimePicker.ts` composable or `keyboardRef` binding.
- Pattern: Computed coordinate-to-angle math trackers.

## Entry Points

**Nuxt Server & Runtime Initialization:**
- Location: `nuxt.config.ts`
- Triggers: Nuxt compiler execution (`npm run dev` or `npm run build`).
- Responsibilities: Loads compiler plugins, maps global auto-imports, compiles local components, and injects SCSS theme maps.

**Client Application Entry:**
- Location: `app/app.vue`
- Triggers: Initial page load.
- Responsibilities: Injects base styles, setups layout frames, and invokes stores.

## Error Handling

**Strategy:** Declarative form validation and schema-based checks prevent invalid actions, while standard JS try-catch isolates complex math failures.

**Patterns:**
- Schema validation via `Yup` and `vee-validate` prevents bad input submittals inside inputs like text-fields or date/time fields.
- Local assertions check parameters (like `parseInt` base-10 formatting) with safe fallback values.

## Cross-Cutting Concerns

**Styling Mapped Variables:**
- Handled at compile time inside Nuxt module. Dynamic variables derived dynamically inside `useHead` inject corresponding HTML selectors.

**Breakpoint and Size Tracking:**
- Custom `useBreakpoint` composable provides reactive window sizing state, automatically synchronizing viewport dimensions cleanly without repetitive window listener overhead.

---

*Architecture analysis: 2026-05-21*
*Update when major patterns change*
