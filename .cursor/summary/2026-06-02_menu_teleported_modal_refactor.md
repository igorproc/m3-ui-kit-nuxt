# Summary: Teleported Menu Component to Prevent Overflow Clipping
**Date**: 2026-06-02

## 🚀 Key Actions & Refactorings
- **Teleported Menu Implementation**:
  - Refactored `ui/menu/index.vue` to render via `<teleport to="body">` when opened.
  - Implemented dynamic positioning logic using `getBoundingClientRect()` of the trigger's sibling placeholder (`anchorRef`) inside the layout tree.
  - Keeps the component structurally clean while positioning it cleanly above any parent containers styled with `overflow: hidden`.
  - Added support for `matchWidth` to automatically span the exact width of the trigger elements (essential for dropdown menus).
  - Handles screen resize and viewport scrolls dynamically to stay locked to the trigger anchor.
- **Dropdown & Outside Clicks Integration**:
  - Updated `ui/dropdown/index.vue` to pass `match-width` to the teleported menu.
  - Updated `onClickOutside` trigger on the dropdown component to ignore click events occurring inside the teleported menu element (`.ui-menu__surface`), allowing selections and toggles to register without premature closures.

## 📋 Status Overview
- **Menu Component**: ✅ Teleported to body with fixed alignment.
- **Dropdown Integration**: ✅ Integrated with `match-width` and robust click outside exclusions.
