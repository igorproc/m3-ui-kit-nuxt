<template>
  <div
    v-bind="rootAttrs()"
    class="ui-text-field"
    :class="rootClasses"
  >
    <label
      v-if="label"
      :for="fieldId"
      class="ui-text-field__label"
    >
      {{ label }}
    </label>

    <div
      ref="controlRef"
      class="ui-text-field__control"
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
          <span class="ui-text-field__notch-text">{{ label }}</span>
        </legend>
      </fieldset>

      <span
        v-if="hasPrepend"
        class="ui-text-field__icon ui-text-field__icon--prepend"
      >
        <slot name="prepend" />
      </span>

      <div
        v-if="$slots['leading-content']"
        class="ui-text-field__field ui-text-field__row"
      >
        <span class="ui-text-field__leading">
          <slot name="leading-content" />
        </span>

        <input
          :id="fieldId"
          ref="inputRef"
          v-model="modelValue"
          class="ui-text-field__input"
          v-bind="{ ...controlAttrs(), ...inputAttrs }"
          :type="type"
          :name="name ?? path"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :autofocus="autofocus"
          :autocomplete="autocomplete"
          :aria-invalid="isError || undefined"
          :aria-required="required || undefined"
          :aria-describedby="describedBy"
          @focus="onFocus"
          @blur="onBlur"
        >
      </div>

      <input
        v-else
        :id="fieldId"
        ref="inputRef"
        v-model="modelValue"
        class="ui-text-field__input ui-text-field__row"
        v-bind="{ ...controlAttrs(), ...inputAttrs }"
        :type="type"
        :name="name ?? path"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autofocus="autofocus"
        :autocomplete="autocomplete"
        :aria-invalid="isError || undefined"
        :aria-required="required || undefined"
        :aria-describedby="describedBy"
        @focus="onFocus"
        @blur="onBlur"
      >

      <span
        v-if="hasAppend"
        class="ui-text-field__icon ui-text-field__icon--append"
      >
        <slot name="append" />
      </span>
    </div>

    <p
      v-if="displayMessage"
      :id="messageId"
      class="ui-text-field__support"
      :class="isError ? 'ui-text-field__support--error' : 'ui-text-field__support--helper'"
      :role="isError ? 'alert' : undefined"
      :aria-live="isError ? 'assertive' : 'polite'"
    >
      {{ displayMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { mTextFieldProps } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mTextFieldProps)
const slots = useSlots()

const controlRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const modelValue = defineModel<string>({ default: '' })
const isFocused = defineModel<boolean>('focused', { default: false })
const fieldId = useId()

const { errorMessage, isError, meta, onFocus, onBlur } = useTextField({
  path: props.path,
  model: modelValue,
  focused: isFocused,
  error: () => props.error,
  externalError: () => props.errorMessage,
})

const hasPrepend = computed(() => Boolean(slots.prepend))
const hasAppend = computed(() => Boolean(slots.append))
const isPopulated = computed(() => props.populated || Boolean(modelValue.value))

const rootClasses = computed(() => [
  `ui-text-field--${props.variant}`,
  `ui-text-field--${props.rounded}`,
  `ui-text-field--label-${props.labelPlacement}`,
  `ui-text-field--density-${props.density}`,
  {
    'ui-text-field--focused': isFocused.value,
    'ui-text-field--populated': isPopulated.value,
    'ui-text-field--error': isError.value,
    'ui-text-field--disabled': props.disabled,
    'ui-text-field--prepend': hasPrepend.value,
    'ui-text-field--append': hasAppend.value,
  },
])

const displayMessage = computed(() => errorMessage.value || (props.error ? props.helperText : undefined) || props.helperText)
const messageId = computed(() => isError.value ? `${fieldId}-error` : `${fieldId}-helper`)
const describedBy = computed(() => displayMessage.value ? messageId.value : undefined)

/**
 * The two boxes a composite field needs to reach: `control` is the drawn
 * container — what a popover anchors to, since the support line sits outside it
 * — and `input` is where focus belongs.
 */
defineExpose({ control: controlRef, input: inputRef })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/text-field' as t;

.ui-text-field {
  $t: material-map(t.$tokens, 'm-text-field');

  --ui-text-field-inset: #{g($t, 'container.padding.inline')};

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  // ── axes · a modifier only picks values; every rule below reads them once ──
  @each $d in compact, default, comfortable {
    &--density-#{$d} {
      --ui-text-field-height: #{g($t, 'density.#{$d}.height')};
      --ui-text-field-label-top: #{g($t, 'density.#{$d}.label.top')};
      --ui-text-field-label-raised-inside: #{g($t, 'density.#{$d}.label.transform.inside')};
      --ui-text-field-label-raised-notch: #{g($t, 'density.#{$d}.label.transform.notch')};
      --ui-text-field-input-padding-top: #{g($t, 'density.#{$d}.input.padding.top')};
      --ui-text-field-input-padding-bottom: #{g($t, 'density.#{$d}.input.padding.bottom')};
    }
  }

  @each $r in sharp, small, medium, large, pill {
    &--#{$r} {
      --ui-text-field-radius: #{g($t, 'rounded.#{$r}')};
    }
  }

  // A filled box has a flat bottom, so a full-radius top would dome it on a short
  // field — cap `pill` at the large tier for filled only.
  &--filled.ui-text-field--pill {
    --ui-text-field-radius: #{g($t, 'rounded.large')};
  }

  &--outlined {
    --ui-text-field-inset: #{g($t, 'outlined.inset')};
  }

  &__label {
    color: g($t, 'label.color');

    @include typescale(g($t, 'typography.label'));
  }

  // ── label placement · an axis of its own, independent of the shape ──
  // Base is `top`: the label is a block above the container. Everything else is
  // an override, so a placement can never be half-applied by a missing branch.

  // Overlay placements. The label is lifted out of flow and onto the container;
  // it moves by transform only, so position and font-size never animate.
  &--label-float,
  &--label-inset {
    .ui-text-field__label {
      position: absolute;
      top: var(--ui-text-field-label-top);
      left: var(--ui-text-field-inset);
      z-index: 1;
      max-width: g($t, 'label.max-width');
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
      transform: translateY(-50%);

      // Scale around the vertical center so shrinking never shifts the label's
      // center — the raise is then pure `height/2` math (no fudge factor).
      transform-origin: left center;
      transition:
        transform g($t, 'state.duration') g($t, 'state.easing'),
        color g($t, 'state.duration') g($t, 'state.easing');
    }
  }

  // Present for assistive tech, absent for the eye.
  &--label-hidden .ui-text-field__label {
    @include sr-only;
  }

  &--prepend {
    --ui-text-field-label-notch-shift: #{g($t, 'label.prepend.notch.shift')};

    .ui-text-field__label {
      left: g($t, 'label.prepend.left');
    }
  }

  &__control {
    position: relative;
    display: flex;
    align-items: center;
    min-height: var(--ui-text-field-height);
    padding-inline: var(--ui-text-field-inset);
    border: g($t, 'container.border.width') solid transparent;
    border-radius: var(--ui-text-field-radius);
    transition:
      border-color g($t, 'state.duration') g($t, 'state.easing'),
      background-color g($t, 'state.duration') g($t, 'state.easing'),
      box-shadow g($t, 'state.duration') g($t, 'state.easing');
  }

  &--prepend .ui-text-field__control {
    padding-left: g($t, 'container.padding.prepend');
  }

  &--append .ui-text-field__control {
    padding-right: g($t, 'container.padding.append');
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

    @include typescale(g($t, 'typography.input'));

    &::placeholder {
      transition: opacity g($t, 'state.duration') g($t, 'state.easing');
    }
  }

  // Composite input row: inline content (chips) + native input on one scrolling row.
  &__field {
    display: flex;
    flex: 1;
    flex-wrap: nowrap;
    align-items: center;
    gap: g($t, 'container.field.gap');
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    .ui-text-field__input {
      flex: 1 0 g($t, 'container.field.input-min-width');
      width: auto;
    }
  }

  // Holds the consumer's inline content (chips) at its natural width, so it
  // never shrinks under the input.
  &__leading {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: g($t, 'container.field.gap');
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: g($t, 'icon.width');
    color: g($t, 'icon.color');
    font-size: g($t, 'icon.size');

    &--prepend {
      margin-right: g($t, 'icon.prepend.margin');
    }

    &--append {
      margin-left: g($t, 'icon.append.margin');
    }
  }

  // ── outline · rendered by the outlined shape only ─────────────
  // A `<fieldset>` laid over the control's own (transparent) border, so the
  // browser cuts the notch: the hidden `<legend>` holds the label text at the
  // raised size, and the border breaks exactly where it sits. No patch is painted
  // behind the label, so the field reads right on any surface, and the gap is
  // correct in the server-rendered HTML — nothing is measured.
  &__outline {
    position: absolute;
    inset: g($t, 'outlined.outline.inset');
    min-width: 0;
    padding-block: 0;
    padding-inline: g($t, 'outlined.outline.padding.start') 0;
    margin: 0;
    border: g($t, 'container.border.width') solid g($t, 'outlined.border.color');
    border-radius: inherit;
    pointer-events: none;
    transition: border-color g($t, 'state.duration') g($t, 'state.easing');
  }

  @include can-hover {
    &__control:hover .ui-text-field__outline {
      border-color: g($t, 'outlined.hover.border.color');
    }
  }

  // As tall as the border it sits on, so the fieldset never shifts its top edge
  // to centre a taller legend. Its width is the only thing that matters.
  &__notch {
    display: block;
    width: auto;
    max-width: 0.01rem;
    height: g($t, 'container.border.width');
    padding: 0;
    overflow: hidden;
    visibility: hidden;
    white-space: nowrap;
    transition: max-width g($t, 'state.duration') g($t, 'state.easing');

    @include typescale(g($t, 'typography.label'));
  }

  &__notch-text {
    display: inline-block;
    padding-inline: g($t, 'outlined.notch.padding.inline');
    font-size: g($t, 'outlined.notch.font-size');
  }

  // Disabled content. A shape that has its own disabled ink overrides it below.
  &--disabled .ui-text-field__control {
    cursor: default;

    .ui-text-field__input {
      color: g($t, 'filled.disabled.input.color');
    }

    .ui-text-field__icon {
      color: g($t, 'filled.disabled.icon.color');
    }
  }

  // ── shapes · each walks its states in ascending order ─────────
  // base → hover → focused → error → error + focused → disabled. Every state
  // rule within a shape carries the same weight, so the later one wins.
  &--filled {
    .ui-text-field__control {
      border-bottom-color: g($t, 'filled.border.bottom.color');
      border-bottom-right-radius: 0;
      border-bottom-left-radius: 0;
      background-color: g($t, 'filled.bg');

      @include can-hover {
        &:hover {
          border-bottom-color: g($t, 'filled.hover.border.bottom.color');
          background-color: g($t, 'filled.hover.bg');
        }
      }
    }

    &.ui-text-field--focused {
      .ui-text-field__control {
        border-bottom-color: g($t, 'filled.focused.border.bottom.color');
        background-color: g($t, 'filled.focused.bg');
      }

      .ui-text-field__label {
        color: g($t, 'filled.focused.label.color');
      }
    }

    &.ui-text-field--error {
      .ui-text-field__control {
        border-color: g($t, 'filled.error.border.bottom.color');
      }

      .ui-text-field__label {
        color: g($t, 'filled.error.label.color');
      }
    }

    &.ui-text-field--error.ui-text-field--focused .ui-text-field__control {
      border-bottom-color: g($t, 'filled.error.focused.border.bottom.color');
    }

    &.ui-text-field--disabled {
      .ui-text-field__control {
        border-color: g($t, 'filled.disabled.border.bottom.color');
        background-color: g($t, 'filled.disabled.bg');
      }

      .ui-text-field__label {
        color: g($t, 'filled.disabled.label.color');
      }
    }
  }

  // The control's own border stays transparent — the outline carries the colour.
  &--outlined {
    &.ui-text-field--focused {
      .ui-text-field__outline {
        border-color: g($t, 'outlined.focused.border.color');
      }

      .ui-text-field__label {
        color: g($t, 'outlined.focused.label.color');
      }
    }

    &.ui-text-field--error {
      .ui-text-field__outline {
        border-color: g($t, 'outlined.error.border.color');
      }

      .ui-text-field__label {
        color: g($t, 'outlined.error.label.color');
      }
    }

    &.ui-text-field--error.ui-text-field--focused .ui-text-field__outline {
      border-color: g($t, 'outlined.error.focused.border.color');
    }

    &.ui-text-field--disabled {
      .ui-text-field__outline {
        border-color: g($t, 'outlined.disabled.border.color');
      }

      .ui-text-field__input {
        color: g($t, 'outlined.disabled.input.color');
      }

      .ui-text-field__icon {
        color: g($t, 'outlined.disabled.icon.color');
      }

      .ui-text-field__label {
        color: g($t, 'outlined.disabled.label.color');
      }
    }
  }

  // A single bottom rule, lowest ink.
  &--underline {
    .ui-text-field__control {
      padding-inline: 0;
      border: none;
      border-bottom: g($t, 'container.border.width') solid g($t, 'outlined.border.color');
      border-radius: 0;

      @include can-hover {
        &:hover {
          border-bottom-color: g($t, 'outlined.hover.border.color');
        }
      }
    }

    .ui-text-field__label {
      left: 0;
    }

    &.ui-text-field--focused {
      .ui-text-field__control {
        border-bottom-color: g($t, 'outlined.focused.border.color');
      }

      .ui-text-field__label {
        color: g($t, 'outlined.focused.label.color');
      }
    }

    &.ui-text-field--error {
      .ui-text-field__control {
        border-color: g($t, 'filled.error.border.bottom.color');
      }

      .ui-text-field__label {
        color: g($t, 'filled.error.label.color');
      }
    }

    &.ui-text-field--error.ui-text-field--focused .ui-text-field__control {
      border-bottom-color: g($t, 'filled.error.focused.border.bottom.color');
    }

    &.ui-text-field--disabled {
      .ui-text-field__control {
        border-color: g($t, 'filled.disabled.border.bottom.color');
      }

      .ui-text-field__label {
        color: g($t, 'filled.disabled.label.color');
      }
    }
  }

  // ── raised label · `inset` always, `float` once focused or filled ──
  &--label-inset,
  &--label-float.ui-text-field--focused,
  &--label-float.ui-text-field--populated {
    &.ui-text-field--filled .ui-text-field__label,
    &.ui-text-field--underline .ui-text-field__label {
      transform: var(--ui-text-field-label-raised-inside);
    }

    // The label rises onto the top border, into the gap the legend opens for it.
    &.ui-text-field--outlined {
      .ui-text-field__label {
        transform: translateX(var(--ui-text-field-label-notch-shift, 0)) var(--ui-text-field-label-raised-notch);
      }

      .ui-text-field__notch {
        max-width: 100%;
      }
    }
  }

  // The asymmetric padding exists only to clear a label sitting inside the box.
  // It is applied to the row the label sits over (`__row`): the bare input, or —
  // when a composite field fills `leading-content` — the row that holds the chips
  // *and* the input. Padding only the input would leave the chips centred in the
  // box, under the raised label.
  &--label-float.ui-text-field--filled,
  &--label-inset.ui-text-field--filled {
    .ui-text-field__row {
      padding-top: var(--ui-text-field-input-padding-top);
      padding-bottom: var(--ui-text-field-input-padding-bottom);
    }
  }

  // A placeholder is hidden only while a resting floating label sits on top of
  // it. Every other placement leaves the first line free.
  &--label-float .ui-text-field__input::placeholder {
    opacity: 0;
  }

  &--label-float.ui-text-field--focused .ui-text-field__input::placeholder,
  &--label-float.ui-text-field--populated .ui-text-field__input::placeholder {
    opacity: 1;
  }

  // ── support line · reserved height so valid⇄invalid never reflows ──
  &__support {
    min-height: g($t, 'helper.min-height');
    padding-inline: g($t, 'helper.padding.inline');
    margin-top: g($t, 'helper.margin.top');

    @include typescale(g($t, 'typography.helper'));

    &--helper {
      color: g($t, 'helper.color');
    }

    &--error {
      color: g($t, 'filled.error.helper.color');
    }
  }

  // ── forced colours · every edge turns CanvasText, so the states that were a
  // colour change alone are restated in system colours ──
  @include forced-colors {
    // The control's transparent border under the outline is forced visible
    // too, and would run straight through the label's notch.
    &--outlined .ui-text-field__control {
      border-color: Canvas;
    }

    // `.ui-text-field` is repeated to match the error + focused rule's weight,
    // so source order alone decides — and focus outranks error.
    // Error is a dashed edge: a system colour for it (Mark) can vanish on a
    // light contrast theme, a line style cannot.
    &.ui-text-field--error {
      &.ui-text-field--filled .ui-text-field__control,
      &.ui-text-field--underline .ui-text-field__control {
        border-bottom-style: dashed;
        border-bottom-color: CanvasText;
      }

      &.ui-text-field--outlined .ui-text-field__outline {
        border-style: dashed;
        border-color: CanvasText;
      }
    }

    &.ui-text-field--focused {
      &.ui-text-field--filled .ui-text-field__control,
      &.ui-text-field--underline .ui-text-field__control {
        border-bottom-color: Highlight;
      }

      &.ui-text-field--outlined .ui-text-field__outline {
        border-color: Highlight;
      }
    }

    &.ui-text-field--disabled {
      &.ui-text-field--filled .ui-text-field__control,
      &.ui-text-field--underline .ui-text-field__control,
      &.ui-text-field--outlined .ui-text-field__outline {
        border-color: GrayText;
      }

      .ui-text-field__label,
      .ui-text-field__input {
        color: GrayText;
      }
    }
  }
}
</style>
