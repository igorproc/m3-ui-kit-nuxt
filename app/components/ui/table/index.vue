<template>
  <div class="ui-table-container">
    <table class="ui-table">
      <ui-table-header
        v-model:sort="sortState"
        :columns="columns"
        :selectable="selectable"
        :is-all-selected="isAllSelected"
        @toggle-all="toggleAll"
      >
        <template
          v-for="column in columns"
          :key="String(column.key)"
          #[`header-${String(column.key)}`]="{ column: col }"
        >
          <slot
            :name="`header-${String(column.key)}`"
            :column="col"
          >
            {{ col.label }}
          </slot>
        </template>
      </ui-table-header>

      <tbody>
        <tr
          v-for="row in data"
          :key="row.id"
          class="ui-table__row"
          :class="{ 'ui-table__row--selected': isSelected(row) }"
        >
          <td
            v-if="selectable"
            class="ui-table__cell ui-table__cell--checkbox"
          >
            <ui-checkbox
              :model-value="isSelected(row)"
              @update:model-value="toggleRow(row)"
            />
          </td>

          <td
            v-for="column in columns"
            :key="String(column.key)"
            class="ui-table__cell"
          >
            <slot
              :name="`cell-${String(column.key)}`"
              :row="row"
              :column="column"
              :value="row[column.key]"
            >
              {{ row[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <ui-table-pagination
      v-if="pagination"
      :page-size="pageSize"
      :current-page="currentPage"
      :total-items="totalItems"
      @update:current-page="$emit('update:currentPage', $event)"
    >
      <template #pagination-info>
        <slot name="pagination-info">
          Items per page: {{ pageSize }}
        </slot>
      </template>
    </ui-table-pagination>
  </div>
</template>

<script setup lang="ts" generic="T extends TableData">
import UiTableHeader from './header/index.vue'
import UiTablePagination from './pagination/index.vue'
import type { TableColumn, TableData, SortState } from './types'

interface Props {
  columns: TableColumn<T>[]
  data: T[]
  selectable?: boolean
  selectedRows?: T[]
  pagination?: boolean
  pageSize?: number
  totalItems?: number
  currentPage?: number
}

interface Emits {
  (e: 'update:selectedRows', payload: [rows: T[]]): void
  (e: 'update:currentPage', payload: [page: number]): void
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  selectedRows: () => [],
  pagination: false,
  pageSize: 10,
  totalItems: 0,
  currentPage: 1,
})

const emit = defineEmits<Emits>()

const sortState = defineModel<SortState<T> | null>('sort', { default: null })

const isAllSelected = computed(() => {
  return props.data.length > 0 && props.data.every(row => isSelected(row))
})

function isSelected(row: T) {
  return props.selectedRows.some(r => JSON.stringify(r) === JSON.stringify(row))
}

function toggleRow(row: T) {
  const newSelection = isSelected(row)
    ? props.selectedRows.filter(r => JSON.stringify(r) !== JSON.stringify(row))
    : [...props.selectedRows, row]

  emit('update:selectedRows', newSelection)
}

function toggleAll(value: boolean) {
  emit('update:selectedRows', value ? [...props.data] : [])
}
</script>

<style lang="scss">
.ui-table-container {
  width: 100%;
  overflow-x: auto;
  background-color: var(--color-surface);
  border-radius: var(--sys-shape-corner-medium);
  border: 1rem solid var(--color-outline-variant);
}

.ui-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  &__row {
    border-bottom: 1rem solid var(--color-outline-variant);
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    &:hover:not(.ui-table__row--header) {
      background-color: color-mix(in srgb, var(--color-on-surface) 4%, transparent);
    }

    &--selected {
      background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
    }
  }

  &__cell {
    padding: 12rem 16rem;
    color: var(--color-on-surface);

    @include typescale('body-medium');

    &--checkbox {
      width: 48rem;
      padding-inline: 12rem;
    }
  }
}
</style>
