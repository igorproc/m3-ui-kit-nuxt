<template>
  <component
    :is="tag"
    v-ripple="rippleEnabled"
    :class="rootClass"
    v-bind="rootAttrs"
  >
    <span
      v-if="loading"
      class="ui-button__spinner"
      :class="{ 'ui-button__spinner--centered': !$slots.prepend }"
      aria-hidden="true"
    />

    <span
      v-else-if="$slots.prepend"
      class="ui-button__icon ui-button__icon--prepend"
    >
      <slot name="prepend" />
    </span>

    <span
      v-if="$slots.default"
      class="ui-button__label"
    >
      <slot />
    </span>

    <span
      v-if="$slots.append"
      class="ui-button__icon ui-button__icon--append"
    >
      <slot name="append" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useButton } from '#kit/composables/button/useButton'
import { mButtonProps } from './props'

const props = defineProps(mButtonProps)
const slots = useSlots()

const hasPrepend = computed(() => !!slots.prepend)
const hasAppend = computed(() => !!slots.append)
const hasDefault = computed(() => !!slots.default)

const { tag, rootClass, rootAttrs, rippleEnabled } = useButton({
  block: 'ui-button',
  props,
  modifiers: () => ({
    // Kept while loading: the spinner takes the icon's place, so the padding
    // stays and the button keeps its width.
    'has-prepend': hasPrepend.value,
    'has-append': hasAppend.value,
    'icon-only': !hasDefault.value && (hasPrepend.value || hasAppend.value),
  }),
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/_index' as t;
@use '#kit/assets/stylesheet/components/button/spinner' as spinner;

$prefix: 'md-button';
$t: material-map(t.$tokens, $prefix);

// Applies the tokens of one colour role to every variant.
@mixin apply-scheme($scheme) {
  $variants: ('filled', 'elevated', 'tonal', 'outlined', 'text');

  @each $v in $variants {
    &.ui-button--#{$v} {
      $base: '#{$scheme}.#{$v}';

      background-color: g($t, '#{$base}.container.color');
      color: g($t, '#{$base}.label.text.color');

      @if $v == 'outlined' {
        border: 1rem solid g($t, '#{$base}.outline.color');
      }

      @if $v == 'elevated' {
        box-shadow: g($t, '#{$base}.shadow');
      }

      @include can-hover {
        &:hover:not(.ui-button--disabled) {
          background-color: g($t, '#{$base}.container.hover.color');

          @if $v == 'elevated' {
            box-shadow: g($t, '#{$base}.hover.shadow');
          }
        }
      }

      &:active:not(.ui-button--disabled) {
        background-color: g($t, '#{$base}.container.pressed.color');
      }

      &.ui-button--disabled {
        background-color: g($t, '#{$base}.container.disabled.color');
        color: g($t, '#{$base}.label.text.disabled.color');
        box-shadow: none;

        @if $v == 'outlined' {
          border-color: g($t, '#{$base}.outline.disabled.color');
        }

        @include forced-colors {
          border-color: GrayText;
          color: GrayText;
        }
      }
    }
  }
}

.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  max-width: 100%;
  cursor: pointer;
  text-decoration: none;
  border: none;
  background-color: transparent;
  outline: none;
  gap: g($t, 'container.gap');
  min-height: g($t, 'container.height');
  border-radius: g($t, 'container.shape');
  padding-inline: g($t, 'container.padding.inline');

  @include typescale('label-large');

  transition:
    background-color g($t, 'state.duration') g($t, 'state.easing'),
    color g($t, 'state.duration') g($t, 'state.easing'),
    box-shadow g($t, 'state.duration') g($t, 'state.easing'),
    border-color g($t, 'state.duration') g($t, 'state.easing'),
    transform g($t, 'state.duration') g($t, 'state.easing');

  // Covers the whole family — icon/split inherit `.ui-button`.
  &:focus-visible {
    @include focus-ring;
  }

  // Filled, tonal, elevated and text buttons draw their edge with a background
  // or a shadow, which forced colors drops; outlined keeps its own border.
  @include forced-colors {
    border: 1px solid ButtonText;
  }

  // The button grows with its label rather than clipping it; an unbroken
  // string (a URL, an article number) wraps instead of pushing the button
  // past its container.
  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow-wrap: anywhere;
    text-align: center;
    z-index: 1;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: g($t, 'icon.size');
    line-height: 0;
    z-index: 1;
  }

  &__spinner {
    @include spinner.spinner(g($t, 'icon.size'));

    flex-shrink: 0;
    z-index: 1;

    // With no icon to stand in for, the spinner sits over the content, which
    // keeps its box (and its accessible name) so the width does not jump.
    &--centered {
      position: absolute;
      inset: 0;
      margin: auto;

      ~ .ui-button__label,
      ~ .ui-button__icon {
        opacity: 0;
      }
    }
  }

  &--has-prepend {
    padding-inline-start: g($t, 'container.padding.with-icon');
  }

  &--has-append {
    padding-inline-end: g($t, 'container.padding.with-icon');
  }

  &--icon-only {
    padding-inline: g($t, 'container.padding.icon-only');
    width: g($t, 'container.height');
  }

  @include apply-scheme('primary');

  &--secondary {
    @include apply-scheme('secondary');
  }

  &--tertiary {
    @include apply-scheme('tertiary');
  }

  &--error {
    @include apply-scheme('error');
  }

  &--disabled {
    cursor: default;
    pointer-events: none;
  }

  &--loading {
    cursor: default;
    pointer-events: none;
  }
}
</style>
