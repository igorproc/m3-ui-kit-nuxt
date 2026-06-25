<template>
  <button
    v-ripple="!isDisabled"
    class="ui-extended-fab"
    :class="[
      `ui-extended-fab--${color}`,
      `ui-extended-fab--${variant}`,
      `ui-extended-fab--${size}`,
      {
        'ui-extended-fab--disabled': isDisabled,
        'ui-extended-fab--loading': loading,
      },
    ]"
    :disabled="isDisabled"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span
      v-if="loading"
      class="ui-extended-fab__spinner"
      aria-hidden="true"
    />
    <span
      v-else-if="$slots.prepend"
      class="ui-extended-fab__icon"
    >
      <slot name="prepend" />
    </span>
    <span class="ui-extended-fab__label">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mExtendedFabProps } from './props'

const props = defineProps(mExtendedFabProps)

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/button/extended-fab' as t;

.ui-extended-fab {
  $prefix: 'm3-extended-fab';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  outline: none;
  padding-inline: g($t, 'container-padding-md');
  gap: g($t, 'container-gap-md');
  box-shadow: g($t, 'container-elevation-resting');
  transition:
    box-shadow g($t, 'motion-duration') g($t, 'motion-easing'),
    background-color g($t, 'motion-duration') g($t, 'motion-easing');

  @include typescale('label-large');

  &__icon,
  &__label,
  &__spinner {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
  }

  &__spinner {
    width: g($t, 'icon-size-md');
    height: g($t, 'icon-size-md');
    border: 2rem solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ui-extended-fab-spin 0.6s linear infinite;
  }

  // Applies one variant's surface treatment for the active scheme.
  @mixin apply-surface($scheme, $variant) {
    $base: '#{$scheme}-#{$variant}';

    background-color: g($t, '#{$base}-container-color');
    color: g($t, '#{$base}-content-color');

    &:hover:not(.ui-extended-fab--disabled) {
      background-color: g($t, '#{$base}-container-hover-color');
    }

    &:focus-visible:not(.ui-extended-fab--disabled),
    &:active:not(.ui-extended-fab--disabled) {
      background-color: g($t, '#{$base}-container-pressed-color');
    }

    &.ui-extended-fab--disabled {
      background-color: g($t, '#{$base}-container-disabled-color');
      color: g($t, '#{$base}-content-disabled-color');
    }
  }

  @mixin apply-scheme($scheme) {
    $variants: ('filled', 'tonal');

    @each $v in $variants {
      &.ui-extended-fab--#{$v} {
        @include apply-surface($scheme, $v);
      }
    }
  }

  @mixin apply-size($size) {
    height: g($t, 'container-height-#{$size}');
    border-radius: g($t, 'container-shape-#{$size}');
    padding-inline: g($t, 'container-padding-#{$size}');
    gap: g($t, 'container-gap-#{$size}');

    .ui-extended-fab__icon {
      font-size: g($t, 'icon-size-#{$size}');
    }

    .ui-extended-fab__spinner {
      width: g($t, 'icon-size-#{$size}');
      height: g($t, 'icon-size-#{$size}');
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
  &:hover:not(.ui-extended-fab--disabled) {
    box-shadow: g($t, 'container-elevation-hover');
  }

  &:active:not(.ui-extended-fab--disabled) {
    box-shadow: g($t, 'container-elevation-pressed');
  }

  &--disabled,
  &--loading {
    box-shadow: none;
    cursor: default;
    pointer-events: none;
  }
}

@keyframes ui-extended-fab-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
