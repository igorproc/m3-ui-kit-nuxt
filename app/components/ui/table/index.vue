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
import { computed, toRef } from 'vue'
import UiTableHeader from './header/index.vue'
import UiTablePagination from './pagination/index.vue'
import type { TableColumn, TableData, SortState } from './types'
import { useTableSelection } from '~/composables/table/useTableSelection'
import { provideTableContext } from '~/composables/table/useTableContext'

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

const { isSelected, toggleRow, isAllSelected, toggleAll } = useTableSelection<T>({
  data: () => props.data,
  selectedRows: () => props.selectedRows,
  onChange: rows => emit('update:selectedRows', rows),
})

provideTableContext({
  selectable: toRef(() => props.selectable),
  isAllSelected,
  toggleAll,
  sort: computed({
    get: () => sortState.value,
    set: value => (sortState.value = value as SortState<T> | null),
  }),
  setSort: value => (sortState.value = value as SortState<T> | null),
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/table/index' as t;

.ui-table-container {
  $t: material-map(t.$tokens, 'md-table');

  width: 100%;
  overflow-x: auto;
  background-color: g($t, 'container-bg');
  border-radius: g($t, 'container-border-radius');
  border: g($t, 'container-border-width') solid g($t, 'container-border-color');
}

.ui-table {
  $t: material-map(t.$tokens, 'md-table');

  width: 100%;
  border-collapse: collapse;
  text-align: left;

  &__row {
    border-bottom: g($t, 'row-border-width') solid g($t, 'row-border-color');
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    &:hover:not(.ui-table__row--header) {
      background-color: g($t, 'row-hover-bg');
    }

    &--selected {
      background-color: g($t, 'row-selected-bg');
    }
  }

  &__cell {
    padding: g($t, 'cell-padding');
    color: g($t, 'cell-color');

    @include typescale(g($t, 'cell-text-type'));

    &--checkbox {
      width: g($t, 'cell-checkbox-width');
      padding-inline: g($t, 'cell-checkbox-padding-inline');
    }
  }
}
</style>
