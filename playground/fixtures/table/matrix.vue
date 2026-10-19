<template>
  <section class="fixture-table">
    <h1>MTable — matrix</h1>

    <h2>Selection, numbers, sorting, footer</h2>
    <MTable
      v-model:sort="sort"
      v-model:selected-rows="selected"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      class="fixture-table__panel"
      caption="Orders"
      :columns="columns"
      :data="pageRows"
      selectable
      select-all-label="Select all orders on this page"
      pagination
      :total-items="products.length"
      :page-size-options="[5, 10]"
      page-size-label="Rows per page"
      previous-page-label="Previous page"
      next-page-label="Next page"
      :status-text="status"
      data-test="main"
      @row-click="clicked = $event.name"
    >
      <template #pagination-info="{ start, end, total }">
        <span data-test="range">{{ start }}–{{ end }} of {{ total }}</span>
      </template>
    </MTable>
    <p data-test="clicked">
      Last row clicked: {{ clicked }}
    </p>
    <p>
      Selected: <span data-test="selected">{{ selected.map(product => product.name).join(', ') }}</span>
    </p>

    <h2>Density</h2>
    <div class="fixture-table__grid">
      <MTable
        v-for="density in densities"
        :key="density"
        class="fixture-table__small"
        :density="density"
        :aria-label="`Density ${density}`"
        :columns="shortColumns"
        :data="products.slice(0, 2)"
        selectable
        :select-all-label="`Select all, ${density}`"
        :data-test="`density-${density}`"
      />
    </div>

    <h2>Data states</h2>
    <div class="fixture-table__grid">
      <MTable
        class="fixture-table__small"
        aria-label="Loading"
        :columns="shortColumns"
        :data="[]"
        loading
        data-test="state-loading"
      />
      <MTable
        class="fixture-table__small"
        aria-label="Refreshing"
        :columns="shortColumns"
        :data="products.slice(0, 3)"
        loading
        data-test="state-refreshing"
      />
      <MTable
        class="fixture-table__small"
        caption="Refreshing, captioned"
        :columns="shortColumns"
        :data="products.slice(0, 3)"
        loading
        data-test="state-refreshing-caption"
      />
      <MTable
        class="fixture-table__small"
        aria-label="Empty"
        :columns="shortColumns"
        :data="[]"
        data-test="state-empty"
      >
        <template #empty>
          <span>No products yet</span>
        </template>
      </MTable>
      <MTable
        class="fixture-table__small"
        aria-label="Error"
        :columns="shortColumns"
        :data="[]"
        error="Could not load products"
        data-test="state-error"
      />
      <MTable
        class="fixture-table__small"
        aria-label="Error with retry"
        :columns="shortColumns"
        :data="[]"
        error
        data-test="state-retry"
        @retry="retries++"
      >
        <template #error="{ retry }">
          <span>Could not load products</span>
          <MButton
            variant="text"
            data-test="retry"
            @click="retry"
          >
            Retry ({{ retries }})
          </MButton>
        </template>
      </MTable>
      <MTable
        class="fixture-table__small"
        aria-label="Partial failure"
        :columns="shortColumns"
        :data="products.slice(0, 2)"
        error="The next rows could not load"
        data-test="state-partial"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MTable from '#kit/components/ui/table/index.vue'
import type { MTableDensity, SortState, TableColumn } from '#kit/components/ui/table/types'

interface Product {
  id: number
  name: string
  sku: string
  amount: number
  status: string
  [key: string]: unknown
}

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const columns: TableColumn<Product>[] = [
  { key: 'name', label: 'Product', sortable: true },
  { key: 'sku', label: 'SKU', minWidth: '120rem' },
  { key: 'amount', label: 'Amount', numeric: true, sortable: true, format: value => money.format(value as number) },
  { key: 'status', label: 'Status' },
]

const shortColumns: TableColumn<Product>[] = [
  { key: 'name', label: 'Product' },
  { key: 'amount', label: 'Amount', numeric: true },
]

const products: Product[] = [
  { id: 1, name: 'Desk lamp', sku: 'LMP-001', amount: 49.9, status: 'In stock' },
  { id: 2, name: 'Office chair', sku: 'CHR-442', amount: 1299, status: 'Low' },
  { id: 3, name: 'Cable', sku: 'CBL-USB-C-TO-USB-C-2M-BRAIDED-BLACK-2025', amount: 9, status: 'In stock' },
  { id: 4, name: 'Monitor arm', sku: 'ARM-020', amount: 189.5, status: 'Out' },
  { id: 5, name: 'Notebook', sku: 'NTB-777', amount: 4.25, status: 'In stock' },
  { id: 6, name: 'Pen', sku: 'PEN-100', amount: 1.5, status: 'In stock' },
  { id: 7, name: 'Stapler', sku: 'STP-007', amount: 12, status: 'Low' },
]

const densities: MTableDensity[] = ['compact', 'default', 'comfortable']

const sort = ref<SortState<Product> | null>(null)
const page = ref(1)
const pageSize = ref(5)
const selected = ref<Product[]>([products[1]!, products[3]!])
const clicked = ref('')
const retries = ref(0)

const sorted = computed(() => {
  const { key, direction } = sort.value ?? {}
  if (!key || !direction) return products

  const factor = direction === 'asc' ? 1 : -1
  return [...products].sort((a, b) => (a[key] as number | string) > (b[key] as number | string) ? factor : -factor)
})

const pageRows = computed(() => sorted.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

const status = computed(() => `Page ${page.value}${sort.value ? `, sorted by ${String(sort.value.key)} ${sort.value.direction}` : ''}`)
</script>

<style lang="scss">
.fixture-table {
  display: grid;
  gap: 16rem;

  &__panel {
    max-width: 760rem;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 16rem;
  }

  &__small {
    width: 280rem;
    max-width: 100%;
  }
}
</style>
