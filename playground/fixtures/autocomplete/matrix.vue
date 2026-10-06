<template>
  <section class="fixture-matrix">
    <h1>MAutocomplete — state matrix</h1>

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
            <MAutocomplete
              v-model="values[`${state.name}-${variant}`]"
              :items="cities"
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

    <h2>Next field</h2>
    <MTextField
      label="After the matrix"
      data-test="after"
    />
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MAutocomplete from '#kit/components/ui/autocomplete/index.vue'
import MTextField from '#kit/components/ui/text-field/index.vue'
import type { MDropdownVariant } from '#kit/components/ui/dropdown/props'

const cities = [
  { id: 1, name: 'Amsterdam' },
  { id: 2, name: 'Berlin' },
  { id: 3, name: 'Bern', off: true },
  { id: 4, name: 'Copenhagen' },
  { id: 5, name: 'Dublin' },
  { id: 6, name: 'Edinburgh' },
]

const variants: MDropdownVariant[] = ['filled', 'outlined']

const states: { name: string, props: Record<string, unknown>, value?: unknown }[] = [
  { name: 'enabled', props: {} },
  { name: 'selected', props: { clearable: true }, value: 2 },
  { name: 'multiple', props: { multiple: true, clearable: true }, value: [1, 4] },
  { name: 'min-length', props: { minSearchLength: 2, helperText: 'Type two letters' } },
  { name: 'readonly', props: { readonly: true }, value: 4 },
  { name: 'error', props: { errorMessage: 'Choose a city' } },
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
</style>
