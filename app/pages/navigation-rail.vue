<script setup lang="ts">
const items = [
  { id: 'home', icon: 'baseline-home', label: 'Home' },
  { id: 'favorites', icon: 'baseline-favorite-border', label: 'Favorites', badge: 5 },
  { id: 'settings', icon: 'baseline-settings', label: 'Settings' },
] as const

const activeId = ref<string | null>('home')
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-navigation-rail
      </h2>

      <p class="ui-test-section__description">
        Vertical navigation rail for medium and large screens.
      </p>
    </header>

    <div class="ui-test-navigation-rail-demo">
      <ui-navigation-rail
        v-model="activeId"
        :items="items"
      />

      <div class="ui-test-navigation-rail-demo__content">
        <p>
          Active destination: <strong>{{ activeId }}</strong>
        </p>
      </div>
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

.ui-test-navigation-rail-demo {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24rem;
  align-items: flex-start;

  &__content {
    padding: 16rem;
    border-radius: var(--sys-shape-corner-medium);
    background-color: var(--color-surface);
    border: 1rem solid var(--color-outline-variant);

    p {
      margin: 0;
      font-family: var(--md-sys-typescale-body-medium-font);
      font-size: var(--md-sys-typescale-body-medium-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
      font-weight: var(--md-sys-typescale-body-medium-weight);
    }
  }
}
</style>
