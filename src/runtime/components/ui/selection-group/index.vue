<template>
  <slot v-bind="groupSlot" />

  <template v-if="props.items">
    <SelectionDataItem
      v-for="entry in entries"
      :key="entry.key"
      :item="entry.item"
      :value="entry.value"
      :disabled="entry.disabled"
      :index="entry.index"
    >
      <template #default="itemSlot">
        <slot
          name="item"
          v-bind="itemSlot"
        />
      </template>
    </SelectionDataItem>

    <slot
      v-if="!entries.length"
      name="empty"
      v-bind="groupSlot"
    />
  </template>
</template>

<script setup lang="ts" generic="TItem, TValue = TItem">
import { computed } from 'vue'
import SelectionDataItem from '#kit/components/fragments/selection-group/data-item.vue'
import { useSelectionGroup } from '#kit/composables/selection/useSelectionGroup'
import { provideSelectionContext } from '#kit/composables/selection/context'
import type {
  MSelectionContext,
  SelectionGroupSlot,
  SelectionItemSlot,
} from '#kit/composables/selection/context'

type ItemValueResolver<I, V> = keyof I | ((item: I, index: number) => V)
type ItemDisabledResolver<I> = keyof I | ((item: I, index: number) => boolean)
type ItemKeyResolver<I> = keyof I | ((item: I, index: number) => PropertyKey)

const props = withDefaults(
  defineProps<{
    /** Data-driven items rendered through the `#item` slot. */
    items?: readonly TItem[]
    /** Resolve each item's selection value (key or getter). */
    itemValue?: ItemValueResolver<TItem, TValue>
    /** Resolve each item's disabled state (key or getter). */
    itemDisabled?: ItemDisabledResolver<TItem>
    /** Resolve a stable v-for key (key or getter). */
    itemKey?: ItemKeyResolver<TItem>
    /** Allow multiple selection. */
    multiple?: boolean
    /** Enforce at least one selection; `'force'` also auto-selects the first. */
    mandatory?: boolean | 'force'
    /** Disable the whole group. */
    disabled?: boolean
    /** Maximum concurrent selections (multiple mode only). */
    max?: number
    /** Custom value equality (defaults to `===`). */
    valueComparator?: (left: TValue, right: TValue) => boolean
  }>(),
  {
    multiple: false,
    mandatory: false,
    disabled: false,
  },
)

const model = defineModel<TValue | TValue[] | undefined>()

defineSlots<{
  default: (slot: SelectionGroupSlot<TValue>) => unknown
  item: (slot: SelectionItemSlot<TItem, TValue>) => unknown
  empty: (slot: SelectionGroupSlot<TValue>) => unknown
}>()

function resolveValue(item: TItem, index: number): TValue {
  const resolver = props.itemValue
  if (resolver === undefined) return item as unknown as TValue
  if (typeof resolver === 'function') return resolver(item, index)
  return item[resolver] as unknown as TValue
}

function resolveDisabled(item: TItem, index: number): boolean {
  const resolver = props.itemDisabled
  if (resolver === undefined) return false
  if (typeof resolver === 'function') return !!resolver(item, index)
  return !!item[resolver]
}

function keyFromValue(value: TValue, index: number): PropertyKey {
  if (value !== null && typeof value === 'object') {
    if (import.meta.dev) {
      console.warn(
        '[m3:selection] object item value without `item-key`; falling back to index. '
        + 'Provide `item-key` for stable identity.',
      )
    }
    return index
  }
  return value as unknown as PropertyKey
}

function resolveKey(item: TItem, index: number): PropertyKey {
  const resolver = props.itemKey
  if (resolver === undefined) return keyFromValue(resolveValue(item, index), index)
  if (typeof resolver === 'function') return resolver(item, index)
  return item[resolver] as unknown as PropertyKey
}

const entries = computed(() => {
  const list = (props.items ?? []).map((item, index) => ({
    item,
    index,
    value: resolveValue(item, index),
    disabled: resolveDisabled(item, index),
    key: resolveKey(item, index),
  }))

  if (import.meta.dev) {
    const seen = new Set<PropertyKey>()
    for (const entry of list) {
      if (seen.has(entry.key)) {
        console.warn(
          `[m3:selection] duplicate item key "${String(entry.key)}"; selection identity may be unstable.`,
        )
      }
      seen.add(entry.key)
    }
  }

  return list
})

const group = useSelectionGroup<TValue>({
  multiple: () => props.multiple,
  mandatory: () => props.mandatory,
  disabled: () => props.disabled,
  max: () => props.max,
  comparator: () => props.valueComparator ?? ((left, right) => left === right),
  model: () => model.value,
  emitModel: (value) => {
    model.value = value
  },
})

provideSelectionContext(group.context as MSelectionContext<unknown>)

const groupSlot = computed<SelectionGroupSlot<TValue>>(() => ({
  selected: group.context.selected.value,
  isAllSelected: group.isAllSelected.value,
  isMixed: group.isMixed.value,
  selectionLimitReached: group.context.selectionLimitReached.value,
  selectAll: group.context.selectAll,
  unselectAll: group.context.unselectAll,
  toggleAll: group.context.toggleAll,
}))
</script>
