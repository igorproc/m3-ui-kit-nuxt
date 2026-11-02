# Vuance UI kit — context for app-building agents

> Snapshot 2026-10-20, kit `@pr0s1k/primetime-kit` **0.5.0** (branch `components/redisign-update`),
> sources `D:\dev\primetime\ui\kit\src\runtime`. Product brand is **Vuance UI** (the npm name and the
> `materialKit` config key stay). Written in English on purpose (denser for the context budget).
> Every API fact below was extracted from the sources or read from them; anything marked `(?)` is
> unverified — check the source before relying on it. When this file and the source disagree, the
> source wins, and say so in your findings.

## 0. What the kit is (mental model in 12 lines)

1. **Nuxt 4 module** (`modules: ['@pr0s1k/primetime-kit']`, config key `materialKit`). Nuxt 4.4.8, Vue 3.5.39.
   Pre-1.0: no stable API promise, old options are removed outright (no deprecation shims).
2. **~90 auto-imported components**, kebab tags with the `m-` prefix: `<m-button>`, `<m-text-field>`.
   No import needed in app code. Public prop types: `@pr0s1k/primetime-kit/types` (published) or
   `#kit/shared/types/props` (local kit sources — the setup used in this workspace, §1).
3. **Material Design 3 (latest / Expressive) heir.** Components present in M3 follow M3. Components M3 does
   not have (alert, banner, breadcrumbs, pagination, rating, timeline, table, file-upload, color-picker,
   otp-input, hotkey, number-input, lazy, surface…) are the author's own designs — use them as designed.
4. **Zero-runtime styling.** Component colours/shapes/states are resolved at build time from Sass token maps;
   the only runtime variables are the active palette `--md-sys-color-*` plus root scales
   (`--md-sys-typescale-*`, `--sys-shape-corner-*`, `--sys-elevation-level*`, `--sys-motion-*`).
   Theme switching = swapping the palette attribute; no CSS-in-JS.
5. **`1rem` = 1 design px of a canvas.** `html { font-size: calc(1vw / root-scale(bp)) }` — three canvases:
   phone 767, tablet 1199, desktop 1920 design px wide; inside each band the whole UI scales with the window.
   Write every size as `16rem`, `56rem` (design px → rem 1:1). **Never write `px`** (except media-query
   thresholds); never "fix" the scale — the owner treats it as a deliberate feature. Consequence: on a 393 px
   phone `1rem ≈ 0.51px`, i.e. the kit renders at about half its design size (a 40rem button ≈ 20 CSS px).
   The canvases follow `materialKit.breakpoints` (moving `mobile`/`tablet-xs` moves the phone canvas). Details §3.
6. **SSR-first.** Theme/palette/contrast are cookie-backed and SSR-rendered (no FOUC). Viewport state is one
   shared `useState` + one resize listener. Visual solutions must be correct on the SSR first paint —
   no "measure in JS then fix the layout" tricks.
7. **Auto-layout.** `<m-layout>` is a CSS-grid app shell that carves zones (header/aside/main/footer)
   from DOM order with zero measurement / zero CLS. App bars, rails, nav bars register themselves into it.
8. **`<m-app>` is the root.** It owns the theme `<head>` payload and mounts `#ui-overlay-host` that dialogs,
   menus, sheets and snackbars teleport into. Overlays use the native top layer with own fallbacks.
9. **Axes vocabulary is shared** across components: `color` (primary|secondary|tertiary|error),
   `variant` (elevated|filled|tonal|outlined|text — per component subset), `density`
   (compact|default|comfortable — the only size axis), `shape` (corner scale names), `disabled`, `loading`,
   `readonly`. Fields share `label`, `labelPlacement`, `helperText`, `error`, `errorMessage`, `required`,
   `path` (validation autopilot).
10. **Validation is opt-in** through a swappable adapter (`provideValidationAdapter(veeValidateAdapter())`
    from `@pr0s1k/primetime-kit/validation`); without it fields are plain controlled components.
11. **Imperative services** live on `useNuxtApp().$material` (theme, breakpoints, overlays, modal), plus
    `useModal()` for programmatic dialogs. The declarative path (`<m-dialog v-model>`) always exists too.
12. **Icons**: `<m-icon name>` via `@nuxt/icon`; only the Iconify `ic` (Google Material Icons) set ships.

## §1 Setup in this workspace (local kit sources)

Workspace `D:/dev/primetime/ui/{kit,docs_v3,<app>}` = separate repos. `docs_v3` and
`kit/playground` load `kit/src/module.ts` directly, so kit edits reach the app live.
Prerequisite: `npm install` done in `kit/` — the module pushes `kit/node_modules` into
`modulesDir`, so `@nuxtjs/device`, `@vueuse/core`, `dayjs`, `@material/material-color-utilities`
resolve from there.

```bash
# in D:/dev/primetime/ui/my-app — same pins as docs_v3
npm i nuxt@4.4.8 vue@3.5.39 @nuxt/icon@^2.2.1 @iconify-json/ic@^1.2.4
npm i -D sass@^1.99.0                       # required: the kit ships SCSS, your build compiles it
npm i vee-validate@^4.15.1 yup@^1.7.1       # only for the validation adapter
```
Do NOT put `@nuxt/icon` / `@nuxtjs/device` in `modules` — the kit registers them
(`moduleDependencies`). docs_v3 still installs `@nuxt/icon` + `@iconify-json/ic` itself (safer (?)).

```ts
// my-app/nuxt.config.ts — docs_v3 pattern, reduced
import { fileURLToPath } from 'node:url'

const KIT_ROOT = fileURLToPath(new URL('../kit', import.meta.url))
const KIT_MODULE = fileURLToPath(new URL('../kit/src/module.ts', import.meta.url))

export default defineNuxtConfig({
  modules: [KIT_MODULE],                                   // published: '@pr0s1k/primetime-kit'
  vite: { server: { fs: { allow: [KIT_ROOT] } } },         // kit lives outside this root
  compatibilityDate: '2026-10-19',
  materialKit: {
    theme: {
      themes: [{ key: 'brand', name: 'Brand', color: '#6750A4' }],
      default: { palette: 'brand', definition: 'light', contrast: 'standard' },
    },
  },
})
```
- Playground form: `modules: ['../src/module']` (relative to rootDir) — `'../kit/src/module'` works too.
- The module itself adds `kit/src/runtime` to `vite.server.fs.allow`; `KIT_ROOT` also covers `kit/node_modules`.
- To build against npm as well, copy `docs_v3/configs/kit-source.ts` (local when
  `NODE_ENV !== 'production'`, `NUXT_KIT_LOCAL !== 'false'` and `../kit/src/module.ts` exists).
- Playground sets `features: { inlineStyles: false }`; docs_v3 doesn't — not required (?).

**Imports with local sources** — package subpaths resolve only if the npm package is installed
(docs_v3 has it). Otherwise use the `#kit` alias (= `kit/src/runtime`, typed by Nuxt):

| Published | Local |
|---|---|
| `@pr0s1k/primetime-kit/validation` | `#kit/adapters/vee-validate` |
| `@pr0s1k/primetime-kit/types` (`MColor`, `MVariant`, …) | `#kit/shared/types/props` (table: `#kit/components/ui/table/types`) |
| `MaterialKitOptions`, `TDefinition`, `TTheme` | `#kit/shared/types/kit` |
| `FormFieldConfig` | `#kit/composables/useFormSchema` |

```vue
<!-- app/app.vue -->
<template>
  <m-app skip-link-label="Skip to content" skip-link-target="main">
    <nuxt-layout><nuxt-page /></nuxt-layout>

    <template #loading="{ progress, isLoading }">
      <m-progress v-if="isLoading" class="route-progress" :value="progress" aria-label="Loading the page" />
    </template>
  </m-app>
</template>

<style lang="scss">
.route-progress { position: fixed; inset: 0 0 auto; z-index: 100; }
</style>
```
`<m-app>` is **required**: via `useHead` it writes `<html data-definition data-palette
data-contrast>` + `<style id="material-kit-theme">` (active palette), and mounts `<core-scope />`
(`#ui-overlay-host` + client-only `useModal()` container). Without it: no `--md-sys-color-*`, no
overlays. Props `tag` ('div'), `skipLinkLabel` (none → no link), `skipLinkTarget` ('main'); slot
`#loading` `{ progress, isLoading }`. One per document. Min full-viewport height, background
colors; no layout/landmarks. Without it: `<core-scope />` + `useHead({ htmlAttrs: theme.htmlAttrs,
style: [{ id: 'material-kit-theme', innerHTML: theme.themeCss }] })`.

**Auto-wired by the module**
- Components `components/ui/**` → prefix `m` + path prefix (`<m-button>`, `<m-button-fab>`,
  `<m-dialog-date>`); auto-import only, **not global** (`<component :is="'MButton'">` fails; docs_v3
  uses a `components:extend` hook setting `global = true` for `/^M[A-Z]/`). `components/core/**` →
  `core` prefix.
- Auto-imports: `composables/**` (`useMaterialTheme`, `useBreakpoint`, `useModal`, `useModalSlot`,
  `useTimer`, `useField`, `useFormSchema`, `provideValidationAdapter`, `provideHotkeyLabels`,
  `useHotkey`, `useFocusTrap`, `useScrollLock`, `useReducedMotion`, …) and `shared/**` (`ICONS`,
  `MESSAGES`, `THEME_*`, utils). Not auto-imported: `adapters/**` (`veeValidateAdapter`,
  `useFormBuilder`). Don't add `@vee-validate/nuxt` (its `useField` clashes with the kit's).
- Directives `v-ripple`, `v-click-outside`. Plugins: `material` (`$material`; order yours with
  `dependsOn: ['material']`), `material-theme-css`, `material-fonts`, `viewport.client` (the only
  resize listener).
- CSS `main.scss` + SCSS prelude (§7). Global base: `box-sizing: border-box`; `html, body {
  margin: 0; background: var(--md-sys-color-background) }`; body font = body-medium family,
  `14rem / 1.5`; thin scrollbars on every element; `html { scrollbar-gutter: stable }`. **No utility
  classes** (no `.sr-only` — mixin only).

### `materialKit` options

Defaults merge key-by-key; arrays concatenate, so the grey `_m3-fallback` palette
(`definedInScss`) always stays in `themes`.

```ts
materialKit: {
  theme: {
    themes: [
      { key: 'brand', name: 'Brand', color: '#6750A4' },                    // HEX seed → full MD3 scheme
      { key: 'ocean', name: 'Ocean', color: '#0061A4', variant: 'vibrant' },
      { key: 'mono', name: 'Mono', color: '#5F6368', variant: 'monochrome', neutralChroma: 2 },
      { key: 'warm', name: 'Warm', color: '#B3261E', chroma: 40, semanticColors: { info: '#00639B' } },
    ],
    default: { palette: 'brand', definition: 'light', contrast: 'standard' },  // palette MUST be declared (else Nuxt start throws)
    semanticColors: {                         // defaults: success #2e7d32, warning #ed6c02, info #0288d1
      success: '#2e7d32', warning: '#ed6c02', info: '#0288d1',
      brandAccent: { color: '#FF6D00', blend: false },   // → --md-sys-color-brand-accent (+ on-/-container/on-…-container)
    },
    semanticBlend: true,
  },
  cookie: { theme: { definition: 'app-def', palette: 'app-pal', contrast: 'app-con' } },
  typography: {
    typeface: { brand: '\'Google Sans\', sans-serif', plain: '\'Google Sans\', sans-serif', mono: '\'Google Sans Code\', monospace' },
    fonts: ['https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Google+Sans+Code:wght@400..600&display=swap'],
  },
  breakpoints: { mobile: 767, 'tablet-xs': 768, tablet: 1199, 'desktop-xs': 1200, desktop: 1920, ultrawide: 2560 },
  restrict: { customPalette: true },          // forbid runtime HEX/image palettes; cookie sanitized on resolve
}
```
- `variant`: `tonalSpot` (default) `neutral` `vibrant` `expressive` `monochrome` `fidelity`
  `content` `rainbow` `fruitSalad`. `specVersion` '2025' default (needed for `*-dim`).
- Defaults are `definition: 'dark'`, `contrast: 'medium'` — set both. Avoid `'system'` as default:
  SSR renders it light, flips after hydration.
- `contrast`: `'standard'|'medium'|'high'|number` (−1..1). `theme.default.variant/neutralChroma`
  are ignored at runtime — set per theme.
- `typeface` (brand = display/headline/title-large; plain = rest) is compiled → rebuild to change.
  `fonts` REPLACES default Roboto; absolute URL → preconnect added; `/fonts/x.css` from `public/` as
  is; `false`/`[]` = load nothing; env override `NUXT_PUBLIC_MATERIAL_KIT_TYPOGRAPHY_FONTS`.
- Cookie defaults `app-theme-definition|palette|contrast` (path `/`, 1 year); renaming resets
  returning visitors.
- Custom breakpoint typing: `declare module '@pr0s1k/primetime-kit/types' { interface
  KitBreakpointRegistry { ultrawide: true } }` (local: `#kit/shared/types/props` (?)).
- Resolved options: `useRuntimeConfig().public.materialKit`.

## §2 Theme at runtime and system tokens

One `reactive` controller per app (per request on server) = `useNuxtApp().$material.theme`.
Assign properties directly; destructuring loses reactivity → `toRefs(theme)`.

| Member | Meaning |
|---|---|
| `definition` (rw) | stored `'light'\|'dark'\|'system'` |
| `resolvedDefinition` | shown `'light'\|'dark'` — use for decisions/assets |
| `systemDefinition`, `definitionState` | OS preference; `{ type, forSystem }` |
| `contrast` (rw) / `setContrast(s)` | `'standard'\|'medium'\|'high'`; unknown → standard |
| `palette` (rw) | active key (HEX when custom); assign only keys from `availableThemes`; resets runtime variant/chroma |
| `availableThemes` | declared themes **+ `_m3-fallback`** → filter `!t.definedInScss` |
| `currentTheme` / `activeTheme` | entry for `palette` (undefined if custom) / entry CSS is built from |
| `resolvedPalette` | `data-palette` value: key or `'_custom'` |
| `setCustomColor(hex)` | runtime palette from 3/6/8-digit HEX; invalid → page has no colors (validate first); no-op when restricted |
| `await setColorFromImage(img)` | → HEX \| null; `<img>`/`ImageBitmap`/`<canvas>` (CORS needed cross-origin) |
| `isCustomPalette`, `customColor`, `canCustomizePalette` | flags; hide seed pickers with `canCustomizePalette` |
| `variant` / `setVariant(v\|null)` | MCU variant override; `null` = theme's own |
| `neutralChroma` (rw, 8 when auto), `isNeutralAuto`, `setNeutralChroma(n\|null)` | |
| `htmlAttrs` | `{ 'data-definition', 'data-palette', 'data-contrast' }` |

```vue
<template>
  <m-button-icon :aria-label="isDark ? 'Light theme' : 'Dark theme'" @click="toggleDark">
    <m-icon :name="isDark ? 'lightMode' : 'darkMode'" />
  </m-button-icon>
  <m-button v-for="item in palettes" :key="item.key"
    :variant="theme.palette === item.key ? 'filled' : 'outlined'" @click="theme.palette = item.key">
    {{ item.name }}
  </m-button>
  <m-button variant="text" @click="theme.setContrast('high')">High contrast</m-button>
</template>

<script setup lang="ts">
const theme = useMaterialTheme()
const isDark = computed(() => theme.resolvedDefinition === 'dark')
const palettes = computed(() => theme.availableThemes.filter(item => !item.definedInScss))
const toggleDark = () => { theme.definition = isDark.value ? 'light' : 'dark' }
</script>
```

**SSR/cookies.** Server reads 3 cookies → `material-theme-css` lazily imports MCU, renders light +
dark blocks of the active palette into `useState` (payload) → `<m-app>` writes the head. Client
reuses it; MCU (~20 KB gz) loads only on palette/seed/variant/chroma/contrast change. Definition
switch = attribute flip. `data-palette` keeps the old key until the new block exists. Render errors
→ warning, never 500. Palette cookie = JSON `{ isCustom, key, variant, neutralChroma }`.

**Attributes** on `<html>`: `data-definition`, `data-palette` (NOT `data-pallet` — project
CLAUDE.md is stale), `data-contrast`. Block: `[data-definition="dark"][data-palette="brand"] {
color-scheme: dark; --md-sys-color-…: … }`. No kit selector reads `data-contrast` (baked in).

**Color roles** `--md-sys-color-<role>`:
- `primary|secondary|tertiary` × {`<r>`, `<r>-dim`, `on-<r>`, `<r>-container`, `on-<r>-container`,
  `<r>-fixed`, `<r>-fixed-dim`, `on-<r>-fixed`, `on-<r>-fixed-variant`}
- `error`, `error-dim`, `on-error`, `error-container`, `on-error-container`
- `success|warning|info` (+ custom semantic keys, kebab-cased) × {`<n>`, `on-<n>`, `<n>-container`, `on-<n>-container`}
- `background`, `on-background`, `surface`, `surface-dim`, `surface-bright`,
  `surface-container-lowest|low|·|high|highest`, `on-surface`, `on-surface-variant`
- `inverse-surface`, `inverse-on-surface`, `inverse-primary`, `outline`, `outline-variant`, `shadow`, `scrim`
- not emitted: `surface-variant` (SCSS map aliases it to `surface-container-highest`).
Pair every container with its `on-` role. Component `color` prop (`MColor`) = `primary|secondary|tertiary|error` only.

**Other system props** (values in the kit sources; note prefixes):
typescale `--md-sys-typescale-{display|headline|title|label|body}-{large|medium|small}-{font|size|line-height|weight}`,
`--md-ref-typeface-{brand|plain|monospace}`; shape `--sys-shape-corner-{none|extra-small|small|medium|large|extra-large|extra-large-top|full}`;
elevation `--sys-elevation-level{0..5}`; motion `--sys-motion-easing-{linear|standard|standard-accelerate|standard-decelerate|emphasized|emphasized-decelerate|emphasized-accelerate}`,
`--sys-motion-duration-{short|medium|long|extra-long}-{1..4}` (reduced-motion collapses >short-4 to short-2).

## §3 Layout and responsive

### 3.1 Root scale

`assets/stylesheet/base/_adaptive.scss`, `root-scale($key) = breakpoint px / 100`:

```scss
html { font-size: calc(1vw / 19.2); }                         // default = desktop (1920)
@media (max-width: 1200px) { html { font-size: calc(1vw / 12); } }    // desktop-xs
@media (max-width: 1199px) { html { font-size: calc(1vw / 11.99); } } // tablet
@media (max-width: 768px)  { html { font-size: calc(1vw / 7.68); } }  // tablet-xs
@media (max-width: 767px)  { html { font-size: calc(1vw / 7.67); } }  // mobile
```

Default breakpoints (`shared/constants/breakpoints.ts`, px): `mobile-xs 0`, `mobile 767`,
`tablet-xs 768`, `tablet 1199`, `desktop-xs 1200`, `desktop 1920`.

| Viewport W (CSS px) | 1rem = | Examples |
| :--- | :--- | :--- |
| ≤ 767 | W / 767 | 360 → 0.47px, 393 → 0.51px, 430 → 0.56px, 767 → 1px |
| 768 | W / 768 | 1px |
| 769–1199 | W / 1199 | 800 → 0.67px, 1024 → 0.85px, 1199 → 1px |
| 1200 | W / 1200 | 1px |
| > 1200 | W / 1920 | 1201 → 0.63px, 1280 → 0.67px, 1440 → 0.75px, 1920 → 1px, 2560 → 1.33px |

So there are three design canvases in practice: **phone = 767 wide, tablet = 1199 wide,
desktop = 1920 wide**. Inside a range the whole UI scales linearly with the window. At a range
boundary it snaps about 36% smaller (768→769: 1px→0.64px; 1200→1201: 1px→0.63px).
The owner treats this as a feature; do not propose clamps or floors.

What this means when you write an app:
- Write every size as design px in rem (`24rem` icon, `spacing(16)` gap). Never `px`, except in
  media-query thresholds and `forced-colors` hairlines.
- On a narrow phone, physical sizes are about half of design px (16rem body ≈ 8.2 CSS px at
  393 wide). This is accepted. Use `max(1px, 1rem)` for a hairline that must survive.
- **Media queries use px.** In `@media`, rem resolves against the initial 16px, not the fluid root.
- `@container` queries in rem resolve against the live root size (per spec), so they compare in
  design px. The orders demo uses `@container orders-content (width >= 1400rem)`. Because rem
  and container width both scale with W, a rem container query flips only when the container's
  share of the window changes (rail expand, aside open/close) or the range switches.
- Within one range, content density is constant: a layout designed at 1920 looks the same,
  scaled, at 1280. To reflow, branch at the range boundaries (§2) or use container queries.
- Only `mobile`, `tablet-xs`, `tablet`, `desktop-xs` and `desktop` feed the scale. Overriding them
  in config moves the canvases. `mobile-xs` and custom keys do not affect it.

### 3.2 Breakpoints API

##### `useBreakpoint()` (`composables/useBreakpoint.ts`, bands built once in `plugins/material.ts`)

```ts
const { is, more, less } = useBreakpoint()
// each one: ComputedRef<Record<'mobileXs'|'mobile'|'tabletXs'|'tablet'|'desktopXs'|'desktop'|custom, boolean>>
is.value.tablet            // in script
less.desktopXs             // in a template (top-level ref is auto-unwrapped)
```

- `is[name]`: `prev < W <= value`. The last (largest) band is open-ended.
- `more[name]`: `W > value`. `less[name]`: `W < value`. Both are strict, so exactly on a value both
  are false.
- Names are camelCased (`tablet-xs` → `tabletXs`).

Bands with the default config (verified in `utils/viewport/bands.ts`):

| flag | true when |
| :--- | :--- |
| `is.mobileXs` | W ≤ 0 → **never in practice** (?) the spec only tests it with mobile-xs = 320 |
| `is.mobile` | 1–767 |
| `is.tabletXs` | exactly 768 |
| `is.tablet` | 769–1199 |
| `is.desktopXs` | exactly 1200 |
| `is.desktop` | > 1200 |

**Use these, because they match the `m-layout` ranges exactly:**
`less.tabletXs` (W < 768, the layout's *mobile* range) and `less.desktopXs` (W < 1200, below the
*desktop* range). All wireframes and demos use them. The recipe in `docs/layout.md` uses
`is.mobileXs || is.mobile` / `is.tabletXs || is.tablet` / else.

Supporting pieces:
- `useSSRWindowSize()` → `{ width, height }` as ComputedRef<number>. It is backed by
  `useState('md:viewport')`.
- `useNuxtApp().$material.breakpoints.breakpoints` → the resolved kebab-case px map.
- SSR seed from `@nuxtjs/device`, which the kit installs: mobile 393×852, tablet 992×1180,
  otherwise 1920×1080. The client re-measures on `app:suspense:resolve`, after hydration. One
  global resize/orientation listener exists for the whole app; never add your own.
- So width-driven `v-if` branches render the device-class guess on the server. They flip after
  hydration if the guess was wrong, for example a desktop browser at 1000px wide.

##### SCSS (auto-injected into every consumer `<style lang="scss">`)

`src/module.ts` prepends `@use ".../assets/stylesheet/additional.scss" as *`, which forwards the
abstracts (variables, functions, mixins, helpers). No import is needed except `sass:map`.

| Name | Output |
| :--- | :--- |
| `$breakpoints` | px map: defaults merged with `materialKit.breakpoints` |
| `media-max($w)` | `@media only screen and (max-width: $w)` |
| `media-min($w)` | `(min-width: $w)` |
| `media-distance($min, $max)` | `(min-width: $min) and (max-width: $max - 1px)` |
| `bp-tablet` | `(min-width: tablet)` = **1199px**, so effectively desktop. Avoid. |
| `bp-desktop` | `(min-width: desktop)` = 1920px |
| `can-hover` | `(hover: hover)`. Wrap `:hover` rules in it. |
| `spacing(n)` | `n * 1rem` (4-step scale 0–64 plus any unitless number) |
| `z(header\|aside\|overlay-host)` | 50 / 40 / 9999 |
| also | `typescale('body-medium')`, `sr-only`, `focus-ring`, `forced-colors`, `g()` |

Range recipe that matches the layout engine:

```scss
@use 'sass:map';

.page {
  @include media-max(map.get($breakpoints, 'mobile')) { … }        // ≤ 767  (layout mobile)
  @include media-distance(map.get($breakpoints, 'tablet-xs'),
                          map.get($breakpoints, 'desktop-xs')) { … } // 768–1199 (layout tablet)
  @include media-min(map.get($breakpoints, 'desktop-xs')) { … }     // ≥ 1200 (layout desktop)
}
```

`m-layout-main` is a container named `main-content` (`container-type: inline-size`), so
`@container main-content (width >= 900rem) { … }` reacts to the space left beside the rails.

##### Custom breakpoints

```ts
// nuxt.config.ts
materialKit: { breakpoints: { 'mobile': 600, 'tablet-xs': 905, 'ultrawide': 2560 } } // numbers or '905px'
// types: any .d.ts
declare module '@pr0s1k/primetime-kit/types' { interface KitBreakpointRegistry { ultrawide: true } }
```

Reserved keys override the defaults and custom keys are added. Keys are coerced to integer px.
Custom keys show up in `is`/`more`/`less` and `$breakpoints`. They do **not** get
`m-col`/`m-container` classes, do not move the root scale, and do not create layout ranges.
The layout engine always uses exactly 3 ranges cut at `tablet-xs` and `desktop-xs`.

### 3.3 `m-layout` shell

##### Principle

`<m-layout>` (only prop: `full-height`) is `display: grid; min-height: 100dvh; contain: style`.
Zones register in a registry. The pure function `composables/layout/carve.ts` turns that
registry into `grid-template-areas/columns/rows` for 3 ranges:

- **mobile**: `max-width: tablet-xs − 1`
- **tablet**: 768–1199
- **desktop**: ≥ 1200

The result goes out as a `<style>` through `useHead`. SSR ships the finished grid, the CSS picks
the range, there is no JS measuring and zero CLS.

**Carving:** zones are taken in DOM order. Each one cuts a strip off the remaining rectangle:
top/bottom take a full-width row of what remains, start/end take a column of what remains.
The earlier zone owns the corner (Vuetify semantics). `order` (a number, default 0, stable sort)
overrides DOM order. Late `v-if` mounts are re-sorted by their real DOM position after hydration.

**Range filtering** (`filterByRange`, no per-zone opt-out): mobile drops start and end zones,
tablet drops end zones, desktop keeps all. A dropped zone gets `display: none`.

**Registration:** a zone registers when its `<m-layout>` is at most **3 component ancestors up**
(`MAX_LAYOUT_OWNER_ANCESTOR_HOPS = 3`) and no host zone sits in between. Transparent wrapper
components (`<CrmNavRail>` → `<MNavigationRail>`) therefore work. The wrapper's **DOM root must
be the zone element itself**. Any first-level DOM child without `grid-area` becomes an implicit
track, breaks the grid, and triggers a dev warning.

##### Zones

| Component | Kind | Props (defaults) |
| :--- | :--- | :--- |
| `m-layout-header` | top | `sticky=true`, `sizeToken`, `order` |
| `m-layout-footer` | bottom | `sticky=false`, `sizeToken`, `order` |
| `m-layout-aside` | start/end | `position='start'` (`start\|end`; legacy `left\|right`), `sticky=false`, `sizeToken`, `order` |
| `m-layout-main` | main (leftover rectangle) | `order`. It is `<main>`, `overflow-y:auto`, `container-type:inline-size` |
| `m-layout-item` | any | `kind` (`top\|bottom\|start\|end\|main`), `id`, `sizeToken`, `sticky`, `force`, `order` |
| `m-main` | — | Deprecated. Not a zone; it warns. |

- `sizeToken` takes either a CSS var name (`--ui-app-bar-height-small` becomes `var(...)`) or a raw
  size (`256rem`, `calc(…)`).
- A zone **without** `sizeToken` sums the size contributions of the kit bars nested inside it
  (`calc(a + b)`).
- The track of a size-less zone is `auto`.
- Any number of zones per edge is allowed. Each gets its own row or column.
- Zone ids are automatic (`top-<uid>`). `m-layout-item` can take an explicit `id`.

##### Self-registering kit components

When placed directly under `m-layout`, these register as zones. Inside a zone they contribute
their size to it.

| Component | Kind | Size token | Pinned |
| :--- | :--- | :--- | :--- |
| `m-system-bar` | top | `--ui-system-bar-height` (24rem) | `sticky` prop (default true) |
| `m-app-bar` | top | `--ui-app-bar-height-{small\|medium\|large}[-subtitle]` (64/72, 112/136, 120/152 rem) | `sticky` prop (default true) |
| `m-navigation-rail` | start | `--ui-navigation-rail-width` 96rem, or `-expanded` 256rem when `expanded` | always |
| `m-navigation-bar` | bottom | `--ui-navigation-bar-height` 80rem | always |

These size tokens are declared on `:root` by each component's stylesheet.
Changing `expanded` on the rail changes its token, and the grid animates
(`transition: grid-template-*`). Inside an `m-layout-aside` the rail gets `--hosted`: it fills
the aside, which does the pinning.

These are **not** zones:
- `m-navigation-drawer`: modal, teleported. It is fine anywhere, including as a direct child
  (it leaves only comment nodes).
- `m-toolbar`.
- `m-sheet`, `m-dialog`, `m-snackbar`: overlays.
- `m-surface`.

##### Sticky

- **top/bottom + sticky + size**: `position: fixed` with per-item offsets. The grid row reserves
  `size` (zero CLS). Without a size the zone stays in flow and you get a dev warning.
- **start/end + sticky**: `position: sticky; align-self: start;
  top: <tops carved before it>; height: calc(100dvh − top − pinned bottoms)`. The sticky aside
  gets `overflow-y: auto`.
- Offsets are logical (RTL-ready). The engine assumes the layout starts at the top of the
  viewport.
- **Page-scroll mode** (default): the document scrolls, and `html { scroll-padding-top/bottom }`
  is generated for the pinned bars.
- **`full-height`**: `height: 100dvh; overflow: hidden`. `m-layout-main` scrolls itself with
  `scrollbar-gutter: stable` (the Discord/Steam pattern).

##### Safe area (`viewport-fit=cover` is opt-in)

Only the **outermost** layout handles cutouts:
- The first pinned sized top zone takes `env(safe-area-inset-top)`.
- The first pinned bottom zone takes the bottom inset.
- Full-width top/bottom zones take left and right.
- The inset is drawn as a transparent border, and the zone grows by it (`min-block-size`, track).

Not handled:
- side zones (for example a landscape rail),
- nested layouts.

`m-container` pads itself with `max(margin, env(safe-area-inset-*))`.

##### Context: `useLayoutZone()` (null outside a layout)

`{ layoutId, items, insets: { top, right, bottom, left }, windowY, scrollLock(bool), sticky: { top, bottom } }`

- `insets.*` are CSS expressions: `var(--m3-layout-inset-*, 0px)`.
- `windowY` is the scroll of the document or of main.
- `scrollLock` is ref-counted.
- `m-app-bar` uses `windowY` for its scroll fill. Its `scrolled` prop is `undefined` (auto) or
  true/false (forced).

CSS vars set on `#<layoutId>` per range:
- `--m3-layout-<id>-size`
- `--m3-layout-<id>-top|bottom-sticky|start|end`
- `--m3-layout-inset-top|right|bottom|left`

##### `m-app-bar` compound

`<m-app-bar title subtitle type="small|medium|large" align="start|center" :sticky :scrolled>`

Its default slot holds `<m-app-bar-nav>` (leading), `<m-app-bar-title title subtitle>` (with
`default` and `subtitle` slots) and `<m-app-bar-actions>`. The bar is a 3-area grid
`nav | title | actions`.

Limits:
- There is no search region, and medium/large do not collapse on scroll.
- Height comes from the token, not from the content. A 56rem search does not fit the 64rem
  small bar with its default 8rem block padding. The wireframes either set `padding-block: 4rem`
  on the bar, or wrap it in `<m-layout-header size-token="72rem">`.

##### Navigation components (all items are `<button>`s; no `to`)

- `m-navigation-rail`: `items: {id, icon, label, badge?}[]`, `v-model: string|null`,
  `expanded`, `aria-label` (default `'Primary'`). Keyboard: roving arrow keys.
- `m-navigation-bar`: `items` (same shape), `v-model`, `aria-label`.
- `m-navigation-drawer`: `v-model: boolean`, `side='left'|'right'`, `containerClass`, plus the
  modal-layer props (`closeOnSwipe`, `persistent`, `closeOnEscape`, `closeOnOutside`,
  `displayDirective`, `lockScroll`, …). Slots: `header` (names the dialog) and default
  (usually `m-list`). It is modal only; the kit has no standard (non-modal) drawer. For a
  persistent drawer, put content in `m-layout-aside sticky size-token="256rem"`, as the Gmail
  and docs layouts do.
- Routing: drive it from the route. Use `:model-value="section" @update:model-value="go"` with
  `navigateTo`. `m-list-item` does accept `:to`.
- `m-system-bar`: `sticky` plus slots `prepend` / default / `append`.

##### Verified app shell

Desktop (≥ 1200) shows the rail, app bar and main. Tablet and mobile show the top app bar, a
bottom navigation bar and a modal drawer. Every prop and slot below exists in source.
The pattern is the same as `docs_v3/app/layouts/default.vue` (`compact = less.desktopXs`)
combined with `playground/app/demo/orders/OrdersDashboard.vue`.

```vue
<!-- app/app.vue -->
<template>
  <m-app skip-link-label="Skip to content" skip-link-target="main">
    <NuxtLayout><NuxtPage /></NuxtLayout>
  </m-app>
</template>
```

```vue
<!-- app/layouts/default.vue -->
<template>
  <m-layout>
    <!-- 1st: full-width top row (owns both corners) -->
    <m-app-bar>
      <m-app-bar-nav>
        <m-button-icon
          :aria-label="compact ? 'Open navigation' : railExpanded ? 'Collapse navigation' : 'Expand navigation'"
          :aria-expanded="compact ? undefined : String(railExpanded)"
          @click="onMenu"
        >
          <m-icon name="ic:round-menu" />
        </m-button-icon>
      </m-app-bar-nav>

      <m-app-bar-title title="Acme" />

      <m-app-bar-actions>
        <m-button-icon aria-label="Search">
          <m-icon name="ic:round-search" />
        </m-button-icon>
      </m-app-bar-actions>
    </m-app-bar>

    <!-- start zone, pinned; the engine would also hide it < 768 -->
    <m-navigation-rail
      v-if="!compact"
      :model-value="section"
      :items="PRIMARY"
      :expanded="railExpanded"
      aria-label="Main"
      @update:model-value="go"
    />

    <m-layout-main id="main">
      <slot />
    </m-layout-main>

    <!-- pinned bottom zone, 80rem row reserved -->
    <m-navigation-bar
      v-if="compact"
      :model-value="section"
      :items="PRIMARY"
      aria-label="Main"
      @update:model-value="go"
    />

    <!-- modal, teleported: not a grid child -->
    <m-navigation-drawer v-model="drawerOpen">
      <template #header>
        Acme
      </template>

      <m-list>
        <m-list-item
          v-for="item in [...PRIMARY, ...SECONDARY]"
          :key="item.id"
          :to="item.to"
          :headline="item.label"
          :leading-icon="item.icon"
          :selected="item.id === section"
          @click="drawerOpen = false"
        />
      </m-list>
    </m-navigation-drawer>
  </m-layout>
</template>

<script setup lang="ts">
const PRIMARY = [
  { id: 'home', icon: 'ic:round-home', label: 'Home', to: '/' },
  { id: 'orders', icon: 'ic:round-receipt-long', label: 'Orders', to: '/orders', badge: 3 },
  { id: 'reports', icon: 'ic:round-insights', label: 'Reports', to: '/reports' },
]
const SECONDARY = [
  { id: 'settings', icon: 'ic:round-settings', label: 'Settings', to: '/settings' },
]

const { less } = useBreakpoint()
// < 1200: same boundary as the layout's desktop range; seeded from the device class on SSR
const compact = computed(() => less.value.desktopXs)

const route = useRoute()
const section = computed(() => [...PRIMARY, ...SECONDARY].find(item => item.to === route.path)?.id ?? null)
const go = (id: string | null) => {
  const item = PRIMARY.find(entry => entry.id === id)
  if (item) navigateTo(item.to)
}

const drawerOpen = ref(false)
const railExpanded = ref(false)
const onMenu = () => {
  if (compact.value) drawerOpen.value = true
  else railExpanded.value = !railExpanded.value
}
</script>
```

Variations:
- Rail on tablet too: `compact = less.value.tabletXs` (the engine already hides start zones < 768).
- Hosted rail: `<m-layout-aside sticky><m-navigation-rail/></m-layout-aside>` (orders, docs).
- Header wrapper: `<m-layout-header><MyAppBar/></m-layout-header>` (sticky, sized by the bar).
- (?) Untested CSS-only swap with no hydration flip: the bar inside
  `<m-layout-footer sticky size-token="--app-nav-h">`, with `--app-nav-h` set to 80rem or 0rem
  and the bar hidden by your own media query.

##### Nested layouts

An `m-layout` inside `m-layout-main` works (console wireframe). Rules:
- Give it `height: 100%; min-height: 0; overflow: hidden`.
- Use `:sticky="false"` on its header, and avoid sticky zones. Top/bottom sticky means
  `position: fixed` to the viewport.
- It has no safe area and no scroll-padding.

### 3.4 Column grid

##### `m-container` (`components/ui/container`, tokens in `assets/stylesheet/components/grid/_index.scss`)

- `display: grid; grid-template-columns: repeat(var(--m-container-cols), minmax(0,1fr))`.
- Columns by key: `mobile-xs` 4, `tablet-xs` 8, `desktop-xs` 12.
- Gutter and margin: 16rem → 24rem from `tablet-xs`.
- `max-width`: `calc(1200rem + 2·margin)` from `desktop-xs`, `calc(1600rem + 2·margin)` from
  `desktop`. In rem, so on a 1440 window the 1200rem content is 900px wide.
- Props: `fluid` (no max-width), `cols`, `colsMobile`, `colsTabletXs`, `colsTablet`,
  `colsDesktopXs`, `colsDesktop` (1–12).
- Pure static `@media (min-width: <px>)` classes, mobile-first.

##### `m-col`

- Props: `cols` (base) plus `mobile`, `tabletXs`, `tablet`, `desktopXs`, `desktop`.
- Offsets: `offset` plus `offsetMobile` … `offsetDesktop` (0–11; `0` resets to auto flow).
- The span is relative to the active column count and clamped:
  `span min(var(--m-col-span, cols), cols)`. No prop means the full row. `cols="2"` is half a
  row on mobile and 1/6 on desktop.
- Key activation (min-width): `mobile` 767px, `tablet-xs` 768, `tablet` **1199**,
  `desktop-xs` 1200, `desktop` 1920. Use `tablet-xs` and `desktop-xs` for the tablet and
  desktop steps.

##### `m-row`

Optional. `grid-column: 1/-1; grid-template-columns: subgrid; gap: var(--m-container-gutter)`.
Props: `align="start|center|end|stretch"`, `noGutters`.

##### Other primitives

- `m-spacer`: `<div class="ui-spacer">` with `flex: 1 0 0`. It needs a flex parent (app-bar rows,
  toolbars).
- `m-responsive`: `aspect-ratio` (number | `"16/9"` …). `overflow: clip` with a focus-ring clip
  margin. Children stay in flow, so make media `width:100%; height:100%; object-fit`.
- `m-surface`: `tag`, `variant=plain|filled|elevated|outlined`, `shape`.
- `m-toolbar`: `items`, `layout=horizontal|vertical`, `type=standard|baseline`, `multiple`,
  `v-model`. A plain block, not a zone.

### 3.5 Real examples (wireframes, demos, snippets)

##### Wireframes (`docs_v3/app/pages/wireframes/<slug>.vue`)

Every wireframe uses `layout: 'wireframe'`. Zones are listed in DOM order.

| Slug | What it shows |
| :--- | :--- |
| `spotify` | full-height; `m-app-bar` → `m-layout-footer sticky 88rem` (player) → `m-layout-aside sticky` (88rem below 1200, else 280rem) library with `m-chip-group` → main shelves. The footer is carved before the aside, so the aside sits between the bars. |
| `youtube` | full-height; `m-layout-header` (72rem, `undefined` on phone) wrapping `m-app-bar :scrolled="false"` with search → `m-navigation-rail` (expanded on desktop, mini below; menu flips it) → main with a `position: sticky` chip row (works because main scrolls) and a card grid. |
| `steam` | full-height; `m-system-bar` + `m-app-bar` (two top rows) → `m-layout-footer sticky 44rem` → `m-layout-aside sticky` (240/300rem) → main shelves. |
| `discord` | full-height; `m-system-bar` → asides start 72rem (servers), start 240rem (channels), end 240rem (members) → `m-layout-header` (72rem desktop) + `m-app-bar` → `m-layout-footer sticky 72rem` composer → main. The header is carved after the asides, so it spans only the centre. |
| `gmail` | page scroll; `m-system-bar` → `m-app-bar` (search, 4rem padding) → `m-layout-aside sticky :size-token="navOpen ? '256rem' : '96rem'"` (extended FAB + `m-list` folders, folded below 1200) → main list grouped by `m-list-subheader`. |
| `gemini` | full-height; the aside comes first, so the history runs full height (272/72rem) → `m-app-bar` → `m-layout-footer sticky 216rem` (`m-textarea` composer) → main conversation. |
| `figma` | full-height; `m-layout-header 48rem` tool bar → aside start 240rem layers → aside end 240rem properties (`v-if`) → canvas main. |
| `notion` | full-height; aside start 240rem page tree (full height) → `m-layout-header 44rem` breadcrumbs → aside end 340rem comments (`v-if`) → main. |
| `console-nested` | full-height; `m-app-bar` → `m-navigation-rail` (expand toggle) → `m-layout-main` holding a nested `m-layout` (`m-layout-header :sticky="false"`, aside 176/220rem filters, `m-layout-item kind="main"`, `m-layout-footer` pagination). |
| `baseline` | `m-app-bar` (menu button) → main → `m-navigation-drawer` with `m-list`/`m-divider`. The only frame with phone navigation. |
| `constrained` | `m-layout-header` (72rem except phone) → `m-app-bar` holding a centred `max-width:1200rem` toolbar (text/tonal `m-button` links + `m-search`; on phone a menu icon and a search icon) → main `m-container > m-row > m-col` 3+9 (tablet 3+5). |
| `three-column` | `m-app-bar` with `m-tabs` → main `m-container > m-row` with left col (`tablet-xs 3 / desktop-xs 2`, `v-if !phone`), centre (5/8), right (`desktop-xs 2`, `v-if !compact`). |

Docs site (`docs_v3/app/layouts/default.vue`): `m-layout-header` > `m-app-bar`, then two
`m-layout-aside sticky v-if="!compact"` (a hosted rail, then a 272rem section tree), then main
(overridden to `overflow: visible; overflow-x: clip` so the TOC sticks). Below 1200
(`compact = less.desktopXs`) an `m-navigation-bar` appears, and a press opens an `m-sheet`
with the section tree.

Demos (`kit/playground/app/demo/**`, routes `/demo/orders` and `/demo/crm`):
- **Orders** (page scroll): `MLayoutHeader > MAppBar` (nav button toggles rail expansion,
  `MSearch` in actions) → `MLayoutAside sticky v-if="!compact" > MNavigationRail` → main (banner,
  filters, KPIs, table + side column via `@container (width >= 1400rem)`, fixed `MFabMenu`
  offset by `useLayoutZone().insets`) → `MNavigationBar v-if="compact"` (`less.tabletXs`).
- **CRM**: `MLayoutHeader > CrmAppBar` (menu button only when < 768, opens the drawer) →
  `CrmNavRail` wrapper as a direct zone (expanded ≥ 1200, engine-hidden < 768) → main (`MTabs`
  plus a side card at `1fr 380rem` from `media-min(desktop-xs)`). Drawer (rows with `:to`), FAB,
  sheet, dialog and snackbar sit outside `MLayout`. The section lives in the URL query.

Note: in all app wireframes except `baseline`, phone navigation simply vanishes. The asides are
dropped below 768 and nothing replaces them.

##### Snippet A: dashboard grid (KPI row + content + side)

```vue
<m-layout-main>
  <m-container class="dash">
    <!-- KPIs: 2 per row on mobile (2 of 4), 4 per row on tablet (2 of 8) and desktop (3 of 12) -->
    <m-col v-for="kpi in kpis" :key="kpi.id" :cols="2" :desktop-xs="3">
      <kpi-card v-bind="kpi" />
    </m-col>
    <m-col :desktop-xs="8"><orders-table /></m-col>  <!-- full row below 1200 -->
    <m-col :desktop-xs="4"><side-panel /></m-col>
  </m-container>
</m-layout-main>
```

To react to the space left beside the rail rather than to the window, use a container query
instead (orders demo):

```scss
.content { container: content / inline-size; display: grid; gap: spacing(24); }
.content__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: spacing(24); }
@container content (width >= 1400rem) { .content__grid { grid-template-columns: minmax(0, 1fr) 400rem; } }
```

##### Snippet B: list–detail

The kit has no pane component. The CRM pattern: two columns at ≥ 1200, and below that the
detail opens in a bottom sheet.

```vue
<div class="inbox">
  <m-list class="inbox__list">
    <m-list-item v-for="m in items" :key="m.id" tag="button" :headline="m.title"
                 :selected="m.id === openId" @click="open(m.id)" />
  </m-list>
  <section v-if="!compact && current" class="inbox__detail"><detail-view :item="current" /></section>
</div>
<m-sheet v-if="compact" v-model="sheetOpen">
  <div class="inbox__sheet"><detail-view v-if="current" :item="current" /></div>
</m-sheet>
```

```ts
const { less } = useBreakpoint()
const compact = computed(() => less.value.desktopXs)
const openId = ref<string | null>(null)
const sheetOpen = ref(false)
const open = (id: string) => { openId.value = id; if (compact.value) sheetOpen.value = true }
```

```scss
@use 'sass:map';
.inbox { display: grid; gap: spacing(24);
  @include media-min(map.get($breakpoints, 'desktop-xs')) { grid-template-columns: 360rem minmax(0, 1fr); } }
.inbox__sheet { max-height: 70dvh; overflow-y: auto; } // MSheet neither caps nor scrolls its content
```

##### Snippet C: aside folded below desktop, user-toggleable (Gmail, Gemini, Notion)

```vue
<m-layout-aside sticky :size-token="navOpen ? '256rem' : '96rem'" aria-label="Folders">…</m-layout-aside>
```

```ts
const { less } = useBreakpoint()
const navToggled = ref<boolean | null>(null)                           // null = follow the breakpoint
const navOpen = computed(() => navToggled.value ?? !less.value.desktopXs)
const toggleNav = () => { navToggled.value = !navOpen.value }
```

Settings-style centred column:
`<m-container><m-col :tablet-xs="6" :offset-tablet-xs="1" :desktop-xs="6" :offset-desktop-xs="3">…</m-col></m-container>`.

### 3.6 Layout pitfalls

1. **Breakpoint `v-if` is not first-paint-exact.** SSR uses the device-class seed (393 / 992 /
   1920). A desktop browser at 900px renders the desktop branch first and swaps after hydration.
   The engine's own range CSS (zone hiding, grid templates) is exact. Prefer CSS where you can:
   start/end zones are hidden below 768 even without JS.
2. **End asides never show on tablet, and side zones never show on mobile.** There is no
   per-zone opt-out. For example, figma's "properties" toggle below 1200 cannot show the end
   panel on tablet. Phone or tablet navigation must be added by you (`m-navigation-bar`,
   drawer, sheet).
3. **`m-layout-main` is always `overflow-y: auto`.** In page-scroll mode that makes it a scroll
   container that never scrolls, so `position: sticky` inside it does not stick. Use
   `full-height`, or override it like docs_v3:
   `.app-main { overflow: visible; overflow-x: clip; }` with a compound selector.
4. **`m-layout-main` has `container-type: inline-size`.** Per the kit findings and the CRM demo,
   this makes it the containing block of `position: fixed` descendants. The CRM puts its FAB
   outside `MLayout`; the orders demo keeps a fixed `MFabMenu` inside main (?). Outside the
   layout `useLayoutZone()` is `null`, so offset by hand, e.g.
   `calc(var(--ui-navigation-bar-height) + 16rem)` when compact.
5. **`m-snackbar` ignores layout insets** (fixed bottom, teleported) and overlaps
   `m-navigation-bar` on compact.
6. **Bar heights are tokens, not measured.** Content taller than the token overflows the
   reserved row. A sticky top/bottom zone without a size falls back to flow, with a dev warning.
7. **No navigation-suite component.** Swapping rail and bar is manual (§3 example).
   Rail and bar items are `<button>`s with no `to`/link. Sync with the route yourself;
   middle-click "open in new tab" does not work.
8. **`m-sheet` and `m-dialog` do not cap height or scroll.** Give the content
   `max-height: 70dvh; overflow-y: auto`.
9. **Navigation drawer is modal only.** Use an `m-layout-aside` for a standard drawer. There is
   no side sheet; `m-sheet` is bottom-only (`closeOnSwipe` default `'down'`).
10. **Layout-ancestry rules.** A zone must be at most 3 component hops from `m-layout`, with its
    DOM root as the grid child. The self-registering bars (`app-bar`, `rail`, `nav-bar`,
    `system-bar`) have no `order` prop; wrap them in a zone if you need `order`.
11. **Nested layouts.** No safe area, and sticky top/bottom pins to the viewport. Turn sticky off.
    The inner layout defaults to `min-height: 100dvh`.
12. **Breakpoint flag traps:** `is.mobileXs` is effectively never true (mobile-xs is 0);
    `is.tabletXs` and `is.desktopXs` are 1px bands; `more`/`less` have a dead pixel on each value;
    `bp-tablet`, `m-col :tablet` and `colsTablet` all start at 1199px.
13. **Range snap.** At 769 and 1201px the whole UI shrinks about 36% in one step. Expect it,
    and design the tablet canvas at 1199 and the phone canvas at 767.
14. **Global `:root` tokens.** `--ui-navigation-bar-height` and its siblings come from the
    component's own stylesheet, so they exist only when that CSS is loaded (?).
15. **Overlays need `<m-app>`** (it mounts `#ui-overlay-host`). Overlays render client-only.

## §4 Shared prop groups and the component map

Prop groups that many components share. In §6 a line `- …field props` or `- …modal-layer props`
means "this whole group, with the defaults below, unless the component lists a line that overrides it".

#### Field props (`text-field/props.ts` → text-field, textarea, number-input, dropdown, autocomplete, color-input, file-input)
- disabled=false, readonly=false
- variant: filled|outlined|underline = 'filled' (textarea, dropdown, autocomplete, color-input: filled|outlined)
- shape: none|extra-small|medium|large|full = 'extra-small' — container corner
- labelPlacement: top|float|inset|hidden = 'float' (textarea 'top')
- label, placeholder, helperText, errorMessage, name, autocomplete: string
- error=false, required=false (draws the asterisk only; validation is yours/adapter's), autofocus=false
- path: string — validation-adapter path ("autopilot": binds value + error message; then no `v-model`)
- density: compact|default|comfortable = 'default' (field heights 44 / 56 / 64)
- Models: `v-model` (value), `v-model:focused`. Slots usually: `prepend`, `append`, `leading-content`,
  `#error="{ message }"`, `#helper="{ message }"`.
- The support line under the box is reserved only when something can appear there (`helperText`, `path`,
  `required`, `#helper`/`#error`, a bound `error`/`errorMessage`). Bind `error-message` (even empty) if
  errors can arrive later, or the layout jumps.

#### Modal-layer props (`overlay` → dialog, sheet, navigation-drawer, dialog-date, overlay)
- displayDirective: if|show = 'if' — `if` unmounts after close, `show` keeps DOM/state
- hideOverlay: boolean — no scrim; overlayBehavior: auto|persist = 'auto' — dim only the topmost modal / keep all scrims
- overlayTransition = 'ui-overlay-fade', contentTransition, overlayClass, contentClass
- closeOnOutside=true, closeOnEscape=true, closeOnSwipe: none|up|right|down|left = 'none' (sheet 'down'),
  swipeThreshold=80 (px), showSwipeBanner=false (only `#swipe-banner` starts a swipe)
- persistent=false — blocks every user dismissal
- background: interactive|non-interactive = 'non-interactive' — `interactive` = page stays usable (no inert, no trap)
- trapFocus, lockScroll=true, reserveScrollBarGap=true, preventNavigationGestures=false (iOS edge swipes)
- parent: M3ModalContext — explicit parent for cascade closing (programmatic modals)
- Events (fall-through): `before-open({ stop })`, `before-close({ stop })`, `opened`, `closed`, `click-outside`.
- Overlays render client-only into `#ui-overlay-host` (mounted by `<m-app>`), on the native top layer.

#### Shared factories
`color: primary|secondary|tertiary|error = 'primary'` · `variant` (`MVariant` = elevated|filled|tonal|outlined|text,
narrowed per component) · `disabled=false`, `loading=false` (loading = inline `MLoading`, stays focusable, click
swallowed) · `readonly=false`. `color` never takes success/warning/info — those exist only as colour roles
(`--md-sys-color-success` …) and on `MAlert type`.

#### What exists, by family (64 doc pages; `m3:` verdict = parity | drift | rework | authored)
- **Buttons:** button, button-icon, button-fab, button-extended-fab, button-split, button-segmented, button-group, fab-menu
- **Inputs:** text-field, textarea, number-input (+units, scrub), otp-input, dropdown (select), autocomplete,
  search (bar only), date-picker + dialog-date, time-picker, color-picker, color-input, file-input, file-upload (queue)
- **Selection:** chip, chip-group, checkbox, radio(+group), switch, slider (range, vertical), rating, selection-group/item (headless-ish), form-renderer (beta)
- **Navigation:** navigation-bar, navigation-rail, navigation-drawer (modal only), tabs, app-bar(+nav/title/actions), toolbar, breadcrumbs, pagination
- **Overlays:** dialog, sheet (bottom only), menu, tooltip, overlay (primitive)
- **Containment:** card, list(+item, subheader), divider, expansion-panels/panel
- **Feedback:** badge, progress (linear/circular, expressive wavy), loading (circular / expressive shape morph), snackbar, alert, banner
- **Data:** table (sort/select/paging, server-driven), timeline, avatar, hotkey
- **Foundation:** layout (+header/aside/main/footer/item), container/row/col, spacer, responsive (aspect box), shape (35 M3 shapes, morph), icon, system-bar, surface, app, lazy
- **Absent (build app-side, report as a finding):** carousel, stepper, skeleton, empty state, charts, calendar/month
  grid, date-range picker, treeview, image/gallery, side sheet, standard (non-modal) drawer, rich text, kanban/DnD
  list, data-iterator, toast queue, chat bubble, avatar group, stat/KPI tile, rating summary, price, search results panel.

## §5 Reading §6

Generated from the kit sources (props: `name: type =default — note`; `models` = `v-model[:name]`; slots with `{scope}`). A `⚠` line marks something the generator missed — the details are in §7, which wins over §6.

## §6 Component API

#### Button — buttons, m3:rework
**<m-button>**
props:
- color: primary|secondary|tertiary|error ='primary'
- variant: elevated|filled|tonal|outlined|text ='filled' — Material surface treatment that controls the component emphasis.
- disabled: boolean =false
- loading: boolean =false
- density: compact|default|comfortable ='default' — Height, padding, icon and type step.
- shape: round|square ='round' — Resting container shape; a selected toggle is always square.
- selected: boolean | undefined =undefined — Toggle state, exposed as `aria-pressed` (`v-model:selected`).
- tag: button|link ='button' — Root behavior: native button or Nuxt link.
- type: button|submit|reset ='button' — Native button type when `tag` is `button`.
- to: NuxtLinkProps['to'] =undefined — Nuxt route destination when `tag` is `link`.
events: update:selected(selected: boolean)
slots: default{{ selected: boolean }}, prepend{{ selected: boolean }}, append{{ selected: boolean }}

#### Icon button — buttons, m3:rework
**<m-button-icon>**
props:
- color: primary|secondary|tertiary|error =undefined — Colour role.
- variant: filled|tonal|outlined|text ='text' — Low-emphasis M3 icon button style.
- disabled: boolean =false
- loading: boolean =false
- density: compact|default|comfortable ='default' — Height, padding, icon and type step.
- shape: round|square ='round' — Resting container shape; a selected toggle is always square.
- selected: boolean | undefined =undefined — Toggle state, exposed as `aria-pressed` (`v-model:selected`).
- tag: button|link ='button' — Root behavior: native button or Nuxt link.
- type: button|submit|reset ='button' — Native button type when `tag` is `button`.
- to: NuxtLinkProps['to'] =undefined — Nuxt route destination when `tag` is `link`.
- width: narrow|default|wide ='default' — Container width at the density's height.
- ariaLabel: string =undefined — Accessible name required by the icon-only button.
events: update:selected(selected: boolean)
slots: default{{ selected }}

#### FAB — buttons, m3:rework
**<m-button-fab>**
⚠ + color, variant(tonal|filled=tonal), density(40/56/96), disabled, loading — §7
props:
- ariaLabel: string =undefined — Accessible name required by the icon-only FAB.
slots: default

#### Extended FAB — buttons, m3:rework
**<m-button-extended-fab>**
⚠ + color, variant(tonal|filled=tonal), density, disabled, loading — §7
props:
- expanded: boolean =true — Shows the label.
slots: prepend, default

#### Split button — buttons, m3:rework
**<m-button-split>**
props:
- color: primary|secondary|tertiary|error ='primary'
- variant: elevated|filled|tonal|outlined ='filled'
- density: compact|default|comfortable ='default' — Height, padding and icon step of both buttons.
- disabled: boolean =false
- loading: boolean =false
- trailingAriaLabel: string =undefined — Accessible name of the icon-only trailing button.
events: click, trailing
slots: prepend, default, trailing{{ open }}, menu{{ close }}

#### Segmented button — buttons, m3:drift
**<m-button-segmented>**
props:
- color: primary|secondary|tertiary|error ='secondary'
- disabled: boolean =false — Disables every segment.
- items: MSegmentedItem[] =() => [] — Segments displayed by the single- or multi-select group.
- multiple: boolean =false — Enables selecting more than one segment.
models: modelValue: MSegmentedModelValue
events: update:modelValue(value: MSegmentedModelValue)

#### Button group — buttons, m3:parity
**<m-button-group>**
props:
- color: primary|secondary|tertiary|error ='primary'
- variant: elevated|filled|tonal|outlined ='filled'
- density: compact|default|comfortable ='default' — Height, padding and icon step of every button.
- disabled: boolean =false — Disables the whole group.
- items: MButtonGroupItem[] =() => [] — Buttons of the group, in reading order.
- multiple: boolean =false — Lets more than one button be selected.
models: modelValue: MButtonGroupModelValue
events: update:modelValue(value: MButtonGroupModelValue)

#### FAB menu — buttons, m3:rework
**<m-fab-menu>**
props:
- color: primary|secondary|tertiary|error ='primary'
- density: compact|default|comfortable ='default' — FAB step: 40 / 56 / 96.
- disabled: boolean =false
- items: MFabMenuItem[] =() => []
- align: start|end ='end' — Edge the FAB and its actions align to, in the writing direction.
- ariaLabel: string =undefined — Accessible name of the default FAB; no default copy is shipped.
- openIcon: string =ICONS.add
- closeIcon: string =ICONS.close
models: open: boolean =false
events: select(item: MFabMenuItem), update:open(value: boolean)
slots: activator{{ is-open, toggle, open, close, disabled, activator-attrs }}, default{{ close, select }}

#### Text field — inputs, m3:drift
**<m-text-field>**
props:
- …field props (§4 "Field props")
- density: compact|default|comfortable ='default' as MFieldDensity
- type: text|email|password|tel|url|search ='text'
- inputAttrs: InputHTMLAttributes =undefined — Native input attributes/listeners used by composite fields such as comboboxes.
- prefix: string =undefined — Text fixed before the value (`$`, `https://`).
- suffix: string =undefined — Text fixed after the value (`@gmail.com`, `kg`).
models: modelValue: string =''; focused: boolean =false
events: update:modelValue(value: string), update:focused(value: boolean)
slots: prepend, leading-content, append, error{{ message }}, helper{{ message }}

#### Textarea — inputs, m3:drift
**<m-textarea>**
props:
- …field props (§4 "Field props")
- labelPlacement: top|float|inset|hidden ='top' — Where the label sits.
- rows: number =3 — Minimum and initial height, in rows.
- maxRows: number =undefined — Growth ceiling in rows; beyond it the value scrolls.
- autoGrow: boolean =false — Grow with the content instead of staying at `rows`.
- resizable: boolean =false — Render a corner grip the user can drag — or arrow-key — to set the height.
- resizeLabel: string =MESSAGES.textareaResize — Accessible name of the resize grip.
- maxlength: number =undefined
- counter: boolean | number =false — `true` counts against `maxlength`; a number sets a display-only limit.
- spellcheck: boolean =undefined
- wrap: soft|hard|off ='soft'
models: modelValue: string =''; focused: boolean =false
events: update:modelValue(value: string), update:focused(value: boolean)
slots: prepend, append, footer, error{{ message }}, helper{{ message }}, counter
**<m-textarea-footer>**
slots: start{FooterSlotProps}, end{FooterSlotProps}, default{FooterSlotProps}

#### Number input — inputs, m3:authored
**<m-number-input>**
props:
- …field props (§4 "Field props")
- density: compact|default|comfortable ='default' as MFieldDensity
- min: number =undefined
- max: number =undefined
- step: number =1
- precision: number =undefined — Decimal places.
- locale: string ='en-US'
- useGrouping: boolean =true
- controls: split|stacked|scrub|false ='split'
- clamp: boolean =true — Pull committed values back inside `min`/`max`.
- units: MNumberInputUnit[] =undefined — Units to choose from.
- unitLabel: string =MESSAGES.numberUnit — Accessible name of the unit menu trigger.
- incrementLabel: string =MESSAGES.numberIncrement — Accessible name of the increase control.
- decrementLabel: string =MESSAGES.numberDecrement — Accessible name of the decrease control.
models: modelValue: number | null =null; focused: boolean =false; unit: string | null =null
events: increment(value: number), decrement(value: number), invalid(draft: string, reason: NumberInputInvalidReason), update:modelValue(value: number | null), update:focused(value: boolean), update:unit(value: string | null)
slots: decrement, scrub, prepend, append, unit, increment, error{{ message }}, helper{{ message }}
**<m-number-input-unit>**
models: modelValue: string | null =null
events: update:modelValue(value: string | null)
slots: default

#### OTP input — inputs, m3:authored
**<m-otp-input>**
props:
- disabled: boolean =false
- loading: boolean =false
- readonly: boolean =false
- length: number =6
- mode: numeric|alphanumeric ='numeric'
- groups: number[] =() => []
- separator: string ='' — Glyph between groups.
- variant: filled|outlined|underline ='outlined' — Cell drawing.
- mask: false|last|always =false — Hide typed characters (`false` shows them); the glyph is the `#mask` slot.
- placeholder: string =undefined — A per-cell pattern drawn in empty cells: cell `i` shows `placeholder[i]`, or the first character when the pat…
- required: boolean =false — Marks the code required: `required` on the input and a decorative `*` by the label.
- autofocus: boolean =false
- label: string =undefined — The accessible name.
- labelPlacement: top|hidden ='top'
- error: boolean =false
- errorMessage: string =undefined
- path: string =undefined — Validation-adapter path: binds the code and its errors, as on every field.
- name: string =undefined
models: modelValue: string =''; focused: boolean =false
events: complete(value: string), invalid(input: string, rejected: string[]), clear, update:modelValue(value: string), update:focused(value: boolean)
slots: label, group{{ cells, index, start, end, complete }}, field, mask, separator{{ index }}, support

#### Dropdown — inputs, m3:drift
**<m-dropdown>**
⚠ + field props (no autocomplete); emits select, remove, clear, open, close
props:
- density: compact|default|comfortable ='default' as MFieldDensity
- variant: filled|outlined ='filled'
- loading: boolean =false — Options are being fetched: a progress bar runs over the panel's top edge.
- messages: MDropdownMessages =undefined — The phrases of the field; see {@link MDropdownMessages}.
- items: readonly DropdownItemBase[] =() => [] — Options.
- itemTitle: DropdownRuntimeResolver<string> ='label' — Row text.
- itemValue: DropdownRuntimeResolver<unknown> =undefined — Value written to the model.
- itemDisabled: DropdownRuntimeResolver<boolean> ='disabled' — Per-item disabled guard.
- valueComparator: DropdownValueComparator =undefined — Value equality.
- multiple: boolean =false — Select more than one value; the model becomes an array.
- mandatory: boolean =false — Keep at least one value selected (the last one cannot be removed).
- max: number =undefined — Upper bound on the selection.
- clearable: boolean =false — Show a control that empties the selection.
- menuPlacement: top left|top right|bottom left|bottom right|center|top|bottom ='top left' — Where the panel opens relative to the field.
- maxHeight: number | string =undefined — Cap on the scrolling area of the panel.
models: modelValue: TValue | TValue[] | undefined; open: boolean =false
events: update:modelValue(value: TValue | TValue[] | undefined), update:open(value: boolean)
slots: prepend, selection{{ entries, remove }}, chip, append, default{{ entries, listbox-attrs, get-option-attrs, panel-style, active-id, limit-reache}, item, empty, loading

#### Autocomplete — inputs, m3:drift
**<m-autocomplete>**
⚠ + field props; emits select, remove, clear, open, close
props:
- …all m-dropdown props
- autocomplete: string ='off' — Browser autofill hint for the query input.
- filter: false | ((item: never, query: string, title: string) => boolean) =undefined — How a row is matched against the query.
- filterMode: contains|starts-with ='contains' as AutocompleteFilterMode — Built-in matching strategy, used when `filter` is not a function.
- minSearchLength: number =0 — Characters required before anything is shown.
- hideSelected: boolean =false — Drop already-selected rows from the list instead of ticking them.
- autoSelectFirst: boolean =false — Put the virtual focus on the first row as soon as the rows change.
- openOnFocus: AutocompleteOpenOnFocus ='pointer' — Open the panel when the field takes focus.
models: modelValue: TValue | TValue[] | undefined; search: string =''; open: boolean =false
events: update:modelValue(value: TValue | TValue[] | undefined), update:search(value: string), update:open(value: boolean)
slots: prepend, selection{{ entries, remove }}, chip, append, default{{ entries, listbox-attrs, get-option-attrs, panel-style, active-id, limit-reache}, item, hint, loading, empty, no-results

#### Search — inputs, m3:rework
**<m-search>**
⚠ emits submit(query), clear — no results panel, see §7
props:
- disabled: boolean =false — No query can be typed or cleared; the bar recedes.
- placeholder: string =undefined — Hint shown in the empty bar.
- ariaLabel: string =undefined — Accessible name of the field.
- clearLabel: string =undefined — Accessible name of the clear button, shown once there is a query.
models: modelValue: string =''; focused: boolean =false
events: update:modelValue(value: string), update:focused(value: boolean)
slots: leading, clear, trailing, avatar

#### Date picker — inputs, m3:rework
**<m-date-picker>**
props:
- disabled: boolean =false — Shows the date, takes no choice; every part stays out of the tab order.
- readonly: boolean =false — Shows the date and lets the user look around, takes no choice.
- label: string =MESSAGES.dateTitle — Title over the date while picking on the calendar.
- inputTitle: string =MESSAGES.dateInputTitle — Title over the date while typing it.
- minDate: MDatePickerValue =undefined
- maxDate: MDatePickerValue =undefined
- locale: string ='en-US' — Names, formats and the first day of the week.
- modeToggle: boolean =true — Offer the switch between the calendar and a typed date.
- prevMonthLabel: string =MESSAGES.datePrevMonth
- nextMonthLabel: string =MESSAGES.dateNextMonth
- switchToYearLabel: string =MESSAGES.dateSwitchToYear
- switchToDayLabel: string =MESSAGES.dateSwitchToDay
- switchToInputLabel: string =MESSAGES.dateSwitchToInput
- switchToCalendarLabel: string =MESSAGES.dateSwitchToCalendar
- helperText: string =undefined — Text under the picker; an error takes its place.
- error: boolean =false — Shows the error state; `errorMessage` says why.
- errorMessage: string =undefined
- required: boolean =false — A host's `validate()` refuses an empty picker; the typed field is marked required.
- name: string =undefined — Submits the chosen day (`YYYY-MM-DD`) with a form.
- inputLabel: string =MESSAGES.dateInputLabel — Label of the typed-date field.
- placeholder: string =undefined — Pattern shown in the empty field.
- errorPattern: string =MESSAGES.dateErrorPattern — Said when a typed date cannot be read.
- errorRange: string =MESSAGES.dateErrorRange — Said when a typed date is outside `min-date`/`max-date`.
models: modelValue: DatePickerValue | null =null; mode: 'picker' | 'input' ='picker'
events: update:modelValue(value: DatePickerValue | null), update:mode(value: MDatePickerMode)
slots: label, headline{{ date: Date | null }}, day{{ day: DateGridCell }}, year{{ year: number }}, helper, actions
**<m-dialog-date>**
⚠ + every m-date-picker prop except helperText/error/errorMessage/required/name
props:
- …modal-layer props (§4 "Modal-layer props")
- initialMode: picker|input ='picker' — How the picker opens, every time it opens, unless `v-model:mode` holds the mode.
- mode: picker|input =undefined — The mode on screen; bind it to keep the mode between openings.
- cancelLabel: string =MESSAGES.dateCancel
- confirmLabel: string =MESSAGES.dateConfirm
models: modelValue: boolean =false; date: MDatePickerValue | null =null
events: update:mode(mode: MDatePickerMode), cancel, confirm(date: Date | null), update:modelValue(value: boolean), update:date(value: MDatePickerValue | null)
slots: label, headline{{ date: Date | null }}, day{{ day: DateGridCell }}, year{{ year: number }}

#### Time picker — inputs, m3:rework
**<m-time-picker>**
props:
- label: string =undefined — Headline over the picker.
- helperText: string =undefined
- ariaLabel: string =MESSAGES.timeTitle — Names the group when no headline is shown.
- modeToggle: boolean =false — Offer the switch between the dial and typed fields, under the picker.
- switchToInputLabel: string =undefined — Names the switch while the dial is shown.
- switchToPickerLabel: string =undefined — Names the switch while the fields are shown.
- layout: vertical|horizontal ='vertical' — Horizontal folds into vertical when its container is narrower than the two side by side.
- hourCycle: auto|h12|h23 ='h23' — The words of `Intl`: `'h23'` (0–23), `'h12'` (1–12 with a period), `'auto'` from `locale`.
- locale: string ='en-US'
- disabled: boolean =false
- readonly: boolean =false
- required: boolean =false
- error: boolean =false
- errorMessage: string =undefined
- name: string =undefined — Submits the `HH:mm` value with a form.
- hourLabel: string =MESSAGES.timeHour
- minuteLabel: string =MESSAGES.timeMinute
- periodLabel: string =MESSAGES.timePeriod
- amLabel: string =undefined — AM and PM in the locale's words unless set.
- pmLabel: string =undefined
- hourError: string =MESSAGES.timeErrorHour
- minuteError: string =MESSAGES.timeErrorMinute
models: modelValue: string =''; mode: 'picker' | 'input' ='picker'
events: update:modelValue(value: string), update:mode(value: MTimePickerMode)
slots: label, helper

#### Color picker — inputs, m3:authored
**<m-color-picker>**
props:
- formats: ColorFormat[] =() => ALL_FORMATS — Selectable output formats.
- swatches: ColorSwatch[] =() => [] — Palette entries (string or `{ value, label }`).
- disabled: boolean =false
- readonly: boolean =false — Shows and announces the color, takes no change: every part stays focusable.
- hideCanvas: boolean =false
- hideInputs: boolean =false
- hidePreview: boolean =false
- hideSwatches: boolean =false
- label: string =undefined — Names the picker as a whole (a group of controls).
- messages: MColorPickerMessages =() => ({})
models: modelValue: string | null =null; format: 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' ='hex'
events: change(value: string | null), invalid(draft: string, reason: ColorParseError), update:modelValue(value: string | null), update:format(value: ColorFormat)
slots: preview{{ color: string, value: string | null }}, swatch{{ swatch: { value: string, label: string }, selected: boolean }}, actions

#### Color input — inputs, m3:authored
**<m-color-input>**
⚠ + field props (no autocomplete)
props:
- density: compact|default|comfortable ='default' as MFieldDensity
- variant: filled|outlined ='filled'
- format: hex|hexa|rgb|rgba|hsl|hsla|auto ='hex'
- formats: ColorFormat[] =() => ALL_FORMATS
- commit: change|input ='change' — `change` commits on Enter/blur; `input` commits every valid draft live.
- picker: boolean =true — Whether the swatch opens the picker popover.
- swatches: ColorSwatch[] =() => []
- clearable: boolean =false
- pickerLabel: string =undefined — Accessible name of the swatch button that opens the picker — and of the picker it opens.
- pickerMessages: MColorPickerMessages =() => ({}) — Names of the picker's parts; see `MColorPicker`'s `messages`.
- formatHint: string =undefined — What the support line says when a typed value cannot be read — the forms it takes ("#RRGGBB, rgb() or hsl()").
models: modelValue: string | null =null; open: boolean =false; focused: boolean =false
events: invalid(draft: string, reason: ColorParseError), change(value: string | null), clear, open, close, update:modelValue(value: string | null), update:open(value: boolean), update:focused(value: boolean)
slots: prepend, leading-content, helper, error

#### File input — inputs, m3:authored
**<m-file-input>**
⚠ + field props (no autocomplete)
props:
- density: compact|default|comfortable ='default' as MFieldDensity
- accept: string =undefined
- multiple: boolean =false
- capture: MFileInputCapture =undefined
- maxFiles: number =undefined
- maxSize: number =undefined
- showSize: boolean =false
- formatSize: (bytes: number) => string =formatFileSize — How a size reads with `showSize`.
- clearable: boolean =true
- browseLabel: string =undefined — Visible text of the browse button.
- clearLabel: string =undefined — Accessible name of the clear button.
- rejectMessages: MFileRejectMessages =undefined — What the support line says when a file is refused, per reason (`type`, `size`, `count`).
models: modelValue: File | File[] | null =null; focused: boolean =false
events: reject(rejection: FileRejection), clear, select(files: File[]), update:modelValue(value: File | File[] | null), update:focused(value: boolean)
slots: prepend, selection{{ files: File[], text: string }}, browse{{ props: BrowseButtonSlotProps, open: () => void }}, clear{{ props: ClearButtonSlotProps, clear: () => void }}, actions{{ files: File[], open: () => void, clear: () => void, disabled: boolean }}, default

#### File upload — inputs, m3:authored
**<m-file-upload>**
props:
- disabled: boolean =false — Takes no files and offers no action; the whole group recedes.
- readonly: boolean =false
- label: string =undefined — Names the whole control (a group): the dropzone, the queue and the messages.
- hint: string =undefined — What is accepted ("PDF or PNG, up to 5 MB, 10 files") — shown in the dropzone and read with its button.
- required: boolean =false — Marks the group required, with a decorative `*` by its label.
- accept: string =undefined
- multiple: boolean =true
- maxFiles: number =undefined
- maxSize: number =undefined
- upload: (file: File, context: FileUploadTaskContext) => Promise<unknown> =undefined
- queue: FileUploadQueue =undefined — A queue the app keeps (`useFileUploadQueue`), so a status outlives the component: a tab or sheet that mounts …
- autoStart: boolean =false — Start uploading as soon as files arrive — the ones already in `v-model` included.
- concurrency: number =3
- messages: MFileUploadMessages =() => ({})
models: modelValue: File[] =() => []
events: add(files: File[]), reject(rejection: FileRejection), start(entry: FileUploadEntry<TResult>), progress(entry: FileUploadEntry<TResult>), success(entry: FileUploadEntry<TResult>), error(entry: FileUploadEntry<TResult>), cancel(entry: FileUploadEntry<TResult>), remove(file: File), complete, update:modelValue(value: File[])
slots: dropzone{{ open-picker, add-files }}, rejection{{ rejection }}, list{{ entries }}, item, empty, actions{{ start, entries }}

#### Chip — selection, m3:rework
**<m-chip>**
⚠ + disabled; no label/closable props — see §7 "m-chip"
props:
- type: assist|filter|input|suggestion ='assist'
- value: unknown — Selection value inside a `<MChipGroup>`.
models: modelValue: boolean =false
events: update:modelValue(value: boolean)
slots: icon, default, trailing

#### Chip group — selection, m3:authored
**<m-chip-group>**
props:
- items: readonly unknown[] =undefined — Optional data-driven items rendered through the `#item` slot.
- itemValue: string | ((item: unknown, index: number) => unknown) =undefined — Resolve each item's selection value (key or getter).
- itemDisabled: string | ((item: unknown, index: number) => boolean) =undefined — Resolve each item's disabled state (key or getter).
- itemKey: string | ((item: unknown, index: number) => PropertyKey) =undefined — Resolve a stable v-for key (key or getter).
- multiple: boolean =false — Allow multiple selection.
- mandatory: boolean | 'force' =false — Enforce at least one selection; `'force'` also auto-selects the first.
- disabled: boolean =false — Disable every registered chip in the group.
- max: number =undefined — Maximum concurrent selections (multiple mode only).
- direction: horizontal|vertical ='horizontal' — Layout flow; also maps the arrow keys.
- wrap: boolean =true — Wrap chips onto multiple lines instead of scrolling natively.
- valueComparator: (left: unknown, right: unknown) => boolean =undefined — Custom value equality (defaults to `===`).
models: modelValue: TValue | TValue[] | undefined
events: update:modelValue(value: TValue | TValue[] | undefined)
slots: default{ChipGroupSlot<TValue>}, item{ChipItemSlot<TItem, TValue>}, empty{ChipGroupSlot<TValue>}

#### Checkbox — selection, m3:drift
**<m-checkbox>**
props:
- disabled: boolean =false
- loading: boolean =false
- path: string =undefined
- label: string =undefined
models: modelValue: boolean =false
events: update:modelValue(value: boolean)
slots: default

#### Radio — selection, m3:drift
**<m-radio>**
⚠ + disabled
props:
- name: string =undefined
- value: MRadioValue (required)
- label: string =undefined
- path: string =undefined
models: modelValue: MRadioValue | undefined =undefined
events: update:modelValue(value: MRadioValue | undefined)
slots: default
**<m-radio-group>**
⚠ + disabled
props:
- name: string =undefined
- path: string =undefined
- mandatory: boolean =false
models: modelValue: RadioValue | undefined =undefined
events: update:modelValue(value: RadioValue | undefined)
slots: default

#### Switch — selection, m3:drift
**<m-switch>**
props:
- disabled: boolean =false
- loading: boolean =false
- path: string =undefined
- label: string =undefined
models: modelValue: boolean =false
events: update:modelValue(value: boolean)
slots: default

#### Slider — selection, m3:rework
**<m-slider>**
⚠ + disabled
props:
- readonly: boolean =false
- min: number =0
- max: number =100
- step: number =1
- label: string =''
- showValue: boolean =false
- discrete: boolean =false
- range: boolean =false
- orientation: horizontal|vertical ='horizontal'
- name: string =undefined
- ariaLabelStart: string =''
- ariaLabelEnd: string =''
models: modelValue: number | number[] =0
events: update:modelValue(value: number | number[])

#### Rating — selection, m3:authored
**<m-rating>**
props:
- disabled: boolean =false
- loading: boolean =false
- readonly: boolean =false
- length: number =5
- step: number =1
- clearable: boolean =false
- icon: MIconName ='round-star'
- emptyIcon: MIconName ='round-star-outline'
- color: primary|secondary|tertiary|error ='primary'
- name: string =undefined
- ariaLabel: string ='Rating'
models: modelValue: number =0; focused: boolean =false
events: change(value: number), preview(value: number | null), update:modelValue(value: number), update:focused(value: boolean)
slots: item{{ index, value, fill, active }}

#### Selection group — selection, m3:authored
**<m-selection-group>**
props:
- items: readonly TItem[] — Data-driven items rendered through the `#item` slot.
- itemValue: ItemValueResolver<TItem, TValue> — Resolve each item's selection value (key or getter).
- itemDisabled: ItemDisabledResolver<TItem> — Resolve each item's disabled state (key or getter).
- itemKey: ItemKeyResolver<TItem> — Resolve a stable v-for key (key or getter).
- multiple: boolean =false — Allow multiple selection.
- mandatory: boolean | 'force' =false — Enforce at least one selection; `'force'` also auto-selects the first.
- disabled: boolean =false — Disable the whole group.
- max: number — Maximum concurrent selections (multiple mode only).
- valueComparator: (left: TValue, right: TValue) => boolean — Custom value equality (defaults to `===`).
models: modelValue: TValue | TValue[] | undefined
events: update:modelValue(value: TValue | TValue[] | undefined)
slots: default{SelectionGroupSlot<TValue>}, item{SelectionItemSlot<TItem, TValue>}, empty{SelectionGroupSlot<TValue>}
**<m-selection-item>**
props:
- value: TValue (required) — The item's selection value.
- disabled: boolean =false — Disable this item's selection.
slots: default{SelectionItemState<TValue>}

#### Form renderer — selection, m3:authored
**<m-form-renderer>**
⚠ needs a validation adapter; see §7
props:
- config: FormFieldConfig[] (required)
- onSubmit: (values: Record<string, unknown>) => Promise<void> | void
slots: default{{ pending, is-error }}

#### Navigation bar — navigation, m3:rework
**<m-navigation-bar>**
props:
- items: MNavigationBarItem[] =() => []
- ariaLabel: string ='Primary'
models: modelValue: string | null =null
events: update:modelValue(value: string | null)

#### Navigation rail — navigation, m3:rework
**<m-navigation-rail>**
props:
- items: MNavigationRailItem[] =() => []
- expanded: boolean =false
- ariaLabel: string ='Primary'
models: modelValue: string | null =null
events: update:modelValue(value: string | null)
**<m-navigation-rail-item>**
props:
- active: boolean =false
- expanded: boolean =false
- icon: MIconName
- label: string (required)
- badge: number =0
events: select

#### Navigation drawer — navigation, m3:rework
**<m-navigation-drawer>**
props:
- …modal-layer props (§4 "Modal-layer props")
- side: left|right ='left'
- containerClass: string =undefined — Extra class on the drawer container (the overlay panel).
models: modelValue: boolean =false
events: update:modelValue(value: boolean)
slots: header, default

#### Tabs — navigation, m3:drift
**<m-tabs>**
props:
- items: MTabItem[] =undefined
models: modelValue: TabValue | null =null
events: update:modelValue(value: TabValue | null)
slots: tabs, panels, default{{ value }}
**<m-tabs-tab>**
props:
- value: TabValue (required)
- label: string
- icon: MIconName
- disabled: boolean =false
- to: NuxtLinkProps['to'] — Optional Nuxt route destination.
slots: default
**<m-tabs-panel>**
props:
- value: TabValue (required)
slots: default

#### App bar — navigation, m3:drift
**<m-app-bar>**
props:
- title: string ='' — Ready-made headline text; omit and compose `<MAppBarTitle>` for full control.
- subtitle: string ='' — Ready-made supporting text under the title.
- type: small|medium|large|center-aligned ='small' — MD3 size.
- align: start|center ='start' — Headline alignment axis.
- sticky: boolean =true — Pin to the top when the bar is a direct child of `m-layout`.
- scrolled: boolean | undefined =undefined — Scroll-fill control (MD3: fill, not shadow).
slots: default
**<m-app-bar-nav>**
slots: default
**<m-app-bar-title>**
props:
- title: string ='' — Headline text; override with the default slot for custom content.
- subtitle: string ='' — Supporting text under the headline; override with the `subtitle` slot.
slots: default, subtitle
**<m-app-bar-actions>**
slots: default

#### Toolbar — navigation, m3:rework
**<m-toolbar>**
props:
- items: MToolbarItem[] =() => []
- layout: horizontal|vertical ='horizontal'
- type: standard|baseline ='standard'
- multiple: boolean =false
models: modelValue: ToolbarModel
events: select(item: ToolbarItem), update:modelValue(value: ToolbarModel)
slots: default, item{{ item, index, selected, on-select }}

#### Breadcrumbs — navigation, m3:authored
**<m-breadcrumbs>**
props:
- items: MBreadcrumbItem[] — Ordered crumbs, root first.
- ariaLabel: string ='Breadcrumbs' — Accessible name of the navigation landmark.
- divider: string ='round-chevron-right' — Separator between crumbs.
- overflow: scroll|wrap ='scroll' — Constrained-width behavior.
slots: prepend, item, divider, append

#### Pagination — navigation, m3:authored
**<m-pagination>**
props:
- length: number — Number of pages.
- totalVisible: number =7 — Maximum page/ellipsis slots.
- disabled: boolean =false — Disables every control.
- showFirstLast: boolean =false — Renders the jump-to-first and jump-to-last controls.
- showPrevNext: boolean =true — Renders the previous and next controls.
- ariaLabel: string ='Pagination' — Accessible name of the navigation landmark.
- firstLabel: string ='First page' — Accessible name of the jump-to-first control.
- previousLabel: string ='Previous page' — Accessible name of the previous-page control.
- nextLabel: string ='Next page' — Accessible name of the next-page control.
- lastLabel: string ='Last page' — Accessible name of the jump-to-last control.
models: modelValue: number =1
events: update:modelValue(value: number)
slots: first, previous, ellipsis, item, next, last

#### Dialog — overlays, m3:drift
**<m-dialog>**
⚠ never emits confirm/cancel itself — see §7
props:
- …modal-layer props (§4 "Modal-layer props")
- title: string =undefined
models: modelValue: boolean =false
events: cancel, confirm(data?: unknown), update:modelValue(value: boolean)
slots: icon, default, actions

#### Sheet — overlays, m3:drift
**<m-sheet>**
⚠ bottom sheet only; never emits confirm/cancel — §7
props:
- …modal-layer props (§4 "Modal-layer props")
- closeOnSwipe: none|up|right|down|left ='down'
models: modelValue: boolean =false
events: cancel, confirm(data?: unknown), update:modelValue(value: boolean)
slots: default

#### Menu — overlays, m3:rework
**<m-menu>**
⚠ no activator slot; anchors to its DOM parent — see §7
props:
- closeOnBackdrop: boolean =true
- absolute: boolean =false
- origin: top left|top right|bottom left|bottom right|center|top|bottom ='top left'
- matchWidth: boolean =false
- lockScroll: boolean =true — Lock page scroll while the menu is open.
- anchor: HTMLElement | null =null — Element the surface is positioned against.
models: modelValue: boolean =false
events: click-outside, update:modelValue(value: boolean)
slots: default

#### Tooltip — overlays, m3:drift
**<m-tooltip>**
props:
- text: string =''
slots: default, content

#### Overlay — overlays, m3:authored
**<m-overlay>**
⚠ emits beforeOpen({stop}), beforeClose({stop}), opened, closed, clickOutside (also via dialog/sheet/drawer)
props:
- …modal-layer props (§4 "Modal-layer props")
- mode: modal|popover ='modal' — `modal` isolates the page (scrim + inert + scroll lock + focus trap).
models: modelValue: boolean =false
events: update:modelValue(value: boolean)
slots: activator{{ open, close, toggle, is-open, props }}, scrim, swipe-banner, default{{ close, is-top, overlay-id }}

#### Card — containment, m3:drift
**<m-card>**
props:
- variant: elevated|filled|outlined ='elevated' — Surface treatment of the card container.
- tag: article|link ='article' — `link` turns the whole card into one Nuxt link with M3 interaction states.
- to: NuxtLinkProps['to'] =undefined — Nuxt route destination when `tag` is `link`.
- disabled: boolean =false — Disables a link card: no destination, out of the Tab order.
- title: string ='' — Plain-text headline; `#title` replaces its text, `#header` the whole header.
- subtitle: string ='' — Plain-text subhead, rendered with or without a title.
- headingLevel: 2|3|4|5|6 =undefined — Renders the title as `h2`–`h6`; left unset, it stays a paragraph.
- mediaAspectRatio: string =undefined — Reserves the media box at this CSS `aspect-ratio` (e.g.
slots: media, header, title, default, actions

#### List — containment, m3:rework
**<m-list>**
⚠ + items, density, surface — see §7 "m-list"
slots: default{{ item: T, index: number } | Record<string, never>}, empty
**<m-list-item>**
props:
- disabled: boolean =false — Prevents interaction and dims every part of the row.
- headline: string =''
- supportingText: string =''
- overline: string =''
- leadingIcon: MIconName =undefined
- trailingIcon: MIconName =undefined
- trailingSupportingText: string =''
- tag: MListItemTag ='div'
- to: NuxtLinkProps['to'] =undefined
- interactive: boolean =false
- selected: boolean =undefined — Selection state.
- lines: 1|2|3|auto ='auto' — `auto` lets the text wrap and the row grow.
- density: compact|default|comfortable =undefined — Vertical scale.
slots: leading, overline, headline, default, supporting, trailing-supporting, trailing
**<m-list-subheader>**
props:
- title: string =undefined — Plain-text label; the default slot takes precedence.
- tag: div|li|p =undefined — Root tag.
- sticky: boolean =false — Pins the label to the block start of the local scroll container (CSS only).
- inset: boolean =false — Aligns the label with item headlines rather than their leading media.
slots: default

#### Divider — containment, m3:drift
**<m-divider>**
props:
- orientation: horizontal|vertical ='horizontal'
- inset: start|center|end =undefined — Which end steps in; absent, the line runs the full length.

#### Expansion panels — containment, m3:authored
**<m-expansion-panels>**
props:
- multiple: boolean =false — Allow multiple panels open at once.
- mandatory: boolean =false — Keep at least one panel open (exclusive mode only).
models: modelValue: PanelValue | PanelValue[] | undefined =undefined
events: update:modelValue(value: PanelValue | PanelValue[] | undefined)
slots: default
**<m-expansion-panel>**
props:
- disabled: boolean =false
- value: PanelValue =undefined — Identity inside `<MExpansionPanels>`; generated when absent.
- title: string ='' — Header text and the panel's accessible name; the `#header` slot replaces it.
- description: string ='' — Second header line under the title; the `#header` slot replaces it.
- headingLevel: 2|3|4|5|6 =undefined — Wraps the header button in `h{n}`, as the APG Accordion pattern asks.
models: modelValue: boolean =false
events: update:modelValue(value: boolean)
slots: header, trailing{{ expanded }}, default

#### Badge — feedback, m3:drift
**<m-badge>**
props:
- value: string | number =undefined — Text or numeric value displayed by the badge.
- max: number =99 — Largest numeric value shown before the badge appends a plus sign.
- dot: boolean =false — Renders a compact status dot without visible label content.
slots: default

#### Progress — feedback, m3:drift
**<m-progress>**
props:
- value: number =0
- indeterminate: boolean =false
- size: small|medium|large ='medium'
- showTrack: boolean =true
- ariaLabel: string ='Progress'
- expressive: boolean =false
- type: linear|circular ='linear'
slots: default
**<m-progress-linear>**
props:
- value: number =0
- indeterminate: boolean =false
- size: small|medium|large ='medium'
- showTrack: boolean =true
- ariaLabel: string ='Progress'
- expressive: boolean =false
slots: default
**<m-progress-circular>**
props:
- value: number =0
- indeterminate: boolean =false
- size: small|medium|large ='medium'
- showTrack: boolean =true
- ariaLabel: string ='Progress'
- expressive: boolean =false
slots: default

#### Loading — feedback, m3:drift
**<m-loading>**
props:
- type: circular|expressive ='circular'
- size: small|medium|large ='medium'
- inline: boolean =false
- ariaLabel: string — Accessible name of the status.
- transition: MorphTransitionInput ='expressive' — Motion of the `expressive` indicator's shape morph.

#### Snackbar — feedback, m3:rework
**<m-snackbar>**
props:
- label: string =''
- actionLabel: string =''
- trapFocus: boolean =false — Rich snackbar: on open focus moves onto the snackbar and Tab cycles inside it until it closes, then focus ret…
models: modelValue: boolean =false
events: action, update:modelValue(value: boolean)
slots: default

#### Alert — feedback, m3:authored
**<m-alert>**
⚠ emits close
props:
- type: info|success|warning|error ='info' — Severity that selects the visual scheme and automatic announcement level.
- variant: tonal|outlined ='tonal' — Surface treatment of the alert container.
- title: string ='' — Plain-text heading; the title slot takes precedence.
- text: string ='' — Plain-text message; the default slot takes precedence.
- icon: MIconName | false =false — Explicit leading icon name; false leaves the icon area empty.
- closable: boolean =false — Renders the dismiss control.
- closeLabel: string ='Close' — Accessible name of the dismiss control.
- announce: auto|polite|assertive|off ='auto' — Live-region behavior; auto is assertive only for errors.
models: modelValue: boolean =true
events: update:modelValue(value: boolean)
slots: icon{{ type, icon }}, title, default, actions{{ type, close }}, close

#### Banner — feedback, m3:authored
**<m-banner>**
props:
- title: string =undefined — Plain-text title; the `title` slot takes precedence.
- text: string =undefined — Plain-text body; the default slot takes precedence.
- icon: MIconName | false =undefined — Leading icon.
- layout: auto|inline|stacked ='auto' — Presentation of the actions row.
- variant: surface|tonal ='surface' — Neutral surface preset.
- closable: boolean =false — Renders the dismiss control.
- closeLabel: string ='Close' — Accessible name of the dismiss control.
- announce: polite|off ='polite' — Live-region politeness.
models: modelValue: boolean =true
events: close, update:modelValue(value: boolean)
slots: icon{{ icon }}, title, default, actions{{ close }}, close

#### Table — data, m3:authored
**<m-table>**
⚠ props/emits missed by the extractor — full API in §7 "m-table"
models: sort: SortState<T> | null =null
events: update:sort(value: SortState<T> | null)
slots: caption, headerSlot(column){{ name, column }}, cellSlot(column){{ name, row, column, value }}, body.message{{ name }}, pagination-info

#### Timeline — data, m3:authored
**<m-timeline>**
props:
- side: start|end|alternate ='end' — Which side content sits on.
- density: compact|default|comfortable ='default' — Vertical rhythm between items.
- line: solid|dashed|none ='solid' — Connector line style.
slots: default
**<m-timeline-item>**
props:
- title: string =undefined — Plain-text title; the `title` slot takes precedence.
- text: string =undefined — Plain-text body; the default slot takes precedence.
- time: string =undefined — Human-readable time; the `opposite` slot takes precedence.
- datetime: string =undefined — Machine-readable timestamp of `time`, rendered as `<time datetime>`.
- icon: string =undefined — Decorative marker icon.
- color: primary|secondary|tertiary|error ='primary' — Colour role of the marker.
- status: string =undefined — Visually hidden word that states the event's outcome to assistive technology (`'Failed'`, `'Done'`), read bef…
- variant: plain|filled|elevated|outlined ='plain' — MD3 surface preset for the content container.
- side: start|end =undefined — Side override; wins over the parent's alternate resolution.
- hideOpposite: boolean =false — Renders no time for this item; the column stays while other items use it.
- hideDot: boolean =false — Hides the marker dot; the line runs on through its place.
- contentTag: div|article ='div' — Content element tag.
slots: opposite, dot, title, default

#### Avatar — data, m3:authored
**<m-avatar>**
props:
- density: compact|default|comfortable ='default' — Box, icon and initials step: 24 / 40 / 56.
- src: string =undefined — Image source.
- alt: string =undefined — Alternative text.
- name: string =undefined — Display name used for derived initials and the accessible label.
- icon: MIconName =undefined — Explicit fallback icon, used when no initials can be derived.
- shape: small|medium|large|full ='full' — MD3 corner shape.
- variant: filled|tonal|outlined ='tonal' — MD3 surface preset.
events: load(value: Event), error(value: Event)
slots: default{MAvatarDefaultSlot}, fallback{MAvatarFallbackSlot}

#### Hotkey — data, m3:authored
**<m-hotkey>**
props:
- hotkey: HotkeyPresentation =undefined — Presentation model returned by `useHotkey` (recommended, behavior-linked).
- keys: HotkeyKey[] =undefined — Static key list for a standalone hint (mutually exclusive with `hotkey`).
- platform: auto|mac|windows|linux ='auto' — Platform for static `keys` mode.
- disabled: boolean =false — Explicitly disable a static `keys` hint (behavioral mode uses `hotkey.isActive`).
- separator: string =undefined — Override the platform-aware separator glyph.
- ariaLabel: string =undefined — Override the generated accessible label.
slots: key{{ token: string, label: string, pressed: boolean, disabled: boolean, index: numb}, separator{{ index: number, platform: ResolvedHotkeyPlatform }}

#### Layout — foundation, m3:drift
**<m-layout>**
props:
- fullHeight: boolean =false
slots: default
**<m-layout-header>**
props:
- sticky: boolean =true — Прибить к верху viewport (строка грида резервирует место)
- sizeToken: string =undefined
- order: number =undefined
slots: default
**<m-layout-aside>**
props:
- position: left|right|start|end ='start' — Логические start/end предпочтительны; left/right — legacy-алиасы
- sizeToken: string =undefined
- sticky: boolean =false — Прижать к viewport (высота между прибитыми краями, скролл внутри)
- order: number =undefined
slots: default
**<m-layout-main>**
props:
- order: number
slots: default
**<m-layout-footer>**
props:
- sticky: boolean =false
- sizeToken: string =undefined
- order: number =undefined
slots: default
**<m-layout-item>**
props:
- id: string
- kind: top|bottom|start|end|main
- area: LayoutArea
- sizeToken: string
- sticky: boolean
- force: boolean
- order: number
slots: default
**<m-container>**
props:
- fluid: boolean — Без ограничения максимальной ширины
- cols: GridSize — Число колонок: база (mobile-first)
- colsMobile: GridSize
- colsTabletXs: GridSize
- colsTablet: GridSize
- colsDesktopXs: GridSize
- colsDesktop: GridSize
slots: default
**<m-row>**
props:
- align: start|center|end|stretch — Вертикальное выравнивание колонок строки
- noGutters: boolean — Убрать гаттеры внутри строки
slots: default
**<m-col>**
props:
- cols: GridSize — Спан: база (mobile-first); дальше переопределения по брейкпоинтам
- mobile: GridSize
- tabletXs: GridSize
- tablet: GridSize
- desktopXs: GridSize
- desktop: GridSize
- offset: GridSize — Смещение в колонках (0 сбрасывает на авто-поток)
- offsetMobile: GridSize
- offsetTabletXs: GridSize
- offsetTablet: GridSize
- offsetDesktopXs: GridSize
- offsetDesktop: GridSize
slots: default
**<m-spacer>**
**<m-responsive>**
props:
- aspectRatio: number | string — Например 16/9, "4/3" или "1"
slots: default
**<m-main>**
slots: default

#### Shape — foundation, m3:parity
**<m-shape>**
props:
- name: M3ShapeName — Shape from the M3 Expressive library; a change morphs to it.
- sequence: readonly M3ShapeName[] =undefined — Ordered shapes this instance cycles through; their adjacent pairs are built once and shared.
- transition: MorphTransitionInput ='expressive' — How each morph moves: a transition name or partial options.
- duration: number =undefined — Override of the transition's own duration, in milliseconds.
- label: string =undefined — Accessible name; when set the shape is announced as an image, otherwise it is hidden as decoration.

#### Icon — foundation, m3:drift
**<m-icon>**
props:
- name: MIconName — Glyph: an `ICONS` key (`home`), a bare `ic` name (`round-close`) or a prefixed Iconify name (`mdi:account`).
- filled: boolean =false — Draws the filled pair of an `ic` outline glyph (`outline-home` → `baseline-home`); other names are drawn as g…
- label: string =undefined — Accessible name: with it the icon is an image for assistive tech, without it the icon is decorative and hidde…

#### System bar — foundation, m3:authored
**<m-system-bar>**
props:
- sticky: boolean =true — Pins the bar to the top of the viewport when it is a zone of `<m-layout>`.
slots: prepend, default, append

#### Surface — foundation, m3:authored
**<m-surface>**
props:
- tag: string ='div' — Root element tag.
- variant: plain|filled|elevated|outlined ='plain' — MD3 surface preset.
- shape: none|extra-small|small|medium|large|extra-large|extra-large-top|full ='none' — MD3 system corner shape token.
slots: default

#### App — foundation, m3:authored
**<m-app>**
props:
- tag: string ='div' — Root element tag; the boundary adds no landmark role of its own.
- skipLinkLabel: string =undefined — Text of the "skip to content" link, the first Tab stop of the page; without it the link is not rendered.
- skipLinkTarget: string ='main' — Id of the element the skip link moves to, e.g.
slots: default, loading{{ progress, is-loading }}

#### Lazy — foundation, m3:authored
**<m-lazy>**
⚠ emits activate, visible, pending, resolve, error
props:
- mode: eager|on-idle|on-view|on-interaction ='on-view' — When the content is activated: at once, when the browser is idle, near the viewport, or on interaction.
- once: boolean =true — Keep the content once activated; `false` releases it again when it leaves the viewport in `on-view` mode.
- timeout: number =2000 — Longest wait for an idle moment in `on-idle` mode, ms.
- rootMargin: string ='200px 0px' — Margin around the viewport that already counts as visible in `on-view` mode.
- threshold: number | number[] =0 — Visible share of the boundary that activates it in `on-view` mode.
- interactions: MLazyInteraction[] =() => ['pointerenter', 'focus', 'click'] — Events that activate the content in `on-interaction` mode; Enter and Space on the boundary always do.
- minWidth: string | number =undefined — Width reserved before and during activation; a number is in rem.
- minHeight: string | number =undefined — Height reserved before and during activation; a number is in rem.
- transition: boolean =true — Fade the content, the fallback and the error in when they appear after activation.
- disabled: boolean =false — Render the content at once, whatever the mode.
- fallbackDelay: number =200 — Wait before the #fallback slot replaces the placeholder while the content loads, ms.
- errorText: string =undefined — Message announced when the content fails and there is no #error slot.
- retryLabel: string =undefined — Name of the retry button shown when the content fails and there is no #error slot.
models: active: boolean | undefined =undefined
events: update:active(value: boolean | undefined)
slots: placeholder, fallback, error{{ error }}, default

## §7 API details, item types, recipes

#### m-table (`components/ui/table/index.vue`, types in `table/types.ts`)
Generic `<script setup generic="T extends TableData">`, `TableData = { id: string|number }` (row key = `row.id`). Props (all missing from §6):
- columns: TableColumn<T>[] (required) — column definitions, order = render order
- data: T[] (required) — rows of the CURRENT page only
- caption?: string — visible caption, names the table
- density: compact|default|comfortable = 'default' — row 40/52/64
- selectable: boolean = false — adds checkbox column
- selectedRows: T[] = [] — `v-model:selected-rows`, survives paging (matched by `id`)
- selectAllLabel?: string — a11y name of select-all checkbox (no default copy)
- loading: boolean = false — no rows: spinner row; with rows: overlay spinner, pager disabled
- error: boolean|string = false — error row (string shown+announced)
- statusText?: string — polite live-region text (sort/page changes)
- pagination: boolean = false — renders footer pager
- pageSize: number = 10 — `v-model:page-size`
- pageSizeOptions?: number[] — shows native page-size `<select>` when non-empty
- totalItems: number = 0 — total rows across pages (drives page count)
- currentPage: number = 1 — `v-model:current-page`
- pageSizeLabel?, previousPageLabel?, nextPageLabel?: string — footer wording (none shipped)
- onRowClick?: (row, event) — binding `@row-click` makes rows interactive (hover)
- Model: `v-model:sort` → `SortState<T> | null` (default null).
- Emits: `update:selectedRows(rows)`, `update:currentPage(n)`, `update:pageSize(n)`, `row-click(row, MouseEvent)`, `retry`, `update:sort(state)`.
- NO client-side sorting/paging: the table renders `data` as given and only emits sort/page changes; app sorts+slices (or fetches). Sort cycle on a sortable header click: none → asc → desc → null (`utils/table/model.ts nextTableSort`).
- Select-all acts on the current page only; table never prunes `selectedRows` itself.
- Name the table with `caption` or `aria-label`/`aria-labelledby` attrs (attrs go to `<table>`; dev warning otherwise).
- Slots (exact names — dash, not dot):
  - `#cell-<key>="{ row, column, value }"` e.g. `#cell-amount`; default = `column.format?.(value,row) ?? value`
  - `#header-<key>="{ column }"` e.g. `#header-amount`; default = `column.label`
  - `#caption`, `#loading`, `#empty`, `#error="{ error, retry }"`, `#pagination-info="{ start, end, total, page, pageCount, pageSize }"` (range text, empty if not given)
```ts
interface TableColumn<T> {
  key: keyof T; label: string
  width?: string; minWidth?: string
  sortable?: boolean
  align?: 'start'|'center'|'end'   // numeric columns default 'end'
  numeric?: boolean                // tabular digits, end-aligned, nowrap
  format?: (value: T[keyof T], row: T) => string
}
type SortDirection = 'asc'|'desc'|null
interface SortState<T> { key: keyof T | null; direction: SortDirection }
interface MTablePageRange { start: number; end: number; total: number; page: number; pageCount: number; pageSize: number }
```
```vue
<m-table :columns="cols" :data="pageRows" aria-label="Orders" selectable select-all-label="Select all"
  v-model:selected-rows="sel" v-model:sort="sort" pagination :total-items="total"
  v-model:current-page="page" v-model:page-size="size" :page-size-options="[10,25]"
  previous-page-label="Previous" next-page-label="Next" @row-click="open">
  <template #cell-status="{ value }"><m-chip>{{ value }}</m-chip></template>
  <template #pagination-info="{ start, end, total }">{{ start }}–{{ end }} of {{ total }}</template>
</m-table>
```

#### m-list (`components/ui/list/index.vue`, `list/types.ts`)
Generic `T extends { id: string|number }`. Props (missing from §6):
- items?: T[] — when set, default slot called per item `{ item, index }`; `[]` renders `#empty`
- density: compact|default|comfortable = 'default' — inherited by rows without own density
- surface: MListSurface = 'surface' — colour role under list; only sticky subheader uses it
- `MListSurface = 'surface'|'surface-container-lowest'|'surface-container-low'|'surface-container'|'surface-container-high'|'surface-container-highest'`
- Root is `<ul>`; a non-interactive `<m-list-item>` renders as `<li>`, interactive ones get wrapped in `<li>` automatically. Passing a `role` attr (e.g. `listbox`) switches root to `<div>`.
- No `tag` prop on m-list. Row rendering is always the consumer's: `<m-list :items="xs"><template #default="{ item }"><m-list-item :headline="item.name" /></template></m-list>`.
- m-list-item interactivity: `interactive` | `tag="button"` | `tag="a"` | `to` (→ NuxtLink). `selected` boolean → aria-current (link) / aria-pressed (button). `lines` 1|2|3 clamps with title tooltip.

#### m-chip (`components/ui/chip/props.ts`)
- disabled: boolean = false — MISSED by extractor
- type: assist|filter|input|suggestion = 'assist'; value: unknown (joins `<m-chip-group>` only when set)
- NO `label`, `closable`, `elevated`, `icon` props. Label = default slot; leading icon = `#icon`; trailing (e.g. close glyph) = `#trailing` — rendered INSIDE the chip `<button>` (a nested button would be invalid; listen to chip `@click` instead).
- Standalone: only `type="filter"` toggles its boolean `v-model` on click; other types just a native click. In a group: `aria-pressed`, roving arrows, `max` blocks via aria-disabled.

#### m-button-fab (`button/fab/props.ts`) — all missed except ariaLabel
- color: primary|secondary|tertiary|error = 'primary'
- variant: tonal|filled = 'tonal' — tonal = role container (M3 default)
- density: compact|default|comfortable = 'default' — size 40 / 56 / 96
- disabled = false; loading = false — loading shows inline MLoading, keeps focus
- ariaLabel: string — required (dev warning)
- Always a `<button>` (no `tag`/`to`). Icon goes in default slot.

#### m-button-extended-fab (`button/extended-fab/props.ts`)
- color, variant(tonal|filled='tonal'), density, disabled, loading — same as FAB (missed)
- expanded: boolean = true — false folds to icon; needs `#prepend` icon (dev warning); label stays accessible name
- Slots: `#prepend` icon, default = label.

#### m-tooltip (`tooltip/props.ts`)
- Only prop: text: string = ''. NO placement, NO delay props.
- Placement fixed `top` (CSS anchor positioning w/ position-try fallbacks, JS flip fallback), offset 8; no show delay; hide delay 100ms (hoverable); Esc hides.
- Wraps its trigger: `<m-tooltip text="Save"><m-button-icon aria-label="Save">…</m-button-icon></m-tooltip>`. `#content` replaces text. Shows on mouseenter/focusin. Sets `aria-describedby` on trigger wrapper span.

#### m-menu (`menu/index.vue`)
- NO activator slot. The menu anchors to its **DOM parent element** (or `anchor` prop element). Put `<m-menu>` next to the trigger inside a common wrapper and drive `v-model` yourself; the parent (trigger wrapper) is ignored for click-outside so re-click toggles.
- Props as §6: closeOnBackdrop=true, absolute=false (absolute = no invisible backdrop), origin (corner of the trigger), matchWidth, lockScroll=true, anchor.
- Items: consumer markup — plain `<button type="button" class="ui-menu__item">` with optional `<span class="ui-menu__item-label">` / `ui-menu__item-shortcut`. Menu promotes buttons/`[role=menuitem]` to `role="menuitem"`, roving focus (arrows/Home/End), Esc closes + refocuses trigger. Item click does NOT auto-close — set v-model false in the handler. m-list/m-list-item are not the menu item pattern (?: they would be promoted only if rendered as `<button>`).
- Emits `click-outside`. Teleported client-only into overlay host, top layer via Popover API.
```vue
<span class="anchor">
  <m-button-icon aria-label="More" aria-haspopup="menu" :aria-expanded="String(open)" @click="open = !open"><m-icon name="round-more-vert" /></m-button-icon>
  <m-menu v-model="open" absolute origin="top right">
    <button type="button" class="ui-menu__item" @click="rename(); open = false"><span class="ui-menu__item-label">Rename</span></button>
  </m-menu>
</span>
```

#### m-navigation-bar / m-navigation-rail
- Props complete in §6 (bar: items, ariaLabel='Primary'; rail: + expanded=false). v-model = selected item `id` (string|null).
- Items render as `<button>`s with `aria-current="page"`; NO `to`/link support, NO slots — navigate by watching v-model (or `@update:model-value`).
- `badge` > 0 renders an `<m-badge>` over the icon.
- Self-register into `<m-layout>`: bar → bottom zone (sticky), rail → start zone (width token switches with `expanded`).
- Roving focus with arrow keys.

#### m-snackbar (`snackbar/props.ts`)
- Props complete (label, actionLabel, trapFocus). v-model controls visibility.
- NO timeout/auto-hide, NO position prop, NO queue/service — app owns timing (e.g. `useTimeoutFn`) and stacking. Fixed bottom-centre (`position: fixed; inset-inline: 0; bottom: token`).
- Action button shown when `actionLabel` set; click emits `action` and closes. Default slot replaces label. `role="status"` polite.

#### m-badge
- Does NOT wrap/attach to a child: renders a standalone `<span class="ui-badge">` (`role=status`). Positioning is the consumer's job (e.g. wrapper `position:relative` + badge absolutely placed — nav bar does this).
- `dot` → small dot, no text. Non-dot: number > max → `"99+"`; non-numeric string shown as-is; default slot overrides label text. Empty value + !dot renders an empty large pill (?).

#### m-dialog (`dialog/index.vue`)
- Props: title + all modal-layer props (§6 correct). Rendered via `<MOverlay mode="modal">`; headline `<h2>` names it (no title → aria-label "Dialog").
- Slots: `#icon`, default (body), `#actions` (plain flex container — put `<m-button variant="text">` there).
- `cancel`/`confirm(data?)` are DECLARED but never emitted by MDialog itself; buttons in `#actions` must close via `v-model=false`. The emits matter for programmatic modals: `useModal({ component, attrs, slots })` → `await modal.open()` resolves `confirm` payload (or true) / `cancel` → false / other close → null — so a wrapper component that emits `confirm`/`cancel` is needed (`composables/modal/useModal.ts`).
- Fall-through overlay events: `beforeOpen({stop})`, `beforeClose({stop})`, `opened`, `closed`, `clickOutside`. Exposes `{ id, close() }`. Registry: `useNuxtApp().$material.modal.open(id)/close(id)/closeAll()`.

#### m-sheet (`sheet/props.ts`)
- Bottom sheet only (aligned to bottom of the centred overlay panel, max-width token, drag handle drawn). No side prop — side sheet ≈ `<m-navigation-drawer side="left|right">`.
- Always `mode="modal"`; `closeOnSwipe` default 'down'. For a non-blocking ("standard") sheet use `background="interactive"` (+ `hide-overlay`) (?: still overlay-layer, not in-flow).
- Same declared-but-not-emitted `cancel`/`confirm` as dialog. Default slot only.

#### m-tabs
- NO variant (primary/secondary) prop. Props: items?: MTabItem[]. v-model: TabValue|null (`string|number`). Mandatory 'force': first enabled tab auto-selected.
- Slots: `#tabs` (put `<m-tabs-tab>`s), `#panels` (put `<m-tabs-panel :value>`s), default `{ value }` (single tabpanel wrapper). Arrow/Home/End = automatic activation.
- `<m-tabs-tab>`: value (req), label?, icon?, disabled=false, to? (NuxtLink).

#### m-card (`card/props.ts`)
- Props complete in §6. Interactive only via `tag="link"` + `to` (whole card = one NuxtLink, state layers); `disabled` removes destination. No `clickable`/button card, no `@click` affordance. `#actions` not allowed in a link card (dev warning). `mediaAspectRatio` e.g. `'16 / 9'`.

#### m-progress (`progress/props.ts`)
- Props complete. value 0..100 (clamped). `type` linear|circular on `<m-progress>`; leaves `<m-progress-linear>` / `<m-progress-circular>` take the same props minus type. size small|medium|large. `expressive` = wavy M3 Expressive style.

#### m-search (`search/props.ts`)
- Props complete; EMITS MISSED: `submit(query: string)` on Enter (IME-safe), `clear()` (clear button or Esc with a query).
- NO results view/menu/suggestions — it is only the bar (leading glyph, input `type=search`, clear button, `#trailing`, `#avatar`). Build results yourself (e.g. `<m-menu>`/list below). `ariaLabel` + `clearLabel` needed (dev warnings). Attrs land on the `<input>`.

#### m-form-renderer (`form-renderer/index.vue`, `composables/useFormSchema.ts`)
- Props: config: FormFieldConfig[] (required, read once at setup — not reactive), onSubmit?(values).
- Requires an installed ValidationAdapter (throws otherwise). Fields bind by `path = field.name`.
- Default slot `{ pending, isError }` replaces the actions row; default is `<m-button type="submit">Submit</m-button>` (hard-coded English).
- Quirk: `type: 'textarea'` renders `<m-text-field>`, not `<m-textarea>` (fragments/form-renderer/field/index.vue). `radio` → `<fieldset>` + `<m-radio>` per option.
```ts
type FormFieldType = 'text'|'textarea'|'number'|'checkbox'|'switch'|'radio'|'search'
interface FormFieldConfig {
  type: FormFieldType; name: string; label?: string; placeholder?: string
  rules?: FieldRules
  options?: { label: string; value: string|number }[]  // radio
  default?: unknown                                   // else ''/null/false/undefined by type
  props?: Record<string, unknown>                     // v-bind onto the input
}
interface FieldRules { required?: boolean|string; min?: number; max?: number; email?: boolean; pattern?: string /* regex source */ }
// useFormSchema(config, { onSubmit }) → { form: { submit, pending: Ref<boolean>, isError: Ref<boolean>, values, reset }, fields }
```

#### Item / config interfaces
```ts
// composables/button/useSegmentedButton.ts — shared by segmented + button group
interface SegmentedItem /* = MSegmentedItem = MButtonGroupItem */ {
  value: string|number; label?: string
  icon?: string          // alone → icon-only, needs ariaLabel
  ariaLabel?: string; disabled?: boolean
}
type SegmentedValue /* MSegmentedModelValue, MButtonGroupModelValue */ = string|number|(string|number)[]

// fab-menu/props.ts
interface MFabMenuItem { label: string; icon?: MIconName; value?: string|number; action?: () => void; disabled?: boolean }

// toolbar/props.ts
interface MToolbarItem {
  id: string                // also the model value
  icon?: string; label?: string   // icon only → MButtonIcon, else MButton
  selected?: boolean        // used only when no v-model
  disabled?: boolean
  component?: unknown       // custom component; gets { selected, disabled, ...rest }
  [key: string]: unknown    // rest is v-bound (buttons: variant text→tonal when selected)
}
type ToolbarModel = string|number|(string|number)[]|null|undefined  // `select(item)` emitted only WITHOUT v-model

// breadcrumbs/props.ts
interface MBreadcrumbItem { id?: PropertyKey; title: string; to?: NuxtLinkProps['to']; disabled?: boolean; current?: boolean }

// navigation-bar/props.ts, navigation-rail/props.ts (identical)
interface MNavigationBarItem { id: string; icon: MIconName; label: string; badge?: number }
interface MNavigationRailItem { id: string; icon: MIconName; label: string; badge?: number }

// tabs/props.ts
interface MTabItem { value: string|number; label: string; icon?: MIconName; disabled?: boolean; to?: NuxtLinkProps['to'] }

// composables/dropdown/types.ts — dropdown + autocomplete
interface DropdownItemBase { id: PropertyKey }   // only required field; identity + v-for key
type DropdownRuntimeResolver<R> = string /* item key */ | ((item, index: number) => R)
type DropdownValueComparator = (left, right) => boolean
```
- Resolvers (`utils/dropdown/useDropdownEntries.ts`): string → `item[key]`, function → `fn(item, index)`.
  - `itemTitle` default `'label'`; unresolved → `String(item.id)` + dev warning.
  - `itemValue` default undefined → **model holds the whole item object**; set `item-value="id"` to store ids.
  - `itemDisabled` default `'disabled'`. `valueComparator` default `===`.
- Item slot scope `#item="{ item, index, value, title, selected, disabled, blocked, active }"`; `#chip="{ item, value, title, index, remove }"`.
```ts
type MNumberInputUnit = string | { value: string; label?: string }      // number-input/props.ts
type ColorSwatch = string | { value: string; label: string }            // shared/utils/color
interface MDropdownMessages { clear?; toggle?; loading?; empty?; noResults? }   // all string, no defaults
interface MFileUploadMessages {
  drop?; choose?; queue?; empty?; startAll?; start?; cancel?; retry?; remove?: string
  status?: Partial<Record<'queued'|'uploading'|'success'|'error'|'cancelled', string>>
  reject?: Partial<Record<'type'|'size'|'count', string>>   // = MFileRejectMessages
  error?: (error: unknown) => string|undefined
  size?: (bytes: number) => string
}
// composables/file-upload/useFileUploadQueue.ts
type FileUploadStatus = 'queued'|'uploading'|'success'|'error'|'cancelled'
interface FileUploadTaskContext { signal: AbortSignal; reportProgress: (progress: number /*0..100*/) => void }
interface FileUploadEntry<R = unknown> { id: string; file: File; status: FileUploadStatus; progress: number|null; result?: R; error?: unknown }
function useFileUploadQueue<R>(options: {
  upload?: (file: File, ctx: FileUploadTaskContext) => Promise<R>
  concurrency: () => number
  onStart?/onProgress?/onSuccess?/onError?/onCancel?: (entry: FileUploadEntry<R>) => void
  onComplete?: () => void
}): FileUploadQueue<R>
interface FileUploadQueue<R> {
  entries: Readonly<Ref<readonly FileUploadEntry<R>[]>>; canUpload: boolean
  add(files: readonly File[]): FileUploadEntry<R>[]; start(id?: string): void
  cancel(id: string): void; retry(id: string): void; remove(id: string): void
  subscribe(listener: (event: 'start'|'progress'|'success'|'error'|'cancel'|'complete', entry?) => void): () => void
}
// icon/props.ts
type MIconStyle = 'baseline'|'outline'|'round'|'sharp'|'twotone'
type MIconName = keyof typeof ICONS | (typeof ICONS)[keyof typeof ICONS] | `${MIconStyle}-${string}` | `${string}:${string}`
type GridSize = number | string        // local (non-exported) type in col/ and container/
type LayoutArea = 'header'|'left'|'main'|'right'|'footer'|string   // composables/useLayout.ts
```
- Icon resolution (`composables/icon/iconName.ts`): ICONS key → its value; contains `:` → as is (Iconify `collection:name`); else prefixed `ic:` (so `round-close` → `ic:round-close`). `filled` swaps `ic:outline-*` → `ic:baseline-*`. Kebab-case only.
- `ICONS` (`shared/constants/icons.ts`, all `ic:outline-*`): accessTime chevronLeft chevronRight arrowUpward arrowDownward search close keyboardArrowDown keyboardArrowUp add remove error arrowDropDown arrowDropUp check menu home explore settings info palette code article dashboard widgets lightMode darkMode notifications accountCircle videoLibrary subscriptions history playCircle trendingUp whatshot sportsSoccer musicNote movie videogameAsset storefront people chat download star shoppingCart localOffer language email phone place rocketLaunch speed security cloud edit event person visibility visibilityOff attachFile uploadFile insertDriveFile upload refresh stop checkCircle schedule calendarToday keyboard.
- `M3ShapeName = keyof typeof M3_SHAPES` in `assets/icon/shapes.ts` (35 names): 12SidedCookie 4LeafClover 4SidedCookie 6SidedCookie 7SidedCookie 8LeafClover 9SidedCookie arch arrow boom bun burst circle diamond fan flower gem ghostIsh heart hexagon oval pentagon pill pixelCircle pixelTriangle puffyDiamond puffy semicircle slanted softBoom softBurst square sunny triangle verySunny.

## §8 Services: `$material`, modals, snackbar

```ts
const { $material } = useNuxtApp()
$material.theme        // = useMaterialTheme()
$material.breakpoints  // { breakpoints (px map), is, more, less } (computed refs)
$material.overlays     // StackContext: activation order, top modal, fallback z-index
$material.modal        // ModalService
```
No snackbar/toast or i18n service.

`useBreakpoint()` → `{ is, more, less }` ComputedRefs of camelCased flags (`mobileXs mobile
tabletXs tablet desktopXs desktop` + custom). `is`: `prev < w <= value`; `more`/`less` strict.
Script `is.value.mobile`, template `is.mobile`. SSR width from `@nuxtjs/device` (393/992/1920).

**ModalService**: `modals`, `openedModals`, `openedModalOverlays`, `dynamicModals`, `get(id)`,
`open(id)`, `close(id)`, `toggle(id, show?)`, `closeAll()` — every modal-mode overlay + every
`useModal` handle is registered (`await $material.modal.closeAll()` before navigating).

**Declarative dialog** (default choice):
```vue
<m-dialog v-model="open" title="Discard draft?" @before-close="e => dirty && e.stop()">
  The text will be gone.
  <template #actions>
    <m-button variant="text" @click="open = false">Keep editing</m-button>
    <m-button @click="discard">Discard</m-button>
  </template>
</m-dialog>
```
`MDialog`: `title` (else named "Dialog"), slots default/`#actions`/`#icon`; modal-layer props
`closeOnOutside`/`closeOnEscape` (true), `closeOnSwipe` ('none'), `persistent`, `background`
('non-interactive'|'interactive'), `trapFocus`, `lockScroll`, `reserveScrollBarGap`,
`displayDirective` ('if'|'show'), `hideOverlay`, `overlayBehavior` ('auto'|'persist'),
`overlayClass`, `contentClass`, transitions. Events `before-open`/`before-close` (`{ stop() }`,
sync), `opened`, `closed`, `click-outside`. No height cap/scroll body — wrap long content.
Same props on `MSheet`, `MNavigationDrawer`, `MDialogDate`. Overlays render client-only on the top layer.

**Programmatic `useModal()`** — `MDialog` declares `confirm`/`cancel` but never emits them; write a wrapper:
```vue
<!-- app/components/ConfirmDialog.vue -->
<template>
  <m-dialog v-model="open" :title="title">
    {{ message }}
    <template #actions>
      <m-button variant="text" @click="emit('cancel')">Cancel</m-button>
      <m-button @click="emit('confirm', { at: Date.now() })">{{ confirmLabel }}</m-button>
    </template>
  </m-dialog>
</template>

<script setup lang="ts">
defineProps<{ title: string, message: string, confirmLabel: string }>()
const emit = defineEmits<{ (e: 'confirm', payload?: unknown): void, (e: 'cancel'): void }>()
const open = defineModel<boolean>({ default: false })
</script>
```
```ts
import ConfirmDialog from '~/components/ConfirmDialog.vue'

const modal = useModal({
  component: ConfirmDialog,
  attrs: { title: 'Archive 3 projects?', message: 'History stays.', confirmLabel: 'Archive' },
  // slots: { default: 'text' | Component | useModalSlot({ component, attrs }) }, keepAlive, defaultModelValue
})
const answer = await modal.open()   // confirm payload (or true) | false on cancel | null on Esc/scrim/close()
modal.patchOptions({ attrs: { title: 'Archive 4?' } })   // merged
await modal.close(); modal.destroy(); modal.status.value  // 'opening'|'open'|'closing'|'closed'
```
Handle drives `modelValue`; your `onConfirm`/`onCancel`/`onOpened`/`onClosed` in `attrs` run
first; other attrs → props. Call in `setup`. Created inside an open modal → child (parent close
closes it first).

**Snackbar** — declarative only, **no queue, no timer**: `<m-snackbar v-model label action-label
trap-focus @action>` (default slot overrides `label`; action emits `action` and closes; polite
`role="status"`). Auto-hide with `useTimer` (`{ start, stop, pause, resume, remaining, isActive,
isPaused }`, options `{ duration, repeat }`):
```ts
const undoOpen = ref(false)
const timer = useTimer(() => { undoOpen.value = false }, { duration: 5000 })
function onDelete() { undoOpen.value = true; timer.start() }
function undo() { timer.stop(); restore() }
// <m-snackbar v-model="undoOpen" label="Draft discarded" action-label="Undo" @action="undo" />
```
App-wide toast = your own pattern (e.g. `useState('toast')` + one `<m-snackbar>` in `app.vue`).

## §9 Forms and validation

**Controlled (no engine)** — fields are plain `v-model`. `MTextField` props: `label`,
`placeholder`, `helperText`, `error` (force state), `errorMessage` (replaces helper, sets
`aria-invalid`), `required` (asterisk), `disabled`, `readonly`, `variant`
(`filled|outlined|underline`), `labelPlacement` (`float|top|inset|hidden`), `density`
(`compact|default|comfortable`), `shape`, `type` (`text|email|password|tel|url|search`),
`prefix`, `suffix`, `autocomplete`, `name`, `inputAttrs`, `path`. Slots `prepend`, `append`,
`leading-content`, `#error`/`#helper` `{ message }`. `@blur`, `autocomplete` etc. land on the `<input>`.
```vue
<m-text-field v-model="email" label="Email" type="email" helper-text="For the receipt"
  :error-message="touched && !valid ? 'Enter an email like name@example.com' : undefined" @blur="touched = true" />
```

**Adapter** → enables `path` autopilot + declarative forms. `provideValidationAdapter` is Vue
`provide`: reaches components *below* the caller, not the caller's own `inject`. Put it in
`app.vue`/layout/form parent (or the form component itself if only its template children use
`path`). `useFormSchema` must run strictly below it (else throws).
```ts
// app/app.vue <script setup>  (provideValidationAdapter is auto-imported)
import { veeValidateAdapter } from '#kit/adapters/vee-validate'   // published: '@pr0s1k/primetime-kit/validation'
provideValidationAdapter(veeValidateAdapter())
```

**Login form — `useFormBuilder` + `path`.** `useFormBuilder` wraps vee-validate `useForm`: initial
values from the yup schema by type (`''`, `null`, `false`, `[]`, `{}`), `pending`/`isError`, rest of
the form context (`errors`, `values`, `resetForm`, `setFieldError`, …). A throwing `onSubmit` calls
`onError` (if any) and is **rethrown**, so `submit()` rejects.
```vue
<!-- app/components/LoginForm.vue -->
<template>
  <form class="login-form" novalidate @submit.prevent="login">
    <m-text-field path="email" label="Email" type="email" autocomplete="email" required />
    <m-text-field path="password" label="Password" type="password" autocomplete="current-password" required />
    <m-checkbox path="remember" label="Keep me signed in" />
    <p v-if="isError" class="login-form__error" role="alert">Wrong email or password</p>
    <m-button type="submit" :loading="pending">Sign in</m-button>
  </form>
</template>

<script setup lang="ts">
import * as yup from 'yup'
import { useFormBuilder } from '#kit/adapters/vee-validate'   // published: '@pr0s1k/primetime-kit/validation'

// Adapter provided by app.vue (an ancestor) → the `path` fields bind to this form.
const { submit, pending, isError } = useFormBuilder({
  validationSchema: yup.object({
    email: yup.string().required('Enter your email').email('Enter an email like name@example.com'),
    password: yup.string().required('Enter your password'),
    remember: yup.boolean(),
  }),
  onSubmit: async (values) => {
    await $fetch('/api/login', { method: 'POST', body: values })
    await navigateTo('/')
  },
})

// onSubmit failures already set isError; swallow the expected rethrow.
const login = (event: Event) => submit(event).catch(() => {})
</script>

<style lang="scss">
.login-form {
  display: grid;
  gap: spacing(16);
  max-width: 400rem;

  &__error {
    margin: 0;
    color: var(--md-sys-color-error);

    @include typescale(body-medium);
  }
}
</style>
```
- `path` fields: no `v-model` (two-way synced), validate on each change, `path` read once (re-`key` to change).
- Messages render in the support line of `MTextField MTextarea MNumberInput MDropdown MAutocomplete
  MFileInput MColorInput MOtpInput`; `MCheckbox MSwitch MRadio MRadioGroup` only get `aria-invalid`
  → render `errors.<path>` yourself. `MDatePicker`/`MTimePicker` have no `path` → `useField`.
- Keep `novalidate` (browser bubbles pre-empt messages); `required` still draws the asterisk.
- Also exported: `InferFormValues<typeof schema>`, `defineFormBuilder`, `buildYupSchema`, types.

**`useField({ path, model, validateOnValueUpdate = true })`** → `{ errorMessage, hasError, meta }`;
inert without `path` or adapter. For pickers and your own inputs:
```ts
const delivery = ref<string | null>(null)
const { errorMessage } = useField({ path: 'delivery', model: delivery })
// <m-date-picker v-model="delivery" :error-message="errorMessage" />
```

**`<m-form-renderer :config :on-submit>`** (uses `useFormSchema`; config/onSubmit read once):
```vue
<m-form-renderer :config="FIELDS" :on-submit="send" aria-label="Feedback" novalidate>
  <template #default="{ pending }">  <!-- replaces the English "Submit" button; also { isError } -->
    <m-button type="submit" :loading="pending">Send</m-button>
  </template>
</m-form-renderer>
```
```ts
import type { FormFieldConfig } from '#kit/composables/useFormSchema'
const FIELDS: FormFieldConfig[] = [
  { type: 'text', name: 'email', label: 'Email', rules: { required: 'Enter your email', email: true }, props: { type: 'email' } },
  { type: 'radio', name: 'topic', label: 'Topic', options: [{ label: 'Bug', value: 'bug' }, { label: 'Idea', value: 'idea' }], default: 'idea', props: { name: 'topic' } },
  { type: 'switch', name: 'reply', label: 'Reply to me', default: true },
]
async function send(values: Record<string, unknown>) { await $fetch('/api/feedback', { method: 'POST', body: values }) }
```
Types: `text|search|textarea` → `MTextField` (textarea is single-line; search needs
`props: { type: 'search' }`), `number` → `MNumberInput` (`null`; optional number fails yup unless
`default`/`required`), `checkbox|switch`, `radio` (fieldset + `MRadio`s; pass `props: { name }`).
Keys: `type name label placeholder rules options default props`. `rules`: `required`
(true|message), `min`, `max`, `email`, `pattern`; only `required` takes a custom message.
`useFormSchema(config, { onSubmit })` → `{ form: { submit, pending, isError, values, reset }, fields }`
for a custom layout (`form.pending.value` in templates). Custom engine: implement
`ValidationAdapter { bindField(path, opts) → { value, errorMessage, meta }; createForm(config) → FormBinding }`.

## §10 Icons and copy (i18n)

Props `name` (required), `filled` (`ic:outline-x` → `ic:baseline-x` only), `label` (→ `role="img"`;
without it `aria-hidden`). Renders @nuxt/icon `<Icon>` in `<span class="ui-icon">`; `1em`,
`currentColor` → size/color via `font-size`/`color` on it or the parent.

Resolution: (1) an `ICONS` key (camelCase, auto-imported; all map to `ic:outline-*`), e.g. `home`
`search` `close` `add` `check` `menu` `settings` `edit` `person` `email` `visibility`
`visibilityOff` `chevronLeft` `chevronRight` `keyboardArrowDown` `lightMode` `darkMode`
`notifications` `refresh` `upload` `download` `calendarToday` `schedule` … (~70, see
`shared/constants/icons.ts`); (2) contains `:` → as is (`ic:round-add`, `mdi:account`); (3) else
prefixed `ic:` (`round-close` → `ic:round-close`; so `mdi-home` → broken `ic:mdi-home`). Dev warns on
bad names. ic styles: `baseline` (filled) `outline` `round` `sharp` `twotone`; glyph = Material
Icons kebab name. Kit glyphs use `outline` — pick one style per app.

Installed: **only `@iconify-json/ic`**; module sets `@nuxt/icon` to `{ provider: 'server',
serverBundle: { collections: ['ic'] } }`. `mdi:` etc. without `@iconify-json/mdi`: @nuxt/icon
`fallbackToApi` defaults to `true` → fetched from the public Iconify API at runtime (not bundled,
network-dependent). To bundle: `npm i -D @iconify-json/mdi` + `icon: { serverBundle: { collections:
['ic', 'mdi'] } }` in nuxt.config (keep `ic` listed; merge semantics with module defaults (?)).
Icon-only buttons need a name: `<m-button-icon aria-label="Delete"><m-icon name="ic:round-delete" /></m-button-icon>`.
Text buttons take icons in `#prepend` / `#append`.

### Copy / `MESSAGES`

No kit locale, **no global message override**. `MESSAGES` (`shared/constants/messages.ts`,
auto-imported, `as const`) only feeds English **prop defaults**: `MTextarea` `resize-label`;
`MNumberInput` `increment-label`/`decrement-label`/`unit-label`; `MDatePicker`/`MDialogDate`
`label`, `input-title`, `prev-/next-month-label`, `switch-to-year|day|input|calendar-label`,
`input-label`, `error-pattern`, `error-range`, `cancel-label`, `confirm-label`, placeholder
(`MM/DD/YYYY` pattern); `MTimePicker` `aria-label`, `hour-/minute-/period-label`, `hour-/minute-error`;
hotkey key names. Mutating `MESSAGES` is not a supported override.
- Localize by props; wrap once (`AppDatePicker.vue` binding `useI18n().t(...)` to each label +
  `:locale`) and use the wrapper; attrs/v-model fall through.
- Components with **no** default copy (dev warning): `MDropdown`/`MAutocomplete` `messages`
  (`clear toggle loading empty noResults`), `MFileUpload` `messages`, `MFileInput`
  (`browse-label`, `clear-label`, …), `MColorPicker`/`MColorInput`, `MSearch` (`aria-label`,
  `clear-label`), `MTable` (`select-all-label`, `page-size-label`, `previous-/next-page-label`,
  `status-text`), `MTimePicker` toggle labels, `MLoading`, `MOtpInput`, `MButtonIcon`/`MButtonFab` `aria-label`.
- Other English fallbacks: `MAlert`/`MBanner` `close-label`, `MNavigationRail`/`Bar` ("Primary"),
  `MBreadcrumbs`, `MPagination`, `MProgress` ("Progress"), `MRating`, `MDialog` w/o title,
  `MFormRenderer` "Submit"; yup English for non-`required` rules.
- Only provide-based override: `provideHotkeyLabels({ control: 'Ctrl', shift: 'Shift', disabled: '…' })`
  (keys of `MESSAGES.hotkeyKeys` + `disabled`; merges with parent).
- Formatting via `locale` prop (default `'en-US'`, `Intl`): `MDatePicker`, `MDialogDate`,
  `MTimePicker` (+ `hour-cycle`), `MNumberInput`.
- RTL: `dir` on `<html>` (`useHead({ htmlAttrs: { dir } })`), not a wrapper (overlays render
  outside your tree). Not mirrored yet: `MTabs`/`MNavigationBar` arrows, `MSlider`,
  `MNavigationDrawer side`, `MMenu origin`.
- docs_v3 pairs the kit with `@nuxtjs/i18n` — no kit integration needed.

## §11 Composables for app code

All auto-imported in app code (`composables/**`, `shared/**`). Signatures abbreviated; read the file under
`kit/src/runtime/composables/` before relying on details.

| Composable | Use it for |
|---|---|
| `useMaterialTheme()` | theme controller (§2) |
| `useBreakpoint()` → `{ is, more, less }` | breakpoint flags (§3); `useSSRWindowSize()` → `{ width, height }` refs |
| `useModal({ component, attrs, slots })` | programmatic modal (§8); `useModalSlot()` typed slot sugar |
| `useTimer(handler, { duration, repeat })` | `{ start, stop, pause, resume, remaining, isActive, isPaused }` — snackbar auto-hide |
| `useHotkey(source, handler, options)` + `<m-hotkey :hotkey>` | app shortcuts with a visible hint; `provideHotkeyLabels()` localizes key names. Matches `event.key` (non-Latin layouts miss) |
| `useFileUploadQueue({ upload, concurrency })` | an upload queue that outlives `<m-file-upload :queue>` (types in §7) |
| `useConfirmEditTransaction({ … })` | edit-as-transaction: draft → `commit()` / `cancel()` |
| `useField({ path, model })` | bind any value (pickers, own inputs) to the validation adapter → `{ errorMessage, hasError, meta }` |
| `useFormSchema(config, { onSubmit })` | adapter-backed form from a declarative config (needs an ancestor `provideValidationAdapter`) |
| `provideValidationAdapter(adapter)` / `injectValidationAdapter()` | install / read the validation engine |
| `useReducedMotion()` | `Ref<boolean>` for JS motion |
| `useVirtualScroll(options)` | windowed long lists (read the file for options) |
| `useClickOutside(target, handler, opts)`, `useEventListener`, `useWindowEventListener`, `useDocumentEventListener`, `useGlobalListener` | SSR-safe listeners (one shared DOM listener per event) |
| `useDrag(target, options)` | pointer drag gesture tracking (DIY drag-and-drop) |
| `usePopover(model, options)`, `useFocusTrap(target, opts)`, `useScrollLock()`, `useStack()`, `useTopLayer()` | building your own floating surface the kit way (if you build one, report it) |
| `useLayoutZone()` | inside `<m-layout>`: insets, sticky offsets, `windowY` scroll, `scrollLock` |
| `useSelectionGroup` / `useSelectionItem` / `useSelectionContext` | headless single/multi selection (what `<m-selection-group>` uses) |
| `createRegistry`, `createSelection`, `createSingle`, `createGroup`, `createModel` | low-level registries (tri-state groups) — rarely needed in apps |
| `useShapeMorph(target, options)` | morph an SVG path (what `<m-shape>` uses) |
| `useRaf(cb)` | scope-disposed rAF |

Component "control" composables (`useTextFieldControl`, `useDropdownControl`, `useAutocomplete`, `useTableControl`,
`useSliderControl`, `useTimePickerControl`, `useDatePicker`, `useOtpControl`, `useNumberInputControl`, `useListbox`,
`useMenu`…) are the behaviour layers behind components: they return attr bags (`rootAttrs`, `getXAttrs(i)`) so a
custom-looking component can reuse the kit's behaviour ("escape hatch"). Using one in an app is legitimate, and
worth reporting (it shows where the stock component's look was not enough).

Directives: `v-ripple` (press ripple), `v-click-outside`.
Constants: `ICONS` (icon keys), `MESSAGES` (English prop defaults — not a global override point).

## §12 Styling your own components the kit way

### Consumer SCSS

The module prepends `@use "<kit>/src/runtime/assets/stylesheet/additional.scss" as *;` to Vite's
`css.preprocessorOptions.scss.additionalData` → **every** app `<style lang="scss">`/`.scss` has the
kit abstracts unnamespaced, no `@use`. Your string `additionalData` is kept after it (a function one
is replaced). `lang="sass"` gets nothing. `sass:` built-ins not included → `@use 'sass:map';`.

| Kind | API |
|---|---|
| fn | `spacing(n)` → `nrem` (scale 0 2 4 8 12 16 20 24 32 40 48 64; other unitless numbers OK in apps) |
| fn | `g($map, 'a.b.c')` (dot path; miss = build error; dash form = legacy, miss silently drops the declaration). Flat dashed keys (`'on-primary'`) → `map.get` |
| fn | `state-opacity(hover\|focus\|pressed\|dragged\|disabled-container\|disabled-container-subtle\|disabled-content)` = 8/10/12/16/12/4/38% |
| fn | `elevation(0..5)`, `z(overlay-host\|header\|aside)` (9999/50/40), `strip-unit()`, `root-scale(bp)` |
| mixin | `typescale(body-large)`, `apply-typography($map)` |
| mixin | `media-min($px)`, `media-max($px)`, `media-distance($min, $max)`, `bp-tablet` (min 1199px), `bp-desktop` (min 1920px) |
| mixin | `can-hover` (wrap every `:hover`), `focus-ring($offset: 2rem\|inset)`, `sr-only`, `forced-colors`, `use-scrollbar`, `theme-definition($def, $palette, $contrast: null)` |
| maps | `$theme-color-link` (role → `var(--md-sys-color-*)`), `$theme-shape-link`, `$theme-typography-link` (`body.large.size`…), `$theme-animation-link` (`easing.<curve>`, `duration.(short\|medium\|long\|xlong).(1-4)`), `$theme-elevation-link`, `$theme-state-link`, `$theme-focus-link`, `$theme-spacing-link`, `$breakpoints` (merged, px), `$z-indexes` |

`$material-kit-breakpoints`/`$material-kit-typeface` are not forwarded (`@use '~material-kit-config'
as cfg;` if needed). `~material-kit-themes` is empty.

Either plain `var(--md-sys-…)` (docs_v3 mostly) or the kit token-map style. Rules: sizes in rem;
colors only via roles; states = `color-mix` at `state-opacity()` (percent); interpolate Sass in CSS
functions (`#{$x}`); px only in media queries; a BEM class per styled node.
```vue
<!-- app/components/PriceTag.vue -->
<template>
  <button type="button" class="price-tag"><slot /></button>
</template>

<style lang="scss">
@use 'sass:map';

$tokens: (
  container: (
    color: map.get($theme-color-link, 'secondary-container'),
    shape: map.get($theme-shape-link, 'small'),
    padding: (block: spacing(4), inline: spacing(12)),
  ),
  label: (color: map.get($theme-color-link, 'on-secondary-container')),
);

.price-tag {
  padding-block: g($tokens, 'container.padding.block');
  padding-inline: g($tokens, 'container.padding.inline');
  border: 0;
  border-radius: g($tokens, 'container.shape');
  background: g($tokens, 'container.color');
  color: g($tokens, 'label.color');
  box-shadow: elevation(1);
  transition: background-color g($theme-animation-link, 'duration.short.4') g($theme-animation-link, 'easing.standard');

  @include typescale(label-large);

  @include can-hover {
    &:hover {
      background: color-mix(in srgb, #{g($tokens, 'label.color')} #{state-opacity(hover)}, #{g($tokens, 'container.color')});
    }
  }

  &:focus-visible { @include focus-ring; }

  @include media-max(map.get($breakpoints, 'mobile')) {
    padding-inline: spacing(8);
  }
}
</style>
```
Hairlines: `max(1px, 1rem) solid var(--md-sys-color-outline-variant)`. Redeclaring a
`--md-sys-color-*` role on a wrapper recolors every kit component inside. Kit internals (`.ui-*`
classes) aren't a styling API; a parent class on a kit root needs a compound selector in prod
(chunk order differs from dev).

### Design-system rules (from `kit/docs/system`)

#### A0. Scope
- **Kit only (`src/runtime`):** the 4-unit `spacing()` scale (`$spacing-strict`); no new system tokens (`calc()` instead); every value via `$tokens` + `g()`, derived `calc` included; explicit UI imports; no state library; escape-hatch contract; 0-error gates (`lint`, `lint:style`, `lint:scss`, `typecheck`, `test`); a `.cursor/summary/` note.
- **App code is freer** (`spacing(96)` → `96rem`, own literals OK), but follow A2–A10 for a native look.
- **Owner rules everywhere:** ask at business forks; minimal diff; no deps without permission; files ≤ ~400 lines; comments only "why"; no bare `TODO`; never touch `.env`.
- **App SCSS gets the kit prelude automatically:**
  - functions `g()`, `spacing()`, `elevation()`, `state-opacity()`, `z()`;
  - mixins `focus-ring`, `can-hover`, `typescale`, `apply-typography`, `forced-colors`, `sr-only`, `use-scrollbar`, `media-min|max|distance`;
  - maps `$theme-{color,shape,typography,animation,elevation,state}-link`.
- **Setup:** install `sass` yourself (undeclared). `#kit` aliases the runtime (`@use '#kit/assets/stylesheet/components/<name>/index' as t`). `$material-kit-*` is not forwarded to the app.

#### A1. Axes (one word, one meaning)

| Axis | Values / notes |
|---|---|
| `color` | `primary\|secondary\|tertiary\|error`. A role, never a hue; no success/warning/info. |
| `variant` | `elevated\|filled\|tonal\|outlined\|text`. Narrow via `Extract<MVariant,…>`, never re-declare. `plain` is only in `MSurfaceVariant` (pending). |
| field `variant` | `filled\|outlined\|underline`: boundary shape, a separate axis. Textarea and dropdown/autocomplete: `filled\|outlined`. |
| `density` | `compact\|default\|comfortable`, the only scale word. `MLoading`/`MProgress` still use `size: sm\|md\|lg`. |
| `shape` | `none\|extra-small\|small\|medium\|large\|extra-large\|extra-large-top\|full`. Fields: `shape` (was `rounded`). `MButton`: `round\|square`. |
| `tag` / `mode` | Wrapper element (semantic `button\|link` on `MButton`, raw on `MSurface`) / a strategy, never visual. |
| `labelPlacement` | `top\|float\|inset\|hidden`. Default `float` (text-field, number-input), `top` (textarea). |
| `type` | Unsettled (OQ-2). Never add it. |

- **Booleans:** only when no second value can exist (`disabled`, `required`); otherwise use an enum.
- **No speculative API:** no variant without a customer, no prop you'd neuter; actions go in slots, not props.

#### A2. Colour roles
- **Role table** (fields, chips, items, cells, steps): empty `outline-variant`; content `outline`; active-now `primary`; error `error` (+ `error-container`); disabled = same property at disabled opacity.
- **`primary` = activity only**, never "complete" or "has value".
- **Pairing:** content on `X` uses `on-X` (`on-<role>-container` on `<role>-container`, `on-surface(-variant)` on surfaces).
- **Kit mappings:** tonal button = `<role>-container`; selected list or dropdown row = `secondary-container`; outlined edge = `outline-variant` for every role.
- **Sources:** only `$theme-color-link` / `var(--md-sys-color-*)` (30+ roles: surface-container ladder, fixed/dim, inverse). No literals.
- **Inside a control:** no hairline divider; separate by tone, shape and inset. `filled` sits on `surface-container-highest` (no tone above): use a state layer.

#### A3. States
- **Five states:** initial, hover, pressed, focused, disabled (+ dragged).
- **Interaction layer:** hover, focus, pressed and dragged are a `::before` in the content's ink, opacity `state-opacity()` hover 8 / focus 10 / pressed 12 / dragged 16. Never swap or pre-mix the background. Root: `position: relative; isolation: isolate`.

  ```scss
  &::before { position: absolute; inset: 0; z-index: -1; background-color: <ink>; content: ''; opacity: 0; }
  @include can-hover { &:hover::before { opacity: state-opacity(hover); } }
  &:focus-visible::before { opacity: state-opacity(focus); }
  ```

- **Button family:** a press is the ripple alone (`v-ripple`).
- **Disabled:** `color-mix` on the owned property: container 12%, content 38%, `disabled-container-subtle` 4% (filled field). Interpolate: `color-mix(in srgb, #{$c} 38%, transparent)`.
- **Hover rules:** every `:hover` goes inside `@include can-hover`; `:focus-visible` stays outside.
- **One property per state:** outlined → `border-color`, filled → container tone, underline → line. Never add a property for a state.
- **Never colour-only:** add an icon, border, message or position.
- **Focus:**
  - Fields change colour only: no ring, no thicker border, no animation; focus outranks error.
  - Other controls use `@include focus-ring` (3rem, offset 2rem, `secondary`; `focus-ring(inset)` when clipped).
- **Hover scope:** read-only fields hover like editable ones. Static surfaces (plain card, non-clickable row) have no hover.
- **Forced colours:** `@include forced-colors` restates fills as system-colour borders; the error edge is dashed.
- **No layout shift with state:** static labels, equal-width segments, a support line reserved where an error can arrive.

#### A4. Shape, elevation, layers, spacing
- **Corners (rem):** none 0, extra-small 4, small 8, medium 12, large 16, extra-large 28, extra-large-top 28 28 0 0, full 999.
  - Read via `map.get($theme-shape-link, k)` or `var(--sys-shape-corner-*)`.
  - Off-scale = `calc()` of steps (20 = large + extra-small).
- **Round shapes:**
  - A round part that morphs or meets smaller corners uses `calc(height / 2)`, not `full` (toggles, group buttons, split halves, open FAB menu).
  - Plain buttons stay `full`. A selected toggle is square; state shapes are static.
- **Elevation:** only `elevation(0..5)` / `--sys-elevation-level*`, never a literal `box-shadow`. Hover raises exactly one level (card 1→2, FAB 3→4).
- **z-index:** page layers via `z(header|aside|overlay-host)` (50 / 40 / 9999); overlays in the native top layer; local literals 1–3 only inside `isolation: isolate`.
- **Spacing:** `spacing(n)` = n rem; scale 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- **Rounded scroll container:** set `--ui-scrollbar-inset-block|inline` to its corner token. Never set `scrollbar-width`/`scrollbar-color` (Chrome ≥121 drops the styled scrollbar); `scrollbar-width: none` is fine.

#### A5. Motion
- **Easing:** `--sys-motion-easing-{linear, standard(-accelerate|-decelerate), emphasized(-decelerate|-accelerate)}`.
- **Duration:** `--sys-motion-duration-{short-1..4 50–200, medium-1..4 250–400, long-1..4 450–600, extra-long-1..4 700–1000}` ms.
- **Reduced motion:** medium and above collapse to `short-2` (100 ms) automatically, for token durations only. No literal ms in transitions. In JS: `useReducedMotion()`.
- **Spinners and loops:** constants live in the component map (with their M3 source) and slow down under reduced motion; the only legal literal duration.
- **Motion = feedback:** colour, and a box that grows. Nothing moves position, labels never animate, nothing blinks.
- **No Expressive springs or morph on the web.** The only exceptions, `MFabMenu` FAB → close and toggle selected shape, use `springToCss` → CSS `linear()`; a new morph must reuse it.
- **Mechanics:** one mechanism per browser; gestures snapshot at `pointerdown`.

#### A6. Typography
- **Roles:** `display|headline|title|body|label` × `large|medium|small`.
  - `@include typescale('body-large')` drops `letter-spacing`.
  - `@include apply-typography(map.get($theme-typography-link, label, small))` keeps it.
- **Fonts:** Roboto by default; `typography.fonts` = stylesheet URLs, loaded via `useHead`.

#### A7. Density
- **Chosen by the consumer,** never derived from the container. No height container queries (`size` collapses auto height); only `inline-size`.
- **Heights (compact / default / comfortable):** buttons 32/40/56; FAB 40/56/96; fields 44/56/64 (dropdown rows match the field).
- **Targets:** compact is floored at a 24rem target (WCAG 2.5.8). `MButton compact` and `MButtonIcon` add a 48rem touch extension. `MOtpInput` has no density.

#### A8. Units and geometry
- **rem only, `1rem` = 1 design px** (root `calc(1vw / root-scale(bp))`, 1px at 1920). A 24px icon is `24rem`. Never write `px`, except raw px in media queries.
- **Hairline:** `max(1px, 1rem)`.
- **vw root scale is a feature:** don't propose floors; fix thin things in tokens.
- **SSR first paint must be right:** no JS-measured geometry fixed after hydration (no ResizeObserver → CSS var). Use structural CSS (`:has()`, `:first-child`, `fieldset`/`legend` notch).
- **Runtime custom properties:** only for live geometry (`--m-slider-percent`, a panel's `maxHeight`). Never for theme or state.

#### A9. Accessibility
- **Native element first,** drawn over it (OTP = one `<input>`).
- **No English copy in the kit:** names and phrases are props or slots without defaults, plus a dev warning (`ariaLabel`, `messages`, `closeLabel`, `trailingAriaLabel`, `clearLabel`). Always pass localized ones; there is no app locale source.
- **Headings:** `headingLevel` 2–6 has no default (card, expansion panel); without it, no heading.
- **Disabled link:** `<a>` without `href` + `role="link"` + `aria-disabled` (`utils/link`).
- **Busy:** the host sets `aria-busy` and hides `MLoading`; a standalone `MLoading` needs a name.
- **Errors:** `aria-invalid` + message + glyph. **Range keys:** arrows, Page, Home, End, Shift ×10.
- **Focus trap intent:** focus the surface and keep Tab inside; the surface runs its own roving tabindex.
- **List rows:** `type="button"`, never submit. **Disabled text** at 38% is accepted (WCAG 1.4.3).
- **SSR markup:** `role`, `tabindex`, `aria-*` and the resting position are in the server HTML.

#### A10. CSS authoring
- **Block names:** kit `ui-<block>__<el>--<mod>`, layout `m-layout-*`. Apps use their own blocks (docs_v3: `shell-rail__nav`).
- **Selectors:** every styled node gets its own class. No tag selectors, no `>` combinators. The only exception is a slot wrapper reaching consumer children; flag it.
- **State:** a BEM modifier (`--focused`, `--error`, `--disabled`), never `data-*`. Composables emit neither classes nor `data-*`.
- **Overriding a kit root from a parent** (`<MButton class="x__cta">`): use a compound selector (`& &__cta`, `&__row &__cta`, `&.ui-surface`). One class vs one class wins in dev and loses in prod. An `MButton` colour override needs 3 classes. Never `:where()`.
- **Tokens:** `g($t, 'a.b.c')` dot paths only. A dot miss fails the build; a legacy dash path yields `null` silently.

#### A11. Behaviour components
- **Layers:** pure math → control composable (DOM, events, ARIA → attr bags `rootAttrs`/`getXAttrs(i)`, no classes, no `data-*`) → presentation. Escape hatch: delete the tag, keep `v-bind` + hook, behaviour survives. Declare `UseXControlReturn` explicitly (mkdist TS7056).
- **Primitives:** `createContext` (`m3:<name>`), `useEventListener`, `useGlobalListener`, `useClickOutside`, `useStack`, `useFocusTrap`, `useScrollLock`, `useBreakpoint()` (prefer `is`; `more`/`less` leave a 1px dead zone), `useSSRWindowSize()`.
- **Lifecycle:** no data in `onMounted`; clean up listeners and timers; no server-side module state; cache measurement, invalidate on scroll/resize, throttle with rAF.
- **Defaults:** one home, the prop. Phrases in `shared/constants/messages.ts`, icons `ICONS.x`. Clamp drafts on commit, not per keystroke.
- **App-wide APIs** on `useNuxtApp().$material` (theme, breakpoints, modal). Native features behind detection with hand-written fallbacks; no polyfill packages, no new deps.

#### A12. Code style
- `.vue` order: `<template>` → `<script setup>` → `<style lang="scss">`. No semicolons; `x => f(x)`, `(x) => { … }`.
- Thin templates (logic in `composables/`/`utils/`); content hosts expose `<slot/>`s; decompose into `index.vue` + `fragments/`.
- `M*` auto-imports in apps; explicit imports inside the kit. No new Pinia store (`useState`, `provide`/`inject`, `useMaterialTheme()`). No legacy shims before 1.0.

#### A13. Decisions that change usage
- **Card:** `tag="link"` makes the whole card a link named by its title (no button card, no stretched link); `variant` `elevated|filled|outlined`; `#title`; a static card has no hover.
- **List:** `ul` without `role="list"`, subheaders plain `li`; selected = `aria-current` (link) / `aria-pressed` (button); `#trailing-supporting`; no `loading` on `MListItem`/`MExpansionPanel`.
- **Small:** `MDivider inset` `start|center|end`; `MAvatar density`; `MTimelineItem #dot`, no status tones; collapsed panel is `inert`.
- **Buttons:** `selected`/`v-model:selected` (square when selected); `loading` = inline `MLoading`, stays focusable; FAB family `density`, FAB menu `align: start|end`; split `#menu="{close}"`, `@trailing`, `trailingAriaLabel`, attrs → main button; `MButtonGroup` = `items` + `v-model`; equal-width segments.
- **Fields:** `ref` = `{ control, input }`; numbers via `MNumberInput`; no counter on `MTextField`. Support line sits 4 below the box, reserved only with `helperText`, `path`, `required`, `#helper`/`#error` or a bound (even empty) `error`/`errorMessage`.
- **Dropdown/autocomplete:** `items` are objects with `id`; model-first selection (unknown values stay); `messages = {clear, toggle, loading, empty, noResults}`, no defaults.
- **Dates/time:** `MDatePicker` emits the input's type (`YYYY-MM-DD`/ms/`Date`), takes `label`; time model always `HH:mm`; `MTimePicker mode` `picker|input`. No range picker, no docked date field (field + `MDialogDate`), no `MDialogTime` (`MDialog` + `MTimePicker`).
- **Table:** selection in the model survives paging; select-all = current page; the app prunes deleted rows; no single-row selection (`row-click`); no `column.maxWidth` (`width` + wrap).
- **Modals:** `useModal()` / `$material.modal`. Confirmed editing = `useConfirmEditTransaction`.

## §13 Known gaps, bugs and pitfalls (2026-10-20)

**HEAD state (2026-10-20):** the wave-1 merge `64fb4dc` broke `composables/useShapeMorph.ts` (`<m-shape>`, `<m-loading type="expressive">`); the owner repaired it in the working tree at 04:16 (uncommitted, `.cursor/summary/merge-wave-1-fix_2026-10-20.md`), so both work again. `nuxi typecheck` of an app may still list kit-only errors (`shared/constants/cookie.ts` `#app` TS2307, `ui/app/index.vue` `process` TS2591) — ignore them, report only new ones.

Format: **component** — problem — *status* → workaround. Status: *open* = a bug, *accepted* = a trade-off, *deferred* = waiting on the owner.
Re-checked in HEAD (still open): main overflow, dialog/sheet overflow, MMenu `parentElement`, tooltip, checkbox error, ripple Space, `bp-tablet`, focus-trap, version.

#### B1. Packaging and setup
- **Version:** `package.json` 0.5.0, changelog 0.6.0; published 0.5.0 lacks `./types` `TableColumn`/`SortState` and button types. *open* → check `dist`.
- **Dependencies:** `sass` is needed but undeclared; peer `nuxt ^4.4.8`; `vue` pinned to 3.5.39; `vee-validate`/`yup` optional (pulled in by `/validation`). *open*
- **Undocumented breaks:** overlay option renames; `openModal`/vue-final-modal gone; fields forward attrs to the native control. *open*
- **Leftover aliases:** `useThemeStore`, theme `preset`, `MAppBar type="center-aligned"`, `MLayoutAside left/right`, `MLayoutItem area`. *open* → don't use them.
- **`<core-scope>` ≠ `<MApp>`:** it has no theme CSS, and `useModal` needs MApp's container. *open* → without MApp, push `useMaterialTheme().htmlAttrs` and `themeCss` via `useHead`.
- **SCSS:** `$material-kit-*` not forwarded; a function `additionalData` is dropped; 7 comments per compiled sheet; `bp-tablet` = `min-width: 1199px` (band top) → use `media-min|distance`/`useBreakpoint()`. *open*
- **Misc:** hotkey internals auto-imported (`registerHotkey`, `pushScope`…, name clashes); stale props fail silently (bare `MDivider inset`, `MList lines`). *open*

#### B2. Theme and SSR
- **`definition: 'system'`** renders light in SSR and flips after hydration. *open* → default `light` (as docs_v3 does).
- **Contrast:** the module default is `medium` (set `'standard'` for M3); per-theme `contrast` has no effect; `theme.default.variant`/`neutralChroma` are unread. *open*
- **`theme.semanticColors`** replaces instead of merging, and semantic colours ignore contrast. *open* → pass `success`, `warning` and `info`.
- **No colour tokens:** an invalid custom HEX or an undeclared palette key renders none; `_m3-fallback` has no semantic roles and no `scrim`. *open* → validate seeds.
- **Misc:** `setColorFromImage` fails cross-origin without CORS; theme colour transitions lag ~165 ms (*deferred*).

#### B3. Layout
- **`.m-layout-main` scroll:** always `overflow-y: auto`, so `position: sticky` inside never sticks (non-full-height). *open* → `overflow: visible; overflow-x: clip` on your main.
- **`.m-layout-main` containment:** `container-type: inline-size` makes main the containing block for `position: fixed` (a FAB). *open*
- **Small `MAppBar` + `MSearch`:** 64 + 8 padding vs a 56 search; the bar grows to 72, its zone reserves 64, so it overlaps content by 8. *open* → a sized `m-layout-header` (72rem) or a 48rem row.
- **Zones:** a sticky sized zone turns `fixed` without its `size-token` height; `carve.ts` copies `size-token` onto `html` (a var set on the layout → nothing); `m-layout-item` without `kind` silently becomes a 2nd main; `insets.left/right` hold start/end. *open*
- **Nested `m-layout`:** keeps `min-height: 100dvh`; `kind="main"` lacks `min-height: 0`/`overflow`; a nested header goes sticky → `fixed`. *open* → fix by hand.
- **`MAppBar`:** `sticky` only affects registration (CSS always sticky); no landmark/heading; under main it adds to main's zone. *open*

#### B4. Overlays (MMenu = the blocked primitive)
- **`MMenu`** (plan pending, *deferred*): without `absolute` (default `false`) it pins top 72 / right 32 over a full-page backdrop; `role=menu` unnamed, attrs on the wrapper; no `MMenuItem` (use the `ui-menu__item` recipe), disabled items aren't `menuitem`; Tab trapped, no typeahead; 200/250 ms literals ignore reduced motion; Escape returns focus to the trigger's `parentElement`, an item pick to nowhere; no `lockScroll`, no height cap.
- **Viewport clamping** is assigned to MMenu, and nothing clamps today: dropdown/autocomplete/search panels, tooltip, popover. *deferred* → panel `maxHeight` (token or prop).
- **MMenu-dependent:** `MColorInput`'s popover is `role=menu` around a picker while its button says `dialog`. *deferred*
- **`MDialog`/`MSheet` height:** no max height, `overflow: hidden`, so tall content is cut while the page is scroll-locked. *open* → your own `max-height: …dvh; overflow-y: auto` body.
- **`MDialog`/`MSheet`:** `confirm`/`cancel` never emitted (`useModal({component: MDialog})` resolves `null`); dialog `autofocus` likely fails (focus in `@opened`); headline always centred; sheet has no name, unfocusable handle, no `touch-action`. *open*
- **`useFocusTrap`** focuses the first focusable by default, against the owner's "focus the container". *open*
- **`MTooltip`:** `aria-describedby` on the inner span, only while visible (not announced); opens on click focus; 150 ms literal. *open*
- **`MOverlay`:** activator always `aria-haspopup="menu"`. *open*
- **`MSnackbar`:** `surface`, not inverse; live region mounts with the text; no queue (overlap); fixed over a nav bar/FAB. *open*

#### B5. Navigation
- **Rail/bar items** are buttons, not links; pressing the active item emits nothing. *open* → read the native click (docs_v3 `itemAtEvent`).
- **Rail:** hovering the active pill drops it to pressed opacity; inside `MLayoutMain` it's "hosted" (100% wide). *open* → outrank `.ui-navigation-rail--hosted` with a compound selector.
- **Bar:** active state by colour only; rounded at elevation 2 (≠ M3). *open*
- **Drawer:** content doesn't scroll; `side` mixes logical and physical; `#activator` isn't forwarded. *open*
- **Tabs:** the tablist can't be named; panels have no `id`, yet `aria-controls` is always set; a preset non-first `v-model` may SSR-mismatch (?). *open* → route sections as links with `aria-current` (docs_v3).
- **Toolbar:** icon+label renders only the icon; no `aria-pressed`, role or keyboard. *open*
- **Pagination:** Next/Last become natively `disabled` (focus lost); camelCase `ariaLabel`/`ariaCurrent` slot props render `arialabel` in SSR; English "Go to page N"; no compact mode. *open*
- **Breadcrumbs:** no click API (only `to`); `scroll` mode never reveals the current crumb. *open*
- **RTL:** arrows not mirrored (tabs, bar); slider/progress/switch run from the left; drawer `side`/menu `origin` physical; `MIcon` doesn't mirror. *open*

#### B6. Fields and selection
- **Checkbox/switch/radio:** `aria-invalid` but no error message (switch has no error look); user `id` replaced; `name` without `path` dropped; default slot renders only with `label`; `loading` ignored; no indeterminate. *open* → pass `label`, render errors yourself.
- **`MDropdown`/`MAutocomplete`:** `name` sits on the visible input (forms post the label → submit from `v-model`); without `messages` clear/toggle are nameless (always pass it); generic `TItem` from the model, not `items` (*deferred*). *open*
- **`MAutocomplete`:** `#hint` vanishes on the first keystroke; the first remote keystroke may not open the panel; `noResults` never shows with `:filter="false"`. *open*
- **`MNumberInput`:** static `unit` not announced; `null` unit + `units` checks nothing; English labels. `MNumberInputUnit` is public by accident (*deferred*, don't use). *open*
- **`MSearch`:** `v-model:focused=true` doesn't focus; Enter emits `submit` without `preventDefault`, even when empty (a parent form submits); without `clear-label` the clear button triggers a nameless warning. *open*
- **Minor:** `MTextField type="search"` keeps the native cancel button; `MOtpInput` paste `123-456` emits `invalid ['-']`; `MTextarea resizeLabel` = "Resize". *open*
- **Chip row width:** the chip-row field asks ~60rem in auto-width contexts (a table, a flex item with no basis). *accepted* → size it from the container.
- **Support line:** not reserved by default. *accepted* → if errors can arrive, bind `error`/`errorMessage` (even empty) or `path`, or the layout jumps. A composite's own errors shift the layout (*accepted*).
- **Field axes** use private `--ui-*` vars, against `decisions.md` (Q-1). *deferred*
- **`MFormRenderer`** (beta): `textarea` is single-line; `search` lacks `type`; "Submit" is English; config is read once; an optional `number` can't be empty; no `onError`; radios get no shared `name`. *open* → build forms by hand.

#### B7. Pickers, colour, files
- **Pickers:** `MTimePicker` shows `errorMessage` only with `error`, `MDatePicker` alone (*open*); mode toggle on + English in `MDatePicker`, off in `MTimePicker` (*deferred*); `locale: 'en-US'` + English `MESSAGES` in pickers/number input (*deferred* → pass `locale` and labels); time radiogroup unnamed, 12h ArrowUp 11 AM → 12 AM; `selectYear` doesn't clamp to min/max (*open*).
- **`MColorInput`/`MColorPicker`:** a popover format change rewrites `v-model` without `change`; `auto` starts as hex; every blur commits (unchanged too); `:picker=false` leaves a live button; hex keeps alpha. *open*
- **Files:** `MFileInput` clear drops focus to `body`. `MFileUpload`: `:multiple=false` limits each pick, not the queue; `required` not exposed; `queue` read once; remount restarts `auto-start` (shared `queue`?); `start(id)` keeps old `error`/`progress`. *open*

#### B8. Buttons, feedback, chips
- **Selected `text` icon toggle without `color`:** no colour (loses by CSS order). *open* → pass `color`.
- **Touch targets:** compact FAB/extended FAB (40) and icon-only `MButton` inside `MButtonGroup` get no 48 extension. *open*
- **Buttons, minor:** no name warning for icon-only group items/segmented; `selected` on `tag="link"` still emits. *open*
- **Directives:** `v-ripple` never ripples on Space (`'Space'` ≠ `' '`); `v-click-outside` keeps the mount-time handler (no `updated`). *open*
- **English default names:** `'Progress'`, `'Close'` (alert/banner), `'Primary'` (rail/bar), `'Navigation drawer'`, `'Dialog'`, rating. *open* → always pass names.
- **`MAlert`/`MBanner`:** the close slot's camelCase `ariaLabel` renders `arialabel` in SSR; close sits after the actions in Tab order; `MBanner layout="auto"` follows the window width. *open*
- **`MBadge`:** always a live region; no value + no `dot` = empty circle; vanishes in forced colours. *open*
- **`MProgress`/`MLoading`:** still `size` (Q-9, *deferred*); progress ignores reduced motion and RTL; `MLoading`'s status has only an `aria-label`. *open*
- **Chips:** selected `MChip` text `on-primary-container` on `secondary-container` (mismatch); pressed chip shifts 1rem (*deferred*); `MChipGroup` arrows follow mount order and lose focus on unmount. *open*
- **Minor:** `MRating` "double star", `touch-action: none` blocks scroll; `MSelectionGroup` `selectAll` ignores `max`, its fragment root drops `class`/`aria`. *open*

#### B9. Containment and data
- **`MListItem`:** a static selected row looks selected but announces nothing. *open*
- **`MTable`:** prev/next become natively `disabled` (focus lost); no mixed select-all; the scroll region is unnamed with `aria-labelledby`; `TableData` rejects interfaces. Footer vs `MPagination` is undecided. *open*
- **`MTimelineItem` filled/outlined:** no padding, `none` corner. *open*
- **Hairlines:** `MSurface outlined`, `MHotkey` and chips still use `1rem`, so it can vanish on narrow screens. *open* (sweep pending)
- **Dash-form `g()`** remains in system-bar, surface, lazy, banner (possibly dead rules). *open*
- **`useHotkey`:** matches `KeyboardEvent.key`, so Russian layouts, Option+letter and Shift+punctuation never match; `scope` is a no-op without `pushScope`. *open*
- **Minor:** `MLazy once=false` never unmounts without `v-model:active`; `MApp` `rootElement` = `null`; `MShape` SVG not `aria-hidden`; `MIcon` loads client-side (shift, *deferred*); `useConfirmEditTransaction.draft` is shallow. *open*

#### B10. Prod-only CSS order (recurring class)
- **Mechanism:** a parent's own class on a kit root sets the same property at equal specificity. Dev: the parent wins. Prod: chunk order flips, the child wins.
- **Fixed:** file-upload progress, color-picker format, dropdown panel progress and list, `MAlert`/`MBanner` vs `.ui-surface`, banner close, breadcrumbs link, OTP loading.
- **Live:** `.ui-checkbox` `color` is a single class; the `MSearch` clear colour rule is dead in every build.
- **Workaround:** compound selectors (A10), and run e2e on a prod build. The kit's scanner sees only static `class=`.

#### B11. Accepted edge cases (don't re-propose)
- **Focus ring:** the 3rem ring renders 1px at 1201–1279px, and at 1280 in prod (minified `calc(1vw/19.2)`). ~11–12 e2e "ring ≥ 2px" checks fail by design.
- **vw root scale:** RS-04/05/06 deviations; browser font size doesn't scale the kit.
- **Disabled helper text** at 38% fails axe contrast (e2e skips `--disabled`).
- **Containment:** `MList` without `role="list"` (VoiceOver may skip), subheader counts as an item; collapsed panels `inert` (find-in-page misses); outlined label offset one hairline from the value.
- **`useSliderControl`** still emits `data-*`; there are two range keyboard controllers (don't add a third).

#### B12. Missing or withdrawn components (build app-side)
- **Not started:** skeletons.
- **Pending:** stepper, window, treeview, calendar, month grid, image, parallax, validation, hover/focus helper.
- **Low priority:** carousel, empty-state, pull-to-refresh, slide-group, data-iterator.
- **Charts:** none (paid lab; demos draw SVG).
- **Withdrawn (besides A13):** `MConfirmEdit`, `MFieldGroup`/inline label, `ghost` field, list row gestures, success/warning/info in `MColor`.
- **Wishes not done:** standard drawer, side sheet, app-bar search slot, rail/bar links, currency in `MNumberInput`, compact localizable `MPagination`, app locale source.

#### B13. Open owner decisions (follow the local convention meanwhile)
- **Axes:** OQ-1 (density steps), OQ-2 (`type`).
- **Pending migrations:** `plain` → `MVariant`; `MBannerVariant` `surface`; `size` → `density` (loading, progress); the hairline sweep.
- **Polish run:** every *deferred* item in B3–B9, plus phrases via `materialKit` config, `useVirtualScroll`'s own reduced-motion copy, `useClickOutside` listening on a closed FAB menu.

## §14 Checklist before calling a screen done

1. Root is `<m-app>`; the page shell is `<m-layout>` with zones; navigation swaps rail ↔ bar at a range edge
   (`less.desktopXs` or `less.tabletXs`), and the phone gets a way to reach every section.
2. Check the three canvases: phone (≤767 → 1rem = W/767), tablet (769–1199 → W/1199), desktop (>1200 → W/1920).
   Look at 393, 768, 1024, 1280, 1920 wide. Remember the ~36% snap at 769 and 1201.
3. Sizes in rem as design px; colours only via `--md-sys-color-*` roles with on-X pairing; type via
   `@include typescale(...)` or `--md-sys-typescale-*`; corners via the shape scale; shadows via `elevation()`.
4. Every icon-only button has `aria-label`; every component that ships no copy gets its labels/`messages`.
5. Dialog/sheet bodies that can grow get `max-height: …dvh; overflow-y: auto` (they don't scroll themselves).
6. Long scroll + `position: sticky` inside `m-layout-main`: override main overflow (§3 pitfalls) or use `full-height`.
7. Overriding a kit component from a parent class → compound selector (§12), or it breaks in prod only.
8. Light and dark both look right (toggle `useMaterialTheme().definition`); no hard-coded colours anywhere.
9. Width-based `v-if` renders the server's device guess first; prefer CSS (media/container queries) for layout.
10. Anything you had to build yourself, work around, or that looked off — write it down (that is the point).
