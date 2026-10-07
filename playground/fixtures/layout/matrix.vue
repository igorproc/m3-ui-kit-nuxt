<template>
  <MLayout data-test="layout">
    <MLayoutHeader data-test="header">
      <MAppBar
        title="Layout matrix"
        data-test="app-bar"
      />
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

    <MLayoutMain data-test="main">
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
  </MLayout>
</template>

<script setup lang="ts">
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutHeader from '#kit/components/ui/layout/header.vue'
import MLayoutAside from '#kit/components/ui/layout/aside.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MLayoutFooter from '#kit/components/ui/layout/footer.vue'
import MLayoutItem from '#kit/components/ui/layout/item.vue'
import MAppBar from '#kit/components/ui/app-bar/index.vue'
import MButton from '#kit/components/ui/button/index.vue'

const sections = [1, 2, 3, 4, 5].map(index => ({ id: `section-${index}`, title: `Section ${index}` }))

const text = 'Each section is tall enough to push the page past the window, so the document scrolls under the pinned header and every anchor, focused control and scrolled-to target has to come to rest below it rather than behind it. '.repeat(6)
</script>

<style lang="scss">
.fixture-layout__nav {
  display: grid;
  gap: 8rem;
  padding: 16rem;
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
</style>
