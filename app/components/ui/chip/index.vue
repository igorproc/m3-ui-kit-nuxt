<template>
  <button
    class="ui-chip"
    :class="chipClasses"
    type="button"
    :disabled="disabled"
    @click="onClick"
  >
    <span
      v-if="$slots.icon"
      class="ui-chip__icon"
    >
      <slot name="icon" />
    </span>

    <span class="ui-chip__label">
      <slot />
    </span>

    <span
      v-if="$slots.trailing"
      class="ui-chip__trailing"
    >
      <slot name="trailing" />
    </span>
  </button>
</template>

<script setup lang="ts">
type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion'

interface Props {
  variant?: ChipVariant
  selected?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'assist',
  selected: false,
  disabled: false,
})

const selectedModel = defineModel<boolean>('selected', { default: false })

const chipClasses = computed(() => [
  `ui-chip--${props.variant}`,
  {
    'ui-chip--selected': selectedModel.value,
    'ui-chip--disabled': props.disabled,
  },
])

function onClick() {
  if (props.disabled) {
    return
  }

  if (props.variant === 'filter') {
    selectedModel.value = !selectedModel.value
  }
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/chip' as v;

.ui-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: v.$gap;
  min-height: v.$height;
  padding-inline: v.$padding-inline;
  border-radius: v.$radius;
  border: v.$border-width solid transparent;
  background-color: v.$bg-color-default;
  color: v.$text-color-variant;
  cursor: pointer;
  outline: none;
  text-decoration: none;
  transition:
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  @include typescale(v.$text-type);

  &__icon,
  &__trailing {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: v.$icon-size;
  }

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &:hover:not(.ui-chip--disabled) {
    background-color: color-mix(in srgb, var(--color-on-surface) v.$state-layer-opacity-hover, v.$bg-color-default);
  }

  &:active:not(.ui-chip--disabled) {
    background-color: color-mix(in srgb, var(--color-on-surface) v.$state-layer-opacity-active, v.$bg-color-default);
    transform: translateY(1rem);
  }

  &--assist,
  &--filter,
  &--input {
    background-color: transparent;
    border-color: v.$border-color-default;
    color: v.$text-color-default;

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) v.$state-layer-opacity-hover, transparent);
    }

    &:active {
      background-color: color-mix(in srgb, var(--color-on-surface) v.$state-layer-opacity-active, transparent);
    }
  }

  &--suggestion {
    background-color: v.$bg-color-suggestion;
    border-color: transparent;
    box-shadow: v.$suggestion-shadow;

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) v.$state-layer-opacity-hover, v.$bg-color-suggestion);
    }
  }

  &--selected {
    background-color: v.$bg-color-selected;
    color: v.$text-color-selected;
    border-color: transparent;

    &:hover {
      background-color: color-mix(in srgb, v.$text-color-selected v.$state-layer-opacity-hover, v.$bg-color-selected);
    }
  }

  &--disabled {
    cursor: default;
    opacity: v.$disabled-opacity;
    pointer-events: none;
  }
}
</style>
