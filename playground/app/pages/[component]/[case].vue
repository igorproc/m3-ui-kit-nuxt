<template>
  <main
    class="fixture-page"
    :data-fixture-ready="ready || undefined"
  >
    <component :is="fixture" />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fixtures } from '~/utils/fixtures'

const route = useRoute()
const key = `${route.params.component}/${route.params.case}`
const fixture = fixtures[key]

if (!fixture) throw createError({ statusCode: 404, statusMessage: `No fixture ${key}` })

// Set once the fixture is hydrated; e2e waits for it before interacting.
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
</script>

<style lang="scss">
.fixture-page {
  padding: 24rem;
}
</style>
