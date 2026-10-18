<template>
  <div
    class="orders-fab"
    :style="placement"
  >
    <MFabMenu
      v-model:open="open"
      :items="ITEMS"
      color="primary"
      aria-label="Создать"
      @select="item => emit('select', item.value as FabAction)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MFabMenuItem } from '#kit/components/ui/fab-menu/props'
import type { FabAction } from './data/model'

const emit = defineEmits<{
  (event: 'select', action: FabAction): void
}>()

const open = ref(false)

const ITEMS: MFabMenuItem[] = [
  { label: 'Новый заказ', icon: 'ic:outline-add-shopping-cart', value: 'order' },
  { label: 'Оформить возврат', icon: 'ic:outline-assignment-return', value: 'return' },
  { label: 'Импорт из CSV', icon: 'ic:outline-upload-file', value: 'import' },
]

// The layout publishes how far its pinned bars reach into the viewport, so the
// FAB clears the bottom navigation bar on compact screens. Its `right` inset is
// the inline-end footprint whatever the direction, hence `inset-inline-end`.
const zone = useLayoutZone()
const placement = computed(() => ({
  insetBlockEnd: `calc(${zone?.insets.bottom ?? '0px'} + 16rem)`,
  insetInlineEnd: `calc(${zone?.insets.right ?? '0px'} + 16rem)`,
}))
</script>

<style lang="scss">
.orders-fab {
  position: fixed;
  z-index: 1;
}
</style>
