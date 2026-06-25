<template>
  <div
    ref="rootEl"
    class="ui-date-picker__year-grid"
    role="grid"
    @keydown="onKeydown"
  >
    <div
      v-for="(row, rIdx) in rows"
      :key="`year-row-${rIdx}`"
      class="ui-date-picker__year-row"
      role="row"
    >
      <div
        v-for="(year, cIdx) in row"
        :key="year"
        role="gridcell"
        :aria-selected="year === selectedYear"
      >
        <button
          type="button"
          class="ui-date-picker__year"
          :class="{
            'ui-date-picker__year--selected': year === selectedYear,
            'ui-date-picker__year--current': year === currentYear,
          }"
          :tabindex="isActiveCell(rIdx, cIdx) ? 0 : -1"
          @click="emit('select', year)"
          @focus="setActive(rIdx, cIdx)"
        >
          <span class="ui-date-picker__year-label">
            <slot :year="year">
              {{ year }}
            </slot>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { mDatePickerYearGridProps } from './props'

const props = defineProps(mDatePickerYearGridProps)

const emit = defineEmits<{
  (e: 'select', year: number): void
}>()

const rootEl = ref<HTMLElement | null>(null)

const COLS = 3

// Chunk the flat year list into rows so the grid exposes role="row" structure
// and 2D arrow navigation can address cells by (row, col).
const rows = computed<number[][]>(() => {
  const out: number[][] = []
  for (let i = 0; i < props.years.length; i += COLS) out.push(props.years.slice(i, i + COLS))
  return out
})

// Roving tabindex: active cell defaults to the selected year, else first cell.
function initialActive(): [number, number] {
  for (let r = 0; r < rows.value.length; r++) {
    const row = rows.value[r]
    if (!row) continue
    const c = row.indexOf(props.selectedYear)
    if (c >= 0) return [r, c]
  }
  return [0, 0]
}

const activeCell = ref<[number, number]>(initialActive())

watch(rows, () => {
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
    const buttons = rootEl.value?.querySelectorAll<HTMLButtonElement>('.ui-date-picker__year')
    const idx = row * COLS + col
    buttons?.[idx]?.focus()
  })
}

function onKeydown(event: KeyboardEvent) {
  const rowCount = rows.value.length
  if (rowCount === 0) return

  let [r, c] = activeCell.value
  const rowLen = (idx: number) => rows.value[idx]?.length ?? 1
  const lastColInRow = rowLen(r) - 1

  switch (event.key) {
    case 'ArrowRight':
      if (c < lastColInRow) {
        c++
      } else if (r < rowCount - 1) {
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
      if (r < rowCount - 1) {
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

defineExpose({ element: rootEl })
</script>

<style lang="scss">
// Row + gridcell wrappers carry ARIA structure only; `display: contents` keeps
// the year buttons as the actual grid items so the existing 3-column layout
// (in date-picker/index.vue) is unchanged.
/* stylelint-disable selector-class-pattern -- `__year-row`/`__year-grid` read as block__element-with-hyphen; gridcell wrapper is an intentional attr selector */
.ui-date-picker__year-row,
.ui-date-picker__year-grid [role='gridcell'] {
  display: contents;
}
/* stylelint-enable selector-class-pattern */
</style>
