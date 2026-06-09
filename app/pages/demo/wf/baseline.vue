<template>
  <m-layout class="wf-baseline">
    <m-app-bar
      variant="small"
      title="Application"
    >
      <template #nav>
        <m-button
          variant="text"
          aria-label="Toggle navigation drawer"
          @click="drawer = !drawer"
        >
          <m-icon :name="ICONS.menu" />
        </m-button>
      </template>
    </m-app-bar>

    <m-layout-main>
      <m-navigation-drawer v-model="drawer" />

      <div class="wf-baseline__canvas" />
    </m-layout-main>
  </m-layout>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'

definePageMeta({ layout: false })

const drawer = ref(false)
</script>

<style lang="scss">
.wf-baseline {
  background-color: var(--md-sys-color-surface);

  &__canvas {
    min-height: 600rem;
    margin: 24rem;
    border-radius: 16rem;
    background-color: var(--md-sys-color-surface-container-high);
  }
}
</style>
