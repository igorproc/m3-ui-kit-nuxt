<template>
  <div
    v-bind="rootAttrs()"
    class="ui-table-container"
    :class="[`ui-table-container--density-${density}`, { 'ui-table-container--captioned': hasCaption }]"
  >
    <div
      ref="viewport"
      class="ui-table-container__viewport"
      v-bind="viewportAttrs"
    >
      <table
        ref="table"
        class="ui-table"
        :class="{ 'ui-table--interactive': rowsInteractive }"
        v-bind="controlAttrs(tableAttrs)"
      >
        <caption
          v-if="hasCaption"
          :id="captionId"
          class="ui-table__caption"
        >
          <slot name="caption">
            {{ caption }}
          </slot>
        </caption>

        <UiTableHeader
          :columns="columns"
          :selectable="selectable"
          :is-all-selected="isAllSelected"
          :select-all-label="selectAllLabel"
          :sort="sortState"
          @update:sort="sortState = $event"
          @toggle-all="toggleAll"
        >
          <template
            v-for="column in columns"
            :key="String(column.key)"
            #[headerSlot(column)]="{ column: col }"
          >
            <slot
              :name="headerSlot(column)"
              :column="col"
            >
              {{ col.label }}
            </slot>
          </template>
        </UiTableHeader>

        <tbody>
          <tr
            v-for="(row, rowIndex) in data"
            :key="row.id"
            class="ui-table__row"
            :class="{ 'ui-table__row--selected': selectable && isSelected(row) }"
            v-bind="getRowAttrs(row)"
          >
            <td
              v-if="selectable"
              class="ui-table__cell ui-table__cell--checkbox"
            >
              <MCheckbox
                :model-value="isSelected(row)"
                v-bind="getRowCheckboxAttrs(rowIndex)"
                @update:model-value="toggleRow(row)"
              />
            </td>

            <td
              v-for="(column, columnIndex) in columns"
              :id="columnIndex === 0 ? getRowNameId(rowIndex) : undefined"
              :key="String(column.key)"
              class="ui-table__cell"
              :class="[`ui-table__cell--${tableColumnAlign(column)}`, { 'ui-table__cell--numeric': column.numeric }]"
            >
              <slot
                :name="cellSlot(column)"
                :row="row"
                :column="column"
                :value="row[column.key]"
              >
                {{ cellText(row, column) }}
              </slot>
            </td>
          </tr>

          <UiTableMessage
            v-if="body.message"
            :kind="body.message"
            :colspan="columnCount"
            :error="error"
          >
            <template
              v-if="$slots[body.message]"
              #default
            >
              <slot
                :name="body.message"
                v-bind="messageSlotProps"
              />
            </template>
          </UiTableMessage>
        </tbody>
      </table>
    </div>

    <!-- Rows stay readable while their replacement loads; the indicator is only seen. -->
    <div
      v-if="body.refreshing"
      class="ui-table-container__busy"
    >
      <MLoading aria-hidden="true" />
    </div>

    <UiTablePagination
      v-if="pagination"
      :page-size="pageSize"
      :current-page="currentPage"
      :total-items="totalItems"
      :page-size-options="pageSizeOptions"
      :loading="loading"
      :page-size-label="pageSizeLabel"
      :previous-label="previousPageLabel"
      :next-label="nextPageLabel"
      @update:current-page="emit('update:currentPage', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    >
      <template
        v-if="$slots['pagination-info']"
        #pagination-info="range"
      >
        <slot
          name="pagination-info"
          v-bind="range"
        />
      </template>
    </UiTablePagination>

    <div
      class="ui-table-container__status"
      v-bind="statusAttrs"
    >
      {{ announcement }}
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends TableData">
import MCheckbox from '#kit/components/ui/checkbox/index.vue'
import MLoading from '#kit/components/ui/loading/index.vue'
import UiTableHeader from '#kit/components/fragments/table/header/index.vue'
import UiTableMessage from '#kit/components/fragments/table/message/index.vue'
import UiTablePagination from '#kit/components/fragments/table/pagination/index.vue'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { resolveTableBody, tableColumnAlign } from '#kit/utils/table/model'
import { useTableControl } from '#kit/composables/table/useTableControl'
import { useTableSelection } from '#kit/composables/table/useTableSelection'
import { useTableWarnings } from '#kit/utils/table/warnings'
import type { MTableEmits, MTableErrorSlot, MTableProps, MTableSlots, SortState, TableColumn, TableData } from './types'

// The root is a scroll frame; `aria-*` and listeners name and describe the table itself.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()
const attrs = useAttrs()

// `onRowClick` is read, not only emitted to: a bound `row-click` listener is
// what makes the rows interactive, and only interactive rows show a hover layer.
const props = withDefaults(defineProps<MTableProps<T> & { onRowClick?: (row: T, event: MouseEvent) => void }>(), {
  density: 'default',
  selectable: false,
  selectedRows: () => [],
  loading: false,
  error: false,
  pagination: false,
  pageSize: 10,
  totalItems: 0,
  currentPage: 1,
})

const emit = defineEmits<MTableEmits<T>>()
const slots = defineSlots<MTableSlots<T>>()

const sortState = defineModel<SortState<T> | null>('sort', { default: null })

const viewport = useTemplateRef<HTMLElement>('viewport')
const tableElement = useTemplateRef<HTMLElement>('table')

const { isSelected, toggleRow, isAllSelected, toggleAll } = useTableSelection<T>({
  data: () => props.data,
  selectedRows: () => props.selectedRows,
  onChange: rows => emit('update:selectedRows', rows),
})

const body = computed(() => resolveTableBody({ loading: props.loading, error: props.error, rowCount: props.data.length }))
const hasCaption = computed(() => Boolean(props.caption || slots.caption))
const columnCount = computed(() => props.columns.length + (props.selectable ? 1 : 0))
const rowsInteractive = computed(() => props.selectable || Boolean(props.onRowClick))
// A failure is the more urgent news: while `error` carries a message it is
// what the status region says; `statusText` speaks again once it clears.
const announcement = computed(() => (typeof props.error === 'string' && props.error) || props.statusText || '')

const { captionId, viewportAttrs, tableAttrs, getRowAttrs, getRowNameId, getRowCheckboxAttrs, statusAttrs } = useTableControl<T>({
  viewport,
  table: tableElement,
  selectable: () => props.selectable,
  isSelected,
  busy: () => props.loading,
  hasCaption: () => hasCaption.value,
  label: () => attrs['aria-label'] as string | undefined,
  labelledBy: () => attrs['aria-labelledby'] as string | undefined,
  onRowClick: (row, event) => emit('row-click', row, event),
})

// The same payload for every message slot; only `#error` reads it.
const messageSlotProps = computed<MTableErrorSlot>(() => ({ error: props.error, retry: () => emit('retry') }))

// Slot names after the column key, typed as the slot families `defineSlots` declares.
const cellSlot = (column: TableColumn<T>) => `cell-${String(column.key)}` as const
const headerSlot = (column: TableColumn<T>) => `header-${String(column.key)}` as const

function cellText(row: T, column: TableColumn<T>) {
  const value = row[column.key]
  return column.format ? column.format(value, row) : value
}

useTableWarnings(() => ({
  named: hasCaption.value || Boolean(attrs['aria-label'] || attrs['aria-labelledby']),
  selectable: props.selectable,
  selectAllLabel: props.selectAllLabel,
  pagination: props.pagination,
  pageSizeSelector: Boolean(props.pageSizeOptions?.length),
  pageSizeLabel: props.pageSizeLabel,
  rangeSlot: Boolean(slots['pagination-info']),
  message: body.value.message,
  emptySlot: Boolean(slots.empty),
  error: props.error,
  errorSlot: Boolean(slots.error),
}))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/table/index' as t;
@use '#kit/assets/stylesheet/components/table/rows' as rows;

$t: t.$tokens;

// The fade's width, animated by the scroll position (progressive: see below).
@property --ui-table-fade {
  syntax: '<length>';
  inherits: false;
  initial-value: 0;
}

@keyframes ui-table-fade {
  from { --ui-table-fade: #{g($t, 'fade.size')}; }
  to { --ui-table-fade: 0; }
}

.ui-table-container {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  overflow: clip;
  border: g($t, 'container.outline.width') solid g($t, 'container.outline.color');
  border-radius: g($t, 'container.shape');
  background-color: g($t, 'container.color');

  &__viewport {
    --ui-scrollbar-inset-block: #{g($t, 'container.shape')};
    --ui-scrollbar-inset-inline: #{g($t, 'container.shape')};

    grid-area: 1 / 1;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-padding-inline-end: g($t, 'fade.size');

    // Its ring is the frame's (below): the browser's own would fade under the mask.
    &:focus-visible {
      outline: none;
    }

    // More columns beyond the edge fade out there. Driven by the scroll
    // position in CSS alone; where scroll timelines are missing the table just
    // scrolls, and a table that fits never animates at all.
    @supports (animation-timeline: scroll()) {
      mask-image: linear-gradient(to left, transparent, currentcolor var(--ui-table-fade));
      animation: ui-table-fade auto var(--sys-motion-easing-linear) both;
      animation-timeline: scroll(self inline);

      &:dir(rtl) {
        mask-image: linear-gradient(to right, transparent, currentcolor var(--ui-table-fade));
      }
    }
  }

  // The focus ring of the scroll region is drawn here, outside the region:
  // its edge fade is a mask, and a mask fades the region's own outline too.
  // `>`: a table nested in a cell must not light this frame.
  &:has(> .ui-table-container__viewport:focus-visible) {
    @include focus-ring(inset);
  }

  &__busy {
    z-index: 1;
    grid-area: 1 / 1;
    place-self: start center;
    pointer-events: none;
  }

  // A caption above the header: the indicator steps down by it. `translate`,
  // one rule for every density: the indicator is an overlay, out of the flow.
  &--captioned &__busy {
    translate: 0 g($t, 'busy.caption');
  }

  &__status {
    @include sr-only;
  }

  @each $step in ('compact', 'default', 'comfortable') {
    &--density-#{$step} &__busy {
      margin-block-start: g($t, 'density.#{$step}.busy');
    }
  }
}

.ui-table {
  @include rows.rows($t);

  // Every height of the table's parts that depends on the density, in one place.
  @each $step in ('compact', 'default', 'comfortable') {
    .ui-table-container--density-#{$step} & {
      &__head-row { height: g($t, 'density.#{$step}.header'); }
      &__sort { min-height: g($t, 'density.#{$step}.header'); }
      &__row { height: g($t, 'density.#{$step}.row'); }
      &__message-row { height: g($t, 'density.#{$step}.message'); }
    }
  }
}
</style>
