<script setup lang="ts">
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-divider
      </h2>

      <p class="ui-test-section__description">
        Horizontal and inset dividers to separate content inside lists and layouts.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Full-width
        </h3>

        <div class="ui-test-divider-demo">
          <p>Item one</p>
          <ui-divider />
          <p>Item two</p>
          <ui-divider />
          <p>Item three</p>
        </div>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Inset
        </h3>

        <div class="ui-test-divider-demo">
          <p>Item one</p>
          <ui-divider variant="inset" />
          <p>Item two</p>
          <ui-divider variant="inset" />
          <p>Item three</p>
        </div>
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

.ui-test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260rem, 1fr));
  gap: 24rem;

  &__column {
    display: flex;
    flex-direction: column;
    gap: 12rem;
  }

  &__subtitle {
    margin: 0;

    @include typescale('title-small');

    color: var(--color-surface-variant-contrast);
  }
}

.ui-test-divider-demo {
  display: flex;
  flex-direction: column;
  gap: 8rem;

  p {
    margin: 0;

    @include typescale('body-medium');
  }
}
</style>
