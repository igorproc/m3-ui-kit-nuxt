<template>
  <div
    ref="rootEl"
    class="ui-date-picker__year-grid"
  >
    <button
      v-for="year in years"
      :key="year"
      type="button"
      class="ui-date-picker__year"
      :class="{
        'ui-date-picker__year--selected': year === selectedYear,
        'ui-date-picker__year--current': year === currentYear,
      }"
      @click="emit('select', year)"
    >
      <span class="ui-date-picker__year-label">
        <slot :year="year">
          {{ year }}
        </slot>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mDatePickerYearGridProps } from './props'

defineProps(mDatePickerYearGridProps)

const emit = defineEmits<{
  (e: 'select', year: number): void
}>()

const rootEl = ref<HTMLElement | null>(null)

defineExpose({ element: rootEl })
</script>
