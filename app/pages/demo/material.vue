<template>
  <div class="demo-material__content">
    <!-- Hero Section -->
    <section class="demo-material__hero">
      <div class="demo-material__hero-text">
        <h1 class="demo-material__hero-title">
          Build beautiful, usable products
        </h1>
        <p class="demo-material__hero-subtitle">
          Material Design 3 is the latest version of Google's open-source design system.
          Design and build beautiful, usable products with Material 3.
        </p>
        <div class="demo-material__hero-actions">
          <m-button variant="filled">
            Get Started
          </m-button>
          <m-button variant="outlined">
            View Components
          </m-button>
        </div>
      </div>
    </section>

    <!-- Chip Filters -->
    <section class="demo-material__filters">
      <m-chip
        v-for="cat in categories"
        :key="cat.value"
        variant="filter"
        :selected="selectedCategory === cat.value"
        @click="selectedCategory = cat.value"
      >
        {{ cat.label }}
      </m-chip>
    </section>

    <!-- Component Showcase -->
    <material-showcase />

    <!-- Cards Grid -->
    <section class="demo-material__grid">
      <m-card
        v-for="card in filteredCards"
        :key="card.id"
        :title="card.title"
        :subtitle="card.subtitle"
        variant="outlined"
        class="demo-material__card"
      >
        <div class="demo-material__card-icon">
          <m-icon :name="card.icon" />
        </div>
        <p class="demo-material__card-desc">
          {{ card.description }}
        </p>
        <template #actions>
          <m-button variant="tonal">
            Learn More
          </m-button>
        </template>
      </m-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'

const selectedCategory = ref('all')

const categories = [
  { value: 'all', label: 'All' },
  { value: 'actions', label: 'Actions' },
  { value: 'communication', label: 'Communication' },
  { value: 'containment', label: 'Containment' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'selection', label: 'Selection' },
  { value: 'text-input', label: 'Text Input' },
]

const allCards = [
  { id: 1, title: 'Buttons', subtitle: 'Actions', category: 'actions', icon: ICONS.widgets, description: 'Buttons help people take action, such as sending an email, sharing a document, or liking a comment.' },
  { id: 2, title: 'FAB', subtitle: 'Actions', category: 'actions', icon: ICONS.rocketLaunch, description: 'The FAB represents the most important action on a screen. It puts key actions within reach.' },
  { id: 3, title: 'Cards', subtitle: 'Containment', category: 'containment', icon: ICONS.dashboard, description: 'Cards contain content and actions that relate information about a subject.' },
  { id: 4, title: 'Dialogs', subtitle: 'Communication', category: 'communication', icon: ICONS.info, description: 'Dialogs provide important prompts in a user flow. They can require an action, communicate information.' },
  { id: 5, title: 'Navigation Rail', subtitle: 'Navigation', category: 'navigation', icon: ICONS.explore, description: 'Navigation rails provide access to primary destinations in apps when using tablet and desktop screens.' },
  { id: 6, title: 'Chips', subtitle: 'Selection', category: 'selection', icon: ICONS.localOffer, description: 'Chips help people enter information, make selections, filter content, or trigger actions.' },
  { id: 7, title: 'Text Fields', subtitle: 'Text Input', category: 'text-input', icon: ICONS.code, description: 'Text fields let users enter and edit text. They appear in forms and dialogs.' },
  { id: 8, title: 'Search', subtitle: 'Text Input', category: 'text-input', icon: ICONS.search, description: 'Search bars allow users to enter a keyword or phrase and get relevant information.' },
  { id: 9, title: 'Tabs', subtitle: 'Navigation', category: 'navigation', icon: ICONS.dashboard, description: 'Tabs organize content across different screens, data sets, and other interactions.' },
]

const filteredCards = computed(() => {
  if (selectedCategory.value === 'all') return allCards
  return allCards.filter(c => c.category === selectedCategory.value)
})
</script>

<style lang="scss">
.demo-material {
  background-color: var(--color-background);
  color: var(--color-background-contrast);

  &__menu-btn {
    min-width: auto;
    padding: 8rem;
  }

  &__search {
    max-width: 320rem;

    @media (width <= 768px) {
      display: none;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 32rem;
    padding: 32rem;
    max-width: 1400rem;
    margin: 0 auto;

    @media (width <= 768px) {
      padding: 16rem;
      gap: 24rem;
    }
  }

  &__hero {
    background: linear-gradient(
      135deg,
      var(--color-primary-container) 0%,
      var(--color-accent-container) 100%
    );
    border-radius: var(--sys-shape-corner-extra-large, 28rem);
    padding: 64rem 48rem;
    display: flex;
    align-items: center;

    @media (width <= 768px) {
      padding: 32rem 24rem;
    }
  }

  &__hero-text {
    max-width: 640rem;
  }

  &__hero-title {
    margin: 0 0 16rem;
    color: var(--color-primary-container-contrast);

    @include typescale('display-small');

    @media (width <= 768px) {
      @include typescale('headline-medium');
    }
  }

  &__hero-subtitle {
    margin: 0 0 32rem;
    color: var(--color-primary-container-contrast);
    opacity: 0.8;

    @include typescale('body-large');
  }

  &__hero-actions {
    display: flex;
    gap: 12rem;
    flex-wrap: wrap;
  }

  &__filters {
    display: flex;
    gap: 8rem;
    flex-wrap: wrap;
    padding-bottom: 8rem;
    border-bottom: 1rem solid var(--color-outline-variant);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280rem, 1fr));
    gap: 16rem;

    @media (width <= 480px) {
      grid-template-columns: 1fr;
    }
  }

  &__card {
    display: flex;
    flex-direction: column;
  }

  &__card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48rem;
    height: 48rem;
    border-radius: var(--sys-shape-corner-medium, 12rem);
    background-color: var(--color-primary-container);
    color: var(--color-primary-container-contrast);
    margin-bottom: 12rem;
    font-size: 24rem;
  }

  &__card-desc {
    margin: 0;
    color: var(--color-surface-variant-contrast);

    @include typescale('body-medium');
  }
}
</style>
