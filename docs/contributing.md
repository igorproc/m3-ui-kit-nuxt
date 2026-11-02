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

Specs sit next to the code they cover: `foo.ts` → `foo.spec.ts`, a component's specs in
`<component>/tests/` (see [Tests](#tests)). There is no root test folder.

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

Run a single spec with `npm run test -- src/runtime/components/ui/button/tests/variants.spec.ts`.

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
   resolve every value with `g($t, 'path.to.token')` — the dot is the only separator.
4. Handle all five MD3 states via `color-mix()` at 8% hover / 12% pressed. No hardcoded
   colors, no local `$color` variables, no per-component custom properties.
5. Put private leaves under `src/runtime/components/fragments/<name>/` and import them
   explicitly.
6. Expose `<slot />`s for anything a consumer may want to customize.
7. Add its specs in `src/runtime/components/ui/<name>/tests/` — see [Tests](#tests).
8. `npm run lint && npm run lint:style` — both must report 0 errors.

See [architecture.md](architecture.md) for the token system in detail.

## Tests

Unit specs run in Vitest inside the playground's Nuxt environment (happy-dom); e2e specs run
in Playwright over `playground/fixtures/`, in a 1366-wide window like the fixtures' `WIDTHS`.
The reference layout is the field family — `textarea/tests/`, `number-input/tests/`,
`dropdown/tests/`, `otp-input/tests/`.

**Where.** A component's specs live in `src/runtime/components/ui/<name>/tests/`, at least
three files:

- `variants.spec.ts` — the matrix: every axis (`variant`, `color`, `density`, `shape`, `type`,
  placements, modes) over all its values with `it.each`; the defaults; the combinations that
  change the markup; slots; state modifier classes.
- `interaction.spec.ts` — behaviour: events and `v-model`, disabled / readonly / loading,
  focus, timers, and the server's first frame through `renderToString` where it matters.
- `a11y.spec.ts` — accessibility as explicit assertions: the role (native first); the name
  (`label`, `aria-label`, `aria-labelledby`); states (`aria-checked`, `-pressed`,
  `-expanded`, `-selected`, `-current`, `-disabled`, `-invalid`, `-busy`); relations
  (`aria-describedby`, and `aria-controls` pointing at an id that exists); hidden decoration
  (`aria-hidden`); live regions; focus order.

An aspect that outgrows its file gets its own: `keyboard.spec.ts`, `form.spec.ts`, and so
on. A sub-component (`tab`, `item`, `group`) gets its own `describe` in the same files or a
`tests/` folder of its own. There is no `index.spec.ts` beside a component. A composable or
util keeps its spec beside itself (`composables/<x>/useX.spec.ts`, `utils/<x>/x.spec.ts`),
not in the component's folder.

**Shape.** One `mount()` helper at the top of the file — or in `tests/helpers.ts` when the
files share it — mounts with `mountSuspended`, unmounts the previous wrapper first, and is
cleaned up in `afterEach`:

```ts
let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  current?.unmount()
  current = await mountSuspended(MTextarea, { props })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})
```

Describes are named `'m-<name> · variants'` (`· interaction`, `· a11y`), with nested describes
per axis or aspect; a matrix is an `it.each` table, not a loop of `it`.

**What stays in e2e.** axe runs only in e2e (`expectNoAxeViolations` in
`playground/e2e/support.ts`), never in a unit spec. So does whatever happy-dom does not
compute: geometry, layout, `:dir(rtl)`, `(pointer: coarse)`. happy-dom also has DOM globals
the server lacks, so code that runs during render is proven by `renderToString` or by e2e,
not by a mounted spec.

`import.meta.dev` is `false` in Vitest, so a dev-only warning (a missing name, a missing
phrase) cannot be asserted in a unit spec. The e2e checks it on the dev server through
`page.on('console')` and skips itself under `CI || E2E_PROD`, because a production build
compiles the warning out; the unit spec leaves a one-line note where the case would be.

**Rules.** A test states the expected behaviour. A bug it finds outside the change at hand
stays as an `it.todo('…')` with the bug described in the change summary — never an
`it.fails`, never an assertion bent until it is green.

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
