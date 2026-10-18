<template>
  <div class="crm-date-field">
    <!-- The kit has no docked date field: a read-only text field shows the
         date and its button opens the modal picker. -->
    <MTextField
      :model-value="text"
      :label="label"
      :helper-text="helperText"
      label-placement="top"
      readonly
      @click="open = true"
    >
      <template #append>
        <MButtonIcon
          :aria-label="`${label}: выбрать в календаре`"
          @click.stop="open = true"
        >
          <MIcon name="outline-calendar-today" />
        </MButtonIcon>
      </template>
    </MTextField>

    <MDialogDate
      v-model="open"
      :date="date"
      :label="label"
      input-title="Введите дату"
      locale="ru-RU"
      :min-date="minDate"
      cancel-label="Отмена"
      confirm-label="Готово"
      @confirm="onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatLongDate, fromLocalDate, toLocalDate } from '../data/crmFormat'

const props = defineProps<{
  label: string
  helperText?: string
  /** ISO date before which nothing can be picked. */
  min?: string
}>()

/** ISO date (`YYYY-MM-DD`) or `null`. */
const model = defineModel<string | null>({ default: null })
const open = ref(false)

const text = computed(() => (model.value ? formatLongDate(model.value) : ''))
const date = computed(() => (model.value ? toLocalDate(model.value) : null))
const minDate = computed(() => (props.min ? toLocalDate(props.min) : undefined))

function onConfirm(value: Date | null) {
  model.value = value ? fromLocalDate(value) : null
}
</script>

<style lang="scss">
.crm-date-field {
  min-width: 0;
}
</style>
