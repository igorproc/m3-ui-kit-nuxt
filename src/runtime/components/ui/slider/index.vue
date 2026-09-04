<template>
  <SliderRoot
    v-bind="rootAttrs"
    :orientation="orientation"
    :is-dragging="isDragging"
    :disabled="disabled"
    :readonly="readonly"
    class="ui-slider"
  >
    <label
      v-if="label"
      class="ui-slider__label"
    >
      {{ label }}
    </label>

    <div class="ui-slider__wrapper">
      <div class="ui-slider__container">
        <SliderTrack
          v-bind="trackAttrs"
          :discrete="discrete"
          :tick-count="tickCount"
          :disabled="disabled"
          :readonly="readonly"
          :orientation="orientation"
        >
          <SliderRange
            :start="activeRange.start ?? 0"
            :end="activeRange.end ?? 0"
            :discrete="discrete"
            :tick-count="tickCount"
            :disabled="disabled"
            :readonly="readonly"
            :orientation="orientation"
          />

          <SliderThumb
            v-for="(val, idx) in values"
            :key="idx"
            v-bind="getThumbAttrs(idx)"
            :value="val"
            :show-value="showValue"
            :disabled="disabled"
            :readonly="readonly"
            :orientation="orientation"
            :is-dragging="draggingIndex === idx"
            :class="idx === 0 && range ? 'ui-slider-thumb--start' : 'ui-slider-thumb--end'"
          />
        </SliderTrack>
      </div>
    </div>

    <template v-if="name">
      <SliderHiddenInput
        v-for="(val, idx) in values"
        :key="`input-${idx}`"
        :value="val"
        :name="name"
        :disabled="disabled"
      />
    </template>
  </SliderRoot>
</template>

<script setup lang="ts">
import SliderRoot from '#kit/components/fragments/slider/root/index.vue'
import SliderTrack from '#kit/components/fragments/slider/track/index.vue'
import SliderRange from '#kit/components/fragments/slider/range/index.vue'
import SliderThumb from '#kit/components/fragments/slider/thumb/index.vue'
import SliderHiddenInput from '#kit/components/fragments/slider/hidden-input/index.vue'
import { useSliderControl } from '#kit/composables/slider/useSliderControl'
import { mSliderProps } from './props'

const props = defineProps(mSliderProps)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[]): void
}>()

const modelValue = defineModel<number | number[]>({ default: 0 })

/**
 * The component owns markup and tokens only. Every interaction it offers —
 * drag, click-to-jump, keyboard stepping, ARIA — comes from the attr bags
 * below, so consumers who replace this template keep all of it.
 */
const thumbAriaLabel = (index: number) => {
  if (!props.range) return props.ariaLabelEnd || props.label

  return index === 0
    ? (props.ariaLabelStart || `${props.label || ''} start`.trim())
    : (props.ariaLabelEnd || `${props.label || ''} end`.trim())
}

const {
  values,
  activeRange,
  tickCount,
  draggingIndex,
  isDragging,
  rootAttrs,
  trackAttrs,
  getThumbAttrs,
} = useSliderControl(modelValue, {
  min: () => props.min,
  max: () => props.max,
  step: () => props.step,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  orientation: () => props.orientation,
  ariaLabel: thumbAriaLabel,
  onUpdate: value => emit('update:modelValue', value),
})
</script>

<style lang="scss">
.ui-slider {
  // Presentational wrapper helper styles
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
    box-sizing: border-box;
  }

  // Vertical orientation: real axis-aligned geometry (no rotate hack), so
  // getBoundingClientRect() returns a correct upright rect for drag math.
  &.ui-slider-root--vertical {
    .ui-slider__wrapper {
      height: 200rem; // Default vertical height
      width: 48rem;
    }

    .ui-slider__container {
      width: 48rem;
      height: 100%;
    }
  }
}
</style>
