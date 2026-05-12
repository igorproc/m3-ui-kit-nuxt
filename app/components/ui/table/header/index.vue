<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'
</script>

<template>
  <thead>
    <tr class="ui-table__row ui-table__row--header">
      <th
        v-if="selectable"
        class="ui-table__cell ui-table__cell--header ui-table__cell--checkbox"
      >
        <m-checkbox
          :model-value="isAllSelected"
          @update:model-value="$emit('toggle-all', $event)"
        />
      </th>
      <th
        v-for="column in columns"
        :key="String(column.key)"
        class="ui-table__cell ui-table__cell--header"
        :class="{ 'ui-table__cell--sortable': column.sortable }"
        :style="{ width: column.width }"
        @click="toggleSort(column)"
      >
        <div class="ui-table__header-content">
          <slot
            :name="`header-${String(column.key)}`"
            :column="column"
          >
            {{ column.label }}
          </slot>
          <m-icon
            v-if="column.sortable && sort?.key === column.key"
            :name="sort.direction === 'asc' ? ICONS.arrowUpward : ICONS.arrowDownward"
            class="ui-table__sort-icon"
          />
        </div>
      </th>
    </tr>
  </thead>
</template>

<script setup lang="ts" generic="T extends TableData">
import type { TableColumn, TableData, SortState } from '../types'

interface Props {
  columns: TableColumn<T>[]
  selectable?: boolean
  isAllSelected?: boolean
  sort?: SortState<T> | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'toggle-all': [value: boolean]
  'update:sort': [value: SortState<T> | null]
}>()

function toggleSort(column: TableColumn<T>) {
  if (!column.sortable) return

  const currentSort = props.sort
  const isCurrentColumn = currentSort?.key === column.key

  let newSort: SortState<T> | null = null

  if (!isCurrentColumn) {
    newSort = { key: column.key, direction: 'asc' }
  } else if (currentSort?.direction === 'asc') {
    newSort = { key: column.key, direction: 'desc' }
  } else {
    newSort = null
  }

  emit('update:sort', newSort)
}
</script>

<style lang="scss">
.ui-table {
  &__row--header {
    background-color: var(--color-surface-container-low);
  }

  &__cell--header {
    color: var(--color-on-surface-variant);
    white-space: nowrap;

    @include typescale('label-large');

    &.ui-table__cell--sortable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: color-mix(in srgb, var(--color-on-surface) 8%, transparent);
      }
    }
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: 4rem;
  }

  &__sort-icon {
    font-size: 16rem;
    color: var(--color-on-surface);
  }
}
</style>
