# Summary: Native CSS Anchor Positioning with JS Fallback for Menu Component
**Date**: 2026-06-02

## 🚀 Key Actions & Refactorings
- **Native CSS Anchor Positioning Integration**:
  - Refactored `ui/menu/index.vue` to detect support for native CSS Anchor Positioning (`CSS.supports('position-anchor: --a') || CSS.supports('anchor-name: --a')`).
  - If supported, the menu uses native, browser-driven anchor positioning layout rules:
    - Sets unique `anchor-name: --menu-anchor-[id]` inline style on the trigger element.
    - Sets `position-anchor: --menu-anchor-[id]`, `position-area: bottom left|right`, and `inset: unset` on the teleported menu element.
    - If `matchWidth` is true, sets `width: anchor-size(width)` inline.
  - This eliminates all scroll/resize lag, DOM layout thrashing, and JS overhead on modern browsers (Chrome/Edge 125+, Safari 18+).
  - Implements a robust JS positioning fallback for legacy browsers so that they still render correctly.

## 📋 Status Overview
- **Native Anchor Support**: ✅ Implemented in `UiMenu` using progressive enhancement.
- **Trigger Registration**: ✅ Handled automatically via dynamic style injection on trigger parent.
- **Sizing Alignment**: ✅ Leveraged native `anchor-size(width)` for matched dropdown width.
