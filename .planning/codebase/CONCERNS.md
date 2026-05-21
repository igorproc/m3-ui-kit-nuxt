# Codebase Concerns

**Analysis Date:** 2026-05-21

## Tech Debt

**Trigonometry Logic Inlining:**
- Issue: Coordinate math and angle translations are inlined inside `app/components/ui/time-picker/dial/index.vue` instead of being completely extracted to `app/composables/time/useTimePicker.ts`.
- Files: `app/components/ui/time-picker/dial/index.vue` (lines ~137-170)
- Why: Implemented quickly during dial drag-and-drop prototyping.
- Impact: Highly specialized math logic is duplicated or inaccessible for other rotational selector components.
- Fix approach: Refactor `useTimePicker.ts` to expose clean coordinate-to-angle converters and ring calculation helpers.

**Window-Level Event Binding on Touch Drag:**
- Issue: Global `window` event listeners are manually registered on touch start/drag start and cleaned up on release.
- Files: `app/components/ui/time-picker/dial/index.vue` (lines ~172-210)
- Why: Standard way to capture mouse/touch events outside of the dial face boundaries during drag.
- Impact: If touch releases fail to fire correctly or multiple pickers are active, it could lead to listener collisions or memory leaks.
- Fix approach: Encapsulate drag events using VueUse `useMouseInElement` or a robust composable hook that automates cleanup.

## Known Bugs

- **None currently identified:** Dial touch and keyboard input methods sync coordinates correctly on testing.

## Security Considerations

**Dynamic User Input Styling Injection:**
- Risk: Themes are generated dynamically based on client config or cookies. If a user overrides cookie values with complex injection strings, it might cause style sheet compilation errors, but CSS variable escaping prevents standard XSS.
- Current mitigation: Basic validation inside the store (`app/store/theme.ts`) checks if cookie value matches one of the allowed theme palettes or contrast categories before rendering.
- Recommendations: Ensure robust, strict schema-based sanitization of incoming theme values before mapping them directly onto head tags in SSR.

## Performance Bottlenecks

**CSS compile overhead:**
- Problem: SASS deep maps resolving.
- Files: `app/assets/stylesheet/abstracts/_functions.scss` (lines ~40-74)
- Cause: Deep recursive loops over multi-nested configuration tokens (like `material-map()` and `g()`) happen at compile time, slightly slowing down cold compilation starts.
- Improvement path: Cache resolved token structures or pre-compile static M3 values for production.

## Fragile Areas

**Dual-Ring hours selector logic:**
- File: `app/components/ui/time-picker/dial/index.vue` (lines ~81-112)
- Why fragile: Dual-ring logic (outer ring for 0-11, inner ring for 12-23) depends on strict mathematical ratio mapping (`Math.hypot(dx, dy) < (rect.width / 2) * 0.72`).
- Common failures: Small viewport sizing changes the face radius dynamically, shifting the ring boundary and triggering wrong hours values on standard click events.
- Safe modification: Add comprehensive visual tests and size-independent ratio measurements.

## Scaling Limits

- **None:** Purely static/client-rendered and SSR library components. Scaling is constrained only by browser viewport rendering speeds.

## Dependencies at Risk

- **`flubber` ^0.4.2:** Used for fluid path transformations. It is a legacy library that is not actively maintained and has limited support for modern ES environments without bundler transpilation.

## Missing Critical Features

**A11y Keyboard Accessibility on Dial Pickers:**
- Problem: Rotational SVG dial currently has no simple, standard keyboard arrow keys navigation (e.g. using left/right to decrease/increase hours).
- Current workaround: Users must switch the picker mode to `keyboard` to type the time manually.
- Blocks: Strict WCAG / Material 3 accessibility compliance.
- Implementation complexity: Medium (implement arrow key listeners that rotate the dial selector knob reactively).

## Test Coverage Gaps

**UI Components Test Cases:**
- What's not tested: Component rendering, theme switches, layout configurations, and drag tracking.
- Risk: Layout adjustments or style sheet changes might break components visually or disrupt coordinates math unnoticed.
- Priority: High
- Difficulty to test: High (requires setting up browser-based testing for touch coordinates and visual snapshots in Playwright).

---

*Concerns audit: 2026-05-21*
*Update as issues are fixed or new ones discovered*
