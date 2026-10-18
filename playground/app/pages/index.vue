<template>
  <main class="fixture-page">
    <h1>PrimeTime UI Kit playground</h1>
    <h2>Demos</h2>
    <ul>
      <li>
        <NuxtLink to="/demo/orders">
          Заказы магазина
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/demo/crm">
          CRM
        </NuxtLink>
      </li>
    </ul>
    <h2>Fixtures</h2>
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
