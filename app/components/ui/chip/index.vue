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
@use '~/assets/stylesheet/components/chip/index' as t;

$prefix: 'md-chip';

.ui-chip {
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: g($t, 'gap');
  min-height: g($t, 'height');
  padding-inline: g($t, 'padding-inline');
  border-radius: g($t, 'radius');
  border: g($t, 'border-width') solid transparent;
  background-color: g($t, 'bg-color-default');
  color: g($t, 'text-color-variant');
  cursor: pointer;
  outline: none;
  text-decoration: none;
  transition:
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  @include typescale(g($t, 'text-type'));

  &__icon,
  &__trailing {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: g($t, 'icon-size');
  }

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &:hover:not(.ui-chip--disabled) {
    background-color: color-mix(in srgb, var(--color-on-surface) #{g($t, 'state-layer-opacity-hover')}, #{g($t, 'bg-color-default')});
  }

  &:active:not(.ui-chip--disabled) {
    background-color: color-mix(in srgb, var(--color-on-surface) #{g($t, 'state-layer-opacity-active')}, #{g($t, 'bg-color-default')});
    transform: translateY(1rem);
  }

  &--assist,
  &--filter,
  &--input {
    background-color: transparent;
    border-color: g($t, 'border-color-default');
    color: g($t, 'text-color-default');

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) #{g($t, 'state-layer-opacity-hover')}, transparent);
    }

    &:active {
      background-color: color-mix(in srgb, var(--color-on-surface) #{g($t, 'state-layer-opacity-active')}, transparent);
    }
  }

  &--suggestion {
    background-color: g($t, 'bg-color-suggestion');
    border-color: transparent;
    box-shadow: g($t, 'suggestion-shadow');

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) #{g($t, 'state-layer-opacity-hover')}, #{g($t, 'bg-color-suggestion')});
    }
  }

  &--selected {
    background-color: g($t, 'bg-color-selected');
    color: g($t, 'text-color-selected');
    border-color: transparent;

    &:hover {
      background-color: color-mix(in srgb, #{g($t, 'text-color-selected')} #{g($t, 'state-layer-opacity-hover')}, #{g($t, 'bg-color-selected')});
    }
  }

  &--disabled {
    cursor: default;
    opacity: g($t, 'disabled-opacity');
    pointer-events: none;
  }
}
</style>
