<template>
  <m-layout
    class="wf-discord"
    full-height
  >
    <m-system-bar>
      <m-spacer />

      <span class="wf-discord__shape wf-discord__shape--square" />

      <span class="wf-discord__shape wf-discord__shape--circle" />

      <span class="wf-discord__shape wf-discord__shape--triangle" />
    </m-system-bar>

    <m-layout-aside
      class="wf-discord__rail"
      position="start"
      size-token="72rem"
      sticky
    >
      <div class="wf-discord__avatar wf-discord__avatar--me" />

      <m-divider class="wf-discord__rail-divider" />

      <div
        v-for="n in 6"
        :key="n"
        class="wf-discord__avatar"
      />
    </m-layout-aside>

    <m-layout-aside
      class="wf-discord__channels"
      position="start"
      size-token="244rem"
      sticky
    >
      <div class="wf-discord__banner" />

      <m-list>
        <m-list-item
          v-for="n in 5"
          :key="n"
          :headline="`Item ${n}`"
          interactive
        />
      </m-list>
    </m-layout-aside>

    <m-app-bar variant="small">
      <template #container>
        <div class="wf-discord__bar">
          <m-spacer />

          <div class="wf-discord__bar-search">
            <m-text-field
              v-model="search"
              placeholder="Search"
            />
          </div>
        </div>
      </template>
    </m-app-bar>

    <m-layout-main class="wf-discord__main" />

    <m-layout-aside
      class="wf-discord__members"
      position="end"
      size-token="256rem"
      sticky
    >
      <m-list>
        <m-list-item
          v-for="n in 5"
          :key="n"
          :headline="`Item ${n}`"
          interactive
        />
      </m-list>
    </m-layout-aside>

    <m-layout-footer
      class="wf-discord__footer"
      size-token="72rem"
      sticky
    >
      <m-text-field
        v-model="message"
        placeholder="Message"
      />
    </m-layout-footer>
  </m-layout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const search = ref('')
const message = ref('')
</script>

<style lang="scss">
.wf-discord {
  background-color: var(--md-sys-color-surface);

  &__shape {
    width: 12rem;
    height: 12rem;
    background-color: var(--md-sys-color-on-surface-variant);

    &--circle {
      border-radius: 50%;
    }

    &--triangle {
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }
  }

  &__rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 36rem;
    padding-block: 16rem;
    background-color: var(--md-sys-color-surface-container-high);
  }

  &__rail-divider {
    width: calc(100% - 24rem);
  }

  &__avatar {
    flex-shrink: 0;
    width: 28rem;
    height: 28rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-surface-container-highest);

    &--me {
      width: 36rem;
      height: 36rem;
      background-color: var(--md-sys-color-outline);
    }
  }

  &__channels {
    background-color: var(--md-sys-color-surface-container);
  }

  &__banner {
    width: 100%;
    height: 128rem;
    background-color: var(--md-sys-color-surface-container-high);
  }

  &__bar {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    padding-inline: 12rem;
  }

  &__bar-search {
    width: 156rem;
  }

  &__main {
    background-color: var(--md-sys-color-surface);
  }

  &__members {
    background-color: var(--md-sys-color-surface-container);
  }

  &__footer {
    display: flex;
    align-items: center;
    padding-inline: 16rem;
    background-color: var(--md-sys-color-surface-container);

    .ui-text-field {
      flex: 1 1 auto;
    }
  }

  .ui-text-field__control {
    border-radius: 999rem;
  }
}
</style>
