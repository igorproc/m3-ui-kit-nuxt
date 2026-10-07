<template>
  <section class="fixture-card">
    <h1>MCard — matrix</h1>

    <template
      v-for="variant in variants"
      :key="variant"
    >
      <h2>{{ variant }}</h2>

      <div class="fixture-card__grid">
        <MCard
          :variant="variant"
          :title="`Static ${variant}`"
          subtitle="No states"
          :heading-level="3"
          :data-test="`static-${variant}`"
        >
          A static card does not react to the pointer.
          <template #actions>
            <MButton variant="text">
              Share
            </MButton>
          </template>
        </MCard>

        <MCard
          :variant="variant"
          :title="`Static ${variant} with media`"
          subtitle="16 / 9 cover"
          :heading-level="3"
          media-aspect-ratio="16 / 9"
          :data-test="`static-media-${variant}`"
        >
          <template #media>
            <img
              :src="cover(hues[variant])"
              alt=""
            >
          </template>
          Supporting text under the media.
          <template #actions>
            <MButton variant="outlined">
              Save
            </MButton>
            <MButton>Open</MButton>
          </template>
        </MCard>

        <MCard
          :variant="variant"
          :title="`Link ${variant}`"
          subtitle="The whole card is one link"
          :heading-level="3"
          tag="link"
          :to="destination"
          :data-test="`link-${variant}`"
        >
          Hover, focus and press it.
        </MCard>

        <MCard
          :variant="variant"
          :title="`Link ${variant} with media`"
          :heading-level="3"
          tag="link"
          :to="destination"
          media-aspect-ratio="16 / 9"
          :data-test="`link-media-${variant}`"
        >
          <template #media>
            <img
              :src="cover(hues[variant] + 40)"
              alt=""
            >
          </template>
          A link card with a cover image.
        </MCard>

        <MCard
          :variant="variant"
          :title="`Link ${variant}, disabled`"
          subtitle="No destination"
          :heading-level="3"
          tag="link"
          :to="destination"
          disabled
          :data-test="`link-disabled-${variant}`"
        >
          Out of the Tab order.
        </MCard>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import MButton from '#kit/components/ui/button/index.vue'
import MCard from '#kit/components/ui/card/index.vue'
import type { MCardVariant } from '#kit/components/ui/card/props'

const variants: MCardVariant[] = ['elevated', 'filled', 'outlined']
const hues: Record<MCardVariant, number> = { elevated: 260, filled: 160, outlined: 20 }
const destination = '/card/stress'

const cover = (hue: number) => `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="hsl(${hue} 45% 62%)"/></svg>`,
)}`
</script>

<style lang="scss">
.fixture-card {
  display: grid;
  gap: 16rem;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280rem, 1fr));
    align-items: start;
    gap: 24rem;
  }
}
</style>
