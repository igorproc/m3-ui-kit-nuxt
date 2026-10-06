<template>
  <UiButton
    class="ui-icon-button"
    :variant="variant"
    :color="color"
    :disabled="disabled"
    :loading="loading"
    :type="type"
    :to="to"
    :tag="tag"
    :aria-label="ariaLabel"
  >
    <span class="ui-icon-button__content">
      <slot />
    </span>
  </UiButton>
</template>

<script setup lang="ts">
import UiButton from '#kit/components/ui/button/index.vue'
import { useButtonNameWarning } from '#kit/composables/button/useButtonNameWarning'
import { mIconButtonProps } from '../props'

const props = defineProps(mIconButtonProps)

useButtonNameWarning('m-button-icon', () => props.ariaLabel)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/_index' as t;

$t: material-map(t.$tokens, 'md-button');

// Doubled class: an icon button is a square, so it outranks the pill padding
// and radius of `.ui-button` without `!important`.
.ui-button.ui-icon-button {
  width: g($t, 'icon-button.container.size');
  min-height: g($t, 'icon-button.container.size');
  height: g($t, 'icon-button.container.size');
  padding-inline: 0;
  border-radius: g($t, 'icon-button.container.shape');
  flex-shrink: 0;
}

.ui-icon-button__content {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: g($t, 'icon-button.icon.size');
}
</style>
