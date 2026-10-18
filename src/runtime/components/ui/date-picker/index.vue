<template>
  <div
    class="ui-date-picker"
    :class="{
      'ui-date-picker--hosted': hosted,
      'ui-date-picker--disabled': disabled,
      'ui-date-picker--readonly': readonly,
    }"
    role="group"
    :aria-labelledby="titleId"
  >
    <header class="ui-date-picker__header">
      <p
        :id="titleId"
        class="ui-date-picker__title"
      >
        <slot name="label">
          {{ title }}
        </slot>
      </p>

      <div class="ui-date-picker__headline-row">
        <p class="ui-date-picker__headline">
          <slot
            name="headline"
            :date="selected"
          >
            {{ headlineText }}
          </slot>
        </p>

        <MButtonIcon
          v-if="modeToggle"
          type="button"
          class="ui-date-picker__mode"
          :aria-label="mode === 'picker' ? switchToInputLabel : switchToCalendarLabel"
          :disabled="disabled"
          @click="toggleMode"
        >
          <MIcon :name="mode === 'picker' ? ICONS.edit : ICONS.calendarToday" />
        </MButtonIcon>
      </div>
    </header>

    <div
      class="ui-date-picker__divider"
      aria-hidden="true"
    />

    <template v-if="mode === 'picker'">
      <DatePickerHeaderNav
        :month-label="calendar.monthYear(month)"
        :month-label-id="monthLabelId"
        :years-id="yearsId"
        :view="view"
        :can-go-prev="canGoPrev"
        :can-go-next="canGoNext"
        :disabled="disabled"
        :prev-label="prevMonthLabel"
        :next-label="nextMonthLabel"
        :switch-to-year-label="switchToYearLabel"
        :switch-to-day-label="switchToDayLabel"
        @toggle="toggleView"
        @prev="prevMonth"
        @next="nextMonth"
      />

      <div class="ui-date-picker__content">
        <Transition
          name="ui-date-picker-view"
          mode="out-in"
          @after-enter="onViewEntered"
        >
          <DatePickerDayGrid
            v-if="view === 'calendar'"
            key="calendar"
            :weekdays="calendar.weekdays()"
            :weeks="grid.weeks.value"
            :grid-attrs="grid.gridAttrs.value"
            :get-cell-attrs="grid.getCellAttrs"
          >
            <template
              v-if="$slots.day"
              #day="{ day }"
            >
              <slot
                name="day"
                :day="day"
              />
            </template>
          </DatePickerDayGrid>

          <DatePickerYearGrid
            v-else
            :id="yearsId"
            key="year"
            ref="yearGrid"
            :years="years"
            :shown-year="month.getFullYear()"
            :selected-year="selected?.getFullYear()"
            :current-year="today?.getFullYear()"
            :calendar="calendar"
            :disabled="disabled"
            :labelled-by="monthLabelId"
            @select="onSelectYear"
          >
            <template
              v-if="$slots.year"
              #year="{ year }"
            >
              <slot
                name="year"
                :year="year"
              />
            </template>
          </DatePickerYearGrid>
        </Transition>
      </div>
    </template>

    <DatePickerInput
      v-else
      ref="typed"
      :calendar="calendar"
      :value="selected"
      :bounds="bounds"
      :label="inputLabel"
      :placeholder="placeholder ?? pattern"
      :error-pattern="errorPattern"
      :error-range="errorRange"
      :disabled="disabled"
      :readonly="readonly"
      @commit="onTyped"
    />

    <div
      v-if="$slots.actions"
      class="ui-date-picker__actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import DatePickerHeaderNav from '#kit/components/fragments/date-picker/header-nav/index.vue'
import DatePickerDayGrid from '#kit/components/fragments/date-picker/day-grid/index.vue'
import DatePickerYearGrid from '#kit/components/fragments/date-picker/year-grid/index.vue'
import DatePickerInput from '#kit/components/fragments/date-picker/input/index.vue'
import { useRetiredPropWarning } from '#kit/composables/button/useRetiredValueWarning'
import { useDatePicker } from '#kit/composables/date'
import type { DatePickerValue } from '#kit/composables/date'
import { useDateGridControl } from '#kit/composables/date/useDateGridControl'
import type { DateGridCell } from '#kit/composables/date/useDateGridControl'
import { ICONS } from '#kit/shared/constants/icons'
import { MESSAGES } from '#kit/shared/constants/messages'
import { useDatePickerHosted } from './context'
import { mDatePickerProps } from './props'
import type { MDatePickerMode } from './props'

const props = defineProps(mDatePickerProps)

const modelValue = defineModel<DatePickerValue | null>({ default: null })
const mode = defineModel<MDatePickerMode>('mode', { default: 'picker' })

defineSlots<{
  /** The title — "Select date" by default. Content only: the element names the group. */
  label?: () => unknown
  /** The chosen date as the headline. */
  headline?: (props: { date: Date | null }) => unknown
  /** The content of one day cell (a dot under a busy day, for one). */
  day?: (props: { day: DateGridCell }) => unknown
  year?: (props: { year: number }) => unknown
  /** Actions under the picker. Choosing a day commits at once; confirming belongs to a dialog. */
  actions?: () => unknown
}>()

useRetiredPropWarning('m-date-picker', 'headline', () => props.headline, '`label` — the headline is the chosen date')

const hosted = useDatePickerHosted()
const titleId = useId()
const monthLabelId = useId()
const yearsId = useId()

const {
  calendar,
  selected,
  month,
  view,
  today,
  bounds,
  years,
  canGoPrev,
  canGoNext,
  prevMonth,
  nextMonth,
  toggleView,
  selectYear,
  select,
} = useDatePicker({
  model: modelValue,
  locale: () => props.locale,
  min: () => props.minDate,
  max: () => props.maxDate,
})

const grid = useDateGridControl({
  calendar,
  month,
  selected: () => selected.value,
  today: () => today.value,
  bounds: () => bounds.value,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  labelledBy: () => monthLabelId,
  onSelect: select,
})

const title = computed(() => props.headline ?? (mode.value === 'input' ? props.inputTitle : props.label))
const headlineText = computed(() => selected.value ? calendar.value.headline(selected.value) : '—')

const pattern = computed(() => {
  const letters = { day: MESSAGES.datePatternDay, month: MESSAGES.datePatternMonth, year: MESSAGES.datePatternYear }
  const { order, separator } = calendar.value.numericLayout()
  return order.map(part => letters[part]).join(separator)
})

function toggleMode() {
  mode.value = mode.value === 'picker' ? 'input' : 'picker'
}

function onTyped(date: Date | null) {
  if (props.disabled || props.readonly) return
  if (date) select(date)
  else modelValue.value = null
}

const typed = ref<{ commit: () => boolean } | null>(null)

/**
 * Reads a typed date that has not been committed yet. `false` when it is
 * refused — a dialog's OK stays open on it, the error showing.
 */
function validate(): boolean {
  return mode.value === 'input' && typed.value ? typed.value.commit() : true
}

defineExpose({ validate })

// Focus follows a view change the user made: into the year list when it
// opens, back onto the day after a year is picked. Done once the new view has
// entered — before that its cells do not exist yet.
const yearGrid = ref<{ focusYear: (year?: number) => void } | null>(null)
let focusOnEnter: 'year' | 'day' | null = null

function onSelectYear(year: number) {
  focusOnEnter = 'day'
  selectYear(year)
}

watch(view, (next) => {
  focusOnEnter ??= next === 'year' ? 'year' : null
})

function onViewEntered() {
  const target = focusOnEnter
  focusOnEnter = null
  if (target === 'year') yearGrid.value?.focusYear(month.value.getFullYear())
  if (target === 'day') grid.focusDate(grid.focused.value)
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/date-picker' as t;
@use '#kit/assets/stylesheet/components/date-picker/parts' as parts;

.ui-date-picker {
  $t: material-map(t.$tokens, 'm-date-picker');

  display: flex;
  flex-direction: column;
  width: g($t, 'container.width');
  max-width: 100%;
  border-radius: g($t, 'container.shape');
  background-color: g($t, 'container.color');
  color: g($t, 'day.color');

  // In a dialog the dialog is the surface.
  &--hosted {
    border-radius: 0;
    background-color: transparent;
  }

  @include parts.header($t);
  @include parts.grid($t);
  @include parts.years($t);

  &__content {
    padding-inline: g($t, 'container.padding.inline');
  }

  &__input {
    padding: g($t, 'input.padding.top') g($t, 'input.padding.inline') g($t, 'input.padding.bottom');
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: g($t, 'dialog.actions.gap');
    padding-inline-end: g($t, 'dialog.actions.padding.inline-end');
    padding-block-end: g($t, 'dialog.actions.padding.block-end');
  }

  &__sr {
    @include sr-only;
  }

  // Forcing drops the fill a card is told apart by.
  @include forced-colors {
    &:not(.ui-date-picker--hosted) {
      border: 1px solid CanvasText;
    }
  }
}

// Views swap by fading, on the motion tokens; reduced motion is shortened
// globally.
.ui-date-picker-view-enter-active,
.ui-date-picker-view-leave-active {
  transition: opacity var(--sys-motion-duration-short-4) var(--sys-motion-easing-standard);
}

.ui-date-picker-view-enter-from,
.ui-date-picker-view-leave-to {
  opacity: 0;
}
</style>
