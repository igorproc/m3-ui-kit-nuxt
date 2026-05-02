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
.ui-button {
  --ui-button-height: 40rem;
  --ui-button-padding-inline: 24rem;
  --ui-button-radius: 20rem;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rem;
  min-height: var(--ui-button-height);
  padding-inline: var(--ui-button-padding-inline);
  border-radius: var(--ui-button-radius);
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
  @include typescale('label-large');

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18rem; // Icon size typically 18dp inside buttons
    line-height: 0;
  }

  &--has-prepend {
    padding-left: 16rem;
  }

  &--has-append {
    padding-right: 16rem;
  }

  &--icon-only {
    padding-inline: 8rem;
    width: var(--ui-button-height);
    border-radius: var(--sys-shape-corner-full);
  }

  // VARIANTS

  &--elevated {
    background-color: var(--color-surface-container-low, var(--color-surface));
    color: var(--color-primary);
    border-color: transparent;
    box-shadow: 0 1rem 3rem 1rem rgb(0 0 0 / 15%), 0 1rem 2rem rgb(0 0 0 / 30%); // Elevation 1

    &:hover {
      background-color: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-container-low, var(--color-surface)));
      box-shadow: 0 2rem 6rem 2rem rgb(0 0 0 / 15%), 0 1rem 2rem rgb(0 0 0 / 30%); // Elevation 2
    }

    &:active {
      background-color: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-container-low, var(--color-surface)));
      box-shadow: 0 1rem 3rem 1rem rgb(0 0 0 / 15%), 0 1rem 2rem rgb(0 0 0 / 30%); // Elevation 1
      transform: translateY(1rem);
    }
  }

  &--filled {
    background-color: var(--color-primary);
    color: var(--color-primary-contrast);
    border-color: transparent;
    box-shadow: none;

    &:hover {
      background-color: color-mix(in srgb, var(--color-primary-contrast) 8%, var(--color-primary));
      box-shadow: 0 1rem 3rem 1rem rgb(0 0 0 / 15%), 0 1rem 2rem rgb(0 0 0 / 30%); // Elevation 1
    }

    &:active {
      background-color: color-mix(in srgb, var(--color-primary-contrast) 12%, var(--color-primary));
      box-shadow: none;
      box-shadow: 0 1rem 3rem rgb(0 0 0 / 24%);
      transform: translateY(1rem);
    }
  }

  &--outlined {
    background-color: transparent;
    color: var(--color-primary);
    border-width: 1rem;
    border-color: color-mix(in srgb, var(--color-primary) 50%, transparent 50%);
    box-shadow: none;

    &:hover {
      background-color: color-mix(in srgb, var(--color-primary) 8%, transparent 92%);
    }

    &:active {
      background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
    }
  }

  &--text {
    background-color: transparent;
    color: var(--color-primary);
    border-color: transparent;
    box-shadow: none;

    &:hover {
      background-color: color-mix(in srgb, var(--color-primary) 8%, transparent 92%);
    }

    &:active {
      background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
    }
  }

  &--tonal {
    background-color: var(--color-primary-container);
    color: var(--color-primary-container-contrast);
    border-color: transparent;
    box-shadow: none;

    &:hover {
      background-color: color-mix(in srgb, var(--color-primary-container-contrast) 8%, var(--color-primary-container));
    }

    &:active {
      background-color: color-mix(in srgb, var(--color-primary-container-contrast) 12%, var(--color-primary-container));
    }
  }

  // COLORS
  &--accent {
    &.ui-button--elevated {
      color: var(--color-accent);

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface-container-low, var(--color-surface)));
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-container-low, var(--color-surface)));
      }
    }

    &.ui-button--filled {
      background-color: var(--color-accent);
      color: var(--color-accent-contrast);

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-accent-contrast) 8%, var(--color-accent));
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-accent-contrast) 12%, var(--color-accent));
      }
    }

    &.ui-button--outlined,
    &.ui-button--text {
      color: var(--color-accent);
      border-color: color-mix(in srgb, var(--color-accent) 50%, transparent 50%);

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-accent) 8%, transparent);
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
      }
    }
  }

  &--warn {
    &.ui-button--elevated {
      color: var(--color-warn);

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-warn) 8%, var(--color-surface-container-low, var(--color-surface)));
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-warn) 12%, var(--color-surface-container-low, var(--color-surface)));
      }
    }

    &.ui-button--filled {
      background-color: var(--color-warn);
      color: var(--color-warn-contrast);

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-warn-contrast) 8%, var(--color-warn));
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-warn-contrast) 12%, var(--color-warn));
      }
    }

    &.ui-button--outlined,
    &.ui-button--text {
      color: var(--color-warn);
      border-color: color-mix(in srgb, var(--color-warn) 50%, transparent 50%);

      &:hover:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-warn) 8%, transparent);
      }

      &:active:not(.ui-button--disabled) {
        background-color: color-mix(in srgb, var(--color-warn) 12%, transparent);
      }
    }
  }

  // STATE
  &--disabled {
    cursor: default;
    pointer-events: none;
    box-shadow: none;

    // By default, text and outlined use transparent background, others use surface-variant
    background-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
    color: color-mix(in srgb, var(--color-on-surface) 38%, transparent);
  }

  &--outlined#{&}--disabled,
  &--text#{&}--disabled {
    background-color: transparent;
  }

  &--outlined#{&}--disabled {
    border-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
  }
}
</style>
