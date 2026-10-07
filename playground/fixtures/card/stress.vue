<template>
  <section class="fixture-card-stress">
    <h1>MCard — stress content</h1>

    <h2>Grid of 1fr columns</h2>
    <div class="fixture-card-stress__grid">
      <MCard
        title="Supercalifragilisticexpialidocious-and-then-some-more-without-a-single-space"
        :heading-level="3"
        data-test="long-word"
      >
        https://example.com/a/very/long/path/without/any/spaces/that/would/push/the/card/wider
      </MCard>

      <MCard
        variant="outlined"
        title="Broken cover"
        :heading-level="3"
        media-aspect-ratio="16 / 9"
        data-test="broken-media"
      >
        <template #media>
          <img
            src="data:image/png;base64,AA=="
            alt="Cover that failed to load"
          >
        </template>
        The media keeps its box and its placeholder tone.
      </MCard>

      <MCard
        title="Linked cover"
        :heading-level="3"
        media-aspect-ratio="16 / 9"
        data-test="media-link"
      >
        <template #media>
          <a
            href="#cover"
            class="fixture-card-stress__cover"
            data-test="media-link-anchor"
          >
            <img
              :src="cover"
              alt="Open the cover"
            >
          </a>
        </template>
        The cover is a link of its own; its focus ring is not clipped.
      </MCard>

      <MCard
        variant="filled"
        subtitle="Only a subhead, no title"
        data-test="subhead-only"
      >
        Body under a lone subhead.
      </MCard>

      <MCard
        variant="outlined"
        title="Empty body"
        :heading-level="3"
        data-test="empty-body"
      >
        <template #actions>
          <MButton variant="text">
            Dismiss
          </MButton>
        </template>
      </MCard>

      <MCard
        tag="link"
        to="/card/matrix"
        title="Сегодня · 今週 · هذا الشهر 🎉"
        subtitle="Mixed scripts in a link card"
        :heading-level="3"
        data-test="link-mixed"
      >
        A link card in the grid.
      </MCard>
    </div>

    <h2>Five actions at 280</h2>
    <div class="fixture-card-stress__narrow">
      <MCard
        title="Crowded actions"
        :heading-level="3"
        data-test="five-actions"
      >
        The actions wrap instead of leaving the card.
        <template #actions>
          <MButton
            v-for="action in actions"
            :key="action"
            variant="text"
          >
            {{ action }}
          </MButton>
        </template>
      </MCard>
    </div>

    <h2>Contract violation</h2>
    <label class="fixture-card-stress__toggle">
      <input
        v-model="showInvalid"
        type="checkbox"
        data-test="toggle-invalid"
      >
      Render a link card with actions (invalid HTML, dev warning)
    </label>
    <MCard
      v-if="showInvalid"
      tag="link"
      to="/card/matrix"
      title="Link card with actions"
      :heading-level="3"
      data-test="link-with-actions"
    >
      Its actions still render.
      <template #actions>
        <MButton variant="text">
          Share
        </MButton>
      </template>
    </MCard>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MCard from '#kit/components/ui/card/index.vue'

const actions = ['Share', 'Save', 'Archive', 'Report', 'Open']
const cover = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="hsl(200 45% 62%)"/></svg>',
)}`

// Off by default, so the page stays valid HTML for the axe run.
const showInvalid = ref(false)
</script>

<style lang="scss">
.fixture-card-stress {
  display: grid;
  gap: 16rem;

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: start;
    gap: 24rem;
  }

  &__narrow {
    width: 280rem;
  }

  &__cover {
    display: block;
    height: 100%;
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: 8rem;
  }
}
</style>
