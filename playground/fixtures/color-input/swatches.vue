<template>
  <section class="fixture-color-input-swatches">
    <h1>MColorInput — picker with and without a palette</h1>

    <MColorInput
      v-model="plain"
      label="Accent, no palette"
      picker-label="Pick a colour"
      format-hint="Use #RRGGBB, rgb() or hsl()"
      :picker-messages="pickerMessages"
      data-test="plain"
    />

    <MColorInput
      v-model="palette"
      label="Accent, palette"
      picker-label="Pick a colour"
      format-hint="Use #RRGGBB, rgb() or hsl()"
      :picker-messages="pickerMessages"
      :swatches="swatches"
      data-test="palette"
    />

    <p data-test="after">
      Content under the fields
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MColorInput from '#kit/components/ui/color-input/index.vue'

const pickerMessages = {
  saturation: 'Saturation',
  brightness: 'Brightness',
  hue: 'Hue',
  alpha: 'Opacity',
  value: 'Colour value',
  format: 'Format',
  channels: 'Channels',
  swatches: 'Palette',
  formatHint: 'Use #RRGGBB, rgb() or hsl()',
}

const swatches = [
  { value: '#6750A4', label: 'Primary' },
  { value: '#B3261E', label: 'Error' },
  { value: '#ffffff', label: 'White' },
  { value: '#000000', label: 'Black' },
]

const plain = ref<string | null>('#6750a4')
const palette = ref<string | null>('#6750a4')
</script>

<style lang="scss">
.fixture-color-input-swatches {
  display: grid;
  justify-items: start;
  gap: 16rem;
}
</style>
