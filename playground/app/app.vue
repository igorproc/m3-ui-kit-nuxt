<template>
  <m-app>
    <NuxtPage />
  </m-app>
</template>

<script setup lang="ts">
import type { TDefinition } from '#kit/shared/types/kit'

// Fixtures are driven by the URL so a test can open any state combination
// directly: ?theme=light|dark and ?dir=ltr|rtl.
const route = useRoute()
const theme = useMaterialTheme()

watchEffect(() => {
  const requested = route.query.theme
  if (requested === 'light' || requested === 'dark') theme.definition = requested as TDefinition
})

useHead({
  title: () => `${route.path === '/' ? 'Fixtures' : route.path.slice(1)} · PrimeTime UI Kit`,
  htmlAttrs: {
    lang: 'en',
    dir: () => (route.query.dir === 'rtl' ? 'rtl' : 'ltr'),
  },
})
</script>
