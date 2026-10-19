<template>
  <section class="fixture-virtual-stress">
    <h1 id="stress-title">
      useVirtualScroll — 100 000 rows
    </h1>

    <div class="fixture-virtual-stress__actions">
      <MButton
        variant="tonal"
        data-test="to-start"
        @click="go(virtual.scrollToIndex(0))"
      >
        To start
      </MButton>
      <MButton
        variant="tonal"
        data-test="to-middle"
        @click="go(virtual.scrollToIndex(MIDDLE, { align: 'center' }))"
      >
        To row 50 000
      </MButton>
      <MButton
        variant="tonal"
        data-test="to-end"
        @click="go(virtual.scrollToIndex(COUNT - 1, { align: 'end' }))"
      >
        To end
      </MButton>
    </div>

    <div
      ref="viewport"
      class="fixture-virtual-stress__viewport"
      role="region"
      tabindex="0"
      aria-labelledby="stress-title"
      data-test="stress"
    >
      <div
        v-bind="virtual.spacerAttrs.value"
        role="list"
      >
        <div
          v-for="item in virtual.virtualItems.value"
          :key="item.key"
          v-bind="virtual.getItemAttrs(item)"
          class="fixture-virtual-stress__item"
          :class="{ 'fixture-virtual-stress__item--odd': item.index % 2 === 1 }"
          role="listitem"
          :aria-posinset="item.index + 1"
          :aria-setsize="COUNT"
          data-test="stress-item"
        >
          <span class="fixture-virtual-stress__label">{{ label(item.index) }}</span>
        </div>
      </div>
    </div>

    <dl class="fixture-virtual-stress__status">
      <dt>At start</dt>
      <dd
        class="fixture-virtual-stress__value"
        data-test="at-start"
      >
        {{ virtual.isAtStart.value }}
      </dd>
      <dt>At end</dt>
      <dd
        class="fixture-virtual-stress__value"
        data-test="at-end"
      >
        {{ virtual.isAtEnd.value }}
      </dd>
      <dt>State</dt>
      <dd
        class="fixture-virtual-stress__value"
        data-test="state"
      >
        {{ virtual.state.value }}
      </dd>
      <dt>Rendered rows</dt>
      <dd
        class="fixture-virtual-stress__value"
        data-test="rendered"
      >
        {{ virtual.virtualItems.value.length }}
      </dd>
      <dt>Last navigation reached</dt>
      <dd
        class="fixture-virtual-stress__value"
        data-test="reached"
      >
        {{ reached ?? '—' }}
      </dd>
    </dl>

    <h2 id="empty-title">
      Empty collection
    </h2>
    <div
      ref="emptyViewport"
      class="fixture-virtual-stress__viewport fixture-virtual-stress__viewport--empty"
      role="region"
      aria-labelledby="empty-title"
      data-test="empty"
    >
      <div v-bind="empty.spacerAttrs.value" />
      <p class="fixture-virtual-stress__empty">
        No rows
      </p>
    </div>
    <p data-test="empty-at-end">
      At end: {{ empty.isAtEnd.value }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import { useVirtualScroll } from '#kit/composables/virtual-scroll/useVirtualScroll'

const COUNT = 100_000
const MIDDLE = 49_999

const LONG_TEXT = 'Quarterly reconciliation for every regional warehouse, including returns, write-offs and transfers between sites'
const LONG_WORD = 'https://example.com/a/very/long/path/without/any/spaces/at/all/that/keeps/going'

const virtual = useVirtualScroll({
  container: useTemplateRef<HTMLElement>('viewport'),
  count: COUNT,
  itemSize: 48,
  overscan: 6,
})

const empty = useVirtualScroll({
  container: useTemplateRef<HTMLElement>('emptyViewport'),
  count: 0,
  itemSize: 48,
})

const reached = ref<boolean | null>(null)

async function go(navigation: Promise<boolean>) {
  reached.value = await navigation
}

function label(index: number) {
  if (index % 1000 === 7) return `Row ${index + 1} · ${LONG_TEXT}`
  if (index % 1000 === 13) return `${index + 1}${LONG_WORD}`
  return `Row ${index + 1}`
}
</script>

<style lang="scss">
@use 'sass:map';

.fixture-virtual-stress {
  display: grid;
  gap: spacing(16);
  min-inline-size: 0;

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: spacing(8);
  }

  &__viewport {
    overflow: auto;
    block-size: 400rem;
    border-radius: map.get($theme-shape-link, 'small');
    background-color: map.get($theme-color-link, 'surface-container-low');
    overscroll-behavior: contain;

    &:focus-visible {
      @include focus-ring;
    }

    &--empty {
      block-size: auto;
    }
  }

  &__item {
    display: flex;
    box-sizing: border-box;
    align-items: center;
    padding-inline: spacing(16);
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

  &__empty {
    margin: 0;
    padding: spacing(16);
    color: map.get($theme-color-link, 'on-surface-variant');
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
