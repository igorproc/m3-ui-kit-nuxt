<script setup lang="ts">
const items = [
  { id: 'home', icon: 'baseline-home', label: 'Home', badge: 3 },
  { id: 'search', icon: 'baseline-search', label: 'Search' },
  { id: 'library', icon: 'baseline-library-music', label: 'Library' },
] as const

const activeId = ref<string | null>('home')
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-navigation-bar
      </h2>

      <p class="ui-test-section__description">
        Bottom navigation bar with icons, labels and optional badges.
      </p>
    </header>

    <div class="ui-test-navigation-bar-demo">
      <ui-navigation-bar
        v-model="activeId"
        :items="items"
      />

      <p class="ui-test-navigation-bar-demo__debug">
        activeId: {{ activeId }}
      </p>
    </div>
  </section>
</template>

<style lang="scss">
.ui-test-section {
  display: flex;
  flex-direction: column;
  gap: 16rem;
  padding: 24rem;
  border-radius: var(--sys-shape-corner-medium);
  background-color: var(--color-surface);
  color: var(--color-surface-contrast);
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 8%);

  &__header {
    display: flex;
    flex-direction: column;
    gap: 8rem;
  }

  &__title {
    margin: 0;

    @include typescale('headline-small');
  }

  &__description {
    margin: 0;
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    font-weight: var(--md-sys-typescale-body-medium-weight);
    color: var(--color-surface-variant-contrast);
  }
}

.ui-test-navigation-bar-demo {
  display: flex;
  flex-direction: column;
  gap: 8rem;

  &__debug {
    margin: 0;
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    line-height: var(--md-sys-typescale-body-small-line-height);
    font-weight: var(--md-sys-typescale-body-small-weight);
    color: var(--color-surface-variant-contrast);
  }
}
</style>
