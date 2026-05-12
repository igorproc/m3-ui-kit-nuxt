# Refactoring Summary: Theme Architecture & UI Kit Optimization

**Date**: 2026-05-12

## 1. Theme Architecture Refactoring (Pinia + Build-time SCSS)
- **Centralized State**: Moved all theme management logic (`useTheme`, `useThemeDefinition`, and plugin logic) into a single Pinia Setup Store (`app/store/theme.ts`). The store now cleanly handles cookie-based state validation for `definition` (light/dark), `contrast`, and `palette`.
- **Global Head Injection**: `useThemeStore` now automatically injects `htmlAttrs` (`data-definition`, `data-pallet`, etc.) seamlessly into the application using `useHead`.
- **Build-Time Dynamic CSS**: Removed runtime `@material/material-color-utilities` from the Pinia store to reduce client bundle size. The Nuxt kit module (`kit/module.ts`) now parses themes during build time (for themes with `definedInScss: false`) and generates `material-kit-themes.scss`. This automatically applies the dynamic SCSS color tokens for "unconnected" themes.
- **Fixed SCSS Loop Error**: Replaced problematic Vite `additionalData` logic with a unified and alias-based injection system (`~material-kit-config` and `~material-kit-themes`) preventing Nuxt build module loops.

## 2. UI Prefix Migration (`ui-` to `m-`)
- **Automated Refactor**: Ran a custom Node.js script across `app/components/ui/**/*.vue` to globally replace the `<ui-*` prefix with `<m-*` for component tags and `</ui-*` with `</m-*` for closing tags.
- **Scope Constrained**: Adhering to requirements, CSS class names (like `class="ui-button"`) and SCSS selectors remain completely untouched to preserve styling integrity.

## 3. Icon Centralization
- **New Constants File**: Created `shared/constants/icons.ts` hosting the `ICONS` object, which strictly types and maps specific icon names directly to their `ic` icon collection counterparts (e.g., `ic:outline-search`, `ic:outline-check`).
- **Standardized Usage**: Replaced loose hardcoded strings (e.g., `baseline-search`) across 7+ components (`date-picker`, `dropdown`, `search`, `table`, etc.) with the unified `ICONS.*` references.

## 4. UI Dashboard Verification
- Integrated a comprehensive test suite of UI components directly into `app/pages/index.vue`.
- Displayed all button variants (`filled`, `elevated`, `tonal`, `outlined`, `text`), button colors (`primary`, `accent`, `warn`, `disabled`), and interactive components (`m-checkbox`, `m-switch`, `m-radio`) to verify theme bindings interactively.
