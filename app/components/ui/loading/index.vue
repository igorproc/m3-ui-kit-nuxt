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
@use '~/assets/stylesheet/components/loading' as v;

.ui-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &--small {
    width: v.$size-small;
    height: v.$size-small;
  }

  &--medium {
    width: v.$size-medium;
    height: v.$size-medium;
  }

  &--large {
    width: v.$size-large;
    height: v.$size-large;
  }

  &--inline {
    vertical-align: middle;
  }

  &__spinner {
    width: 100%;
    height: 100%;
    border-radius: var(--sys-shape-corner-full);
    border-width: v.$border-width;
    border-style: solid;
    border-color: v.$track-color;
    border-top-color: v.$spinner-color;
    animation:
      ui-loading-spin v.$animation-duration
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
