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
        :disabled="currentPage === 1"
        @click="$emit('update:currentPage', currentPage - 1)"
      >
        <m-icon :name="ICONS.chevronLeft" />
      </m-button>

      <m-button
        variant="text"
        :disabled="isLastPage"
        @click="$emit('update:currentPage', currentPage + 1)"
      >
        <m-icon :name="ICONS.chevronRight" />
      </m-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'

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
.ui-table__pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8rem 16rem;
  gap: 24rem;
  border-top: 1rem solid var(--color-outline-variant);

  &-info {
    color: var(--color-on-surface-variant);

    @include typescale('body-small');
  }

  &-actions {
    display: flex;
    align-items: center;
    gap: 8rem;
  }
}
</style>
