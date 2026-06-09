<template>
  <m-layout class="wf-system-bar">
    <m-system-bar>
      <m-spacer />

      <m-icon :name="ICONS.notifications" />

      <m-icon :name="ICONS.cloud" />

      <m-icon :name="ICONS.accessTime" />
    </m-system-bar>

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

    <m-layout-main class="wf-system-bar__main">
      <m-navigation-drawer v-model="drawer" />

      <m-container class="wf-system-bar__container">
        <template
          v-for="n in 4"
          :key="n"
        >
          <m-col class="wf-system-bar__category">
            <strong>Category {{ n }}</strong>
          </m-col>

          <m-col
            v-for="j in 6"
            :key="`${n}-${j}`"
            cols="2"
            tablet-xs="4"
            desktop-xs="2"
          >
            <div class="wf-system-bar__sheet" />
          </m-col>
        </template>
      </m-container>
    </m-layout-main>
  </m-layout>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'

definePageMeta({ layout: false })

const drawer = ref(false)
</script>

<style lang="scss">
.wf-system-bar {
  background-color: var(--md-sys-color-surface);

  &__main {
    background-color: var(--md-sys-color-surface-container);
  }

  &__container {
    padding-block: 16rem;
  }

  &__category {
    margin-block-start: 8rem;
    color: var(--md-sys-color-on-surface);
  }

  &__sheet {
    height: 150rem;
    border-radius: 8rem;
    background-color: var(--md-sys-color-surface-container-high);
  }
}
</style>
