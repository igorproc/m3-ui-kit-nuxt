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
@use '~/assets/stylesheet/components/radio/index' as t;

.ui-radio {
  $prefix: 'md-radio';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  gap: g($t, 'container-gap');
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
    width: g($t, 'container-size');
    height: g($t, 'container-size');
    flex-shrink: 0;
  }

  &__control {
    position: relative;
    width: g($t, 'control-size');
    height: g($t, 'control-size');
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  &__state-layer {
    position: absolute;
    top: 50%;
    left: 50%;
    width: g($t, 'container-size');
    height: g($t, 'container-size');
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
    background-color: g($t, 'checked-color');
  }

  &--error &__state-layer {
    background-color: g($t, 'error-color');
  }

  &:hover &__state-layer {
    opacity: g($t, 'state-layer-opacity-hover');
    transform: translate(-50%, -50%) scale(1);
  }

  &:active &__state-layer {
    opacity: g($t, 'state-layer-opacity-active');
  }

  &__outer {
    position: absolute;
    inset: 0;
    border-radius: var(--sys-shape-corner-full);
    border: g($t, 'outer-border-width') solid g($t, 'outer-border-color');
    box-sizing: border-box;
    transition:
      border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__inner {
    width: g($t, 'inner-size');
    height: g($t, 'inner-size');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'inner-bg');
    transform: scale(0);
    transition:
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__label {
    padding-top: 1rem;

    @include typescale(g($t, 'typography-label'));
  }

  &--checked &__outer {
    border-color: g($t, 'checked-color');
  }

  &--checked &__inner {
    transform: scale(1);
  }

  &--disabled {
    cursor: default;
    opacity: g($t, 'disabled-opacity');

    & &__state-layer {
      display: none;
    }
  }

  &--error &__outer {
    border-color: g($t, 'error-color');
  }
}
</style>
