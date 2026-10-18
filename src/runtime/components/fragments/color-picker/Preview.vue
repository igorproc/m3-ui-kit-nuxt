<template>
  <!-- A picture of the value: the value field below says it to assistive tech. -->
  <div
    class="ui-color-preview"
    aria-hidden="true"
  >
    <span
      class="ui-color-preview__swatch"
      :style="{ '--preview-color': ctx.cssColor.value }"
    />
    <span class="ui-color-preview__value">{{ ctx.value.value ?? '—' }}</span>
  </div>
</template>

<script setup lang="ts">
import { useColorPickerContext } from '#kit/composables/color-picker/context'

/** Private preview leaf: current color swatch + textual value. */
const ctx = useColorPickerContext()
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/color-picker/index' as t;

.ui-color-preview {
  $t: material-map(t.$tokens, 'm-color-picker');

  display: flex;
  align-items: center;
  gap: g($t, 'preview.gap');

  // The edge is what keeps a light colour visible on a light surface.
  &__swatch {
    position: relative;
    flex: 0 0 auto;
    width: g($t, 'preview.size');
    height: g($t, 'preview.size');
    border: g($t, 'preview.outline-width') solid g($t, 'preview.outline');
    border-radius: g($t, 'preview.radius');
    background:
      linear-gradient(var(--preview-color), var(--preview-color)),
      conic-gradient(g($t, 'checker.a') 0 25%, g($t, 'checker.b') 0 50%, g($t, 'checker.a') 0 75%, g($t, 'checker.b') 0) 0 0 / #{g($t, 'checker.size')} #{g($t, 'checker.size')};

    // The swatch is the value itself: forcing would paint it Canvas. The edge
    // takes the system text colour.
    @include forced-colors {
      border-color: CanvasText;
      forced-color-adjust: none;
    }
  }

  &__value {
    min-width: 0;
    color: g($t, 'preview.value.color');
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;

    @include typescale(g($t, 'preview.value.type'));
  }
}
</style>
