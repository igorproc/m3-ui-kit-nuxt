<template>
  <button
    v-ripple="!disabled"
    class="ui-extended-fab"
    :class="[
      `ui-extended-fab--${color}`,
      `ui-extended-fab--${size}`,
    ]"
    :disabled="disabled"
  >
    <span
      v-if="$slots.prepend"
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
  padding-inline: g($t, 'container-padding-medium');
  gap: g($t, 'container-gap-medium');
  box-shadow: g($t, 'container-elevation-resting');
  transition:
    box-shadow g($t, 'motion-duration') g($t, 'motion-easing'),
    background-color g($t, 'motion-duration') g($t, 'motion-easing');

  @include typescale('label-large');

  &__icon,
  &__label {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
  }

  @mixin apply-scheme($scheme) {
    background-color: g($t, '#{$scheme}-container-color');
    color: g($t, '#{$scheme}-content-color');

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
      color: g($t, '#{$scheme}-content-disabled-color');
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
    box-shadow: g($t, 'container-elevation-hover');
  }

  &:active {
    box-shadow: g($t, 'container-elevation-pressed');
  }

  &:disabled {
    box-shadow: none;
    cursor: default;
    pointer-events: none;
  }
}
</style>
