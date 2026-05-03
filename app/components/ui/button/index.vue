<template>
  <component
    :is="componentTag"
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
@use '~/assets/stylesheet/components/button' as v;

.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: v.$gap;
  min-height: v.$height;
  padding-inline: v.$padding-inline;
  border-radius: v.$radius;
  border-width: 0;
  border-style: solid;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
  color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
  border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
  box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
  transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  // Typography: Label Large
  @include typescale(v.$label-text-type);

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: v.$icon-size;
    line-height: 0;
  }

  &--has-prepend {
    padding-left: v.$padding-has-icon;
  }

  &--has-append {
    padding-right: v.$padding-has-icon;
  }

  &--icon-only {
    padding-inline: v.$padding-icon-only;
    width: v.$height;
    border-radius: var(--sys-shape-corner-full);
  }

  // VARIANTS

  &--elevated {
    background-color: v.$elevated-bg;
    color: v.$elevated-color;
    border-color: transparent;
    box-shadow: v.$elevated-shadow;

    &:hover {
      background-color: color-mix(in srgb, v.$elevated-color v.$hover-opacity, v.$elevated-bg);
      box-shadow: v.$elevated-hover-shadow;
    }

    &:active {
      background-color: color-mix(in srgb, v.$elevated-color v.$active-opacity, v.$elevated-bg);
      box-shadow: v.$elevated-active-shadow;
      transform: v.$elevated-active-transform;
    }
  }

  &--filled {
    background-color: v.$filled-bg;
    color: v.$filled-color;
    border-color: transparent;
    box-shadow: v.$filled-shadow;

    &:hover {
      background-color: color-mix(in srgb, v.$filled-color v.$hover-opacity, v.$filled-bg);
      box-shadow: v.$filled-hover-shadow;
    }

    &:active {
      background-color: color-mix(in srgb, v.$filled-color v.$active-opacity, v.$filled-bg);
      box-shadow: none;
      box-shadow: v.$filled-active-shadow;
      transform: v.$filled-active-transform;
    }
  }

  &--outlined {
    background-color: v.$outlined-bg;
    color: v.$outlined-color;
    border-width: v.$outlined-border-width;
    border-color: v.$outlined-border-color;
    box-shadow: none;

    &:hover {
      background-color: color-mix(in srgb, v.$outlined-color v.$hover-opacity, v.$outlined-bg);
    }

    &:active {
      background-color: color-mix(in srgb, v.$outlined-color v.$active-opacity, transparent);
    }
  }

  &--text {
    background-color: v.$text-bg;
    color: v.$text-color;
    border-color: transparent;
    box-shadow: none;

    &:hover {
      background-color: color-mix(in srgb, v.$text-color v.$hover-opacity, transparent 92%);
    }

    &:active {
      background-color: color-mix(in srgb, v.$text-color v.$active-opacity, transparent);
    }
  }

  &--tonal {
    background-color: v.$tonal-bg;
    color: v.$tonal-color;
    border-color: transparent;
    box-shadow: none;

    &:hover {
      background-color: color-mix(in srgb, v.$tonal-color v.$hover-opacity, v.$tonal-bg);
    }

    &:active {
      background-color: color-mix(in srgb, v.$tonal-color v.$active-opacity, v.$tonal-bg);
    }
  }

  // COLORS
  &--accent {
    &.ui-button--elevated {
      color: v.$accent-color;

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$accent-color v.$hover-opacity, v.$elevated-bg);
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$accent-color v.$active-opacity, v.$elevated-bg);
      }
    }

    &.ui-button--filled {
      background-color: v.$accent-color;
      color: v.$accent-contrast-color;

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$accent-contrast-color v.$hover-opacity, v.$accent-color);
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$accent-contrast-color v.$active-opacity, v.$accent-color);
      }
    }

    &.ui-button--outlined,
    &.ui-button--text {
      color: v.$accent-color;
      border-color: color-mix(in srgb, v.$accent-color 50%, transparent 50%);

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$accent-color v.$hover-opacity, transparent);
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$accent-color v.$active-opacity, transparent);
      }
    }
  }

  &--warn {
    &.ui-button--elevated {
      color: v.$warn-color;

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$warn-color v.$hover-opacity, v.$elevated-bg);
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$warn-color v.$active-opacity, v.$elevated-bg);
      }
    }

    &.ui-button--filled {
      background-color: v.$warn-color;
      color: v.$warn-contrast-color;

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$warn-contrast-color v.$hover-opacity, v.$warn-color);
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$warn-contrast-color v.$active-opacity, v.$warn-color);
      }
    }

    &.ui-button--outlined,
    &.ui-button--text {
      color: v.$warn-color;
      border-color: color-mix(in srgb, v.$warn-color 50%, transparent 50%);

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$warn-color v.$hover-opacity, transparent);
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, v.$warn-color v.$active-opacity, transparent);
      }
    }
  }

  // STATE
  &--disabled {
    cursor: default;
    pointer-events: none;
    box-shadow: none;

    // By default, text and outlined use transparent background, others use surface-variant
    background-color: color-mix(in srgb, v.$disabled-base-color v.$disabled-bg-mix, transparent);
    color: color-mix(in srgb, v.$disabled-base-color v.$disabled-color-mix, transparent);
  }

  &--outlined#{&}--disabled,
  &--text#{&}--disabled {
    background-color: transparent;
  }

  &--outlined#{&}--disabled {
    border-color: color-mix(in srgb, v.$disabled-base-color v.$disabled-bg-mix, transparent);
  }
}
</style>
