<template>
  <label
    class="ui-radio"
    :class="radioClasses"
  >
    <input
      :id="fieldId"
      v-model="modelValueLocal"
      class="ui-radio__input"
      type="radio"
      :name="name"
      :value="value"
      :disabled="disabled"
      :aria-checked="modelValueLocal === value"
      :aria-invalid="errorMessage ? 'true' : undefined"
    >

    <div class="ui-radio__container">
      <span class="ui-radio__control">
        <span class="ui-radio__outer" />
        <span class="ui-radio__inner" />
      </span>
      <span class="ui-radio__state-layer" />
    </div>

    <span
      v-if="label"
      class="ui-radio__label"
    >
      <slot>
        {{ label }}
      </slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate'

type RadioValue = string | number

interface Props {
  name?: string
  value: RadioValue
  label?: string
  disabled?: boolean
  path?: string
}

const props = withDefaults(defineProps<Props>(), {
  name: undefined,
  label: undefined,
  disabled: false,
  path: undefined,
})

const modelValue = defineModel<RadioValue | undefined>({ default: undefined })

const fieldId = useId()

const errorMessage = ref<string | undefined>()

const radioClasses = computed(() => [
  {
    'ui-radio--checked': modelValue.value === props.value,
    'ui-radio--disabled': props.disabled,
    'ui-radio--error': Boolean(errorMessage.value),
  },
])

const modelValueLocal = computed<RadioValue | undefined>({
  get: () => modelValue.value,
  set: (val) => {
    modelValue.value = val
  },
})

if (props.path) {
  const field = useField<RadioValue>(() => props.path as string, undefined)
  const { value, errorMessage: fieldError } = field

  watch(
    value,
    (next) => {
      modelValue.value = next
    },
    { immediate: true },
  )

  watch(
    modelValue,
    (next) => {
      value.value = next as RadioValue
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
.ui-radio {
  --ui-radio-size: 20rem;

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
    width: var(--ui-radio-size);
    height: var(--ui-radio-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

  &__outer {
    position: absolute;
    inset: 0;
    border-radius: var(--sys-shape-corner-full);
    border: 2rem solid var(--color-outline);
    box-sizing: border-box;
    transition:
      border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__inner {
    width: 10rem;
    height: 10rem;
    border-radius: var(--sys-shape-corner-full);
    background-color: var(--color-primary);
    transform: scale(0);
    transition:
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__label {
    padding-top: 1rem;

    @include typescale('body-medium');
  }

  &--checked &__outer {
    border-color: var(--color-primary);
  }

  &--checked &__inner {
    transform: scale(1);
  }

  &--disabled {
    cursor: default;
    opacity: 0.38;

    & &__state-layer {
      display: none;
    }
  }

  &--error &__outer {
    border-color: var(--color-warn);
  }
}
</style>
