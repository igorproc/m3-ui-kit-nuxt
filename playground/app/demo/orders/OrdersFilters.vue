<template>
  <section
    class="orders-filters"
    aria-labelledby="orders-filters-heading"
  >
    <h2
      id="orders-filters-heading"
      class="orders-filters__heading"
    >
      Фильтры
    </h2>

    <OrdersPeriodPicker
      v-model:from="from"
      v-model:to="to"
      :earliest="earliest"
      :latest="latest"
    />

    <div class="orders-filters__status">
      <MDropdown
        v-model="statuses"
        :messages="SELECT_MESSAGES"
        :items="STATUS_ITEMS"
        item-value="id"
        label="Статус заказа"
        placeholder="Все статусы"
        variant="outlined"
        density="compact"
        multiple
      />
    </div>

    <MChipGroup
      v-model="flags"
      class="orders-filters__chips"
      aria-label="Быстрые фильтры"
      multiple
    >
      <MChip
        v-for="flag in FLAG_ORDER"
        :key="flag"
        type="filter"
        :value="flag"
      >
        {{ FLAG_LABELS[flag] }}
      </MChip>
    </MChipGroup>

    <MButton
      v-if="filtered"
      variant="text"
      density="compact"
      @click="emit('reset')"
    >
      <template #prepend>
        <MIcon name="ic:outline-filter-alt-off" />
      </template>
      Сбросить фильтры
    </MButton>
  </section>
</template>

<script setup lang="ts">
import OrdersPeriodPicker from './OrdersPeriodPicker.vue'
import { SELECT_MESSAGES } from './data/selectMessages'
import { FLAG_LABELS, FLAG_ORDER, STATUS_META, STATUS_ORDER } from './data/model'
import type { OrderFlag, OrderStatus } from './data/model'

defineProps<{
  earliest: string
  latest: string
  /** Something differs from the defaults: offer the way back. */
  filtered: boolean
}>()

const emit = defineEmits<{
  (event: 'reset'): void
}>()

const from = defineModel<string>('from', { required: true })
const to = defineModel<string>('to', { required: true })
const statuses = defineModel<OrderStatus[]>('statuses', { required: true })
const flags = defineModel<OrderFlag[]>('flags', { required: true })

const STATUS_ITEMS = STATUS_ORDER.map(id => ({ id, label: STATUS_META[id].label }))
</script>

<style lang="scss">
.orders-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: spacing(12) spacing(16);

  &__heading {
    @include sr-only;
  }

  &__status {
    flex: 1 1 280rem;
    max-width: 420rem;
  }
}
</style>
