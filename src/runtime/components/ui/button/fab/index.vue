<template>
  <component
    :is="tag"
    v-ripple="rippleEnabled"
    :class="rootClass"
    v-bind="rootAttrs"
    :aria-label="ariaLabel"
  >
    <span
      v-if="loading"
      class="ui-fab__spinner"
      aria-hidden="true"
    >
      <MLoading inline />
    </span>
    <span
      v-else
      class="ui-fab__icon"
    >
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import MLoading from '#kit/components/ui/loading/index.vue'
import { useButton } from '#kit/composables/button/useButton'
import { useButtonNameWarning } from '#kit/composables/button/useButtonNameWarning'
import { useFabProps } from '#kit/composables/button/useFabProps'
import { mFabProps } from './props'

const props = defineProps(mFabProps)

const { tag, rootClass, rootAttrs, rippleEnabled } = useButton({
  block: 'ui-fab',
  props: useFabProps('m-button-fab', props),
})

useButtonNameWarning('m-button-fab', () => props.ariaLabel)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/fab' as t;

.ui-fab {
  $prefix: 'm3-fab';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  outline: none;
  box-shadow: g($t, 'elevation.resting');
  transition:
    box-shadow g($t, 'motion.duration') g($t, 'motion.easing'),
    background-color g($t, 'motion.duration') g($t, 'motion.easing');

  &:focus-visible {
    @include focus-ring;
  }

  // The container is only a background and a shadow, both dropped by forced colors.
  @include forced-colors {
    border: 1px solid ButtonText;
  }

  &__icon {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color g($t, 'motion.duration') g($t, 'motion.easing');
  }

  &__spinner {
    position: relative;
    z-index: 1;
    display: inline-flex;
    line-height: 0;
  }

  // One variant's surface for the active scheme. Focus and pressed are separate
  // layers, and pressed comes last: pressing a focused FAB still reads as a press.
  @mixin apply-surface($scheme, $variant) {
    $base: '#{$scheme}.#{$variant}';

    background-color: g($t, '#{$base}.container.color');
    color: g($t, '#{$base}.icon.color');

    @include can-hover {
      &:hover:not(.ui-fab--disabled) {
        background-color: g($t, '#{$base}.container.hover.color');
      }
    }

    &:focus-visible:not(.ui-fab--disabled) {
      background-color: g($t, '#{$base}.container.focus.color');
    }

    &:active:not(.ui-fab--disabled) {
      background-color: g($t, '#{$base}.container.pressed.color');
    }

    &.ui-fab--disabled {
      background-color: g($t, '#{$base}.container.disabled.color');
      color: g($t, '#{$base}.icon.disabled.color');

      @include forced-colors {
        border-color: GrayText;
        color: GrayText;
      }
    }
  }

  // Cross every MD3 role with every surface variant for DRY application.
  @mixin apply-scheme($scheme) {
    $variants: ('tonal', 'filled');

    @each $v in $variants {
      &.ui-fab--#{$v} {
        @include apply-surface($scheme, $v);
      }
    }
  }

  @mixin apply-density($step) {
    $d: 'density.#{$step}';

    width: g($t, '#{$d}.container.size');
    height: g($t, '#{$d}.container.size');
    border-radius: g($t, '#{$d}.container.shape');

    .ui-fab__icon,
    .ui-fab__spinner {
      font-size: g($t, '#{$d}.icon.size');
    }
  }

  // Schemes (MD3 color roles)
  &--primary { @include apply-scheme('primary'); }
  &--secondary { @include apply-scheme('secondary'); }
  &--tertiary { @include apply-scheme('tertiary'); }
  &--error { @include apply-scheme('error'); }

  &--compact { @include apply-density('compact'); }
  &--default { @include apply-density('default'); }
  &--comfortable { @include apply-density('comfortable'); }

  // Interactions
  @include can-hover {
    &:hover:not(.ui-fab--disabled) {
      box-shadow: g($t, 'elevation.hover');
    }
  }

  &:active:not(.ui-fab--disabled) {
    box-shadow: g($t, 'elevation.pressed');
  }

  &--disabled,
  &--loading {
    box-shadow: none;
    cursor: default;
    pointer-events: none;
  }
}
</style>
