<template>
  <div
    class="ui-color-swatches"
    role="listbox"
    aria-label="Color swatches"
  >
    <button
      v-for="swatch in entries"
      :key="swatch.value"
      type="button"
      class="ui-color-swatches__item"
      :class="{ 'ui-color-swatches__item--selected': swatch.value === ctx.value.value }"
      role="option"
      :aria-selected="swatch.value === ctx.value.value"
      :aria-label="swatch.label"
      :disabled="ctx.disabled.value"
      :style="{ '--swatch-color': swatch.value }"
      @click="select(swatch.value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useColorPickerContext } from '~/composables/color-picker/context'
import { normalizeSwatch } from '~~/shared/utils/color'
import type { ColorSwatch } from '~~/shared/utils/color'

/** Private swatches leaf: palette grid selecting through the shared context. */
const props = defineProps<{ swatches: readonly ColorSwatch[] }>()

const ctx = useColorPickerContext()

const entries = computed(() => props.swatches.map(normalizeSwatch))

function select(value: string) {
  if (ctx.selectColor(value)) ctx.commit('swatch')
}
</script>

<style lang="scss">
@use 'sass:map';
@use '~/assets/stylesheet/components/color-picker/index' as t;

.ui-color-swatches {
  $t: material-map(t.$tokens, 'md-color-picker');

  display: flex;
  flex-wrap: wrap;
  gap: g($t, 'swatches-gap');

  &__item {
    width: g($t, 'swatches-size');
    height: g($t, 'swatches-size');
    padding: 0;
    border: none;
    border-radius: g($t, 'swatches-radius');
    box-shadow: inset 0 0 0 g($t, 'swatches-outline-width') g($t, 'swatches-outline');
    background-color: var(--swatch-color);
    cursor: pointer;
    transition: transform g($t, 'swatches-motion-duration') g($t, 'swatches-motion-easing');

    &:hover {
      transform: scale(g($t, 'swatches-hover-scale'));
    }

    &--selected {
      box-shadow: 0 0 0 g($t, 'swatches-selected-width') g($t, 'swatches-selected');
    }

    &:disabled {
      cursor: default;
      opacity: g($t, 'swatches-disabled-opacity');
    }
  }
}
</style>
