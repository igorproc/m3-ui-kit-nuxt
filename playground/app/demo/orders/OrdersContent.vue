<template>
  <div class="orders-content">
    <header class="orders-content__header">
      <h1 class="orders-content__title">
        Заказы
      </h1>
      <p class="orders-content__subtitle">
        Магазин бытовой техники · данные на {{ formatLongDay(TODAY) }}
      </p>
    </header>

    <MBanner
      v-model="bannerVisible"
      title="Печать накладных пачкой"
      text="Отметьте заказы в таблице и нажмите «Накладные» — все документы уйдут на принтер одним файлом."
      icon="ic:outline-print"
      variant="tonal"
      announce="off"
      closable
      close-label="Скрыть подсказку"
    >
      <template #actions="{ close }">
        <MButton
          variant="text"
          @click="close"
        >
          Понятно
        </MButton>
      </template>
    </MBanner>

    <OrdersFilters
      v-model:from="filters.from"
      v-model:to="filters.to"
      v-model:statuses="filters.statuses"
      v-model:flags="filters.flags"
      :earliest="HISTORY_FROM"
      :latest="TODAY"
      :filtered="isFiltered"
      @reset="resetFilters"
    />

    <OrdersKpis
      :kpis="kpis"
      :period-text="periodText"
    />

    <div class="orders-content__grid">
      <OrdersListSection />
      <OrdersSideColumn @show-shipped="showShipped" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import OrdersFilters from './OrdersFilters.vue'
import OrdersKpis from './OrdersKpis.vue'
import OrdersListSection from './OrdersListSection.vue'
import OrdersSideColumn from './OrdersSideColumn.vue'
import { TODAY } from './data/calendar'
import { formatLongDay } from './data/format'
import { HISTORY_FROM, useOrdersDashboard } from './useOrdersDashboard'

const { query, metrics, periodText } = useOrdersDashboard()
const { filters, isFiltered, resetFilters } = query
const { kpis } = metrics

const bannerVisible = ref(true)

function showShipped() {
  filters.statuses = ['shipped']
}
</script>

<style lang="scss">
.orders-content {
  container: orders-content / inline-size;
  display: grid;
  gap: spacing(24);

  // Room under the last card for the FAB, which floats over the content.
  padding: spacing(24) spacing(16) calc(#{spacing(64)} + #{spacing(32)});

  &__header {
    display: grid;
    gap: spacing(4);
  }

  &__title {
    margin: 0;
    color: var(--md-sys-color-on-surface);

    @include typescale('headline-medium');
  }

  &__subtitle {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('body-medium');
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: spacing(24);
  }

  @container orders-content (width >= 1400rem) {
    &__grid {
      grid-template-columns: minmax(0, 1fr) 400rem;
      align-items: start;
    }
  }
}
</style>
