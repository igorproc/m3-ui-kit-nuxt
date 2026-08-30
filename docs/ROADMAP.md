# Roadmap

The plan for growing PrimeTime UI Kit from a component library into a design system that
works both in the browser and in 3D space (VR/AR).

Status markers reflect what is verifiably in the repository. Items without a marker have not
started.

---

## Phase 1 — Foundation and cleanup

**1. Component cleanup and the SCSS map refactor** — ✅ **done**

Replace scattered variables with unified SCSS maps for colors, spacing and sizes. Beyond
cleanliness, this is what makes the values extractable later — for a 3D renderer or for
generated documentation. Drop deprecated Sass syntax along the way.

> Landed as the build-time token system: every component owns a nested `$tokens` map
> resolved through `g()`. See [architecture.md](architecture.md).

**2. Responsiveness** — ✅ **done**

Teach components to react correctly to screen size, following Material Design's responsive
standards.

> Landed as the shared viewport state, `useBreakpoint()` bands, configurable breakpoints and
> the fluid `1rem = 1px` root scale.

**3. Auto-layout and isolated component registration** — ✅ **done (2026-06-10)**

Fix the architectural bug where global registration could cause infinite loops. Components
now register strictly inside their parent (anchor), making the system predictable and
isolated.

> Delivered across phases A–F: the v2 carving engine (DOM order, parent check, multi-zone,
> sticky/fixed mechanics), `useLayoutZone()`, the `m-container`/`m-row`/`m-col` column
> system, and the new `m-system-bar` / `m-spacer` / `m-responsive`. Documented in
> [layout.md](layout.md); plan in `.cursor/plans/auto-layout.md`.

---

## Phase 2 — Richer UI and performance

**4. Skeletons for all UI components** — not started

Loading placeholders at the base-component level, so that while data loads the user sees the
component's shape animating rather than a jumping interface.

**5. Smart loading and hydration: `MLazy`** — ✅ **done**

Give developers control over when heavy UI mounts and when its JS chunk loads. `MLazy`
coordinates activation, a layout-preserving placeholder, Suspense loading/error UX and four
modes:

- `eager` — activate immediately (the default);
- `on-idle` — activate during browser idle time, with a maximum timeout;
- `on-view` — activate just before entering the viewport, via IntersectionObserver and root
  margin;
- `on-interaction` — activate on pointer, focus or click intent.

Actual JS deferral inside `MLazy` uses Nuxt's `Lazy*` component. SSR HTML with late
interactivity remains native Nuxt delayed hydration (`hydrate-on-visible`,
`hydrate-on-idle`, `hydrate-on-interaction`): the wrapper does not emulate compiler-level
hydration of an arbitrary slot subtree.

**6. Study Vuetify's sources** — ongoing

A research pause: look at how Vuetify structures composables and handles accessibility,
rather than reinventing patterns.

**7. Virtual scrolling and a capable `MTable`** — ✅ **done**

A virtualization composable that renders only the rows currently on screen, wired into the
base table so it stays fast at tens of thousands of rows.

> `useVirtualScroll()` plus the `m-table` integration; covered by
> `tests/virtual-scroll.spec.ts`.

---

## Phase 3 — Documentation and the alpha release

**8. Wireframes in the documentation**

Visual diagrams showing which layers, slots and spacing each component is built from, so
consumers do not have to guess.

**9. Semi-automated documentation generation**

A pipeline that keeps the docs current:

- text and structure served by the Nuxt docs app;
- images and heavy static assets on S3;
- colors and sizes extracted automatically from the SCSS maps (item 1);
- written use-cases rather than bare prop tables.

---

## Phase 4 — Cross-platform engine and XR

**10. Compiler-first multi-platform architecture and token extraction**

Three independent packages: `@pt-ui/core`, `@pt-ui/web`, `@pt-ui/xr`.

- **Extraction:** a compiler in `core` turns the SCSS maps into plain JSON that any 3D engine
  can consume, resolving CSS variables into real HEX/RGB values.
- **Thin files:** the logic of buttons, checkboxes and states moves into engine-independent
  TS modules in `core`; the web package binds that logic to HTML.

**11. The XR / 3D kit**

With shared token and logic cores in place, build `@pt-ui/xr`: 3D components abstracted from
any specific engine, with adapters for Babylon.js and Three.js. The same thin logic binds to
meshes instead of DOM nodes, producing a spatial-computing interface that keeps Material
Design's principles.

---

## Recent work outside the numbered plan

- **Dependency removal** — Pinia dropped entirely: theme state moved to a cookie-backed
  controller (`useMaterialTheme`), viewport state to shared `useState` with a single global
  listener. `flubber` replaced by an in-house shape-morph composable.
- **Validation decoupled** — form components no longer depend on a validation library.
  `vee-validate` became an opt-in adapter installed via `provideValidationAdapter()`.
- **Packaging** — the kit ships as a Nuxt module (`src/module.ts` + `src/runtime/`) rather
  than a layer.
