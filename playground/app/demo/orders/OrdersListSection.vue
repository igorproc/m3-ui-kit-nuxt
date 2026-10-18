<template>
  <section
    class="orders-list"
    aria-labelledby="orders-list-heading"
  >
    <div class="orders-list__head">
      <h2
        id="orders-list-heading"
        class="orders-list__title"
      >
        Список заказов
      </h2>

      <div class="orders-list__controls">
        <MButtonGroup
          v-model="densityChoice"
          :items="DENSITY_ITEMS"
          variant="outlined"
          density="compact"
          aria-label="Плотность строк"
        />

        <MSwitch
          v-model="failNextLoad"
          label="Сбой при следующей загрузке"
        />

        <MButtonIcon
          variant="tonal"
          density="compact"
          aria-label="Обновить список"
          :loading="loading"
          @click="reload"
        >
          <MIcon name="ic:outline-refresh" />
        </MButtonIcon>
      </div>
    </div>

    <OrdersBulkBar
      v-if="selected.length"
      :count="selected.length"
      @ship="bulk.ship"
      @print="bulk.print"
      @export="bulk.export"
      @clear="bulk.clear"
    />

    <OrdersTable
      v-model:sort="sort"
      v-model:selected="selected"
      v-model:page="page"
      v-model:page-size="pageSize"
      :rows="pageRows"
      :total-items="filtered.length"
      :density="density"
      :loading="loading"
      :error="errorText"
      :status-text="statusText"
      @open="openOrder"
      @action="runAction"
      @filter-status="showOnlyStatus"
      @reset="resetFilters"
      @retry="reload"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MTableDensity } from '#kit/components/ui/table/types'
import type { MButtonGroupItem, MButtonGroupModelValue } from '#kit/components/ui/button/group/props'
import OrdersBulkBar from './OrdersBulkBar.vue'
import OrdersTable from './OrdersTable.vue'
import { useOrdersDashboard } from './useOrdersDashboard'

const { query, source, bulk, openOrder, runAction } = useOrdersDashboard()
const { sort, selected, page, pageSize, pageRows, filtered, statusText, showOnlyStatus, resetFilters } = query
const { loading, errorText, failNextLoad, reload } = source

const DENSITIES: MTableDensity[] = ['compact', 'default', 'comfortable']

// The group's model is typed `string | number | array`, not by its items: narrow it back.
const densityChoice = ref<MButtonGroupModelValue>('default')
const density = computed(() => DENSITIES.find(step => step === densityChoice.value) ?? 'default')

const DENSITY_ITEMS: MButtonGroupItem[] = [
  { value: 'compact', icon: 'ic:outline-density-small', ariaLabel: 'Компактные строки' },
  { value: 'default', icon: 'ic:outline-density-medium', ariaLabel: 'Обычные строки' },
  { value: 'comfortable', icon: 'ic:outline-density-large', ariaLabel: 'Просторные строки' },
]
</script>

<style lang="scss">
.orders-list {
  display: grid;
  gap: spacing(12);
  min-width: 0;

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: spacing(12);
  }

  &__title {
    margin: 0;
    color: var(--md-sys-color-on-surface);

    @include typescale('title-large');
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: spacing(12);
  }
}
</style>
