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

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-primary-container-contrast, var(--color-on-surface)) 8%, var(--color-primary-container));
    }
    &:active:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-primary-container-contrast, var(--color-on-surface)) 12%, var(--color-primary-container));
    }
  }

  &--secondary {
    background-color: var(--color-accent-container);
    color: var(--color-accent-container-contrast, var(--color-on-surface));

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-accent-container-contrast, var(--color-on-surface)) 8%, var(--color-accent-container));
    }
    &:active:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-accent-container-contrast, var(--color-on-surface)) 12%, var(--color-accent-container));
    }
  }

  &--tertiary {
    background-color: var(--md-sys-color-tertiary-container, #e2e7b0);
    color: var(--md-sys-color-on-tertiary-container, #454a21);

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--md-sys-color-on-tertiary-container, #454a21) 8%, var(--md-sys-color-tertiary-container, #e2e7b0));
    }
    &:active:not(:disabled) {
      background-color: color-mix(in srgb, var(--md-sys-color-on-tertiary-container, #454a21) 12%, var(--md-sys-color-tertiary-container, #e2e7b0));
    }
  }

  &--surface {
    background-color: var(--color-surface-container-high, var(--color-surface-variant));
    color: var(--color-primary);

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-container-high, var(--color-surface-variant)));
    }
    &:active:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-container-high, var(--color-surface-variant)));
    }
  }

  // Interactions
  &:disabled {
    background-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
    color: color-mix(in srgb, var(--color-on-surface) 38%, transparent);
    box-shadow: none;
    cursor: default;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 6rem 10rem 4rem rgb(0 0 0 / 15%), 0 2rem 3rem rgb(0 0 0 / 30%); // Elevation 4
  }

  &:active:not(:disabled) {
    box-shadow: 0 4rem 8rem 3rem rgb(0 0 0 / 15%), 0 1rem 3rem rgb(0 0 0 / 30%); // Elevation 3
  }
}
</style>
