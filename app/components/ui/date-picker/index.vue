<template>
  <div class="ui-date-picker">
    <header class="ui-date-picker__header">
      <div class="ui-date-picker__headline">
        <p class="ui-date-picker__headline-label">
          {{ headlineLabel }}
        </p>

        <p
          class="ui-date-picker__headline-date"
          :class="{ 'ui-date-picker__headline-date--placeholder': !modelValue }"
        >
          {{ selectedLabel }}
        </p>
      </div>

      <div class="ui-date-picker__controls">
        <div class="ui-date-picker__month-selector">
          <button
            type="button"
            class="ui-date-picker__view-toggle"
            @click="toggleView"
          >
            {{ currentMonthYearLabel }}
            <ui-icon
              :name="view === 'calendar' ? 'baseline-arrow-drop-down' : 'baseline-arrow-drop-up'"
              class="ui-date-picker__view-toggle-icon"
            />
          </button>

          <div
            v-if="view === 'calendar'"
            class="ui-date-picker__month-arrows"
          >
            <button
              type="button"
              class="ui-date-picker__icon-button"
              aria-label="Previous month"
              @click="goToPreviousMonth"
            >
              <ui-icon name="baseline-chevron-left" />
            </button>

            <button
              type="button"
              class="ui-date-picker__icon-button"
              aria-label="Next month"
              @click="goToNextMonth"
            >
              <ui-icon name="baseline-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="ui-date-picker__content">
      <transition
        name="ui-date-picker-fade"
        mode="out-in"
      >
        <!-- Calendar View -->
        <div
          v-if="view === 'calendar'"
          key="calendar"
          class="ui-date-picker__calendar"
        >
          <div class="ui-date-picker__weekdays">
            <span
              v-for="weekday in weekdayLabels"
              :key="weekday"
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
              }"
              :aria-label="day.ariaLabel"
              @click="onSelect(day.date)"
            >
              <span class="ui-date-picker__day-state" />
              <span class="ui-date-picker__day-label">
                {{ day.label }}
              </span>
            </button>
          </div>
        </div>

        <!-- Year View -->
        <div
          v-else
          key="year"
          ref="yearGrid"
          class="ui-date-picker__year-grid"
        >
          <button
            v-for="year in years"
            :key="year"
            type="button"
            class="ui-date-picker__year"
            :class="{
              'ui-date-picker__year--selected': year === displayDate.year(),
              'ui-date-picker__year--current': year === today.year(),
            }"
            @click="onSelectYear(year)"
          >
            <span class="ui-date-picker__year-label">
              {{ year }}
            </span>
          </button>
        </div>
      </transition>
    </div>

    <footer class="ui-date-picker__footer">
      <ui-button
        variant="text"
        @click="$emit('cancel')"
      >
        Cancel
      </ui-button>
      <ui-button
        variant="text"
        @click="confirm"
      >
        OK
      </ui-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/ru' // Example, could be dynamic

type ViewMode = 'calendar' | 'year'

interface Props {
  headline?: string
  minDate?: Date | string | number
  maxDate?: Date | string | number
}

const props = withDefaults(defineProps<Props>(), {
  headline: 'Select date',
  minDate: undefined,
  maxDate: undefined,
})

const emit = defineEmits(['update:modelValue', 'cancel', 'confirm'])

const modelValue = defineModel<Date | string | number | null>({ default: null })

const view = ref<ViewMode>('calendar')
const today = dayjs()
const displayDate = ref(modelValue.value ? dayjs(modelValue.value) : dayjs())

const yearGrid = ref<HTMLElement | null>(null)

// Labels
const headlineLabel = computed(() => props.headline)
const selectedLabel = computed(() => {
  if (!modelValue.value) return 'Select date'
  return dayjs(modelValue.value).format('ddd, MMM D')
})

const currentMonthYearLabel = computed(() => {
  return displayDate.value.format('MMMM YYYY')
})

const weekdayLabels = computed(() => {
  const weekdays = []
  // Start from Sunday (0) or Monday (1) depending on locale
  // Here we use Sunday as 0 for simplicity or dynamic shift
  for (let i = 0; i < 7; i++) {
    weekdays.push(dayjs().day(i).format('dd').charAt(0))
  }
  return weekdays
})

// Calendar Logic
interface DayCell {
  key: string
  date: dayjs.Dayjs
  label: number
  inCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  ariaLabel: string
}

const days = computed<DayCell[]>(() => {
  const startOfMonth = displayDate.value.startOf('month')
  const endOfMonth = displayDate.value.endOf('month')

  const startOfWeek = startOfMonth.startOf('week')
  const endOfWeek = endOfMonth.endOf('week')

  const result: DayCell[] = []
  let current = startOfWeek

  while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
    result.push({
      key: current.format('YYYY-MM-DD'),
      date: current,
      label: current.date(),
      inCurrentMonth: current.month() === displayDate.value.month(),
      isToday: current.isSame(today, 'day'),
      isSelected: modelValue.value ? current.isSame(dayjs(modelValue.value), 'day') : false,
      ariaLabel: current.format('MMMM D, YYYY'),
    })
    current = current.add(1, 'day')
  }

  return result
})

// Year View Logic
const years = computed(() => {
  const currentYear = today.year()
  const start = currentYear - 100
  const end = currentYear + 100
  const result = []
  for (let i = start; i <= end; i++) {
    result.push(i)
  }
  return result
})

// Methods
function toggleView() {
  view.value = view.value === 'calendar' ? 'year' : 'calendar'
  if (view.value === 'year') {
    nextTick(() => {
      const selectedYear = yearGrid.value?.querySelector('.ui-date-picker__year--selected')
      selectedYear?.scrollIntoView({ block: 'center' })
    })
  }
}

function goToPreviousMonth() {
  displayDate.value = displayDate.value.subtract(1, 'month')
}

function goToNextMonth() {
  displayDate.value = displayDate.value.add(1, 'month')
}

function onSelect(date: dayjs.Dayjs) {
  modelValue.value = date.toDate()
}

function onSelectYear(year: number) {
  displayDate.value = displayDate.value.year(year)
  view.value = 'calendar'
}

function confirm() {
  emit('confirm', modelValue.value)
}

watch(modelValue, (next) => {
  if (next) {
    displayDate.value = dayjs(next)
  }
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/date-picker' as v;

.ui-date-picker {
  display: flex;
  flex-direction: column;
  width: v.$width;
  background-color: v.$bg-color;
  border-radius: v.$border-radius;
  overflow: hidden;
  box-shadow: v.$shadow;

  &__header {
    padding: v.$header-padding;
    background-color: transparent;
  }

  &__headline {
    margin-bottom: 20rem;
  }

  &__headline-label {
    margin: 0;

    @include typescale(v.$headline-label-type);

    color: v.$headline-label-color;
  }

  &__headline-date {
    margin: 0;

    @include typescale(v.$headline-date-type);

    color: v.$headline-date-color;

    &--placeholder {
      color: v.$headline-date-placeholder-color;
      opacity: 0.7;
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__month-selector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  &__view-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8rem;
    padding: 8rem 4rem;
    border: none;
    background: none;
    cursor: pointer;
    color: v.$view-toggle-color;

    @include typescale(v.$view-toggle-type);

    border-radius: 999rem;
    transition: background-color 0.2s;

    &:hover {
      background-color: v.$view-toggle-hover-bg;
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
    width: v.$icon-button-size;
    height: v.$icon-button-size;
    border-radius: 50%;
    border: none;
    background: none;
    color: v.$icon-button-color;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: color-mix(in srgb, v.$icon-button-color 8%, transparent);
    }
  }

  &__content {
    padding: 0 12rem;
    min-height: 280rem;
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
    height: v.$weekday-height;
    display: flex;
    align-items: center;
    justify-content: center;

    @include typescale(v.$weekday-type);

    color: v.$weekday-color;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    row-gap: 4rem;
  }

  &__day {
    position: relative;
    height: v.$day-size;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    &-state {
      position: absolute;
      width: v.$day-size;
      height: v.$day-size;
      border-radius: 50%;
      background-color: transparent;
      transition: background-color 0.2s, transform 0.2s;
    }

    &-label {
      position: relative;

      @include typescale(v.$day-label-type);

      color: v.$day-label-color;
      z-index: 1;
    }

    &:hover {
      &-state {
        background-color: v.$day-hover-bg;
      }
    }
  }

  &__day--outside {
    opacity: v.$disabled-opacity;
  }

  &__day--today &__day-label {
    color: v.$day-today-color;
    font-weight: bold;
    box-shadow: inset 0 0 0 1rem v.$day-today-color;
    border-radius: 50%;
    width: 32rem;
    height: 32rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__day--selected &__day-state {
    background-color: v.$day-selected-bg;
    transform: scale(1);
  }

  &__day--selected:hover &__day-state {
    background-color: color-mix(in srgb, var(--color-on-primary) 8%, v.$day-selected-bg);
  }

  &__day--selected &__day-label {
    color: v.$day-selected-color;
  }

  &__year-grid {
    height: v.$year-grid-height;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 8rem;
    gap: 8rem;

    &::-webkit-scrollbar {
      width: 4rem;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-outline-variant);
      border-radius: 4rem;
    }
  }

  &__year {
    height: v.$year-height;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 999rem;
    display: flex;
    align-items: center;
    justify-content: center;

    @include typescale(v.$year-type);

    color: v.$year-color;
    transition: background-color 0.2s;

    &:hover {
      background-color: v.$year-hover-bg;
    }

    &--selected {
      background-color: v.$year-selected-bg !important;
      color: v.$year-selected-color !important;
    }

    &--current {
      color: v.$year-current-color;
      font-weight: bold;
    }
  }

  &__footer {
    padding: v.$footer-padding;
    display: flex;
    justify-content: flex-end;
    gap: v.$footer-gap;
  }
}

.ui-date-picker-fade-enter-active,
.ui-date-picker-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.ui-date-picker-fade-enter-from,
.ui-date-picker-fade-leave-to {
  opacity: 0;
  transform: translateY(4rem);
}
</style>
