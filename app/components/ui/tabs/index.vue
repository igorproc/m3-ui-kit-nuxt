<template>
  <div class="ui-tabs">
    <div
      class="ui-tabs__list"
      role="tablist"
      @keydown="onKeydown"
    >
      <m-tab
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :label="item.label"
        :icon="item.icon"
        :disabled="item.disabled"
      />

      <slot name="tabs" />
    </div>

    <slot name="panels" />

    <div
      v-if="$slots.default"
      class="ui-tabs__content"
      role="tabpanel"
    >
      <slot :value="selectedValue" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toValue } from 'vue'
import { createSingle } from '~/composables/registry/createSingle'
import { provideTabsContext } from '~/composables/tabs/useTabs'
import type { TabValue } from '~/composables/tabs/useTabs'
import MTab from './tab/index.vue'

interface TabItem {
  value: TabValue
  label: string
  icon?: string
  disabled?: boolean
}

interface Props {
  items?: TabItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: undefined,
})

const modelValue = defineModel<TabValue | null>({ default: null })

// `'force'` keeps one tab always active (auto-selects the first non-disabled
// tab on registration), matching the legacy default-to-first behavior. An
// external `v-model` value still overrides it via the apply watch below.
const sel = createSingle<{ value: TabValue, disabled?: boolean }>({ mandatory: 'force' })

const selectedValue = computed(() => sel.selectedValue.value ?? null)

watch(
  [() => modelValue.value, () => sel.size],
  ([v]) => {
    if (v === null || v === undefined) return
    if (sel.selectedValue.value !== v) sel.apply([v])
  },
  { immediate: true },
)

watch(sel.selectedValue, (v) => {
  if (v !== undefined && v !== modelValue.value) modelValue.value = v
})

// --- Keyboard navigation + ARIA id wiring ---------------------------------
// Roving focus: arrows move between non-disabled tabs (activation follows
// focus, per the M3 automatic-activation pattern); Home/End jump to the ends.
const idBase = useId()
const focusedValue = ref<TabValue | null>(null)

const safeId = (value: TabValue) => String(value).replace(/[^\w-]/g, '_')
const tabId = (value: TabValue) => `${idBase}-tab-${safeId(value)}`
const panelId = (value: TabValue) => `${idBase}-panel-${safeId(value)}`

function focusByOffset(target: 'next' | 'prev' | 'first' | 'last') {
  const tickets = sel.values().filter(ticket => !toValue(ticket.disabled))
  if (tickets.length === 0) return

  const currentIndex = tickets.findIndex(ticket => ticket.id === sel.selectedId.value)

  let nextIndex: number
  if (target === 'first') nextIndex = 0
  else if (target === 'last') nextIndex = tickets.length - 1
  else if (target === 'next') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % tickets.length
  else nextIndex = currentIndex <= 0 ? tickets.length - 1 : currentIndex - 1

  const ticket = tickets[nextIndex]
  if (!ticket) return

  sel.select(ticket.id)
  focusedValue.value = ticket.value as TabValue
}

function onKeydown(event: KeyboardEvent) {
  const handlers: Record<string, 'next' | 'prev' | 'first' | 'last'> = {
    ArrowRight: 'next',
    ArrowLeft: 'prev',
    Home: 'first',
    End: 'last',
  }

  const target = handlers[event.key]
  if (!target) return

  event.preventDefault()
  focusByOffset(target)
}

provideTabsContext({
  register: sel.register,
  unregister: sel.unregister,
  select: sel.select,
  get size() {
    return sel.size
  },
  selectedValue: sel.selectedValue,
  focusedValue,
  tabId,
  panelId,
})

defineExpose({ selectedValue })
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/tabs/index' as t;

.ui-tabs {
  $prefix: 'md-tabs';
  $t: material-map(t.$tokens, $prefix);

  display: flex;
  flex-direction: column;
  gap: g($t, 'list-gap');

  &__list {
    display: flex;
    align-items: stretch;
    border-bottom: g($t, 'list-border-width') solid g($t, 'list-border-color');
    width: 100%;
  }

  &__content {
    padding: g($t, 'content-padding');
  }
}
</style>
