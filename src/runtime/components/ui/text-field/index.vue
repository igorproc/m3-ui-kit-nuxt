<template>
  <div
    class="ui-text-field"
    :class="[
      `ui-text-field--${variant}`,
      `ui-text-field--${rounded}`,
      `ui-text-field--label-${labelPlacement}`,
      `ui-text-field--density-${density}`,
    ]"
    :data-focused="isFocused || undefined"
    :data-populated="isPopulated || undefined"
    :data-error="isError || undefined"
    :data-disabled="disabled || undefined"
    :data-prepend="hasPrepend || undefined"
    :data-append="hasAppend || undefined"
  >
    <label
      v-if="label"
      :for="fieldId"
      class="ui-text-field__label"
    >
      {{ label }}
    </label>

    <div class="ui-text-field__control">
      <span
        v-if="hasPrepend"
        class="ui-text-field__icon ui-text-field__icon--prepend"
      >
        <slot name="prepend" />
      </span>

      <div
        v-if="$slots['leading-content']"
        class="ui-text-field__field"
      >
        <slot name="leading-content" />

        <input
          :id="fieldId"
          v-model="modelValue"
          class="ui-text-field__input"
          v-bind="inputAttrs"
          :type="type"
          :name="name ?? path"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :autofocus="autofocus"
          :autocomplete="autocomplete"
          :aria-invalid="!meta.valid || isError"
          :aria-required="required || undefined"
          :aria-describedby="describedBy"
          @focus="onFocus"
          @blur="onBlur"
        >
      </div>

      <input
        v-else
        :id="fieldId"
        v-model="modelValue"
        class="ui-text-field__input"
        v-bind="inputAttrs"
        :type="type"
        :name="name ?? path"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autofocus="autofocus"
        :autocomplete="autocomplete"
        :aria-invalid="!meta.valid || isError"
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

const props = defineProps(mTextFieldProps)
const slots = useSlots()

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

const displayMessage = computed(() => errorMessage.value || (props.error ? props.helperText : undefined) || props.helperText)
const messageId = computed(() => isError.value ? `${fieldId}-error` : `${fieldId}-helper`)
const describedBy = computed(() => displayMessage.value ? messageId.value : undefined)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/text-field' as t;

$t-field: material-map(t.$tokens, 'm-text-field');

// The two raised positions, named once so the placement branches below stay a
// list of selectors instead of a list of copied transforms.
@mixin field-label-raised-inside($raise) {
  transform: translateY(calc(-50% - #{$raise})) scale(g($t-field, 'label.active.scale'));
}

@mixin field-label-raised-notch($height) {
  background-color: g($t-field, 'outlined.label.bg');

  // Lift the label's center by exactly half the control height so it lands on
  // the top border (origin is centered, so no scale fudge).
  transform: translateY(calc(-50% - #{$height} / 2)) scale(g($t-field, 'label.active.scale'));
}

.ui-text-field {
  $t: material-map(t.$tokens, 'm-text-field');

  position: relative;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

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
    > .ui-text-field__label {
      position: absolute;
      left: g($t, 'label.left');
      z-index: 1;
      max-width: calc(100% - 32rem);
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
  &--label-hidden > .ui-text-field__label {
    position: absolute;
    width: 1rem;
    height: 1rem;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  &--label-float[data-prepend] > .ui-text-field__label,
  &--label-inset[data-prepend] > .ui-text-field__label {
    left: g($t, 'label.prepend.left');
  }

  &__control {
    position: relative;
    display: flex;
    align-items: center;
    padding-inline: g($t, 'container.padding.inline');
    border: g($t, 'container.border.width') solid transparent;
    transition:
      border-color g($t, 'state.duration') g($t, 'state.easing'),
      background-color g($t, 'state.duration') g($t, 'state.easing'),
      box-shadow g($t, 'state.duration') g($t, 'state.easing');
  }

  &[data-prepend] .ui-text-field__control {
    padding-left: g($t, 'container.padding.prepend');
  }

  &[data-append] .ui-text-field__control {
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
      opacity: 0;
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

    > :not(.ui-text-field__input) {
      flex: 0 0 auto;
    }

    .ui-text-field__input {
      flex: 1 0 g($t, 'container.field.input-min-width');
      width: auto;
    }
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

  // ── shape chrome ──────────────────────────────────────────────
  &--filled .ui-text-field__control {
    border-color: transparent;
    border-bottom: g($t, 'container.border.width') solid g($t, 'filled.border.bottom.color');
    border-radius: g($t, 'filled.radius');
    background-color: g($t, 'filled.bg');

    &:hover {
      border-bottom-color: g($t, 'filled.hover.border.bottom.color');
      background-color: g($t, 'filled.hover.bg');
    }
  }

  &--outlined .ui-text-field__control {
    border-color: g($t, 'outlined.border.color');
    border-radius: g($t, 'outlined.border.radius');
    background-color: transparent;

    &:hover {
      border-color: g($t, 'outlined.hover.border.color');
    }
  }

  &--label-float.ui-text-field--outlined > .ui-text-field__label,
  &--label-inset.ui-text-field--outlined > .ui-text-field__label {
    padding-inline: g($t, 'outlined.label.padding.inline');
    margin-left: g($t, 'outlined.label.margin.left');
  }

  // ── underline: a single bottom rule, lowest ink ───────────────
  &--underline .ui-text-field__control {
    padding-inline: 0;
    border: none;
    border-bottom: g($t, 'container.border.width') solid g($t, 'outlined.border.color');
    border-radius: 0;
    background-color: transparent;

    &:hover {
      border-bottom-color: g($t, 'outlined.hover.border.color');
    }
  }

  &--label-float.ui-text-field--underline > .ui-text-field__label,
  &--label-inset.ui-text-field--underline > .ui-text-field__label {
    left: 0;
  }

  &--underline[data-focused] .ui-text-field__control {
    border-bottom-color: g($t, 'outlined.focused.border.color');
  }

  // Shared focused label accent for the added shapes.
  &--underline[data-focused] > .ui-text-field__label {
    color: g($t, 'outlined.focused.label.color');
  }

  // ── density · height, padding and the raise that follows from them ────
  // Every height-dependent rule is emitted here, once per step, so a density
  // can never be half-applied by a branch someone forgot to add.
  @each $d in compact, default, comfortable {
    $height: g($t, 'density.#{$d}.height');
    $raise: g($t, 'density.#{$d}.label.raise');

    &--density-#{$d} .ui-text-field__control {
      min-height: $height;
    }

    &--density-#{$d}.ui-text-field--label-float > .ui-text-field__label,
    &--density-#{$d}.ui-text-field--label-inset > .ui-text-field__label {
      top: calc(#{$height} / 2);
    }

    // The asymmetric padding exists only to clear a label sitting inside the
    // box. With the label above, beside, or gone, the value returns to centre.
    &--density-#{$d}.ui-text-field--label-float.ui-text-field--filled .ui-text-field__input,
    &--density-#{$d}.ui-text-field--label-inset.ui-text-field--filled .ui-text-field__input {
      padding-top: g($t, 'density.#{$d}.input.padding.top');
      padding-bottom: g($t, 'density.#{$d}.input.padding.bottom');
    }

    // `inset` holds the raised position always; `float` reaches it once the
    // field is focused or has a value. Same transform — only the when differs.
    &--density-#{$d}.ui-text-field--label-inset.ui-text-field--filled > .ui-text-field__label,
    &--density-#{$d}.ui-text-field--label-inset.ui-text-field--underline > .ui-text-field__label,
    &--density-#{$d}.ui-text-field--label-float.ui-text-field--filled[data-focused] > .ui-text-field__label,
    &--density-#{$d}.ui-text-field--label-float.ui-text-field--filled[data-populated] > .ui-text-field__label,
    &--density-#{$d}.ui-text-field--label-float.ui-text-field--underline[data-focused] > .ui-text-field__label,
    &--density-#{$d}.ui-text-field--label-float.ui-text-field--underline[data-populated] > .ui-text-field__label {
      @include field-label-raised-inside($raise);
    }

    // Notch shapes: the label rises onto the top border, with a surface patch
    // behind it so the outline reads as notched rather than crossed out.
    &--density-#{$d}.ui-text-field--label-inset.ui-text-field--outlined > .ui-text-field__label,
    &--density-#{$d}.ui-text-field--label-float.ui-text-field--outlined[data-focused] > .ui-text-field__label,
    &--density-#{$d}.ui-text-field--label-float.ui-text-field--outlined[data-populated] > .ui-text-field__label {
      @include field-label-raised-notch($height);
    }
  }

  // A placeholder is hidden only while a floating label is sitting on top of
  // it. Every other placement leaves the first line free.
  &--label-float[data-focused] .ui-text-field__input::placeholder,
  &--label-float[data-populated] .ui-text-field__input::placeholder,
  &--label-top .ui-text-field__input::placeholder,
  &--label-inset .ui-text-field__input::placeholder,
  &--label-hidden .ui-text-field__input::placeholder {
    opacity: 1;
  }

  // ── focused chrome ────────────────────────────────────────────
  // Focus moves the border hue and nothing else, the same as `<MTextarea>` and
  // `<MNumberInput>`. A width bump has to be paid back in padding, neither of
  // the two is in the `transition` list, so both snapped while the colour eased
  // — and three fields in one form were speaking two focus languages.
  &--filled[data-focused] .ui-text-field__control {
    border-bottom-color: g($t, 'filled.focused.border.bottom.color');
    background-color: g($t, 'filled.focused.bg');

    .ui-text-field__label {
      color: g($t, 'filled.focused.label.color');
    }
  }

  &--outlined[data-focused] .ui-text-field__control {
    border-color: g($t, 'outlined.focused.border.color');
  }

  &--outlined[data-focused] > .ui-text-field__label {
    color: g($t, 'outlined.focused.label.color');
  }

  // ── error ─────────────────────────────────────────────────────
  &[data-error] .ui-text-field__control {
    border-color: g($t, 'filled.error.border.bottom.color');
  }

  &[data-error] > .ui-text-field__label {
    color: g($t, 'filled.error.label.color');
  }

  &--outlined[data-error] .ui-text-field__control {
    border-color: g($t, 'outlined.error.border.color');
  }

  &--filled[data-error][data-focused] .ui-text-field__control {
    border-bottom-color: g($t, 'filled.error.focused.border.bottom.color');
  }

  &--outlined[data-error][data-focused] .ui-text-field__control {
    border-color: g($t, 'outlined.error.focused.border.color');
  }

  // ── disabled ──────────────────────────────────────────────────
  &[data-disabled] .ui-text-field__control {
    border-color: g($t, 'filled.disabled.border.bottom.color');
    background-color: transparent;
    cursor: default;

    .ui-text-field__input {
      color: g($t, 'filled.disabled.input.color');
    }

    .ui-text-field__icon {
      color: g($t, 'filled.disabled.icon.color');
    }
  }

  &[data-disabled] > .ui-text-field__label {
    color: g($t, 'filled.disabled.label.color');
  }

  &--filled[data-disabled] .ui-text-field__control {
    border-bottom-color: g($t, 'filled.disabled.border.bottom.color');
    background-color: g($t, 'filled.disabled.bg');
  }

  &--outlined[data-disabled] .ui-text-field__control {
    border-color: g($t, 'outlined.disabled.border.color');

    .ui-text-field__input {
      color: g($t, 'outlined.disabled.input.color');
    }
  }

  &--outlined[data-disabled] > .ui-text-field__label {
    color: g($t, 'outlined.disabled.label.color');
  }

  // ── corner radius (rounded prop) · pulled from the shape scale ──
  // filled keeps a flat bottom (MD3); underline has no box.
  @each $r in sharp, small, medium, large, pill {
    &--#{$r} .ui-text-field__control {
      border-radius: g($t, 'rounded.#{$r}');
    }

    &--#{$r}.ui-text-field--filled .ui-text-field__control {
      border-radius: g($t, 'rounded.#{$r}') g($t, 'rounded.#{$r}') 0 0;
    }

    &--#{$r}.ui-text-field--underline .ui-text-field__control {
      border-radius: 0;
    }
  }

  // A filled box has a flat bottom, so a full-radius top would dome it on a short
  // field — cap `pill` at the large tier for filled only.
  &--pill.ui-text-field--filled .ui-text-field__control {
    border-radius: g($t, 'rounded.large') g($t, 'rounded.large') 0 0;
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
}
</style>
