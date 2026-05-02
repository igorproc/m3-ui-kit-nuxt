<script setup lang="ts">
const variant = ref<'center-aligned' | 'small'>('center-aligned')
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-app-bar
      </h2>

      <p class="ui-test-section__description">
        Top app bar with navigation slot, title/subtitle and actions, following Material 3 small and center-aligned variants.
      </p>

      <div class="ui-test-section__controls">
        <label class="ui-test-toggle">
          <input
            v-model="variant"
            type="radio"
            value="center-aligned"
          >
          <span>center-aligned</span>
        </label>

        <label class="ui-test-toggle">
          <input
            v-model="variant"
            type="radio"
            value="small"
          >
          <span>small</span>
        </label>
      </div>
    </header>

    <div class="ui-test-app-bar-preview">
      <ui-app-bar
        :variant="variant"
        title="Playground"
        subtitle="Material 3 top app bar"
      >
        <template #nav>
          <button
            type="button"
            class="ui-test-app-bar-preview__icon-button"
            aria-label="Open navigation"
          >
            <ui-icon name="baseline-menu" />
          </button>
        </template>

        <template #actions>
          <button
            type="button"
            class="ui-test-app-bar-preview__icon-button"
            aria-label="Search"
          >
            <ui-icon name="baseline-search" />
          </button>

          <button
            type="button"
            class="ui-test-app-bar-preview__icon-button"
            aria-label="More actions"
          >
            <ui-icon name="baseline-more-vert" />
          </button>
        </template>
      </ui-app-bar>
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

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12rem;
    margin-top: 4rem;
  }
}

.ui-test-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8rem;
  cursor: pointer;

  input {
    accent-color: var(--color-primary);
  }
}

.ui-test-app-bar-preview {
  border-radius: var(--sys-shape-corner-large);
  overflow: hidden;
  background-color: var(--color-background);
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 8%);

  &__icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40rem;
    height: 40rem;
    border-radius: 999rem;
    border: none;
    padding: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;

    &:hover {
      background-color: color-mix(
        in srgb,
        var(--color-on-surface) 8%,
        transparent
      );
    }
  }
}
</style>
