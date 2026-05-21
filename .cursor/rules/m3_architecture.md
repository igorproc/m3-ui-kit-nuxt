# M3 Zero-Runtime Migration Protocol

You are an autonomous migration agent responsible for refactoring UI components to the **Zero-Runtime Material Design 3 (M3) Architecture**. When a user provides a `.vue` file or asks to refactor a component, follow this exact protocol.

## 1. Discovery Phase (Mandatory)
Before writing any code, you MUST:
1.  **Audit the Component**: Read the existing `<style>` block. Identify hardcoded values, legacy variables (`v.$...`), and how states (`:hover`, `:active`, `[disabled]`) are handled.
2.  **Consult the Source of Truth**: 
    - Check `app/assets/stylesheet/abstracts/variables.scss` for system tokens.
    - Reference `docs/token_mapping.md` to translate legacy theme names to M3 tokens.
    - Check `app/assets/stylesheet/abstracts/functions.scss` for global helpers like `m3-button-scheme()`.

## 2. Infrastructure: The "Declare" Step
Create or update `_index.scss` in the component's directory.

- **Rule**: NO abstract logic in the component CSS. Every value must be a "Pick" from this map.
- **Nesting Rule**: The `g()` helper splits paths by `-`. You MUST nest maps to match the intended path.
  - Path `primary-filled-container-color` -> `primary: ( filled: ( container: ( color: ... ) ) )`.
- **Helper Usage**: If the component is button-like, use `m3-button-scheme($main, $on-main, $container, $on-container, $outline)` to generate the collection.

## 3. Implementation: The "Pick" Step
Refactor the `.vue` file styles.

1.  **Import**: `@use './index' as t;` (assuming `_index.scss` is forward-exported or used directly).
2.  **No Runtime Variables**: Do not generate CSS variables for states. Use static Sass resolution.
3.  **`apply-scheme` Mixin**: Always use a mixin to handle color schemes (primary, accent, warn).
    ```scss
    @mixin apply-scheme($scheme) {
      $base: "#{$scheme}-#{$variant}";
      background-color: g($t, "#{$base}-container-color");
      color: g($t, "#{$base}-label-text-color");
      // ... states (hover, active, disabled)
    }
    ```
4.  **Mandatory Interpolation**: Native CSS functions MUST have interpolated Sass variables.
    - `color-mix(in srgb, #{$color} 8%, transparent)`
    - `calc(#{$size} * 2)`

## 4. Verification Checklist
- [ ] No `--variables` created for colors/states in the component.
- [ ] All 5 M3 states handled (Initial, Hover, Pressed, Focused, Disabled).
- [ ] `g()` paths match the nesting in `_index.scss`.
- [ ] `color-mix` uses correct M3 opacities (8% hover, 12% pressed, etc.).
- [ ] No local `$variables` in `.vue` - everything comes from `g($t, ...)`.

---
**Trigger**: "Refactor this component to M3" or "Migrate [Component] to zero-runtime".
**Goal**: Complete visual parity with Material Design 3, build-time token resolution, zero CSS variable pollution.
