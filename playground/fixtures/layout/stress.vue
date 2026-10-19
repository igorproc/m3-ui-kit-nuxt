<template>
  <section class="fixture-layout-stress">
    <h1>Layout — stress content</h1>

    <h2>Default columns: 4, 8 from 768, 12 from 1200</h2>
    <MContainer data-test="grid-default">
      <MCol
        v-for="index in 12"
        :key="index"
        cols="1"
        class="fixture-layout-stress__cell"
        :data-test="`default-cell-${index}`"
      >
        {{ index }}
      </MCol>
    </MContainer>

    <h2>Spans and offsets on every breakpoint</h2>
    <MContainer data-test="grid-spans">
      <MCol
        cols="4"
        tablet-xs="4"
        tablet="2"
        desktop-xs="3"
        desktop="2"
        class="fixture-layout-stress__cell"
        data-test="span-cell"
      >
        Spans 4 · 4 · 2 · 3 · 2
      </MCol>
      <MCol
        cols="2"
        offset="2"
        offset-tablet-xs="0"
        desktop-xs="6"
        offset-desktop-xs="3"
        class="fixture-layout-stress__cell"
        data-test="offset-cell"
      >
        Offset 2, reset at 768, offset 3 from 1200
      </MCol>
      <MCol
        cols="12"
        class="fixture-layout-stress__cell"
        data-test="clamped-cell"
      >
        Span 12 clamps to the active column count
      </MCol>
    </MContainer>

    <h2>Rows, alignment and no gutters</h2>
    <MContainer
      :cols-tablet-xs="6"
      data-test="grid-rows"
    >
      <MRow align="center">
        <MCol
          cols="2"
          class="fixture-layout-stress__cell fixture-layout-stress__cell--tall"
        >
          Tall
        </MCol>
        <MCol
          cols="2"
          class="fixture-layout-stress__cell"
        >
          Centred
        </MCol>
      </MRow>
      <MRow no-gutters>
        <MCol
          v-for="index in 6"
          :key="index"
          cols="1"
          class="fixture-layout-stress__cell"
        >
          {{ index }}
        </MCol>
      </MRow>
    </MContainer>

    <h2>Long text and an unbroken word in narrow columns</h2>
    <MContainer
      fluid
      data-test="grid-long"
    >
      <MCol
        cols="2"
        desktop-xs="3"
        class="fixture-layout-stress__cell"
        data-test="long-text"
      >
        {{ longText }}
      </MCol>
      <MCol
        cols="2"
        desktop-xs="3"
        class="fixture-layout-stress__cell"
        data-test="long-word"
      >
        {{ longWord }}
      </MCol>
    </MContainer>

    <h2>Fixed ratio with a focusable child</h2>
    <MContainer>
      <MCol
        cols="4"
        tablet-xs="6"
        desktop-xs="8"
      >
        <MResponsive
          aspect-ratio="16 / 9"
          data-test="responsive"
        >
          <MButton
            class="fixture-layout-stress__fill"
            data-test="responsive-child"
          >
            Play the video
          </MButton>
        </MResponsive>
      </MCol>
      <MCol
        cols="2"
        desktop-xs="2"
      >
        <MResponsive
          aspect-ratio="1"
          class="fixture-layout-stress__media"
          data-test="responsive-overflow"
        >
          <p class="fixture-layout-stress__copy">
            {{ longCopy }}
          </p>
        </MResponsive>
      </MCol>
    </MContainer>

    <h2>Spacer</h2>
    <div
      class="fixture-layout-stress__toolbar"
      data-test="spacer-row"
    >
      <span>Start</span>
      <MSpacer />
      <span>End</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import MContainer from '#kit/components/ui/container/index.vue'
import MRow from '#kit/components/ui/row/index.vue'
import MCol from '#kit/components/ui/col/index.vue'
import MResponsive from '#kit/components/ui/responsive/index.vue'
import MSpacer from '#kit/components/ui/spacer/index.vue'
import MButton from '#kit/components/ui/button/index.vue'

const longText = 'A column holds whatever the page puts into it, so a paragraph that keeps going well past the width of its track has to wrap inside the track instead of widening it and pushing the page sideways.'
const longCopy = Array.from({ length: 6 }, () => longText).join(' ')
const longWord = 'Unbreakable'.repeat(12)
</script>

<style lang="scss">
.fixture-layout-stress {
  display: grid;
  gap: 16rem;
}

.fixture-layout-stress__cell {
  padding: 8rem;
  overflow-wrap: break-word;
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);

  &--tall {
    min-block-size: 96rem;
  }
}

.fixture-layout-stress .fixture-layout-stress__fill {
  width: 100%;
  height: 100%;
}

.fixture-layout-stress__media {
  background-color: var(--md-sys-color-surface-container-high);
}

.fixture-layout-stress__copy {
  margin: 0;
  padding: 8rem;
  color: var(--md-sys-color-on-surface);
}

.fixture-layout-stress__toolbar {
  display: flex;
  gap: 8rem;
  padding: 8rem;
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
}
</style>
