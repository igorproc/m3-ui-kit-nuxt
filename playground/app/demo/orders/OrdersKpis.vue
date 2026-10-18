<template>
  <section
    class="orders-kpis"
    aria-labelledby="orders-kpis-heading"
  >
    <h2
      id="orders-kpis-heading"
      class="orders-kpis__heading"
    >
      Ключевые показатели за {{ periodText }}
    </h2>

    <div class="orders-kpis__grid">
      <OrdersKpiCard
        v-for="kpi in kpis"
        :key="kpi.id"
        :kpi="kpi"
        :last-value="lastValue(kpi)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import OrdersKpiCard from './OrdersKpiCard.vue'
import { integer, money } from './data/format'
import type { Kpi } from './useOrdersMetrics'

defineProps<{
  kpis: Kpi[]
  periodText: string
}>()

function lastValue(kpi: Kpi): string {
  const last = kpi.series.at(-1) ?? 0
  return kpi.id === 'revenue' || kpi.id === 'average' ? money.format(last) : integer.format(last)
}
</script>

<style lang="scss">
.orders-kpis {
  container: orders-kpis / inline-size;

  &__heading {
    @include sr-only;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: spacing(16);
  }

  @container orders-kpis (width >= 960rem) {
    &__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
}
</style>
