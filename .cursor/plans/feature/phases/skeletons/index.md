# Skeleton system phase

<identity>
Status: separate future phase · Origin: `VSkeletonLoader` delta plus product-wide loading-layout requirement · Scope: skeleton primitives and recipes for the complete PrimeTime component library
</identity>

<reason-for-separate-phase>
The required work is not one generic `MSkeletonLoader`. PrimeTime needs a coordinated skeleton system whose geometry mirrors real components, preserves layout during loading, shares motion/accessibility policy and stays maintainable as component APIs evolve. Treating it as a small Vuetify parity component would under-specify the larger redesign.
</reason-for-separate-phase>

<goals>
- Define a small set of token-driven skeleton primitives.
- Define named, typed recipes aligned with every applicable UI component.
- Preserve final component dimensions and responsive layout to prevent CLS.
- Centralize shimmer/pulse/static and reduced-motion behavior.
- Keep skeletons decorative while the owning region exposes loading state.
- Provide a repeatable workflow for adding/updating recipes with components.
</goals>

<candidate-foundation>
Potential primitives, pending dedicated review:

```text
MSkeleton
├── text line/block
├── circle/avatar
├── rectangle/media
└── custom slot/recipe geometry

MSkeletonLoader
├── loading/content switch
├── named recipe
├── aria-busy owner wiring
└── animation policy
```

Exact public names and whether loader/wrapper is needed are not approved. The phase must prefer composable primitives and static Sass recipes over a large runtime template parser.
</candidate-foundation>

<component-recipes>
Audit every visual component and classify it as:

- dedicated recipe required: card, list item, table/rows, form field, navigation item, dialog content, calendar/data views and other structured surfaces;
- primitive composition sufficient: avatar, chip, button-like placeholders and media;
- skeleton inappropriate: transient overlays, purely interactive controls whose disabled/loading state is clearer, and components with no reservable content geometry.

Recipes follow component token dimensions rather than copying literals. A component refactor that changes geometry must update its skeleton recipe/tests in the same change.
</component-recipes>

<architecture-decisions>
- Public primitive vs recipe API and typed recipe names.
- Co-location of recipes with real component tokens versus central skeleton directory.
- Sass mixins/maps capable of sharing geometry without coupling runtime components.
- Responsive recipe selection without client viewport branching.
- Repeated rows/items and deterministic variation without hydration mismatch.
- Content wrapper behavior: `loading`, `boilerplate`, eager content preservation and transition.
- Whether docs generate recipe previews/catalogue automatically.
</architecture-decisions>

<motion>
One system policy supports shimmer, pulse or static rendering. `prefers-reduced-motion` disables moving gradients and uses a static tokenized surface. Animation durations/easing/colors come from the skeleton token system; individual recipes cannot invent animation.
</motion>

<accessibility>
Skeleton geometry is `aria-hidden`. The owning content region communicates `aria-busy` and an optional localized loading label. Skeletons never expose fake headings/buttons/rows to assistive technology and never enter focus order. When real content replaces them, announcements are consumer/region-owned rather than emitted once per primitive.
</accessibility>

<ssr>
Dimensions, recipe structure and repeated item count must be deterministic on SSR. Responsive behavior uses static CSS breakpoints/container queries. No random widths, mounted measurement or client-only recipe branch may create hydration mismatch.
</ssr>

<reuse>
Canonical component geometry/token maps, system shapes/colors/motion, reduced-motion mixins and existing loading semantics. Do not create a data-fetch wrapper, async store, duplicated component markup or runtime CSS-variable design system.
</reuse>

<non-goals>
- no automatic inference of skeletons from arbitrary rendered DOM;
- no loading/data-fetch ownership;
- no one-to-one Vuetify preset copy;
- no mandatory skeleton for every component when progress/disabled content is better UX;
- no placeholder markup announced as real content.
</non-goals>

<phase-deliverables>
1. Full component audit and recipe matrix.
2. Approved primitives and typed contracts.
3. Shared nested token/motion architecture.
4. Initial high-value recipes and component integration examples.
5. Visual regression, responsive, reduced-motion, SSR and a11y test harness.
6. Docs catalogue and contribution checklist requiring recipe parity where applicable.
</phase-deliverables>

<promotion-gate>
Begin implementation only after the component recipe matrix and token-sharing strategy are reviewed. Until then, product loading states continue using existing progress/loading components or bespoke composition where unavoidable.
</promotion-gate>

