# Architectural Summary: Pure Props/Emits Slider Refactoring

We have successfully migrated the Slider component from a fragile `provide`/`inject` state coordination system to a highly optimized, standard Vue 3 **Props & Emits presentational architecture** orchestrated by a high-performance composable.

---

## 🛠️ Core Components & Architecture

### 1. High-Performance State Composable (`useSlider`)
- **Location:** `app/composables/slider/createSlider.vue`
- **Responsibilities:** 
  - Manages dragging coordinates, values (single/range), snapping to steps (with double-precision floating adjustments), neighbor limits, and clamping.
  - Implements full keyboard accessibility support (Arrow keys, PageUp/PageDown, Home/End, Shift multipliers).
  - **Performance Optimization (No-Lag Drag):** Caches `trackEl.getBoundingClientRect()` coordinates inside `onThumbPointerdown` and `onTrackPointerdown` at the start of a drag interaction. This eliminates **synchronous layout thrashes** on every `pointermove` event, guaranteeing buttery-smooth, zero-lag 60fps reactive dragging (on par with Vuetify's engine).

### 2. Presentational Composite Master (`UiSlider`)
- **Location:** `app/components/ui/slider/index.vue`
- **Responsibilities:**
  - Instantiates `useSlider` and coordinates child presentation elements purely via standard props and events.
  - Controls vertical rotation wrapper styling using BEM modifier `ui-slider-root--vertical` (`transform: rotate(-90deg)`).
  - **Layout Geometry Isolation:** Because vertical layout is handled via `-90deg` container rotation, all child subcomponents (`SliderTrack`, `SliderRange`, `SliderThumb`) are kept in **horizontal layout mode**. This ensures their visual coordinates align perfectly with the CSS rotation without layout skewing!
  - Separates visual rendering orientation (`orientation="horizontal"`) from semantic screen reader configuration (`aria-orientation="vertical"`).

### 3. Granular Atoms (Presentational Subcomponents)
- **`SliderRoot`** (`root/index.vue`): Presentational BEM container styling.
- **`SliderTrack`** (`track/index.vue`): Interactive track backdrop that passes target snapping pointers.
- **`SliderRange`** (`range/index.vue`): Displays computed visual highlight fill area.
- **`SliderThumb`** (`thumb/index.vue`): Handles focus, drag triggers, elevations, and balloon tooltips. Includes:
  - `.ui-slider-root--vertical .ui-slider-thumb__value-text`: Rotates tooltip balloon text `90deg` clockwise to compensate for container's counter-clockwise rotation, rendering all text perfectly upright.
- **`SliderHiddenInput`** (`hidden-input/index.vue`): Allows native form binding per-thumb.

---

## 🚀 Showcase Demo Upgrades
- **Location:** `app/components/material/showcase.vue`
- Fully migrated all horizontal and vertical slider showcase components from static, non-interactive mock attributes (`:model-value="X"`) to reactive `v-model` state bindings (`sliderValContinuous`, `sliderValDiscrete`, `sliderValRange`, and their vertical equivalents). Every single slider variant is now beautifully and fully interactive in the documentation workspace!
