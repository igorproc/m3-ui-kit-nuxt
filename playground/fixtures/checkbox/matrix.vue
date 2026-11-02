<template>
  <section class="fixture-choice">
    <h1>MCheckbox — state matrix</h1>

    <div
      v-for="state in states"
      :key="state.name"
      class="fixture-choice__case"
      :data-test="state.name"
    >
      <MCheckbox
        v-model="values[state.name]"
        :label="`Option, ${state.name}`"
        v-bind="state.props"
      />
    </div>

    <h2>Mixed parent</h2>
    <div
      class="fixture-choice__case"
      data-test="parent"
    >
      <MCheckbox
        v-model="parent"
        v-model:indeterminate="mixed"
        label="Select all"
      />
    </div>

    <h2>Label from the slot</h2>
    <div
      class="fixture-choice__case"
      data-test="slot-label"
    >
      <MCheckbox v-model="slotted">
        I agree to the <a href="#terms">terms</a>
      </MCheckbox>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const states = [
  { name: 'unchecked', props: {} },
  { name: 'checked', props: {} },
  { name: 'disabled', props: { disabled: true } },
  { name: 'disabled-checked', props: { disabled: true } },
  { name: 'helper', props: { helperText: 'Sent once a week' } },
  { name: 'error', props: { errorMessage: 'Accept the terms to continue' } },
  { name: 'error-checked', props: { error: true } },
  { name: 'indeterminate', props: { indeterminate: true } },
]

const values = reactive<Record<string, boolean>>({
  'checked': true,
  'disabled-checked': true,
  'error-checked': true,
})

const parent = ref(false)
const mixed = ref(true)
const slotted = ref(false)
</script>

<style lang="scss">
.fixture-choice {
  display: flex;
  flex-direction: column;
  gap: 8rem;

  &__case {
    display: flex;
  }
}
</style>
