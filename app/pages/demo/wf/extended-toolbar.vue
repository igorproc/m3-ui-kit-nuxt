<template>
  <m-layout class="wf-extended-toolbar">
    <m-app-bar
      variant="medium"
      title="Application"
    >
      <template #nav>
        <m-button
          variant="text"
          class="wf-extended-toolbar__icon-button"
          aria-label="Open navigation"
        >
          <m-icon :name="ICONS.menu" />
        </m-button>
      </template>

      <template #actions>
        <m-button
          variant="text"
          class="wf-extended-toolbar__icon-button"
          aria-label="More options"
        >
          <m-icon :name="ICONS.settings" />
        </m-button>
      </template>
    </m-app-bar>

    <m-layout-main>
      <m-container class="wf-extended-toolbar__grid">
        <m-row>
          <m-col
            v-for="n in 24"
            :key="n"
            cols="2"
            tablet-xs="4"
            desktop-xs="4"
          >
            <m-card class="wf-extended-toolbar__card" />
          </m-col>
        </m-row>
      </m-container>
    </m-layout-main>
  </m-layout>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'

definePageMeta({ layout: false })
</script>

<style lang="scss">
.wf-extended-toolbar {
  min-height: 100dvh;
  background-color: var(--md-sys-color-surface);

  &__icon-button {
    font-size: 24rem;
  }

  &__grid {
    padding-block: 24rem;
  }

  &__card {
    height: 200rem;
    background-color: var(--md-sys-color-surface-container-high);
  }
}
</style>
