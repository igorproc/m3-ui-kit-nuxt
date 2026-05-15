<template>
  <div 
    class="ui-slider" 
    :class="[
      { 'ui-slider--discrete': discrete },
      { 'ui-slider--range': range },
      { 'ui-slider--vertical': orientation === 'vertical' }
    ]"
    :style="cssVars"
  >
    <label v-if="label" class="ui-slider__label" :for="fieldIdStart">
      {{ label }}
    </label>

    <div class="ui-slider__wrapper">
      <div class="ui-slider__container">
      <!-- Start Input (only for range) -->
      <input
        v-if="range"
        :id="fieldIdStart"
        v-model.number="internalStart"
        class="ui-slider__native-input ui-slider__native-input--start"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :aria-label="`${label} start`"
        @input="handleInput"
      >
      <!-- End Input -->
      <input
        :id="fieldIdEnd"
        v-model.number="internalEnd"
        class="ui-slider__native-input ui-slider__native-input--end"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :aria-label="range ? `${label} end` : label"
        @input="handleInput"
      >

      <!-- Track Background & Ticks -->
      <div class="ui-slider__track">
        <div v-if="discrete" class="ui-slider__tickmarks" />
      </div>

      <!-- Track Active Fill -->
      <div class="ui-slider__track-active">
        <div v-if="discrete" class="ui-slider__tickmarks ui-slider__tickmarks--active" />
      </div>

      <!-- Handles -->
      <div class="ui-slider__handle-container-padded">
        <div class="ui-slider__handle-bounds">
          <div class="ui-slider__handle-range">
            <!-- Start Handle -->
            <div v-if="range" class="ui-slider__handle ui-slider__handle--start">
              <div v-ripple class="ui-slider__state-layer" />
              <div class="ui-slider__thumb"></div>
              <div v-if="showValue" class="ui-slider__value-label">
                <span class="ui-slider__value-text">{{ displayStart }}</span>
              </div>
            </div>

            <!-- End Handle -->
            <div class="ui-slider__handle ui-slider__handle--end">
              <div v-ripple class="ui-slider__state-layer" />
              <div class="ui-slider__thumb"></div>
              <div v-if="showValue" class="ui-slider__value-label">
                <span class="ui-slider__value-text">{{ displayEnd }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  discrete?: boolean
  range?: boolean
  orientation?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  label: undefined,
  showValue: false,
  discrete: false,
  range: false,
  orientation: 'horizontal'
})

// modelValue can be a number (single) or [number, number] (range)
const modelValue = defineModel<number | [number, number]>({ default: 0 })

const fieldIdStart = useId()
const fieldIdEnd = useId()

const internalStart = ref(props.min)
const internalEnd = ref(props.min)

// Sync modelValue -> internal refs
watch(() => modelValue.value, (val) => {
  if (props.range && Array.isArray(val)) {
    internalStart.value = val[0]
    internalEnd.value = val[1]
  } else if (!props.range && typeof val === 'number') {
    internalEnd.value = val
  }
}, { immediate: true })

const handleInput = () => {
  if (props.range) {
    // Clamp start and end so they don't cross each other
    if (internalStart.value > internalEnd.value) {
      const temp = internalStart.value
      internalStart.value = internalEnd.value
      internalEnd.value = temp
    }
    modelValue.value = [internalStart.value, internalEnd.value]
  } else {
    modelValue.value = internalEnd.value
  }
}

const startFraction = computed(() => {
  if (!props.range) return 0
  const range = props.max - props.min
  return range <= 0 ? 0 : (internalStart.value - props.min) / range
})

const endFraction = computed(() => {
  const range = props.max - props.min
  return range <= 0 ? 0 : (internalEnd.value - props.min) / range
})

const tickCount = computed(() => {
  if (props.step === 0) return 0
  return (props.max - props.min) / props.step
})

const cssVars = computed(() => ({
  '--ui-slider-start-fraction': startFraction.value,
  '--ui-slider-end-fraction': endFraction.value,
  '--ui-slider-tick-count': tickCount.value
}))

const displayStart = computed(() => `${internalStart.value}`)
const displayEnd = computed(() => `${internalEnd.value}`)
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/slider' as v;

.ui-slider {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: v.$gap;
  position: relative;

  &__label {
    @include typescale(v.$label-text-type);
    color: v.$label-color;
  }

  &__wrapper {
    position: relative;
    width: 100%;
  }

  &__container {
    position: relative;
    display: flex;
    align-items: center;
    height: 48rem; // Touch target size
    width: 100%;
    touch-action: none;
    user-select: none;
  }

  &--vertical {
    align-items: center;

    .ui-slider__wrapper {
      height: 200rem; // Default vertical height
      width: 48rem;
    }
    
    .ui-slider__container {
      width: 200rem; 
      transform: rotate(-90deg) translate(-100%, 0);
      transform-origin: left top;
      margin: 0;
    }

    // Adjust tooltip rotation for vertical
    .ui-slider__value-label {
      transform: translateX(-50%) scale(0);
      bottom: auto;
      top: -12rem; // Will appear on the left side visually
      left: 50%;
    }
    
    .ui-slider__value-text {
      transform: rotate(90deg); // Keep text upright visually
    }

    .ui-slider__native-input:hover ~ .ui-slider__handle-container-padded .ui-slider__value-label,
    .ui-slider__native-input:active ~ .ui-slider__handle-container-padded .ui-slider__value-label,
    .ui-slider__native-input:focus-visible ~ .ui-slider__handle-container-padded .ui-slider__value-label {
      transform: translateX(-50%) scale(1);
    }
  }

  // Native Inputs
  &__native-input {
    position: absolute;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0; // Hide but keep interactive
    cursor: pointer;
    pointer-events: auto;
    appearance: none;
    z-index: 10;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: v.$thumb-size;
      height: 48rem;
    }
    &::-moz-range-thumb {
      appearance: none;
      width: v.$thumb-size;
      height: 48rem;
    }
  }

  // Clip ranged inputs so their events don't overlap entirely
  &--range &__native-input--start {
    clip-path: polygon(0 0, calc(50% + ((var(--ui-slider-start-fraction) + var(--ui-slider-end-fraction)) * 50% - 50%)) 0, calc(50% + ((var(--ui-slider-start-fraction) + var(--ui-slider-end-fraction)) * 50% - 50%)) 100%, 0 100%);
  }
  &--range &__native-input--end {
    clip-path: polygon(calc(50% + ((var(--ui-slider-start-fraction) + var(--ui-slider-end-fraction)) * 50% - 50%)) 0, 100% 0, 100% 100%, calc(50% + ((var(--ui-slider-start-fraction) + var(--ui-slider-end-fraction)) * 50% - 50%)) 100%);
  }

  // Tracks
  &__track, &__track-active {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    pointer-events: none;
    
    &::before {
      content: '';
      position: absolute;
      left: calc(v.$thumb-size / 2);
      right: calc(v.$thumb-size / 2);
    }
  }

  &__track::before {
    height: 16rem;
    border-radius: 8rem;
    background: v.$track-bg-color;
  }

  &__track-active::before {
    height: 16rem;
    border-radius: 8rem;
    background: v.$track-fill-color;
    // Clip the active track based on start/end fractions
    clip-path: inset(0 calc(100% - (var(--ui-slider-end-fraction) * 100%)) 0 calc(var(--ui-slider-start-fraction) * 100%));
  }

  // Handle positioning
  &__handle-container-padded {
    position: absolute;
    width: 100%;
    height: 100%;
    padding-inline: calc(v.$thumb-size / 2);
    pointer-events: none;
    box-sizing: border-box;
  }

  &__handle-bounds {
    position: relative;
    width: 100%;
    height: 100%;
  }

  &__handle-range {
    position: absolute;
    left: calc(var(--ui-slider-start-fraction) * 100%);
    width: calc((var(--ui-slider-end-fraction) - var(--ui-slider-start-fraction)) * 100%);
    height: 100%;
  }

  &__handle {
    position: absolute;
    top: 0;
    width: 48rem;
    height: 48rem;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &--start {
      left: -24rem; // Center exactly over the start value
    }
    &--end {
      right: -24rem; // Center exactly over the end value
    }
  }

  &__state-layer {
    position: absolute;
    width: 40rem;
    height: 40rem;
    border-radius: 50%;
    background-color: v.$thumb-color;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__native-input:hover ~ .ui-slider__track-active .ui-slider__state-layer,
  &__native-input:focus-visible ~ .ui-slider__track-active .ui-slider__state-layer {
    opacity: 0.08;
  }
  &__native-input:active ~ .ui-slider__track-active .ui-slider__state-layer {
    opacity: 0.12;
  }

  &__thumb {
    position: relative;
    width: v.$thumb-size;
    height: v.$thumb-size;
    border-radius: var(--sys-shape-corner-full);
    background-color: v.$thumb-color;
    z-index: 2;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15); // M3 Level 1 Elevation
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
  }

  // Value Label (Tooltip)
  &__value-label {
    position: absolute;
    bottom: 34rem; // Above thumb
    left: 50%;
    transform: translateX(-50%) scale(0);
    transform-origin: bottom center;
    
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32rem; 
    height: 40rem; // Taller to accommodate the pin
    z-index: 3;
    pointer-events: none;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      width: 32rem;
      height: 32rem;
      background-color: var(--color-inverse-surface, #322F35);
      border-radius: 50% 50% 0 50%; // Sharp bottom-right
      transform: rotate(45deg); // Rotate sharp point to bottom-center
      z-index: -1;
    }
  }

  &__value-text {
    position: relative;
    top: -4rem; // Move text up into the balloon
    color: var(--color-inverse-on-surface, #F5EFF7);
    @include typescale(v.$value-text-type);
  }

  // Hover/Active triggers for tooltip
  &__native-input:hover ~ .ui-slider__handle-container-padded .ui-slider__value-label,
  &__native-input:active ~ .ui-slider__handle-container-padded .ui-slider__value-label,
  &__native-input:focus-visible ~ .ui-slider__handle-container-padded .ui-slider__value-label {
    transform: translateX(-50%) scale(1);
  }

  // Ticks for Discrete
  &__tickmarks {
    position: absolute;
    left: calc(v.$thumb-size / 2);
    right: calc(v.$thumb-size / 2);
    height: 16rem;
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 2rem center, color-mix(in srgb, var(--color-on-surface) 38%, transparent) 2rem, transparent 2rem);
      background-size: calc(100% / var(--ui-slider-tick-count)) 100%;
    }
  }

  &__tickmarks--active::before {
    background-image: radial-gradient(circle at 2rem center, color-mix(in srgb, var(--color-on-primary) 38%, transparent) 2rem, transparent 2rem);
  }
}
</style>
