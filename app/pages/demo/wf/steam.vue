<template>
  <m-layout
    class="wf-steam"
    full-height
  >
    <m-system-bar>
      <m-spacer />

      <span class="wf-steam__shape wf-steam__shape--square" />
      <span class="wf-steam__shape wf-steam__shape--circle" />
      <span class="wf-steam__shape wf-steam__shape--triangle" />
    </m-system-bar>

    <m-app-bar variant="small">
      <template #container>
        <div class="wf-steam__app-bar">
          <div class="wf-steam__avatar wf-steam__avatar--circle wf-steam__avatar--md" />
          <div class="wf-steam__avatar wf-steam__avatar--circle wf-steam__avatar--md" />

          <m-button
            v-for="(width, index) in navButtonWidths"
            :key="index"
            class="wf-steam__nav-button"
            variant="tonal"
            :style="{ width: `${width}rem` }"
            :aria-label="`Navigation placeholder ${index + 1}`"
          />

          <m-spacer />
        </div>
      </template>
    </m-app-bar>

    <m-layout-footer
      sticky
      size-token="44rem"
    >
      <div class="wf-steam__footer-fill" />
    </m-layout-footer>

    <m-layout-aside
      position="start"
      sticky
      size-token="256rem"
    >
      <div class="wf-steam__drawer">
        <div class="wf-steam__drawer-row">
          <m-button
            class="wf-steam__drawer-button"
            variant="tonal"
            aria-label="Library placeholder"
          />

          <div class="wf-steam__avatar wf-steam__avatar--rounded" />
        </div>

        <div class="wf-steam__drawer-row">
          <m-button
            class="wf-steam__drawer-button"
            variant="outlined"
            aria-label="Filter placeholder"
          />

          <div class="wf-steam__avatar wf-steam__avatar--circle wf-steam__avatar--xs" />
          <div class="wf-steam__avatar wf-steam__avatar--circle wf-steam__avatar--xs" />
        </div>

        <div class="wf-steam__drawer-body">
          <m-search
            v-model="search"
            class="wf-steam__search"
            placeholder="Search"
          />

          <template
            v-for="(section, sectionIndex) in drawerSections"
            :key="sectionIndex"
          >
            <div
              class="wf-steam__pill wf-steam__pill--title"
              :style="{ width: `${section.title}%` }"
            />

            <div
              v-for="(line, lineIndex) in section.lines"
              :key="lineIndex"
              class="wf-steam__pill wf-steam__pill--line"
              :style="{ width: `${line}%` }"
            />

            <m-divider class="wf-steam__drawer-divider" />
          </template>
        </div>
      </div>
    </m-layout-aside>

    <m-layout-main>
      <section class="wf-steam__section wf-steam__section--featured">
        <div class="wf-steam__heading" />

        <div class="wf-steam__slide-group">
          <div
            v-for="n in 5"
            :key="n"
            class="wf-steam__tile wf-steam__tile--featured"
          />
        </div>
      </section>

      <section class="wf-steam__section wf-steam__section--catalog">
        <div class="wf-steam__heading wf-steam__heading--dark" />

        <div class="wf-steam__slide-group">
          <div
            v-for="(width, index) in catalogWidths"
            :key="index"
            class="wf-steam__tile"
            :style="{ width: `${width}rem` }"
          />
        </div>

        <m-container fluid>
          <m-col
            v-for="n in 24"
            :key="n"
            cols="2"
            tablet-xs="2"
            desktop-xs="2"
          >
            <div class="wf-steam__tile wf-steam__tile--grid" />
          </m-col>
        </m-container>
      </section>
    </m-layout-main>
  </m-layout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const search = ref('')

const navButtonWidths = [80, 100, 120, 120]

const drawerSections = [
  { title: 50, lines: [40, 20, 90, 70] },
  { title: 30, lines: [65, 70, 40, 100] },
]

const catalogWidths = Array.from({ length: 15 }, (_, index) => index === 0 ? 300 : 150)
</script>

<style lang="scss">
.wf-steam {
  background-color: var(--md-sys-color-surface);

  &__shape {
    width: 12rem;
    height: 12rem;
    margin-inline-start: 8rem;
    background-color: currentcolor;

    &--circle {
      border-radius: 50%;
    }

    &--triangle {
      width: 0;
      height: 0;
      background-color: transparent;
      border-inline: 7rem solid transparent;
      border-bottom: 12rem solid currentcolor;
    }
  }

  &__app-bar {
    display: flex;
    align-items: center;
    gap: 8rem;
    height: 100%;
  }

  &__avatar {
    flex: none;
    background-color: var(--md-sys-color-outline);

    &--circle {
      border-radius: 50%;
    }

    &--rounded {
      width: 40rem;
      height: 40rem;
      border-radius: 8rem;
    }

    &--md {
      width: 32rem;
      height: 32rem;
    }

    &--xs {
      width: 18rem;
      height: 18rem;
    }
  }

  &__nav-button {
    height: 40rem;
  }

  &__footer-fill {
    height: 100%;
    background-color: var(--md-sys-color-surface-container-highest);
  }

  &__drawer {
    display: flex;
    flex-direction: column;
    padding-block: 8rem;
    background-color: var(--md-sys-color-surface);
  }

  &__drawer-row {
    display: flex;
    align-items: center;
    gap: 8rem;
    margin-block: 8rem;
    padding-inline: 8rem;
  }

  &__drawer-button {
    flex: 1 1 auto;
    height: 40rem;
  }

  &__drawer-body {
    margin-block: 8rem;
    padding-inline: 8rem;
  }

  &__search {
    margin-bottom: 16rem;
  }

  &__pill {
    border-radius: 999rem;

    &--title {
      height: 24rem;
      margin-bottom: 8rem;
      background-color: var(--md-sys-color-outline);
    }

    &--line {
      height: 12rem;
      margin-bottom: 4rem;
      background-color: var(--md-sys-color-surface-container-highest);
    }
  }

  &__drawer-divider {
    margin-block: 24rem;
  }

  &__section {
    padding: 8rem;
    padding-top: 24rem;

    &--featured {
      background-color: var(--md-sys-color-surface-container);
    }

    &--catalog {
      background-color: var(--md-sys-color-surface-container-high);
    }
  }

  &__heading {
    width: 88rem;
    height: 24rem;
    border-radius: 999rem;
    background-color: var(--md-sys-color-surface-container-highest);

    &--dark {
      background-color: var(--md-sys-color-outline);
    }
  }

  &__slide-group {
    display: flex;
    gap: 24rem;
    padding-block: 12rem;
    overflow-x: auto;
  }

  &__tile {
    flex: none;
    width: 150rem;
    height: 200rem;
    border-radius: 8rem;
    background-color: var(--md-sys-color-surface-container-highest);

    &--featured {
      width: 250rem;
    }

    &--grid {
      width: auto;
    }
  }
}
</style>
