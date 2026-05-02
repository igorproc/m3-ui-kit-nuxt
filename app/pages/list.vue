<script setup lang="ts">
const items = [
  {
    id: 1,
    title: 'Inbox',
    supporting: '3 new messages',
    icon: 'baseline-inbox',
  },
  {
    id: 2,
    title: 'Upcoming events',
    supporting: '2 this week',
    icon: 'baseline-event',
  },
  {
    id: 3,
    title: 'Downloads',
    supporting: 'Recently added files',
    icon: 'baseline-download',
  },
] as const
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-list
      </h2>

      <p class="ui-test-section__description">
        M3 lists with interactive items, State Layers, and multi-line support.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Interactive (2-line)
        </h3>
        <ui-list :items="items">
          <template #default="{ item }">
            <ui-list-item
              tag="button"
              :headline="item.title"
              :supporting-text="item.supporting"
              :leading-icon="item.icon"
              trailing-icon="baseline-chevron-right"
            />
          </template>
        </ui-list>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Single-line & States
        </h3>
        <ui-list>
          <ui-list-item
            headline="Single line item"
            leading-icon="baseline-person"
          />
          <ui-list-item
            headline="Interactive item"
            interactive
            leading-icon="baseline-touch-app"
          />
          <ui-list-item
            headline="Disabled item"
            disabled
            leading-icon="baseline-block"
          />
        </ui-list>
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
</style>
