<script setup lang="ts">
const linearValue = ref(40)
const circularValue = ref(65)
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-progress
      </h2>

      <p class="ui-test-section__description">
        Linear and circular progress indicators with determinate and indeterminate states.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Linear
        </h3>

        <ui-progress
          :value="linearValue"
          aria-label="File upload progress"
        />

        <ui-progress
          indeterminate
          aria-label="Indeterminate loading"
        />
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Circular
        </h3>

        <div class="ui-test-progress-circular">
          <ui-progress
            variant="circular"
            :value="circularValue"
            aria-label="Download progress"
          />

          <ui-progress
            variant="circular"
            indeterminate
            aria-label="Indeterminate circular loading"
          />
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

.ui-test-progress-circular {
  display: flex;
  align-items: center;
  gap: 24rem;
}
</style>
