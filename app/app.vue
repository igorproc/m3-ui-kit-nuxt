<script setup lang="ts">
// Initialize the theme store to apply global HTML attributes and dynamic CSS
const themeStore = useThemeStore()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />

    <NuxtPage />

    <client-only>
      <core-scope />
    </client-only>
  </div>
</template>
