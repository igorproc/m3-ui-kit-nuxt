<template>
  <div class="ui-table-container">
    <table class="ui-table">
      <m-table-header
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
      </m-table-header>

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
            <m-checkbox
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

    <m-table-pagination
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
    </m-table-pagination>
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
@use '~/assets/stylesheet/components/table' as v;

.ui-table-container {
  width: 100%;
  overflow-x: auto;
  background-color: v.$container-bg;
  border-radius: v.$container-border-radius;
  border: 1rem solid v.$container-border-color;
}

.ui-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  &__row {
    border-bottom: 1rem solid v.$row-border-color;
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    &:hover:not(.ui-table__row--header) {
      background-color: v.$row-hover-bg;
    }

    &--selected {
      background-color: v.$row-selected-bg;
    }
  }

  &__cell {
    padding: v.$cell-padding;
    color: v.$cell-color;

    @include typescale(v.$cell-text-type);

    &--checkbox {
      width: v.$cell-checkbox-width;
      padding-inline: v.$cell-checkbox-padding-inline;
    }
  }
}
</style>
