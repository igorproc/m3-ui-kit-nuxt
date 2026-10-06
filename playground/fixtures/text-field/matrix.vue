<template>
  <section class="fixture-matrix">
    <h1>MTextField — state matrix</h1>

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
            <MTextField
              v-model="values[`${state.name}-${variant}`]"
              :variant="variant"
              :label="`${state.name} ${variant}`"
              v-bind="state.props"
              :data-test="`${state.name}-${variant}`"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Label placement (outlined, with a prepend)</h2>
    <div class="fixture-row">
      <MTextField
        v-for="placement in placements"
        :key="placement"
        variant="outlined"
        :label-placement="placement"
        :label="`Placement ${placement}`"
        :data-test="`placement-${placement}`"
      >
        <template #prepend>
          <MIcon name="search" />
        </template>
      </MTextField>
    </div>

    <h2>Density</h2>
    <div class="fixture-row">
      <MTextField
        v-for="density in densities"
        :key="density"
        :density="density"
        :label="`Density ${density}`"
        :data-test="`density-${density}`"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MTextField from '#kit/components/ui/text-field/index.vue'
import type { MFieldDensity, MFieldLabelPlacement, MTextFieldVariant } from '#kit/components/ui/text-field/props'

const variants: MTextFieldVariant[] = ['filled', 'outlined', 'underline']
const placements: MFieldLabelPlacement[] = ['top', 'float', 'inset', 'hidden']
const densities: MFieldDensity[] = ['compact', 'default', 'comfortable']

const states: { name: string, props: Record<string, unknown>, value?: string }[] = [
  { name: 'enabled', props: {} },
  { name: 'populated', props: {}, value: 'Ada Lovelace' },
  { name: 'helper', props: { helperText: 'As it appears on your card' } },
  { name: 'required', props: { required: true } },
  { name: 'readonly', props: { readonly: true }, value: 'Read only' },
  { name: 'error', props: { errorMessage: 'Enter a name' } },
  { name: 'flagged', props: { error: true } },
  { name: 'disabled', props: { disabled: true }, value: 'Disabled' },
]

const values = reactive<Record<string, string>>({})
for (const state of states) {
  for (const variant of variants) {
    values[`${state.name}-${variant}`] = state.value ?? ''
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
}

.fixture-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rem;
}
</style>
