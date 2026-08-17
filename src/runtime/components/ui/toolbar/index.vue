<template>
  <div
    class="ui-toolbar"
    :class="toolbarClasses"
  >
    <slot>
      <template v-if="items && items.length">
        <template
          v-for="(item, index) in items"
          :key="item.id || index"
        >
          <slot
            name="item"
            :item="item"
            :index="index"
            :selected="resolveSelected(item)"
            :on-select="() => onSelect(item)"
          >
            <!-- Default rendering for items -->
            <component
              :is="getComponentForItem(item)"
              v-bind="getPropsForItem(item)"
              @click="onSelect(item)"
            >
              <Icon
                v-if="item.icon"
                :name="item.icon"
              />
              <template v-else-if="item.label">
                {{ item.label }}
              </template>
            </component>
          </slot>
        </template>
      </template>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from 'vue'
import { provideToolbarContext, useToolbar } from '#kit/composables/useToolbar'
import type { ToolbarModel, ToolbarValue } from '#kit/composables/useToolbar'
import type { ID } from '#kit/shared/types/registry'
import { mToolbarProps } from './props'
import type { MToolbarItem } from './props'

const UiButtonIcon = defineAsyncComponent(() => import('#kit/components/ui/button/icon/index.vue'))
const UiButton = defineAsyncComponent(() => import('#kit/components/ui/button/index.vue'))

/** @deprecated use `MToolbarItem` from `./props` */
export type ToolbarItem = MToolbarItem

const props = defineProps(mToolbarProps)

const emit = defineEmits<{
  (e: 'select', item: ToolbarItem): void
}>()

const modelValue = defineModel<ToolbarModel>()

// M3 toolbars are action containers, so selection is opt-in: only when a
// `v-model` is bound (or `multiple` is set) do we build a registry-backed
// instance. Otherwise the legacy `item.selected` + `emit('select')` flow is
// preserved exactly, so existing call sites are untouched.
const hasModel = computed(() => props.multiple || modelValue.value !== undefined)

const toolbar = hasModel.value
  ? useToolbar(modelValue, { multiple: () => props.multiple })
  : null

// Always provide the context (null when no model is bound) so slotted children
// can opt into registration without requiring the parent to bind a model.
provideToolbarContext(toolbar)

const itemValue = (item: ToolbarItem): ToolbarValue => (item.id as ToolbarValue)

// In model-bound mode the `items[]` entries must be registered as tickets (keyed
// by their `id`) so the registry can track/toggle their selection — mirrors the
// dropdown's `syncTickets`. The legacy emit path needs none of this.
const ticketIds = new Map<ToolbarValue, ID>()

function syncTickets() {
  if (!toolbar) return

  const wanted = new Set(props.items.map(itemValue))

  for (const item of props.items) {
    const val = itemValue(item)
    if (ticketIds.has(val)) continue
    const ticket = toolbar.register({ value: val, disabled: () => !!item.disabled })
    ticketIds.set(val, ticket.id)
  }

  for (const [val, id] of ticketIds) {
    if (wanted.has(val)) continue
    toolbar.unregister(id)
    ticketIds.delete(val)
  }
}

if (toolbar) watch(() => props.items, syncTickets, { immediate: true, deep: true })

const toolbarClasses = computed(() => [
  `ui-toolbar--layout-${props.layout}`,
  `ui-toolbar--type-${props.type}`,
])

// Selected state for an item: registry-driven when a model is bound, otherwise
// the item's own `selected` flag.
const resolveSelected = (item: ToolbarItem): boolean => {
  if (toolbar) return toolbar.isSelected(itemValue(item))
  return !!item.selected
}

const onSelect = (item: ToolbarItem) => {
  if (item.disabled) return

  // Model-bound: drive the registry by the item's registered ticket id; the
  // watch in `useToolbar` syncs the result back to `v-model`.
  if (toolbar) {
    const id = ticketIds.get(itemValue(item))
    if (id !== undefined) toolbar.toggle(id)
    return
  }

  // Legacy behavior: emit and let the consumer flip `item.selected`.
  emit('select', item)
}

const getComponentForItem = (item: ToolbarItem) => {
  if (item.component) return item.component
  // Use icon button if it has an icon and no label, otherwise standard button
  return (item.icon && !item.label) ? UiButtonIcon : UiButton
}

const getPropsForItem = (item: ToolbarItem) => {
  // We extract known properties to avoid passing them as html attributes
  const { id, icon, label, selected, disabled, component, ...rest } = item
  const isSelected = resolveSelected(item)

  // For buttons, we handle the `selected` state by switching to the `tonal` variant.
  // Standard toolbars use `text` buttons that become `tonal` when selected.
  const isButton = !item.component || item.component === 'MButton' || item.component === 'MIconButton'

  if (isButton) {
    return {
      variant: isSelected ? 'tonal' : 'text',
      disabled,
      ...rest,
    }
  }

  // If it's a custom component, just pass everything including selected
  return {
    selected: isSelected,
    disabled,
    ...rest,
  }
}
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/toolbar' as t;

.ui-toolbar {
  $t: material-map(t.$tokens, '');

  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 8rem;
  gap: 8rem;
  transition: all 0.2s ease;

  // Types
  &--type-standard {
    background-color: g($t, 'standard-container-color');
    border-radius: g($t, 'standard-container-shape');

    $shadow-color: map.get($theme-color-link, 'shadow');

    box-shadow:
      0 g($t, 'standard-container-elevation-umbra-y') g($t, 'standard-container-elevation-umbra-blur') g($t, 'standard-container-elevation-umbra-spread') color-mix(in srgb, $shadow-color g($t, 'standard-container-elevation-umbra-opacity'), transparent),
      0 g($t, 'standard-container-elevation-penumbra-y') g($t, 'standard-container-elevation-penumbra-blur') g($t, 'standard-container-elevation-penumbra-spread') color-mix(in srgb, $shadow-color g($t, 'standard-container-elevation-penumbra-opacity'), transparent),
      0 g($t, 'standard-container-elevation-ambient-y') g($t, 'standard-container-elevation-ambient-blur') g($t, 'standard-container-elevation-ambient-spread') color-mix(in srgb, $shadow-color g($t, 'standard-container-elevation-ambient-opacity'), transparent);
    height: g($t, 'standard-container-height');

    // Floating style implies width fits content usually,
    // but we let it be handled by its container or inline-flex
    display: inline-flex;
  }

  &--type-baseline {
    background-color: g($t, 'baseline-container-color');
    border-radius: g($t, 'baseline-container-shape');

    $shadow-color: map.get($theme-color-link, 'shadow');

    box-shadow:
      0 g($t, 'baseline-container-elevation-umbra-y') g($t, 'baseline-container-elevation-umbra-blur') g($t, 'baseline-container-elevation-umbra-spread') color-mix(in srgb, $shadow-color g($t, 'baseline-container-elevation-umbra-opacity'), transparent),
      0 g($t, 'baseline-container-elevation-penumbra-y') g($t, 'baseline-container-elevation-penumbra-blur') g($t, 'baseline-container-elevation-penumbra-spread') color-mix(in srgb, $shadow-color g($t, 'baseline-container-elevation-penumbra-opacity'), transparent),
      0 g($t, 'baseline-container-elevation-ambient-y') g($t, 'baseline-container-elevation-ambient-blur') g($t, 'baseline-container-elevation-ambient-spread') color-mix(in srgb, $shadow-color g($t, 'baseline-container-elevation-ambient-opacity'), transparent);
    height: g($t, 'baseline-container-height');
    width: 100%; // Bottom app bar is usually full width
  }

  // Layouts
  &--layout-vertical {
    flex-direction: column;
    height: auto;
    width: auto;
    padding-block: 16rem;
    padding-inline: 8rem;
  }

  &--layout-horizontal {
    flex-direction: row;
  }
}
</style>
