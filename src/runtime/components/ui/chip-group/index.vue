<template>
  <div
    class="ui-chip-group"
    :class="[
      `ui-chip-group--${direction}`,
      { 'ui-chip-group--wrap': wrap, 'ui-chip-group--scroll': direction === 'horizontal' && !wrap },
    ]"
    role="group"
  >
    <slot v-bind="groupSlot" />

    <template v-if="props.items">
      <template
        v-for="entry in entries"
        :key="entry.key"
      >
        <slot
          name="item"
          :item="entry.item"
          :index="entry.index"
          :value="entry.value"
          :selected="isSelected(entry.value)"
          :disabled="entry.disabled || props.disabled"
          :blocked="isBlocked(entry.value, entry.disabled)"
          :block-reason="blockReasonFor(entry.value, entry.disabled)"
          :props="{ value: entry.value, disabled: entry.disabled }"
        />
      </template>

      <slot
        v-if="!entries.length"
        name="empty"
        v-bind="groupSlot"
      />
    </template>
  </div>
</template>

<script setup lang="ts" generic="TItem, TValue = TItem">
/**
 * Groups chips under one stable-value model with roving focus.
 *
 * Selection is not reimplemented: `useSelectionGroup` stays the only source of
 * truth. This component adds a dedicated chip context (so chips never register
 * into an unrelated `<MSelectionGroup>`) plus an ordered element list used
 * solely for user-triggered focus movement.
 *
 * A descendant `MChip` without a `value` stays a normal standalone chip: it
 * does not register, keeps its own tab stop, and produces no warning. That
 * keeps assist/input/suggestion chips usable inside a group layout.
 */
import { computed, onScopeDispose, shallowReactive, toValue } from 'vue'
import type { ShallowRef } from 'vue'
import { useSelectionGroup } from '#kit/composables/selection/useSelectionGroup'
import { provideChipGroupContext } from '#kit/composables/chip-group/context'
import type {
  MChipGroupContext,
  MChipGroupTicket,
  MChipRegistration,
} from '#kit/composables/chip-group/context'
import type { SelectionBlockReason } from '#kit/composables/selection/context'
import type { MChipGroupProps } from './props'
import { mChipGroupProps } from './props'

const props = defineProps(mChipGroupProps) as MChipGroupProps<TItem, TValue> & {
  multiple: boolean
  mandatory: boolean | 'force'
  disabled: boolean
  direction: MChipGroupProps<TItem, TValue>['direction'] & string
  wrap: boolean
}

const model = defineModel<TValue | TValue[] | undefined>()

interface ChipGroupSlot<V> {
  selected: V[]
  multiple: boolean
  disabled: boolean
  selectionLimitReached: boolean
  select: (value: V) => void
  unselect: (value: V) => void
  toggle: (value: V) => void
}

interface ChipItemSlot<I, V> {
  item: I
  index: number
  value: V
  selected: boolean
  disabled: boolean
  blocked: boolean
  blockReason: SelectionBlockReason
  props: { value: V, disabled: boolean }
}

defineSlots<{
  default: (slot: ChipGroupSlot<TValue>) => unknown
  item: (slot: ChipItemSlot<TItem, TValue>) => unknown
  empty: (slot: ChipGroupSlot<TValue>) => unknown
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

function resolveKey(item: TItem, index: number): PropertyKey {
  const resolver = props.itemKey
  if (resolver === undefined) {
    const value = resolveValue(item, index)
    if (value !== null && typeof value === 'object') {
      if (import.meta.dev) {
        console.warn('[m3:chip-group] object item value without `item-key`; falling back to index.')
      }
      return index
    }
    return value as unknown as PropertyKey
  }
  if (typeof resolver === 'function') return resolver(item, index)
  return item[resolver] as unknown as PropertyKey
}

const entries = computed(() =>
  (props.items ?? []).map((item, index) => ({
    item,
    index,
    value: resolveValue(item, index),
    disabled: resolveDisabled(item, index),
    key: resolveKey(item, index),
  })),
)

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

const selection = group.context

/** View-only ordered list backing roving focus. Registration order is DOM order. */
interface ChipView {
  element: Readonly<ShallowRef<HTMLElement | null>>
  value: () => TValue
  blocked: () => boolean
}

const views = shallowReactive<ChipView[]>([])

const isSelected = (value: TValue) => selection.isSelected(value)

function isBlocked(value: TValue, disabled: boolean) {
  if (props.disabled || disabled) return true
  return !isSelected(value) && selection.selectionLimitReached.value
}

function blockReasonFor(value: TValue, disabled: boolean): SelectionBlockReason {
  if (props.disabled || disabled) return 'disabled'
  if (!isSelected(value) && selection.selectionLimitReached.value) return 'max'
  return null
}

/** Focus movement skips blocked chips, so a full group cycles its selection. */
const focusable = () => views.filter(view => !view.blocked())

function focusAt(list: ChipView[], index: number) {
  list[index]?.element.value?.focus()
}

function moveFocus(value: TValue, step: 1 | -1) {
  const list = focusable()
  if (!list.length) return
  const comparator = props.valueComparator ?? ((left: TValue, right: TValue) => left === right)
  const current = list.findIndex(view => comparator(view.value(), value))
  if (current === -1) {
    focusAt(list, step === 1 ? 0 : list.length - 1)
    return
  }
  // Wrap around: the group is a closed ring with one tab stop.
  focusAt(list, (current + step + list.length) % list.length)
}

const context: MChipGroupContext<TValue> = {
  multiple: selection.multiple,
  disabled: selection.disabled,
  selectionLimitReached: selection.selectionLimitReached,
  direction: computed(() => props.direction),
  select: selection.select,
  unselect: selection.unselect,
  toggle: selection.toggle,
  focusNext: value => moveFocus(value, 1),
  focusPrev: value => moveFocus(value, -1),
  focusFirst: () => focusAt(focusable(), 0),
  focusLast: () => {
    const list = focusable()
    focusAt(list, list.length - 1)
  },
  register(registration: MChipRegistration<TValue>): MChipGroupTicket<TValue> {
    const ticket = selection.register({
      value: registration.value,
      disabled: registration.disabled,
    })

    const view: ChipView = {
      element: registration.element,
      value: () => ticket.value.value,
      blocked: () => ticket.isSelectionBlocked.value,
    }
    views.push(view)

    // The chip's scope owns cleanup, so conditional rendering and data-driven
    // removal both drop the ticket and its view entry.
    onScopeDispose(() => {
      const index = views.indexOf(view)
      if (index !== -1) views.splice(index, 1)
      ticket.stop()
    })

    return {
      value: ticket.value,
      selected: ticket.isSelected,
      disabled: ticket.isDisabled,
      blocked: ticket.isSelectionBlocked,
      blockReason: ticket.blockReason,
      tabindex: computed(() => (activeView.value === view ? 0 : -1)),
      toggle: ticket.toggle,
      focus: () => registration.element.value?.focus(),
      stop: ticket.stop,
    }
  },
}

/** One tab stop: the first selected chip, otherwise the first focusable one. */
const activeView = computed(() => {
  const list = focusable()
  return list.find(view => isSelected(toValue(view.value()))) ?? list[0]
})

provideChipGroupContext(context as MChipGroupContext<unknown>)

const groupSlot = computed<ChipGroupSlot<TValue>>(() => ({
  selected: selection.selected.value,
  multiple: selection.multiple.value,
  disabled: selection.disabled.value,
  selectionLimitReached: selection.selectionLimitReached.value,
  select: selection.select,
  unselect: selection.unselect,
  toggle: selection.toggle,
}))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/chip-group/index' as t;

.ui-chip-group {
  $t: material-map(t.$tokens, 'md-chip-group');

  display: flex;
  align-items: center;
  gap: g($t, 'gap');

  &--horizontal { flex-direction: row; }

  &--vertical {
    flex-direction: column;
    align-items: flex-start;
  }

  &--wrap { flex-wrap: wrap; }

  // Native inline scrolling only: no arrows or drag until MSlideGroup lands.
  &--scroll {
    flex-wrap: nowrap;
    overflow-x: auto;

    // Keeps the chip focus ring from being clipped by the scroll container.
    padding-block: g($t, 'scroll-padding-block');
  }
}
</style>
