<script setup lang="ts">
const variants = ['elevated', 'filled', 'outlined'] as const
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-card
      </h2>

      <p class="ui-test-section__description">
        Elevated, filled and outlined cards with header, media and actions, based on Material 3 card specs.
      </p>
    </header>

    <div class="ui-test-grid">
      <div
        v-for="variant in variants"
        :key="variant"
        class="ui-test-grid__column"
      >
        <h3 class="ui-test-grid__subtitle">
          variant="{{ variant }}"
        </h3>

        <ui-card
          :variant="variant"
          title="Glassmorphic Design"
          subtitle="Material 3 Specs"
        >
          <template #media>
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=200&q=80"
              alt="Abstract"
            >
          </template>

          <p>
            Cards group content and actions on a single topic. M3 uses three types: elevated, filled, and outlined.
          </p>

          <template #actions>
            <ui-button variant="text">
              Action
            </ui-button>

            <ui-button
              variant="filled"
              color="primary"
            >
              Primary
            </ui-button>
          </template>
        </ui-card>
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

    color: var(--color-surface-variant-contrast);
  }
}

.ui-test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280rem, 1fr));
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
    text-transform: capitalize;
  }
}
</style>
