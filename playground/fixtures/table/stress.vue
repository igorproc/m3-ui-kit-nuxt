<template>
  <section class="fixture-table-stress">
    <h1>MTable — stress content</h1>

    <h2>Wider than its column</h2>
    <MTable
      class="fixture-table-stress__panel"
      aria-label="Quarterly report"
      :columns="wideColumns"
      :data="report"
      data-test="wide"
    />

    <h2>Long unbroken values in a narrow column</h2>
    <MTable
      class="fixture-table-stress__narrow"
      caption="Shipments"
      :columns="longColumns"
      :data="shipments"
      selectable
      select-all-label="Select all shipments"
      data-test="long"
    />

    <h2>A footer in a narrow column</h2>
    <MTable
      v-model:current-page="page"
      v-model:page-size="pageSize"
      class="fixture-table-stress__narrow"
      aria-label="Paged shipments"
      :columns="longColumns"
      :data="shipments.slice(0, 1)"
      pagination
      :total-items="240"
      :page-size-options="[10, 25, 50, 100]"
      page-size-label="Rows per page"
      previous-page-label="Previous page"
      next-page-label="Next page"
      data-test="narrow-footer"
    >
      <template #pagination-info="{ start, end, total }">
        {{ start }}–{{ end }} of {{ total }}
      </template>
    </MTable>

    <h2>Many rows</h2>
    <MTable
      class="fixture-table-stress__panel"
      aria-label="Many rows"
      density="compact"
      :columns="longColumns"
      :data="many"
      selectable
      select-all-label="Select all rows"
      data-test="many"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MTable from '#kit/components/ui/table/index.vue'
import type { TableColumn } from '#kit/components/ui/table/types'

interface Line {
  id: number
  [key: string]: unknown
}

const quarters = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10']

const wideColumns: TableColumn<Line>[] = [
  { key: 'region', label: 'Region', minWidth: '160rem' },
  // The last column sorts, so its focus ring sits under the edge fade.
  ...quarters.map(key => ({ key, label: `Revenue ${key.toUpperCase()}`, numeric: true, minWidth: '120rem', sortable: key === quarters.at(-1) })),
]

const report: Line[] = ['North', 'South', 'East', 'West'].map((region, index) => ({
  id: index,
  region,
  ...Object.fromEntries(quarters.map((key, quarter) => [key, (index + 1) * 1000 + quarter * 37])),
}))

const longColumns: TableColumn<Line>[] = [
  { key: 'code', label: 'Code' },
  { key: 'weight', label: 'kg', numeric: true },
]

const shipments: Line[] = [
  { id: 1, code: 'CBL-USB-C-TO-USB-C-2M-BRAIDED-BLACK-2025-REV-B-WAREHOUSE-NORTH', weight: 0.25 },
  { id: 2, code: 'https://example.com/a/very/long/path/without/any/spaces/at/all', weight: 12 },
  { id: 3, code: 'Short', weight: 1500 },
]

const many: Line[] = Array.from({ length: 100 }, (_, index) => ({ id: index, code: `ROW-${index + 1}`, weight: index * 3 }))

const page = ref(1)
const pageSize = ref(10)
</script>

<style lang="scss">
.fixture-table-stress {
  display: grid;
  gap: 16rem;

  &__panel {
    max-width: 640rem;
  }

  &__narrow {
    width: 300rem;
    max-width: 100%;
  }
}
</style>
