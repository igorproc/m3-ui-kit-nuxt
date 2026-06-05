<template>
  <component
    :is="componentTag"
    v-ripple="!disabled"
    class="ui-button"
    :class="buttonClasses"
    v-bind="linkBindings"
    :type="type"
    :disabled="disabled"
    :aria-disabled="isLink && disabled ? 'true' : undefined"
    :tabindex="isLink && disabled ? -1 : undefined"
  >
    <span
      v-if="$slots.prepend"
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
import { computed, defineAsyncComponent } from 'vue'
import type { NuxtLinkProps } from '#app'

type ButtonTag = 'button' | 'link'
type ButtonVariant = 'elevated' | 'filled' | 'outlined' | 'text' | 'tonal'
type ButtonColor = 'primary' | 'accent' | 'warn'

interface Props {
  tag?: ButtonTag
  variant?: ButtonVariant
  color?: ButtonColor
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  to?: NuxtLinkProps['to']
}

const props = withDefaults(
  defineProps<Props>(),
  {
    tag: 'button',
    variant: 'filled',
    color: 'primary',
    disabled: false,
    type: 'button',
  },
)

const NuxtLink = defineAsyncComponent(async () => await import('#app/components/nuxt-link'))

const isLink = computed(() => props.tag === 'link')

const componentTag = computed(() => {
  const map: Record<ButtonTag, string | ReturnType<typeof defineAsyncComponent>> = {
    button: 'button',
    link: NuxtLink,
  }

  return map[props.tag] || map.button
})

const slots = useSlots()
const hasPrepend = computed(() => !!slots.prepend)
const hasAppend = computed(() => !!slots.append)
const hasDefault = computed(() => !!slots.default)

const buttonClasses = computed(() => [
  `ui-button--${props.variant}`,
  `ui-button--${props.color}`,
  {
    'ui-button--disabled': props.disabled,
    'ui-button--has-prepend': hasPrepend.value,
    'ui-button--has-append': hasAppend.value,
    'ui-button--icon-only': !hasDefault.value && (hasPrepend.value || hasAppend.value),
  },
])

const linkBindings = computed(() => {
  if (isLink.value && props.to) {
    return { to: props.to }
  }

  return {}
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/button/_index' as t;

.ui-button {
  $prefix: 'md-button';
  $t: material-map(t.$tokens, $prefix);

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

  // ПРИМЕНЕНИЕ СХЕМ
  @include apply-scheme('primary');

  &--accent {
    @include apply-scheme('accent');
  }

  &--warn {
    @include apply-scheme('warn');
  }

  // STATE
  &--disabled {
    cursor: default;
    pointer-events: none;
  }
}
</style>
