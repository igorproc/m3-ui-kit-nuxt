<template>
  <aside
    class="orders-side"
    aria-labelledby="orders-side-heading"
  >
    <h2
      id="orders-side-heading"
      class="orders-side__heading"
    >
      Сводка за {{ periodText }}
    </h2>

    <MAlert
      v-model="incidentVisible"
      type="warning"
      title="Задержки доставки у перевозчика"
      icon="ic:outline-local-shipping"
      closable
      close-label="Скрыть предупреждение"
    >
      «Быстрая почта» не забирает посылки со склада «Южный» с 6 октября.
      Заказы в доставке могут прийти на 2–3 дня позже.

      <template #actions>
        <MButton
          variant="text"
          density="compact"
          @click="emit('show-shipped')"
        >
          Показать заказы
        </MButton>
      </template>
    </MAlert>

    <MCard
      variant="filled"
      title="Топ товаров"
      :subtitle="topProducts.length ? 'Доля в выручке периода' : undefined"
      :heading-level="3"
    >
      <MList
        v-if="topProducts.length"
        :items="topProducts"
        density="compact"
        surface="surface-container-highest"
      >
        <template #default="{ item, index }">
          <MListItem
            :headline="`${index + 1}. ${item.title}`"
            :supporting-text="pluralize(item.units, ['штука', 'штуки', 'штук'])"
            :trailing-supporting-text="money.format(item.revenue)"
          >
            <MProgress
              class="orders-side__share"
              type="linear"
              :value="Math.round(item.share * 100)"
              :aria-label="`${item.title}: ${shareText(item)}`"
            />
          </MListItem>
        </template>
      </MList>
      <p
        v-else
        class="orders-side__empty"
      >
        За этот период продаж не было.
      </p>
    </MCard>

    <MCard
      variant="filled"
      title="Выручка по дням"
      :subtitle="`Всего ${money.format(totalRevenue)}`"
      :heading-level="3"
    >
      <BarChart
        :bars="bars"
        caption="Выручка по дням периода"
        label-header="День"
        value-header="Выручка"
      />
    </MCard>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BarChart from '~/demo/charts/BarChart.vue'
import { TODAY } from './data/calendar'
import { formatLongDay, formatShortDay, money, pluralize } from './data/format'
import { useOrdersDashboard } from './useOrdersDashboard'

const emit = defineEmits<{
  (event: 'show-shipped'): void
}>()

const { metrics, periodText } = useOrdersDashboard()
const { topProducts, days, shareText } = metrics

const incidentVisible = ref(true)

const totalRevenue = computed(() => days.value.reduce((sum, day) => sum + day.revenue, 0))

const bars = computed(() => days.value.map(day => ({
  key: day.day,
  label: formatLongDay(day.day),
  tick: formatShortDay(day.day).replace(/\s\S+$/, ''),
  value: day.revenue,
  valueText: money.format(day.revenue),
  accent: day.day === TODAY,
})))
</script>

<style lang="scss">
.orders-side {
  display: grid;
  align-content: start;
  gap: spacing(16);
  min-width: 0;

  &__heading {
    @include sr-only;
  }

  &__share {
    margin-block-start: spacing(4);
  }

  &__empty {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
