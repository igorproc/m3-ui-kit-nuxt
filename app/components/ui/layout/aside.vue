<script setup lang="ts">
// Layout Aside area component
interface Props {
  position?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  position: 'left',
})

const area = computed(() => props.position)

const { layoutItemStyles } = useLayoutItem({
  id: `layout-aside-${props.position}`,
  area,
})

// Provide area context for children
provideLayoutArea(area)
</script>

<template>
  <aside
    class="m-layout-aside"
    :class="`m-layout-aside--${position}`"
    :style="layoutItemStyles"
  >
    <slot />
  </aside>
</template>
