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
    box-shadow: inset 0 0 0 1rem g($t, 'swatches-outline');
    background-color: var(--swatch-color);
    cursor: pointer;
    transition: transform var(--sys-motion-duration-short-2) var(--sys-motion-easing-standard);

    &:hover {
      transform: scale(1.1);
    }

    &--selected {
      box-shadow: 0 0 0 2rem g($t, 'swatches-selected');
    }

    &:disabled {
      cursor: default;
      opacity: 0.5;
    }
  }
}
</style>
