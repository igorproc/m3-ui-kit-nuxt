<script setup lang="ts">
// Layout Aside area component
interface Props {
  position?: 'left' | 'right'
  sizeToken?: string
  order?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'left',
  sizeToken: undefined,
  order: undefined,
})

const area = computed(() => props.position)

const { layoutItemStyles } = useLayoutItem({
  id: `layout-aside-${props.position}`,
  area,
  sizeToken: computed(() => props.sizeToken),
  order: props.order,
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
