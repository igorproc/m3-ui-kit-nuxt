<script setup lang="ts">
// Layout Header area component
interface Props {
  sticky?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sticky: true,
})

const { layoutItemStyles } = useLayoutItem({
  id: 'layout-header',
  area: 'header',
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
