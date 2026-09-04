<template>
  <div
    class="ui-slider-thumb"
    :class="[
      { 'ui-slider-thumb--vertical': orientation === 'vertical' },
      { 'ui-slider-thumb--dragging': isDragging },
      { 'ui-slider-thumb--disabled': disabled },
      { 'ui-slider-thumb--readonly': readonly },
    ]"
  >
    <div class="ui-slider-thumb__state-layer" />

    <div class="ui-slider-thumb__knob" />

    <div
      v-if="showValue"
      class="ui-slider-thumb__value-label"
    >
      <span class="ui-slider-thumb__value-text">
        <slot
          name="value"
          :value="value"
        >
          {{ value }}
        </slot>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Presentation only. Role, tabindex, `aria-value*`, axis position and the
 * pointer/keyboard handlers arrive as fallthrough attrs from
 * `useSliderControl().getThumbAttrs(index)` — the same bag any consumer can
 * spread onto their own markup.
 */
interface Props {
  value: number
  showValue?: boolean
  disabled?: boolean
  readonly?: boolean
  orientation?: 'horizontal' | 'vertical'
  isDragging?: boolean
}

withDefaults(defineProps<Props>(), {
  showValue: false,
  disabled: false,
  readonly: false,
  orientation: 'horizontal',
  isDragging: false,
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/slider/thumb/index' as t;

$prefix: 'ui-slider-thumb';

.ui-slider-thumb {
  $t: material-map(t.$tokens, $prefix);

  position: absolute;
  top: 50%;

  // The control bag positions the box edge (`left`/`bottom: <percent>`); the
  // translate is what puts the knob's centre on that percentage.
  transform: translate(-50%, -50%);
  width: 48rem;
  height: 48rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  z-index: 2;
  box-sizing: border-box;

  &--vertical {
    top: auto;
    left: 50%;
    transform: translate(-50%, 50%);
  }

  &--disabled {
    cursor: default;
    pointer-events: none;
  }

  &--readonly {
    cursor: default;
  }

  // Thumb Knob
  &__knob {
    width: g($t, 'size');
    height: g($t, 'size');
    border-radius: var(--sys-shape-corner-full, 50%);
    background-color: g($t, 'color');
    box-shadow: g($t, 'elevation.shadow');
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
    z-index: 2;
  }

  // Ripple / Hover State Layer
  &__state-layer {
    position: absolute;
    width: g($t, 'state.layer.size');
    height: g($t, 'state.layer.size');
    border-radius: 50%;
    background-color: g($t, 'color');
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    z-index: 1;
  }

  &:hover &__state-layer {
    opacity: g($t, 'state.layer.hover.opacity');
  }

  &:focus-visible &__state-layer,
  &--dragging &__state-layer {
    opacity: g($t, 'state.layer.pressed.opacity');
  }

  // Pin Value Label Tooltip
  &__value-label {
    position: absolute;
    bottom: 34rem; // Positioned above knob
    left: 50%;
    transform: translateX(-50%) scale(0);
    transform-origin: bottom center;
    display: flex;
    align-items: center;
    justify-content: center;
    width: g($t, 'tooltip.width');
    height: g($t, 'tooltip.height');
    z-index: 3;
    pointer-events: none;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      width: g($t, 'tooltip.width');
      height: g($t, 'tooltip.width'); // matches width to make a circle
      background-color: g($t, 'tooltip.background');
      border-radius: 50% 50% 0; // sharp point at bottom-right
      transform: rotate(45deg); // rotate to position point at bottom-center
      z-index: -1;
    }
  }

  &__value-text {
    position: relative;
    top: -4rem; // raise text inside balloon
    color: g($t, 'tooltip.color');

    @include apply-typography(g($t, 'tooltip.typography'));
  }

  // CSS active triggers for tooltip
  &:hover &__value-label,
  &:focus-visible &__value-label,
  &--dragging &__value-label {
    transform: translateX(-50%) scale(1);
  }

  // Adjust Tooltip for vertical orientation
  &--vertical &__value-label {
    inset: 50% 34rem auto auto; // Left side visually
    transform: translateY(-50%) scale(0);
    transform-origin: center right;

    &::before {
      top: 50%; // vertically centre the balloon next to the knob
      border-radius: 50% 50% 0; // sharp corner = bottom-right (same as horizontal)
      transform: translateY(-50%) rotate(-45deg); // point toward the knob (right)
    }
  }

  &--vertical &__value-text {
    top: 0;
    left: -4rem;
  }

  &--vertical:hover &__value-label,
  &--vertical:focus-visible &__value-label,
  &--vertical.ui-slider-thumb--dragging &__value-label {
    transform: translateY(-50%) scale(1);
  }
}
</style>
