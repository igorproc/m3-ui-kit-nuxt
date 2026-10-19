<template>
  <div
    v-bind="rootAttrs()"
    class="ui-text-field"
    :class="rootClasses()"
  >
    <label
      v-if="label"
      v-bind="labelAttrs"
      class="ui-text-field__label"
    >
      {{ label }}

      <span
        v-if="required"
        class="ui-text-field__required"
        aria-hidden="true"
      >*</span>
    </label>

    <div
      ref="controlRef"
      class="ui-text-field__control"
      @pointerdown="box.onPointerdown"
      @click="box.onClick"
    >
      <fieldset
        v-if="variant === 'outlined'"
        class="ui-text-field__outline"
        aria-hidden="true"
      >
        <legend
          v-if="label"
          class="ui-text-field__notch"
        >
          <span class="ui-text-field__notch-text">{{ notchText }}</span>
        </legend>
      </fieldset>

      <span
        v-if="hasPrepend()"
        class="ui-text-field__icon ui-text-field__icon--prepend"
      >
        <slot name="prepend" />
      </span>

      <div
        v-if="hasRow()"
        class="ui-text-field__field ui-text-field__row"
        :class="{ 'ui-text-field__field--leading': hasLeading() }"
      >
        <span
          v-if="hasLeading()"
          class="ui-text-field__leading"
        >
          <slot name="leading-content" />
        </span>

        <span
          v-if="prefix"
          v-bind="prefixAttrs"
          class="ui-text-field__affix ui-text-field__affix--prefix"
        >{{ prefix }}</span>

        <input
          ref="inputRef"
          v-model="modelValue"
          v-bind="inputBindings()"
          class="ui-text-field__input"
        >

        <span
          v-if="suffix"
          v-bind="suffixAttrs"
          class="ui-text-field__affix ui-text-field__affix--suffix"
        >{{ suffix }}</span>
      </div>

      <input
        v-else
        ref="inputRef"
        v-model="modelValue"
        v-bind="inputBindings()"
        class="ui-text-field__input ui-text-field__row"
      >

      <span
        v-if="hasAppend()"
        class="ui-text-field__icon ui-text-field__icon--append"
      >
        <slot name="append" />
      </span>
    </div>

    <!-- Rendered whenever something can appear in it: the line keeps its height,
         and the alert region exists before an error is written into it, so the
         first one is announced. With nothing to say there is no line at all. -->
    <p
      v-if="hasSupport()"
      v-bind="supportAttrs"
      class="ui-text-field__support"
    >
      <MIcon
        v-if="isError && !$slots.error"
        :name="ICONS.error"
        class="ui-text-field__support-icon"
        aria-hidden="true"
      />

      <span
        v-bind="alertAttrs"
        class="ui-text-field__alert"
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
import { mergeProps } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { mTextFieldProps } from './props'
import type { MTextFieldSlots } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useTextFieldControl } from '#kit/composables/text-field/useTextFieldControl'
import { createFieldBoxPress } from '#kit/utils/text-field/boxPress'
import { useSupportLine } from '#kit/utils/text-field/supportLine'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mTextFieldProps)
const slots = defineSlots<MTextFieldSlots>()

const controlRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const modelValue = defineModel<string>({ default: '' })
const isFocused = defineModel<boolean>('focused', { default: false })

const {
  isError,
  message,
  inputAttrs,
  labelAttrs,
  supportAttrs,
  alertAttrs,
  prefixAttrs,
  suffixAttrs,
} = useTextFieldControl(modelValue, isFocused, props)

const box = createFieldBoxPress(inputRef)
const hasSupport = useSupportLine(props, slots)

// Slots are not reactive: a computed over them keeps the first render's
// answer, so a composite's chips that arrived later never got a row. Their
// presence is read on every render instead.
const hasPrepend = () => Boolean(slots.prepend)
const hasAppend = () => Boolean(slots.append)
const hasLeading = () => Boolean(slots['leading-content'])
const hasRow = () => hasLeading() || Boolean(props.prefix || props.suffix)

// The notch is sized by this copy of the label, so it carries the asterisk too.
const notchText = computed(() => props.required ? `${props.label} *` : props.label)

const rootClasses = () => [
  `ui-text-field--${props.variant}`,
  `ui-text-field--shape-${props.shape}`,
  `ui-text-field--label-${props.labelPlacement}`,
  `ui-text-field--density-${props.density}`,
  {
    'ui-text-field--focused': isFocused.value,
    'ui-text-field--error': isError.value,
    'ui-text-field--disabled': props.disabled,
    'ui-text-field--prepend': hasPrepend(),
    'ui-text-field--append': hasAppend(),
  },
]

// A composite's bag (`inputAttrs`) merges under the field's own, and the
// consumer's fallthrough under both: the field's own values win a clash,
// listeners from all three are chained. Called from the template, because
// fallthrough attributes are current on every render but not reactive.
const inputBindings = () => controlAttrs(mergeProps({ ...props.inputAttrs }, inputAttrs.value))

/**
 * The two boxes a composite field needs to reach: `control` is the drawn
 * container — what a popover anchors to, since the support line sits outside it
 * — and `input` is where focus belongs.
 */
defineExpose({ control: controlRef, input: inputRef })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/text-field' as t;
@use '#kit/assets/stylesheet/components/text-field/family' as family;
@use '#kit/assets/stylesheet/components/text-field/label' as label;
@use '#kit/assets/stylesheet/components/text-field/parts' as parts;
@use '#kit/assets/stylesheet/components/text-field/states' as states;

.ui-text-field {
  $t: material-map(t.$tokens, 'm-text-field');

  --ui-text-field-inset: #{g($t, 'container.padding.inline')};

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  // ── axes · a modifier only picks values; every rule reads them once ──
  @each $d in compact, default, comfortable {
    &--density-#{$d} {
      --ui-text-field-height: #{g($t, 'density.#{$d}.height')};
      --ui-text-field-label-top: #{g($t, 'density.#{$d}.label.top')};
      --ui-text-field-input-padding-top: #{g($t, 'density.#{$d}.input.padding.top')};
      --ui-text-field-input-padding-bottom: #{g($t, 'density.#{$d}.input.padding.bottom')};
    }
  }

  @include family.shape-axis($t, 'text-field');

  &--outlined {
    --ui-text-field-inset: #{g($t, 'outlined.inset')};
  }

  @include label.label($t);

  &__control {
    position: relative;

    // Contains the filled state layer, so its negative z-index cannot slip
    // behind an ancestor's background.
    isolation: isolate;
    display: flex;
    align-items: center;
    min-height: var(--ui-text-field-height);
    padding-inline: var(--ui-text-field-inset);
    border: g($t, 'container.border.width') solid transparent;
    border-radius: var(--ui-text-field-radius);
    cursor: text;
    transition:
      border-color g($t, 'state.duration') g($t, 'state.easing'),
      background-color g($t, 'state.duration') g($t, 'state.easing');
  }

  &--prepend .ui-text-field__control {
    padding-inline-start: g($t, 'container.padding.prepend');
  }

  &--append .ui-text-field__control {
    padding-inline-end: g($t, 'container.padding.append');
  }

  &__input {
    flex: 1;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    outline: none;
    background-color: transparent;
    color: g($t, 'input.color');
    caret-color: g($t, 'input.caret.color');

    // A value longer than the box says so instead of stopping mid-letter; in
    // focus the browser shows the caret and scrolls as usual.
    text-overflow: ellipsis;

    @include typescale(g($t, 'typography.input'));
    @include family.autofill($t);

    &::placeholder {
      color: g($t, 'input.placeholder.color');
    }
  }

  @include parts.parts($t);
  @include states.states($t);
}
</style>
