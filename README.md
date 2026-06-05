<div align="center">
  <h1>PrimeTime UI Kit</h1>
  <p><strong>Enterprise-grade Material Design 3 component library, built on Nuxt 4 with zero-runtime token resolution and fluid typography scaling.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Nuxt-4.x-00DC82?style=flat-square&logo=nuxt.js&logoColor=white" alt="Nuxt 4" />
    <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js&logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/Material_Design-3-757575?style=flat-square&logo=material-design&logoColor=white" alt="MD3" />
    <img src="https://img.shields.io/badge/SCSS%20Tokens-Zero%20Runtime-CC6699?style=flat-square&logo=sass&logoColor=white" alt="Zero-Runtime Tokens" />
    <img src="https://img.shields.io/badge/TypeScript-100%25-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</div>

---

## 🎯 Overview

**PrimeTime UI Kit** is a production-ready Material Design 3 implementation for enterprise applications. Every component is **strictly token-driven**, fully typed, and optimized for performance. The kit prioritizes maintainability, accessibility, and visual consistency through a deterministic build-time token resolution system.

- **✅ Production-ready** — battle-tested component patterns, comprehensive test coverage, zero technical debt in component surfaces
- **⚡ Zero-runtime overhead** — all token resolution happens at build time; no CSS-in-JS or runtime variable cascading
- **📐 Fluid typography** — `1rem = 1px` convention with viewport-aware scaling (`root-scale` per breakpoint)
- **🎨 Material Design 3 complete** — state layers, 30+ late-M3 color roles, dynamic elevation, proper ripple physics
- **♿ A11y native** — semantic HTML, WAI-ARIA, keyboard navigation, focus management via composables
- **🔒 Full TypeScript** — 100% coverage on props, emits, slots, composables; strict mode enabled

---

## 🏗️ Architecture

### Token System: Build-Time Resolution
The kit's styling is powered by **nested SCSS `$tokens` maps** resolved at build time via the `g()` getter function. No CSS custom properties for component states — everything is static Sass.

**Structure:**
```
assets/stylesheet/
├── abstracts/          # Global primitives, functions, variables
│   ├── _functions.scss # g($t, path), material-map(), root-scale()
│   └── _variables.scss # $theme-color-link, $theme-shape-link, etc.
├── base/               # MD3 animations, shapes, typography baseline
├── themes/             # Runtime CSS-variable declarations (--md-sys-color-*, --sys-shape-corner-*, etc.)
└── components/
    └── <component>/
        ├── index.scss  # Nested $tokens map + token resolution
        └── _*.scss     # (deprecated; index.scss is the single source)
```

**Token Resolution Pattern:**
```scss
// app/assets/stylesheet/components/button/_index.scss
$tokens: (
  primary: (
    container: (color: map.get($theme-color-link, 'primary-container')),
    label: (type: 'label-large'),
  ),
  shape: (medium: map.get($theme-shape-link, 'medium')),
);

// In button/index.vue <style>
@use '~/assets/stylesheet/components/button/index' as t;

.ui-button {
  background-color: g($t, 'primary-container-color');
  border-radius: g($t, 'shape-medium');
  
  // State layers: 8% (hover), 12% (pressed)
  &:hover {
    background-color: color-mix(in srgb, map.get($theme-color-link, 'on-primary-container') 8%, map.get($theme-color-link, 'primary-container'));
  }
}
```

**Key Rules:**
- `g($t, 'path-with-hyphens')` splits by `-` → map nesting must mirror it (`'container-text-color'` → `container:(text:(color:…))`)
- `color-mix()` opacity **must be percentage** (`8%`, not `0.08`)
- `map.get()` can be bare or `#{…}` interpolated inside CSS functions
- No hardcoded colors, no local `$color` variables, no `--component-state` custom properties

### Color Roles & Runtime Binding
All color resolution happens via the **`$theme-color-link` map**, which binds M3 semantic roles to `--md-sys-color-*` CSS variables. The theme engine (Nuxt module) generates these per light/dark mode:

```scss
$theme-color-link: (
  'primary': var(--md-sys-color-primary),
  'on-primary': var(--md-sys-color-on-primary),
  'primary-container': var(--md-sys-color-primary-container),
  // ... 30+ roles including fixed, dim, surface-container variants
);
```

At runtime, theme selectors (`[data-definition="light"][data-palette="ocean"]`) write the actual hex values to `--md-sys-color-*`, allowing instant theme switching without recompile.

### Fluid Typography (1rem = 1px)
The kit uses viewport-aware scaling: `html { font-size: calc(1vw / root-scale(bp)) }`, making `1rem = 1px` at the breakpoint reference. **Design px translates directly to rem** — a 24px icon is `24rem`, not `1.5rem`.

```scss
// In design files or component specs: 24px
// In code: font-size: 24rem;

// Breakpoint scaling happens via root-scale() function
// At desktop, 1rem = 1px; on mobile, rem scales down fluidly
```

---

## 📦 Components (30+ production-ready)

### Foundation
- **Button** — filled, outlined, elevated, text, tonal; icon support; loading states
- **FAB** — primary, secondary, tertiary, surface variants; small/medium/large
- **Icon** — Iconify integration, custom sizing, semantic labels

### Forms & Input
- **Text Field** — single/multi-line, error states, leading/trailing icons, counters
- **Checkbox** — indeterminate state, error handling
- **Radio** — grouped, labeled, disabled states
- **Switch** — icon/label support, form integration
- **Chip** — filter, input, suggestion variants; deletable
- **Date Picker** — calendar picker, range selection, keyboard entry
- **Time Picker** — dial + keyboard modes, period selection

### Selection & Navigation
- **Dropdown** — single/multi-select, custom templates, keyboard nav
- **Menu** — positioned, nested items, dividers, disabled states
- **Navigation Rail** — icon-only or labeled, expandable
- **Navigation Bar** — bottom nav, badge support, indicator animation
- **Tabs** — scrollable, icon+label, fixed/scrollable layout

### Surfaces & Containers
- **Card** — elevated, filled, outlined; image headers, action slots
- **Dialog** — modal/alert flavors, full-screen support, focus trap
- **Sheet** — bottom sheet, swipeable, scrim overlay
- **AppBar** — top navigation, nav/action slots, title centering
- **Search** — expandable, suggestion dropdown, voice input ready

### Display & Data
- **Tooltip** — positioning, delayed show, rich content
- **Snackbar** — timed/persistent, action button, queue management
- **Badge** — icon/text, positioning helpers
- **Divider** — horizontal/vertical, inset variants
- **List** — complex items, leading/trailing templates, grouped sections
- **Table** — sortable columns, pagination, row selection
- **Expansion Panel** — single/multi, nested, icons
- **Slider** — continuous, discrete (tickmarks), range, vertical
- **Progress** — linear, circular; determinate/indeterminate

### Layout
- **Layout** — header/aside/main/footer grid; responsive helpers
- **Grid** — CSS Grid wrapper with breakpoint-aware cols
- **Spacer** — responsive gap management via rem scaling
- **Ripple** — directive; MD3 physics on any element

---

## 🚀 Getting Started

### Installation
```bash
# Install dependencies
npm install

# Prepare Nuxt types (auto-imports, build artifacts)
npm run postinstall
```

### Commands
```bash
npm run dev          # Nuxt dev server (auto-HMR)
npm run build        # Production build
npm run preview      # Preview built site
npm run test         # Vitest (unit, SSR-aware)
npm run test:e2e     # Playwright
npm run lint         # ESLint (must pass 0 errors)
npm run lint:style   # Stylelint (must pass 0 errors)
```

### Basic Usage
Components are auto-imported with the `m` prefix (e.g., `<MButton>`, `<MChip>`):

```vue
<template>
  <m-button variant="filled" color="primary" @click="submit">
    Submit
  </m-button>
  
  <m-text-field
    v-model="email"
    label="Email"
    type="email"
    :error="!!emailError"
    :helper-text="emailError"
  />
  
  <m-card title="Card Title" subtitle="Subtitle">
    <p>Card content goes here.</p>
    <template #actions>
      <m-button variant="text">Action</m-button>
    </template>
  </m-card>
</template>

<script setup lang="ts">
const email = ref('')
const emailError = ref('')

const submit = () => {
  // Validation, API calls, etc.
}
</script>
```

### Theming & Customization

**Color Schemes:**
Switch themes at runtime via the theme store:

```typescript
// app/store/theme.ts
const theme = useThemeStore()
theme.setTheme('light')     // 'light' | 'dark'
theme.setPalette('ocean')   // custom palette key
theme.setContrast('standard')
```

**Token Customization:**
Override component tokens in your own SCSS:

```scss
// app/components/custom-button.vue
@use '~/assets/stylesheet/components/button/index' as t;

$tokens: map.merge(t.$tokens, (
  primary: (
    container: (color: #ff5722), // Custom override
  ),
));

.custom-button {
  background-color: g($t, 'primary-container-color');
}
```

---

## 🧪 Quality Assurance

### Linting & Code Standards
- **ESLint** — Nuxt config + Vue plugin; 0-error gate
- **Stylelint** — SCSS + Vue `<style>` blocks; 0-error gate (pre-existing legacy issues marked as debt)
- **TypeScript** — strict mode; full coverage on component APIs

### Testing
- **Unit Tests** (Vitest) — component rendering, state, interactions in Nuxt SSR context
- **E2E Tests** (Playwright) — real browser, user flows, accessibility checks
- **Coverage** — critical paths: form submission, theme switching, responsive layout

### CI/CD
- Pre-commit hooks (ESLint, Stylelint) — enforced locally before push
- GitHub Actions — test suite, lint gate, build verification on PRs

---

## 🔧 Architecture Decisions

### Why Zero-Runtime Tokens?
- **Build-time resolution** eliminates cascading complexity and runtime lookups
- **Static CSS** means smaller bundle, faster first paint, no layout thrashing
- **Type safety** — token paths are compile-time verified (via `g()` function)

### Why `map.get()` over CSS variables?
- **Determinism** — no fallback chain ambiguity; every role is resolved once
- **Themeing is explicit** — runtime `--md-sys-color-*` variables are the only moving parts
- **DX** — typos in role names are caught at build time, not runtime

### Why 1rem = 1px?
- **Designer-to-code fidelity** — copy the px value directly; no mental arithmetic
- **Fluid scaling** — breakpoints adjust the root font-size, not individual properties
- **Maintenance** — one global rule scales the entire design consistently

### Nuxt Layer Architecture
The kit is a **Nuxt layer** — consumed by `docs/` via `extends: ['../kit']`. This allows:
- **Live component development** — change `kit/` → instant HMR in `docs/`
- **Theme centralization** — one build → both kit + docs inherit themes
- **Reusable patterns** — layouts, composables, utilities shared across apps

---

## 🌍 Browser Support

Requires modern CSS support:
- **Chrome/Edge** — 120+
- **Firefox** — 121+
- **Safari** — 17+

Features used: CSS variables, `color-mix()`, `calc()`, Grid/Flexbox, `contain`.

---

## 📚 Key Files & Conventions

| File | Purpose |
|------|---------|
| `app/components/ui/` | Public library components (`<MButton>`, `<MCard>`, etc.) |
| `app/assets/stylesheet/abstracts/` | `g()` function, `material-map()`, `$theme-*` links |
| `app/assets/stylesheet/components/` | Per-component `$tokens` map + styles |
| `app/modules/kit/module.ts` | Theme build engine; generates `--md-sys-color-*` |
| `app/store/theme.ts` | Runtime theme state (light/dark, palette, contrast) |
| `.cursor/rules/` | Migration guides, M3 token architecture |

---

## 📖 For Developers

### Adding a Component
1. Create `app/components/ui/<name>/index.vue` (single-file, no partial)
2. Create `app/assets/stylesheet/components/<name>/index.scss` with `$tokens` map
3. Import and resolve tokens via `g($t, 'path')`
4. Add `@use '~/assets/stylesheet/components/<name>/index' as t;` to `<style>`
5. Run `npm run lint && npm run lint:style` — must pass 0 errors

### Migrating a Component to M3 Tokens
- See `.cursor/rules/migration_workflow.md`
- Follow the pattern: no local vars, all colors via `map.get($theme-color-link, role)`
- Use `color-mix()` for states (8% hover, 12% pressed)
- No `--custom-properties` for component states

### Debugging Tokens
Token paths that resolve to `null` silently drop CSS declarations (no build error). Validate offline:
```typescript
// replicate g() locally
const path = 'primary-container-color'
const map = { primary: { container: { color: '#...' } } }
const result = path.split('-').reduce((m, k) => m?.[k], map)
console.log(result) // should not be null/undefined
```

---

## 🗂️ Project Structure

```
kit/
├── app/
│   ├── components/
│   │   ├── ui/              # Public library components
│   │   ├── material/        # Material Design showcase
│   │   └── [other]/
│   ├── composables/         # Vue 3 Composition API utilities
│   ├── assets/stylesheet/   # Token system + styling
│   ├── modules/
│   │   └── kit/
│   │       └── module.ts    # Theme color generation
│   ├── layouts/
│   ├── pages/
│   ├── plugins/
│   ├── store/               # Pinia (theme, app state)
│   └── nuxt.config.ts       # Layer + module config
├── shared/
│   ├── constants/
│   ├── types/
│   └── utils/
├── tests/                   # Vitest + Playwright
├── plan.md                  # Roadmap & issue tracking
└── CLAUDE.md                # Development guide
```

---

## 🚀 Roadmap

- [x] **Phase 0** — Token system foundation (abstracts, Zero-Runtime pattern)
- [x] **Phase 1** — Core components (button, field, chip, card, etc.)
- [x] **Phase 2** — Complete M3 (30+ components, all states, dark mode)
- [x] **Phase 3** — Production hardening (lint, test, color-role sweep, type safety)
- [ ] **Phase 4** — Docs site launch (isolated showcase, live Storybook-style playground)
- [ ] **Phase 5** — Theming portal (visual palette editor, export configs)

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

<div align="center">
  Built with ❤️ by the PrimeTime Team
</div>
