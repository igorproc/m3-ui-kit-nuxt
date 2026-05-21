# Toolbar M3 Component Implementation

## Overview
Successfully implemented the Material Design 3 `Toolbar` component (`m-toolbar`) utilizing the Zero-Runtime SCSS architecture. The component supports a versatile API, allowing both a data-driven approach (via the `items` array) and a fully manual template-driven approach (via slots).

## Key Achievements

1. **SCSS Tokens Architecture (`_index.scss`)**
   - Created a nested hierarchical token map strictly following the `list/item` standard, separating concerns into `container` and `icon` structures for both `standard` and `baseline` variants.
   - Replaced raw box-shadows with robust `color-mix` compositions for elevation. The Level 2 elevation is accurately broken down into `umbra`, `penumbra`, and `ambient` components, reacting dynamically to the global `var(--color-shadow)` variable for perfect Dark/Light mode support.

2. **Component Logic (`index.vue`)**
   - Integrated `MButton` and `MIconButton` seamlessly. The toolbar intelligently picks the correct button type depending on whether an `icon` or `label` is provided in the item data.
   - Implemented dynamic `variant` switching: items inside the toolbar automatically alternate between `text` (default) and `tonal` (selected) variants.
   - Designed responsive layout modifiers: `layout="horizontal" | "vertical"` and `variant="standard" | "baseline"` (for Bottom App Bar patterns).

3. **Documentation API & Integration**
   - Scaffolded the API metadata files (`server/data/ru/toolbar.json` and `en/toolbar.json`), resolving component data fetching errors in the Nuxt documentation app.
   - Adapted the `toolbar.vue` page template to render the documentation structure properly.

4. **Interactive Playground (`Playground.vue`)**
   - Built an interactive testing environment demonstrating three core use cases:
     - **Interactive API**: Live state manipulation, variant switching, and data-binding testing.
     - **Text Editor (Slots)**: Demonstrating manual alignment group setups using radio-like selection logic and toolbar dividers.
     - **Bottom App Bar**: Showcasing the `baseline` variant in a mobile layout, using `items` tracking alongside dynamic spacing elements (`v-if="item.id === 'spacer'"` with `flex-grow: 1`).
   - Ensured perfect typography alignment by applying standard `@include typescale(...)` to the playground information blocks.

## Next Steps
- Consider enhancing keyboard accessibility (arrow key navigation between toolbar items).
- Link tooltips natively to toolbar items for improved UX on icon-only buttons.
