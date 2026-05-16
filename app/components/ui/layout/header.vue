<script setup lang="ts">
// Layout Header area component
interface Props {
  sticky?: boolean
  sizeToken?: string
  order?: number
}

const props = withDefaults(defineProps<Props>(), {
  sticky: true,
  sizeToken: undefined,
  order: undefined,
})

const { layoutItemStyles } = useLayoutItem({
  id: 'layout-header',
  area: 'header',
  sizeToken: computed(() => props.sizeToken),
  order: props.order,
})

// Provide area context for children (like m-app-bar)
provideLayoutArea('header')
</script>

<template>
  <header
    class="m-layout-header"
    :class="{ 'm-layout-header--sticky': sticky }"
    :style="layoutItemStyles"
  >
    <slot />
  </header>
</template>

<style lang="scss">
.m-layout-header {
  &--sticky {
    position: sticky;
    top: 0;
    z-index: z(header);
  }
}
</style>
