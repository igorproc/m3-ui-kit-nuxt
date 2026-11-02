<template>
  <div
    class="ui-toolbar"
    :class="toolbarClasses"
    role="toolbar"
    :aria-label="ariaLabel"
    :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
  >
    <div class="ui-toolbar__container">
      <slot>
        <template
          v-for="(item, index) in shownItems"
          :key="item.id"
        >
          <slot
            name="item"
            v-bind="itemSlot(item, index)"
          >
            <MButtonIcon
              v-if="item.icon && !item.label"
              v-bind="controlProps(item)"
              :aria-label="item.ariaLabel"
              @click="onSelect(item)"
            >
              <MIcon :name="item.icon" />
            </MButtonIcon>

            <MButton
              v-else
              v-bind="controlProps(item)"
              :aria-label="item.ariaLabel"
              @click="onSelect(item)"
            >
              <template
                v-if="item.icon"
                #prepend
              >
                <MIcon :name="item.icon" />
              </template>

              {{ item.label }}
            </MButton>
          </slot>
        </template>

        <ToolbarOverflow
          v-if="hiddenItems.length"
          :items="hiddenItems"
          :label="moreLabel"
          :placement="menuPlacement"
          :role-of="menuRoleOf"
          :is-selected="resolveSelected"
          @select="onSelect"
        />
      </slot>
    </div>

    <div
      v-if="hasFab"
      class="ui-toolbar__fab"
    >
      <slot name="fab" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId, useSlots, watch, watchEffect } from 'vue'
import { provideToolbarContext, useToolbar } from '#kit/composables/useToolbar'
import type { ToolbarModel, ToolbarValue } from '#kit/composables/useToolbar'
import type { ID } from '#kit/shared/types/registry'
import MButton from '#kit/components/ui/button/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import ToolbarOverflow from '#kit/components/fragments/toolbar/overflow.vue'
import type { ToolbarMenuRole } from '#kit/components/fragments/toolbar/types'
import { useButtonNameWarning } from '#kit/utils/button/useButtonNameWarning'
import { useBoundProp } from '#kit/utils/text-field/supportLine'
import { mToolbarProps } from './props'
import type { MToolbarItem, MToolbarItemSlot } from './props'

const props = defineProps(mToolbarProps)
const slots = useSlots()

const emit = defineEmits<{
  (e: 'select', item: MToolbarItem): void
}>()

const modelValue = defineModel<ToolbarModel>()

// M3 toolbars are action containers, so selection is opt-in: it drives the
// items only while a `v-model` is bound (or `multiple` is set), whatever the
// bound value. Otherwise the item's own `selected` flag and `emit('select')` do.
const isBound = useBoundProp()
const hasModel = () => props.multiple || isBound('modelValue')

const toolbar = useToolbar(modelValue, { multiple: () => props.multiple })

provideToolbarContext(toolbar)

useButtonNameWarning('m-toolbar', () => props.ariaLabel)

const itemValue = (item: MToolbarItem): ToolbarValue => item.id

// In model-bound mode the `items[]` entries are registered as tickets keyed by
// their `id`, so the registry tracks and toggles their selection.
const ticketIds = new Map<ToolbarValue, ID>()
// Items that arrive after setup register outside it, where `useId()` has no
// instance to draw from: each ticket gets an id derived from this one instead.
const ticketBase = useId()

function syncTickets() {
  const wanted = new Set(props.items.map(itemValue))

  for (const item of props.items) {
    const val = itemValue(item)
    if (ticketIds.has(val)) continue
    const ticket = toolbar.register({ id: `${ticketBase}-${val}`, value: val, disabled: () => !!item.disabled })
    ticketIds.set(val, ticket.id)
  }

  for (const [val, id] of ticketIds) {
    if (wanted.has(val)) continue
    toolbar.unregister(id)
    ticketIds.delete(val)
  }
}

watch(() => props.items, syncTickets, { immediate: true, deep: true })

// A FAB pairs with the floating toolbar; a docked one spans the edge itself.
const hasFab = computed(() => Boolean(slots.fab) && props.type === 'floating')

const visibleCount = computed(() => props.maxVisible === undefined
  ? props.items.length
  : Math.max(0, Math.floor(props.maxVisible)))
const shownItems = computed(() => props.items.slice(0, visibleCount.value))
const hiddenItems = computed(() => props.items.slice(visibleCount.value))

const toolbarClasses = computed(() => [
  `ui-toolbar--orientation-${props.orientation}`,
  `ui-toolbar--type-${props.type}`,
  `ui-toolbar--scheme-${props.scheme}`,
  { 'ui-toolbar--with-fab': hasFab.value },
])

const resolveSelected = (item: MToolbarItem): boolean => {
  if (hasModel()) return toolbar.isSelected(itemValue(item))
  return !!item.selected
}

// A selectable item is a toggle: its state is announced, not only filled.
const isToggle = (item: MToolbarItem) => hasModel() || item.selected !== undefined

function onSelect(item: MToolbarItem) {
  if (item.disabled) return

  if (hasModel()) {
    const id = ticketIds.get(itemValue(item))
    if (id !== undefined) toolbar.toggle(id)
    return
  }

  emit('select', item)
}

// Selected is the tonal secondary fill of the button family; at rest an item
// is a text button in the bar's own content colour (see the styles).
function controlProps(item: MToolbarItem) {
  const selected = resolveSelected(item)

  return {
    'class': ['ui-toolbar__item', { 'ui-toolbar__item--selected': selected }],
    'variant': selected ? 'tonal' : 'text',
    'color': selected ? 'secondary' : undefined,
    'disabled': item.disabled,
    'aria-pressed': isToggle(item) ? String(selected) : undefined,
  } as const
}

function itemSlot(item: MToolbarItem, index: number): MToolbarItemSlot {
  return { item, index, selected: resolveSelected(item), onSelect: () => onSelect(item) }
}

function menuRoleOf(item: MToolbarItem): ToolbarMenuRole {
  if (!isToggle(item)) return 'menuitem'
  return hasModel() && !props.multiple ? 'menuitemradio' : 'menuitemcheckbox'
}

// The bar sits at the bottom edge when docked, so its menu opens upwards.
const menuPlacement = computed(() => {
  if (props.orientation === 'vertical') return 'end-start' as const
  return props.type === 'docked' ? 'top-end' as const : 'bottom-end' as const
})

if (import.meta.dev) {
  watchEffect(() => {
    if (props.type === 'docked' && props.orientation === 'vertical') {
      console.warn('[m-toolbar] a docked toolbar lies along the bottom edge: `orientation="vertical"` is for a floating one.')
    }
    if (slots.fab && props.type === 'docked') {
      console.warn('[m-toolbar] `#fab` pairs with a floating toolbar; a docked one renders no FAB slot.')
    }
    if (hiddenItems.value.length && !props.moreLabel) {
      console.warn('[m-toolbar] the "more" menu button has no accessible name: pass `moreLabel`.')
    }
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/toolbar' as t;

$t: material-map(t.$tokens, '');

.ui-toolbar {
  display: inline-flex;
  align-items: center;
  gap: g($t, 'floating.fab.gap');
  max-inline-size: 100%;

  &--type-docked {
    display: flex;
    inline-size: 100%;
  }

  &__container {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    min-inline-size: 0;
    box-sizing: border-box;
    background-color: g($t, 'scheme.standard.container.color');
    color: g($t, 'scheme.standard.content.color');
    transition:
      background-color g($t, 'motion.duration') g($t, 'motion.easing'),
      color g($t, 'motion.duration') g($t, 'motion.easing');

    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  &--type-floating &__container {
    min-block-size: g($t, 'floating.container.height');
    padding-block: g($t, 'floating.container.padding.block');
    padding-inline: g($t, 'floating.container.padding.inline');
    gap: g($t, 'floating.container.gap');
    border-radius: g($t, 'floating.container.shape');
    box-shadow: g($t, 'floating.container.elevation');
  }

  &--type-docked &__container {
    justify-content: space-between;
    min-block-size: g($t, 'docked.container.height');
    padding-inline: g($t, 'docked.container.padding.inline');
    gap: g($t, 'docked.container.gap');
    border-radius: g($t, 'docked.container.shape');
    box-shadow: g($t, 'docked.container.elevation');
  }

  &--scheme-vibrant &__container {
    background-color: g($t, 'scheme.vibrant.container.color');
    color: g($t, 'scheme.vibrant.content.color');
  }

  // A row that does not fit scrolls instead of pushing its container wider.
  &--orientation-horizontal &__container {
    overflow-x: auto;
    overscroll-behavior-x: contain;
  }

  &--orientation-vertical {
    flex-direction: column;
  }

  &--orientation-vertical &__container {
    flex-direction: column;
    padding-block: g($t, 'floating.vertical.padding.block');
    padding-inline: g($t, 'floating.vertical.padding.inline');
  }

  &__fab {
    display: inline-flex;
    flex: none;
  }
}

// At rest an item takes the bar's content colour, not its role's: the bar sets
// the scheme. A doubled class outranks the button's own colours in any chunk order.
.ui-toolbar__item.ui-button.ui-button--text:not(.ui-button--disabled) {
  color: inherit;
}

.ui-toolbar {
  &--scheme-vibrant .ui-toolbar__item--selected.ui-button:not(.ui-button--disabled) {
    background-color: g($t, 'scheme.vibrant.selected.container.color');
    color: g($t, 'scheme.vibrant.selected.content.color');
  }

  // The tonal fill is the selected look, and forced colors flatten it.
  @include forced-colors {
    &__item--selected.ui-button:not(.ui-button--disabled) {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
    }
  }
}
</style>
