<template>
  <m-layout class="wf-constrained">
    <m-app-bar>
      <template #container>
        <m-container>
          <m-col>
            <div class="wf-constrained__bar">
              <div class="wf-constrained__avatar" />

              <m-button
                v-for="link in links"
                :key="link"
                variant="text"
              >
                {{ link }}
              </m-button>

              <m-spacer />

              <m-responsive class="wf-constrained__search">
                <m-search
                  v-model="search"
                  placeholder="Search"
                />
              </m-responsive>
            </div>
          </m-col>
        </m-container>
      </template>
    </m-app-bar>

    <m-layout-main class="wf-constrained__main">
      <m-container class="wf-constrained__content">
        <m-row>
          <m-col
            tablet-xs="2"
            desktop-xs="2"
          >
            <div class="wf-constrained__panel">
              <m-list>
                <m-list-item
                  v-for="n in 5"
                  :key="n"
                  :headline="`List Item ${n}`"
                  interactive
                />

                <m-divider class="wf-constrained__divider" />

                <m-list-item
                  headline="Refresh"
                  interactive
                />
              </m-list>
            </div>
          </m-col>

          <m-col
            tablet-xs="6"
            desktop-xs="10"
          >
            <div class="wf-constrained__panel wf-constrained__panel--main" />
          </m-col>
        </m-row>
      </m-container>
    </m-layout-main>
  </m-layout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const links = [
  'Dashboard',
  'Messages',
  'Profile',
  'Updates',
]

const search = ref('')
</script>

<style lang="scss">
.wf-constrained {
  &__bar {
    display: flex;
    align-items: center;
    gap: 8rem;
    width: 100%;
  }

  &__avatar {
    flex: none;
    width: 32rem;
    height: 32rem;
    margin-inline-end: 8rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-surface-container-highest);
  }

  &__search {
    max-width: 160rem;
  }

  &__main {
    background-color: var(--md-sys-color-surface-container);
  }

  &__content {
    padding-block: 24rem;
  }

  &__panel {
    border-radius: 8rem;
    background-color: var(--md-sys-color-surface);

    &--main {
      min-height: 70vh;
    }
  }

  &__divider {
    margin-block: 8rem;
  }
}
</style>
