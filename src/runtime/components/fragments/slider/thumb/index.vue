<template>
  <div
    class="ui-slider-thumb"
    :class="[
      `ui-slider-thumb--${density}`,
      {
        'ui-slider-thumb--vertical': orientation === 'vertical',
        'ui-slider-thumb--dragging': isDragging,
        'ui-slider-thumb--disabled': disabled,
        'ui-slider-thumb--readonly': readonly,
        'ui-slider-thumb--value': showValue && valueShown,
      },
    ]"
  >
    <span class="ui-slider-thumb__handle" />

    <span
      v-if="showValue"
      class="ui-slider-thumb__value"
      aria-hidden="true"
    >
      <slot name="value">
        {{ text ?? value }}
      </slot>
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * Presentation only. Role, tabindex, `aria-value*`, axis position and the
 * pointer/keyboard handlers arrive as fallthrough attrs from
 * `useSliderControl().getThumbAttrs(index)` — the same bag any consumer can
 * spread onto their own markup. The value indicator repeats `aria-valuetext`
 * for the eye, so it is hidden from assistive tech.
 */
interface Props {
  value: number
  /** The value as words (`formatValue`); the number when absent. */
  text?: string
  showValue?: boolean
  /** The value indicator is up: pressed, dragged or stepped with the keyboard. */
  valueShown?: boolean
  density?: 'default' | 'comfortable'
  disabled?: boolean
  readonly?: boolean
  orientation?: 'horizontal' | 'vertical'
  isDragging?: boolean
}

withDefaults(defineProps<Props>(), {
  showValue: false,
  valueShown: false,
  density: 'default',
  disabled: false,
  readonly: false,
  orientation: 'horizontal',
  isDragging: false,
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/slider' as t;

.ui-slider-thumb {
  $t: material-map(t.$tokens, 'md-slider');

  // The 48 pointer target, centred on the handle. The control bag positions
  // its edge (`inset-inline-start: <percent>`); the translate puts the centre
  // on that percentage, from the right edge in RTL.
  position: absolute;
  inset-block-start: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: g($t, 'target');
  block-size: g($t, 'target');
  translate: -50% -50%;
  cursor: pointer;
  outline: none;
  touch-action: none;

  &:dir(rtl) {
    translate: 50% -50%;
  }

  &--disabled {
    cursor: default;
    pointer-events: none;
  }

  &--readonly {
    cursor: default;
  }

  &__handle {
    inline-size: g($t, 'handle.width');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'handle.color');
    transition: inline-size g($t, 'motion.duration') g($t, 'motion.easing');
  }

  @each $density in (default, comfortable) {
    &--#{$density} &__handle {
      block-size: g($t, 'density.#{$density}.handle');
    }

    &--#{$density} &__value {
      inset-block-end: calc(50% + #{g($t, 'density.#{$density}.handle')} / 2 + #{g($t, 'value.offset')});
    }
  }

  // Focused, pressed or dragged: the handle narrows (M3); hover changes only
  // the cursor (W3-А).
  &:focus-visible &__handle,
  &--dragging &__handle {
    inline-size: g($t, 'handle.narrow');
  }

  &:focus-visible &__handle {
    @include focus-ring;
  }

  &--disabled &__handle {
    background-color: g($t, 'disabled.handle');
  }

  // The value indicator: a capsule that grows with its text.
  &__value {
    position: absolute;
    inset-inline-start: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: g($t, 'value.min-width');
    block-size: g($t, 'value.height');
    padding-inline: g($t, 'value.padding');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'value.color');
    color: g($t, 'value.text');
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    scale: 0.8;
    translate: -50% 0;
    transform-origin: bottom center;
    transition:
      opacity g($t, 'motion.value.duration') g($t, 'motion.value.easing'),
      scale g($t, 'motion.value.duration') g($t, 'motion.value.easing');

    @include typescale(g($t, 'value.typography'));
  }

  &:dir(rtl) &__value {
    translate: 50% 0;
  }

  &--value &__value {
    opacity: 1;
    scale: 1;
  }

  &--dragging &__handle,
  &--dragging &__value {
    transition: none;
  }

  // Vertical: the box edge stands at the bottom percentage; the value sits
  // at the inline start, beside the handle.
  &--vertical {
    inset-block-start: auto;
    inset-inline-start: 50%;
    translate: -50% 50%;
  }

  &--vertical:dir(rtl) {
    translate: 50% 50%;
  }

  @each $density in (default, comfortable) {
    &--vertical.ui-slider-thumb--#{$density} &__handle {
      inline-size: g($t, 'density.#{$density}.handle');
      block-size: g($t, 'handle.width');
    }

    &--vertical.ui-slider-thumb--#{$density} &__value {
      inset-block-end: auto;
      inset-inline: auto calc(50% + #{g($t, 'density.#{$density}.handle')} / 2 + #{g($t, 'value.offset')});
    }
  }

  &--vertical:focus-visible &__handle,
  &--vertical.ui-slider-thumb--dragging &__handle {
    block-size: g($t, 'handle.narrow');
  }

  &--vertical &__value,
  &--vertical:dir(rtl) &__value {
    translate: 0;
    transform-origin: center right;
  }

  @include forced-colors {
    &__handle {
      background-color: Highlight;
    }

    &--disabled &__handle {
      background-color: GrayText;
    }

    &__value {
      border: 1px solid CanvasText;
    }
  }
}
</style>
