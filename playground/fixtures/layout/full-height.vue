<template>
  <MLayout
    full-height
    data-test="layout"
  >
    <MAppBar
      title="Full-height shell"
      data-test="app-bar"
    />

    <MLayoutMain
      :class="{ 'fixture-layout-full__main--rail': railInMain }"
      data-test="main"
    >
      <div
        class="fixture-layout-full__fixed"
        data-test="fixed-box"
      />

      <!-- `?rail=main`: a rail that is page content of the scrolling main, not a zone. -->
      <MNavigationRail
        v-if="railInMain"
        v-model="destination"
        :items="destinations"
        aria-label="Sections"
        data-test="rail-in-main"
      />

      <MContainer :class="{ 'fixture-layout-full__content': railInMain }">
        <MCol
          v-for="index in 24"
          :key="index"
          tablet-xs="4"
          desktop-xs="3"
        >
          <p
            class="fixture-layout-full__card"
            :data-test="`card-${index}`"
          >
            {{ text }}
          </p>
        </MCol>
      </MContainer>
    </MLayoutMain>

    <MLayoutFooter
      sticky
      size-token="56rem"
      class="fixture-layout-full__footer"
      data-test="footer"
    >
      <p
        class="fixture-layout-full__caption"
        data-test="footer-text"
      >
        Pinned footer: main scrolls between the bars, the page does not.
      </p>
    </MLayoutFooter>

    <MLayoutItem
      kind="bottom"
      sticky
      size-token="48rem"
      class="fixture-layout-full__footer"
      data-test="band"
    >
      <p class="fixture-layout-full__band">
        Pinned band above the footer, its text shorter than its row
      </p>
    </MLayoutItem>
  </MLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MLayoutFooter from '#kit/components/ui/layout/footer.vue'
import MLayoutItem from '#kit/components/ui/layout/item.vue'
import MAppBar from '#kit/components/ui/app-bar/index.vue'
import MContainer from '#kit/components/ui/container/index.vue'
import MCol from '#kit/components/ui/col/index.vue'
import MNavigationRail from '#kit/components/ui/navigation-rail/index.vue'
import type { MNavigationRailItem } from '#kit/components/ui/navigation-rail/props'

const route = useRoute()
const railInMain = computed(() => route.query.rail === 'main')
const destination = ref<string | null>('inbox')
const destinations: MNavigationRailItem[] = [
  { id: 'inbox', icon: 'outline-inbox', label: 'Inbox' },
  { id: 'sent', icon: 'outline-send', label: 'Sent' },
]

const text = 'A card in the scrolling main. Two dozen of them overflow any window, so main gets a scrollbar while the bars stay put.'
</script>

<style lang="scss">
.fixture-layout-full__main--rail {
  display: flex;
  align-items: flex-start;
}

.fixture-layout-full__content {
  flex: 1;
  min-width: 0;
}

.fixture-layout-full__card {
  margin: 0;
  min-block-size: 240rem;
}

// Stands in for a FAB: fixed to the window above the pinned bands, whatever main scrolls.
.fixture-layout-full__fixed {
  position: fixed;
  inset-block-end: 120rem;
  inset-inline-end: 16rem;
  inline-size: 56rem;
  block-size: 56rem;
  border-radius: 16rem;
  background-color: var(--md-sys-color-primary-container);
}

.fixture-layout-full__footer {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
}

.fixture-layout-full__band {
  margin: 0;
  padding-inline: 16rem;
}

.fixture-layout-full__caption {
  display: flex;
  align-items: center;
  margin: 0;
  min-block-size: 56rem;
  padding-inline: 16rem;
}
</style>
