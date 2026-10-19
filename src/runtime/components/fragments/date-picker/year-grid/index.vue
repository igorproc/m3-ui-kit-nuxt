<template>
  <div
    v-bind="control.gridAttrs.value"
    class="ui-date-picker__years"
  >
    <div
      v-for="(row, rowIndex) in control.rows.value"
      :key="rowIndex"
      class="ui-date-picker__row"
      role="row"
    >
      <div
        v-for="year in row"
        :key="year"
        v-bind="control.getCellAttrs(year)"
        class="ui-date-picker__year"
        :class="{
          'ui-date-picker__year--selected': year === selectedYear,
          'ui-date-picker__year--current': year === currentYear,
        }"
      >
        <slot
          name="year"
          :year="year"
        >
          {{ calendar.year(year) }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The year list. Behavior comes whole from `useYearGridControl`; the list is
 * centred on the year on screen as it mounts, before its first frame, so it
 * never shows the top of the century while it fades in.
 */
import { useYearGridControl } from '#kit/composables/date/useYearGridControl'
import { mDatePickerYearGridProps } from './props'

const props = defineProps(mDatePickerYearGridProps)
const emit = defineEmits<{ (e: 'select', year: number): void }>()

defineSlots<{ year?: (props: { year: number }) => unknown }>()

const control = useYearGridControl({
  calendar: () => props.calendar,
  years: () => props.years,
  shownYear: () => props.shownYear,
  selectedYear: () => props.selectedYear,
  currentYear: () => props.currentYear,
  disabled: () => props.disabled,
  labelledBy: () => props.labelledBy,
  columns: 3,
  onSelect: year => emit('select', year),
}, props.id)

onMounted(() => control.centerYear(props.shownYear))

defineExpose({ focusYear: control.focusYear })
</script>
