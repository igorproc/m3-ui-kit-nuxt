<script setup lang="ts">
const slides = [
  {
    title: 'First slide',
    subtitle: 'Hero card with primary action',
    body: 'Use carousels to show a small number of related items. This slide uses an elevated card.',
  },
  {
    title: 'Second slide',
    subtitle: 'Filled surface',
    body: 'Filled cards emphasize contained content and work well on low-contrast backgrounds.',
  },
  {
    title: 'Third slide',
    subtitle: 'Outlined card',
    body: 'Outlined cards are lightweight and suitable for high-density layouts.',
  },
] as const

const currentIndex = ref(0)
const mediaIndex = ref(0)

const mediaSlides = [
  {
    id: 0,
    src: 'https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'DJ mixing music on a console',
  },
  {
    id: 1,
    src: 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'People dancing at a concert',
  },
  {
    id: 2,
    src: 'https://images.pexels.com/photos/164929/pexels-photo-164929.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Singer performing into a microphone',
  },
] as const
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-carousel
      </h2>

      <p class="ui-test-section__description">
        Horizontal carousel with animated slide transitions, indicators and external index binding.
      </p>
    </header>

    <div class="ui-test-carousel-layout">
      <section class="ui-test-carousel-layout__section">
        <h3 class="ui-test-carousel-layout__subtitle">
          Cards carousel
        </h3>

        <ui-carousel
          v-model:index="currentIndex"
          :length="slides.length"
        >
          <template #default="{ index }">
            <ui-card
              :variant="index === 0 ? 'elevated' : index === 1 ? 'filled' : 'outlined'"
              :title="slides?.[index]?.title"
              :subtitle="slides?.[index]?.subtitle"
              :style="{ margin: '1rem' }"
            >
              <p>
                {{ slides?.[index]?.body }}
              </p>

              <template #actions>
                <ui-button variant="text">
                  Learn more
                </ui-button>
              </template>
            </ui-card>
          </template>
        </ui-carousel>

        <p class="ui-test-carousel-layout__debug">
          currentIndex: {{ currentIndex }}
        </p>
      </section>

      <section class="ui-test-carousel-layout__section ui-test-carousel-layout__section--media">
        <h3 class="ui-test-carousel-layout__subtitle">
          Media carousel
        </h3>

        <ui-carousel
          v-model:index="mediaIndex"
          :length="mediaSlides.length"
        >
          <div class="ui-test-media-carousel">
            <img
              v-for="slide in mediaSlides"
              :key="slide.id"
              :src="slide.src"
              :alt="slide.alt"
              class="ui-test-media-carousel__image"
            >
          </div>
        </ui-carousel>

        <div class="ui-test-carousel-layout__footer">
          <ui-button variant="text">
            Show all
          </ui-button>
        </div>
      </section>
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

.ui-test-carousel-layout {
  display: flex;
  flex-direction: column;
  gap: 8rem;
  max-width: 960rem;
  margin-inline: auto;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8rem;
  }

  &__section--media {
    margin-top: 16rem;
  }

  &__subtitle {
    margin: 0;
    color: var(--color-surface-variant-contrast);

    @include typescale('title-small');
  }

  &__debug {
    margin: 0;
    color: var(--color-surface-variant-contrast);

    @include typescale('body-small');
  }
}

.ui-test-media-carousel {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 12rem;

  &__image {
    width: 100%;
    height: 220rem;
    object-fit: cover;
    border-radius: var(--sys-shape-corner-large);
  }
}
</style>
