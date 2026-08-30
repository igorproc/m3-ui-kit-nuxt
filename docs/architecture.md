# Architecture

Three systems make up the kit: the **token layer** (build-time Sass), the **theming
pipeline** (MD3 palettes, half build-time and half runtime), and the **viewport layer**
(one shared, SSR-safe window size). This document describes all three.

---

## 1. The token layer

Component styling is resolved at build time. A component owns a nested `$tokens` map; the
`.vue` file picks values out of it with the `g()` getter, and Sass compiles the result to
static CSS. There are no per-component custom properties and no local `$color` variables.

### Stylesheet layering

```
src/runtime/assets/stylesheet/
├── abstracts/       # g(), root-scale(), mixins, $theme-*-link maps
├── base/            # reset, typography, animations, shapes, adaptive root font-size
├── themes/          # static palettes (base/_light.scss, base/_dark.scss)
├── components/      # one folder per component: _index.scss with its $tokens map
└── main.scss        # the entry the module pushes into nuxt.options.css
```

`abstracts/additional.scss` is injected as a Sass prelude into every SCSS entry by the
module, so `g()`, the mixins and `$material-kit-*` are always in scope — you never `@use`
them manually.

### Defining tokens

```scss
// src/runtime/assets/stylesheet/components/badge/_index.scss
@use 'sass:map';
@use '../../abstracts/variables' as *;

$tokens: (
  border: (radius: map.get($theme-shape-link, full)),
  background: (color: map.get($theme-color-link, error)),
  text: (
    color: map.get($theme-color-link, on-error),
    typography: map.get($theme-typography-link, label, small),
  ),
  dot: (
    size: 6rem,
    padding: (inline: 0),
  ),
);
```

### Consuming tokens

```scss
// src/runtime/components/ui/badge/index.vue
@use 'sass:map';
@use '#kit/assets/stylesheet/components/badge/index' as t;

.ui-badge {
  border-radius: g($t, 'border.radius');
  background-color: g($t, 'background.color');
  color: g($t, 'text.color');

  &--dot {
    min-width: g($t, 'dot.size');
    padding-inline: g($t, 'dot.padding.inline');
  }
}
```

### `g($map, $path)`

`g()` splits the path and walks the map, so **map nesting must mirror the path**.

- The canonical separator is a **dot**: `'container.padding.inline'`.
- A **dash** is still accepted as a legacy form (`'text-color'`) and much of the codebase
  predates the change. `g()` picks the separator per call — if the path contains a `.`, it
  splits on dots, otherwise on dashes. Never mix both in one path.
- New and migrated components use dots. The dash form stays supported; it is not deprecated
  loudly, but it cannot express a key that itself contains a dash.

A path that resolves to nothing yields `null`, and Sass then **drops the declaration
silently** — no build error. When a style mysteriously does not apply, a typo'd token path
is the first thing to check.

### Color roles

Colors never appear as literals. They come from `$theme-color-link`, which maps MD3
semantic role names onto the runtime custom properties:

```scss
$theme-color-link: (
  'primary': var(--md-sys-color-primary),
  'on-primary': var(--md-sys-color-on-primary),
  'primary-container': var(--md-sys-color-primary-container),
  // … 30+ roles, including the fixed, dim and surface-container families
);
```

This is the one deliberate seam between build time and runtime: the *role* is resolved
statically, its *value* is a custom property that the active theme rewrites. Sibling maps
`$theme-shape-link` and `$theme-typography-link` work the same way for corners and the type
scale.

### States

All five MD3 states — initial, hover, pressed, focused, disabled — are expressed with
`color-mix()` at the standard state-layer opacities: **8% hover**, **12% pressed**.

```scss
&:hover {
  background-color: color-mix(in srgb, #{$on-color} 8%, #{$container-color});
}
```

Two rules that bite: the opacity must be a percentage (`8%`, never `0.08`), and Sass
variables must be interpolated inside native CSS functions (`#{$color}`, `calc(#{$size} * 2)`).

### Fluid typography — `1rem = 1px`

The root font size is viewport-relative: `html { font-size: calc(1vw / root-scale(bp)) }`,
where `root-scale(bp)` is the breakpoint width divided by 100. At the desktop reference
(1920px) that is `1vw / 19.2`, which equals exactly **1px** — so `1rem` is `1px` at the
reference width and scales fluidly away from it.

The practical consequence: **design pixels translate to rem one-to-one**. A 24px icon is
`24rem`, not `1.5rem`. Every size token in the kit is written this way.

Media queries are the exception — they use raw px thresholds. A rem-based media query would
resolve against the browser's initial 16px, not the fluid root size, and would land nowhere
near the intended width.

---

## 2. The theming pipeline

An MD3 palette is generated from a single HEX **seed** using
`@material/material-color-utilities`. The work is split in two.

**At build time** the module emits two SCSS templates and aliases them:

| Alias | Contents |
| :--- | :--- |
| `~material-kit-config` | `$material-kit-breakpoints` from `materialKit.breakpoints` |
| `~material-kit-themes` | Intentionally empty; kept so existing `@use` statements resolve |

Palettes marked `definedInScss` are not generated at all — they are hand-written under
`assets/stylesheet/themes/base`. The built-in `_m3-fallback` is one of these.

**At runtime** `<MApp>` renders the *active* palette and nothing else. `useMaterialTheme()`
derives a `themeCss` string — `generateScheme()` builds the light and dark
`DynamicScheme`s, `buildThemeBlocks()` prints them as CSS — and `<MApp>` injects it through
`useHead` as `<style id="material-kit-theme">`, together with the html attributes:

```html
<html data-definition="dark" data-palette="ocean" data-contrast="medium">
```

The generated blocks are keyed by those attributes:

```css
[data-definition="light"][data-palette="ocean"] { --md-sys-color-primary: #…; }
[data-definition="dark"][data-palette="ocean"][data-contrast="high"] { … }
```

Because this happens during SSR, the first paint already carries the visitor's theme — there
is no flash. Switching a palette re-renders one `<style>` element; no rebuild, no page
reload.

**Trade-off worth knowing:** generating palettes at runtime means the color utilities ship
in the client bundle and a scheme is built during hydration. It buys arbitrary
runtime palettes (including a seed picked from an image); an app that only ever uses a fixed
set of configured themes pays for a flexibility it does not use.

### The theme controller

`useMaterialTheme()` returns one instance per Nuxt app — cached on `nuxtApp`, which means
per request on the server — created inside a detached effect scope so its
`prefers-color-scheme` subscription outlives whichever component asked for it first. Every
caller shares the same refs, so a write is visible everywhere synchronously.

State lives in three cookies (definition, palette, contrast), so it survives reloads and is
readable during SSR. The palette cookie carries an object — `{ isCustom, key, variant,
neutralChroma }` — where `key` is either a configured palette key or a raw HEX seed when
`isCustom` is true. A legacy plain-string cookie is normalized on read.

---

## 3. The viewport layer

One piece of shared state, `useState('md:viewport')`, holds `{ width, height }` for the
whole application.

- **On the server** it is seeded from the request's device class (`@nuxtjs/device`):
  393×852 for mobile, 992×1180 for tablet, 1920×1080 otherwise. Deterministic, so SSR
  renders a plausible layout instead of guessing zero.
- **On the client** a plugin measures the real window and keeps it in sync. The first
  measurement is deliberately deferred to `app:suspense:resolve` — plugins run before
  `app.mount()`, so measuring earlier would hand hydration a viewport the server never saw
  and turn every width-dependent subtree into a hydration mismatch. After hydration the same
  update is an ordinary patch.
- There is **one** resize listener for the entire app, owned by that plugin. Consumers never
  attach their own.

`useSSRWindowSize()` exposes the size as refs. `useBreakpoint()` layers the breakpoint bands
on top:

```ts
const { is, more, less } = useBreakpoint()
```

- `is[name]` — the active bucket, `prev < width <= value`
- `more[name]` — `width > value` (strict)
- `less[name]` — `width < value` (strict)

Both comparisons being strict leaves a one-pixel dead zone exactly on a breakpoint value,
where `more` and `less` are both `false`. Prefer `is` for mutually exclusive branches.

Names are camelCased from the config keys (`tablet-xs` → `tabletXs`), and consumer-defined
breakpoints appear in all three maps. See
[configuration.md](configuration.md#breakpoints) for typing them.

### Shared global listeners

`useGlobalListener(target, event, handler, options)` is the kit's registry for
`window`/`document` events. It keeps exactly one real DOM listener per
`target + event + options` and fans it out to subscribers; the master listener is removed
when the last subscriber leaves. Called inside a component scope it unsubscribes
automatically on unmount. On the server it is a no-op, so the registry is never touched
during SSR.

Use it instead of a bare `addEventListener` whenever several components would otherwise
subscribe to the same global event.
