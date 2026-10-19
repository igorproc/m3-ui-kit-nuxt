<template>
  <div
    v-bind="control.rootAttrs.value"
    class="ui-time-picker"
    :class="[
      `ui-time-picker--${layout}`,
      `ui-time-picker--${mode}`,
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
        v-if="mode === 'picker'"
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
        v-if="mode === 'picker'"
        :dial="dial"
        :view="control.view.value"
        :ring="clock.ring"
      />

      <PickerSupport
        v-if="supportShown"
        class="ui-time-picker__support"
        :helper-id="helperId"
        :error-id="fields.errorId"
        :helper-text="helperText"
        :error="hasError"
        :error-text="fields.errorText.value"
      >
        <template
          v-if="$slots.helper"
          #helper
        >
          <slot name="helper" />
        </template>
      </PickerSupport>

      <div
        v-if="modeToggle"
        class="ui-time-picker__actions"
      >
        <MButtonIcon
          type="button"
          :aria-label="mode === 'picker' ? switchToInputLabel : switchToPickerLabel"
          :disabled="disabled"
          @click="toggleMode"
        >
          <MIcon :name="mode === 'picker' ? ICONS.keyboard : ICONS.schedule" />
        </MButtonIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import PickerSupport from '#kit/components/fragments/picker-support/index.vue'
import TimePickerDial from '#kit/components/fragments/time-picker/dial/index.vue'
import TimePickerFields from '#kit/components/fragments/time-picker/fields/index.vue'
import TimePickerPeriod from '#kit/components/fragments/time-picker/period/index.vue'
import TimePickerSelectors from '#kit/components/fragments/time-picker/selectors/index.vue'
import { useTimeDialControl } from '#kit/composables/time/useTimeDialControl'
import { useTimeFieldsControl } from '#kit/composables/time/useTimeFieldsControl'
import { useTimePickerControl } from '#kit/composables/time/useTimePickerControl'
import { ICONS } from '#kit/shared/constants/icons'
import { createClock } from '#kit/utils/time/createClock'
import { mTimePickerProps } from './props'
import type { MTimePickerMode } from './props'

const props = defineProps(mTimePickerProps)

/** `HH:mm`, 24-hour, or `''`. */
const modelValue = defineModel<string>({ default: '' })
/** `'picker'` turns a dial; `'input'` types the time. */
const mode = defineModel<MTimePickerMode>('mode', { default: 'picker' })

const slots = defineSlots<{
  /** The headline. Content only: the element names the group. */
  label?: () => unknown
  helper?: () => unknown
}>()

if (import.meta.dev) {
  watchEffect(() => {
    if (props.modeToggle && !(props.switchToInputLabel && props.switchToPickerLabel)) {
      console.warn('[m-time-picker] `mode-toggle` needs `switch-to-input-label` and `switch-to-picker-label`: the kit ships no words for the switch.')
    }
  })
}

const clock = computed(() => createClock(props.locale, props.hourCycle))
const periodLabels = computed(() => ({
  am: props.amLabel ?? clock.value.periods.am,
  pm: props.pmLabel ?? clock.value.periods.pm,
}))

const headlineId = useId()
const helperId = useId()
const labels = () => ({ hour: props.hourLabel, minute: props.minuteLabel, period: props.periodLabel })
const state = { disabled: () => props.disabled, readonly: () => props.readonly }
const hasHelper = () => Boolean(props.helperText || slots.helper)

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
  // The error takes the helper's place, so the helper describes only while it shows.
  describedBy: () => hasHelper() && !hasError.value ? helperId : undefined,
})

const hasError = computed(() => props.error || Boolean(fields.errorText.value))

// Typed fields can be refused at any moment, and a form control can be told
// it is wrong: either way the support line is kept, so an error never moves
// what is under the picker.
const supportShown = computed(() => mode.value === 'input' || hasHelper() || props.error || Boolean(props.errorMessage) || props.required || Boolean(props.name))

function toggleMode() {
  mode.value = mode.value === 'picker' ? 'input' : 'picker'
}

/**
 * Reads a typed time that has not been committed yet. `false` when it is
 * refused, or when a required picker is empty.
 */
function validate(): boolean {
  if (mode.value === 'input') return fields.validate()
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
      'support support'
      'actions actions';

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
      'support'
      'actions';
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
  }

  // The mode switch stands at the start of the row under the picker, as in
  // the M3 dialog's action row.
  &__actions {
    display: flex;
    grid-area: actions;
    justify-self: start;
    margin-block-start: g($t, 'actions.gap');
  }

  // Side by side only when both columns fit.
  @container ui-time-picker (min-width: #{g($t, 'layout.fold')}) {
    &--horizontal#{&}--picker &__body {
      grid-template:
        'headline headline' auto
        'display dial' auto
        'period dial' auto
        'support dial' 1fr
        'actions actions' auto / minmax(0, max-content) auto;
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

  // The numbers cross-fade between hours and minutes, both faces at once (as
  // Compose's Crossfade): the dial is never empty. Reduced motion is
  // shortened globally.
  .ui-time-picker-face-enter-active,
  .ui-time-picker-face-leave-active {
    transition: opacity g($t, 'motion.duration') g($t, 'motion.easing');
  }

  .ui-time-picker-face-enter-from,
  .ui-time-picker-face-leave-to {
    opacity: 0;
  }

  @include forced-colors {
    border: 1px solid CanvasText;
  }
}
</style>
