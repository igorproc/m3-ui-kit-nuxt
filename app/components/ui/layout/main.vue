<template>
  <main
    class="m-layout-main"
    :style="layoutItemStyles"
  >
    <slot />
  </main>
</template>

<script setup lang="ts">
// Main renders a <main> because it wraps arbitrary content that can't self-register
const { layoutItemStyles } = useLayoutItem({
  id: 'layout-main',
  area: 'main',
})
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
