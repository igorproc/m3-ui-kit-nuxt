<script setup>
import { ModalsContainer } from 'vue-final-modal'
import 'vue-final-modal/style.css'

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

    <ModalsContainer />
  </div>
</template>
