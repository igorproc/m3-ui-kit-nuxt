<template>
  <button
    v-ripple="!disabled"
    class="ui-fab"
    :class="[
      `ui-fab--${color}`,
      `ui-fab--${size}`,
    ]"
    :disabled="disabled"
  >
    <span class="ui-fab__icon">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  color?: 'primary' | 'surface' | 'secondary' | 'tertiary'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  size: 'medium',
  disabled: false,
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/button/fab' as t;

.ui-fab {
  $prefix: 'm3-fab';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  outline: none;
  box-shadow: g($t, 'elevation-resting');
  transition:
    box-shadow g($t, 'motion-duration') g($t, 'motion-easing'),
    background-color g($t, 'motion-duration') g($t, 'motion-easing');

  &__icon {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color g($t, 'motion-duration') g($t, 'motion-easing');
  }

  @mixin apply-scheme($scheme) {
    background-color: g($t, '#{$scheme}-container-color');
    color: g($t, '#{$scheme}-icon-color');

    &:hover {
      background-color: g($t, '#{$scheme}-container-hover-color');
    }

    &:focus-visible {
      background-color: g($t, '#{$scheme}-container-pressed-color');
    }

    &:active {
      background-color: g($t, '#{$scheme}-container-pressed-color');
    }

    &:disabled {
      background-color: g($t, '#{$scheme}-container-disabled-color');
      color: g($t, '#{$scheme}-icon-disabled-color');
    }
  }

  @mixin apply-size($size) {
    width: g($t, '#{$size}-container-size');
    height: g($t, '#{$size}-container-size');
    border-radius: g($t, '#{$size}-container-shape');

    .ui-fab__icon {
      font-size: g($t, '#{$size}-icon-size');
    }
  }

  // Schemes
  &--primary { @include apply-scheme('primary'); }
  &--secondary { @include apply-scheme('secondary'); }
  &--tertiary { @include apply-scheme('tertiary'); }
  &--surface { @include apply-scheme('surface'); }

  // Sizes
  &--small { @include apply-size('small'); }
  &--medium { @include apply-size('medium'); }
  &--large { @include apply-size('large'); }

  // Interactions
  &:hover {
    box-shadow: g($t, 'elevation-hover');
  }

  &:active {
    box-shadow: g($t, 'elevation-pressed');
  }

  &:disabled {
    box-shadow: none;
    cursor: default;
    pointer-events: none;
  }
}
</style>
