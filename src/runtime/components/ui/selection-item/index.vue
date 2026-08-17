<template>
  <slot v-bind="state" />
</template>

<script setup lang="ts" generic="TValue">
import { useSelectionItem } from '#kit/composables/selection/useSelectionItem'
import type { SelectionItemState } from '#kit/composables/selection/context'

const props = withDefaults(
  defineProps<{
    /** The item's selection value. */
    value: TValue
    /** Disable this item's selection. */
    disabled?: boolean
  }>(),
  { disabled: false },
)

defineSlots<{
  default: (state: SelectionItemState<TValue>) => unknown
}>()

const { state } = useSelectionItem<TValue>({
  value: () => props.value,
  disabled: () => props.disabled,
})
</script>
