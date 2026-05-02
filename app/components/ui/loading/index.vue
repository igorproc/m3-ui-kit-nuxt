<template>
  <span
    class="ui-loading"
    :class="[
      `ui-loading--${variant}`,
      `ui-loading--${size}`,
      { 'ui-loading--inline': inline },
    ]"
    role="status"
    :aria-label="ariaLabel"
  >
    <span class="ui-loading__spinner" />
  </span>
</template>

<script setup lang="ts">
type LoadingVariant = 'circular'
type LoadingSize = 'small' | 'medium' | 'large'

interface Props {
  variant?: LoadingVariant
  size?: LoadingSize
  inline?: boolean
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'circular',
  size: 'medium',
  inline: false,
  ariaLabel: 'Loading',
})
</script>

<style lang="scss">
.ui-loading {
  --ui-loading-size-small: 16rem;
  --ui-loading-size-medium: 24rem;
  --ui-loading-size-large: 32rem;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  &--small {
    width: var(--ui-loading-size-small);
    height: var(--ui-loading-size-small);
  }

  &--medium {
    width: var(--ui-loading-size-medium);
    height: var(--ui-loading-size-medium);
  }

  &--large {
    width: var(--ui-loading-size-large);
    height: var(--ui-loading-size-large);
  }

  &--inline {
    vertical-align: middle;
  }

  &__spinner {
    width: 100%;
    height: 100%;
    border-radius: var(--sys-shape-corner-full);
    border-width: 2rem;
    border-style: solid;
    border-color: color-mix(in srgb, var(--color-primary) 16%, transparent);
    border-top-color: var(--color-primary);
    animation:
      ui-loading-spin var(--sys-motion-duration-medium-2)
      var(--sys-motion-easing-standard) infinite;
  }
}

@keyframes ui-loading-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
