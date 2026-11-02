<template>
  <section
    class="fixture-breadcrumbs"
    data-test="breadcrumbs-fixture"
  >
    <h1>MBreadcrumbs — matrix</h1>

    <h2>Scroll, a long trail in a narrow box</h2>
    <div class="fixture-breadcrumbs__narrow">
      <MBreadcrumbs
        :items="trail"
        aria-label="Scrolling trail"
        overflow="scroll"
        data-test="scroll"
      />
    </div>

    <h2>Wrap</h2>
    <div class="fixture-breadcrumbs__narrow">
      <MBreadcrumbs
        :items="trail"
        aria-label="Wrapping trail"
        overflow="wrap"
        data-test="wrap"
      />
    </div>

    <h2>Wrap, an unbroken name and a disabled crumb</h2>
    <div class="fixture-breadcrumbs__narrow">
      <MBreadcrumbs
        :items="unbroken"
        aria-label="Archive trail"
        overflow="wrap"
        data-test="wrap-long"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import MBreadcrumbs from '#kit/components/ui/breadcrumbs/index.vue'
import type { MBreadcrumbItem } from '#kit/components/ui/breadcrumbs/props'

const trail: MBreadcrumbItem[] = [
  { id: 'home', title: 'Home', to: '/' },
  { id: 'catalog', title: 'Catalog', to: '/catalog' },
  { id: 'computers', title: 'Computers and accessories', to: '/catalog/computers' },
  { id: 'laptops', title: 'Laptops for work and study', to: '/catalog/computers/laptops' },
  { id: 'brand', title: 'A long brand name', to: '/catalog/computers/laptops/brand' },
  { id: 'model', title: 'Model 15 with a long product name' },
]

const unbroken: MBreadcrumbItem[] = [
  { id: 'home', title: 'Home', to: '/' },
  { id: 'archive', title: 'Archive', disabled: true },
  { id: 'part', title: 'ArticleNumberXJ9000-00042-REV-B-WITHOUT-ANY-SPACE', to: '/archive/xj9000' },
  { id: 'file', title: 'Datasheet' },
]
</script>

<style lang="scss">
.fixture-breadcrumbs {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    width: 320rem;
    border: max(1px, 1rem) dashed currentcolor;
  }
}
</style>
