<div align="center">
  <h1>PrimeTime UI Kit</h1>
  <p><strong>A Material Design 3 component library for Nuxt 4, with build-time SCSS token resolution.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@pr0s1k/primetime-kit"><img src="https://img.shields.io/npm/v/@pr0s1k/primetime-kit?style=flat-square&logo=npm&logoColor=white&color=CB3837" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/@pr0s1k/primetime-kit"><img src="https://img.shields.io/npm/dm/@pr0s1k/primetime-kit?style=flat-square&logo=npm&logoColor=white&color=CB3837" alt="npm downloads per month" /></a>
    <img src="https://img.shields.io/badge/Nuxt-4.x-00DC82?style=flat-square&logo=nuxt&logoColor=white" alt="Nuxt 4" />
    <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js&logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/Material_Design-3-757575?style=flat-square&logo=material-design&logoColor=white" alt="MD3" />
  </p>
</div>

---

PrimeTime UI Kit is a Nuxt 4 **module** shipping ~90 auto-imported Material Design 3
components across 67 component groups. Its distinguishing trait is the styling layer:
component colors, shapes and states are resolved **at build time** from nested Sass maps,
so no CSS-in-JS runs and no per-component custom properties cascade at runtime. The only
runtime-variable surface is the active MD3 palette (`--md-sys-color-*`), which is what
makes instant theme switching possible.

- **Build-time tokens** — every component owns a nested `$tokens` map; values are picked with the `g()` getter and compiled to static CSS
- **Full MD3 color system** — light/dark × three contrast levels, generated from a HEX seed via `@material/material-color-utilities`
- **Runtime theming** — palette, definition and contrast are cookie-backed, SSR-rendered (no FOUC) and switchable without a rebuild
- **Fluid typography** — `1rem = 1px` at the breakpoint reference width, so design px map to rem one-to-one
- **Auto-layout** — a CSS-grid app shell that carves zones from DOM order, with zero measurement and zero CLS
- **SSR-first** — one shared viewport state, one global listener registry, no per-component resize subscriptions

Requires **Nuxt >= 4.0.0**.

---

## Install

```bash
npm i @pr0s1k/primetime-kit
```

The package is published built (`dist/`), so there is no build step on your side.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pr0s1k/primetime-kit'],
})
```

The module declares `@nuxt/icon` and `@nuxtjs/device` through `moduleDependencies` — you do
not register them yourself. Nothing else is pulled in: there is no state-management
dependency, and form validation is opt-in (see [Validation](#validation)).

## Configure

Theme configuration lives under the top-level `materialKit` key, typed by the module
itself — no helper to import:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pr0s1k/primetime-kit'],

  materialKit: {
    theme: {
      themes: [
        { key: 'm3', name: 'M3 Baseline', color: '#6750A4' },
        { key: 'ocean', name: 'Ocean', color: '#0061A4' },
      ],
      default: { definition: 'dark', palette: 'm3', contrast: 'medium' },
    },
    cookie: {
      theme: { definition: 'md-def', palette: 'md-pal', contrast: 'md-con' },
    },
  },
})
```

Each theme's `color` is an MD3 **seed**: the full tonal palette for both definitions and all
three contrast levels is derived from it. Every option is documented in
[docs/configuration.md](docs/configuration.md).

## Use

Components from `components/ui` are auto-imported under an `M` prefix — write `<m-button>`
and Nuxt resolves it, so only what a page actually uses ends up in its bundle.
`<MApp>` is the root: it owns the theme's `<head>` payload (html attributes and the active
palette's `<style>`) and mounts the overlay host that dialogs, menus and snackbars teleport
into.

```vue
<!-- app/app.vue -->
<template>
  <m-app>
    <nuxt-layout>
      <nuxt-page />
    </nuxt-layout>
  </m-app>
</template>
```

```vue
<template>
  <m-card title="Sign in">
    <m-text-field v-model="email" label="Email" type="email" />

    <template #actions>
      <m-button variant="filled" color="primary" @click="submit">
        Submit
      </m-button>
    </template>
  </m-card>
</template>

<script setup lang="ts">
const email = ref('')
const submit = () => {}
</script>
```

If you do not use `<MApp>`, you must mount `<core-scope />` yourself — it renders
`#ui-overlay-host`, without which every overlay component has nowhere to teleport.

Public prop types come from the `./types` subpath:

```ts
import type { MColor, MVariant } from '@pr0s1k/primetime-kit/types'
```

## Theming at runtime

`useMaterialTheme()` returns one shared, cookie-backed controller — the same instance for
every caller, so a write in one component is visible everywhere immediately. It is a
`reactive` object, so properties are read and assigned directly:

```ts
const theme = useMaterialTheme()

theme.definition = 'light'    // 'light' | 'dark' | 'system'
theme.palette = 'ocean'       // a key from `theme.themes`
theme.setContrast('high')     // 'standard' | 'medium' | 'high'

theme.setCustomColor('#B3261E')   // runtime palette from an arbitrary HEX seed
theme.setVariant('vibrant')       // MD3 scheme variant
theme.availableThemes             // configured palettes, for a theme picker

await theme.setColorFromImage(img)  // async: the image quantizer is loaded on demand
```

Custom palettes can be locked off application-wide with `restrict: { customPalette: true }`,
which also sanitizes a hand-set cookie rather than trusting it. See
[docs/configuration.md](docs/configuration.md).

## Validation

Form components work without any validation library. To wire one up, install an adapter
once, near the root:

```ts
import { provideValidationAdapter, veeValidateAdapter } from '@pr0s1k/primetime-kit/validation'

provideValidationAdapter(veeValidateAdapter())
```

`vee-validate` and `yup` are the kit's dev dependencies only — an app that never calls
`provideValidationAdapter` ships neither.

## Responsive

```ts
const { is, more, less } = useBreakpoint()
```

Flags are camelCased breakpoint names. Defaults are `mobile-xs: 0`, `mobile: 767`,
`tablet-xs: 768`, `tablet: 1199`, `desktop-xs: 1200`, `desktop: 1920`; override or extend
them via `materialKit.breakpoints`. The underlying viewport state is shared app-wide and
updated by a single listener.

For the application shell — app bars, rails, sticky footers, the 4/8/12-column grid — see
[docs/layout.md](docs/layout.md).

## Documentation

| Document | Contents |
| :--- | :--- |
| [docs/configuration.md](docs/configuration.md) | Every `materialKit` option, cookies, breakpoints, restrictions |
| [docs/architecture.md](docs/architecture.md) | Token system, `g()`, color roles, fluid typography, theming pipeline |
| [docs/layout.md](docs/layout.md) | Auto-layout carving engine, zones, sticky mechanics, column system |
| [docs/contributing.md](docs/contributing.md) | Repository layout, conventions, adding a component, quality gates |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Planned work |

## Browser support

Chrome/Edge 120+, Firefox 121+, Safari 17+. The kit relies on `color-mix()`, CSS custom
properties, `calc()`, Grid with `subgrid`, and `contain`.

## License

MIT — see [LICENSE](./LICENSE).
