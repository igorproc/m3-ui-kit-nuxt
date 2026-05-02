<script setup lang="ts">
const items = [
  { label: 'Edit', icon: 'baseline-edit', tooltip: 'Edit item' },
  { label: 'Share', icon: 'baseline-share', tooltip: 'Share with others' },
  { label: 'Delete', icon: 'baseline-delete', tooltip: 'Delete permanently' },
] as const
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-tooltip
      </h2>

      <p class="ui-test-section__description">
        Simple tooltip wrapper for icon buttons, appears on hover and focus.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Icon buttons with tooltips
        </h3>

        <div class="ui-test-grid__row">
          <ui-tooltip
            v-for="item in items"
            :key="item.label"
            :text="item.tooltip"
          >
            <ui-button
              variant="text"
              :aria-label="item.tooltip"
            >
              <ui-icon :name="item.icon" />
            </ui-button>
          </ui-tooltip>
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

    @include typescale('body-medium');
  }
}

.ui-test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260rem, 1fr));
  gap: 24rem;

  &__column {
    display: flex;
    flex-direction: column;
    gap: 24rem;
  }

  &__subtitle {
    margin: 0;
    color: var(--color-surface-variant-contrast);

    @include typescale('title-small');
  }

  &__row {
    display: flex;
    flex-flow: row wrap;
    gap: 18rem;
    margin-top: 8rem;
  }
}
</style>
