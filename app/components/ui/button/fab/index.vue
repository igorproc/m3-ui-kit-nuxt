<template>
  <button
    v-ripple="!isDisabled"
    class="ui-fab"
    :class="[
      `ui-fab--${color}`,
      `ui-fab--${variant}`,
      `ui-fab--${size}`,
      {
        'ui-fab--disabled': isDisabled,
        'ui-fab--loading': loading,
      },
    ]"
    :disabled="isDisabled"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span
      v-if="loading"
      class="ui-fab__spinner"
      aria-hidden="true"
    />
    <span
      v-else
      class="ui-fab__icon"
    >
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mFabProps } from './props'

const props = defineProps(mFabProps)

const isDisabled = computed(() => props.disabled || props.loading)
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

  &__spinner {
    position: relative;
    z-index: 1;
    border: 2rem solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ui-fab-spin 0.6s linear infinite;
  }

  // Applies one variant's surface treatment for the active scheme.
  @mixin apply-surface($scheme, $variant) {
    $base: '#{$scheme}-#{$variant}';

    background-color: g($t, '#{$base}-container-color');
    color: g($t, '#{$base}-icon-color');

    &:hover:not(.ui-fab--disabled) {
      background-color: g($t, '#{$base}-container-hover-color');
    }

    &:focus-visible:not(.ui-fab--disabled),
    &:active:not(.ui-fab--disabled) {
      background-color: g($t, '#{$base}-container-pressed-color');
    }

    &.ui-fab--disabled {
      background-color: g($t, '#{$base}-container-disabled-color');
      color: g($t, '#{$base}-icon-disabled-color');
    }
  }

  // Cross every MD3 role with every surface variant for DRY application.
  @mixin apply-scheme($scheme) {
    $variants: ('filled', 'tonal');

    @each $v in $variants {
      &.ui-fab--#{$v} {
        @include apply-surface($scheme, $v);
      }
    }
  }

  @mixin apply-size($size) {
    width: g($t, '#{$size}-container-size');
    height: g($t, '#{$size}-container-size');
    border-radius: g($t, '#{$size}-container-shape');

    .ui-fab__icon {
      font-size: g($t, '#{$size}-icon-size');
    }

    .ui-fab__spinner {
      width: g($t, '#{$size}-icon-size');
      height: g($t, '#{$size}-icon-size');
    }
  }

  // Schemes (MD3 color roles)
  &--primary { @include apply-scheme('primary'); }
  &--secondary { @include apply-scheme('secondary'); }
  &--tertiary { @include apply-scheme('tertiary'); }
  &--error { @include apply-scheme('error'); }

  // Sizes
  &--sm { @include apply-size('sm'); }
  &--md { @include apply-size('md'); }
  &--lg { @include apply-size('lg'); }

  // Interactions
  &:hover:not(.ui-fab--disabled) {
    box-shadow: g($t, 'elevation-hover');
  }

  &:active:not(.ui-fab--disabled) {
    box-shadow: g($t, 'elevation-pressed');
  }

  &--disabled,
  &--loading {
    box-shadow: none;
    cursor: default;
    pointer-events: none;
  }
}

@keyframes ui-fab-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
