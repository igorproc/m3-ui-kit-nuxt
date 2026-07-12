<template>
  <nav
    ref="navEl"
    class="ui-navigation-bar"
    :class="{ 'ui-navigation-bar--anchored': isLayoutChild }"
    :aria-label="ariaLabel"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
    @keydown="onKeydown"
  >
    <button
      v-for="(item, index) in items"
      :key="item.id"
      type="button"
      class="ui-navigation-bar__item"
      :class="{ 'ui-navigation-bar__item--active': item.id === selectedValue }"
      :aria-current="item.id === selectedValue ? 'page' : undefined"
      :tabindex="rovingIndex === index ? 0 : -1"
      @click="onSelect(item.id)"
      @focus="rovingIndex = index"
    >
      <span class="ui-navigation-bar__icon-wrapper">
        <m-icon
          class="ui-navigation-bar__icon"
          :name="item.icon"
          aria-hidden="true"
        />

        <m-badge
          v-if="item.badge != null && item.badge > 0"
          class="ui-navigation-bar__badge"
          :value="item.badge"
        />
      </span>

      <span class="ui-navigation-bar__label">
        {{ item.label }}
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { createSingle } from '~/composables/registry/createSingle'
import { provideNavigationBarContext } from '~/composables/navigation/useNavigationBar'
import type { ID } from '~~/shared/types/registry'
import { mNavigationBarProps } from './props'

const props = defineProps(mNavigationBarProps)

// Первый уровень m-layout → bottom-зона (прибит к низу, M3 nav bar всегда виден);
// высота — токеном, иначе sticky-низу нечем зарезервировать строку грида
const { layoutItemStyles, layoutItemAttrs, isLayoutChild } = useLayoutItem({
  kind: 'bottom',
  sizeToken: '--ui-navigation-bar-height',
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

provideNavigationBarContext({
  register: ticket => single.register(ticket),
  unregister: id => single.unregister(id),
  select: id => single.select(id),
  selectedValue: single.selectedValue,
})

function onSelect(id: string) {
  const ticketId = ticketIds.get(id)
  if (ticketId !== undefined) single.select(ticketId)
}

// --- Roving focus (APG: arrow keys move between destinations) -------------
const navEl = ref<HTMLElement | null>(null)
const rovingIndex = ref(0)

// Keep the tabbable item in sync with the selected destination.
watch(
  selectedValue,
  (value) => {
    const idx = props.items.findIndex(item => item.id === value)
    if (idx >= 0) rovingIndex.value = idx
  },
  { immediate: true },
)

function focusItem(index: number) {
  rovingIndex.value = index
  nextTick(() => {
    const buttons = navEl.value?.querySelectorAll<HTMLButtonElement>('.ui-navigation-bar__item')
    buttons?.[index]?.focus()
  })
}

function onKeydown(event: KeyboardEvent) {
  const count = props.items.length
  if (count === 0) return

  let next = rovingIndex.value
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = (rovingIndex.value + 1) % count
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      next = (rovingIndex.value - 1 + count) % count
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = count - 1
      break
    default:
      return
  }

  event.preventDefault()
  focusItem(next)
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/navigation-bar/index' as t;

.ui-navigation-bar {
  $t: material-map(t.$tokens, 'md-navigation-bar');

  @at-root :root {
    --ui-navigation-bar-height: #{g($t, 'container-height')};
  }

  display: flex;
  justify-content: space-around;
  align-items: center;
  height: var(--ui-navigation-bar-height);
  padding-inline: g($t, 'container-padding-inline');
  padding-block: g($t, 'container-padding-block');
  border-radius: g($t, 'container-shape');
  background-color: g($t, 'container-color');
  box-shadow: g($t, 'container-shadow');
  color: g($t, 'container-text-color');

  &__item {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: g($t, 'item-gap');
    padding-block: g($t, 'item-padding-block');
    border: none;
    background: transparent;
    cursor: pointer;
    color: g($t, 'item-color');

    @include typescale(g($t, 'item-typography'));
  }

  &__icon-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    font-size: g($t, 'icon-size');
  }

  &__badge {
    position: absolute;
    top: g($t, 'badge-top');
    right: g($t, 'badge-right');
  }

  &__label {
    max-width: g($t, 'label-max-width');
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item--active {
    color: g($t, 'item-active-color');
  }

  &--anchored {
    z-index: z(header);
  }
}
</style>
