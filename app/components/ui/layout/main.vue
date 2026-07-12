<template>
  <main
    class="m-layout-main"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <slot />
  </main>
</template>

<script setup lang="ts">
// Контентная зона — остаточный прямоугольник после выкраивания краёв.
// В full-height-режиме скроллится сама (overflow-y: auto)
const { layoutItemStyles, layoutItemAttrs } = useLayoutItem({ kind: 'main' })
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
