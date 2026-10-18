<template>
  <section class="fixture-color-input">
    <h1>MColorInput — state matrix</h1>

    <div
      v-for="variant in variants"
      :key="variant"
      class="fixture-color-input__row"
    >
      <MColorInput
        v-for="state in states"
        :key="state.name"
        v-model="values[`${state.name}-${variant}`]"
        :variant="variant"
        :label="`Accent ${state.name} ${variant}`"
        picker-label="Pick a colour"
        format-hint="Use #RRGGBB, rgb() or hsl()"
        :picker-messages="pickerMessages"
        v-bind="state.props"
        :data-test="`${state.name}-${variant}`"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MColorInput from '#kit/components/ui/color-input/index.vue'

const variants = ['filled', 'outlined'] as const

const pickerMessages = {
  saturation: 'Saturation',
  brightness: 'Brightness',
  hue: 'Hue',
  alpha: 'Opacity',
  value: 'Colour value',
  format: 'Format',
  channels: 'Channels',
  formatHint: 'Use #RRGGBB, rgb() or hsl()',
}

const states = [
  { name: 'empty', props: {}, value: null },
  { name: 'value', props: {}, value: '#6750a4' },
  { name: 'required', props: { required: true }, value: null },
  { name: 'error', props: { errorMessage: 'Pick a darker colour' }, value: '#ffffff' },
  { name: 'readonly', props: { readonly: true }, value: '#6750a4' },
  { name: 'disabled', props: { disabled: true }, value: '#6750a4' },
]

const values = reactive<Record<string, string | null>>({})
for (const state of states) {
  for (const variant of variants) {
    values[`${state.name}-${variant}`] = state.value
  }
}
</script>

<style lang="scss">
.fixture-color-input {
  display: grid;
  gap: 16rem;

  &__row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240rem, 1fr));
    gap: 16rem;
  }
}
</style>
