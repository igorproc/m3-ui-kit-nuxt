<template>
  <label
    class="ui-switch"
    :class="switchClasses"
  >
    <input
      :id="fieldId"
      v-model="modelValue"
      class="ui-switch__input"
      type="checkbox"
      :name="path"
      :disabled="disabled"
      role="switch"
      :aria-checked="modelValue"
    >

    <span class="ui-switch__track">
      <span class="ui-switch__thumb-container">
        <span class="ui-switch__thumb" />
        <span class="ui-switch__state-layer" />
      </span>
    </span>

    <span
      v-if="label"
      class="ui-switch__label"
    >
      <slot>
        {{ label }}
      </slot>
    </span>
  </label>
</template>

<script setup lang="ts">
interface Props {
  path?: string
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  path: undefined,
  label: undefined,
  disabled: false,
})

const modelValue = defineModel<boolean>({ default: false })

const fieldId = useId()

const switchClasses = computed(() => [
  {
    'ui-switch--checked': modelValue.value,
    'ui-switch--disabled': props.disabled,
  },
])
</script>

<style lang="scss">
.ui-switch {
  display: inline-flex;
  align-items: center;
  gap: 12rem;
  cursor: pointer;

  &__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  &__track {
    position: relative;
    width: 52rem;
    height: 32rem;
    border-radius: var(--sys-shape-corner-full);
    background-color: var(--color-surface-container-highest);
    border: 2rem solid var(--color-outline);
    box-sizing: border-box;
    transition:
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__thumb-container {
    position: absolute;
    top: 50%;
    left: 2rem;
    width: 24rem;
    height: 24rem;
    transform: translateY(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__thumb {
    width: 16rem;
    height: 16rem;
    border-radius: var(--sys-shape-corner-full);
    background-color: var(--color-outline);
    transition:
      width var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      height var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    z-index: 1;
  }

  &__state-layer {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40rem;
    height: 40rem;
    transform: translate(-50%, -50%) scale(0.6);
    border-radius: var(--sys-shape-corner-full);
    background-color: var(--color-on-surface);
    opacity: 0;
    pointer-events: none;
    transition:
      opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &--checked &__track {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
  }

  &--checked &__thumb-container {
    transform: translate(20rem, -50%);
  }

  &--checked &__thumb {
    width: 24rem;
    height: 24rem;
    background-color: var(--color-primary-contrast);
  }

  &--checked &__state-layer {
    background-color: var(--color-primary);
  }

  &:hover &__state-layer {
    opacity: 0.08;
    transform: translate(-50%, -50%) scale(1);
  }

  &:hover &__thumb {
    background-color: var(--color-on-surface-variant);
  }

  &:active &__thumb {
    width: 28rem;
    height: 28rem;
  }

  &:active &__state-layer {
    opacity: 0.1;
  }

  &--checked:hover &__thumb {
    background-color: var(--color-primary-container);
  }

  &__label {
    color: var(--color-on-surface);

    @include typescale('body-medium');
  }

  /* stylelint-disable no-descending-specificity, selector-class-pattern */
  &--disabled {
    cursor: default;

    .ui-switch__state-layer {
      display: none;
    }

    .ui-switch__track {
      background-color: color-mix(in srgb, var(--color-surface-variant) 12%, transparent);
      border-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
    }

    .ui-switch__thumb {
      background-color: var(--color-on-surface);
      opacity: 0.38;
    }

    .ui-switch__label {
      opacity: 0.38;
    }
  }

  &--checked.ui-switch--disabled .ui-switch__track {
    background-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
    border-color: transparent;
  }

  &--checked.ui-switch--disabled .ui-switch__thumb {
    background-color: var(--color-surface);
    opacity: 1;
  }
  /* stylelint-enable no-descending-specificity, selector-class-pattern */
}
</style>
