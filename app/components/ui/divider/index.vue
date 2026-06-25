<template>
  <div
    class="ui-divider"
    :class="dividerClasses"
    role="separator"
    :aria-orientation="orientation"
  />
</template>

<script setup lang="ts">
import { mDividerProps } from './props'

const props = defineProps(mDividerProps)

const dividerClasses = computed(() => [
  `ui-divider--${props.orientation}`,
  { 'ui-divider--inset': props.inset },
])
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/divider/index' as t;

$prefix: 'md-divider';

.ui-divider {
  $t: material-map(t.$tokens, $prefix);

  background-color: g($t, 'color');

  &--horizontal {
    width: 100%;
    height: g($t, 'thickness');
  }

  &--vertical {
    width: g($t, 'thickness');
    height: 100%;
  }

  &--inset.ui-divider--horizontal {
    margin-inline-start: g($t, 'inset-margin');
  }
}
</style>
