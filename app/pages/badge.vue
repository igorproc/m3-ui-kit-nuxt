<script setup lang="ts">
const count = ref(7)
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-badge
      </h2>

      <p class="ui-test-section__description">
        Numeric and dot badges for icons and standalone counts, following Material 3 notification badge patterns.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Numeric (on icon)
        </h3>

        <div class="ui-test-badge-icon">
          <span class="ui-test-badge-icon__base">
            <ui-icon name="baseline-notifications" />
          </span>

          <ui-badge
            class="ui-test-badge-icon__badge"
            :value="count"
          />
        </div>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Numeric (standalone)
        </h3>

        <div class="ui-test-badge-row">
          <ui-badge :value="3" />
          <ui-badge :value="99" />
          <ui-badge
            :value="1000"
            :max="999"
          />
        </div>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Dot (small)
        </h3>

        <div class="ui-test-badge-icon">
          <span class="ui-test-badge-icon__base">
            <ui-icon name="baseline-email" />
          </span>
          <ui-badge
            dot
            class="ui-test-badge-icon__badge"
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
  grid-template-columns: repeat(auto-fit, minmax(220rem, 1fr));
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
}

.ui-test-badge-icon {
  width: fit-content;
  position: relative;
  display: inline-flex;

  &__base {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40rem;
    height: 40rem;
    border-radius: 999rem;
    background-color: color-mix(
      in srgb,
      var(--color-primary) 10%,
      transparent
    );
    color: var(--color-primary);
    font-size: 24rem;
  }

  &__badge {
    position: absolute;
    top: -4rem;
    right: -4rem;
  }
}

.ui-test-badge-row {
  display: flex;
  align-items: center;
  gap: 12rem;

  &__on-icon {
    margin-left: 8rem;
  }
}
</style>
