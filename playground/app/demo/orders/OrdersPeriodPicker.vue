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
      v-model:date="fromDate"
      label="Начало периода"
      input-title="Введите дату начала"
      locale="ru-RU"
      :min-date="bounds.earliest"
      :max-date="toDate"
      cancel-label="Отмена"
      confirm-label="Готово"
    />

    <MDialogDate
      v-model="toOpen"
      v-model:date="toDate"
      label="Конец периода"
      input-title="Введите дату окончания"
      locale="ru-RU"
      :min-date="fromDate"
      :max-date="bounds.latest"
      cancel-label="Отмена"
      confirm-label="Готово"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { fromPickerDate, toPickerDate } from './data/calendar'
import { formatShortDay } from './data/format'

const props = defineProps<{
  /** Earliest and latest days the data covers. */
  earliest: string
  latest: string
}>()

const from = defineModel<string>('from', { required: true })
const to = defineModel<string>('to', { required: true })

// The pickers take local `Date`s; the filters keep day keys. Bound both ways:
// MDialogDate's `confirm` payload reads the `date` model back, so a one-way
// `:date` would hand over the previous day.
const fromDate = computed({
  get: () => toPickerDate(from.value),
  set: (value: Date | string | number | null) => {
    from.value = fromPickerDate(value) ?? from.value
  },
})

const toDate = computed({
  get: () => toPickerDate(to.value),
  set: (value: Date | string | number | null) => {
    to.value = fromPickerDate(value) ?? to.value
  },
})

const bounds = computed(() => ({
  earliest: toPickerDate(props.earliest),
  latest: toPickerDate(props.latest),
}))

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
