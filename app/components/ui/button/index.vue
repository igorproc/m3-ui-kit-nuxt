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
      aria-hidden="true"
    />

    <span
      v-else-if="$slots.prepend"
      class="ui-button__icon ui-button__icon--prepend"
    >
      <slot name="prepend" />
    </span>

    <span class="ui-button__label">
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
import { useButton } from '~/composables/button/useButton'
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
    'has-prepend': hasPrepend.value && !props.loading,
    'has-append': hasAppend.value,
    'icon-only': !hasDefault.value && (hasPrepend.value || hasAppend.value),
  }),
})
</script>

<style lang="scss">
@use 'sass:map';
@use '~/assets/stylesheet/components/button/_index' as t;

$prefix: 'md-button';
$t: material-map(t.$tokens, $prefix);

// COLOR MIXIN
// Применяет токены выбранной схемы ко всем вариантам
@mixin apply-scheme($scheme) {
  // Цикл по вариантам для DRY-применения токенов состояний
  $variants: ('filled', 'elevated', 'tonal', 'outlined', 'text');

  @each $v in $variants {
    &.ui-button--#{$v} {
      $base: "#{$scheme}-#{$v}";

      background-color: g($t, "#{$base}-container-color");
      color: g($t, "#{$base}-label-text-color");

      @if $v == 'outlined' {
        border: 1rem solid g($t, "#{$base}-outline-color");
      }

      @if $v == 'elevated' {
        box-shadow: g($t, "#{$base}-shadow");
      }

      &:hover:not(.ui-button--disabled) {
        background-color: g($t, "#{$base}-container-hover-color");

        @if $v == 'elevated' {
          box-shadow: g($t, "#{$base}-hover-shadow");
        }
      }

      &:active:not(.ui-button--disabled) {
        background-color: g($t, "#{$base}-container-pressed-color");
      }

      &.ui-button--disabled {
        background-color: g($t, "#{$base}-container-disabled-color");
        color: g($t, "#{$base}-label-text-disabled-color");

        @if $v == 'outlined' {
          border-color: g($t, "#{$base}-outline-disabled-color");
        }

        box-shadow: none !important;
      }
    }
  }
}

.ui-button {
  // Base Styles
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  border: none;
  background-color: transparent;
  outline: none;
  gap: g($t, 'container-gap');
  min-height: g($t, 'container-height');
  border-radius: g($t, 'container-shape');
  padding-inline: g($t, 'container-padding-inline');

  // Typography
  @include typescale('label-large');

  transition:
    background-color g($t, 'state-duration') g($t, 'state-easing'),
    color g($t, 'state-duration') g($t, 'state-easing'),
    box-shadow g($t, 'state-duration') g($t, 'state-easing'),
    border-color g($t, 'state-duration') g($t, 'state-easing'),
    transform g($t, 'state-duration') g($t, 'state-easing');

  // Keyboard focus ring (restores the visible indicator removed by
  // `outline: none`). Color comes from the theme, not a hardcoded hex.
  // Covers the whole family — icon/fab/segmented/split inherit `.ui-button`.
  &:focus-visible {
    outline: 2rem solid map.get($theme-color-link, 'secondary');
    outline-offset: 2rem;
  }

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: g($t, 'icon-size');
    line-height: 0;
    z-index: 1;
  }

  &__spinner {
    width: g($t, 'icon-size');
    height: g($t, 'icon-size');
    border: 2rem solid currentcolor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ui-button-spin 0.6s linear infinite;
    z-index: 1;
  }

  &--has-prepend {
    padding-left: g($t, 'container-padding-with-icon');
  }

  &--has-append {
    padding-right: g($t, 'container-padding-with-icon');
  }

  &--icon-only {
    padding-inline: g($t, 'container-padding-icon-only');
    width: g($t, 'container-height');
  }

  // ПРИМЕНЕНИЕ СХЕМ (MD3 color roles)
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

  // STATE
  &--disabled {
    cursor: default;
    pointer-events: none;
  }

  &--loading {
    cursor: default;
    pointer-events: none;
  }
}

@keyframes ui-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
