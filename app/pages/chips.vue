<script setup lang="ts">
const assistSelected = ref(false)
const filterSelected = ref(false)
const suggestionSelected = ref(false)
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-chip
      </h2>

      <p class="ui-test-section__description">
        M3 chips with State Layers, 8px corners and specific variants.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Assist & Filter
        </h3>

        <div class="ui-test-grid__row">
          <ui-chip variant="assist">
            <template #icon>
              <ui-icon name="baseline-star-border" />
            </template>
            Assist
          </ui-chip>

          <ui-chip
            v-model:selected="filterSelected"
            variant="filter"
          >
            <template #icon>
              <ui-icon
                v-if="filterSelected"
                name="baseline-check"
              />
              <ui-icon
                v-else
                name="baseline-filter-alt"
              />
            </template>
            Filter
          </ui-chip>
        </div>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Input & Suggestion
        </h3>

        <div class="ui-test-grid__row">
          <ui-chip variant="input">
            Input chip
            <template #trailing>
              <ui-icon name="baseline-close" />
            </template>
          </ui-chip>

          <ui-chip
            v-model:selected="suggestionSelected"
            variant="suggestion"
          >
            Suggestion
          </ui-chip>
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
  border-radius: 24rem;
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
    flex-wrap: wrap;
    gap: 8rem;
  }
}
</style>
