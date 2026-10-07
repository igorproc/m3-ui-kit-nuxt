<template>
  <UiButton
    class="ui-icon-button"
    :class="[`ui-icon-button--${width}`, { 'ui-button--current': !color }]"
    :variant="variant"
    :color="color"
    :density="density"
    :shape="shape"
    :selected="selected"
    :disabled="disabled"
    :loading="loading"
    :type="type"
    :to="to"
    :tag="tag"
    :aria-label="ariaLabel"
    @update:selected="emit('update:selected', $event)"
  >
    <span class="ui-icon-button__content">
      <slot :selected="selected" />
    </span>
  </UiButton>
</template>

<script setup lang="ts">
import UiButton from '#kit/components/ui/button/index.vue'
import { useButtonNameWarning } from '#kit/composables/button/useButtonNameWarning'
import { useRetiredValueWarning } from '#kit/composables/button/useRetiredValueWarning'
import { mIconButtonProps } from '../props'

const props = defineProps(mIconButtonProps)
const emit = defineEmits<{
  (e: 'update:selected', selected: boolean): void
}>()

useButtonNameWarning('m-button-icon', () => props.ariaLabel)
useRetiredValueWarning('m-button-icon', 'variant', () => props.variant, { elevated: '`filled` or `tonal`' })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/_index' as t;

$t: material-map(t.$tokens, 'md-button');
$densities: ('compact', 'default', 'comfortable');
$widths: ('narrow', 'default', 'wide');

// Doubled class: an icon button is a fixed box, so it outranks the pill padding
// of `.ui-button` without `!important`. Height, square corner and selected
// round corner come from MButton's density step.
.ui-button.ui-icon-button {
  padding-inline: 0;
  flex-shrink: 0;

  @each $step in $densities {
    &.ui-button--#{$step} {
      $d: 'icon-button.density.#{$step}';

      height: g($t, 'density.#{$step}.height');

      @each $w in $widths {
        &.ui-icon-button--#{$w} {
          width: g($t, '#{$d}.width.#{$w}');
        }
      }

      .ui-icon-button__content,
      .ui-button__spinner {
        font-size: g($t, '#{$d}.icon');
      }
    }
  }

  &.ui-button--square.ui-button--selected {
    border-radius: g($t, 'icon-button.selected.square');
  }
}

.ui-icon-button__content {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
