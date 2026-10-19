<template>
  <div class="ui-date-picker__input">
    <MTextField
      v-model="text"
      variant="outlined"
      inputmode="numeric"
      autocomplete="off"
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      v-bind="fieldError()"
      @blur="commit"
      @keydown.enter="commit"
      @update:model-value="error = undefined"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * The typed date of `<MDatePicker>`. A date is read on blur and on Enter, not
 * on every keystroke: half a date is a draft, not an error. Typing only clears
 * a previous error. Any separator goes, in the locale's part order.
 */
import MTextField from '#kit/components/ui/text-field/index.vue'
import type { Calendar, CalendarBounds } from '#kit/utils/date/createCalendar'

const props = defineProps<{
  calendar: Calendar
  value: Date | null
  bounds: CalendarBounds
  label: string
  placeholder: string
  errorPattern: string
  errorRange: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** The picker's own error state (set by the app), shown on the field's edge. */
  invalid?: boolean
}>()

const emit = defineEmits<{ (e: 'commit', date: Date | null): void }>()

const format = (date: Date | null) => date ? props.calendar.numeric(date) : ''
const text = ref(format(props.value))
const error = ref<string>()

// The field reserves its support line only when there is an error to show
// (decision 2026-10-19): the picker's own, or a typed date just refused.
const fieldError = () => (props.invalid || error.value
  ? { error: props.invalid, errorMessage: error.value }
  : {})

watch(() => [props.value, props.calendar] as const, ([value]) => {
  text.value = format(value)
})

/** Reads the typed text; `false` when it is refused and the error is shown. */
function commit(): boolean {
  if (props.disabled || props.readonly) return true
  if (!text.value.trim()) {
    emit('commit', null)
    return true
  }

  const date = props.calendar.parse(text.value)
  if (!date) {
    error.value = props.errorPattern
    return false
  }
  if (props.calendar.isOutside(date, props.bounds)) {
    error.value = props.errorRange
    return false
  }

  emit('commit', date)
  text.value = format(date)
  return true
}

defineExpose({ commit })
</script>
