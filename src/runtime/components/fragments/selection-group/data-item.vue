<template>
  <slot v-bind="slotProps" />
</template>

<script setup lang="ts" generic="TItem, TValue">
import { computed } from 'vue'
import { useSelectionItem } from '#kit/composables/selection/useSelectionItem'
import type { SelectionItemSlot } from '#kit/composables/selection/context'

/**
 * Private data-driven item renderer for `<MSelectionGroup>`. Registers one
 * resolved data entry with the shared selection facade and forwards the parent
 * group's `#item` slot with the full item state. Not part of the public API.
 */
const props = defineProps<{
  item: TItem
  value: TValue
  disabled: boolean
  index: number
}>()

defineSlots<{
  default: (slot: SelectionItemSlot<TItem, TValue>) => unknown
}>()

const { state } = useSelectionItem<TValue>({
  value: () => props.value,
  disabled: () => props.disabled,
})

const slotProps = computed<SelectionItemSlot<TItem, TValue>>(() => ({
  ...state.value,
  item: props.item,
  index: props.index,
}))
</script>
