<template>
  <div class="ui-date-picker__calendar">
    <div class="ui-date-picker__weekdays">
      <span
        v-for="(weekday, idx) in weekdays"
        :key="`${weekday}-${idx}`"
        class="ui-date-picker__weekday"
      >
        {{ weekday }}
      </span>
    </div>

    <div class="ui-date-picker__grid">
      <button
        v-for="day in days"
        :key="day.key"
        type="button"
        class="ui-date-picker__day"
        :class="{
          'ui-date-picker__day--outside': !day.inCurrentMonth,
          'ui-date-picker__day--today': day.isToday,
          'ui-date-picker__day--selected': day.isSelected,
          'ui-date-picker__day--disabled': day.isDisabled,
        }"
        :disabled="day.isDisabled"
        :aria-disabled="day.isDisabled"
        :aria-label="day.ariaLabel"
        @click="onClick(day)"
      >
        <span class="ui-date-picker__day-state" />
        <span class="ui-date-picker__day-label">
          <slot
            name="day"
            :day="day"
          >
            {{ day.label }}
          </slot>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Dayjs } from 'dayjs'
import type { DayCell } from '~/composables/date'

interface Props {
  weekdays: string[]
  days: DayCell[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', date: Dayjs): void
}>()

function onClick(day: DayCell) {
  if (day.isDisabled) return
  emit('select', day.date)
}
</script>
