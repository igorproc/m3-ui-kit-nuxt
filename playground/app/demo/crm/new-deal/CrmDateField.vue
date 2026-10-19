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
      v-model:date="model"
      :label="label"
      input-title="Введите дату"
      locale="ru-RU"
      :min-date="min"
      cancel-label="Отмена"
      confirm-label="Готово"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatLongDate } from '../data/crmFormat'

defineProps<{
  label: string
  helperText?: string
  /** ISO date before which nothing can be picked. */
  min?: string
}>()

/** ISO date (`YYYY-MM-DD`) or `null` — the date dialog writes it back in the same form. */
const model = defineModel<string | null>({ default: null })
const open = ref(false)

const text = computed(() => (model.value ? formatLongDate(model.value) : ''))
</script>

<style lang="scss">
.crm-date-field {
  min-width: 0;
}
</style>
