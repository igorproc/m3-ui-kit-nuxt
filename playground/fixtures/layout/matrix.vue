<template>
  <MLayout data-test="layout">
    <MLayoutHeader data-test="header">
      <MAppBar data-test="app-bar">
        <MAppBarTitle title="Layout matrix" />
        <MAppBarActions>
          <div
            class="fixture-layout__control"
            data-test="tall-control"
          >
            Search
          </div>
        </MAppBarActions>
      </MAppBar>
    </MLayoutHeader>

    <MLayoutAside
      sticky
      size-token="200rem"
      data-test="aside-start"
    >
      <nav
        aria-label="Sections"
        class="fixture-layout__nav"
      >
        <a
          v-for="section in sections"
          :key="section.id"
          :href="`#${section.id}`"
          class="fixture-layout__link"
          :data-test="`link-${section.id}`"
        >
          {{ section.title }}
        </a>
      </nav>
    </MLayoutAside>

    <MLayoutAside
      position="end"
      size-token="240rem"
      aria-label="Supporting pane"
      data-test="aside-end"
    >
      <p class="fixture-layout__pane">
        Supporting pane in flow: it scrolls with the page and is dropped below 1200px.
      </p>
    </MLayoutAside>

    <MLayoutMain
      container
      data-test="main"
    >
      <section
        aria-labelledby="sticky-title"
        class="fixture-layout__flow"
        data-test="sticky-section"
      >
        <h2 id="sticky-title">
          Sticky inside main
        </h2>
        <p
          class="fixture-layout__sticky"
          data-test="sticky-note"
        >
          This note sticks below the pinned header while its section scrolls.
        </p>
        <p>{{ text }}</p>
      </section>

      <section
        v-for="section in sections"
        :id="section.id"
        :key="section.id"
        :aria-labelledby="`${section.id}-title`"
        class="fixture-layout__section"
        :data-test="section.id"
      >
        <h2 :id="`${section.id}-title`">
          {{ section.title }}
        </h2>
        <p>{{ text }}</p>
        <MButton :data-test="`${section.id}-action`">
          Open {{ section.title }}
        </MButton>
      </section>

      <section
        aria-labelledby="nested-title"
        class="fixture-layout__section"
      >
        <h2 id="nested-title">
          Nested layout
        </h2>

        <MLayout data-test="nested">
          <MLayoutHeader data-test="nested-header">
            <MAppBar
              title="Nested pane"
              :sticky="false"
            />
          </MLayoutHeader>

          <MLayoutAside
            size-token="160rem"
            aria-label="Nested aside"
            data-test="nested-aside"
          >
            <p class="fixture-layout__pane">
              Nested aside
            </p>
          </MLayoutAside>

          <MLayoutItem
            kind="main"
            data-test="nested-main"
          >
            <p class="fixture-layout__pane">
              Nested content sits beside the nested aside, in the nested grid.
            </p>
          </MLayoutItem>
        </MLayout>
      </section>
    </MLayoutMain>

    <MLayoutFooter data-test="footer">
      <p class="fixture-layout__pane">
        Footer in flow: it is not pinned and takes no cutout.
      </p>
    </MLayoutFooter>

    <MSnackbar
      v-model="snackbar"
      label="Saved"
    />
  </MLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutHeader from '#kit/components/ui/layout/header.vue'
import MLayoutAside from '#kit/components/ui/layout/aside.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MLayoutFooter from '#kit/components/ui/layout/footer.vue'
import MLayoutItem from '#kit/components/ui/layout/item.vue'
import MAppBar from '#kit/components/ui/app-bar/index.vue'
import MAppBarTitle from '#kit/components/ui/app-bar/title/index.vue'
import MAppBarActions from '#kit/components/ui/app-bar/actions/index.vue'
import MButton from '#kit/components/ui/button/index.vue'
import MSnackbar from '#kit/components/ui/snackbar/index.vue'

const snackbar = ref(false)

const sections = [1, 2, 3, 4, 5].map(index => ({ id: `section-${index}`, title: `Section ${index}` }))

const text = 'Each section is tall enough to push the page past the window, so the document scrolls under the pinned header and every anchor, focused control and scrolled-to target has to come to rest below it rather than behind it. '.repeat(6)
</script>

<style lang="scss">
.fixture-layout__nav {
  display: grid;
  gap: 8rem;
  padding: 16rem;
}

// A list of links is a set of targets, not running text: each one gets a 48rem row (WCAG 2.5.8).
.fixture-layout__link {
  display: flex;
  align-items: center;
  min-block-size: 48rem;
}

.fixture-layout__pane {
  margin: 0;
  padding: 16rem;
}

.fixture-layout__section {
  display: grid;
  justify-items: start;
  gap: 12rem;
  padding: 24rem;
}

// As tall as a search bar: the small app bar must still match its reserved row.
.fixture-layout__control {
  display: flex;
  align-items: center;
  block-size: 56rem;
  padding-inline: 16rem;
  border-radius: 28rem;
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
}

// Block flow, not grid: a grid item's containing block is its own track, where sticky cannot move.
.fixture-layout__flow {
  padding: 24rem;
}

.fixture-layout__sticky {
  position: sticky;
  inset-block-start: var(--m3-layout-inset-top, 0);
  margin: 0;
  padding-block: 12rem;
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
}
</style>
