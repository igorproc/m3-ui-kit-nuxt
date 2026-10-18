<template>
  <span class="order-row-actions">
    <MButtonIcon
      ref="trigger"
      density="compact"
      :aria-label="order.actions"
      aria-haspopup="menu"
      :aria-expanded="String(open)"
      @click="open = !open"
    >
      <MIcon name="ic:outline-more-vert" />
    </MButtonIcon>

    <MMenu
      v-model="open"
      absolute
      origin="top right"
    >
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        class="ui-menu__item"
        :disabled="action.disabled"
        @click="choose(action.id)"
      >
        <span class="ui-menu__item-label">{{ action.label }}</span>
      </button>
    </MMenu>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { OrderRow, OrderRowAction } from './data/model'
import { useMenuFocusReturn } from './useMenuFocusReturn'

const props = defineProps<{
  order: OrderRow
}>()

const emit = defineEmits<{
  (event: 'action', action: OrderRowAction, order: OrderRow): void
}>()

const open = ref(false)
const trigger = useTemplateRef<ComponentPublicInstance>('trigger')
useMenuFocusReturn(open, trigger)

const actions = computed(() => {
  const { status } = props.order
  const closed = status === 'cancelled' || status === 'returned'

  return [
    { id: 'open' as const, label: 'Открыть заказ', disabled: false },
    { id: 'print' as const, label: 'Печать накладной', disabled: status === 'cancelled' },
    { id: 'ship' as const, label: 'Передать в доставку', disabled: closed || status === 'shipped' || status === 'delivered' },
    { id: 'return' as const, label: 'Оформить возврат', disabled: status !== 'delivered' },
    { id: 'cancel' as const, label: 'Отменить заказ', disabled: closed || status === 'delivered' },
  ]
})

function choose(action: OrderRowAction) {
  open.value = false
  emit('action', action, props.order)
}
</script>

<style lang="scss">
.order-row-actions {
  display: inline-flex;
}
</style>
