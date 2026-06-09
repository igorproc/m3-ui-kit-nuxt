<template>
  <m-layout class="wf-three-column">
    <m-app-bar variant="small">
      <template #container>
        <div class="wf-three-column__bar">
          <div class="wf-three-column__avatar wf-three-column__avatar--mobile" />

          <m-spacer />

          <m-tabs
            v-model="activeTab"
            class="wf-three-column__tabs"
            :items="tabItems"
          />

          <m-spacer />

          <div class="wf-three-column__avatar wf-three-column__avatar--desktop" />
        </div>
      </template>
    </m-app-bar>

    <m-layout-main class="wf-three-column__main">
      <m-container>
        <m-row>
          <m-col desktop-xs="2">
            <div class="wf-three-column__sheet wf-three-column__sheet--side" />
          </m-col>

          <m-col desktop-xs="8">
            <div class="wf-three-column__sheet wf-three-column__sheet--content" />
          </m-col>

          <m-col desktop-xs="2">
            <div class="wf-three-column__sheet wf-three-column__sheet--side" />
          </m-col>
        </m-row>
      </m-container>
    </m-layout-main>
  </m-layout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const tabItems = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'messages', label: 'Messages' },
  { value: 'profile', label: 'Profile' },
  { value: 'updates', label: 'Updates' },
]

const activeTab = ref<string | null>('dashboard')
</script>

<style lang="scss">
.wf-three-column {
  &__bar {
    display: flex;
    align-items: center;
    gap: 8rem;
    min-height: calc(var(--ui-app-bar-height-small) - 16rem);
  }

  &__avatar {
    flex: none;
    inline-size: 32rem;
    block-size: 32rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-surface-container-highest);

    &--mobile {
      @media (width >= 1200px) {
        display: none;
      }
    }

    &--desktop {
      display: none;

      @media (width >= 1200px) {
        display: block;
      }
    }
  }

  &__tabs {
    flex: none;
    min-width: 0;
  }

  &__main {
    background-color: var(--md-sys-color-surface-container);
    padding-block: 24rem;
  }

  &__sheet {
    border-radius: 12rem;
    background-color: var(--md-sys-color-surface);

    &--side {
      min-height: 268rem;
    }

    &--content {
      min-height: 70vh;
    }
  }
}
</style>
