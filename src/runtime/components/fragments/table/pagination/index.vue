<template>
  <div class="ui-table__pagination">
    <div class="ui-table__pagination-info">
      <slot name="pagination-info">
        Items per page: {{ pageSize }}
      </slot>
    </div>

    <div class="ui-table__pagination-actions">
      <m-button
        variant="text"
        aria-label="Previous page"
        :disabled="currentPage === 1"
        @click="$emit('update:currentPage', currentPage - 1)"
      >
        <m-icon :name="ICONS.chevronLeft" />
      </m-button>

      <m-button
        variant="text"
        aria-label="Next page"
        :disabled="isLastPage"
        @click="$emit('update:currentPage', currentPage + 1)"
      >
        <m-icon :name="ICONS.chevronRight" />
      </m-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ICONS } from '#kit/shared/constants/icons'
import MButton from '#kit/components/ui/button/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'

interface Props {
  pageSize: number
  currentPage: number
  totalItems: number
}

const props = defineProps<Props>()

defineEmits<{
  'update:currentPage': [page: number]
}>()

const isLastPage = computed(() => {
  if (!props.totalItems) return true
  return props.currentPage * props.pageSize >= props.totalItems
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/table/index' as t;

.ui-table__pagination {
  $t: material-map(t.$tokens, 'md-table');

  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: g($t, 'pagination-padding');
  gap: g($t, 'pagination-gap');
  border-top: g($t, 'pagination-border-width') solid g($t, 'pagination-border-color');

  &-info {
    color: g($t, 'pagination-info-color');

    @include typescale(g($t, 'pagination-info-text-type'));
  }

  &-actions {
    display: flex;
    align-items: center;
    gap: g($t, 'pagination-actions-gap');
  }
}
</style>
