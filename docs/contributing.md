# Contributing

## Repository layout

```
kit/
├── src/
│   ├── module.ts              # the Nuxt module: components, imports, plugins, SCSS pipeline
│   └── runtime/               # everything shipped to consumers
│       ├── components/
│       │   ├── ui/            # public surface — auto-imported as <M*>
│       │   ├── fragments/     # private leaves, imported explicitly by their owner
│       │   └── core/          # overlay/modal infrastructure (<core-scope>)
│       ├── composables/
│       ├── directives/        # v-ripple
│       ├── adapters/          # opt-in validation adapters
│       ├── plugins/
│       ├── assets/stylesheet/ # the token system
│       ├── shared/            # constants, types, utils
│       └── utils/
├── playground/                # the kit's own consumer app: dev server + Vitest environment
├── shell/                     # repo scripts (lint:scss smoke compile)
├── docs/
└── .cursor/                   # plans, rules, dated change summaries
```

The repository root is the module package only. `playground/` is a minimal consumer app: its
`nuxt.config.ts` installs `../src/module` and nothing else, and it is what `npm run dev` serves
and what boots the Vitest Nuxt environment. Keep it that way: re-declaring components, imports
or aliases there lets the test environment drift away from what consumers actually install.

Specs sit next to the code they cover: `foo.ts` → `foo.spec.ts`; a component with several
specs keeps them in `<component>/tests/`. There is no root test folder.

## Commands

```bash
npm run dev:prepare    # generate playground/.nuxt types (run once after install)
npm run dev            # serve the playground
npm run build          # build dist/ (module.mjs + runtime + SFC/TS declarations)
npm run typecheck      # vue-tsc over src + playground — must pass with 0 errors
npm run test           # Vitest, Nuxt environment
npm run test:e2e       # Playwright + axe over playground/fixtures (boots the playground)
npm run lint           # ESLint — must pass with 0 errors
npm run lint:style     # Stylelint over **/*.{vue,css,scss} — must pass with 0 errors
```

Run a single spec with `npm run test -- src/runtime/components/ui/button/index.spec.ts`.

`npm run dev` serves the playground straight from `src/`, so kit edits hot-reload there. The docs
site consumes the built package by path: after editing kit sources, run `npm run build`
and restart its dev server.

## Component boundaries

- **`components/ui/**/*.vue`** is the public surface. Every `.vue` file there is auto-imported
  under the `M` prefix. Registration is deliberately not global: that would put the whole
  library in the entry graph, so a page using one button would download and parse all of
  them. Nothing private may live here.
- **`components/fragments/`** holds private leaves. They are imported explicitly by their
  owner and never auto-imported.
- **`components/core/`** is infrastructure — the overlay host and global container.

The scanner only reads `.vue` files from `ui/` and `core/`. Support files (`props.ts`,
`types.ts`, `context.ts`) sit next to their component and are imported normally.

`src/module.spec.ts` guards this: it asserts the scan boundary declared in
`src/module.ts` and checks the generated `playground/.nuxt/components.d.ts` for leaks. If you change
where components are registered, update that spec deliberately — do not loosen it to make a
run go green.

## Adding a component

1. Create the public root at `src/runtime/components/ui/<name>/index.vue`.
2. Create `src/runtime/assets/stylesheet/components/<name>/_index.scss` with a `$tokens` map.
3. In the `<style>` block, `@use '#kit/assets/stylesheet/components/<name>/index' as t;` and
   resolve every value with `g($t, 'path.to.token')` — dots, not dashes, in new code.
4. Handle all five MD3 states via `color-mix()` at 8% hover / 12% pressed. No hardcoded
   colors, no local `$color` variables, no per-component custom properties.
5. Put private leaves under `src/runtime/components/fragments/<name>/` and import them
   explicitly.
6. Expose `<slot />`s for anything a consumer may want to customize.
7. Add unit tests next to the component as `index.spec.ts` (or in a `specs/` folder).
8. `npm run lint && npm run lint:style` — both must report 0 errors.

See [architecture.md](architecture.md) for the token system in detail.

## Conventions

**File order in `.vue`:** `<template>` → `<script setup>` → `<style>`.

**Style:** no semicolons (enforced by ESLint). Inline arrow functions omit parentheses on a
single argument (`arg => fn(arg)`); block-bodied arrows always parenthesize
(`(arg) => { … }`).

**Imports inside the kit:** do not rely on auto-import for other UI components — import them
explicitly. Auto-import is for reactivity APIs, composables and utils. In a consumer's
project the kit lives in `node_modules`, where unimport does not rewrite our SFCs, so an
implicit import that works locally will fail there at SSR time.

**State:** the kit has no store layer and no state-management dependency. Use `useState()`
for shared state and `provide`/`inject` for tree-local data. Global theme state belongs to
`useMaterialTheme()` — never provide a theme per subtree.

**SSR and memory discipline:**

- Never load initial data in `onMounted` — use `useFetch`/`useAsyncData`. `onMounted` is for
  browser Web APIs only.
- Never keep mutable state at module scope that the server touches: on the server one module
  instance is shared across requests, so it leaks data between visitors. Cache per-request
  state on `nuxtApp` or in `useState` instead.
- Every `addEventListener`/`setInterval` must be cleaned up. For global events prefer
  `useGlobalListener()`, which shares one real listener across subscribers and unsubscribes
  on scope dispose.
- Anything measured from the window must go through `useSSRWindowSize()`/`useBreakpoint()`,
  not a private listener.

**Comments:** a comment explains *why*, not *what*. If a function needs a comment to be
understood, rename or split it instead. Public module and function docstrings are welcome;
line-by-line narration and commented-out code are not.

**File size:** keep files under roughly 400 lines. A component that outgrows this wants
decomposition, not a bigger file.

## Change summaries

After a substantial piece of work, add a dated summary to `.cursor/summary/` as
`<short-description>_<YYYY-MM-DD>_<HHMM>.md`, capturing the context needed to pick the work
up later. These double as a history of recent refactors.

## Reference material

- `.cursor/rules/m3_architecture.md` — the M3 token architecture in depth
- `.cursor/rules/migration_workflow.md` — migrating a legacy component to the token system
- `.cursor/rules/headless_architecture.md` — headless component patterns
- `.cursor/plans/` — feature plans, including `auto-layout.md` and `a11y-spec.md`
