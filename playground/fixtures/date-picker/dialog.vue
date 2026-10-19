<template>
  <section class="fixture-date-dialog">
    <h1>MDialogDate — draft, payload and first focus</h1>

    <div
      v-for="item in cases"
      :key="item.name"
      class="fixture-date-dialog__case"
    >
      <h2>{{ item.name }}</h2>
      <MButton
        variant="outlined"
        :data-test="`open-${item.name}`"
        @click="open[item.name] = true"
      >
        Open {{ item.name }}
      </MButton>
      <output :data-test="`${item.name}-value`">{{ describe(dates[item.name]) }}</output>
      <output :data-test="`${item.name}-payload`">{{ payloads[item.name] }}</output>
    </div>

    <!-- One-way `:date`: the payload of `confirm` is the only way back. -->
    <MDialogDate
      v-model="open.oneway"
      :date="dates.oneway"
      @confirm="payloads.oneway = describe($event)"
    />

    <!-- An ISO day string as the model, as a form would hold it. -->
    <MDialogDate
      v-model="open.iso"
      v-model:date="dates.iso"
      @confirm="payloads.iso = describe($event)"
    />

    <!-- Nothing chosen: the first focus should land on today. -->
    <MDialogDate
      v-model="open.empty"
      v-model:date="dates.empty"
      @confirm="payloads.empty = describe($event)"
    />

    <!-- Opens on the typed date. -->
    <MDialogDate
      v-model="open.typed"
      v-model:date="dates.typed"
      initial-mode="input"
      @confirm="payloads.typed = describe($event)"
    />
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDialogDate from '#kit/components/ui/dialog/date/index.vue'

type CaseName = 'oneway' | 'iso' | 'empty' | 'typed'
type DateValue = Date | string | number | null

const cases: Array<{ name: CaseName }> = [{ name: 'oneway' }, { name: 'iso' }, { name: 'empty' }, { name: 'typed' }]

const open = reactive<Record<CaseName, boolean>>({ oneway: false, iso: false, empty: false, typed: false })
const dates = reactive<Record<CaseName, DateValue>>({
  oneway: new Date(2026, 9, 14),
  iso: '2026-10-14',
  empty: null,
  typed: new Date(2026, 9, 14),
})
const payloads = reactive<Record<CaseName, string>>({ oneway: 'none', iso: 'none', empty: 'none', typed: 'none' })

function describe(value: DateValue | undefined) {
  if (value === null || value === undefined) return 'null'
  return value instanceof Date ? `Date ${value.toDateString()}` : `${typeof value} ${String(value)}`
}
</script>

<style lang="scss">
.fixture-date-dialog {
  display: grid;
  gap: 24rem;

  &__case {
    display: grid;
    justify-items: start;
    gap: 8rem;
  }
}
</style>
