<div align="center">
  <h1>PrimeTime UI Kit</h1>
  <p><strong>Enterprise-grade UI component library built for Nuxt 3, following Material Design 3 principles.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Nuxt-3.x-00DC82?style=flat-square&logo=nuxt.js&logoColor=white" alt="Nuxt 3" />
    <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js&logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/Material_Design-3-757575?style=flat-square&logo=material-design&logoColor=white" alt="MD3" />
    <img src="https://img.shields.io/badge/SCSS-Tokens-CC6699?style=flat-square&logo=sass&logoColor=white" alt="SCSS Tokens" />
    <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</div>

---

## ✨ Overview

**M3 UI Kit** is a robust, production-ready UI framework designed for high-performance applications. It implements the **Material Design 3 (MD3)** specification with a focus on strict token-based styling, full decentralization, and seamless integration with **Nuxt 3**.

Our architecture ensures that every component is highly customizable while maintaining a consistent visual language through a centralized system of design tokens.

## 🚀 Key Features

- **💎 Material Design 3**: Pixel-perfect implementation of the latest MD3 spec, including state layers and dynamic elevations.
- **🏗️ Nuxt 3 Powered**: Deep integration with Nuxt 3's auto-imports, composables, and server-side rendering (SSR).
- **🎨 Strict Token System**: Styles are driven by a centralized token pattern (`abstracts` → `base` → `themes` → `components`).
- **⚡ Performance First**: Zero-dependency component logic where possible, optimized for core web vitals.
- **♿ Accessibility**: Built with A11y in mind, following WAI-ARIA standards.
- **✨ Premium Typography**: Optimized for the `Google Sans` typeface family for a modern, sleek look.

---

## 🛠 Architecture & Style System

The UI Kit uses a strictly organized SCSS architecture located in `assets/stylesheet/`:

| Layer | Path | Description |
| :--- | :--- | :--- |
| **Abstracts** | `abstracts/` | Global mixins (typescale, breakpoints) and tech variables. |
| **Base** | `base/` | MD3 animations, system shapes, and global reset. |
| **Themes** | `themes/` | Centralized color tokens (`--color-primary`, `--color-surface`). |
| **Components** | `components/` | Decentralized component-specific tokens with `!default` support. |

### The Token Pattern
We follow a strict pattern to ensure maintainability:
```scss
// assets/stylesheet/components/_button.scss
$filled-bg: var(--color-primary) !default;
$label-text-type: 'label-large' !default;

// In Component.vue
<style lang="scss">
@use '~/assets/stylesheet/components/button' as v;

.ui-button {
  background-color: v.$filled-bg;
  @include typescale(v.$label-text-type);
  
  // State layers via color-mix
  &:hover {
    background-color: color-mix(in srgb, v.$filled-bg 8%, transparent);
  }
}
</style>
```

---

## 📦 Installation

```bash
# Install dependencies
npm install

# Prepare Nuxt types
npm run postinstall
```

## 💻 Usage

```vue
<template>
  <UiButton color="primary" @click="handleClick">
    Get Started
  </UiButton>
</template>

<script setup lang="ts">
const handleClick = () => console.log('Action triggered')
</script>
```

---

## 🧪 Quality Assurance

We maintain high standards for enterprise stability:

- **Linting**: Strict ESLint and Stylelint configurations (`npm run lint`, `npm run lint:style`).
- **Unit Testing**: Powered by **Vitest** (`npm run test`).
- **E2E Testing**: Robust browser testing via **Playwright** (`npm run test:e2e`).
- **Type Safety**: 100% TypeScript coverage for props, emits, and logic.

---

## 🌐 Browser Support

PrimeTime UI Kit leverages modern CSS features like `color-mix()` and CSS Variables. It supports the latest versions of all major browsers:

- **Chrome** (Latest)
- **Firefox** (Latest)
- **Safari** (Latest)
- **Edge** (Latest)

---

## 🛠 Ecosystem

Built on top of a powerful stack to ensure reliability and developer experience:

- **[Nuxt 3](https://nuxt.com/)** - The Intuitive Vue Framework.
- **[VeeValidate](https://vee-validate.logaretm.com/v4/)** - Type-safe form validation.
- **[VueUse](https://vueuse.org/)** - Collection of essential Vue Composition Utilities.
- **[Vue Final Modal](https://vue-final-modal.org/)** - Powerful and flexible modal component.

---

## 🗺 Roadmap

- [x] MD3 Core Token System
- [x] Base Components (Button, Text Field, Icons)
- [ ] Advanced Layout Composables
- [ ] Dark Mode Support (Dynamic Theming)
- [ ] Interactive Documentation Portal

---

## 📄 License

This project is proprietary and confidential.

---

<div align="center">
  Built with ❤️ by the PrimeTime Team
</div>
