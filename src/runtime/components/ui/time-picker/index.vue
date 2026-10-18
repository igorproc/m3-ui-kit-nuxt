<template>
  <div
    v-bind="control.rootAttrs.value"
    class="ui-time-picker"
    :class="[
      `ui-time-picker--${layout}`,
      `ui-time-picker--${currentMode}`,
      `ui-time-picker--${clock.cycle}`,
      {
        'ui-time-picker--disabled': disabled,
        'ui-time-picker--readonly': readonly,
      },
    ]"
  >
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :value="modelValue"
      :disabled="disabled || undefined"
    >

    <div class="ui-time-picker__body">
      <p
        v-if="label || $slots.label"
        :id="headlineId"
        class="ui-time-picker__headline"
      >
        <slot name="label">
          {{ label }}
        </slot>
      </p>

      <TimePickerSelectors
        v-if="currentMode === 'picker'"
        :control="control"
      />
      <TimePickerFields
        v-else
        :fields="fields"
        :hour-label="hourLabel"
        :minute-label="minuteLabel"
        :error="error"
      />

      <TimePickerPeriod
        v-if="clock.cycle === 'h12'"
        :control="control"
        :labels="periodLabels"
      />

      <TimePickerDial
        v-if="currentMode === 'picker'"
        :dial="dial"
        :view="control.view.value"
        :ring="clock.ring"
      />

      <div class="ui-time-picker__support">
        <p
          v-if="helperText || $slots.helper"
          :id="helperId"
          class="ui-time-picker__helper"
        >
          <slot name="helper">
            {{ helperText }}
          </slot>
        </p>
        <p
          :id="fields.errorId"
          class="ui-time-picker__error"
          role="alert"
        >
          {{ fields.errorText.value }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TimePickerDial from '#kit/components/fragments/time-picker/dial/index.vue'
import TimePickerFields from '#kit/components/fragments/time-picker/fields/index.vue'
import TimePickerPeriod from '#kit/components/fragments/time-picker/period/index.vue'
import TimePickerSelectors from '#kit/components/fragments/time-picker/selectors/index.vue'
import { useRetiredPropWarning, useRetiredValueWarning } from '#kit/composables/button/useRetiredValueWarning'
import { createClock } from '#kit/composables/time/createClock'
import { useTimeDialControl } from '#kit/composables/time/useTimeDialControl'
import { useTimeFieldsControl } from '#kit/composables/time/useTimeFieldsControl'
import { useTimePickerControl } from '#kit/composables/time/useTimePickerControl'
import { RETIRED_TIME_PICKER_MODES, mTimePickerProps } from './props'
import type { MTimePickerMode } from './props'

const props = defineProps(mTimePickerProps)

/** `HH:mm`, 24-hour, or `''`. */
const modelValue = defineModel<string>({ default: '' })
/** `'picker'` turns a dial; `'input'` types the time. */
const mode = defineModel<MTimePickerMode>('mode', { default: 'picker' })

defineSlots<{
  /** The headline. Content only: the element names the group. */
  label?: () => unknown
  helper?: () => unknown
}>()

useRetiredValueWarning('m-time-picker', 'mode', () => mode.value, { dial: '`\'picker\'`', keyboard: '`\'input\'`' })
useRetiredPropWarning('m-time-picker', 'is24h', () => props.is24h, '`hour-cycle` (`\'h23\'` or `\'h12\'`)')

const currentMode = computed(() => RETIRED_TIME_PICKER_MODES[mode.value] ?? mode.value)
const hourCycle = computed(() => props.is24h === undefined ? props.hourCycle : (props.is24h ? 'h23' : 'h12'))
const clock = computed(() => createClock(props.locale, hourCycle.value))
const periodLabels = computed(() => ({
  am: props.amLabel ?? clock.value.periods.am,
  pm: props.pmLabel ?? clock.value.periods.pm,
}))

const headlineId = useId()
const helperId = useId()
const slots = useSlots()
const labels = () => ({ hour: props.hourLabel, minute: props.minuteLabel, period: props.periodLabel })
const state = { disabled: () => props.disabled, readonly: () => props.readonly }

const control = useTimePickerControl({
  model: modelValue,
  clock,
  ...state,
  labels,
  labelledBy: () => props.label || slots.label ? headlineId : undefined,
  label: () => props.ariaLabel,
})

const dial = useTimeDialControl({ clock, control, ...state, labels })

const fields = useTimeFieldsControl({
  clock,
  control,
  ...state,
  required: () => props.required,
  labels: () => ({ hourError: props.hourError, minuteError: props.minuteError }),
  externalError: () => props.error ? props.errorMessage : undefined,
  describedBy: () => props.helperText || slots.helper ? helperId : undefined,
})

/**
 * Reads a typed time that has not been committed yet. `false` when it is
 * refused, or when a required picker is empty.
 */
function validate(): boolean {
  if (currentMode.value === 'input') return fields.validate()
  return !(props.required && !control.time.value)
}

defineExpose({ validate })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/time-picker' as t;
@use '#kit/assets/stylesheet/components/time-picker/parts' as parts;

.ui-time-picker {
  $t: material-map(t.$tokens, 'm-time-picker');
  $padding: g($t, 'container.padding');
  $period-column: calc(#{g($t, 'period.offset.vertical')} + #{g($t, 'period.vertical.width')});

  // As wide as its content, narrower when the column is: the width comes
  // from outside, so the picker can fold by its own container query.
  container: ui-time-picker / inline-size;
  box-sizing: border-box;
  width: 100%;
  max-width: calc(#{g($t, 'selector.width')} * 2 + #{g($t, 'separator.width')} + #{$period-column} + #{$padding} * 2);
  padding: $padding;
  border-radius: g($t, 'container.shape');
  background-color: g($t, 'container.color');

  // A 24-hour clock has no period, so no column is kept for it: the picker
  // is as wide as its dial (or its fields) and the time sits centred over the
  // dial, as in Compose's 24-hour TimePicker.
  &--h23#{&}--picker {
    max-width: calc(#{g($t, 'dial.size')} + #{$padding} * 2);
  }

  &--h23#{&}--input {
    max-width: calc(#{g($t, 'field.width')} * 2 + #{g($t, 'separator.width')} + #{$padding} * 2);
  }

  &--horizontal#{&}--picker {
    max-width: calc(#{g($t, 'layout.fold')} + #{$padding} * 2);
  }

  &__body {
    display: grid;
    grid-template-areas:
      'headline headline'
      'display period'
      'dial dial'
      'support support';

    // The period column is as wide as the period and never more: a long
    // headline spanning both columns would otherwise widen it and squeeze the
    // time beside it.
    grid-template-columns: minmax(0, max-content) fit-content(#{$period-column});
    place-items: start center;
    justify-content: center;
  }

  // One column as wide as the body: the dial takes its 256 (or less in a
  // narrow column) and the time centres over it.
  &--h23 &__body {
    grid-template-areas:
      'headline'
      'display'
      'dial'
      'support';
    grid-template-columns: minmax(0, 1fr);
  }

  &__headline {
    grid-area: headline;
    justify-self: start;
    margin: 0 0 g($t, 'headline.gap');
    color: g($t, 'headline.color');

    @include typescale(g($t, 'headline.typography'));
  }

  @include parts.display($t);
  @include parts.period($t);
  @include parts.dial($t);

  &__support {
    grid-area: support;
    justify-self: stretch;
    color: g($t, 'support.color');

    @include typescale(g($t, 'support.typography'));
  }

  &__helper,
  &__error {
    margin: g($t, 'support.gap') 0 0;
  }

  &__error {
    color: g($t, 'support.error');

    &:empty {
      display: none;
    }
  }

  // Side by side only when both columns fit.
  @container ui-time-picker (min-width: #{g($t, 'layout.fold')}) {
    &--horizontal#{&}--picker &__body {
      grid-template:
        'headline headline' auto
        'display dial' auto
        'period dial' auto
        'support dial' 1fr / minmax(0, max-content) auto;
    }

    &--horizontal#{&}--picker &__period {
      flex-direction: row;
      width: g($t, 'period.horizontal.width');
      height: g($t, 'period.horizontal.height');
      margin-block-start: g($t, 'period.offset.horizontal');
      margin-inline-start: 0;
    }

    // Side by side the column is sized by the dial, so the dial takes its
    // full size rather than a percentage of a column that waits for it.
    &--horizontal#{&}--picker &__dial {
      width: g($t, 'dial.size');
      margin-block-start: 0;
      margin-inline-start: g($t, 'layout.gap');
    }
  }

  &--disabled &__body {
    opacity: g($t, 'disabled.opacity');
  }

  &--disabled &__selector,
  &--disabled &__dial,
  &--readonly &__dial,
  &--disabled &__period-option,
  &--readonly &__period-option {
    cursor: default;

    &::before {
      display: none;
    }
  }

  @include forced-colors {
    border: 1px solid CanvasText;
  }
}

// The numbers cross-fade between hours and minutes on the motion tokens;
// reduced motion is shortened globally.
.ui-time-picker-face-enter-active,
.ui-time-picker-face-leave-active {
  transition: opacity var(--sys-motion-duration-short-4) var(--sys-motion-easing-standard);
}

.ui-time-picker-face-enter-from,
.ui-time-picker-face-leave-to {
  opacity: 0;
}
</style>
