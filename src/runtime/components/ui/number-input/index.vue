<template>
  <div
    v-bind="rootAttrs()"
    :class="rootClasses()"
  >
    <label
      v-if="label && !isScrub"
      v-bind="labelAttrs"
      class="ui-number-input__label"
    >
      {{ label }}

      <span
        v-if="required"
        class="ui-number-input__required"
        aria-hidden="true"
      >*</span>
    </label>

    <div
      ref="control"
      class="ui-number-input__control"
      @pointerdown="box.onPointerdown"
      @click="box.onClick"
    >
      <fieldset
        v-if="variant === 'outlined'"
        class="ui-number-input__outline"
        aria-hidden="true"
      >
        <legend
          v-if="label && !isScrub"
          class="ui-number-input__notch"
        >
          <span class="ui-number-input__notch-text">{{ notchText }}</span>
        </legend>
      </fieldset>

      <slot
        v-if="controls === 'split'"
        name="decrement"
        v-bind="decrementSlot"
      >
        <button
          v-ripple="!decrementAttrs.disabled"
          v-bind="decrementAttrs"
          class="ui-number-input__stepper ui-number-input__stepper--decrement"
        >
          <MIcon :name="ICONS.remove" />
        </button>
      </slot>

      <div class="ui-number-input__body">
        <label
          v-if="isScrub && label"
          ref="handle"
          v-bind="labelAttrs"
          class="ui-number-input__scrub"
        >
          <slot name="scrub">{{ label }}</slot>
        </label>

        <span
          v-if="$slots.prepend"
          class="ui-number-input__adornment ui-number-input__adornment--prepend"
        >
          <slot name="prepend" />
        </span>

        <input
          ref="element"
          v-model="draft"
          v-bind="controlAttrs(inputAttrs)"
          class="ui-number-input__input"
        >

        <span
          v-if="$slots.append"
          class="ui-number-input__adornment ui-number-input__adornment--append"
        >
          <slot name="append" />
        </span>
      </div>

      <NumberInputUnit
        v-if="hasUnit"
        v-model="unitModel"
        :units="units"
        :label="unitLabel"
        :disabled="disabled"
        :readonly="readonly"
      >
        <slot
          v-if="$slots.unit"
          name="unit"
        />
      </NumberInputUnit>

      <slot
        v-if="controls === 'split'"
        name="increment"
        v-bind="incrementSlot"
      >
        <button
          v-ripple="!incrementAttrs.disabled"
          v-bind="incrementAttrs"
          class="ui-number-input__stepper ui-number-input__stepper--increment"
        >
          <MIcon :name="ICONS.add" />
        </button>
      </slot>

      <span
        v-else-if="controls === 'stacked'"
        class="ui-number-input__stacked"
      >
        <slot
          name="increment"
          v-bind="incrementSlot"
        >
          <button
            v-ripple="!incrementAttrs.disabled"
            v-bind="incrementAttrs"
            class="ui-number-input__stepper ui-number-input__stepper--increment"
          >
            <MIcon :name="ICONS.keyboardArrowUp" />
          </button>
        </slot>

        <slot
          name="decrement"
          v-bind="decrementSlot"
        >
          <button
            v-ripple="!decrementAttrs.disabled"
            v-bind="decrementAttrs"
            class="ui-number-input__stepper ui-number-input__stepper--decrement"
          >
            <MIcon :name="ICONS.keyboardArrowDown" />
          </button>
        </slot>
      </span>
    </div>

    <!-- Rendered whenever something can appear in it: the line keeps its height,
         and the alert region exists before an error is written into it, so the
         first one is announced. With nothing to say there is no line at all. -->
    <p
      v-if="hasSupport()"
      v-bind="supportAttrs"
      class="ui-number-input__support"
    >
      <MIcon
        v-if="isError && !$slots.error"
        :name="ICONS.error"
        class="ui-number-input__support-icon"
        aria-hidden="true"
      />

      <span
        v-bind="alertAttrs"
        class="ui-number-input__alert"
      >
        <slot
          v-if="isError"
          name="error"
          :message="message"
        >
          {{ message }}
        </slot>
      </span>

      <slot
        v-if="!isError"
        name="helper"
        :message="message"
      >
        {{ message }}
      </slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import NumberInputUnit from '#kit/components/fragments/number-input/Unit.vue'
import { useNumberInputControl } from '#kit/composables/number-input/useNumberInputControl'
import { mNumberInputProps } from './props'
import type { MNumberInputSlots } from './props'
import type { NumberInputInvalidReason } from '#kit/shared/utils/number'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { createFieldBoxPress } from '#kit/utils/text-field/boxPress'
import { useSupportLine } from '#kit/utils/text-field/supportLine'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mNumberInputProps)
const slots = defineSlots<MNumberInputSlots>()

const modelValue = defineModel<number | null>({ default: null })
const focusedModel = defineModel<boolean>('focused', { default: false })
// The unit is a value of its own, not a decoration of the number: two models,
// no conversion between them.
const unitModel = defineModel<string | null>('unit', { default: null })

const emit = defineEmits<{
  (event: 'increment' | 'decrement', value: number): void
  (event: 'invalid', draft: string, reason: NumberInputInvalidReason): void
}>()

const {
  element,
  handle,
  draft,
  isFocused,
  isScrubbing,
  isError,
  message,
  nextIncrement,
  nextDecrement,
  inputAttrs,
  labelAttrs,
  supportAttrs,
  alertAttrs,
  incrementAttrs,
  decrementAttrs,
} = useNumberInputControl(modelValue, focusedModel, props, {
  onStep: (direction, value) => emit(direction > 0 ? 'increment' : 'decrement', value),
  onInvalid: (value, reason) => emit('invalid', value, reason),
})

// The kit ships no default label: it would be English in a kit with no i18n.
// An unnamed spinbutton is worse, so say it in dev rather than in a broken form.
if (import.meta.dev) {
  const attrs = useAttrs()

  if (!props.label && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    console.warn('[m-number-input] has no accessible name: pass `label`, `aria-label` or `aria-labelledby`.')
  }

  // The kit ships no English copy for its own buttons either.
  watchEffect(() => {
    const steppers = (props.controls === 'split' || props.controls === 'stacked') && !(slots.increment && slots.decrement)
    if (steppers && !(props.incrementLabel && props.decrementLabel)) {
      console.warn('[m-number-input] the stepper buttons have no accessible name: pass `increment-label` and `decrement-label`.')
    }
    if (props.units?.length && !props.unitLabel) {
      console.warn('[m-number-input] the unit menu says only the unit it shows: pass `unit-label` for what it does.')
    }
  })
}

// The whole box is the input's hit target; zones, the unit and the scrub
// handle keep their own presses.
const control = useTemplateRef<HTMLElement>('control')
const box = createFieldBoxPress(element)
const hasSupport = useSupportLine(props, slots)

const isScrub = computed(() => props.controls === 'scrub')
// The notch is sized by this copy of the label, so it carries the asterisk too.
const notchText = computed(() => props.required ? `${props.label} *` : props.label)
const hasUnit = computed(() => Boolean(unitModel.value) || Boolean(props.units?.length))

// Called from the template: slots are not reactive, so their presence is
// read on every render.
const rootClasses = () => [
  'ui-number-input',
  `ui-number-input--${props.variant}`,
  `ui-number-input--shape-${props.shape}`,
  `ui-number-input--label-${props.labelPlacement}`,
  `ui-number-input--density-${props.density}`,
  {
    'ui-number-input--focused': isFocused.value,
    'ui-number-input--error': isError.value,
    'ui-number-input--disabled': props.disabled,
    'ui-number-input--readonly': props.readonly,
    'ui-number-input--split': props.controls === 'split',
    'ui-number-input--stacked': props.controls === 'stacked',
    'ui-number-input--scrub': isScrub.value,
    'ui-number-input--scrubbing': isScrubbing.value,
    'ui-number-input--unit': hasUnit.value,
    'ui-number-input--prepend': Boolean(slots.prepend),
  },
]

const incrementSlot = computed(() => ({
  props: incrementAttrs.value,
  value: modelValue.value,
  nextValue: nextIncrement.value,
}))

const decrementSlot = computed(() => ({
  props: decrementAttrs.value,
  value: modelValue.value,
  nextValue: nextDecrement.value,
}))

/** The drawn box (what a popover anchors to) and the native input (where focus belongs). */
defineExpose({ control, input: element })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/number-input' as t;
@use '#kit/assets/stylesheet/components/number-input/label' as label;
@use '#kit/assets/stylesheet/components/number-input/control' as control;
@use '#kit/assets/stylesheet/components/number-input/zones' as zones;
@use '#kit/assets/stylesheet/components/number-input/states' as states;
@use '#kit/assets/stylesheet/components/number-input/parts' as parts;

.ui-number-input {
  $t: material-map(t.$tokens, 'm-number-input');

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  @include label.label($t);
  @include control.control($t);
  @include zones.zones($t);
  @include parts.support($t);
  @include states.states($t);
}
</style>
