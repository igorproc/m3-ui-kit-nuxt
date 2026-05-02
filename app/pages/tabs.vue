<script setup lang="ts">
const current = ref<'overview' | 'specs' | 'guidelines'>('overview')

const items = [
  { value: 'overview', label: 'Overview', icon: 'baseline-visibility' },
  { value: 'specs', label: 'Specs', icon: 'baseline-description' },
  { value: 'guidelines', label: 'Guidelines', icon: 'baseline-rule' },
] as const
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-tabs
      </h2>

      <p class="ui-test-section__description">
        M3 Primary tabs with content-aligned indicators and State Layers.
      </p>
    </header>

    <div class="ui-test-grid">
      <div
        class="ui-test-grid__column"
        style="grid-column: 1 / -1;"
      >
        <ui-tabs
          v-model="current"
          :items="items"
        >
          <template #default="{ value }">
            <div class="ui-test-tabs__content">
              <p>Active tab: <strong>{{ value }}</strong></p>
              <p>M3 Primary tabs are used for main navigation within a screen. They feature a 3px bottom indicator and 48px height.</p>
            </div>
          </template>
        </ui-tabs>
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
}

.ui-test-tabs__content {
  margin: 0;

  @include typescale('body-medium');
}
</style>
