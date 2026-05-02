<script setup lang="ts">
const isButtonLoading = ref(false)

function toggleButtonLoading() {
  isButtonLoading.value = !isButtonLoading.value
}
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-loading
      </h2>

      <p class="ui-test-section__description">
        Circular indeterminate loading indicator in standalone and inline modes.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Sizes
        </h3>

        <div class="ui-test-grid__row">
          <ui-loading
            size="small"
            aria-label="Loading small"
          />

          <ui-loading
            size="medium"
            aria-label="Loading medium"
          />

          <ui-loading
            size="large"
            aria-label="Loading large"
          />
        </div>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Inline in button
        </h3>

        <ui-button
          :disabled="isButtonLoading"
          @click="toggleButtonLoading"
        >
          <template
            v-if="isButtonLoading"
            #prepend
          >
            <ui-loading
              inline
              size="small"
              aria-label="Submitting"
            />
          </template>

          <span v-if="isButtonLoading">
            Submitting…
          </span>

          <span v-else>
            Submit
          </span>
        </ui-button>
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
    font-family: var(--md-sys-typescale-title-small-font);
    font-size: var(--md-sys-typescale-title-small-size);
    line-height: var(--md-sys-typescale-title-small-line-height);
    font-weight: var(--md-sys-typescale-title-small-weight);
    color: var(--color-surface-variant-contrast);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 16rem;
  }
}
</style>
