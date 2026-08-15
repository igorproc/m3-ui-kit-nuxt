<template>
  <div
    class="ui-dropdown"
    :class="{ 'ui-dropdown--open': isOpen, 'ui-dropdown--disabled': disabled }"
  >
    <dropdown-trigger
      :path="path"
      :label="label"
      :placeholder="placeholder"
    >
      <template #chips>
        <dropdown-selected-chips>
          <template #selected="slotProps">
            <slot
              name="selected"
              v-bind="slotProps"
            />
          </template>

          <template #chip="slotProps">
            <slot
              name="chip"
              v-bind="slotProps"
            />
          </template>
        </dropdown-selected-chips>
      </template>
    </dropdown-trigger>

    <dropdown-panel>
      <!-- List-style generic slot -->
      <template v-if="items?.length">
        <slot
          v-for="(item, index) in items"
          :key="item.id || index"
          :item="item"
          :index="index"
          :selected="isSelected(item)"
          :on-select="() => select(item)"
        />
      </template>

      <!-- Default slot for manual items -->
      <slot v-else-if="$slots.default" />

      <!-- Fallback to options loop -->
      <template v-else>
        <dropdown-option-row
          v-for="option in options"
          :key="String(option.value)"
          :option="option"
        />
      </template>
    </dropdown-panel>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { createSingle } from '~/composables/registry/createSingle'
import { createGroup } from '~/composables/registry/createGroup'
import { provideDropdownContext } from './context'
import type { DropdownContext, DropdownEntry, DropdownItem, DropdownOption, DropdownOptionTicket } from './types'
import { mDropdownProps } from './props'
import DropdownTrigger from '~/components/fragments/dropdown/trigger/index.vue'
import DropdownPanel from '~/components/fragments/dropdown/panel/index.vue'
import DropdownOptionRow from '~/components/fragments/dropdown/option/index.vue'
import DropdownSelectedChips from '~/components/fragments/dropdown/selected-chips/index.vue'

const props = defineProps(mDropdownProps)

const modelValue = defineModel<unknown>()
const isOpen = ref(false)

// Resolve a value the way the legacy API did: option/item value first, then id,
// then the raw entry itself (so primitive arrays still work).
const valueOf = (entry: DropdownEntry | unknown): unknown => {
  const e = entry as DropdownOption & DropdownItem
  return e?.value ?? e?.id ?? entry
}

// Source of truth for the registry: items first, then options.
const source = computed<DropdownEntry[]>(() =>
  props.items?.length ? props.items as DropdownEntry[] : props.options)

// --- Registry-backed selection -------------------------------------------
// Single mode → one selected value; multiple mode → batch select with chips.
const single = props.multiple ? null : createSingle<{ value: unknown }>({ mandatory: false })
const group = props.multiple ? createGroup<{ value: unknown }>() : null

// Map a resolved value to its registered ticket id.
const ticketIds = new Map<unknown, string | number>()

function syncTickets() {
  const sel = (single ?? group)!
  const wanted = new Set(source.value.map(valueOf))

  // Register new values.
  for (const entry of source.value) {
    const val = valueOf(entry)
    if (ticketIds.has(val)) continue
    const ticket = sel.register({ value: val })
    ticketIds.set(val, ticket.id)
  }

  // Unregister values that disappeared from the source.
  for (const [val, id] of ticketIds) {
    if (wanted.has(val)) continue
    sel.unregister(id)
    ticketIds.delete(val)
  }
}

watch(source, syncTickets, { immediate: true })

// Sync external v-model → registry.
watch(
  [() => modelValue.value, () => (single ?? group)!.size],
  ([v]) => {
    if (props.multiple) {
      group!.apply(Array.isArray(v) ? v : [])
      return
    }
    single!.apply(v === undefined || v === null ? [] : [v])
  },
  { immediate: true, deep: true },
)

// Sync registry → external v-model.
if (props.multiple) {
  watch(() => Array.from(group!.selectedValues.value), (vals) => {
    const current = Array.isArray(modelValue.value) ? modelValue.value : []
    if (vals.length !== current.length || vals.some((x, i) => x !== current[i])) {
      modelValue.value = vals
    }
  })
} else {
  watch(single!.selectedValue, (v) => {
    if (v !== modelValue.value) modelValue.value = v
  })
}

// --- Derived view state ---------------------------------------------------
const selectedItems = computed<DropdownEntry[]>(() => {
  if (!props.multiple) return []
  const vals = Array.from(group!.selectedValues.value)
  return vals.map(val =>
    source.value.find(entry => valueOf(entry) === val)
    ?? ({ value: val, label: String(val) } as DropdownEntry))
})

const selectedLabel = computed(() => {
  if (props.multiple) return ''
  const val = single!.selectedValue.value
  const entry = source.value.find(e => valueOf(e) === val) as DropdownItem | undefined
  return entry?.label ?? ''
})

const hasSelection = computed(() =>
  props.multiple ? selectedItems.value.length > 0 : !!selectedLabel.value)

const fieldFocused = computed(() => isOpen.value || hasSelection.value)

// --- Actions --------------------------------------------------------------
function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function select(entry: DropdownEntry) {
  const val = valueOf(entry)
  const id = ticketIds.get(val)

  if (props.multiple) {
    if (id !== undefined) group!.toggle(id)
    return
  }

  if (id !== undefined) single!.select(id)
  close()
}

function remove(entry: DropdownEntry) {
  const id = ticketIds.get(valueOf(entry))
  if (id !== undefined) group?.unselect(id)
}

function isSelected(entry: DropdownEntry | unknown): boolean {
  const val = valueOf(entry)
  if (props.multiple) return Array.from(group!.selectedValues.value).includes(val)
  return single!.selectedValue.value === val
}

function open() {
  if (props.disabled) return
  isOpen.value = true
}

// --- Combobox/listbox keyboard navigation ---------------------------------
// Options register themselves (in DOM order) so the orchestrator can move a
// virtual focus (`aria-activedescendant`) through them while real focus stays
// on the combobox trigger.
const listboxId = useId() as string
const triggerEl = ref<HTMLElement | null>(null)

interface OptionEntry {
  id: string
  entry: DropdownEntry
  el: Ref<HTMLElement | null>
}

// `shallowRef` (not `ref`): the array holds option records whose `el` is itself
// a `Ref`; a deep `ref` would unwrap that nested ref. Mutations reassign the
// array to trigger reactivity.
const optionEntries = shallowRef<OptionEntry[]>([])
const activeIndex = ref(-1)

const activeDescendant = computed(() =>
  activeIndex.value >= 0 ? optionEntries.value[activeIndex.value]?.id : undefined)

function setTriggerEl(el: HTMLElement | null) {
  triggerEl.value = el
}

function registerOption(entry: DropdownEntry, el: Ref<HTMLElement | null>): DropdownOptionTicket {
  const id = `${listboxId}-opt-${optionEntries.value.length}-${useId()}`
  const record: OptionEntry = { id, entry, el }
  optionEntries.value = [...optionEntries.value, record]

  const isActive = computed(() => activeDescendant.value === id)

  return {
    id,
    isActive,
    unregister: () => {
      optionEntries.value = optionEntries.value.filter(o => o !== record)
    },
  }
}

function moveActive(target: 'next' | 'prev' | 'first' | 'last') {
  const count = optionEntries.value.length
  if (count === 0) return

  let next: number
  if (target === 'first') next = 0
  else if (target === 'last') next = count - 1
  else if (target === 'next') next = activeIndex.value < 0 ? 0 : (activeIndex.value + 1) % count
  else next = activeIndex.value <= 0 ? count - 1 : activeIndex.value - 1

  activeIndex.value = next
  nextTick(() => {
    optionEntries.value[next]?.el.value?.scrollIntoView({ block: 'nearest' })
  })
}

function selectActive() {
  const record = optionEntries.value[activeIndex.value]
  if (record) select(record.entry)
}

function focusTrigger() {
  nextTick(() => triggerEl.value?.focus())
}

// Reset the virtual focus to the selected option (or top) whenever the popover
// opens; clear it on close.
watch(isOpen, (openState) => {
  if (!openState) {
    activeIndex.value = -1
    return
  }
  nextTick(() => {
    const selectedIdx = optionEntries.value.findIndex(o => isSelected(o.entry))
    activeIndex.value = selectedIdx >= 0 ? selectedIdx : (optionEntries.value.length ? 0 : -1)
  })
})

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  if (!isOpen.value) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open()
    }
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveActive('next')
      break
    case 'ArrowUp':
      event.preventDefault()
      moveActive('prev')
      break
    case 'Home':
      event.preventDefault()
      moveActive('first')
      break
    case 'End':
      event.preventDefault()
      moveActive('last')
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectActive()
      if (!props.multiple) focusTrigger()
      break
    case 'Escape':
      event.preventDefault()
      close()
      focusTrigger()
      break
    case 'Tab':
      close()
      break
  }
}

provideDropdownContext({
  multiple: computed(() => props.multiple),
  disabled: computed(() => props.disabled),
  variant: computed(() => props.variant),
  menuOrigin: computed(() => props.menuOrigin),
  isOpen: computed(() => isOpen.value),
  fieldFocused,
  selectedLabel,
  selectedItems,
  toggle,
  close,
  select,
  remove,
  isSelected,
  listboxId,
  activeDescendant,
  registerOption,
  open,
  onTriggerKeydown,
  setTriggerEl,
} satisfies DropdownContext)
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/dropdown' as *;

.ui-dropdown {
  $prefix: 'm-dropdown';
  $t: material-map($tokens, $prefix);

  position: relative;
  width: 100%;

  &__trigger {
    cursor: pointer;
  }

  &__field {
    pointer-events: none;
  }

  // Selected-value chips live inside the trigger's prepend slot. The field
  // itself is pointer-events:none (the wrapper handles the toggle); chips opt
  // back in so their remove affordance stays clickable.
  &__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: g($t, 'list-padding-vertical');
    pointer-events: auto;
  }

  &__chip {
    cursor: pointer;
  }

  &__field--multiple :deep(.ui-text-field__control) {
    height: auto;
    flex-wrap: wrap;
  }

  &__arrow {
    transition: transform g($t, 'state-duration') g($t, 'state-easing');
    font-size: g($t, 'arrow-size');
    color: g($t, 'arrow-color');
  }

  &--open &__arrow {
    transform: rotate(180deg);
  }

  &--disabled &__trigger {
    cursor: default;
  }

  &__menu {
    :deep(.ui-menu__surface) {
      width: 100%;
      min-width: unset;
      top: 0;
      right: 0;
      margin-top: g($t, 'menu-margin-top');
    }
  }

  &__list {
    padding: g($t, 'list-padding-vertical') 0;
  }
}
</style>
