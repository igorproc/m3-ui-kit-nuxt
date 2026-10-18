<template>
  <section class="fixture-stress">
    <h1>MColorPicker — stress content</h1>

    <div
      class="fixture-stress__narrow"
      data-test="narrow"
    >
      <MColorPicker
        v-model="narrow"
        label="Colour in a narrow column"
        :messages="{ format: 'Format', value: 'Colour value', swatches: 'Palette', hue: 'Hue', saturation: 'Saturation', brightness: 'Brightness' }"
        :swatches="many"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MColorPicker from '#kit/components/ui/color-picker/index.vue'

const narrow = ref<string | null>('#6750a4')
// Forty swatches: still one tab stop.
const many = Array.from({ length: 40 }, (_, index) => ({
  value: `hsl(${(index * 9) % 360} 70% 50%)`,
  label: `Swatch ${index + 1}`,
}))
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 24rem;

  &__narrow {
    width: min(248rem, 100%);
  }
}
</style>
