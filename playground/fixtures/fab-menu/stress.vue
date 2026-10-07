<template>
  <section class="fixture-fab-menu-stress">
    <h1>MFabMenu — stress content</h1>

    <div class="fixture-fab-menu-stress__cell">
      <MFabMenu
        :items="manyItems"
        aria-label="Create, many actions"
        data-test="menu-many"
      />
    </div>

    <div class="fixture-fab-menu-stress__cell">
      <MFabMenu
        :items="longItems"
        aria-label="Create, long labels"
        data-test="menu-long"
      />
    </div>

    <div class="fixture-fab-menu-stress__cell">
      <MFabMenu
        aria-label="Create, nothing to show"
        data-test="menu-empty"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import MFabMenu from '#kit/components/ui/fab-menu/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MFabMenuItem } from '#kit/components/ui/fab-menu/props'

const manyItems: MFabMenuItem[] = Array.from({ length: 8 }, (_, index) => ({
  label: `Action ${index + 1}`,
  icon: ICONS.add,
  value: index,
}))
const longItems: MFabMenuItem[] = [
  { label: 'Schedule a recurring meeting with everyone on the distribution list', icon: ICONS.event, value: 'meeting' },
  { label: 'https://example.com/a/very/long/path/without/any/spaces/at/all', icon: ICONS.language, value: 'link' },
]
</script>

<style lang="scss">
.fixture-fab-menu-stress {
  display: grid;
  gap: 16rem;

  &__cell {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    min-height: 200rem;
  }
}
</style>
