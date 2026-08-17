<template>
  <div class="ui-color-preview">
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
@use 'sass:map';
@use '#kit/assets/stylesheet/components/color-picker/index' as t;

.ui-color-preview {
  $t: material-map(t.$tokens, 'md-color-picker');

  display: flex;
  align-items: center;
  gap: g($t, 'preview-gap');

  &__swatch {
    position: relative;
    width: g($t, 'preview-size');
    height: g($t, 'preview-size');
    border-radius: g($t, 'preview-radius');
    box-shadow: inset 0 0 0 g($t, 'preview-outline-width') g($t, 'preview-outline');
    background:
      linear-gradient(var(--preview-color), var(--preview-color)),
      conic-gradient(g($t, 'checker-a') 0 25%, g($t, 'checker-b') 0 50%, g($t, 'checker-a') 0 75%, g($t, 'checker-b') 0) 0 0 / #{g($t, 'checker-size')} #{g($t, 'checker-size')};
  }

  &__value {
    color: g($t, 'preview-value-color');
    font-variant-numeric: tabular-nums;

    @include typescale(g($t, 'preview-value-type'));
  }
}
</style>
