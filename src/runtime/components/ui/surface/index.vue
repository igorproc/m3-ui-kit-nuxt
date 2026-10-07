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
import { useSurfaceClickWarning } from '#kit/composables/surface/useSurfaceClickWarning'
import { mSurfaceProps } from './props'

const props = defineProps(mSurfaceProps)

useSurfaceClickWarning(() => props.tag)
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/surface/index' as t;

$prefix: 'md-surface';

.ui-surface {
  $t: material-map(t.$tokens, $prefix);

  display: block;
  color: g($t, 'content.color');
  overflow-wrap: break-word;
  border-style: solid;
  border-width: 0;
  border-color: transparent;
  border-radius: g($t, 'container.shape');

  @each $variant, $preset in g($t, 'variant') {
    $base: 'variant.#{$variant}';

    &--#{$variant} {
      background-color: g($t, '#{$base}.container.color');

      @if map.has-key($preset, 'outline') {
        border-width: g($t, '#{$base}.outline.width');
        border-color: g($t, '#{$base}.outline.color');
      }

      @if map.has-key($preset, 'elevation') {
        box-shadow: g($t, '#{$base}.elevation');
      }
    }
  }

  // `plain` matches the page in any mode and `outlined` already has an edge;
  // these two are set apart only by a tone or a shadow.
  &--filled,
  &--elevated {
    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  // Corner shape presets from the canonical M3 scale.
  @each $name, $radius in $theme-shape-link {
    &--shape-#{$name} {
      border-radius: #{$radius};
    }
  }
}
</style>
