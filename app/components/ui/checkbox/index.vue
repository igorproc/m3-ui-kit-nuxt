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
        <m-icon
          class="ui-checkbox__icon"
          :name="ICONS.check"
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
@use '~/assets/stylesheet/components/checkbox' as v;

.ui-checkbox {
  display: inline-flex;
  align-items: center;
  gap: v.$gap;
  cursor: pointer;
  color: v.$text-color;

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
    width: v.$container-size;
    height: v.$container-size;
    flex-shrink: 0;
  }

  &__control {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: v.$size;
    height: v.$size;
    border-radius: v.$control-border-radius;
    border: v.$control-border-width solid v.$control-border-color;
    background-color: v.$control-bg-color;
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
    width: v.$container-size;
    height: v.$container-size;
    transform: translate(-50%, -50%) scale(0.6);
    border-radius: var(--sys-shape-corner-full);
    background-color: v.$text-color;
    opacity: 0;
    pointer-events: none;
    transition:
      opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &--checked &__state-layer {
    background-color: v.$checked-color;
  }

  &--error &__state-layer {
    background-color: v.$error-color;
  }

  &:hover &__state-layer {
    opacity: v.$state-layer-opacity-hover;
    transform: translate(-50%, -50%) scale(1);
  }

  &:active &__state-layer {
    opacity: v.$state-layer-opacity-active;
  }

  &--checked:hover &__state-layer {
    opacity: v.$state-layer-opacity-hover;
  }

  &__icon {
    font-size: v.$icon-size;
    color: v.$checked-icon-color;
    opacity: 0;
    transform: scale(0.6);
    transition:
      opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__label {
    @include typescale(v.$label-text-type);

    padding-top: 1rem;
    user-select: none;
  }

  &--disabled {
    cursor: default;
    opacity: v.$disabled-opacity;

    & &__state-layer {
      display: none;
    }
  }

  &--checked &__control {
    background-color: v.$checked-color;
    border-color: v.$checked-color;
  }

  &--error &__control {
    border-color: v.$error-color;
  }

  &--checked &__icon {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
