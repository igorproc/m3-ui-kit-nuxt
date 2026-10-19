<template>
  <!-- A picture of the value: the value field beside it says it to assistive tech. -->
  <span
    class="ui-color-preview"
    aria-hidden="true"
    :style="{ '--m-color-picker-preview': ctx.cssColor.value }"
  />
</template>

<script setup lang="ts">
import { useColorPickerContext } from '#kit/utils/color-picker/context'

/** Private preview leaf: the current colour over the transparency checkerboard. */
const ctx = useColorPickerContext()
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/color-picker/index' as t;
@use '#kit/assets/stylesheet/components/color-picker/checker' as *;

.ui-color-preview {
  $t: material-map(t.$tokens, 'm-color-picker');

  flex: 0 0 auto;
  width: g($t, 'preview.size');
  height: g($t, 'preview.size');

  // The edge is what keeps a light colour visible on a light surface.
  border: g($t, 'preview.outline-width') solid g($t, 'preview.outline');
  border-radius: g($t, 'preview.radius');

  @include checker($t, linear-gradient(var(--m-color-picker-preview), var(--m-color-picker-preview)));

  // The swatch is the value itself: forcing would paint it Canvas. The edge
  // takes the system text colour.
  @include forced-colors {
    border-color: CanvasText;
    forced-color-adjust: none;
  }
}
</style>
