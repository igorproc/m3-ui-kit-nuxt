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
@use '~/assets/stylesheet/components/switch' as v;

.ui-switch {
  display: inline-flex;
  align-items: center;
  gap: v.$gap;
  cursor: pointer;

  &__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  &__track {
    position: relative;
    width: v.$track-width;
    height: v.$track-height;
    border-radius: var(--sys-shape-corner-full);
    background-color: v.$track-bg-color;
    border: v.$track-border-width solid v.$track-border-color;
    box-sizing: border-box;
    transition:
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__thumb-container {
    position: absolute;
    top: 50%;
    left: v.$track-border-width;
    width: v.$thumb-size-on;
    height: v.$thumb-size-on;
    transform: translateY(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__thumb {
    width: v.$thumb-size-off;
    height: v.$thumb-size-off;
    border-radius: var(--sys-shape-corner-full);
    background-color: v.$thumb-color-off;
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
    width: v.$state-layer-size;
    height: v.$state-layer-size;
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
    background-color: v.$checked-track-bg-color;
    border-color: v.$checked-track-border-color;
  }

  &--checked &__thumb-container {
    transform: translate(v.$checked-thumb-container-translate, -50%);
  }

  &--checked &__thumb {
    width: v.$thumb-size-on;
    height: v.$thumb-size-on;
    background-color: v.$thumb-color-on;
  }

  &--checked &__state-layer {
    background-color: v.$checked-track-bg-color;
  }

  &:hover &__state-layer {
    opacity: v.$state-layer-opacity-hover;
    transform: translate(-50%, -50%) scale(1);
  }

  &:hover &__thumb {
    background-color: v.$thumb-color-hover-off;
  }

  &:active &__thumb {
    width: v.$thumb-size-active;
    height: v.$thumb-size-active;
  }

  &:active &__state-layer {
    opacity: v.$state-layer-opacity-active;
  }

  &--checked:hover &__thumb {
    background-color: v.$thumb-color-hover-on;
  }

  &__label {
    color: v.$label-color;

    @include typescale(v.$label-text-type);
  }

  /* stylelint-disable no-descending-specificity, selector-class-pattern */
  &--disabled {
    cursor: default;

    .ui-switch__state-layer {
      display: none;
    }

    .ui-switch__track {
      background-color: v.$disabled-track-bg-color;
      border-color: v.$disabled-track-border-color;
    }

    .ui-switch__thumb {
      background-color: v.$disabled-thumb-color;
      opacity: v.$disabled-opacity;
    }

    .ui-switch__label {
      opacity: v.$disabled-opacity;
    }
  }

  &--checked.ui-switch--disabled .ui-switch__track {
    background-color: v.$disabled-checked-track-bg-color;
    border-color: transparent;
  }

  &--checked.ui-switch--disabled .ui-switch__thumb {
    background-color: v.$disabled-checked-thumb-color;
    opacity: 1;
  }
  /* stylelint-enable no-descending-specificity, selector-class-pattern */
}
</style>
