# Motion & Docs Refactoring

## 1. Navigation Rail Enhancement
- **Component Separation**: Extracted the inner item logic from `MNavigationRail` into a new, dedicated `<m-navigation-rail-item>` component (`kit/app/components/ui/navigation-rail/item/index.vue`).
- **Expanded State Support**: 
  - Added an `expanded` prop to the Navigation Rail and propagated it down to individual items.
  - Added `.ui-navigation-rail__item--expanded` CSS modifiers.
  - Implemented smooth layout transitions. When expanded (from `80rem` to `256rem`), the active indicator shifts and stretches to encompass both the icon and label in a horizontal layout.
- **Documentation**: Updated `navigation-rail.json` to expose the `expanded` boolean property, allowing interactive testing in the Playground.

## 2. Expansion Panel Motion Smoothness
- **Jank/Stutter Fix**: Fixed the jagged expansion/collapse animation on the `MExpansionPanel` (`kit/app/components/ui/expansion-panel/index.vue`).
- **Implementation**: Created an inner `.ui-expansion-panel__content-inner` wrapper with `overflow: hidden`. Padding was moved to this inner container so the outer wrapper can animate its `grid-template-rows` from `0fr` to `1fr` flawlessly without layout conflicts.

## 3. Loading & Progress Components
- **API Spec Verification**: Checked the components against MD3 Figma specs.
- **Playground Exposure**: Populated `loading.json` and `progress.json` with the correct component props, matching the actual implementation and exposing them for testing.

## 4. Documentation App Redesign (Dogfooding)
Refactored the core Nuxt documentation application layout elements (`docs/app/components/*`) to utilize the native PrimeTime UI Kit components rather than hardcoded HTML:
- **DocsHeader.vue**: Replaced native tags with `<m-app-bar>`, `<m-text-field>` (for search), and `<m-button variant="text">` elements.
- **DocsSidebar.vue**: Fully replaced the custom rail and drawer containers. Now uses the native `<m-navigation-rail>` and `<m-navigation-drawer>` components. The navigation items correctly utilize `<m-button tag="link">`.
- **DocsPlayground.vue & DocsTokenTable.vue**: Replaced all native `<input type="text">` controls with `<m-text-field>` components.
