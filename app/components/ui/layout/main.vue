<template>
  <main
    class="m-layout-main"
    :style="layoutItemStyles"
  >
    <slot />
  </main>
</template>

<script setup lang="ts">
interface Props {
  order?: number
}

const props = withDefaults(defineProps<Props>(), {
  order: undefined,
})

const { layoutItemStyles } = useLayoutItem({
  id: 'layout-main',
  area: 'main',
  order: props.order,
})

provideLayoutArea('main')
</script>

<style lang="scss">
.m-layout-main {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  container-type: inline-size;
  container-name: main-content;
}
</style>
