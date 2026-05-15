<template>
  <UiButton
    class="ui-icon-button"
    :variant="variant"
    :color="color"
    :disabled="disabled"
    :type="type"
    :to="to"
    :tag="tag"
  >
    <span class="ui-icon-button__content">
      <slot />
    </span>
  </UiButton>
</template>

<script setup lang="ts">
import UiButton from '~/components/ui/button/index.vue'

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

withDefaults(defineProps<Props>(), {
  tag: 'button',
  variant: 'text',
  color: 'primary',
  disabled: false,
  type: 'button',
})
</script>

<style lang="scss">
.ui-icon-button {
  width: 40rem;
  height: 40rem;
  padding-inline: 0 !important;
  border-radius: var(--sys-shape-corner-full, 50%) !important;
  flex-shrink: 0;

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rem; // Standard M3 icon size
  }

  // Hide the default button label wrapper padding if any
  .ui-button__label {
    padding: 0;
  }
}
</style>
