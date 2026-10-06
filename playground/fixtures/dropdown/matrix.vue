<template>
  <section class="fixture-matrix">
    <h1>MDropdown — state matrix</h1>

    <table>
      <thead>
        <tr>
          <th scope="col">
            State
          </th>
          <th
            v-for="variant in variants"
            :key="variant"
            scope="col"
          >
            {{ variant }}
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
            v-for="variant in variants"
            :key="variant"
          >
            <MDropdown
              v-model="values[`${state.name}-${variant}`]"
              :items="fruit"
              item-title="name"
              item-value="id"
              item-disabled="off"
              :variant="variant"
              :label="`${state.name} ${variant}`"
              v-bind="state.props"
              :data-test="`${state.name}-${variant}`"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Density</h2>
    <div class="fixture-row">
      <MDropdown
        v-for="density in densities"
        :key="density"
        :items="fruit"
        item-title="name"
        item-value="id"
        :density="density"
        :label="`Density ${density}`"
        :data-test="`density-${density}`"
      />
    </div>

    <h2>Next field</h2>
    <MTextField
      label="After the matrix"
      data-test="after"
    />
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MDropdown from '#kit/components/ui/dropdown/index.vue'
import MTextField from '#kit/components/ui/text-field/index.vue'
import type { MDropdownVariant } from '#kit/components/ui/dropdown/props'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'

const fruit = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Blueberry' },
  { id: 4, name: 'Cherry' },
  { id: 5, name: 'Damson', off: true },
  { id: 6, name: 'Elderberry' },
]

const variants: MDropdownVariant[] = ['filled', 'outlined']
const densities: MFieldDensity[] = ['compact', 'default', 'comfortable']

const states: { name: string, props: Record<string, unknown>, value?: unknown }[] = [
  { name: 'enabled', props: {} },
  { name: 'selected', props: { clearable: true }, value: 2 },
  { name: 'multiple', props: { multiple: true, clearable: true }, value: [1, 4] },
  { name: 'helper', props: { helperText: 'Picked fresh every morning' } },
  { name: 'required', props: { required: true } },
  { name: 'readonly', props: { readonly: true }, value: 3 },
  { name: 'error', props: { errorMessage: 'Choose a fruit' } },
  { name: 'flagged', props: { error: true } },
  { name: 'disabled', props: { disabled: true }, value: 1 },
  { name: 'loading', props: { loading: true } },
]

const values = reactive<Record<string, unknown>>({})
for (const state of states) {
  for (const variant of variants) {
    values[`${state.name}-${variant}`] = state.value
  }
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
    min-width: 220rem;
  }
}

.fixture-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rem;
}
</style>
