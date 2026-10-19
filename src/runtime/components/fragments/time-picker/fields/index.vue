<template>
  <div class="ui-time-picker__display">
    <template
      v-for="(part, index) in PARTS"
      :key="part"
    >
      <span
        v-if="index"
        class="ui-time-picker__separator"
        aria-hidden="true"
      >:</span>

      <div
        class="ui-time-picker__field-box"
        :class="{ 'ui-time-picker__field-box--error': fields.errors[part] || error }"
      >
        <input
          v-bind="fields.getFieldAttrs(part)"
          class="ui-time-picker__field"
          :class="{ 'ui-time-picker__field--error': fields.errors[part] || error }"
        >
        <span
          :id="fields.labelId(part)"
          class="ui-time-picker__field-label"
        >{{ part === 'hours' ? hourLabel : minuteLabel }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * The typed time: an hour and a minute field, each named by the label under
 * it. Reading, checking and committing live in `useTimeFieldsControl`.
 */
import type { TimeField } from '#kit/utils/time/createClock'
import type { UseTimeFieldsControlReturn } from '#kit/composables/time/useTimeFieldsControl'

defineProps<{
  fields: UseTimeFieldsControlReturn
  hourLabel: string
  minuteLabel: string
  error?: boolean
}>()

const PARTS: TimeField[] = ['hours', 'minutes']
</script>
