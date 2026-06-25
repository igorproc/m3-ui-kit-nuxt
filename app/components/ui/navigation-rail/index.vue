<template>
  <nav
    class="ui-navigation-rail"
    :class="{ 'ui-navigation-rail--expanded': isExpanded }"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <div class="ui-navigation-rail__list">
      <m-navigation-rail-item
        v-for="item in items"
        :key="item.id"
        :active="item.id === selectedValue"
        :icon="item.icon"
        :label="item.label"
        :badge="item.badge"
        :expanded="isExpanded"
        @select="onSelect(item.id)"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { createSingle } from '~/composables/registry/createSingle'
import { provideNavigationRailContext } from '~/composables/navigation/useNavigationRail'
import type { ID } from '~~/shared/types/registry'
import { mNavigationRailProps } from './props'

const props = defineProps(mNavigationRailProps)

const isExpanded = computed(() => props.expanded)

// Self-register in layout system — size token changes based on expanded state
const sizeToken = computed(() =>
  isExpanded.value
    ? '--ui-navigation-rail-width-expanded'
    : '--ui-navigation-rail-width',
)

// Первый уровень m-layout → start-зона (прижат sticky); внутри m-layout-aside —
// вклад ширины в зону (раскрытие меняет токен → грид анимируется)
const { layoutItemStyles, layoutItemAttrs } = useLayoutItem({
  kind: 'start',
  sizeToken,
  sticky: true,
})

const modelValue = defineModel<string | null>({ default: null })

// Single-select, non-mandatory: clicking a different destination selects it,
// matching the previous `item.id === modelValue` behavior.
const single = createSingle<{ value: string }>({ mandatory: false })

// The flat `items[]` path drives the registry directly: each entry is a ticket
// keyed by its `id`. Tickets are kept in sync as `items` changes.
const ticketIds = new Map<string, ID>()

function syncTickets() {
  const wanted = new Set(props.items.map(item => item.id))

  for (const item of props.items) {
    if (ticketIds.has(item.id)) continue
    const ticket = single.register({ value: item.id })
    ticketIds.set(item.id, ticket.id)
  }

  for (const [value, id] of ticketIds) {
    if (wanted.has(value)) continue
    single.unregister(id)
    ticketIds.delete(value)
  }
}

watch(() => props.items, syncTickets, { immediate: true, deep: true })

// Keep the registry in sync with the bound model.
watch(
  [() => modelValue.value, () => single.size],
  ([value]) => {
    if (value === null || value === undefined) {
      if (single.selectedValue.value !== undefined) single.apply([])
      return
    }
    if (single.selectedValue.value !== value) single.apply([value])
  },
  { immediate: true },
)

// Reflect registry selection back to the model.
watch(single.selectedValue, (value) => {
  if (value !== modelValue.value) modelValue.value = (value ?? null)
})

const selectedValue = computed(() => single.selectedValue.value ?? null)

provideNavigationRailContext({
  register: ticket => single.register(ticket),
  unregister: id => single.unregister(id),
  select: id => single.select(id),
  selectedValue: single.selectedValue,
  expanded: isExpanded,
})

function onSelect(id: string) {
  const ticketId = ticketIds.get(id)
  if (ticketId !== undefined) single.select(ticketId)
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/navigation-rail/index' as t;

// Width tokens exported globally (consumed by layouts and the rail's own width).
:root {
  --ui-navigation-rail-width: #{t.$width};
  --ui-navigation-rail-width-expanded: #{t.$width-expanded};
}

.ui-navigation-rail {
  $t: material-map(t.$tokens, 'md-navigation-rail');

  width: var(--ui-navigation-rail-width);
  border-radius: g($t, 'container-shape');
  background-color: g($t, 'container-color');
  box-shadow: g($t, 'container-shadow');
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: g($t, 'container-gap');
  color: g($t, 'container-text-color');
  transition: width var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
  overflow: hidden;

  // Вложенный в зону случай (m-layout-aside): прижат с учётом прибитых краёв
  // лейаута; на первом уровне generated-правило движка (#id > [data-m3-zone])
  // специфичнее и переопределяет это per-item оффсетами
  position: sticky;
  top: var(--m3-layout-inset-top, 0);
  height: calc(100dvh - var(--m3-layout-inset-top, 0px));
  z-index: z(aside);

  &__list {
    padding-block: g($t, 'container-padding-block');
    padding-inline: g($t, 'container-padding-inline');
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  &--expanded {
    width: var(--ui-navigation-rail-width-expanded);
  }
}
</style>
