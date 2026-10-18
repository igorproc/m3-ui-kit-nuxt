<template>
  <div class="crm-board">
    <section
      v-for="column in columns"
      :key="column.id"
      class="crm-board-column"
      :aria-labelledby="`crm-stage-${column.id}`"
    >
      <header class="crm-board-column__header">
        <h3
          :id="`crm-stage-${column.id}`"
          class="crm-board-column__title"
        >
          {{ column.label }}
        </h3>
        <p class="crm-board-column__meta">
          {{ countLabel(column.deals.length, ['сделка', 'сделки', 'сделок']) }} · {{ formatCompactMoney(column.total) }}
        </p>
      </header>

      <ul
        v-if="column.deals.length"
        class="crm-board-column__list"
      >
        <li
          v-for="deal in column.deals"
          :key="deal.id"
        >
          <CrmDealCard :deal="deal" />
        </li>
      </ul>

      <p
        v-else
        class="crm-board-column__empty"
      >
        Нет сделок на этапе
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { countLabel, formatCompactMoney } from '../data/crmFormat'
import type { CrmBoardColumn } from '../composables/useCrmPipeline'
import CrmDealCard from './CrmDealCard.vue'

defineProps<{
  columns: CrmBoardColumn[]
}>()
</script>

<style lang="scss">
.crm-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(208rem, 1fr));
  align-items: start;
  gap: spacing(16);
}

.crm-board-column {
  display: grid;
  gap: spacing(12);
  padding: spacing(12);
  border-radius: var(--sys-shape-corner-large);
  background-color: var(--md-sys-color-surface-container-low);

  &__header {
    display: grid;
    gap: spacing(2);
  }

  &__title {
    margin: 0;
    color: var(--md-sys-color-on-surface);

    @include typescale('title-medium');
  }

  &__meta,
  &__empty {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('body-small');
  }

  &__list {
    display: grid;
    gap: spacing(12);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  @include forced-colors {
    border: 1px solid CanvasText;
  }
}
</style>
