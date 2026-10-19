<template>
  <component
    :is="tag"
    v-ripple="rippleEnabled"
    :class="rootClass"
    v-bind="rootAttrs"
    :aria-label="ariaLabel"
  >
    <span
      v-if="loading"
      class="ui-fab__spinner"
      aria-hidden="true"
    >
      <MLoading inline />
    </span>
    <span
      v-else
      class="ui-fab__icon"
    >
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import MLoading from '#kit/components/ui/loading/index.vue'
import { useButton } from '#kit/utils/button/useButton'
import { useButtonNameWarning } from '#kit/utils/button/useButtonNameWarning'
import { mFabProps } from './props'

const props = defineProps(mFabProps)

const { tag, rootClass, rootAttrs, rippleEnabled } = useButton({ block: 'ui-fab', props })

useButtonNameWarning('m-button-fab', () => props.ariaLabel)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/fab' as t;
@use '#kit/assets/stylesheet/components/button/fab/surface' as surface;

.ui-fab {
  $t: material-map(t.$tokens, 'm3-fab');
  $move: g($t, 'motion.duration') g($t, 'motion.easing');

  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  overflow: hidden;
  outline: none;
  transition: box-shadow $move, background-color $move, color $move;

  @include surface.fab-surface($t, 'ui-fab');

  &__icon,
  &__spinner {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }

  @each $step in ('compact', 'default', 'comfortable') {
    &--#{$step} {
      $d: 'density.#{$step}';

      width: g($t, '#{$d}.container.size');
      height: g($t, '#{$d}.container.size');
      border-radius: g($t, '#{$d}.container.shape');

      .ui-fab__icon,
      .ui-fab__spinner {
        font-size: g($t, '#{$d}.icon.size');
      }
    }
  }
}
</style>
