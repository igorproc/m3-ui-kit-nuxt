<template>
  <SliderRoot
    v-bind="rootBindings()"
    :orientation="orientation"
    :density="density"
    :is-dragging="isDragging"
    :disabled="disabled"
    :readonly="readonly"
    class="ui-slider"
  >
    <span
      v-if="label || $slots.label"
      :id="labelId"
      class="ui-slider__label"
    >
      <slot name="label">{{ label }}</slot>
      <span
        v-if="required"
        class="ui-slider__required"
        aria-hidden="true"
      > *</span>
    </span>

    <div class="ui-slider__container">
      <SliderTrack
        v-bind="trackAttrs"
        :start="activeRange.start ?? 0"
        :end="activeRange.end ?? 0"
        :start-cut="startCut"
        :end-cut="endCut"
        :tick-positions="tickPositions"
        :density="density"
        :disabled="disabled"
        :readonly="readonly"
        :orientation="orientation"
        :is-dragging="isDragging"
      >
        <template
          v-if="$slots.icon && showsIcon"
          #icon
        >
          <slot name="icon" />
        </template>

        <SliderThumb
          v-for="(val, idx) in values"
          :key="idx"
          v-bind="thumbBindings(idx)"
          :value="val"
          :text="valueText(val, idx)"
          :show-value="showValue"
          :value-shown="valueIndex === idx"
          :density="density"
          :disabled="disabled"
          :readonly="readonly"
          :orientation="orientation"
          :is-dragging="draggingIndex === idx"
          :class="idx === 0 && range ? 'ui-slider-thumb--start' : 'ui-slider-thumb--end'"
        >
          <template
            v-if="$slots.value"
            #value
          >
            <slot
              name="value"
              :value="val"
              :index="idx"
              :text="valueText(val, idx)"
            />
          </template>
        </SliderThumb>
      </SliderTrack>
    </div>

    <template v-if="name || path">
      <SliderHiddenInput
        v-for="(val, idx) in values"
        :key="`input-${idx}`"
        :value="val"
        :name="name ?? path"
        :disabled="disabled"
      />
    </template>

    <ChoiceSupport
      v-if="hasSupport()"
      :id="supportId()"
      class="ui-slider__support"
      :is-error="isError"
      :message="message"
    >
      <template
        v-if="$slots.helper"
        #helper="scope"
      >
        <slot
          name="helper"
          v-bind="scope"
        />
      </template>
      <template
        v-if="$slots.error"
        #error="scope"
      >
        <slot
          name="error"
          v-bind="scope"
        />
      </template>
    </ChoiceSupport>
  </SliderRoot>
</template>

<script setup lang="ts">
import { mergeProps } from 'vue'
import ChoiceSupport from '#kit/components/fragments/choice-support/index.vue'
import SliderRoot from '#kit/components/fragments/slider/root/index.vue'
import SliderTrack from '#kit/components/fragments/slider/track/index.vue'
import SliderThumb from '#kit/components/fragments/slider/thumb/index.vue'
import SliderHiddenInput from '#kit/components/fragments/slider/hidden-input/index.vue'
import { useSliderControl } from '#kit/composables/slider/useSliderControl'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useChoiceField } from '#kit/utils/choice/useChoiceField'
import { mSliderProps } from './props'
import type { MSliderSlots } from './props'

// `class` / `style` stay on the root; `aria-*` and the rest go to the thumbs,
// the focusable parts, as a plain input would take them.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mSliderProps)
const slots = defineSlots<MSliderSlots>()

const modelValue = defineModel<number | number[]>({ default: 0 })

const valueText = (value: number, index: number) => props.formatValue?.(value, index) ?? String(value)

// The slider is a form field too (W4-А): the support line under it, the
// invalid state and its description on every thumb; the track keeps its colours.
const { isError, message, hasSupport, supportId, inputAttrs } = useChoiceField(modelValue, props, slots)
const labelId = `${inputAttrs().id}-label`
const hasLabel = () => Boolean(props.label || slots.label)

/**
 * The component owns markup and tokens only. Every interaction it offers —
 * drag, click-to-jump, keyboard stepping, ARIA — comes from the attr bags
 * below, so consumers who replace this template keep all of it.
 */
const thumbAriaLabel = (index: number) => {
  const own = props.range ? (index === 0 ? props.ariaLabelStart : props.ariaLabelEnd) : props.ariaLabelEnd

  // A visible label names the thumb through `aria-labelledby` instead.
  return own || (hasLabel() ? undefined : props.label) || undefined
}

const thumbLabelledby = (index: number) => {
  const own = props.range ? (index === 0 ? props.ariaLabelStart : props.ariaLabelEnd) : props.ariaLabelEnd
  return !own && hasLabel() ? labelId : undefined
}

if (import.meta.dev) {
  watchEffect(() => {
    if (props.range && !(props.ariaLabelStart && props.ariaLabelEnd)) {
      console.warn('[m-slider] range thumbs need their own names: pass `aria-label-start` and `aria-label-end`.')
    }
    if (props.range && props.origin !== 'start') {
      console.warn('[m-slider] `origin` applies to a single value: a range fills between its thumbs and ignores it.')
    }
  })
}

const {
  values,
  activeRange,
  tickCount,
  draggingIndex,
  valueIndex,
  isDragging,
  rootAttrs: groupAttrs,
  trackAttrs,
  getThumbAttrs,
} = useSliderControl(modelValue, {
  min: () => props.min,
  max: () => props.max,
  step: () => props.step,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  orientation: () => props.orientation,
  origin: () => (props.range ? 'start' : props.origin),
  ariaLabel: thumbAriaLabel,
  ariaLabelledby: thumbLabelledby,
  ariaValuetext: valueText,
})

// A range is a group named by the label; its thumbs carry their own names.
const rootBindings = () => ({
  ...rootAttrs(),
  ...groupAttrs.value,
  'aria-labelledby': groupAttrs.value.role && hasLabel() ? labelId : undefined,
})

const thumbBindings = (index: number) => {
  const field = inputAttrs()

  return controlAttrs(mergeProps(getThumbAttrs(index) as unknown as Record<string, unknown>, {
    'aria-invalid': field['aria-invalid'],
    'aria-describedby': field['aria-describedby'],
    'aria-required': props.required ? 'true' as const : undefined,
  }))
}

// Which ends of the active track stand at a handle (the gap is cut there):
// both in a range; the value's end in a single or centered slider.
const centered = computed(() => !props.range && props.origin === 'center')
const startCut = computed(() => props.range || (centered.value && (values.value[0] ?? 0) < (props.min + props.max) / 2))
const endCut = computed(() => props.range || !centered.value || (values.value[0] ?? 0) >= (props.min + props.max) / 2)

const tickPositions = computed(() => (props.discrete && tickCount.value > 0
  ? Array.from({ length: Math.floor(tickCount.value) + 1 }, (_, index) => (index / tickCount.value) * 100)
  : []))

// The inset icon belongs to the M3 M slider, standard configuration.
const showsIcon = computed(() => props.density === 'comfortable' && !props.range && !centered.value && props.orientation === 'horizontal')
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/slider' as t;

.ui-slider {
  $t: material-map(t.$tokens, 'md-slider');

  &__label {
    margin-block-end: g($t, 'label.gap');
    color: g($t, 'label.color');

    @include typescale(g($t, 'label.typography'));
  }

  &__required {
    color: g($t, 'label.required');
  }

  &.ui-slider-root--disabled &__label {
    color: g($t, 'disabled.label');
  }

  &__container {
    position: relative;
    display: flex;
    align-items: center;
    inline-size: 100%;
    user-select: none;
    box-sizing: border-box;

    // A swipe across the slider scrolls the page; only the thumb holds still.
    touch-action: pan-y;
  }

  @each $density in (default, comfortable) {
    &.ui-slider-root--#{$density} &__container {
      block-size: g($t, 'density.#{$density}.block');
    }

    &.ui-slider-root--vertical.ui-slider-root--#{$density} &__container {
      inline-size: g($t, 'density.#{$density}.block');
      block-size: g($t, 'vertical.length');
    }
  }

  &.ui-slider-root--vertical &__container {
    touch-action: pan-x;
  }
}
</style>
