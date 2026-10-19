<template>
  <div class="ui-table__pagination">
    <div class="ui-table__pagination-info">
      <slot
        name="pagination-info"
        v-bind="range"
      />
    </div>

    <label
      v-if="pageSizeOptions?.length"
      class="ui-table__page-size"
    >
      <span>{{ pageSizeLabel }}</span>
      <span class="ui-table__page-size-control">
        <select
          class="ui-table__page-size-select"
          :value="range.pageSize"
          :disabled="loading"
          @change="onPageSize"
        >
          <option
            v-for="size in pageSizeOptions"
            :key="size"
            :value="size"
          >{{ size }}</option>
        </select>
        <MIcon
          class="ui-table__page-size-icon"
          :name="ICONS.arrowDropDown"
        />
      </span>
    </label>

    <div class="ui-table__pagination-actions">
      <MButtonIcon
        :aria-label="previousLabel"
        :disabled="loading || range.page <= 1"
        @click="emit('update:currentPage', range.page - 1)"
      >
        <MIcon
          class="ui-table__page-icon"
          :name="ICONS.chevronLeft"
        />
      </MButtonIcon>

      <MButtonIcon
        :aria-label="nextLabel"
        :disabled="loading || range.page >= range.pageCount"
        @click="emit('update:currentPage', range.page + 1)"
      >
        <MIcon
          class="ui-table__page-icon"
          :name="ICONS.chevronRight"
        />
      </MButtonIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Private footer of `<MTable>`: the page's numbers, an optional page size
 * selector and previous / next. Its wording comes from the table's props and
 * the `pagination-info` slot; the kit ships none of its own.
 */
import { ICONS } from '#kit/shared/constants/icons'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MTablePageRange } from '#kit/components/ui/table/types'
import { getTablePageRange } from '#kit/utils/table/model'

const props = defineProps<{
  pageSize: number
  currentPage: number
  totalItems: number
  pageSizeOptions?: number[]
  /** Navigation waits while a page loads, so one press asks for one page. */
  loading?: boolean
  pageSizeLabel?: string
  previousLabel?: string
  nextLabel?: string
}>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
}>()

defineSlots<{
  'pagination-info'?: (props: MTablePageRange) => unknown
}>()

const range = computed(() => getTablePageRange(props.currentPage, props.pageSize, props.totalItems))

// A new page size starts from the first page, as a new sort or query does.
function onPageSize(event: Event) {
  emit('update:pageSize', Number((event.target as HTMLSelectElement).value))
  emit('update:currentPage', 1)
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/table/index' as t;

.ui-table {
  $t: t.$tokens;

  &__pagination {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: g($t, 'pagination.gap');
    padding: g($t, 'pagination.padding.block') g($t, 'pagination.padding.inline');
    border-block-start: g($t, 'row.divider.width') solid g($t, 'row.divider.color');
    color: g($t, 'pagination.color');

    @include typescale(g($t, 'pagination.typography'));

    &-info {
      font-variant-numeric: tabular-nums;
    }

    &-actions {
      display: flex;
      align-items: center;
      gap: g($t, 'pagination.actions.gap');
    }
  }

  &__page-size {
    display: inline-flex;
    align-items: center;
    gap: g($t, 'pagination.actions.gap');

    &-control {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    // The native select keeps its keyboard, its picker on touch and its name
    // from the label; only its face is drawn.
    &-select {
      height: g($t, 'pagination.select.height');
      padding-inline: g($t, 'pagination.select.padding.start') g($t, 'pagination.select.padding.end');
      border: none;
      border-radius: g($t, 'pagination.select.shape');
      background-color: transparent;
      color: g($t, 'pagination.select.color');
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      appearance: none;
      transition: background-color g($t, 'state.duration') g($t, 'state.easing');

      @include typescale(g($t, 'pagination.select.typography'));

      // The select has no surface of its own, so the layer is its only fill.
      @include can-hover {
        &:hover:not(:disabled) {
          background-color: color-mix(in srgb, currentcolor #{g($t, 'state.hover')}, transparent);
        }
      }

      &:focus-visible {
        @include focus-ring;
      }

      &:disabled {
        color: color-mix(in srgb, currentcolor #{g($t, 'state.disabled')}, transparent);
        cursor: default;
      }

      @include forced-colors {
        border: 1px solid ButtonText;
      }
    }

    &-icon {
      position: absolute;
      inset-inline-end: g($t, 'pagination.select.icon.inset');
      font-size: g($t, 'pagination.select.icon.size');
      color: g($t, 'pagination.select.color');
      pointer-events: none;
    }

    // The arrow is part of the select's face: it dims with it.
    &-select:disabled + #{&}-icon {
      color: g($t, 'pagination.select.icon.disabled.color');
    }
  }

  // Previous and next follow the reading direction: in RTL the previous page
  // lies to the right, so both chevrons turn around.
  &__page-icon:dir(rtl) {
    scale: -1 1;
  }
}
</style>
