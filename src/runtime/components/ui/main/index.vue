<template>
  <main class="ui-main">
    <slot />
  </main>
</template>

<script setup lang="ts">
// @deprecated — Use <m-layout-main> instead for CSS Grid layout
</script>

<style lang="scss">
.ui-main {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
