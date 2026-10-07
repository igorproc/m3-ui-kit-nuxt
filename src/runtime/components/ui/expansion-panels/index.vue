<template>
  <div class="ui-expansion-panels">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { createGroup } from '#kit/composables/registry/createGroup'
import { mExpansionPanelsProps } from './props'
import {
  provideExpansionPanelGroupContext,
} from '#kit/composables/expansion-panel/useExpansionPanelGroup'
import type {
  ExpansionPanelGroupContext,
  PanelValue,
} from '#kit/composables/expansion-panel/useExpansionPanelGroup'

const props = defineProps(mExpansionPanelsProps)

// Open value(s): an array when `multiple`, a single value/undefined otherwise.
const modelValue = defineModel<PanelValue | PanelValue[] | undefined>({ default: undefined })

// One selection for both modes: `multiple` and `mandatory` are read on every
// operation, so switching them after mount needs no second instance that the
// panels would have to re-register into. `reactive: true` keeps the ticket
// collection reactive for the model watch below.
const sel = createGroup<{ value: PanelValue, disabled?: MaybeRefOrGetter<boolean> }>({
  reactive: true,
  multiple: () => props.multiple,
  mandatory: () => props.mandatory && !props.multiple,
})

const openValues = () => Array.from(sel.selectedValues.value) as PanelValue[]

const modelAsArray = computed(() => {
  const value = modelValue.value
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
})

// External v-model -> selection. Panels register after the group's setup and
// again when their `value` changes, so the model is re-applied whenever the
// registered values move — a preset v-model opens its panel at mount.
watch(
  [() => modelAsArray.value, () => sel.values().map(ticket => ticket.value)],
  () => sel.apply(modelAsArray.value),
  { immediate: true, deep: true },
)

// Selection -> external v-model.
watch(openValues, (values) => {
  if (props.multiple) {
    const current = modelAsArray.value
    const changed = current.length !== values.length
      || values.some(value => !current.includes(value))
    if (changed) modelValue.value = values
  } else {
    const next = values[0]
    if (next !== modelValue.value) modelValue.value = next
  }
})

// Switching modes keeps what is open; going exclusive keeps the first open panel.
watch(() => props.multiple, (multiple) => {
  const values = openValues()

  if (multiple) {
    modelValue.value = values
    return
  }

  const [first] = values
  sel.apply(first === undefined ? [] : [first])
  modelValue.value = first
})

function ticketsFor(value: PanelValue) {
  return sel.values()
    .filter(ticket => ticket.value === value)
    .map(ticket => ticket.id)
}

function toggle(value: PanelValue) {
  const ids = ticketsFor(value)
  if (ids.length === 0) return

  sel.toggle(props.multiple ? ids : ids[0]!)
}

const isOpen = (value: PanelValue) => sel.selectedValues.value.has(value)

const context: ExpansionPanelGroupContext = {
  get multiple() {
    return props.multiple
  },
  register: ({ value, disabled }) => sel.register({ value, disabled }),
  unregister: id => sel.unregister(id),
  toggle,
  isOpen,
  isLocked: value => props.mandatory && !props.multiple && isOpen(value),
}

provideExpansionPanelGroupContext(context)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/expansion-panel/index' as panel;

$t: panel.$tokens;

// Static corners: neighbours meet small and the group is rounded at its ends,
// with no shape change as panels open or close.
.ui-expansion-panels {
  display: flex;
  flex-direction: column;
  gap: g($t, 'group.gap');

  > .ui-expansion-panel {
    border-radius: g($t, 'group.shape.inner');

    &:first-child {
      border-start-start-radius: g($t, 'group.shape.outer');
      border-start-end-radius: g($t, 'group.shape.outer');
    }

    &:last-child {
      border-end-start-radius: g($t, 'group.shape.outer');
      border-end-end-radius: g($t, 'group.shape.outer');
    }
  }
}
</style>
