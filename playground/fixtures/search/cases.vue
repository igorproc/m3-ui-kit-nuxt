<template>
  <section class="fixture-cases">
    <h1>MSearch — edge cases</h1>

    <label for="consumer-search">Archive</label>
    <MSearch
      id="consumer-search"
      v-model="query"
      aria-label="Search the archive"
      clear-label="Clear the query"
      data-test="with-id"
      @clear="clears++"
    />

    <output data-test="clears">{{ clears }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MSearch from '#kit/components/ui/search/index.vue'

const query = ref('material')
const clears = ref(0)
</script>

<style lang="scss">
.fixture-cases {
  display: grid;
  gap: 16rem;
  max-width: 720rem;
}
</style>
