<template>
  <button
    class="ui-fab"
    :class="[
      `ui-fab--${color}`,
      `ui-fab--${size}`,
    ]"
    :disabled="disabled"
  >
    <span class="ui-fab__state-layer" />
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
.ui-fab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4rem 8rem 3rem rgb(0 0 0 / 15%), 0 1rem 3rem rgb(0 0 0 / 30%); // Elevation 3
  transition: box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
              background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  &__state-layer {
    position: absolute;
    inset: 0;
    opacity: 0;
    background-color: var(--color-on-surface);
    transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__icon {
    position: relative;
    z-index: 1;
    font-size: 24rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // Sizes
  &--small {
    width: 40rem;
    height: 40rem;
    border-radius: 12rem;
  }

  &--medium {
    width: 56rem;
    height: 56rem;
    border-radius: 16rem;
  }

  &--large {
    width: 96rem;
    height: 96rem;
    border-radius: 28rem;
  }

  &--large &__icon {
    font-size: 36rem;
  }

  // Colors
  &--primary {
    background-color: var(--color-primary-container);
    color: var(--color-primary-container-contrast, var(--color-on-surface));
  }

  &--primary &__state-layer {
    background-color: var(--color-primary-container-contrast, var(--color-on-surface));
  }

  &--surface {
    background-color: var(--color-surface-container-high);
    color: var(--color-primary);
  }

  &--surface &__state-layer {
    background-color: var(--color-primary);
  }

  // Interactions
  // Place disabled FIRST to fix no-descending-specificity
  &:disabled {
    background-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
    color: color-mix(in srgb, var(--color-on-surface) 38%, transparent);
    box-shadow: none;
    cursor: default;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 6rem 10rem 4rem rgb(0 0 0 / 15%), 0 2rem 3rem rgb(0 0 0 / 30%); // Elevation 4
  }

  &:hover:not(:disabled) &__state-layer {
    opacity: 0.08;
  }

  &:active:not(:disabled) {
    box-shadow: 0 4rem 8rem 3rem rgb(0 0 0 / 15%), 0 1rem 3rem rgb(0 0 0 / 30%); // Elevation 3
  }

  &:active:not(:disabled) &__state-layer {
    opacity: 0.12;
  }
}
</style>
