<script setup lang="ts">
const isOpen = ref(false)
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-navigation-drawer
      </h2>

      <p class="ui-test-section__description">
        Modal navigation drawer using a custom surface and list-like items.
      </p>
    </header>

    <ui-button
      variant="filled"
      @click="isOpen = true"
    >
      Open navigation drawer
    </ui-button>

    <dialog-navigation-drawer-list v-model="isOpen" />
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
</style>
