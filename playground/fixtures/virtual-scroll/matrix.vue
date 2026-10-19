<template>
  <section class="fixture-virtual">
    <h1>useVirtualScroll — matrix</h1>

    <div class="fixture-virtual__grid">
      <article
        v-for="pane in panes"
        :key="pane.name"
        class="fixture-virtual__pane"
      >
        <h2 :id="`${pane.name}-title`">
          {{ pane.title }}
        </h2>

        <div
          :ref="pane.bind"
          class="fixture-virtual__viewport"
          :class="{ 'fixture-virtual__viewport--horizontal': pane.horizontal }"
          role="region"
          tabindex="0"
          :aria-labelledby="`${pane.name}-title`"
          :data-test="pane.name"
        >
          <div
            v-bind="pane.virtual.spacerAttrs.value"
            role="list"
          >
            <div
              v-for="item in pane.virtual.virtualItems.value"
              :key="item.key"
              v-bind="pane.virtual.getItemAttrs(item)"
              class="fixture-virtual__item"
              :class="{ 'fixture-virtual__item--odd': item.index % 2 === 1 }"
              role="listitem"
              :aria-posinset="item.index + 1"
              :aria-setsize="COUNT"
              :data-test="`${pane.name}-item`"
            >
              <span class="fixture-virtual__label">{{ pane.horizontal ? 'Card' : 'Row' }} {{ item.index + 1 }}</span>
            </div>
          </div>
        </div>

        <dl class="fixture-virtual__status">
          <dt>At start</dt>
          <dd
            class="fixture-virtual__value"
            :data-test="`${pane.name}-at-start`"
          >
            {{ pane.virtual.isAtStart.value }}
          </dd>
          <dt>At end</dt>
          <dd
            class="fixture-virtual__value"
            :data-test="`${pane.name}-at-end`"
          >
            {{ pane.virtual.isAtEnd.value }}
          </dd>
          <dt>Range</dt>
          <dd
            class="fixture-virtual__value"
            :data-test="`${pane.name}-range`"
          >
            {{ pane.virtual.range.value.startIndex }}–{{ pane.virtual.range.value.endIndex }}
          </dd>
        </dl>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useVirtualScroll } from '#kit/composables/virtual-scroll/useVirtualScroll'

const COUNT = 1000

function createPane(name: string, title: string, horizontal: boolean, itemSize: number | ((index: number) => number), padding = 0) {
  const viewport = shallowRef<HTMLElement | null>(null)
  const virtual = useVirtualScroll({
    container: viewport,
    count: COUNT,
    itemSize,
    horizontal,
    paddingStart: padding,
    paddingEnd: padding,
    getKey: index => `${name}-${index}`,
  })

  const bind = (element: unknown) => {
    viewport.value = element instanceof HTMLElement ? element : null
  }

  return { name, title, horizontal, virtual, bind }
}

const panes = [
  createPane('vertical-constant', 'Vertical · constant size', false, 48),
  createPane('vertical-known', 'Vertical · known sizes and padding', false, index => (index % 3 === 0 ? 72 : 48), 8),
  createPane('horizontal-constant', 'Horizontal · constant size', true, 160),
  createPane('horizontal-known', 'Horizontal · known sizes and padding', true, index => (index % 3 === 0 ? 240 : 160), 8),
]
</script>

<style lang="scss">
@use 'sass:map';

.fixture-virtual {
  display: grid;
  gap: spacing(16);

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320rem), 1fr));
    gap: spacing(24);
  }

  &__pane {
    display: grid;
    gap: spacing(8);
    min-inline-size: 0;
  }

  &__viewport {
    overflow: auto;
    block-size: 320rem;
    border-radius: map.get($theme-shape-link, 'small');
    background-color: map.get($theme-color-link, 'surface-container-low');
    overscroll-behavior: contain;

    &:focus-visible {
      @include focus-ring;
    }

    &--horizontal {
      block-size: 120rem;
    }
  }

  &__item {
    display: flex;
    box-sizing: border-box;
    align-items: center;
    padding-inline: spacing(12);
    color: map.get($theme-color-link, 'on-surface');

    &--odd {
      background-color: map.get($theme-color-link, 'surface-container');
    }
  }

  &__label {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @include typescale('body-medium');
  }

  &__status {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: spacing(4) spacing(12);
    margin: 0;
  }

  &__value {
    margin: 0;
  }
}
</style>
