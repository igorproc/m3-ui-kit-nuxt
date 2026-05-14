<template>
  <nav
    class="ui-navigation-rail"
    :class="{ 'ui-navigation-rail--expanded': isExpanded }"
    :style="layoutItemStyles"
  >
    <div class="ui-navigation-rail__list">
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
    </div>
  </nav>
</template>

<script setup lang="ts">
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
const isExpanded = computed(() => props.expanded)

// Self-register in layout system — size token changes based on expanded state
const sizeToken = computed(() =>
  isExpanded.value
    ? '--ui-navigation-rail-width-expanded'
    : '--ui-navigation-rail-width',
)

const { layoutItemStyles } = useLayoutItem({
  id: 'navigation-rail',
  area: 'left',
  sizeToken,
})

const modelValue = defineModel<string | null>({ default: null })

function onSelect(id: string) {
  modelValue.value = id
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/navigation-rail' as v;

.ui-navigation-rail {
  width: var(--ui-navigation-rail-width);
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
  position: sticky;
  top: 0;
  height: 100dvh;
  z-index: z(aside);

  &__list {
    padding-block: v.$padding-block;
    padding-inline: v.$padding-inline;
  }

  &--expanded {
    width: var(--ui-navigation-rail-width-expanded);
    align-items: stretch;
  }
}
</style>
