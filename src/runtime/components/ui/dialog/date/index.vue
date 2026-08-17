<template>
  <vue-final-modal
    v-model="modelValue"
    v-bind="themeAttrs"
    class="ui-date-dialog-backdrop"
    content-class="ui-date-dialog"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
    :click-to-close="clickToClose"
    :esc-to-close="escToClose"
    :aria-labelledby="headlineId"
    @before-open="onBeforeOpen"
  >
    <div
      class="ui-date-dialog__container"
      :class="`ui-date-dialog__container--${mode}`"
    >
      <!-- Dialog Header -->
      <header class="ui-date-dialog__header">
        <div class="ui-date-dialog__header-main">
          <div class="ui-date-dialog__headline">
            <p
              :id="headlineId"
              class="ui-date-dialog__headline-label"
            >
              {{ headlineLabel }}
            </p>
            <p
              class="ui-date-dialog__headline-date"
              :class="{ 'ui-date-dialog__headline-date--placeholder': !localDate }"
            >
              {{ formattedHeaderDate }}
            </p>
          </div>

          <!-- Mode Switcher -->
          <button
            type="button"
            class="ui-date-dialog__mode-toggle"
            aria-label="Toggle input mode"
            @click="toggleMode"
          >
            <m-icon :name="mode === 'picker' ? ICONS.edit : ICONS.event" />
          </button>
        </div>

        <!-- Month Navigation (Only in picker mode and when in calendar view) -->
        <div
          v-if="mode === 'picker' && view === 'calendar'"
          class="ui-date-dialog__controls"
        >
          <button
            type="button"
            class="ui-date-dialog__view-toggle"
            @click="toggleView"
          >
            {{ currentMonthYearLabel }}
            <m-icon
              :name="view === 'calendar' ? ICONS.arrowDropDown : ICONS.arrowDropUp"
              class="ui-date-dialog__view-toggle-icon"
            />
          </button>

          <div class="ui-date-dialog__month-arrows">
            <button
              type="button"
              class="ui-date-dialog__icon-button"
              aria-label="Previous month"
              @click="goToPreviousMonth"
            >
              <m-icon :name="ICONS.chevronLeft" />
            </button>

            <button
              type="button"
              class="ui-date-dialog__icon-button"
              aria-label="Next month"
              @click="goToNextMonth"
            >
              <m-icon :name="ICONS.chevronRight" />
            </button>
          </div>
        </div>

        <!-- Year Navigation (Only in picker mode and in year view) -->
        <div
          v-if="mode === 'picker' && view === 'year'"
          class="ui-date-dialog__controls"
        >
          <button
            type="button"
            class="ui-date-dialog__view-toggle"
            @click="toggleView"
          >
            {{ currentMonthYearLabel }}
            <m-icon
              :name="ICONS.arrowDropUp"
              class="ui-date-dialog__view-toggle-icon"
            />
          </button>
        </div>
      </header>

      <!-- Dialog Body Content -->
      <div class="ui-date-dialog__content">
        <!-- MODE 1: CALENDAR/YEAR PICKER -->
        <template v-if="mode === 'picker'">
          <transition
            name="ui-date-dialog-fade"
            mode="out-in"
          >
            <!-- Calendar Grid -->
            <div
              v-if="view === 'calendar'"
              key="calendar"
              class="ui-date-dialog__calendar"
            >
              <div class="ui-date-dialog__weekdays">
                <span
                  v-for="weekday in weekdayLabels"
                  :key="weekday"
                  class="ui-date-dialog__weekday"
                >
                  {{ weekday }}
                </span>
              </div>

              <div
                ref="dayGridEl"
                class="ui-date-dialog__grid"
                role="grid"
                @keydown="onDayGridKeydown"
              >
                <div
                  v-for="(week, wIdx) in dayWeeks"
                  :key="`week-${wIdx}`"
                  class="ui-date-dialog__week"
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
                      class="ui-date-dialog__day"
                      :class="{
                        'ui-date-dialog__day--outside': !day.inCurrentMonth,
                        'ui-date-dialog__day--today': day.isToday,
                        'ui-date-dialog__day--selected': day.isSelected,
                      }"
                      :aria-label="day.ariaLabel"
                      :tabindex="isActiveDay(wIdx, dIdx) ? 0 : -1"
                      @click="onSelect(day.date)"
                      @focus="activeDay = [wIdx, dIdx]"
                    >
                      <span class="ui-date-dialog__day-state" />
                      <span class="ui-date-dialog__day-label">
                        {{ day.label }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Decade Year List -->
            <div
              v-else
              key="year"
              ref="yearGrid"
              class="ui-date-dialog__year-grid"
              role="grid"
              @keydown="onYearGridKeydown"
            >
              <div
                v-for="(row, rIdx) in yearRows"
                :key="`year-row-${rIdx}`"
                class="ui-date-dialog__year-row"
                role="row"
              >
                <div
                  v-for="(year, cIdx) in row"
                  :key="year"
                  role="gridcell"
                  :aria-selected="year === displayDate.year()"
                >
                  <button
                    type="button"
                    class="ui-date-dialog__year"
                    :class="{
                      'ui-date-dialog__year--selected': year === displayDate.year(),
                      'ui-date-dialog__year--current': year === today.year(),
                    }"
                    :tabindex="isActiveYear(rIdx, cIdx) ? 0 : -1"
                    @click="onSelectYear(year)"
                    @focus="activeYear = [rIdx, cIdx]"
                  >
                    <span class="ui-date-dialog__year-label">
                      {{ year }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </template>

        <!-- MODE 2: TEXT INPUT ENTRY -->
        <template v-else>
          <div class="ui-date-dialog__input-pane">
            <m-text-field
              v-model="textInputValue"
              label="Enter date"
              placeholder="DD.MM.YYYY"
              :error-message="inputError"
              @input="onTextInput"
            />
          </div>
        </template>
      </div>

      <!-- Dialog Action Buttons -->
      <footer class="ui-date-dialog__footer">
        <m-button
          variant="text"
          @click="onCancel"
        >
          Cancel
        </m-button>
        <m-button
          variant="text"
          :disabled="mode === 'input' && !!inputError"
          @click="onConfirm"
        >
          OK
        </m-button>
      </footer>
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
import { ref, computed, inject, nextTick } from 'vue'
import type { ComputedRef } from 'vue'
import type { DayCell } from '#kit/composables/date'
import { VueFinalModal } from 'vue-final-modal'
import { ICONS } from '#kit/shared/constants/icons'
import { useDatePicker } from '../../../../composables/date'
import { useModal } from '#kit/composables/modal/useModal'
import type { M3ModalContext } from '#kit/composables/modal/useModal'
import dayjs from 'dayjs'

type DialogMode = 'picker' | 'input'

interface Props {
  headline?: string
  clickToClose?: boolean
  escToClose?: boolean
  initialMode?: DialogMode
  parent?: M3ModalContext | null
}

const props = withDefaults(defineProps<Props>(), {
  headline: 'Select date',
  clickToClose: true,
  escToClose: true,
  initialMode: 'picker',
  parent: undefined,
})

const modelValue = defineModel<boolean>('modelValue', { default: false })

// Accessible name for the dialog root (vue-final-modal supplies role="dialog"
// + aria-modal="true"; this points it at the headline label).
const headlineId = useId()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', date: Date | null): void
}>()

const { close } = useModal({
  visible: modelValue,
  parent: props.parent,
})

defineExpose({
  close,
})

// Writable v-model date
const date = defineModel<Date | string | number | null>('date', { default: null })

// Local working state
const localDate = ref<Date | string | number | null>(null)
const mode = ref<DialogMode>('picker')
const textInputValue = ref('')
const inputError = ref<string | undefined>(undefined)

const injectedThemeAttrs = inject<ComputedRef<Record<string, string | undefined>> | null>('theme-attrs', null)
const themeAttrs = computed(() => injectedThemeAttrs?.value ?? {})

const {
  view,
  today,
  displayDate,
  yearGrid,
  currentMonthYearLabel,
  weekdayLabels,
  days,
  years,
  toggleView,
  goToPreviousMonth,
  goToNextMonth,
  onSelect,
  onSelectYear,
} = useDatePicker(localDate)

const headlineLabel = computed(() => props.headline)

// --- Grid roving focus (calendar days + decade years) ---------------------
const dayGridEl = ref<HTMLElement | null>(null)
const activeDay = ref<[number, number]>([0, 0])
const activeYear = ref<[number, number]>([0, 0])
const YEAR_COLS = 3

const dayWeeks = computed<DayCell[][]>(() => {
  const out: DayCell[][] = []
  for (let i = 0; i < days.value.length; i += 7) out.push(days.value.slice(i, i + 7))
  return out
})

const yearRows = computed<number[][]>(() => {
  const out: number[][] = []
  for (let i = 0; i < years.value.length; i += YEAR_COLS) out.push(years.value.slice(i, i + YEAR_COLS))
  return out
})

watch(dayWeeks, () => {
  let found: [number, number] | null = null
  for (let r = 0; r < dayWeeks.value.length && !found; r++) {
    const row = dayWeeks.value[r]
    if (!row) continue
    for (let c = 0; c < row.length; c++) {
      if (row[c]?.isSelected || row[c]?.isToday) {
        found = [r, c]
        break
      }
    }
  }
  activeDay.value = found ?? [0, 0]
}, { immediate: true })

watch([yearRows, displayDate], () => {
  let found: [number, number] | null = null
  for (let r = 0; r < yearRows.value.length && !found; r++) {
    const row = yearRows.value[r]
    if (!row) continue
    const c = row.indexOf(displayDate.value.year())
    if (c >= 0) found = [r, c]
  }
  activeYear.value = found ?? [0, 0]
}, { immediate: true })

const isActiveDay = (row: number, col: number) =>
  activeDay.value[0] === row && activeDay.value[1] === col
const isActiveYear = (row: number, col: number) =>
  activeYear.value[0] === row && activeYear.value[1] === col

function moveGrid(
  event: KeyboardEvent,
  rowsRef: number[][] | DayCell[][],
  active: [number, number],
): [number, number] | null {
  const rowCount = rowsRef.length
  if (rowCount === 0) return null

  let [r, c] = active
  const rowLen = (idx: number) => rowsRef[idx]?.length ?? 1
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
      return null
  }

  event.preventDefault()
  return [r, c]
}

function onDayGridKeydown(event: KeyboardEvent) {
  const next = moveGrid(event, dayWeeks.value, activeDay.value)
  if (!next) return
  activeDay.value = next
  nextTick(() => {
    const buttons = dayGridEl.value?.querySelectorAll<HTMLButtonElement>('.ui-date-dialog__day')
    buttons?.[next[0] * 7 + next[1]]?.focus()
  })
}

function onYearGridKeydown(event: KeyboardEvent) {
  const next = moveGrid(event, yearRows.value, activeYear.value)
  if (!next) return
  activeYear.value = next
  nextTick(() => {
    const buttons = yearGrid.value?.querySelectorAll<HTMLButtonElement>('.ui-date-dialog__year')
    buttons?.[next[0] * YEAR_COLS + next[1]]?.focus()
  })
}

const formattedHeaderDate = computed(() => {
  if (!localDate.value) return 'Select date'
  return dayjs(localDate.value).format('ddd, MMM D')
})

function onBeforeOpen() {
  localDate.value = date.value ? new Date(date.value) : null
  mode.value = props.initialMode
  textInputValue.value = localDate.value ? dayjs(localDate.value).format('DD.MM.YYYY') : ''
  inputError.value = undefined
}

function toggleMode() {
  if (mode.value === 'picker') {
    mode.value = 'input'
    textInputValue.value = localDate.value ? dayjs(localDate.value).format('DD.MM.YYYY') : ''
    inputError.value = undefined
  } else {
    // If we have a valid parsed input, carry it over
    mode.value = 'picker'
  }
}

function onTextInput(val: string) {
  textInputValue.value = val
  if (!val) {
    localDate.value = null
    inputError.value = undefined
    return
  }

  // Parse DD.MM.YYYY format
  const parts = val.split('.')
  if (parts.length !== 3) {
    inputError.value = 'Format must be DD.MM.YYYY'
    return
  }

  const d = Number.parseInt(parts[0] ?? '', 10)
  const m = Number.parseInt(parts[1] ?? '', 10)
  const y = Number.parseInt(parts[2] ?? '', 10)

  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) {
    inputError.value = 'Invalid date format'
    return
  }

  const parsed = dayjs(`${y}-${m}-${d}`, 'YYYY-M-D')
  if (!parsed.isValid() || parsed.year() !== y || parsed.month() + 1 !== m || parsed.date() !== d) {
    inputError.value = 'Invalid date values'
    return
  }

  localDate.value = parsed.toDate()
  inputError.value = undefined
}

function onCancel() {
  modelValue.value = false
  emit('cancel')
}

function onConfirm() {
  if (mode.value === 'input' && inputError.value) {
    return
  }
  date.value = localDate.value ? new Date(localDate.value) : null
  emit('confirm', date.value as Date | null)
  modelValue.value = false
}
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/date-picker/modal-picker' as mp;
@use '#kit/assets/stylesheet/components/date-picker/modal-input' as mi;

// Common backdrop
.ui-date-dialog-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: z('dialog');
  background-color: map.get($theme-color-link, 'scrim');
  opacity: 1;
}

.ui-date-dialog {
  $prefix-mp: 'md-date-picker-modal-picker';
  $t-mp: material-map(mp.$tokens, $prefix-mp);
  $prefix-mi: 'md-date-picker-modal-input';
  $t-mi: material-map(mi.$tokens, $prefix-mi);

  display: flex;
  flex-direction: column;
  background-color: g($t-mp, 'container-bg');
  border-radius: g($t-mp, 'container-radius');
  box-shadow: g($t-mp, 'container-shadow');
  overflow: hidden;
  max-width: 360rem;
  width: calc(100vw - 32rem);

  &__container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  &__header {
    padding: g($t-mp, 'header-padding');
    background-color: transparent;
  }

  &__header-main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16rem;
  }

  &__headline-label {
    margin: 0;

    @include apply-typography(g($t-mp, 'header-headline-label-typography'));

    color: g($t-mp, 'header-headline-label-color');
  }

  &__headline-date {
    margin: 0;

    @include apply-typography(g($t-mp, 'header-headline-date-typography'));

    color: g($t-mp, 'header-headline-date-color');

    &--placeholder {
      color: g($t-mp, 'header-headline-date-placeholder-color');
      opacity: 0.7;
    }
  }

  &__mode-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40rem;
    height: 40rem;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    color: g($t-mp, 'controls-icon-button-color');
    transition: background-color 0.2s;

    &:hover {
      background-color: g($t-mp, 'controls-icon-button-hover-bg');
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8rem;
  }

  &__view-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8rem;
    padding: 8rem 4rem;
    border: none;
    background: none;
    cursor: pointer;
    color: g($t-mp, 'controls-view-toggle-color');

    @include apply-typography(g($t-mp, 'controls-view-toggle-typography'));

    border-radius: 999rem;
    transition: background-color 0.2s;

    &:hover {
      background-color: g($t-mp, 'controls-view-toggle-hover-bg');
    }
  }

  &__month-arrows {
    display: flex;
    gap: 4rem;
  }

  &__icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: g($t-mp, 'controls-icon-button-size');
    height: g($t-mp, 'controls-icon-button-size');
    border-radius: 50%;
    border: none;
    background: none;
    color: g($t-mp, 'controls-icon-button-color');
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: g($t-mp, 'controls-icon-button-hover-bg');
    }
  }

  &__content {
    padding: 0 12rem;
    min-height: 280rem;
    display: flex;
    flex-direction: column;
  }

  &__calendar {
    display: flex;
    flex-direction: column;
  }

  &__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 8rem;
  }

  &__weekday {
    text-align: center;
    height: g($t-mp, 'weekday-height');
    display: flex;
    align-items: center;
    justify-content: center;

    @include apply-typography(g($t-mp, 'weekday-typography'));

    color: g($t-mp, 'weekday-color');
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    row-gap: 4rem;
  }

  // Row + gridcell wrappers carry ARIA structure only; `display: contents`
  // keeps the day/year buttons as the actual grid items (unchanged layout).
  &__week,
  &__year-row,
  &__grid [role='gridcell'],
  &__year-grid [role='gridcell'] {
    display: contents;
  }

  &__day {
    position: relative;
    height: g($t-mp, 'day-size');
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    &-state {
      position: absolute;
      width: g($t-mp, 'day-size');
      height: g($t-mp, 'day-size');
      border-radius: 50%;
      background-color: transparent;
      transition: background-color 0.2s, transform 0.2s;
    }

    &-label {
      position: relative;

      @include apply-typography(g($t-mp, 'day-typography'));

      color: g($t-mp, 'day-color');
      z-index: 1;
    }

    &:hover {
      &-state {
        background-color: g($t-mp, 'day-hover-bg');
      }
    }
  }

  &__day--outside {
    opacity: g($t-mp, 'day-disabled-opacity');
  }

  &__day--today &__day-label {
    color: g($t-mp, 'day-today-color');
    font-weight: bold;
    box-shadow: inset 0 0 0 g($t-mp, 'day-today-outline-width') g($t-mp, 'day-today-color');
    border-radius: 50%;
    width: 32rem;
    height: 32rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__day--selected &__day-state {
    background-color: g($t-mp, 'day-selected-bg');
    transform: scale(1);
  }

  &__day--selected:hover &__day-state {
    background-color: g($t-mp, 'day-selected-hover-bg');
  }

  &__day--selected &__day-label {
    color: g($t-mp, 'day-selected-color');
  }

  &__year-grid {
    height: 280rem;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 8rem;
    gap: 8rem;

    &::-webkit-scrollbar {
      width: 4rem;
    }

    &::-webkit-scrollbar-thumb {
      background: map.get($theme-color-link, 'outline-variant');
      border-radius: 4rem;
    }
  }

  &__year {
    height: g($t-mp, 'year-height');
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 999rem;
    display: flex;
    align-items: center;
    justify-content: center;

    @include apply-typography(g($t-mp, 'year-typography'));

    color: g($t-mp, 'year-color');
    transition: background-color 0.2s;

    &:hover {
      background-color: g($t-mp, 'year-hover-bg');
    }

    &--selected {
      background-color: g($t-mp, 'year-selected-bg') !important;
      color: g($t-mp, 'year-selected-color') !important;
    }

    &--current {
      color: g($t-mp, 'year-current-color');
      font-weight: bold;
    }
  }

  &__input-pane {
    padding: g($t-mi, 'body-padding');
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    flex-grow: 1;
    min-height: 280rem;
  }

  &__footer {
    padding: g($t-mp, 'footer-padding');
    display: flex;
    justify-content: flex-end;
    gap: g($t-mp, 'footer-gap');
  }
}

.ui-date-dialog-fade-enter-active,
.ui-date-dialog-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.ui-date-dialog-fade-enter-from,
.ui-date-dialog-fade-leave-to {
  opacity: 0;
  transform: translateY(4rem);
}
</style>
