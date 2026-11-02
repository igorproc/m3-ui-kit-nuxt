<template>
  <section
    class="fixture-pagination"
    data-test="pagination-fixture"
  >
    <h1>MPagination — matrix</h1>

    <h2>To the last page by keyboard</h2>
    <MPagination
      v-model="page"
      :length="5"
      show-first-last
      v-bind="labels"
      :page-label="pageLabel"
      data-test="basic"
    />
    <p>
      Page: <span data-test="basic-page">{{ page }}</span>
    </p>

    <h2>Disabled while a page loads</h2>
    <MPagination
      v-model="loadingPage"
      :length="5"
      :disabled="pagerLoading"
      v-bind="labels"
      :page-label="pageLabel"
      data-test="loading"
    />
    <p>
      Page: <span data-test="loading-page">{{ loadingPage }}</span>,
      loading: <span data-test="loading-state">{{ pagerLoading }}</span>
    </p>

    <h2>Four-digit pages</h2>
    <MPagination
      v-model="archivePage"
      :length="9999"
      v-bind="labels"
      :page-label="pageLabel"
      data-test="archive"
    />

    <h2>The last pages of a thousand</h2>
    <MPagination
      v-model="tailPage"
      :length="1000"
      v-bind="labels"
      :page-label="pageLabel"
      data-test="tail"
    />

    <h2>Table footer</h2>
    <!-- MTable puts its attributes on the <table>; the footer lies outside it. -->
    <div
      class="fixture-pagination__table"
      data-test="table"
    >
      <MTable
        v-model:current-page="tablePage"
        caption="Orders"
        :columns="columns"
        :data="tableRows"
        :loading="tableLoading"
        pagination
        :page-size="2"
        :total-items="rows.length"
        previous-page-label="Previous page"
        next-page-label="Next page"
      >
        <template #pagination-info="{ start, end, total }">
          <span data-test="table-range">{{ start }}–{{ end }} of {{ total }}</span>
        </template>
      </MTable>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import MPagination from '#kit/components/ui/pagination/index.vue'
import MTable from '#kit/components/ui/table/index.vue'
import type { TableColumn } from '#kit/components/ui/table/types'

const labels = {
  ariaLabel: 'Pages',
  firstLabel: 'First page',
  previousLabel: 'Previous page',
  nextLabel: 'Next page',
  lastLabel: 'Last page',
}
const pageLabel = (page: number, current: boolean) => (current ? `Page ${page}, current page` : `Page ${page}`)

const page = ref(1)

// A page request: the pager is disabled until the "server" answers.
const LOAD_MS = 400
const timers = new Set<ReturnType<typeof setTimeout>>()
function afterLoad(done: () => void) {
  const timer = setTimeout(() => {
    timers.delete(timer)
    done()
  }, LOAD_MS)
  timers.add(timer)
}
onBeforeUnmount(() => timers.forEach(clearTimeout))

const archivePage = ref(1110)
const tailPage = ref(998)

const loadingPage = ref(1)
const pagerLoading = ref(false)
watch(loadingPage, () => {
  pagerLoading.value = true
  afterLoad(() => {
    pagerLoading.value = false
  })
})

interface Row { id: number, name: string }
const rows: Row[] = Array.from({ length: 6 }, (_, index) => ({ id: index + 1, name: `Order ${index + 1}` }))
const columns: TableColumn<Row>[] = [{ key: 'name', label: 'Order' }]

const tablePage = ref(1)
const shownPage = ref(1)
const tableLoading = ref(false)
const tableRows = computed(() => rows.slice((shownPage.value - 1) * 2, shownPage.value * 2))
watch(tablePage, (next) => {
  tableLoading.value = true
  afterLoad(() => {
    shownPage.value = next
    tableLoading.value = false
  })
})
</script>

<style lang="scss">
.fixture-pagination {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__table {
    width: 480rem;
  }
}
</style>
