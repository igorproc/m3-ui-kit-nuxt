<template>
  <main class="ui-main">
    <slot />
  </main>
</template>

<script lang="ts">
/** @deprecated Use `<m-layout-main>` inside `<m-layout>`; `<m-main>` is removed in the next major. */
export default {}
</script>

<script setup lang="ts">
if (import.meta.dev) {
  console.warn('[m-main] is deprecated and will be removed in the next major: use <m-layout-main> inside <m-layout>.')
}
</script>

<style lang="scss">
.ui-main {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
