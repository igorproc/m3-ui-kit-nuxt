<template>
  <nav
    class="ui-navigation-rail"
    :class="{ 'ui-navigation-rail--expanded': isExpanded }"
    :style="layoutItemStyles"
  >
    <m-navigation-rail-item
      v-for="item in items"
      :key="item.id"
      :active="item.id === modelValue"
      :icon="item.icon"
      :label="item.label"
      :badge="item.badge"
      :expanded="isExpanded"
      @select="onSelect(item.id)"
    />
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface NavigationRailItem {
  id: string
  icon: string
  label: string
  badge?: number
}

interface Props {
  items: NavigationRailItem[]
  expanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
})

const bp = useBreakpoint()
const isExpanded = computed(() => bp.is.value.desktop || props.expanded)

const sizeToken = computed(() => {
  return isExpanded.value
    ? 'var(--ui-navigation-rail-width-expanded)'
    : 'var(--ui-navigation-rail-width)'
})

const { layoutItemStyles } = useLayoutItem({
  id: 'navigation-rail',
  position: 'left',
  sizeToken,
  order: 1, // Will be placed below app-bar
})

const modelValue = defineModel<string | null>({ default: null })

function onSelect(id: string) {
  modelValue.value = id
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/navigation-rail' as v;

.ui-navigation-rail {
  width: v.$width;
  padding-block: v.$padding-block;
  padding-inline: v.$padding-inline;
  border-radius: v.$border-radius;
  background-color: v.$bg-color;
  box-shadow: v.$shadow;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: v.$gap;
  color: v.$text-color;
  transition: width var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
  overflow: hidden;

  &--expanded {
    width: 256rem;
    align-items: flex-start;
  }
}
</style>
