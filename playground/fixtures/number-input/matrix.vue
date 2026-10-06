<template>
  <section class="fixture-matrix">
    <h1>MNumberInput — state matrix</h1>

    <table>
      <thead>
        <tr>
          <th scope="col">
            State
          </th>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
          >
            {{ column.key }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="state in states"
          :key="state.name"
        >
          <th scope="row">
            {{ state.name }}
          </th>
          <td
            v-for="column in columns"
            :key="column.key"
          >
            <MNumberInput
              :model-value="state.value"
              :variant="column.variant"
              :controls="column.controls"
              :label="`${state.name} ${column.key}`"
              v-bind="state.props"
              :data-test="`${state.name}-${column.key}`"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Density</h2>
    <div class="fixture-row">
      <MNumberInput
        v-for="density in densities"
        :key="density"
        :model-value="4"
        :density="density"
        :label="`Density ${density}`"
        :data-test="`density-${density}`"
      />
    </div>

    <h2>Units</h2>
    <div class="fixture-row">
      <MNumberInput
        v-model:unit="unit"
        :model-value="512"
        :units="['KiB', 'MiB', 'GiB']"
        label="Cache size"
        data-test="unit-menu"
      />
      <MNumberInput
        unit="px"
        :model-value="16"
        label="Gap"
        data-test="unit-static"
      />
    </div>
    <output data-test="unit-value">{{ unit }}</output>

    <h2>Keyboard</h2>
    <form
      class="fixture-row"
      @submit.prevent="submits++"
      @keydown.esc="onEscape"
    >
      <MNumberInput
        v-model="quantity"
        :min="0"
        :max="100"
        label="Quantity"
        data-test="keyboard"
      />
      <MNumberInput
        :model-value="5"
        :step="0.25"
        label="Ratio"
        data-test="keyboard-next"
      />
      <MButton type="submit">
        Submit
      </MButton>
    </form>
    <output data-test="quantity">{{ quantity }}</output>
    <output data-test="submits">{{ submits }}</output>
    <output data-test="escapes">{{ escapes }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MNumberInput from '#kit/components/ui/number-input/index.vue'
import type { MNumberInputControls, MNumberInputVariant } from '#kit/components/ui/number-input/props'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'

const variants: MNumberInputVariant[] = ['filled', 'outlined']
const controls: MNumberInputControls[] = ['split', 'stacked', 'scrub', false]
const columns = variants.flatMap(variant => controls.map(control => ({
  key: `${variant}-${control || 'none'}`,
  variant,
  controls: control,
})))

const states = [
  { name: 'empty', value: null, props: {} },
  { name: 'populated', value: 42, props: { helperText: 'Helper' } },
  { name: 'error', value: 120, props: { errorMessage: 'Too large', max: 100 } },
  { name: 'bare-error', value: 7, props: { error: true } },
  { name: 'readonly', value: 42, props: { readonly: true } },
  { name: 'disabled', value: 42, props: { disabled: true } },
]

const densities: MFieldDensity[] = ['compact', 'default', 'comfortable']

const unit = ref('MiB')
const quantity = ref<number | null>(10)
const submits = ref(0)
// Counts the Escapes the field left to the page — the ones a dialog would act on.
const escapes = ref(0)
const onEscape = (event: KeyboardEvent) => {
  if (!event.defaultPrevented) escapes.value++
}
</script>

<style lang="scss">
.fixture-matrix {
  display: grid;
  gap: 16rem;

  table {
    border-spacing: 12rem;
  }

  td {
    min-width: 200rem;
  }
}

.fixture-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12rem;
}
</style>
