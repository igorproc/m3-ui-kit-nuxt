<template>
  <div
    class="ui-time-picker__display"
    role="radiogroup"
  >
    <button
      v-bind="control.getSelectorAttrs('hours')"
      class="ui-time-picker__selector"
      :class="{ 'ui-time-picker__selector--selected': control.field.value === 'hours' }"
    >
      {{ control.display.value.hours }}
    </button>

    <span
      class="ui-time-picker__separator"
      aria-hidden="true"
    >:</span>

    <button
      v-bind="control.getSelectorAttrs('minutes')"
      class="ui-time-picker__selector"
      :class="{ 'ui-time-picker__selector--selected': control.field.value === 'minutes' }"
    >
      {{ control.display.value.minutes }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * The time over the dial: two selectors that choose what the dial turns, as
 * a radio group. Typing belongs to the input mode.
 */
import type { TimePickerControl } from '#kit/composables/time/useTimePickerControl'

defineProps<{ control: TimePickerControl }>()
</script>
