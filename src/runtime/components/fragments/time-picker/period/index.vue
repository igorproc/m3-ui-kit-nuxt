<template>
  <div
    v-bind="control.periodGroupAttrs.value"
    class="ui-time-picker__period"
  >
    <button
      v-for="period in PERIODS"
      :key="period"
      v-bind="control.getPeriodAttrs(period)"
      class="ui-time-picker__period-option"
      :class="{ 'ui-time-picker__period-option--selected': control.period.value === period }"
    >
      {{ labels[period] }}
    </button>
  </div>
</template>

<script setup lang="ts">
/** AM and PM as a radio group of two toggle buttons. */
import type { TimePeriod } from '#kit/composables/time/createClock'
import type { TimePickerControl } from '#kit/composables/time/useTimePickerControl'

defineProps<{
  control: TimePickerControl
  labels: Record<TimePeriod, string>
}>()

const PERIODS: TimePeriod[] = ['am', 'pm']
</script>
