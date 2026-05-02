<template>
  <button
    class="ui-extended-fab"
    :class="[
      `ui-extended-fab--${color}`,
      `ui-extended-fab--${size}`
    ]"
    :disabled="disabled"
  >
    <span class="ui-extended-fab__state-layer" />
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
.ui-extended-fab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-inline: 16rem;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  gap: 12rem;
  box-shadow: 0 4rem 8rem 3rem rgb(0 0 0 / 15%), 0 1rem 3rem rgb(0 0 0 / 30%); // Elevation 3
  transition: box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
              background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  @include typescale('label-large');

  &__state-layer {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__icon,
  &__label {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
  }

  &__icon {
    font-size: 24rem;
  }

  // Sizes
  &--small {
    height: 40rem;
    border-radius: 12rem;
    padding-inline: 12rem;
    gap: 8rem;

    .ui-extended-fab__icon {
      font-size: 20rem;
    }
  }

  &--medium {
    height: 56rem;
    border-radius: 16rem;
  }

  &--large {
    height: 96rem;
    border-radius: 28rem;
    padding-inline: 24rem;
    gap: 16rem;

    .ui-extended-fab__icon {
      font-size: 36rem;
    }
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
