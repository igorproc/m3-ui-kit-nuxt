# Summary: Removed High-Level closeCascade from Overlay System
**Date**: 2026-06-02

## 🚀 Key Actions & Refactorings
- **Decentralized Modal Control / API Simplification**:
  - Completely removed the high-level recursive `closeCascade` method from the `useModal` composable (`useModal.ts`).
  - Simplified the `M3ModalContext` interface to focus on a clean, low-level modal registration and visibility `close` control.
  - Aligned the codebase to empower developers/users with explicit, manual close control instead of magical top-down/bottom-up automated animation timelines.
- **Component Modifications**:
  - Replaced `closeCascade` with `close` in `sheet/index.vue`, `dialog/index.vue`, and `dialog/date/index.vue`.
  - Removed outdated exposed references in all component descriptors.
- **Showcase Synchronization**:
  - Updated the step-by-step nested overlay showcase inside `material/showcase.vue` to demonstrate manual state control (closing single levels via `.close()` or resetting state references, e.g., `@click="showNested3 = false; showNested2 = false; showNested1 = false"`).

## 📋 Status Overview
- **useModal Composable**: ✅ Simplified (No closeCascade logic remains).
- **Core Overlay Components**: ✅ Refactored to utilize clean low-level `close` controls.
- **Demo Verification**: ✅ Showcase updated to verify manual, programmatic workflows.
