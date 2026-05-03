<script setup lang="ts">
const { definition, palette, contrast } = useThemeChanger()

const themeAttrs = computed(() => {
  return {
    'data-definition': definition.value,
    'data-pallet': palette.value,
    'data-contrast': contrast.value,
  }
})

useHead({ htmlAttrs: themeAttrs.value })
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
