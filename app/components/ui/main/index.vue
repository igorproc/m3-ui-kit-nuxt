<template>
  <main class="ui-main">
    <slot />
  </main>
</template>

<script setup lang="ts">
// ui-main is a simple wrapper that gets its padding from the layout CSS variables
</script>

<style lang="scss">
.ui-main {
  flex: 1 1 auto;
  padding-top: var(--ui-layout-top, 0);
  padding-right: var(--ui-layout-right, 0);
  padding-bottom: var(--ui-layout-bottom, 0);
  padding-left: var(--ui-layout-left, 0);
  transition: padding var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
}
</style>
