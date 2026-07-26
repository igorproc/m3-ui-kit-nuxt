# Docs v2: M3 × Vuetify button page

## Scope

- Rebuilt the `m-button` component page around five routed sections: Overview, Specs, Guidelines, Accessibility, and Tokens + API.
- Kept content server-driven and localized in EN/RU.
- Added separate Button-family documentation shells for icon button, FAB, extended FAB, segmented button, and split button.

## Page composition

- The section toolbar is outside `m-container`, uses real `m-button` links, and is sticky relative to document scroll.
- `DocsOnThisPage` uses a scroll spy, updates the URL hash, and animates a rounded indicator between the active block links.
- `DocsOnThisPage` is removed from grid flow and lives in an absolutely positioned side region whose inner surface is sticky.
- Docs locally resets `overflow-y` on its direct `m-layout-main`; the kit layout implementation remains unchanged and the page is the only scroll root.
- The toolbar has two M3-like states: a wide, taller, shadowless state while the hero is present, and a compact sticky state after it reaches the layout inset.
- Compact width is measured from the real article `m-container`, while compact height and elevation return to the existing kit toolbar treatment through a 300ms emphasized transition.
- The component hero has transform/opacity ambient layers controlled by the existing global motion pause state and reduced-motion preference.

## Content renderers

- Replaced the generic rich-content renderer with dedicated `text`, `usage`, `anatomy`, `states`, `accessibility`, and `guidance` blocks.
- Added live Button overview, anatomy, state, semantic color, content, behavior, accessibility, and do/don't figures.
- Variants are described individually with emphasis, use/avoid guidance, a live example, and copyable markup.
- Added a server-derived token dependency map with selectable token sets, state groups, search, and system-token relationships.

## Data and routing

- `/components/button/examples` resolves to `/components/button/specs`.
- The Reference section order is Playground, Token map, API; the duplicated flat Design tokens block is intentionally omitted from the Button page.
- EN/RU block and section identities remain structurally aligned.

## Verification

- `npm run docs:validate`: 19 files validated for two locales.
- Targeted ESLint and Stylelint checks passed for the changed navigation, page, block, renderer, schema, and service files.
- Browser QA confirmed document-only scrolling, sticky toolbar/TOC geometry, the expanded width contraction, and compact horizontal toolbar overflow.
- Nuxt dev/build and Vitest were intentionally not run for this correction cycle.

## Follow-up

- Visual QA should be performed in the already running docs app at expanded and compact widths.
- If additional design changes are requested, record the proposed block/data changes in a plan or Markdown note before implementation.

## Lazy docs block resolution

- Replaced eager block component imports with stable `defineAsyncComponent` wrappers backed by Vite-compatible relative dynamic imports.
- `resolveDocsBlock` now accepts generic `key` and `basePath` values; the default logical path is `~/components/docs/block/` and the default key type contains every public block renderer.
- The runtime allow-list excludes the internal `shell.vue` helper and preserves the explicit missing-renderer error.
- Added docs-local auto-import scanning for `app/utils/**` and `shared/**`. `DocsPageRenderer` keeps an explicit resolver import because template-only identifiers are not injected into the SSR setup context by Nuxt auto-imports.
- Targeted ESLint passed for the resolver, renderer, and Nuxt config. Nuxt build and tests were not run.
