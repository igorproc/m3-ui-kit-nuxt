<template>
  <section class="fixture-lazy-stress">
    <h1>MLazy — stress content</h1>

    <h2>Keeps focus and input while out of view</h2>
    <MLazy
      :once="false"
      :min-height="120"
      data-test="keep-focus"
    >
      <label class="fixture-lazy-stress__card">
        Draft note
        <input
          class="fixture-lazy-stress__field"
          data-test="keep-focus-field"
        >
      </label>

      <template #placeholder>
        <div class="fixture-lazy-stress__skeleton">
          Draft note
        </div>
      </template>
    </MLazy>

    <h2>Height stays reserved on activation</h2>
    <MLazy
      mode="on-interaction"
      :interactions="['click']"
      :min-height="160"
      data-test="reserved"
    >
      <div class="fixture-lazy-stress__card fixture-lazy-stress__card--tall">
        Chart loaded
      </div>

      <template #placeholder>
        <div class="fixture-lazy-stress__skeleton">
          Show chart
        </div>
      </template>
    </MLazy>

    <h2>Retry recovers</h2>
    <MLazy
      mode="on-interaction"
      :min-height="96"
      error-text="The comments could not be loaded. Check the connection and try once more."
      retry-label="Try again"
      data-test="flaky"
    >
      <Flaky />

      <template #placeholder>
        <div class="fixture-lazy-stress__skeleton">
          Show comments
        </div>
      </template>
    </MLazy>

    <h2>Long words and large content</h2>
    <div class="fixture-lazy-stress__narrow">
      <MLazy
        mode="on-interaction"
        :min-height="96"
        error-text="Failed"
        retry-label="Try again"
        data-test="long-placeholder"
      >
        <div class="fixture-lazy-stress__card">
          Loaded
        </div>

        <template #placeholder>
          <div class="fixture-lazy-stress__skeleton">
            https://example.com/a/very/long/placeholder/path/without/any/spaces/at/all
          </div>
        </template>
      </MLazy>

      <MLazy
        mode="eager"
        error-text="Failed"
        retry-label="Try again"
        data-test="large-content"
      >
        <div class="fixture-lazy-stress__card">
          {{ largeText }}
        </div>
      </MLazy>

      <MLazy
        mode="on-idle"
        :min-height="96"
        error-text="Averyveryverylongerrormessagewithoutanyspacesthatmustwrapinsteadofoverflowing"
        retry-label="Averyveryverylongretrylabelwithoutanyspaces"
        data-test="long-error"
      >
        <Broken />

        <template #placeholder>
          <div class="fixture-lazy-stress__skeleton">
            Loading the broken block
          </div>
        </template>
      </MLazy>
    </div>

    <h2>Reserve only, no placeholder</h2>
    <MLazy
      mode="on-interaction"
      :min-height="64"
      aria-label="Load the empty block"
      error-text="Failed"
      retry-label="Try again"
      data-test="empty"
    >
      <div class="fixture-lazy-stress__card">
        Empty block loaded
      </div>
    </MLazy>

    <h2>Feed of {{ feed.length }}</h2>
    <ol class="fixture-lazy-stress__feed">
      <li
        v-for="item in feed"
        :key="item"
      >
        <MLazy
          :min-height="120"
          error-text="Failed"
          retry-label="Try again"
          :data-test="`feed-${item}`"
        >
          <div class="fixture-lazy-stress__card">
            Item {{ item }} loaded
          </div>

          <template #placeholder>
            <div class="fixture-lazy-stress__skeleton">
              Item {{ item }}
            </div>
          </template>
        </MLazy>
      </li>
    </ol>

    <button
      type="button"
      data-test="outside"
    >
      Outside
    </button>
  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent, defineComponent, h } from 'vue'
import type { Component } from 'vue'
import MLazy from '#kit/components/ui/lazy/index.vue'

const Comments = defineComponent({ setup: () => () => h('p', { class: 'fixture-lazy-stress__card' }, 'Comments loaded') })

let loads = 0
const Flaky = defineAsyncComponent(() => {
  loads += 1
  return loads === 1
    ? Promise.reject(new Error('Fixture: the first load fails'))
    : Promise.resolve<Component>(Comments)
})
const Broken = defineAsyncComponent(() => Promise.reject(new Error('Fixture: this block always fails')))

const feed = Array.from({ length: 100 }, (_, index) => index + 1)
const largeText = Array.from({ length: 40 }, () => 'Lazy content keeps its layout while it arrives.').join(' ')
  + ' Averyveryverylongwordwithoutanyspacesthatmustwrapinsteadofoverflowingthecontainer'
</script>

<style lang="scss">
.fixture-lazy-stress {
  display: grid;
  gap: 16rem;

  &__narrow {
    display: grid;
    gap: 12rem;
    max-width: 200rem;
  }

  &__feed {
    display: grid;
    gap: 12rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__skeleton,
  &__card {
    display: grid;
    place-items: center;
    box-sizing: border-box;
    min-height: inherit;
    margin: 0;
    padding: 8rem;
    border-radius: var(--sys-shape-corner-medium);
    overflow-wrap: anywhere;
  }

  &__skeleton {
    background: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface-variant);
  }

  &__card {
    background: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);

    &--tall {
      height: 160rem;
    }
  }

  &__field {
    max-width: 100%;
  }
}
</style>
