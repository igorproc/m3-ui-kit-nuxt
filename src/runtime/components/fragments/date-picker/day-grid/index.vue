<template>
  <div
    v-bind="gridAttrs"
    class="ui-date-picker__grid"
  >
    <div
      class="ui-date-picker__row"
      role="row"
    >
      <span
        v-for="(weekday, index) in weekdays"
        :key="index"
        class="ui-date-picker__weekday"
        role="columnheader"
        :aria-label="weekday.long"
      >{{ weekday.narrow }}</span>
    </div>

    <div
      v-for="(week, row) in weeks"
      :key="row"
      class="ui-date-picker__row"
      role="row"
    >
      <div
        v-for="cell in week"
        :key="cell.key"
        v-bind="getCellAttrs(cell)"
        class="ui-date-picker__cell"
        :class="cell.date && {
          'ui-date-picker__day': true,
          'ui-date-picker__day--today': cell.today,
          'ui-date-picker__day--selected': cell.selected,
          'ui-date-picker__day--unavailable': cell.unavailable,
        }"
      >
        <slot
          v-if="cell.date"
          name="day"
          :day="cell"
        >
          {{ cell.label }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The day grid: a header row of weekdays and six weeks of cells. Cells
 * outside the month are drawn empty — a neighbouring month's day is not a
 * choice here. Behavior comes whole from the bags of `useDateGridControl`.
 */
import { mDatePickerDayGridProps } from './props'
import type { DateGridCell } from '#kit/composables/date/useDateGridControl'

defineProps(mDatePickerDayGridProps)

defineSlots<{ day?: (props: { day: DateGridCell }) => unknown }>()
</script>
