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
            :selected="item.selected"
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
import { computed, defineAsyncComponent } from 'vue'

const UiButtonIcon = defineAsyncComponent(() => import('~/components/ui/button/icon/index.vue'))
const UiButton = defineAsyncComponent(() => import('~/components/ui/button/index.vue'))

export interface ToolbarItem {
  id: string
  icon?: string
  label?: string
  selected?: boolean
  disabled?: boolean
  component?: any
  [key: string]: any
}

interface Props {
  items?: ToolbarItem[]
  layout?: 'horizontal' | 'vertical'
  variant?: 'standard' | 'baseline'
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  layout: 'horizontal',
  variant: 'standard',
})

const emit = defineEmits<{
  (e: 'select', item: ToolbarItem): void
}>()

const toolbarClasses = computed(() => [
  `ui-toolbar--layout-${props.layout}`,
  `ui-toolbar--variant-${props.variant}`,
])

const onSelect = (item: ToolbarItem) => {
  if (item.disabled) return
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

  // For buttons, we handle the `selected` state by switching to the `tonal` variant.
  // Standard toolbars use `text` buttons that become `tonal` when selected.
  const isButton = !item.component || item.component === 'MButton' || item.component === 'MIconButton'

  if (isButton) {
    return {
      variant: selected ? 'tonal' : 'text',
      disabled,
      ...rest,
    }
  }

  // If it's a custom component, just pass everything including selected
  return {
    selected,
    disabled,
    ...rest,
  }
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/toolbar' as t;

.ui-toolbar {
  $t: material-map(t.$tokens, '');

  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 8rem;
  gap: 8rem;

  transition: all 0.2s ease;

  // Variants
  &--variant-standard {
    background-color: g($t, 'standard-container-color');
    border-radius: g($t, 'standard-container-shape');

    $shadow-color: var(--color-shadow, #000);
    box-shadow:
      0 g($t, 'standard-container-elevation-umbra-y') g($t, 'standard-container-elevation-umbra-blur') g($t, 'standard-container-elevation-umbra-spread') color-mix(in srgb, $shadow-color g($t, 'standard-container-elevation-umbra-opacity'), transparent),
      0 g($t, 'standard-container-elevation-penumbra-y') g($t, 'standard-container-elevation-penumbra-blur') g($t, 'standard-container-elevation-penumbra-spread') color-mix(in srgb, $shadow-color g($t, 'standard-container-elevation-penumbra-opacity'), transparent),
      0 g($t, 'standard-container-elevation-ambient-y') g($t, 'standard-container-elevation-ambient-blur') g($t, 'standard-container-elevation-ambient-spread') color-mix(in srgb, $shadow-color g($t, 'standard-container-elevation-ambient-opacity'), transparent);

    height: g($t, 'standard-container-height');
    // Floating style implies width fits content usually,
    // but we let it be handled by its container or inline-flex
    display: inline-flex;
  }

  &--variant-baseline {
    background-color: g($t, 'baseline-container-color');
    border-radius: g($t, 'baseline-container-shape');

    $shadow-color: var(--color-shadow, #000);
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
