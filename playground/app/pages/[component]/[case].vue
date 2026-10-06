<template>
  <main class="fixture-page">
    <component :is="fixture" />
  </main>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { fixtureLoaders } from '~/utils/fixtures'

const route = useRoute()
const key = `${route.params.component}/${route.params.case}`
const load = fixtureLoaders[key]

if (!load) throw createError({ statusCode: 404, statusMessage: `No fixture ${key}` })

const fixture = defineAsyncComponent(load)
</script>

<style lang="scss">
.fixture-page {
  padding: 24rem;
}
</style>
