<template>
  <thead>
    <tr class="ui-table__row ui-table__row--header">
      <th
        v-if="resolvedSelectable"
        class="ui-table__cell ui-table__cell--header ui-table__cell--checkbox"
      >
        <m-checkbox
          :model-value="resolvedIsAllSelected"
          @update:model-value="$emit('toggle-all', $event)"
        />
      </th>
      <th
        v-for="column in columns"
        :key="String(column.key)"
        scope="col"
        class="ui-table__cell ui-table__cell--header"
        :class="{ 'ui-table__cell--sortable': column.sortable }"
        :style="{ width: column.width }"
        :aria-sort="column.sortable ? ariaSortFor(column) : undefined"
      >
        <button
          v-if="column.sortable"
          type="button"
          class="ui-table__header-content ui-table__header-sort"
          @click="toggleSort(column)"
        >
          <slot
            :name="`header-${String(column.key)}`"
            :column="column"
          >
            {{ column.label }}
          </slot>
          <m-icon
            v-if="resolvedSort?.key === column.key"
            :name="resolvedSort.direction === 'asc' ? ICONS.arrowUpward : ICONS.arrowDownward"
            class="ui-table__sort-icon"
          />
        </button>
        <div
          v-else
          class="ui-table__header-content"
        >
          <slot
            :name="`header-${String(column.key)}`"
            :column="column"
          >
            {{ column.label }}
          </slot>
        </div>
      </th>
    </tr>
  </thead>
</template>

<script setup lang="ts" generic="T extends TableData">
import { computed } from 'vue'
import { ICONS } from '#kit/shared/constants/icons'
import MCheckbox from '#kit/components/ui/checkbox/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { TableColumn, TableData, SortState } from '#kit/components/ui/table/types'
import { useTableContext } from '#kit/composables/table/useTableContext'

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

// Optional parent context (present when rendered inside `<MTable>`); props win
// for explicit/standalone usage so the public API stays backward-compatible.
const ctx = useTableContext()

const resolvedSelectable = computed(() => props.selectable ?? ctx?.selectable.value ?? false)
const resolvedIsAllSelected = computed(() => props.isAllSelected ?? ctx?.isAllSelected.value ?? false)
const resolvedSort = computed(() => props.sort ?? (ctx?.sort.value as SortState<T> | null | undefined) ?? null)

function ariaSortFor(column: TableColumn<T>): 'ascending' | 'descending' | 'none' {
  const currentSort = resolvedSort.value
  if (currentSort?.key !== column.key) return 'none'

  return currentSort.direction === 'asc' ? 'ascending' : 'descending'
}

function toggleSort(column: TableColumn<T>) {
  if (!column.sortable) return

  const currentSort = resolvedSort.value
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
@use '#kit/assets/stylesheet/components/table/index' as t;

.ui-table {
  $t: material-map(t.$tokens, 'md-table');

  &__row--header {
    background-color: g($t, 'header-bg');
  }

  &__cell--header {
    color: g($t, 'header-color');
    white-space: nowrap;

    @include typescale(g($t, 'header-text-type'));

    &.ui-table__cell--sortable {
      user-select: none;

      &:hover {
        background-color: g($t, 'header-hover-bg');
      }
    }
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: g($t, 'header-content-gap');
  }

  &__header-sort {
    width: 100%;
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: inherit;
    text-align: inherit;
    font: inherit;
    letter-spacing: inherit;
  }

  &__sort-icon {
    font-size: g($t, 'header-sort-icon-size');
    color: g($t, 'header-sort-icon-color');
  }
}
</style>
