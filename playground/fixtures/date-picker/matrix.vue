<template>
  <section class="fixture-date-picker">
    <h1>MDatePicker — state matrix</h1>

    <div class="fixture-date-picker__grid">
      <div
        v-for="state in states"
        :key="state.name"
        class="fixture-date-picker__case"
      >
        <h2>{{ state.name }}</h2>
        <MDatePicker
          v-model="values[state.name]"
          v-bind="state.props"
          :data-test="state.name"
        />
      </div>
    </div>

    <div class="fixture-date-picker__case">
      <h2>modal</h2>
      <MButton
        variant="outlined"
        data-test="open-dialog"
        @click="dialogOpen = true"
      >
        Pick a date
      </MButton>
      <output data-test="dialog-value">{{ dialogValue ? dialogValue.toDateString() : 'none' }}</output>
      <output data-test="dialog-outcome">{{ outcome }}</output>
      <MDialogDate
        v-model="dialogOpen"
        v-model:date="dialogValue"
        :min-date="new Date(2026, 0, 1)"
        :max-date="new Date(2027, 11, 31)"
        @cancel="outcome = 'cancelled'"
        @confirm="outcome = 'confirmed'"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDatePicker from '#kit/components/ui/date-picker/index.vue'
import MDialogDate from '#kit/components/ui/dialog/date/index.vue'

// Fixed dates keep the matrix comparable run to run; only the today ring moves.
const states = [
  { name: 'selected', props: {}, value: new Date(2026, 9, 14) },
  { name: 'empty', props: {}, value: null },
  { name: 'bounded', props: { minDate: new Date(2026, 9, 10), maxDate: new Date(2026, 9, 24) }, value: new Date(2026, 9, 14) },
  { name: 'disabled', props: { disabled: true }, value: new Date(2026, 9, 14) },
  { name: 'readonly', props: { readonly: true }, value: new Date(2026, 9, 14) },
  { name: 'german', props: { locale: 'de-DE' }, value: new Date(2026, 9, 14) },
  { name: 'typed', props: { mode: 'input' as const }, value: new Date(2026, 9, 14) },
  { name: 'no-toggle', props: { modeToggle: false, label: 'Departure' }, value: null },
]

const values = reactive<Record<string, Date | null>>(Object.fromEntries(states.map(state => [state.name, state.value])))
const dialogOpen = ref(false)
const dialogValue = ref<Date | null>(new Date(2026, 9, 14))
const outcome = ref('none')
</script>

<style lang="scss">
.fixture-date-picker {
  display: grid;
  gap: 24rem;

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24rem;
  }

  &__case {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: 8rem;
    max-width: 100%;
  }
}
</style>
