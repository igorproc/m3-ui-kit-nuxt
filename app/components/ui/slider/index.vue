<template>
  <div class="ui-slider">
    <label
      v-if="label"
      class="ui-slider__label"
      :for="fieldId"
    >
      {{ label }}
    </label>

    <div class="ui-slider__track-wrapper">
      <input
        :id="fieldId"
        v-model.number="modelValue"
        class="ui-slider__input"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :aria-label="label"
      >

      <div class="ui-slider__track">
        <div
          class="ui-slider__track-fill"
          :style="{ width: `${percentage}%` }"
        />
      </div>
    </div>

    <div
      v-if="showValue"
      class="ui-slider__value"
    >
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  label: undefined,
  showValue: true,
})

const modelValue = defineModel<number>({ default: 0 })

const fieldId = useId()

const percentage = computed(() => {
  const range = props.max - props.min
  if (range <= 0) {
    return 0
  }

  return ((modelValue.value - props.min) / range) * 100
})

const displayValue = computed(() => `${Math.round(modelValue.value)}`)
</script>

<style lang="scss">
.ui-slider {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  &__label {
    @include typescale('body-medium');

    color: var(--color-on-surface);
  }

  &__track-wrapper {
    position: relative;
    padding-block: 8rem;
  }

  &__input {
    position: relative;
    z-index: 1;
    width: 100%;
    margin: 0;
    background: transparent;
    appearance: none;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 20rem;
      height: 20rem;
      border-radius: var(--sys-shape-corner-full);
      background-color: var(--color-primary);
      box-shadow: 0 0 0 4rem color-mix(in srgb, var(--color-primary) 24%, transparent);
      cursor: pointer;
      margin-top: -8rem;
    }

    &::-webkit-slider-runnable-track {
      height: 4rem;
      background: transparent;
    }

    &::-moz-range-thumb {
      width: 20rem;
      height: 20rem;
      border-radius: var(--sys-shape-corner-full);
      background-color: var(--color-primary);
      border: none;
      box-shadow: 0 0 0 4rem color-mix(in srgb, var(--color-primary) 24%, transparent);
      cursor: pointer;
    }

    &::-moz-range-track {
      height: 4rem;
      background: transparent;
    }
  }

  &__track {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 4rem;
    border-radius: 999rem;
    background-color: color-mix(
      in srgb,
      var(--color-on-surface) 16%,
      transparent
    );
    overflow: hidden;
  }

  &__track-fill {
    height: 100%;
    border-radius: inherit;
    background-color: var(--color-primary);
  }

  &__value {
    @include typescale('body-small');

    color: var(--color-surface-variant-contrast);
  }
}
</style>
