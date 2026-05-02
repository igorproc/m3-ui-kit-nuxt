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
.ui-chip {
  --ui-chip-height: 32rem;
  --ui-chip-padding-inline: 12rem;
  --ui-chip-radius: 8rem;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rem;
  min-height: var(--ui-chip-height);
  padding-inline: var(--ui-chip-padding-inline);
  border-radius: var(--ui-chip-radius);
  border: 1rem solid transparent;
  background-color: var(--color-surface-container-highest);
  color: var(--color-on-surface-variant);
  cursor: pointer;
  outline: none;
  text-decoration: none;
  transition:
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  // Typography: Label Large (chips use label styles)
  @include typescale('label-large');

  &__icon,
  &__trailing {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18rem;
  }

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &:hover:not(.ui-chip--disabled) {
    background-color: color-mix(in srgb, var(--color-on-surface) 8%, var(--color-surface-container-highest));
  }

  &:active:not(.ui-chip--disabled) {
    background-color: color-mix(in srgb, var(--color-on-surface) 16%, var(--color-surface-container-highest));
    transform: translateY(1rem);
  }

  &--assist,
  &--filter,
  &--input {
    background-color: transparent;
    border-color: var(--color-outline);
    color: var(--color-on-surface);

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, transparent);
    }

    &:active {
      background-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
    }
  }

  &--suggestion {
    background-color: var(--color-surface-container-low, var(--color-surface));
    border-color: transparent;
    box-shadow: 0 1rem 2rem rgb(0 0 0 / 10%);

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, var(--color-surface-container-low, var(--color-surface)));
    }
  }

  &--selected {
    background-color: var(--color-secondary-container, var(--color-primary-container));
    color: var(--color-on-secondary-container, var(--color-on-primary-container));
    border-color: transparent;

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-secondary-container, var(--color-on-primary-container)) 8%, var(--color-secondary-container, var(--color-primary-container)));
    }
  }

  &--disabled {
    cursor: default;
    opacity: 0.38;
    pointer-events: none;
  }
}
</style>
