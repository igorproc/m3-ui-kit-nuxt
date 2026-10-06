<template>
  <section class="fixture-matrix">
    <h1>MTextarea — state matrix</h1>

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
            <MTextarea
              v-model="values[`${state.name}-${variant}`]"
              :variant="variant"
              :label="`${state.name} ${variant}`"
              :rows="2"
              v-bind="state.props"
              :data-test="`${state.name}-${variant}`"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Label placement (outlined)</h2>
    <div class="fixture-row">
      <MTextarea
        v-for="placement in placements"
        :key="placement"
        variant="outlined"
        :rows="2"
        :label-placement="placement"
        :label="`Placement ${placement}`"
        :data-test="`placement-${placement}`"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MTextarea from '#kit/components/ui/textarea/index.vue'
import type { MTextareaVariant } from '#kit/components/ui/textarea/props'
import type { MFieldLabelPlacement } from '#kit/components/ui/text-field/props'

const variants: MTextareaVariant[] = ['filled', 'outlined']
const placements: MFieldLabelPlacement[] = ['top', 'float', 'inset', 'hidden']

const states: { name: string, props: Record<string, unknown>, value?: string }[] = [
  { name: 'enabled', props: {} },
  { name: 'populated', props: {}, value: 'Shipped the new release notes.' },
  { name: 'helper', props: { helperText: 'Markdown supported' } },
  { name: 'required', props: { required: true } },
  { name: 'counter', props: { counter: true, maxlength: 120 }, value: 'Twelve chars' },
  { name: 'resizable', props: { resizable: true, maxRows: 8, resizeLabel: 'Resize notes' } },
  { name: 'readonly', props: { readonly: true }, value: 'Read only' },
  { name: 'error', props: { errorMessage: 'Write at least a sentence' } },
  { name: 'flagged', props: { error: true } },
  { name: 'disabled', props: { disabled: true, resizable: true, resizeLabel: 'Resize notes' }, value: 'Disabled' },
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
