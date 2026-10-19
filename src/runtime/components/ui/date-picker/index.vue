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
    :aria-describedby="describedBy"
  >
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :value="toDayString(selected)"
      :disabled="disabled || undefined"
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

    <!-- The new mode fades in; the old one leaves at once, so the two never
         stand together and the height changes in one step. -->
    <Transition
      name="ui-date-picker-fade-in"
      mode="out-in"
    >
      <div
        v-if="mode === 'picker'"
        key="picker"
        class="ui-date-picker__calendar"
      >
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
      </div>

      <DatePickerInput
        v-else
        key="input"
        ref="typed"
        :calendar="calendar"
        :value="selected"
        :bounds="bounds"
        :label="inputLabel"
        :placeholder="placeholder ?? pattern"
        :error-pattern="errorPattern"
        :error-range="errorRange"
        :invalid="error"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        @commit="onTyped"
      />
    </Transition>

    <PickerSupport
      v-if="supportShown"
      class="ui-date-picker__support"
      :helper-id="helperId"
      :error-id="errorId"
      :helper-text="helperText"
      :error="error"
      :error-text="errorMessage"
    >
      <template
        v-if="$slots.helper"
        #helper
      >
        <slot name="helper" />
      </template>
    </PickerSupport>

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
import PickerSupport from '#kit/components/fragments/picker-support/index.vue'
import { useDatePicker } from '#kit/composables/date'
import type { DatePickerValue } from '#kit/composables/date'
import { useDateGridControl } from '#kit/composables/date/useDateGridControl'
import type { DateGridCell } from '#kit/composables/date/useDateGridControl'
import { useDateViewFocus } from '#kit/composables/date/useDateViewFocus'
import { ICONS } from '#kit/shared/constants/icons'
import { MESSAGES } from '#kit/shared/constants/messages'
import { toDayString } from '#kit/utils/date/value'
import { useDatePickerHosted } from './context'
import { mDatePickerProps } from './props'
import type { MDatePickerMode } from './props'

const props = defineProps(mDatePickerProps)

const modelValue = defineModel<DatePickerValue | null>({ default: null })
const mode = defineModel<MDatePickerMode>('mode', { default: 'picker' })

const slots = defineSlots<{
  /** The title — "Select date" by default. Content only: the element names the group. */
  label?: () => unknown
  /** The chosen date as the headline. */
  headline?: (props: { date: Date | null }) => unknown
  /** The content of one day cell (a dot under a busy day, for one). */
  day?: (props: { day: DateGridCell }) => unknown
  year?: (props: { year: number }) => unknown
  /** The support line under the picker, in place of `helperText`. */
  helper?: () => unknown
  /** Actions under the picker. Choosing a day commits at once; confirming belongs to a dialog. */
  actions?: () => unknown
}>()

const hosted = useDatePickerHosted()
const titleId = useId()
const monthLabelId = useId()
const yearsId = useId()
const helperId = useId()
const errorId = useId()

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

const title = computed(() => mode.value === 'input' ? props.inputTitle : props.label)
const headlineText = computed(() => selected.value ? calendar.value.headline(selected.value) : '—')

// A picker that takes part in a form keeps its support line even while it is
// empty, so an error that arrives later never moves what is under it.
const supportShown = computed(() => Boolean(props.helperText || slots.helper || props.error || props.errorMessage || props.required || props.name))
const describedBy = computed(() => {
  if (!supportShown.value) return undefined
  return (props.error || props.errorMessage) ? errorId : (props.helperText || slots.helper ? helperId : undefined)
})

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
 * refused — a dialog's OK stays open on it, the error showing — or when a
 * required picker is empty.
 */
function validate(): boolean {
  if (mode.value === 'input' && typed.value && !typed.value.commit()) return false
  return !(props.required && !selected.value)
}

defineExpose({ validate })

const { yearGrid, onSelectYear, onViewEntered } = useDateViewFocus({ view, month, grid, selectYear })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/date-picker' as t;
@use '#kit/assets/stylesheet/components/date-picker/parts' as parts;
@use '#kit/assets/stylesheet/components/date-picker/state-layer' as *;

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

  // One state layer for the month button, the days and the years — before
  // their own rules, so a state of theirs (unavailable, disabled) wins.
  &__view-toggle,
  &__day,
  &__year {
    @include state-layer($t);
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

  &__support {
    padding-inline: g($t, 'header.padding.inline-start') g($t, 'header.padding.inline-end');
    padding-block-end: g($t, 'header.padding.bottom');
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

  // Views swap by fading; a new mode only fades in, its predecessor leaves at
  // once. Reduced motion is shortened globally.
  .ui-date-picker-view-enter-active,
  .ui-date-picker-view-leave-active,
  .ui-date-picker-fade-in-enter-active {
    transition: opacity g($t, 'motion.duration') g($t, 'motion.easing');
  }

  .ui-date-picker-view-enter-from,
  .ui-date-picker-view-leave-to,
  .ui-date-picker-fade-in-enter-from {
    opacity: 0;
  }

  // Forcing drops the fill a card is told apart by.
  @include forced-colors {
    &:not(.ui-date-picker--hosted) {
      border: 1px solid CanvasText;
    }
  }
}
</style>
