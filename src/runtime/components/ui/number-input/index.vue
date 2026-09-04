<template>
  <div :class="rootClasses">
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
          <MIcon name="round-remove" />
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
          v-bind="inputAttrs"
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
          <MIcon name="round-add" />
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
            <MIcon name="round-keyboard-arrow-up" />
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
            <MIcon name="round-keyboard-arrow-down" />
          </button>
        </slot>
      </span>
    </div>

    <p
      v-if="message"
      v-bind="supportAttrs"
      class="ui-number-input__support"
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
    </p>
  </div>
</template>

<script setup lang="ts">
import MIcon from '#kit/components/ui/icon/index.vue'
import MNumberInputUnit from './unit.vue'
import { useNumberInputControl } from '#kit/composables/number-input/useNumberInputControl'
import { mNumberInputProps } from './props'
import type { NumberInputInvalidReason } from '#kit/shared/utils/number'

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

$t-number: material-map(t.$tokens, 'm-number-input');

// The two raised positions, named once so the placement branches stay a list of
// selectors instead of a list of copied transforms.
@mixin number-label-raised-inside($raise) {
  transform: translateY(calc(-50% - #{$raise})) scale(g($t-number, 'label.active.scale'));
}

@mixin number-label-raised-notch($height) {
  background-color: g($t-number, 'outlined.label.surface');
  transform: translateY(calc(-50% - #{$height} / 2)) scale(g($t-number, 'label.active.scale'));
}

.ui-number-input {
  $t: material-map(t.$tokens, 'm-number-input');
  $pad-inline: g($t, 'container.padding.inline');

  position: relative;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  // ── label · base is `top`, a block above the container ──
  &__label {
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
    > .ui-number-input__label {
      position: absolute;
      left: g($t, 'label.left');
      z-index: 1;
      max-width: calc(100% - 32rem);
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
    }
  }

  // A leading split zone would sit under an overlaid label; start it past the
  // zone. In flow the label is above the box, so nothing overlaps.
  &--label-float.ui-number-input--split > &__label,
  &--label-inset.ui-number-input--split > &__label {
    left: g($t, 'label.split.left');
  }

  &--label-hidden > &__label {
    position: absolute;
    width: 1rem;
    height: 1rem;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  // ── container · owns the border and the surface ──
  // `align-items: stretch` is what makes the stepper zones full-height, and
  // `overflow: hidden` is what makes their edges follow the corner radius.
  &__control {
    position: relative;
    display: flex;
    align-items: stretch;
    overflow: hidden;
    border: g($t, 'container.border.width') solid g($t, 'container.border.color');
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
    padding-inline: $pad-inline;
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
      opacity: 0;
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

    &:hover:not(:disabled)::after {
      opacity: g($t, 'layer.hover');
    }

    &:active:not(:disabled)::after {
      opacity: g($t, 'layer.pressed');
    }

    &:disabled {
      color: g($t, 'stepper.disabled.color');
      cursor: default;
    }
  }

  // On the highest surface a step up has nowhere to go, so the zone is drawn as
  // a state layer over the container instead of as the next tone.
  &--filled &__stepper {
    background-color: g($t, 'stepper.filled.surface');
  }

  &--split &__stepper {
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
    margin-inline: g($t, 'stepper.inset');

    .ui-number-input__stepper {
      flex: 1;
      align-self: stretch;
      width: 100%;
      margin: 0;
      font-size: g($t, 'stepper.stacked.size');
    }
  }

  // ── scrub · the label itself is the drag target ──
  &__scrub {
    flex: 0 0 auto;
    margin-right: g($t, 'scrub.padding.inline');
    border-bottom: g($t, 'scrub.border.width') g($t, 'scrub.border.style') g($t, 'scrub.color');
    color: g($t, 'scrub.color');
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

  // ── shape · filled ──
  &--filled &__control {
    border-color: transparent;
    border-bottom-color: g($t, 'filled.border.color');
    background-color: g($t, 'filled.surface');
  }

  // ── shape · outlined · the raised label notches the top border ──
  &--label-float.ui-number-input--outlined > &__label,
  &--label-inset.ui-number-input--outlined > &__label {
    padding-inline: g($t, 'outlined.label.padding.inline');
    margin-left: g($t, 'outlined.label.margin.left');
  }

  // ── density · height, padding, zones, and the raise that follows ──
  // Every height-dependent rule is emitted here, once per step, so a density
  // can never be half-applied by a branch someone forgot to add.
  @each $d in compact, default, comfortable {
    $height: g($t, 'density.#{$d}.height');
    $raise: g($t, 'density.#{$d}.label.raise');
    $pad-top: g($t, 'density.#{$d}.input.padding.top');
    $pad-bottom: g($t, 'density.#{$d}.input.padding.bottom');

    &--density-#{$d} .ui-number-input__control {
      min-height: $height;
    }

    &--density-#{$d}.ui-number-input--split .ui-number-input__stepper {
      width: g($t, 'density.#{$d}.stepper.split');
      height: g($t, 'density.#{$d}.stepper.split');
    }

    &--density-#{$d} .ui-number-input__stacked {
      height: g($t, 'density.#{$d}.stepper.stacked');
    }

    &--density-#{$d}.ui-number-input--label-float > .ui-number-input__label,
    &--density-#{$d}.ui-number-input--label-inset > .ui-number-input__label {
      top: calc(#{$height} / 2);
    }

    // The asymmetric padding exists only to clear a label sitting inside the
    // box. With the label above, beside, or gone, the value returns to centre.
    &--density-#{$d}.ui-number-input--label-float.ui-number-input--filled .ui-number-input__input,
    &--density-#{$d}.ui-number-input--label-inset.ui-number-input--filled .ui-number-input__input {
      padding-top: $pad-top;
      padding-bottom: $pad-bottom;
    }

    // With a label inside the box the value sits lower than the box centre.
    // Ride the zones down by exactly half that imbalance so they line up with
    // the digits instead of with the container.
    &--density-#{$d}.ui-number-input--label-float.ui-number-input--filled .ui-number-input__stepper,
    &--density-#{$d}.ui-number-input--label-float.ui-number-input--filled .ui-number-input__stacked,
    &--density-#{$d}.ui-number-input--label-inset.ui-number-input--filled .ui-number-input__stepper,
    &--density-#{$d}.ui-number-input--label-inset.ui-number-input--filled .ui-number-input__stacked {
      margin-top: calc((#{$pad-top} - #{$pad-bottom}) / 2);
    }

    // `inset` holds the raised position always; `float` reaches it once the
    // field is focused or has a value. Same transform — only the when differs.
    &--density-#{$d}.ui-number-input--label-inset.ui-number-input--filled > .ui-number-input__label,
    &--density-#{$d}.ui-number-input--label-float.ui-number-input--filled.ui-number-input--focused > .ui-number-input__label,
    &--density-#{$d}.ui-number-input--label-float.ui-number-input--filled.ui-number-input--populated > .ui-number-input__label {
      @include number-label-raised-inside($raise);
    }

    &--density-#{$d}.ui-number-input--label-inset.ui-number-input--outlined > .ui-number-input__label,
    &--density-#{$d}.ui-number-input--label-float.ui-number-input--outlined.ui-number-input--focused > .ui-number-input__label,
    &--density-#{$d}.ui-number-input--label-float.ui-number-input--outlined.ui-number-input--populated > .ui-number-input__label {
      @include number-label-raised-notch($height);
    }
  }

  // A placeholder is hidden only while a floating label sits on top of it.
  &--label-float.ui-number-input--focused &__input::placeholder,
  &--label-float.ui-number-input--populated &__input::placeholder,
  &--label-top &__input::placeholder,
  &--label-inset &__input::placeholder,
  &--label-hidden &__input::placeholder,
  &--scrub &__input::placeholder {
    opacity: 1;
  }

  // ── hover · moves the border tone, and only that ──
  &--interactive {
    .ui-number-input__control:hover {
      border-color: g($t, 'outlined.hover.border.color');
    }

    &.ui-number-input--filled .ui-number-input__control:hover {
      border-color: transparent;
      border-bottom-color: g($t, 'filled.hover.border.color');
      background-color: g($t, 'filled.hover.surface');
    }
  }

  // ── focus · the border hue moves, and nothing else ──
  &--focused:not(.ui-number-input--readonly) {
    .ui-number-input__control {
      border-color: g($t, 'focused.border.color');
    }

    > .ui-number-input__label {
      color: g($t, 'focused.label.color');
    }

    &.ui-number-input--filled .ui-number-input__control {
      border-color: transparent;
      border-bottom-color: g($t, 'focused.border.color');
    }
  }

  // ── validity ──
  &--error {
    .ui-number-input__control {
      border-color: g($t, 'error.border.color');
    }

    > .ui-number-input__label,
    .ui-number-input__support {
      color: g($t, 'error.color');
    }

    &.ui-number-input--filled .ui-number-input__control {
      border-color: transparent;
      border-bottom-color: g($t, 'error.border.color');
    }
  }

  // ── disabled · the surface recedes and nothing responds ──
  &--disabled {
    .ui-number-input__control {
      border-color: g($t, 'disabled.border.color');
      background-color: g($t, 'disabled.surface');
    }

    > .ui-number-input__label,
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

    &.ui-number-input--filled .ui-number-input__control {
      border-color: transparent;
      border-bottom-color: g($t, 'disabled.border.color');
      background-color: g($t, 'filled.disabled.surface');
    }
  }

  // ── read-only · the container stays, the interaction does not ──
  &--readonly &__scrub {
    cursor: default;
  }

  // A drag must not leave text selected in its wake.
  &--scrubbing {
    user-select: none;
  }

  // ── support line ──
  &__support {
    padding-inline: g($t, 'support.padding.inline');
    margin: g($t, 'support.margin.top') 0 0;
    color: g($t, 'support.color');

    @include typescale(g($t, 'typography.support'));
  }

  // ── corner radius (rounded prop) · pulled from the shape scale ──
  // filled keeps a flat bottom (MD3), so its top corners carry the tier alone.
  @each $r in sharp, small, medium, large, pill {
    &--#{$r} .ui-number-input__control {
      border-radius: g($t, 'rounded.#{$r}');
    }

    &--#{$r}.ui-number-input--filled .ui-number-input__control {
      border-radius: g($t, 'rounded.#{$r}') g($t, 'rounded.#{$r}') 0 0;
    }

    // The zones ride the same axis, one tier rounder — so `rounded="pill"`
    // turns them into pills without a second visual language to maintain.
    &--#{$r} .ui-number-input__stepper,
    &--#{$r} .ui-number-input__stacked,
    &--#{$r} .ui-number-input__unit-trigger {
      border-radius: g($t, 'stepper.radius.#{$r}');
    }

    &--#{$r} .ui-number-input__stacked .ui-number-input__stepper--increment {
      border-radius: g($t, 'stepper.radius.#{$r}') g($t, 'stepper.radius.#{$r}') 0 0;
    }

    &--#{$r} .ui-number-input__stacked .ui-number-input__stepper--decrement {
      border-radius: 0 0 g($t, 'stepper.radius.#{$r}') g($t, 'stepper.radius.#{$r}');
    }
  }

  // A filled box has a flat bottom, so a full radius would dome it — cap `pill`
  // at the large tier for filled only.
  &--pill.ui-number-input--filled .ui-number-input__control {
    border-radius: g($t, 'rounded.large') g($t, 'rounded.large') 0 0;
  }

  // Motion is feedback only: colour, and the label's raise.
  @media (prefers-reduced-motion: reduce) {
    &__control,
    &__label,
    &__stepper,
    &__input::placeholder {
      transition: none;
    }
  }
}
</style>
