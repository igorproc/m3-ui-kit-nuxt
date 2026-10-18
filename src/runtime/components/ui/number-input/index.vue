<template>
  <div
    v-bind="rootAttrs()"
    :class="rootClasses"
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

    <div class="ui-number-input__control">
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

      <MNumberInputUnit
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
      </MNumberInputUnit>

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

    <!-- Always rendered: the line keeps its height, and the alert region exists
         before an error is written into it, so the first one is announced. -->
    <p
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
import MNumberInputUnit from './unit.vue'
import { useNumberInputControl } from '#kit/composables/number-input/useNumberInputControl'
import { mNumberInputProps } from './props'
import type { NumberInputInvalidReason } from '#kit/shared/utils/number'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useFieldShape } from '#kit/components/ui/text-field/useFieldShape'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mNumberInputProps)

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
}

const isScrub = computed(() => props.controls === 'scrub')
// The notch is sized by this copy of the label, so it carries the asterisk too.
const notchText = computed(() => props.required ? `${props.label} *` : props.label)
const hasUnit = computed(() => Boolean(unitModel.value) || Boolean(props.units?.length))

const shape = useFieldShape('m-number-input', props)

const rootClasses = computed(() => [
  'ui-number-input',
  `ui-number-input--${props.variant}`,
  `ui-number-input--shape-${shape.value}`,
  `ui-number-input--label-${props.labelPlacement}`,
  `ui-number-input--density-${props.density}`,
  {
    'ui-number-input--interactive': !props.disabled && !props.readonly,
    'ui-number-input--focused': isFocused.value,
    'ui-number-input--error': isError.value,
    'ui-number-input--disabled': props.disabled,
    'ui-number-input--readonly': props.readonly,
    'ui-number-input--split': props.controls === 'split',
    'ui-number-input--stacked': props.controls === 'stacked',
    'ui-number-input--scrub': isScrub.value,
    'ui-number-input--scrubbing': isScrubbing.value,
    'ui-number-input--unit': hasUnit.value,
  },
])

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

defineExpose({ element })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/number-input' as t;
@use '#kit/assets/stylesheet/components/number-input/label' as label;
@use '#kit/assets/stylesheet/components/number-input/zones' as zones;
@use '#kit/assets/stylesheet/components/number-input/states' as states;
@use '#kit/assets/stylesheet/components/number-input/parts' as parts;

.ui-number-input {
  $t: material-map(t.$tokens, 'm-number-input');

  --ui-number-input-inset: #{g($t, 'container.padding.inline')};

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  @include parts.axes($t);

  &--outlined {
    --ui-number-input-inset: #{g($t, 'outlined.inset')};
  }

  @include label.label($t);

  // ── container · owns the border and the surface ──
  // `align-items: stretch` is what makes the stepper zones full-height, and
  // `overflow: hidden` is what makes their edges follow the corner radius.
  &__control {
    position: relative;

    // Contains the filled state layer, so its negative z-index cannot slip
    // behind an ancestor's background.
    isolation: isolate;
    display: flex;
    align-items: stretch;

    // A height, not a floor: a 1rem border below one CSS pixel is drawn a
    // whole pixel wide, and a floor would let the value's line box push the
    // field a design pixel past the text field beside it.
    height: var(--ui-number-input-height);
    overflow: hidden;
    border: g($t, 'container.border.width') solid g($t, 'container.border.color');
    border-radius: var(--ui-number-input-radius);
    background-color: g($t, 'container.surface');
    transition:
      border-color g($t, 'state.duration') g($t, 'state.easing'),
      background-color g($t, 'state.duration') g($t, 'state.easing');
  }

  &__body {
    display: flex;
    flex: 1;
    align-items: center;
    gap: g($t, 'adornment.gap');
    min-width: 0;
    padding-inline: var(--ui-number-input-inset);
  }

  // A zone at an edge takes the corner, so the content beside it keeps the
  // default start instead of clearing the curve.
  &--split .ui-number-input__body {
    padding-inline: g($t, 'container.padding.inline');
  }

  &--stacked .ui-number-input__body,
  &--unit .ui-number-input__body {
    padding-inline-end: g($t, 'container.padding.inline');
  }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: none;
    outline: none;
    background-color: transparent;
    color: g($t, 'input.color');
    caret-color: g($t, 'input.caret.color');

    // Spec rule: numeric values use tabular figures so digits never shift width
    // while stepping.
    font-variant-numeric: tabular-nums;

    @include typescale(g($t, 'typography.input'));

    &::placeholder {
      color: g($t, 'input.placeholder.color');
    }

    // The UA repaints an autofilled input in its own colours (with
    // `!important`), off the theme. Those are transitions like any other, so
    // they are deferred out of reach instead of overridden.
    &:autofill {
      transition:
        background-color 0s 600000s,
        color 0s 600000s;
    }
  }

  &__adornment {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    color: g($t, 'adornment.color');
    font-size: g($t, 'adornment.size');
  }

  @include zones.zones($t);
  @include parts.support($t);
  @include states.states($t);
}
</style>
