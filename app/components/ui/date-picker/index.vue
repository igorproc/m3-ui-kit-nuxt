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
            <m-icon
              :name="view === 'calendar' ? ICONS.arrowDropDown : ICONS.arrowDropUp"
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
              <m-icon :name="ICONS.chevronLeft" />
            </button>

            <button
              type="button"
              class="ui-date-picker__icon-button"
              aria-label="Next month"
              @click="goToNextMonth"
            >
              <m-icon :name="ICONS.chevronRight" />
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
      <m-button
        variant="text"
        @click="$emit('cancel')"
      >
        Cancel
      </m-button>
      <m-button
        variant="text"
        @click="confirm"
      >
        OK
      </m-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICONS } from '~~/shared/constants/icons'
import { useDatePicker } from '~/composables/date'

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

const {
  view,
  today,
  displayDate,
  yearGrid,
  selectedLabel,
  currentMonthYearLabel,
  weekdayLabels,
  days,
  years,
  toggleView,
  goToPreviousMonth,
  goToNextMonth,
  onSelect,
  onSelectYear,
} = useDatePicker(modelValue)

const headlineLabel = computed(() => props.headline)

function confirm() {
  emit('confirm', modelValue.value)
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/date-picker/docked' as t;

.ui-date-picker {
  $prefix: 'md-date-picker';
  $t: material-map(t.$tokens, $prefix);

  display: flex;
  flex-direction: column;
  width: g($t, 'container-width');
  background-color: g($t, 'container-bg');
  border-radius: g($t, 'container-radius');
  overflow: hidden;
  box-shadow: g($t, 'container-shadow');

  &__header {
    padding: g($t, 'header-padding');
    background-color: transparent;
  }

  &__headline {
    margin-bottom: 20rem;
  }

  &__headline-label {
    margin: 0;

    @include apply-typography(g($t, 'header-headline-label-typography'));

    color: g($t, 'header-headline-label-color');
  }

  &__headline-date {
    margin: 0;

    @include apply-typography(g($t, 'header-headline-date-typography'));

    color: g($t, 'header-headline-date-color');

    &--placeholder {
      color: g($t, 'header-headline-date-placeholder-color');
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
    color: g($t, 'controls-view-toggle-color');

    @include apply-typography(g($t, 'controls-view-toggle-typography'));

    border-radius: 999rem;
    transition: background-color 0.2s;

    &:hover {
      background-color: g($t, 'controls-view-toggle-hover-bg');
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
    width: g($t, 'controls-icon-button-size');
    height: g($t, 'controls-icon-button-size');
    border-radius: 50%;
    border: none;
    background: none;
    color: g($t, 'controls-icon-button-color');
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: g($t, 'controls-icon-button-hover-bg');
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
    height: g($t, 'weekday-height');
    display: flex;
    align-items: center;
    justify-content: center;

    @include apply-typography(g($t, 'weekday-typography'));

    color: g($t, 'weekday-color');
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    row-gap: 4rem;
  }

  &__day {
    position: relative;
    height: g($t, 'day-size');
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    &-state {
      position: absolute;
      width: g($t, 'day-size');
      height: g($t, 'day-size');
      border-radius: 50%;
      background-color: transparent;
      transition: background-color 0.2s, transform 0.2s;
    }

    &-label {
      position: relative;

      @include apply-typography(g($t, 'day-typography'));

      color: g($t, 'day-color');
      z-index: 1;
    }

    &:hover {
      &-state {
        background-color: g($t, 'day-hover-bg');
      }
    }
  }

  &__day--outside {
    opacity: g($t, 'day-disabled-opacity');
  }

  &__day--today &__day-label {
    color: g($t, 'day-today-color');
    font-weight: bold;
    box-shadow: inset 0 0 0 g($t, 'day-today-outline-width') g($t, 'day-today-color');
    border-radius: 50%;
    width: 32rem;
    height: 32rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__day--selected &__day-state {
    background-color: g($t, 'day-selected-bg');
    transform: scale(1);
  }

  &__day--selected:hover &__day-state {
    background-color: g($t, 'day-selected-hover-bg');
  }

  &__day--selected &__day-label {
    color: g($t, 'day-selected-color');
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
      background: var(--color-outline-variant);
      border-radius: 4rem;
    }
  }

  &__year {
    height: g($t, 'year-height');
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 999rem;
    display: flex;
    align-items: center;
    justify-content: center;

    @include apply-typography(g($t, 'year-typography'));

    color: g($t, 'year-color');
    transition: background-color 0.2s;

    &:hover {
      background-color: g($t, 'year-hover-bg');
    }

    &--selected {
      background-color: g($t, 'year-selected-bg') !important;
      color: g($t, 'year-selected-color') !important;
    }

    &--current {
      color: g($t, 'year-current-color');
      font-weight: bold;
    }
  }

  &__footer {
    padding: g($t, 'footer-padding');
    display: flex;
    justify-content: flex-end;
    gap: g($t, 'footer-gap');
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
