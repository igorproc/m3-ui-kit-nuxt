<template>
  <slot v-bind="groupScope()" />

  <component
    :is="rowsNode()"
    v-if="props.items && !rowsTaken()"
  />
</template>

<script setup lang="ts" generic="TItem, TValue = TItem">
/**
 * Headless selection: one model, a registry of items, and the state each item
 * needs — no element of its own. The markup, and with it every attribute
 * (`class`, `role`, `aria-*`), belongs to the consumer's wrapper and items;
 * an attribute passed to the group itself has nowhere to land and is dropped
 * (Vue warns in development).
 */
import { Fragment, computed, h } from 'vue'
import type { Component, VNodeArrayChildren } from 'vue'
import SelectionDataItem from '#kit/components/fragments/selection-group/data-item.vue'
import { useSelectionGroup } from '#kit/composables/selection/useSelectionGroup'
import { resolveEntries } from '#kit/utils/selection/resolveEntries'
import { groupPatternAttrs } from '#kit/utils/selection/patternAttrs'
import type { MSelectionPattern } from '#kit/utils/selection/patternAttrs'
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
    /** ARIA to hand out: `groupAttrs` for the wrapper, `attrs` for each item. */
    pattern?: MSelectionPattern
  }>(),
  {
    multiple: false,
    mandatory: false,
    disabled: false,
  },
)

const model = defineModel<TValue | TValue[] | undefined>()

const slots = defineSlots<{
  default: (slot: SelectionGroupSlot<TValue>) => unknown
  item: (slot: SelectionItemSlot<TItem, TValue>) => unknown
  empty: (slot: SelectionGroupSlot<TValue>) => unknown
}>()

const entries = computed(() => {
  const list = resolveEntries<TItem, TValue>(props.items ?? [], {
    itemValue: props.itemValue,
    itemDisabled: props.itemDisabled,
    itemKey: props.itemKey,
  }, 'm3:selection')

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

provideSelectionContext({ ...group.context, pattern: computed(() => props.pattern) } as MSelectionContext<unknown>)

const groupSlot = computed<SelectionGroupSlot<TValue>>(() => ({
  groupAttrs: groupPatternAttrs(props.pattern, props.multiple, props.disabled),
  selected: group.context.selected.value,
  isAllSelected: group.isAllSelected.value,
  isMixed: group.isMixed.value,
  selectionLimitReached: group.context.selectionLimitReached.value,
  selectAll: group.context.selectAll,
  unselectAll: group.context.unselectAll,
  toggleAll: group.context.toggleAll,
}))

function rowsNode() {
  if (!entries.value.length) return h(Fragment, null, (slots.empty?.(groupSlot.value) ?? []) as VNodeArrayChildren)

  return h(Fragment, null, entries.value.map(entry => h(SelectionDataItem as unknown as Component, {
    key: entry.key,
    item: entry.item,
    value: entry.value,
    disabled: entry.disabled,
    index: entry.index,
  }, { default: (itemSlot: SelectionItemSlot<TItem, TValue>) => slots.item?.(itemSlot) })))
}

let taken = false
const rowsTaken = () => taken

function groupScope(): SelectionGroupSlot<TValue> {
  taken = false
  const scope = { ...groupSlot.value }
  if (!props.items) return scope

  return Object.defineProperty(scope, 'rows', {
    get: () => {
      taken = true
      return rowsNode()
    },
  })
}
</script>
