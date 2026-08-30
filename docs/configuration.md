# Configuration

Everything is configured under the top-level `materialKit` key in `nuxt.config.ts`. The key
is typed by the module itself, so options are checked as you write them:

```ts
export default defineNuxtConfig({
  modules: ['@pr0s1k/primetime-kit'],
  materialKit: { /* … */ },
})
```

The resolved options are written to `runtimeConfig.public.materialKit`, which is what the
runtime theme controller and `useBreakpoint()` read.

---

## `theme`

All theme-scoped configuration.

```ts
theme: {
  themes: [
    { key: 'm3', name: 'M3 Baseline', color: '#6750A4' },
    { key: 'ocean', name: 'Ocean', color: '#0061A4', variant: 'vibrant' },
  ],
  default: { definition: 'dark', palette: 'm3', contrast: 'medium' },
  semanticColors: { success: '#2e7d32', warning: '#ed6c02', info: '#0288d1' },
  semanticBlend: true,
}
```

### `theme.themes`

The list of selectable palettes. Each entry:

| Field | Type | Meaning |
| :--- | :--- | :--- |
| `key` | `string` | Identifier; becomes `data-palette="<key>"` on `<html>` |
| `name` | `string` | Display name, for your own theme picker |
| `color` | `string` | HEX **seed**; the whole MD3 tonal palette is derived from it |
| `definedInScss` | `boolean` | The palette is already written by hand in static SCSS — skip generation |
| `variant` | `TThemeVariant` | MCU scheme variant, default `tonalSpot` |
| `contrast` | `TThemeContrast` | Build-time contrast for this palette; runtime may override |
| `neutralChroma` | `number` | Chroma of the neutral palettes, overriding the variant's |
| `chroma` | `number` | Overall chroma for primary/secondary/tertiary |
| `semanticColors` | `TSemanticColors` | Per-theme semantic overrides, merged over the global map |
| `specVersion` | `'2021' \| '2025'` | MCU design-spec version, default `'2025'` (needed for `*-dim` roles) |

Available variants: `tonalSpot`, `neutral`, `vibrant`, `expressive`, `monochrome`,
`fidelity`, `content`, `rainbow`, `fruitSalad`.

The kit always ships one built-in palette, `_m3-fallback` — a grey `definedInScss` theme that
keeps the app rendering when nothing else matches. Because Nuxt merges module defaults with
your config by concatenating arrays, it stays in the list next to yours; set
`theme.default.palette` to your own key so it is not the one that shows up first.

### `theme.default`

Build-time defaults, used until the visitor's cookies say otherwise.

| Field | Type | Default |
| :--- | :--- | :--- |
| `definition` | `'light' \| 'dark' \| 'system'` | `'dark'` |
| `palette` | `string` | `'_m3-fallback'` |
| `contrast` | `'standard' \| 'medium' \| 'high' \| number` | `'medium'` |

`'system'` resolves against the visitor's `prefers-color-scheme`. A numeric contrast is
passed through to MCU clamped to `-1..1`; the named levels map to `0`, `0.5` and `1`.

> `theme.default.variant` and `theme.default.neutralChroma` exist in the types but are not
> read by the runtime yet — set them per theme in `theme.themes` instead.

### `theme.semanticColors` / `theme.semanticBlend`

Extra named seeds harmonized into every palette, so `success`/`warning`/`info` shift with
the active theme instead of staying fixed brand colors. Defaults are
`{ success: '#2e7d32', warning: '#ed6c02', info: '#0288d1' }` with blending on. Pass
`{ color, blend }` per entry to keep one of them unharmonized.

---

## `breakpoints`

Pixel thresholds shared by the SCSS mixins, the column system and `useBreakpoint()`.

```ts
breakpoints: {
  'mobile-xs': 0,
  'mobile': 600,
  'tablet-xs': 905,
  'tablet': 1240,
  'desktop-xs': 1440,
  'desktop': 1920,
}
```

Defaults are `mobile-xs: 0`, `mobile: 767`, `tablet-xs: 768`, `tablet: 1199`,
`desktop-xs: 1200`, `desktop: 1920`. Values may be numbers or px strings (`'905px'`), and
are coerced to integers.

The six reserved keys can be overridden; additional keys are simply added, and appear in the
`is`/`more`/`less` maps under their camelCased name. To get type-safe access to a key you
invented, declare it in the registry:

```ts
declare module '@pr0s1k/primetime-kit/types' {
  interface KitBreakpointRegistry {
    watch: true
    ultrawide: true
  }
}
```

The flag maps are closed types: an undeclared name is a compile error rather than a silent
`undefined` at runtime.

---

## `cookie`

Cookie names for the persisted theme selection. Change them to avoid collisions or to fit an
existing naming scheme; they are read on the server, so the first paint already carries the
visitor's theme.

```ts
cookie: {
  theme: {
    definition: 'md-def',
    palette: 'md-pal',
    contrast: 'md-con',
  },
}
```

Cookies are written with `path: '/'` and a one-year `maxAge`. Their contents are trusted as
written — there is no dictionary validation — with one exception, described next.

---

## `restrict`

Application-level locks. `true` disables the capability.

```ts
restrict: { customPalette: true }
```

`customPalette` turns off runtime palettes generated from an arbitrary HEX seed or an image.

The lock is enforced at resolve time, not just in the UI. Under it only palettes declared in
`theme.themes` may be used: a cookie claiming a custom seed — or naming a key that is not
declared — resolves to `theme.default.palette` instead. `setCustomColor()` and
`setColorFromImage()` become no-ops that leave the cookie untouched, and `setVariant()` /
`setNeutralChroma()` write through the sanitized state, so the cookie cannot accumulate
custom-palette flags the runtime is required to ignore.

Read `theme.canCustomizePalette` to hide your color picker accordingly.

---

## `typography`

```ts
typography: { fontFamily: 'Roboto, sans-serif' }
```

Base font family for the generated type scale. See
[architecture.md](architecture.md#1-the-token-layer) for how sizes are scaled.
