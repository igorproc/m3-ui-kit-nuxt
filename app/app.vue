<script setup lang="ts">
// Initialize the theme store to apply global HTML attributes and dynamic CSS
const themeStore = useThemeStore()
</script>

<template>
  <div>
    <div
      id="ui-overlay-host"
      class="ui-overlay-host"
    />

    <NuxtRouteAnnouncer />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <client-only>
      <core-scope />
    </client-only>
  </div>
</template>

<style lang="scss">
.ui-overlay-host {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: z('dialog');

  > * {
    pointer-events: auto;
  }
}
</style>
