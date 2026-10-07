<template>
  <section class="fixture-divider-stress">
    <h1>MDivider — stress content</h1>

    <h2>Narrow scrolling parent</h2>
    <div
      class="fixture-divider-stress__narrow"
      data-test="narrow"
      tabindex="0"
      role="region"
      aria-label="Narrow parent"
    >
      <p>Above</p>
      <MDivider
        v-for="inset in insets"
        :key="inset"
        :inset="inset"
        :data-test="`narrow-${inset}`"
      />
      <p>Below</p>
    </div>

    <h2>Vertical in running text</h2>
    <div
      class="fixture-divider-stress__text"
      data-test="inline"
    >
      Left
      <MDivider
        orientation="vertical"
        data-test="inline-divider"
      />
      Right
    </div>

    <h2>Vertical in a block parent</h2>
    <div
      class="fixture-divider-stress__text"
      data-test="block"
    >
      <MDivider
        orientation="vertical"
        data-test="block-divider"
      />
    </div>

    <h2>Vertical in a toolbar row</h2>
    <div
      class="fixture-divider-stress__toolbar"
      data-test="toolbar"
    >
      <span>Bold</span>
      <MDivider
        orientation="vertical"
        inset="center"
        data-test="toolbar-divider"
      />
      <span>Italic</span>
    </div>

    <h2>Inside a list</h2>
    <MList
      class="fixture-divider-stress__list"
      data-test="list"
    >
      <MListItem
        headline="Inbox"
        :leading-icon="ICONS.email"
      />
      <MDivider inset="center" />
      <MListItem
        headline="Starred"
        :leading-icon="ICONS.star"
      />
      <MDivider />
      <MListItem
        headline="Archive"
        :leading-icon="ICONS.history"
        tag="button"
      />
    </MList>
  </section>
</template>

<script setup lang="ts">
import MDivider from '#kit/components/ui/divider/index.vue'
import MList from '#kit/components/ui/list/index.vue'
import MListItem from '#kit/components/ui/list/item/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MDividerInset } from '#kit/components/ui/divider/props'

const insets: MDividerInset[] = ['start', 'center', 'end']
</script>

<style lang="scss">
.fixture-divider-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    width: 120px;
    overflow: auto;
    outline: 1px dashed var(--md-sys-color-outline);
  }

  // A known line height, so "one line tall" has a number to meet.
  &__text {
    line-height: 24rem;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 8rem;
    height: 48rem;
  }

  &__list {
    width: 320rem;
    max-width: 100%;
  }
}
</style>
