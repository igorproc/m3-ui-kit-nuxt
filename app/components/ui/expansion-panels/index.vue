<template>
  <div class="ui-expansion-panels">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { createGroup } from '~/composables/registry/createGroup'
import { createSingle } from '~/composables/registry/createSingle'
import { mExpansionPanelsProps } from './props'
import {
  provideExpansionPanelGroupContext,
} from '~/composables/expansion-panel/useExpansionPanelGroup'
import type {
  ExpansionPanelGroupContext,
  PanelValue,
} from '~/composables/expansion-panel/useExpansionPanelGroup'
import type { GroupTicket } from '~/composables/registry/createGroup'
import type { ID } from '~~/shared/types/registry'

const props = defineProps(mExpansionPanelsProps)

// Open value(s): an array when `multiple`, a single value/undefined otherwise.
const modelValue = defineModel<PanelValue | PanelValue[] | undefined>({ default: undefined })

// Minimal shared surface both single + group instances satisfy structurally.
interface PanelSelection {
  size: number
  values: () => GroupTicket<{ value: PanelValue }>[]
  selectedValues: ComputedRef<Set<PanelValue>>
  register: (ticket: { value: PanelValue, disabled?: unknown }) => GroupTicket<{ value: PanelValue }>
  unregister: (id: ID) => void
  toggle: (ids: ID | ID[]) => void
  apply: (values: unknown[]) => void
}

// `reactive: true` keeps the ticket collection (and `sel.size`) reactive so the
// model->selection watch re-applies once slotted panels register — fixes a
// preset v-model not opening its panel at mount.
const sel = (props.multiple
  ? createGroup<{ value: PanelValue }>({ reactive: true })
  : createSingle<{ value: PanelValue }>({ mandatory: () => props.mandatory, reactive: true })) as unknown as PanelSelection

const modelAsArray = computed(() => {
  const value = modelValue.value
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
})

// External v-model -> selection.
watch(
  [() => modelAsArray.value, () => sel.size],
  () => sel.apply(modelAsArray.value),
  { immediate: true, deep: true },
)

// Selection -> external v-model.
watch(
  () => Array.from(sel.selectedValues.value) as PanelValue[],
  (values) => {
    if (props.multiple) {
      const current = modelAsArray.value
      const changed = current.length !== values.length
        || values.some(value => !current.includes(value))
      if (changed) modelValue.value = values
    } else {
      const next = values[0]
      if (next !== modelValue.value) modelValue.value = next
    }
  },
)

function ticketsFor(value: PanelValue) {
  return sel.values()
    .filter(ticket => ticket.value === value)
    .map(ticket => ticket.id)
}

function toggle(value: PanelValue) {
  const ids = ticketsFor(value)
  if (ids.length === 0) return

  if (props.multiple) {
    sel.toggle(ids)
  } else {
    sel.toggle(ids[0]!)
  }
}

const context: ExpansionPanelGroupContext = {
  multiple: props.multiple,
  register: ({ value, disabled }) => sel.register({ value, disabled }),
  unregister: id => sel.unregister(id),
  toggle,
  isOpen: value => sel.selectedValues.value.has(value),
}

provideExpansionPanelGroupContext(context)
</script>
