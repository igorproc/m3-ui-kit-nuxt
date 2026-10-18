<template>
  <section class="fixture-time-picker">
    <h1>MTimePicker — state matrix</h1>

    <div class="fixture-time-picker__grid">
      <div
        v-for="state in states"
        :key="state.name"
        class="fixture-time-picker__case"
      >
        <h2>{{ state.name }}</h2>
        <MTimePicker
          v-model="values[state.name]"
          v-bind="state.props"
          :data-test="state.name"
        />
      </div>
    </div>

    <div class="fixture-time-picker__wide">
      <h2>horizontal</h2>
      <MTimePicker
        v-model="horizontal"
        layout="horizontal"
        hour-cycle="h12"
        label="Select time"
        data-test="horizontal"
      />
      <h2>horizontal, 24-hour</h2>
      <MTimePicker
        v-model="horizontal24"
        layout="horizontal"
        label="Select time"
        data-test="horizontal-h23"
      />
    </div>

    <form
      data-test="form"
      @submit.prevent="submitted = true"
    >
      <MTimePicker
        v-model="inForm"
        hour-cycle="h12"
        name="start"
        aria-label="Start time"
      />
      <output data-test="submitted">{{ submitted ? 'submitted' : 'idle' }}</output>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MTimePicker from '#kit/components/ui/time-picker/index.vue'

const states = [
  { name: 'h23-evening', props: { label: 'Select time' }, value: '21:45' },
  { name: 'h12-morning', props: { label: 'Select time', hourCycle: 'h12' as const }, value: '09:07' },
  { name: 'midnight', props: { hourCycle: 'h12' as const }, value: '00:00' },
  { name: 'noon', props: { hourCycle: 'h12' as const }, value: '12:00' },
  { name: 'empty', props: { label: 'Select time' }, value: '' },
  { name: 'input-h23', props: { mode: 'input' as const, label: 'Enter time', helperText: 'Opening hours 9–18' }, value: '14:30' },
  { name: 'input-h12', props: { mode: 'input' as const, label: 'Enter time', hourCycle: 'h12' as const }, value: '18:05' },
  { name: 'input-error', props: { mode: 'input' as const, error: true, errorMessage: 'Pick a time after 9:00' }, value: '07:00' },
  { name: 'disabled', props: { disabled: true, hourCycle: 'h12' as const }, value: '10:30' },
  { name: 'readonly', props: { readonly: true }, value: '10:30' },
]

const values = reactive<Record<string, string>>(Object.fromEntries(states.map(state => [state.name, state.value])))
const horizontal = ref('16:20')
const horizontal24 = ref('16:20')
const inForm = ref('08:00')
const submitted = ref(false)
</script>

<style lang="scss">
.fixture-time-picker {
  display: grid;
  gap: 24rem;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(340rem, 100%), 1fr));
    gap: 24rem;
  }

  &__case,
  &__wide {
    display: grid;
    align-content: start;
    gap: 8rem;
    min-width: 0;
  }
}
</style>
