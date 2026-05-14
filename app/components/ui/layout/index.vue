<template>
  <div
    class="m-layout"
    :class="{ 'm-layout--full-height': fullHeight }"
    :style="layoutStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  fullHeight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fullHeight: false,
})

const { layoutStyles } = createLayout()
</script>

<style lang="scss">
.m-layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "left   main   right"
    "footer footer footer";
  grid-template-columns:
    var(--m3-layout-left-width, 0px)
    minmax(0, 1fr)
    var(--m3-layout-right-width, 0px);
  grid-template-rows:
    var(--m3-layout-header-height, 0px)
    minmax(0, 1fr)
    var(--m3-layout-footer-height, 0px);
  min-height: 100dvh;
  contain: layout style;

  &--full-height {
    height: 100dvh;
    overflow: hidden;
  }
}
</style>
