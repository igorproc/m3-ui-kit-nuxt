<template>
  <section class="fixture-selection-group-stress">
    <h1>MSelectionGroup — a thousand items</h1>

    <MSelectionGroup
      v-model="picked"
      :items="items"
      item-value="id"
      item-key="id"
      multiple
      pattern="option"
    >
      <template #default="{ groupAttrs, rows, toggleAll, isAllSelected, selected }">
        <button
          type="button"
          data-test="toggle-all"
          @click="toggleAll"
        >
          {{ isAllSelected ? 'Clear all' : 'Select all' }}
        </button>
        <output data-test="count">{{ selected.length }}</output>
        <div
          v-bind="groupAttrs"
          class="fixture-selection-group-stress__list"
          aria-label="Files"
          data-test="list"
        >
          <component :is="rows" />
        </div>
      </template>
      <template #item="{ item, attrs, isSelected, toggle }">
        <div
          v-bind="attrs"
          class="fixture-selection-group-stress__option"
          :class="{ 'fixture-selection-group-stress__option--selected': isSelected }"
          tabindex="-1"
          :data-test="`item-${item.id}`"
          @click="toggle"
        >
          {{ item.title }}
        </div>
      </template>
    </MSelectionGroup>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MSelectionGroup from '#kit/components/ui/selection-group/index.vue'

const items = Array.from({ length: 1000 }, (_, index) => ({
  id: index + 1,
  title: `quarterly-report-${String(index + 1).padStart(4, '0')}-with-a-long-file-name-without-spaces.pdf`,
}))

const picked = ref<number[]>([1, 500, 1000])
</script>

<style lang="scss">
.fixture-selection-group-stress {
  display: grid;
  gap: 12rem;
  justify-items: start;

  &__list {
    display: grid;
    max-inline-size: 100%;
  }

  &__option {
    padding: 4rem 8rem;
    overflow-wrap: anywhere;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;

    &--selected {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }
  }
}
</style>
