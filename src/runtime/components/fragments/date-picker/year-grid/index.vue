<template>
  <div
    :id="id"
    ref="list"
    class="ui-date-picker__years"
    role="grid"
    :aria-labelledby="labelledBy"
    :aria-disabled="disabled || undefined"
    @keydown="onKeydown"
  >
    <div
      v-for="(row, rowIndex) in rows"
      :key="rowIndex"
      class="ui-date-picker__row"
      role="row"
    >
      <div
        v-for="year in row"
        :id="`${id}-${year}`"
        :key="year"
        class="ui-date-picker__year"
        :class="{
          'ui-date-picker__year--selected': year === selectedYear,
          'ui-date-picker__year--current': year === currentYear,
        }"
        role="gridcell"
        :tabindex="year === focusedYear && !disabled ? 0 : -1"
        :aria-selected="year === selectedYear"
        :aria-current="year === currentYear ? 'date' : undefined"
        :aria-disabled="disabled || undefined"
        @click="choose(year)"
        @focus="focusedYear = year"
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
 * The year list. It opens on the year on screen, scrolled into view inside
 * itself (never scrolling the page), and holds one tab stop that the arrows
 * move by one and by a row of three.
 */
import { mDatePickerYearGridProps } from './props'

const props = defineProps(mDatePickerYearGridProps)
const emit = defineEmits<{ (e: 'select', year: number): void }>()

defineSlots<{ year?: (props: { year: number }) => unknown }>()

const COLUMNS = 3
const list = ref<HTMLElement | null>(null)
const focusedYear = ref(props.shownYear)

const rows = computed(() => Array.from(
  { length: Math.ceil(props.years.length / COLUMNS) },
  (_, row) => props.years.slice(row * COLUMNS, row * COLUMNS + COLUMNS),
))

function cellOf(year: number) {
  return list.value?.querySelector<HTMLElement>(`[id="${props.id}-${year}"]`) ?? null
}

/** Scrolls the list (only the list) so a year sits in its middle, and focuses it. */
function focusYear(year = focusedYear.value) {
  const host = list.value
  const cell = cellOf(year)
  if (!host || !cell) return

  focusedYear.value = year
  host.scrollTop = cell.offsetTop - (host.clientHeight - cell.offsetHeight) / 2
  cell.focus({ preventScroll: true })
}

function choose(year: number) {
  if (props.disabled) return
  emit('select', year)
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    choose(focusedYear.value)
    return
  }

  const index = props.years.indexOf(focusedYear.value)
  const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl'
  const next = props.calendar.gridStep(index, event.key, props.years.length, COLUMNS, rtl)
  if (next === null) return

  event.preventDefault()
  focusYear(props.years[next])
}

defineExpose({ focusYear })
</script>
