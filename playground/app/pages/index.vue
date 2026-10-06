<template>
  <main class="fixture-page">
    <h1>PrimeTime UI Kit playground</h1>
    <ul>
      <li
        v-for="key in fixtureKeys"
        :key="key"
      >
        <NuxtLink :to="`/${key}`">
          {{ key }}
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { fixtureKeys } from '~/utils/fixtures'
</script>
