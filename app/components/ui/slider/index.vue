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
@use '~/assets/stylesheet/components/slider' as v;

.ui-slider {
  display: flex;
  flex-direction: column;
  gap: v.$gap;

  &__label {
    @include typescale(v.$label-text-type);

    color: v.$label-color;
  }

  &__track-wrapper {
    position: relative;
    padding-block: v.$padding-block;
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
      width: v.$thumb-size;
      height: v.$thumb-size;
      border-radius: var(--sys-shape-corner-full);
      background-color: v.$thumb-color;
      box-shadow: 0 0 0 v.$thumb-halo-size v.$thumb-halo-color;
      cursor: pointer;
      margin-top: calc((v.$thumb-size / -2) + (v.$track-height / 2));
    }

    &::-webkit-slider-runnable-track {
      height: v.$track-height;
      background: transparent;
    }

    &::-moz-range-thumb {
      width: v.$thumb-size;
      height: v.$thumb-size;
      border-radius: var(--sys-shape-corner-full);
      background-color: v.$thumb-color;
      border: none;
      box-shadow: 0 0 0 v.$thumb-halo-size v.$thumb-halo-color;
      cursor: pointer;
    }

    &::-moz-range-track {
      height: v.$track-height;
      background: transparent;
    }
  }

  &__track {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: v.$track-height;
    border-radius: 999rem;
    background-color: v.$track-bg-color;
    overflow: hidden;
  }

  &__track-fill {
    height: 100%;
    border-radius: inherit;
    background-color: v.$track-fill-color;
  }

  &__value {
    @include typescale(v.$value-text-type);

    color: v.$value-color;
  }
}
</style>
