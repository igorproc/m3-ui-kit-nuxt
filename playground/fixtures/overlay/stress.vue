<template>
  <section class="fixture-overlay-stress">
    <h1>MOverlay — bare, content taller than the window</h1>

    <MOverlay
      v-model="open"
      aria-label="Release notes"
    >
      <template #activator="{ props }">
        <MButton
          v-bind="props"
          data-test="open-bare"
        >
          Open release notes
        </MButton>
      </template>

      <article
        class="fixture-overlay-stress__card"
        data-test="bare-card"
      >
        <h2 data-test="bare-first">
          Release notes
        </h2>
        <p
          v-for="line in 30"
          :key="line"
        >
          Change {{ line }}: something small got better.
        </p>
        <MButton
          data-test="bare-last"
          @click="open = false"
        >
          Close
        </MButton>
      </article>
    </MOverlay>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'

const open = ref(false)
</script>

<style lang="scss">
.fixture-overlay-stress__card {
  inline-size: min(480rem, calc(100% - 32rem));
  padding: 24rem;
  border-radius: 28rem;
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
}
</style>
