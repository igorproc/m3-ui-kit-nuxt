<template>
  <component
    :is="tag"
    class="ui-surface"
    :class="[`ui-surface--${variant}`, `ui-surface--shape-${shape}`]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { mSurfaceProps } from './props'

defineProps(mSurfaceProps)
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/surface/index' as t;

$prefix: 'md-surface';

.ui-surface {
  $t: material-map(t.$tokens, $prefix);

  display: block;
  color: map.get($theme-color-link, 'on-surface');
  border-style: solid;
  border-width: 0;
  border-color: transparent;
  border-radius: map.get($theme-shape-link, 'none');
  background-color: g($t, 'plain-container-color');

  &--plain {
    background-color: g($t, 'plain-container-color');
  }

  &--filled {
    background-color: g($t, 'filled-container-color');
  }

  &--elevated {
    background-color: g($t, 'elevated-container-color');
    box-shadow: g($t, 'elevated-elevation');
  }

  &--outlined {
    border-width: g($t, 'outlined-outline-width');
    border-color: g($t, 'outlined-outline-color');
    background-color: g($t, 'outlined-container-color');
  }

  // Corner shape presets from the canonical M3 scale.
  @each $name, $radius in $theme-shape-link {
    &--shape-#{$name} {
      border-radius: #{$radius};
    }
  }
}
</style>
