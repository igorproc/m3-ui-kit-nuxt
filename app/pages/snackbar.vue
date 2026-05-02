<script setup lang="ts">
const isOpen = ref(false)

function open() {
  isOpen.value = true
}
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-snackbar
      </h2>

      <p class="ui-test-section__description">
        Snackbar with text label and optional action button, fixed at the bottom of the viewport.
      </p>
    </header>

    <ui-button @click="open">
      Show snackbar
    </ui-button>

    <ui-snackbar
      v-model="isOpen"
      label="Message archived"
      action-label="Undo"
      @action="isOpen = false"
    />
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
