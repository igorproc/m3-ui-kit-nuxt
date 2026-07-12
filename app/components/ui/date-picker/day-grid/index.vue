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

    <div
      ref="gridEl"
      class="ui-date-picker__grid"
      role="grid"
      @keydown="onKeydown"
    >
      <div
        v-for="(week, wIdx) in weeks"
        :key="`week-${wIdx}`"
        class="ui-date-picker__week"
        role="row"
      >
        <div
          v-for="(day, dIdx) in week"
          :key="day.key"
          role="gridcell"
          :aria-selected="day.isSelected"
        >
          <button
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
            :tabindex="isActiveCell(wIdx, dIdx) ? 0 : -1"
            @click="onClick(day)"
            @focus="setActive(wIdx, dIdx)"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { Dayjs } from 'dayjs'
import type { DayCell } from '~/composables/date'
import { mDatePickerDayGridProps } from './props'

const props = defineProps(mDatePickerDayGridProps)

const emit = defineEmits<{
  (e: 'select', date: Dayjs): void
}>()

const gridEl = ref<HTMLElement | null>(null)

// Chunk the flat day list into calendar weeks so the grid exposes proper
// role="row" structure and 2D arrow navigation can address cells by (row, col).
const weeks = computed<DayCell[][]>(() => {
  const out: DayCell[][] = []
  for (let i = 0; i < props.days.length; i += 7) out.push(props.days.slice(i, i + 7))
  return out
})

// Roving tabindex: only one day button is tabbable at a time. The active cell
// defaults to the selected day, falling back to today, then the first day.
function initialActive(): [number, number] {
  for (let r = 0; r < weeks.value.length; r++) {
    const row = weeks.value[r]
    if (!row) continue
    for (let c = 0; c < row.length; c++) {
      const cell = row[c]
      if (cell?.isSelected) return [r, c]
    }
  }
  for (let r = 0; r < weeks.value.length; r++) {
    const row = weeks.value[r]
    if (!row) continue
    for (let c = 0; c < row.length; c++) {
      const cell = row[c]
      if (cell?.isToday) return [r, c]
    }
  }
  return [0, 0]
}

const activeCell = ref<[number, number]>(initialActive())

watch(weeks, () => {
  activeCell.value = initialActive()
})

const isActiveCell = (row: number, col: number) =>
  activeCell.value[0] === row && activeCell.value[1] === col

function setActive(row: number, col: number) {
  activeCell.value = [row, col]
}

function focusCell(row: number, col: number) {
  activeCell.value = [row, col]
  nextTick(() => {
    const buttons = gridEl.value?.querySelectorAll<HTMLButtonElement>('.ui-date-picker__day')
    const idx = row * 7 + col
    buttons?.[idx]?.focus()
  })
}

function onKeydown(event: KeyboardEvent) {
  const rows = weeks.value.length
  if (rows === 0) return

  let [r, c] = activeCell.value
  const rowLen = (idx: number) => weeks.value[idx]?.length ?? 1
  const lastColInRow = rowLen(r) - 1

  switch (event.key) {
    case 'ArrowRight':
      if (c < lastColInRow) {
        c++
      } else if (r < rows - 1) {
        r++
        c = 0
      }
      break
    case 'ArrowLeft':
      if (c > 0) {
        c--
      } else if (r > 0) {
        r--
        c = rowLen(r) - 1
      }
      break
    case 'ArrowDown':
      if (r < rows - 1) {
        r++
        c = Math.min(c, rowLen(r) - 1)
      }
      break
    case 'ArrowUp':
      if (r > 0) {
        r--
        c = Math.min(c, rowLen(r) - 1)
      }
      break
    case 'Home':
      c = 0
      break
    case 'End':
      c = lastColInRow
      break
    default:
      return
  }

  event.preventDefault()
  focusCell(r, c)
}

function onClick(day: DayCell) {
  if (day.isDisabled) return
  emit('select', day.date)
}
</script>

<style lang="scss">
// Row + gridcell wrappers carry ARIA structure only; `display: contents` keeps
// the day buttons as the actual grid items so the existing 7-column layout and
// per-day styling (in date-picker/index.vue) are unchanged.
.ui-date-picker__week,
.ui-date-picker__grid [role='gridcell'] {
  display: contents;
}
</style>
