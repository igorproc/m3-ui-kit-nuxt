<template>
  <section class="fixture-stress">
    <h1>MDatePicker — stress content</h1>

    <div class="fixture-stress__narrow">
      <MDatePicker
        v-model="narrow"
        label="Choose the first working day of the next reporting period"
        data-test="narrow"
      />
    </div>

    <MDatePicker
      v-model="russian"
      locale="ru-RU"
      label="Выберите дату"
      data-test="russian"
    />

    <MDatePicker
      v-model="arabic"
      locale="ar-EG"
      label="اختر التاريخ"
      data-test="arabic"
    />

    <MDatePicker
      v-model="wide"
      :min-date="new Date(1900, 0, 1)"
      :max-date="new Date(2100, 11, 31)"
      data-test="century"
    />

    <!-- Contradictory bounds (a dev warning) and an unreadable model: the
         picker still draws, with nothing chosen. -->
    <MDatePicker
      v-model="unreadable"
      :min-date="new Date(2026, 9, 20)"
      :max-date="new Date(2026, 9, 10)"
      data-test="broken-input"
    />

    <!-- February 2026 fits in four weeks, May 2026 needs six: the grid keeps
         six rows either way, so paging never moves what is under it. -->
    <MDatePicker
      v-model="shortMonth"
      data-test="short-month"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MDatePicker from '#kit/components/ui/date-picker/index.vue'

const narrow = ref<Date | null>(new Date(2026, 8, 30))
const russian = ref<Date | null>(new Date(2026, 8, 14))
const arabic = ref<Date | null>(new Date(2026, 9, 14))
const wide = ref<Date | null>(new Date(2026, 9, 14))
const unreadable = ref<string | null>('not a date')
const shortMonth = ref<Date | null>(new Date(2026, 1, 1))
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 24rem;

  &__narrow {
    width: min(280rem, 100%);
  }
}
</style>
