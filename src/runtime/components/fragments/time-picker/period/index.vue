<template>
  <div
    v-bind="control.periodGroupAttrs.value"
    class="ui-time-picker__period"
  >
    <MButton
      v-for="period in PERIODS"
      :key="period"
      v-bind="control.getPeriodAttrs(period)"
      class="ui-time-picker__period-option"
      :class="control.period.value === period ? 'ui-button--selected' : 'ui-button--unselected'"
    >
      {{ labels[period] }}
    </MButton>
  </div>
</template>

<script setup lang="ts">
/** AM and PM as a radio group of two toggle buttons. */
import MButton from '#kit/components/ui/button/index.vue'
import type { TimePeriod } from '#kit/utils/time/createClock'
import type { TimePickerControl } from '#kit/composables/time/useTimePickerControl'

defineProps<{
  control: TimePickerControl
  labels: Record<TimePeriod, string>
}>()

const PERIODS: TimePeriod[] = ['am', 'pm']
</script>
