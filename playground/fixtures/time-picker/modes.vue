<template>
  <section class="fixture-time-modes">
    <h1>MTimePicker — switching mode on the fly</h1>

    <div
      v-for="item in cases"
      :key="item.name"
      class="fixture-time-modes__case"
    >
      <h2>{{ item.name }}</h2>
      <MButton
        variant="outlined"
        :data-test="`toggle-${item.name}`"
        @click="modes[item.name] = modes[item.name] === 'picker' ? 'input' : 'picker'"
      >
        {{ modes[item.name] }}
      </MButton>
      <MTimePicker
        v-model="values[item.name]"
        v-model:mode="modes[item.name]"
        :hour-cycle="item.cycle"
        label="Select time"
        mode-toggle
        switch-to-input-label="Switch to typing the time"
        switch-to-picker-label="Switch to the dial"
        :data-test="item.name"
      />
      <p :data-test="`${item.name}-after`">
        Content under the picker
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MTimePicker from '#kit/components/ui/time-picker/index.vue'
import type { MTimePickerMode } from '#kit/components/ui/time-picker/props'

type CaseName = 'h23' | 'h12'

const cases: Array<{ name: CaseName, cycle: 'h23' | 'h12' }> = [{ name: 'h23', cycle: 'h23' }, { name: 'h12', cycle: 'h12' }]

const modes = reactive<Record<CaseName, MTimePickerMode>>({ h23: 'picker', h12: 'picker' })
const values = reactive<Record<CaseName, string>>({ h23: '21:45', h12: '09:07' })
</script>

<style lang="scss">
.fixture-time-modes {
  display: grid;
  gap: 24rem;

  &__case {
    display: grid;
    justify-items: start;
    gap: 8rem;
  }
}
</style>
