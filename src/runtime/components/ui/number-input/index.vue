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
          v-bind="{ ...controlAttrs(), ...inputAttrs }"
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
        v-if="message"
        class="ui-number-input__support-text"
      >
        <slot
          v-if="isError && $slots.error"
          name="error"
          :message="message"
        />
        <slot
          v-else-if="!isError && $slots.helper"
          name="helper"
          :message="message"
        />
        <template v-else>
          {{ message }}
        </template>
      </span>
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
  isPopulated,
  isError,
  message,
  nextIncrement,
  nextDecrement,
  inputAttrs,
  labelAttrs,
  supportAttrs,
  incrementAttrs,
  decrementAttrs,
} = useNumberInputControl(modelValue, focusedModel, props, {
  onStep: (direction, value) => emit(direction > 0 ? 'increment' : 'decrement', value),
  onInvalid: (value, reason) => emit('invalid', value, reason),
})

const isScrub = computed(() => props.controls === 'scrub')
// The notch is sized by this copy of the label, so it carries the asterisk too.
const notchText = computed(() => props.required ? `${props.label} *` : props.label)
const hasUnit = computed(() => Boolean(unitModel.value) || Boolean(props.units?.length))

const rootClasses = computed(() => [
  'ui-number-input',
  `ui-number-input--${props.variant}`,
  `ui-number-input--${props.rounded}`,
  `ui-number-input--label-${props.labelPlacement}`,
  `ui-number-input--density-${props.density}`,
  {
    'ui-number-input--interactive': !props.disabled && !props.readonly,
    'ui-number-input--focused': isFocused.value,
    'ui-number-input--populated': isPopulated.value,
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

.ui-number-input {
  $t: material-map(t.$tokens, 'm-number-input');

  --ui-number-input-inset: #{g($t, 'container.padding.inline')};

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  // ── axes · a modifier only picks values; every rule below reads them once ──
  @each $d in compact, default, comfortable {
    &--density-#{$d} {
      --ui-number-input-height: #{g($t, 'density.#{$d}.height')};
      --ui-number-input-label-top: #{g($t, 'density.#{$d}.label.top')};
      --ui-number-input-label-raised-inside: #{g($t, 'density.#{$d}.label.transform.inside')};
      --ui-number-input-label-raised-notch: #{g($t, 'density.#{$d}.label.transform.notch')};
      --ui-number-input-input-padding-top: #{g($t, 'density.#{$d}.input.padding.top')};
      --ui-number-input-input-padding-bottom: #{g($t, 'density.#{$d}.input.padding.bottom')};
      --ui-number-input-stepper-size: #{g($t, 'density.#{$d}.stepper.split')};
      --ui-number-input-stacked-height: #{g($t, 'density.#{$d}.stepper.stacked')};
      --ui-number-input-zone-offset: #{g($t, 'density.#{$d}.stepper.offset')};
    }
  }

  // The zones ride the same axis, one tier rounder — so `rounded="pill"` turns
  // them into pills without a second visual language to maintain.
  @each $r in sharp, small, medium, large, pill {
    &--#{$r} {
      --ui-number-input-radius: #{g($t, 'rounded.#{$r}')};
      --ui-number-input-zone-radius: #{g($t, 'stepper.radius.#{$r}')};
    }
  }

  // A filled box has a flat bottom, so a full radius would dome it — cap `pill`
  // at the large tier for filled only.
  &--filled.ui-number-input--pill {
    --ui-number-input-radius: #{g($t, 'rounded.large')};
  }

  &--outlined {
    --ui-number-input-inset: #{g($t, 'outlined.inset')};
  }

  // ── label · base is `top`, a block above the container ──
  &__label {
    overflow-wrap: anywhere;
    color: g($t, 'label.color');

    @include typescale(g($t, 'typography.label'));
  }

  &__required {
    color: g($t, 'label.required.color');
  }

  // ── label placement · an axis of its own, independent of the shape ──
  // Overlay placements lift the label out of flow and onto the container; it
  // moves by transform only, so position and font-size never animate.
  &--label-float,
  &--label-inset {
    .ui-number-input__label {
      position: absolute;
      top: var(--ui-number-input-label-top);
      inset-inline-start: var(--ui-number-input-inset);
      z-index: 1;
      max-width: g($t, 'label.max-width');
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
      transform: translateY(-50%);

      // Scale around the vertical center, so shrinking never shifts the
      // label's center and the raise stays pure `height / 2` math.
      transform-origin: left center;
      transition:
        transform g($t, 'state.duration') g($t, 'state.easing'),
        color g($t, 'state.duration') g($t, 'state.easing');

      &:dir(rtl) {
        transform-origin: right center;
      }
    }
  }

  // A leading split zone would sit under an overlaid label; start it past the
  // zone. In flow the label is above the box, so nothing overlaps.
  &--split {
    --ui-number-input-label-notch-shift: #{g($t, 'label.split.notch.shift')};

    // The shift is a physical translate, so it runs the other way in RTL.
    &:dir(rtl) {
      --ui-number-input-label-notch-shift: calc(#{g($t, 'label.split.notch.shift')} * -1);
    }

  }

  &--label-float.ui-number-input--split,
  &--label-inset.ui-number-input--split {
    .ui-number-input__label {
      inset-inline-start: g($t, 'label.split.left');
      max-width: g($t, 'label.split.max-width');
    }
  }

  &--label-hidden .ui-number-input__label {
    @include sr-only;
  }

  // ── container · owns the border and the surface ──
  // `align-items: stretch` is what makes the stepper zones full-height, and
  // `overflow: hidden` is what makes their edges follow the corner radius.
  &__control {
    position: relative;
    display: flex;
    align-items: stretch;
    min-height: var(--ui-number-input-height);
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

    // Spec rule: numeric values use tabular figures so digits never shift width
    // while stepping.
    font-variant-numeric: tabular-nums;

    @include typescale(g($t, 'typography.input'));

    &::placeholder {
      color: g($t, 'input.placeholder.color');
      transition: opacity g($t, 'state.duration') g($t, 'state.easing');
    }
  }

  &__adornment {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    color: g($t, 'adornment.color');
    font-size: g($t, 'adornment.size');
  }

  // ── outline · rendered by the outlined shape only ─────────────
  // A `<fieldset>` over the control's frame, so the browser cuts the notch: the
  // hidden `<legend>` holds the label text at the raised size, and the border
  // breaks exactly where it sits. No patch is painted behind the label, so the
  // field reads right on any surface, and the gap is correct in the
  // server-rendered HTML — nothing is measured. Its colour is the control's own
  // border colour, so every state below writes one property for both shapes.
  &__outline {
    position: absolute;
    inset: 0;
    min-width: 0;
    padding-block: 0;
    padding-inline: g($t, 'outlined.outline.padding.start') 0;
    margin: 0;
    border-width: g($t, 'container.border.width');
    border-style: solid;
    border-color: inherit;
    border-radius: inherit;
    pointer-events: none;
    transition: border-color g($t, 'state.duration') g($t, 'state.easing');
  }

  // As tall as the border it sits on, so the fieldset never shifts its top edge
  // to centre a taller legend. Its width is the only thing that matters.
  &__notch {
    display: block;
    width: auto;
    max-width: g($t, 'outlined.notch.collapsed');
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

  // ── stepper zones · tone and shape, never a divider ──
  // A zone is an object sitting inside the box: its own surface tone, its own
  // corner radius, inset from the container edge. Material has no hairline
  // inside a control — that is what made the field read as a form toolkit.
  &__stepper {
    position: relative;
    display: flex;
    flex: 0 0 auto;
    align-self: center;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
    border: none;
    border-radius: var(--ui-number-input-zone-radius);
    background-color: g($t, 'stepper.surface');
    color: g($t, 'stepper.color');
    cursor: pointer;

    // MD3 state layer: an overlay in the element's own ink, so the tone below
    // keeps showing through. A background swap would replace it instead.
    &::after {
      position: absolute;
      inset: 0;
      background-color: currentcolor;
      content: '';
      opacity: 0;
      pointer-events: none;
      transition: opacity g($t, 'state.duration') g($t, 'state.easing');
    }

    @include can-hover {
      &:enabled:hover::after {
        opacity: g($t, 'layer.hover');
      }
    }

    &:enabled:active::after {
      opacity: g($t, 'layer.pressed');
    }

    &:disabled {
      color: g($t, 'stepper.disabled.color');
      cursor: default;
    }
  }

  &--split .ui-number-input__stepper {
    width: var(--ui-number-input-stepper-size);
    height: var(--ui-number-input-stepper-size);
    margin-inline: g($t, 'stepper.inset');
    font-size: g($t, 'stepper.split.size');
  }

  // One column of arrows at the trailing edge, halved by a gap rather than by a
  // rule — the container tone shows through the seam.
  &__stacked {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-self: center;
    gap: g($t, 'container.border.width');
    width: g($t, 'stepper.stacked.width');
    height: var(--ui-number-input-stacked-height);
    margin-inline: g($t, 'stepper.inset');
    border-radius: var(--ui-number-input-zone-radius);

    .ui-number-input__stepper {
      flex: 1;
      align-self: stretch;
      width: 100%;
      margin: 0;
      font-size: g($t, 'stepper.stacked.size');
    }

    .ui-number-input__stepper--increment {
      border-radius: var(--ui-number-input-zone-radius) var(--ui-number-input-zone-radius) 0 0;
    }

    .ui-number-input__stepper--decrement {
      border-radius: 0 0 var(--ui-number-input-zone-radius) var(--ui-number-input-zone-radius);
    }
  }

  // ── scrub · the label itself is the drag target ──
  &__scrub {
    flex: 0 1 auto;
    min-width: 0;
    max-width: g($t, 'scrub.max-width');
    overflow: hidden;
    margin-inline-end: g($t, 'scrub.padding.inline');
    border-bottom: g($t, 'scrub.border.width') g($t, 'scrub.border.style') g($t, 'scrub.color');
    color: g($t, 'scrub.color');
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: ew-resize;
    user-select: none;

    // The gesture owns horizontal pointer movement; without this a touch drag
    // scrolls the page instead of changing the value.
    touch-action: none;

    @include typescale(g($t, 'typography.scrub'));
  }

  // The label is in the box now, so nothing has to make room above the value.
  &--scrub &__input {
    padding-block: 0;
  }

  // ── shapes · base → hover → focused → error → disabled ──
  // Hover and focus answer an editable field only. `:where()` gates them on
  // `--interactive` without adding weight, so every state rule in a shape
  // carries the same weight and the later one wins.
  &--filled {
    .ui-number-input__control {
      border-color: transparent;
      border-bottom-color: g($t, 'filled.border.color');
      border-end-start-radius: 0;
      border-end-end-radius: 0;
      background-color: g($t, 'filled.surface');
    }

    // On the highest surface a step up has nowhere to go, so the zone is drawn
    // as a state layer over the container instead of as the next tone.
    .ui-number-input__stepper {
      background-color: g($t, 'stepper.filled.surface');
    }

    @include can-hover {
      &:where(.ui-number-input--interactive) .ui-number-input__control:hover {
        border-bottom-color: g($t, 'filled.hover.border.color');
        background-color: g($t, 'filled.hover.surface');
      }
    }

    &.ui-number-input--error .ui-number-input__control {
      border-bottom-color: g($t, 'error.border.color');
    }

    // After error: focus stays visible in an invalid field (and in read-only);
    // the label and the message keep saying "error".
    &.ui-number-input--focused .ui-number-input__control {
      border-bottom-color: g($t, 'focused.border.color');
    }

    &.ui-number-input--disabled .ui-number-input__control {
      border-bottom-color: g($t, 'disabled.border.color');
      background-color: g($t, 'filled.disabled.surface');
    }
  }

  &--outlined {
    .ui-number-input__control {
      padding: g($t, 'outlined.frame');
      border-width: 0;
    }

    @include can-hover {
      &:where(.ui-number-input--interactive) .ui-number-input__control:hover {
        border-color: g($t, 'outlined.hover.border.color');
      }
    }

    &.ui-number-input--error .ui-number-input__control {
      border-color: g($t, 'error.border.color');
    }

    // After error: focus stays visible in an invalid field (and in read-only);
    // the label and the message keep saying "error".
    &.ui-number-input--focused .ui-number-input__control {
      border-color: g($t, 'focused.border.color');
    }

    &.ui-number-input--disabled .ui-number-input__control {
      border-color: g($t, 'disabled.border.color');
      background-color: g($t, 'disabled.surface');
    }
  }

  // ── content · the same ink in every shape, states ascending ──
  &--focused:where(.ui-number-input--interactive) .ui-number-input__label {
    color: g($t, 'focused.label.color');
  }

  &--error {
    .ui-number-input__label,
    .ui-number-input__support {
      color: g($t, 'error.color');
    }
  }

  &--disabled {
    .ui-number-input__label,
    .ui-number-input__input,
    .ui-number-input__adornment,
    .ui-number-input__unit,
    .ui-number-input__scrub,
    .ui-number-input__support {
      color: g($t, 'disabled.color');
    }

    .ui-number-input__scrub {
      border-bottom-color: g($t, 'disabled.color');
      cursor: default;
    }
  }

  // ── raised label · `inset` always, `float` once focused or filled ──
  &--label-inset,
  &--label-float.ui-number-input--focused,
  &--label-float.ui-number-input--populated {
    &.ui-number-input--filled .ui-number-input__label {
      transform: var(--ui-number-input-label-raised-inside);
    }

    // The label rises onto the top border, into the gap the legend opens for it.
    &.ui-number-input--outlined {
      .ui-number-input__label {
        transform: translateX(var(--ui-number-input-label-notch-shift, 0)) var(--ui-number-input-label-raised-notch);
      }

      .ui-number-input__notch {
        max-width: 100%;
      }
    }
  }

  // The asymmetric padding exists only to clear a label sitting inside the box.
  // The zones ride down with the value so they line up with the digits.
  &--label-float.ui-number-input--filled,
  &--label-inset.ui-number-input--filled {
    .ui-number-input__input {
      padding-top: var(--ui-number-input-input-padding-top);
      padding-bottom: var(--ui-number-input-input-padding-bottom);
    }

    .ui-number-input__stepper,
    .ui-number-input__stacked {
      margin-top: var(--ui-number-input-zone-offset);
    }
  }

  // A placeholder is hidden only while a resting floating label sits on top of
  // it. Every other placement — and scrub, which has no overlaid label — leaves
  // the first line free.
  &--label-float .ui-number-input__input::placeholder {
    opacity: 0;
  }

  &--label-float.ui-number-input--focused .ui-number-input__input::placeholder,
  &--label-float.ui-number-input--populated .ui-number-input__input::placeholder,
  &--scrub .ui-number-input__input::placeholder {
    opacity: 1;
  }

  // ── read-only · the container stays, the interaction does not ──
  &--readonly &__scrub {
    cursor: default;
  }

  // A drag must not leave text selected in its wake, and the pointer keeps the
  // resize cursor even once it has left the handle.
  &--scrubbing {
    cursor: ew-resize;
    user-select: none;
  }

  &--scrubbing &__scrub {
    border-bottom-style: g($t, 'scrub.active.border.style');
    color: g($t, 'scrub.active.color');
  }

  // ── support line ──
  // Always mounted: its height is reserved, and as a live region it has to
  // exist before the error text arrives in it.
  &__support {
    display: flex;
    align-items: center;
    gap: g($t, 'support.icon.gap');
    min-height: g($t, 'support.min-height');
    padding-inline: g($t, 'support.padding.inline');
    margin: g($t, 'support.margin.top') 0 0;
    overflow-wrap: anywhere;
    color: g($t, 'support.color');
    transition: color g($t, 'state.duration') g($t, 'state.easing');

    @include typescale(g($t, 'typography.support'));
  }

  // Validity has to survive without colour (WCAG 1.4.1), and an `error` with no
  // message has nothing but this glyph to say it.
  &__support-icon {
    flex: 0 0 auto;
    font-size: g($t, 'support.icon.size');
  }

  &__support-text {
    min-width: 0;
  }

  // ── forced colours · every edge turns CanvasText, so the states that were a
  // colour change alone are restated in system colours. The outline is named
  // directly, not reached through its `inherit`, which forcing may override. ──
  @include forced-colors {
    // Error is a dashed edge: a system colour for it (Mark) can vanish on a
    // light contrast theme, a line style cannot.
    &--error {
      &.ui-number-input--filled .ui-number-input__control {
        border-bottom-style: dashed;
        border-bottom-color: CanvasText;
      }

      .ui-number-input__outline {
        border-style: dashed;
        border-color: CanvasText;
      }
    }

    &--focused {
      &.ui-number-input--filled .ui-number-input__control {
        border-bottom-color: Highlight;
      }

      .ui-number-input__outline {
        border-color: Highlight;
      }
    }

    &--disabled {
      &.ui-number-input--filled .ui-number-input__control {
        border-bottom-color: GrayText;
      }

      .ui-number-input__outline {
        border-color: GrayText;
      }

      .ui-number-input__label,
      .ui-number-input__input {
        color: GrayText;
      }
    }

    // A zone is drawn by its tone alone, which forcing flattens into Canvas.
    &__stepper {
      border: g($t, 'container.border.width') solid ButtonText;

      &:disabled {
        border-color: GrayText;
      }

      &:enabled:active {
        border-color: Highlight;
      }
    }

    @include can-hover {
      &__stepper:enabled:hover {
        border-color: Highlight;
      }
    }
  }
}
</style>
