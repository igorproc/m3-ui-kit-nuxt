<template>
  <MTable
    v-model:sort="sort"
    v-model:selected-rows="selected"
    v-model:current-page="page"
    v-model:page-size="pageSize"
    class="orders-table"
    aria-label="Заказы"
    :columns="COLUMNS"
    :data="rows"
    :density="density"
    selectable
    select-all-label="Выбрать все заказы на странице"
    pagination
    :total-items="totalItems"
    :page-size-options="[10, 25, 50]"
    page-size-label="Строк на странице"
    previous-page-label="Предыдущая страница"
    next-page-label="Следующая страница"
    :loading="loading"
    :error="error"
    :status-text="statusText"
    @row-click="row => emit('open', row)"
    @retry="emit('retry')"
  >
    <template #header-actions>
      <span class="orders-table__hidden">Действия</span>
    </template>

    <template #cell-number="{ row }">
      <MButton
        variant="text"
        density="compact"
        aria-haspopup="dialog"
        @click="emit('open', row)"
      >
        {{ row.number }}
      </MButton>
      <MIcon
        v-if="row.urgent"
        class="orders-table__urgent"
        name="ic:outline-bolt"
      />
      <span
        v-if="row.urgent"
        class="orders-table__hidden"
      >, срочный</span>
    </template>

    <template #cell-customer="{ row }">
      <OrderCustomerCell
        :name="row.customer"
        :email="row.email"
      />
    </template>

    <template #cell-status="{ row }">
      <OrderStatusChip
        :status="row.status"
        @filter="status => emit('filter-status', status)"
      />
    </template>

    <template #cell-actions="{ row }">
      <OrderRowActions
        :order="row"
        @action="(action, order) => emit('action', action, order)"
      />
    </template>

    <template #empty>
      <div class="orders-table__message">
        <MIcon
          class="orders-table__message-icon"
          name="ic:outline-search-off"
        />
        <p>По выбранным фильтрам заказов нет.</p>
        <MButton
          variant="tonal"
          density="compact"
          @click="emit('reset')"
        >
          Сбросить фильтры
        </MButton>
      </div>
    </template>

    <template #error="{ error: message, retry }">
      <div class="orders-table__message">
        <MIcon
          class="orders-table__message-icon"
          name="ic:outline-sync-problem"
        />
        <p>{{ message }}</p>
        <MButton
          variant="tonal"
          density="compact"
          @click="retry"
        >
          <template #prepend>
            <MIcon name="ic:outline-refresh" />
          </template>
          Повторить
        </MButton>
      </div>
    </template>

    <template #pagination-info="{ start, end, total }">
      {{ start }}–{{ end }} из {{ total }}
    </template>
  </MTable>
</template>

<script setup lang="ts">
import type { MTableDensity, SortState, TableColumn } from '#kit/components/ui/table/types'
import OrderCustomerCell from './OrderCustomerCell.vue'
import OrderRowActions from './OrderRowActions.vue'
import OrderStatusChip from './OrderStatusChip.vue'
import { DELIVERY_LABELS } from './data/model'
import type { OrderDelivery, OrderRow, OrderRowAction, OrderStatus } from './data/model'
import { formatDateTime, integer, money } from './data/format'

defineProps<{
  rows: OrderRow[]
  totalItems: number
  density: MTableDensity
  loading: boolean
  error: string | false
  statusText: string
}>()

const emit = defineEmits<{
  (event: 'open', order: OrderRow): void
  (event: 'action', action: OrderRowAction, order: OrderRow): void
  (event: 'filter-status', status: OrderStatus): void
  (event: 'reset' | 'retry'): void
}>()

const sort = defineModel<SortState<OrderRow> | null>('sort', { required: true })
const selected = defineModel<OrderRow[]>('selected', { required: true })
const page = defineModel<number>('page', { required: true })
const pageSize = defineModel<number>('pageSize', { required: true })

// `format` receives the union of every field's type, hence the casts.
const COLUMNS: TableColumn<OrderRow>[] = [
  { key: 'number', label: 'Заказ', sortable: true, minWidth: '150rem' },
  { key: 'createdAt', label: 'Создан', sortable: true, minWidth: '130rem', format: value => formatDateTime(value as string) },
  { key: 'customer', label: 'Покупатель', sortable: true, minWidth: '240rem' },
  { key: 'status', label: 'Статус', minWidth: '170rem' },
  { key: 'delivery', label: 'Доставка', minWidth: '110rem', format: value => DELIVERY_LABELS[value as OrderDelivery] },
  { key: 'items', label: 'Товаров', numeric: true, sortable: true, format: value => integer.format(value as number) },
  { key: 'total', label: 'Сумма', numeric: true, sortable: true, minWidth: '120rem', format: value => money.format(value as number) },
  { key: 'actions', label: 'Действия', align: 'end', width: '64rem' },
]
</script>

<style lang="scss">
.orders-table {
  &__urgent {
    color: var(--md-sys-color-error);
    vertical-align: middle;
  }

  &__hidden {
    @include sr-only;
  }

  &__message {
    display: grid;
    justify-items: center;
    gap: spacing(8);

    p {
      margin: 0;
    }
  }

  &__message-icon {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 32rem;
  }
}
</style>
