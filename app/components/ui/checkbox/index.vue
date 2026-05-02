<template>
  <label
    class="ui-checkbox"
    :class="checkboxClasses"
  >
    <input
      :id="fieldId"
      v-model="modelValue"
      class="ui-checkbox__input"
      type="checkbox"
      :name="path"
      :disabled="disabled"
      :aria-checked="modelValue"
      :aria-invalid="errorMessage ? 'true' : undefined"
    >

    <div class="ui-checkbox__container">
      <span class="ui-checkbox__control">
        <ui-icon
          class="ui-checkbox__icon"
          name="baseline-check"
        />
      </span>
      <span class="ui-checkbox__state-layer" />
    </div>

    <span
      v-if="label"
      class="ui-checkbox__label"
    >
      <slot>
        {{ label }}
      </slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate'

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

const checkboxClasses = computed(() => [
  {
    'ui-checkbox--checked': modelValue.value,
    'ui-checkbox--disabled': props.disabled,
    'ui-checkbox--error': Boolean(errorMessage.value),
  },
])

const errorMessage = ref<string | undefined>()

if (props.path) {
  const field = useField<boolean>(() => props.path as string, undefined)
  const { value, errorMessage: fieldError } = field

  watch(
    value,
    (next) => {
      modelValue.value = Boolean(next)
    },
    { immediate: true },
  )

  watch(
    modelValue,
    (next) => {
      value.value = Boolean(next)
    },
  )

  watch(
    fieldError,
    (next) => {
      errorMessage.value = next || undefined
    },
    { immediate: true },
  )
}
</script>

<style lang="scss">
.ui-checkbox {
  --ui-checkbox-size: 18rem;

  display: inline-flex;
  align-items: center;
  gap: 12rem;
  cursor: pointer;
  color: var(--color-on-surface);

  &__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  &__container {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 40rem;
    height: 40rem;
    flex-shrink: 0;
  }

  &__control {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: var(--ui-checkbox-size);
    height: var(--ui-checkbox-size);
    border-radius: 2rem;
    border: 2rem solid var(--color-outline);
    background-color: transparent;
    box-sizing: border-box;
    z-index: 1;
    transition:
      border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
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
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &--checked &__state-layer {
    background-color: var(--color-primary);
  }

  &--error &__state-layer {
    background-color: var(--color-warn);
  }

  &:hover &__state-layer {
    opacity: 0.08;
    transform: translate(-50%, -50%) scale(1);
  }

  &:active &__state-layer {
    opacity: 0.12;
  }

  &--checked:hover &__state-layer {
    opacity: 0.08;
  }

  &__icon {
    font-size: 16rem;
    color: var(--color-primary-contrast);
    opacity: 0;
    transform: scale(0.6);
    transition:
      opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__label {
    @include typescale('body-medium');

    padding-top: 1rem;
    user-select: none;
  }

  &--disabled {
    cursor: default;
    opacity: 0.38;

    & &__state-layer {
      display: none;
    }
  }

  &--checked &__control {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
  }

  &--error &__control {
    border-color: var(--color-warn);
  }

  &--checked &__icon {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
