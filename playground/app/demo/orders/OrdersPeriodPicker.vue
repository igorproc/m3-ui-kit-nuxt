<template>
  <div
    class="orders-period"
    role="group"
    aria-labelledby="orders-period-label"
  >
    <span
      id="orders-period-label"
      class="orders-period__label"
    >Период</span>

    <MButton
      variant="outlined"
      density="compact"
      @click="fromOpen = true"
    >
      <template #prepend>
        <MIcon name="ic:outline-event" />
      </template>
      <span class="orders-period__hidden">Начало периода:</span>
      {{ formatShortDay(from) }}
    </MButton>

    <span
      class="orders-period__dash"
      aria-hidden="true"
    >–</span>

    <MButton
      variant="outlined"
      density="compact"
      @click="toOpen = true"
    >
      <template #prepend>
        <MIcon name="ic:outline-event" />
      </template>
      <span class="orders-period__hidden">Конец периода:</span>
      {{ formatShortDay(to) }}
    </MButton>

    <MDialogDate
      v-model="fromOpen"
      v-model:date="from"
      label="Начало периода"
      input-title="Введите дату начала"
      locale="ru-RU"
      :min-date="earliest"
      :max-date="to"
      cancel-label="Отмена"
      confirm-label="Готово"
    />

    <MDialogDate
      v-model="toOpen"
      v-model:date="to"
      label="Конец периода"
      input-title="Введите дату окончания"
      locale="ru-RU"
      :min-date="from"
      :max-date="latest"
      cancel-label="Отмена"
      confirm-label="Готово"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { formatShortDay } from './data/format'

defineProps<{
  /** Earliest and latest days the data covers. */
  earliest: string
  latest: string
}>()

// The filters keep day keys (`YYYY-MM-DD`); the date dialog writes a day key
// back into a model that holds one, so they are bound directly.
const from = defineModel<string>('from', { required: true })
const to = defineModel<string>('to', { required: true })

const fromOpen = ref(false)
const toOpen = ref(false)
</script>

<style lang="scss">
.orders-period {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: spacing(8);

  &__label {
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('label-large');
  }

  &__dash {
    color: var(--md-sys-color-on-surface-variant);
  }

  &__hidden {
    @include sr-only;
  }
}
</style>
