<template>
  <div
    v-bind="dial.dialAttrs.value"
    class="ui-time-picker__dial"
  >
    <span
      class="ui-time-picker__center"
      aria-hidden="true"
    />

    <span
      v-if="dial.hand.value.visible"
      class="ui-time-picker__hand"
      :class="{ 'ui-time-picker__hand--dragging': dial.hand.value.dragging }"
      aria-hidden="true"
      :style="{ height: `${dial.hand.value.length * 100}%`, transform: `rotate(${dial.hand.value.angle}deg)` }"
    >
      <span class="ui-time-picker__handle">
        <span
          v-if="dial.hand.value.between"
          class="ui-time-picker__handle-dot"
        />
      </span>
    </span>

    <!-- Numbers are what the slider's value text already says. Both faces
         stand while they cross-fade, so the dial is never empty. -->
    <Transition name="ui-time-picker-face">
      <span
        :key="view"
        class="ui-time-picker__numbers"
        aria-hidden="true"
      >
        <span
          v-for="number in dial.numbers.value"
          :key="number.value"
          class="ui-time-picker__number"
          :class="{ 'ui-time-picker__number--selected': number.selected }"
          :style="place(number)"
        >{{ number.label }}</span>
      </span>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * The clock face: one slider whose hand points at the value, the numbers
 * drawn on two rings in 24-hour hours. Behavior comes whole from
 * `useTimeDialControl`.
 */
import type { DialNumber, TimeField } from '#kit/utils/time/createClock'
import type { UseTimeDialControlReturn } from '#kit/composables/time/useTimeDialControl'

const props = defineProps<{
  dial: UseTimeDialControlReturn
  view: TimeField
  ring: { outer: number, inner: number }
}>()

/** Places a number on its ring, from 12 o'clock clockwise. */
function place(number: DialNumber) {
  const radius = (number.inner ? props.ring.inner : props.ring.outer) * 100
  const angle = (number.angle * Math.PI) / 180
  return { left: `${50 + Math.sin(angle) * radius}%`, top: `${50 - Math.cos(angle) * radius}%` }
}
</script>
