<template>
  <thead>
    <tr class="ui-table__head-row">
      <th
        v-if="selectable"
        class="ui-table__head-cell ui-table__head-cell--checkbox"
      >
        <!-- A partial selection is not shown as mixed yet: MCheckbox has no indeterminate state. -->
        <MCheckbox
          :model-value="isAllSelected"
          :aria-label="selectAllLabel"
          @update:model-value="emit('toggle-all', $event)"
        />
      </th>
      <th
        v-for="column in columns"
        :key="String(column.key)"
        scope="col"
        class="ui-table__head-cell"
        :class="[`ui-table__head-cell--${tableColumnAlign(column)}`, { 'ui-table__head-cell--sortable': column.sortable }]"
        :style="{ width: column.width, minWidth: column.minWidth }"
        :aria-sort="column.sortable ? tableAriaSort(sort ?? null, column.key) : undefined"
      >
        <button
          v-if="column.sortable"
          type="button"
          class="ui-table__sort"
          @click="emit('update:sort', nextTableSort(sort ?? null, column.key))"
        >
          <span class="ui-table__head-label">
            <slot
              :name="`header-${String(column.key)}`"
              :column="column"
            >{{ column.label }}</slot>
          </span>
          <!-- Every sortable column keeps the icon's room, so sorting never re-flows the table. -->
          <MIcon
            class="ui-table__sort-icon"
            :class="{ 'ui-table__sort-icon--idle': sort?.key !== column.key }"
            :name="sort?.key === column.key && sort.direction === 'desc' ? ICONS.arrowDownward : ICONS.arrowUpward"
          />
        </button>
        <span
          v-else
          class="ui-table__head-label"
        >
          <slot
            :name="`header-${String(column.key)}`"
            :column="column"
          >{{ column.label }}</slot>
        </span>
      </th>
    </tr>
  </thead>
</template>

<script setup lang="ts" generic="T extends TableData">
import { ICONS } from '#kit/shared/constants/icons'
import MCheckbox from '#kit/components/ui/checkbox/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MTableHeaderProps, SortState, TableData } from '#kit/components/ui/table/types'
import { nextTableSort, tableAriaSort, tableColumnAlign } from '#kit/utils/table/model'

defineProps<MTableHeaderProps<T>>()

const emit = defineEmits<{
  'toggle-all': [value: boolean]
  'update:sort': [value: SortState<T> | null]
}>()
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/table/index' as t;

.ui-table {
  $t: t.$tokens;

  &__head-row {
    border-block-end: g($t, 'row.divider.width') solid g($t, 'row.divider.color');
    background-color: g($t, 'header.container.color');
  }

  &__head-cell {
    padding-inline: g($t, 'cell.padding.inline');
    color: g($t, 'header.content.color');
    text-align: start;
    white-space: nowrap;

    @include typescale(g($t, 'header.typography'));

    &--center {
      text-align: center;

      .ui-table__sort { justify-content: center; }
    }

    // In an end-aligned column the icon leads, so the label lines up with the
    // figures below it.
    &--end {
      text-align: end;

      .ui-table__sort { flex-direction: row-reverse; }
    }

    &--checkbox {
      width: g($t, 'cell.checkbox.width');
      padding-inline: g($t, 'cell.checkbox.padding.inline');
    }

    // The sort button is the whole cell, so the target is as tall as the row.
    &--sortable {
      padding: 0;
    }
  }

  &__sort {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    gap: g($t, 'header.gap');
    width: 100%;
    margin: 0;
    padding-inline: g($t, 'cell.padding.inline');
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-align: inherit;
    cursor: pointer;

    // State layer in the header's own content colour (craft.md §1).
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background-color: currentcolor;
      opacity: 0;
      pointer-events: none;
      transition: opacity g($t, 'state.duration') g($t, 'state.easing');
    }

    @include can-hover {
      &:hover::before { opacity: g($t, 'state.hover'); }
    }

    // Header cells sit edge to edge: the ring goes inside.
    &:focus-visible {
      @include focus-ring(inset);

      &::before { opacity: g($t, 'state.focus'); }
    }

    &:active::before { opacity: g($t, 'state.pressed'); }

    @include forced-colors {
      &:focus-visible { outline-color: Highlight; }
    }
  }

  &__head-label {
    min-width: 0;
  }

  &__sort-icon {
    flex-shrink: 0;
    font-size: g($t, 'header.sort.icon.size');
    color: g($t, 'header.sort.icon.color');

    &--idle { visibility: hidden; }
  }

}
</style>
