<template>
  <section class="fixture-list-stress">
    <h1>MList — stress content</h1>

    <h2>Empty items</h2>
    <MList
      :items="noItems"
      class="fixture-list-stress__panel"
      data-test="list-empty"
    >
      <template #default="{ item }">
        <MListItem :headline="item.title" />
      </template>
      <template #empty>
        Nothing here yet
      </template>
    </MList>

    <h2>Long words</h2>
    <MList
      class="fixture-list-stress__panel fixture-list-stress__panel--narrow"
      data-test="list-long"
    >
      <MListItem
        :headline="longWord"
        :supporting-text="longWord"
        :leading-icon="ICONS.language"
        trailing-supporting-text="99+"
        data-test="long-auto"
      />
      <MListItem
        :lines="2"
        :headline="longWord"
        :supporting-text="longWord"
        :leading-icon="ICONS.language"
        tag="button"
        data-test="long-clamped"
      />
    </MList>

    <h2>Sticky subheaders on tinted surfaces</h2>
    <div class="fixture-list-stress__grid">
      <div
        v-for="surface in surfaces"
        :key="surface.role"
        class="fixture-list-stress__scroller"
        :class="`fixture-list-stress__scroller--${surface.role}`"
        :data-test="`sticky-${surface.role}`"
        tabindex="0"
        :aria-label="surface.label"
        role="region"
      >
        <MList :surface="surface.role">
          <template
            v-for="group in groups"
            :key="group"
          >
            <MListSubheader
              sticky
              :title="`${surface.label}, group ${group}`"
              :data-test="`sticky-${surface.role}-${group}`"
            />
            <MListItem
              v-for="row in 6"
              :key="row"
              tag="button"
              :headline="`Row ${group}${row}`"
              :leading-icon="ICONS.article"
              :data-test="`row-${surface.role}-${group}${row}`"
            />
          </template>
        </MList>
      </div>
    </div>

    <h2>Three hundred rows</h2>
    <div
      class="fixture-list-stress__scroller"
      data-test="list-many"
      tabindex="0"
      aria-label="Three hundred rows"
      role="region"
    >
      <MList :items="manyItems">
        <template #default="{ item }">
          <MListItem
            :headline="item.title"
            supporting-text="Supporting text"
            :leading-icon="ICONS.person"
          />
        </template>
      </MList>
    </div>
  </section>
</template>

<script setup lang="ts">
import MList from '#kit/components/ui/list/index.vue'
import MListItem from '#kit/components/ui/list/item/index.vue'
import MListSubheader from '#kit/components/ui/list/subheader/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MListSurface } from '#kit/components/ui/list/types'

interface Row {
  id: number
  title: string
}

const noItems: Row[] = []
const manyItems: Row[] = Array.from({ length: 300 }, (_, index) => ({ id: index + 1, title: `Row ${index + 1}` }))

// The tinted panels stand in for a navigation drawer (`surface-container-low`)
// and a menu (`surface-container`).
const surfaces: { role: MListSurface, label: string }[] = [
  { role: 'surface', label: 'Page' },
  { role: 'surface-container-low', label: 'Drawer' },
  { role: 'surface-container', label: 'Menu' },
]
const groups = ['A', 'B']

const longWord = 'Supercalifragilisticexpialidocious-and-a-path/that/never/breaks/on/its/own.example.com'
</script>

<style lang="scss">
.fixture-list-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rem;
  }

  &__panel {
    width: 360rem;
    max-width: 100%;

    &--narrow {
      width: 200rem;
    }
  }

  &__scroller {
    width: 320rem;
    max-width: 100%;
    height: 280rem;
    overflow-y: auto;
    background-color: var(--md-sys-color-surface);

    &--surface-container-low {
      background-color: var(--md-sys-color-surface-container-low);
    }

    &--surface-container {
      background-color: var(--md-sys-color-surface-container);
    }
  }
}
</style>
