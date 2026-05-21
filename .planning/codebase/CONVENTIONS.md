# Coding Conventions

**Analysis Date:** 2026-05-21

## Naming Patterns

**Files:**
- Component directories are kebab-case (e.g. `time-picker/`).
- Main component entry files are named `index.vue` within component directories.
- Subcomponents are named using PascalCase (e.g. `MTimePickerKeyboard` inside `./keyboard/index.vue`).
- Composables are camelCase starting with `use` (e.g. `useTimePicker.ts`).
- Stylesheets use kebab-case with leading underscore for partials (e.g. `_time-picker.scss`).

**Functions:**
- camelCase for functions (e.g., `updateTimeFromEvent`, `onPointerDown`).
- Event handlers are prefixed with `on` followed by camelCase event type (e.g. `onPointerDown`, `onDragMove`, `onPointerUp`).

**Variables:**
- camelCase for component local variables and ref names (e.g., `isDragging`, `faceRef`, `keyboardRef`).
- UPPER_SNAKE_CASE for constant config keys (e.g. `COOKIE_THEME_KEYS`, `THEME_DEFINITIONS`).
- Prefix `$` used for local SCSS mapped token variables (e.g., `$t: material-map(t.$tokens, $prefix)`).

**Types:**
- PascalCase for interfaces (e.g. `interface Props`, `interface ITheme`).
- Avoid `I` prefix for standard props interfaces, but it is acceptable on shared base types.

## Code Style

**Component Layout:**
- Composition API with `<script setup lang="ts">` is standard.
- `<template>` block at the top, `<script setup>` in the middle, and `<style lang="scss">` at the bottom.
- Style blocks in components use explicit `@use` imports for token mappings (e.g., `@use '~/assets/stylesheet/components/time-picker/dial/_index' as t;`).

**SASS / SCSS Styling:**
- BEM (Block-Element-Modifier) naming convention strictly followed:
  - Block: `.ui-time-picker-dial`
  - Element: `.ui-time-picker-dial__face`
  - Modifier: `.ui-time-picker-dial--horizontal`
- Deep maps resolved at compile time:
  - Mapped tokens resolved via `$t: material-map(t.$tokens, $prefix);`
  - Value lookups via function `g($t, 'container-color')` or typography mixins `@include apply-typography(g($t, 'number-typography'))` and `@include typescale('label-large')`.
- Dynamic color modifications in SCSS must use modern `color-mix` functions (e.g. `color-mix(in srgb, $on-surface $opacity, transparent)`).

**Linting and Formatting:**
- Linting managed via ESLint: `npm run lint`.
- Style checking via Stylelint: `npm run lint:style`.

## Import Organization

**Order:**
1. Core framework APIs (e.g. `import { computed, ref, onUnmounted } from 'vue'`).
2. Secondary module/third-party library utilities (e.g. `import { themeFromSourceColor } from '@material/material-color-utilities'`).
3. Internal component imports (e.g. `import MTimePickerKeyboard from '../keyboard/index.vue'`).
4. Type/Constant imports using absolute aliases (e.g. `import { THEME_COOKIE_OPTIONS } from '~~/shared/constants/theme'`).

**Path Aliases:**
- `~` or `@` maps to the project directory root.
- `~~` maps to the project directory root (often used for relative shared definitions).

## Error Handling

**Form & Input Verification:**
- Reactive inputs must be protected by declarative schema validation (`vee-validate` + `yup`) to intercept bad data at the boundaries.
- Trigonometry calculations must perform bounds checking (e.g. checking if DOM node bounding rect is ready: `if (!faceRef.value) return`).

## Comments

- Explain coordinate logic, touch thresholds, or SVG layout details clearly in math-intensive functions.
- TODO comments must indicate future improvements and specify the targeted component (e.g., `// TODO: dynamic layout support`).

---

*Convention analysis: 2026-05-21*
*Update when patterns change*
