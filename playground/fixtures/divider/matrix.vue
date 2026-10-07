<template>
  <section class="fixture-divider">
    <h1>MDivider — matrix</h1>

    <h2>Horizontal × inset</h2>
    <div class="fixture-divider__grid">
      <div
        v-for="inset in insets"
        :key="inset.name"
        class="fixture-divider__frame"
        :data-test="`frame-horizontal-${inset.name}`"
      >
        <span>{{ inset.name }}</span>
        <MDivider
          :inset="inset.value"
          :data-test="`horizontal-${inset.name}`"
        />
      </div>
    </div>

    <h2>Vertical × inset</h2>
    <div class="fixture-divider__grid">
      <div
        v-for="inset in insets"
        :key="inset.name"
        class="fixture-divider__frame fixture-divider__frame--row"
        :data-test="`frame-vertical-${inset.name}`"
      >
        <span>{{ inset.name }}</span>
        <MDivider
          orientation="vertical"
          :inset="inset.value"
          :data-test="`vertical-${inset.name}`"
        />
        <span>after</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import MDivider from '#kit/components/ui/divider/index.vue'
import type { MDividerInset } from '#kit/components/ui/divider/props'

const insets: { name: string, value: MDividerInset | undefined }[] = [
  { name: 'none', value: undefined },
  { name: 'start', value: 'start' },
  { name: 'center', value: 'center' },
  { name: 'end', value: 'end' },
]
</script>

<style lang="scss">
.fixture-divider {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rem;
  }

  &__frame {
    display: grid;
    gap: 8rem;
    width: 200rem;
    padding-block: 8rem;
    outline: 1px dashed var(--md-sys-color-outline);

    &--row {
      display: flex;
      align-items: center;
      height: 80rem;
      padding-block: 0;
    }
  }
}
</style>
