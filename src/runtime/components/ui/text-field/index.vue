<template>
  <div
    class="ui-text-field"
    :class="[`ui-text-field--${variant}`, `ui-text-field--${rounded}`]"
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

  // Every shape shares one absolutely-overlaid label, moved by transform
  // only — position/font-size never animate (no reflow, no jump).
  &--filled,
  &--outlined,
  &--underline,
  &--ghost {
    > .ui-text-field__label {
      position: absolute;
      left: g($t, 'label.left');
      top: calc(#{g($t, 'container.height')} / 2);
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

  &[data-prepend] > .ui-text-field__label {
    left: g($t, 'label.prepend.left');
  }

  &__control {
    position: relative;
    display: flex;
    align-items: center;
    min-height: g($t, 'container.height');
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

    .ui-text-field__input {
      padding-top: g($t, 'filled.input.padding.top');
      padding-bottom: g($t, 'filled.input.padding.bottom');
    }

    &:hover {
      border-bottom-color: g($t, 'filled.hover.border.bottom.color');
      background-color: g($t, 'filled.hover.bg');
    }
  }

  &--outlined .ui-text-field__control {
    border-color: g($t, 'outlined.border.color');
    border-radius: g($t, 'outlined.radius');
    background-color: transparent;

    &:hover {
      border-color: g($t, 'outlined.hover.border.color');
    }
  }

  &--outlined > .ui-text-field__label {
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

  &--underline > .ui-text-field__label {
    left: 0;
  }

  &--underline[data-focused] .ui-text-field__control {
    border-bottom-color: g($t, 'outlined.focused.border.color');
    border-bottom-width: g($t, 'outlined.focused.border.width');
  }

  // ── ghost: dashed hint at rest, firms into the outlined box on interaction ──
  &--ghost .ui-text-field__control {
    border-style: dashed;
    border-color: g($t, 'outlined.border.color');
    border-radius: g($t, 'outlined.radius');
    background-color: transparent;

    &:hover {
      border-style: solid;
      border-color: g($t, 'outlined.hover.border.color');
      background-color: color-mix(in srgb, #{g($t, 'input.color')} 4%, transparent);
    }
  }

  &--ghost[data-focused] .ui-text-field__control {
    padding-inline: g($t, 'outlined.focused.padding.inline');
    border-style: solid;
    border-width: g($t, 'outlined.focused.border.width');
    border-color: g($t, 'outlined.focused.border.color');
  }

  // Shared focused label accent for the added shapes.
  &--underline[data-focused] > .ui-text-field__label,
  &--ghost[data-focused] > .ui-text-field__label {
    color: g($t, 'outlined.focused.label.color');
  }

  // ── raised label (focused OR populated) — transform only ──────
  // Translate-raise shapes: label lifts above the value — transform only.
  &--filled[data-focused] > .ui-text-field__label,
  &--filled[data-populated] > .ui-text-field__label,
  &--underline[data-focused] > .ui-text-field__label,
  &--underline[data-populated] > .ui-text-field__label {
    transform: translateY(calc(-50% - #{g($t, 'label.active.raise.filled')})) scale(g($t, 'label.active.scale'));
  }

  // Notch shapes: label rises onto the top border — transform only — with a
  // surface patch behind it so the outline reads as notched.
  &--outlined[data-focused] > .ui-text-field__label,
  &--outlined[data-populated] > .ui-text-field__label,
  &--ghost[data-focused] > .ui-text-field__label,
  &--ghost[data-populated] > .ui-text-field__label {
    background-color: g($t, 'outlined.label.bg');

    // Lift the label's center by exactly half the control height so it lands on
    // the top border (origin is centered, so no scale fudge).
    transform: translateY(calc(-50% - #{g($t, 'container.height')} / 2)) scale(g($t, 'label.active.scale'));
  }

  &[data-focused] .ui-text-field__input::placeholder,
  &[data-populated] .ui-text-field__input::placeholder {
    opacity: 1;
  }

  // ── focused chrome ────────────────────────────────────────────
  &--filled[data-focused] .ui-text-field__control {
    border-bottom-color: g($t, 'filled.focused.border.bottom.color');
    border-bottom-width: g($t, 'filled.focused.border.width');
    background-color: g($t, 'filled.focused.bg');

    .ui-text-field__label {
      color: g($t, 'filled.focused.label.color');
    }
  }

  &--outlined[data-focused] .ui-text-field__control {
    padding-inline: g($t, 'outlined.focused.padding.inline');
    border-width: g($t, 'outlined.focused.border.width');
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
