# Technology Stack

**Analysis Date:** 2026-05-21

## Languages

**Primary:**
- TypeScript 5.x - All application logic, custom modules, components script setup, and store modules.
- SCSS - Zero-Runtime styling system with token mappings, mixins, typescales, and deep maps.

**Secondary:**
- JavaScript / ESM - Build scripts, configs, ESLint rules, and stylelint setup.

## Runtime

**Environment:**
- Node.js 20.x+ (LTS)
- Browser runtime supporting CSS Custom Properties (variables) and CSS `color-mix` functions (for Material 3 token calculations).

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` present.

## Frameworks

**Core:**
- Nuxt ^4.4.4 - Core server-side rendering, module loading, page routing, and build orchestration framework.
- Vue ^3.5.33 - Component library base (leveraging Composition API, Script Setup, and `defineModel`).
- Vue Router ^5.0.6 - Application-level routing (integrated inside Nuxt).

**Testing:**
- Vitest ^4.1.5 - Fast unit testing framework.
- Playwright ^1.59.1 - E2E testing framework.
- @vue/test-utils ^2.4.10 / @nuxt/test-utils ^4.0.3 - Component unit testing utilities.
- Happy DOM ^20.9.0 - Fast browser environment mock for Vitest.

**Build/Dev:**
- SASS ^1.99.0 - SCSS processor for theme generation and Zero-Runtime static stylesheets.
- Vite - Nuxt-bundled dev server and bundler.

## Key Dependencies

**Critical:**
- `@material/material-color-utilities` ^0.4.0 - Generates dynamic M3 theme palettes directly from source hex colors at build/runtime.
- `@vueuse/core` & `@vueuse/nuxt` ^14.3.0 - Reactive utility collection for browser APIs, composables, and lifecycle helpers.
- `@pinia/nuxt` ^0.11.3 & `pinia` ^3.0.4 - App-wide state management store for theme variables, modal dialog states, etc.
- `vue-final-modal` ^4.5.5 - Dynamic dialog and bottom-sheet modal orchestration system.
- `flubber` ^0.4.2 - SVG morphing library for smooth micro-animations (e.g. dial interaction, custom path morphing in UI components).
- `@vee-validate/nuxt` ^4.15.1 & `yup` ^1.7.1 - Advanced reactive form validation and schema management.
- `dayjs` ^1.11.20 - Lightweight date and time utility library.

**Infrastructure:**
- `@nuxt/icon` ^2.2.1 & `@iconify-json/ic` ^1.2.4 - Dynamic Material Design icon loading and SVG injection.
- `@nuxtjs/device` ^4.0.0 - Browser device user-agent detection to adjust layouts (mobile, tablet, desktop).

## Configuration

**Environment:**
- Configuration parameters handled via `nuxt.config.ts` public and private runtime options.
- Dynamic color themes configured in `materialKit` options inside `nuxt.config.ts`.

**Build:**
- `nuxt.config.ts` - Main Nuxt framework configuration, auto-imports, component routes, module setup, and Vite CSS processor configurations.
- `tsconfig.json` - Compiler options.
- `eslint.config.mjs` - ESLint styling and code convention configuration.
- `.stylelintrc.js` - Stylelint rule settings for CSS/SCSS and Vue SFC files.
- `vitest.config.ts` - Test configurations.

## Platform Requirements

**Development:**
- macOS, Linux, or Windows with Node.js 18+ and npm.
- VS Code or Cursor with Volar (Vue) and TypeScript plugins.

**Production:**
- Standard static/SSR host capable of executing Node.js processes (e.g. Vercel, Netlify, Docker Container) or statically generated serverless outputs (`nuxt generate`).

---

*Stack analysis: 2026-05-21*
*Update after major dependency changes*
