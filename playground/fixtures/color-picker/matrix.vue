<template>
  <section class="fixture-color">
    <h1>MColorPicker — state matrix</h1>

    <div class="fixture-color__row">
      <div
        v-for="state in states"
        :key="state.name"
        :data-test="state.name"
      >
        <h2>{{ state.name }}</h2>
        <MColorPicker
          v-model="values[state.name]"
          v-model:format="formats[state.name]"
          :label="`Colour, ${state.name}`"
          :messages="messages"
          :swatches="swatches"
          v-bind="state.props"
        />
      </div>
    </div>

    <output data-test="value">{{ values.enabled }}</output>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MColorPicker from '#kit/components/ui/color-picker/index.vue'
import type { ColorFormat } from '#kit/shared/utils/color'

const messages = {
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

const states = [
  { name: 'enabled', props: {}, value: 'rgb(103, 80, 164)', format: 'rgb' as ColorFormat },
  { name: 'alpha', props: {}, value: '#6750a480', format: 'hexa' as ColorFormat },
  { name: 'readonly', props: { readonly: true }, value: '#6750a4', format: 'hex' as ColorFormat },
  { name: 'disabled', props: { disabled: true }, value: '#6750a4', format: 'hex' as ColorFormat },
]

const values = reactive<Record<string, string | null>>(Object.fromEntries(states.map(state => [state.name, state.value])))
const formats = reactive<Record<string, ColorFormat>>(Object.fromEntries(states.map(state => [state.name, state.format])))
</script>

<style lang="scss">
.fixture-color {
  display: grid;
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 24rem;
  }
}
</style>
