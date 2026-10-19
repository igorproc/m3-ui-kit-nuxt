<template>
  <section class="fixture-cases">
    <h1>MDropdown — edge cases</h1>

    <h2>Compact with chips</h2>
    <div class="fixture-cases__row">
      <div
        v-for="variant in variants"
        :key="variant"
        class="fixture-cases__narrow"
      >
        <MDropdown
          v-model="compactChips[variant]"
          :messages="messages"
          :items="fruit"
          item-title="name"
          item-value="id"
          density="compact"
          :variant="variant"
          multiple
          clearable
          :label="`Compact chips ${variant}`"
          :data-test="`compact-chips-${variant}`"
        />
      </div>
      <div
        v-for="variant in variants"
        :key="`empty-${variant}`"
        class="fixture-cases__narrow"
      >
        <MDropdown
          v-model="compactEmpty[variant]"
          :messages="messages"
          :items="fruit"
          item-title="name"
          item-value="id"
          density="compact"
          :variant="variant"
          multiple
          clearable
          :label="`Compact empty ${variant}`"
          :data-test="`compact-empty-${variant}`"
        />
      </div>
    </div>

    <h2>Multiple with long rows</h2>
    <div class="fixture-cases__narrow">
      <MDropdown
        v-model="longMultiple"
        :messages="messages"
        :items="longRows"
        item-title="name"
        item-value="id"
        multiple
        label="Long rows, several at once"
        data-test="multi-long"
      />
    </div>

    <h2>Rows on the edge of wrapping</h2>
    <div class="fixture-cases__narrow">
      <MDropdown
        v-model="edgeMultiple"
        :messages="messages"
        :items="edgeRows"
        item-title="name"
        item-value="id"
        multiple
        :max-height="2000"
        label="Titles one word longer each"
        data-test="multi-edge"
      />
    </div>

    <h2>Read-only with a clear control</h2>
    <div class="fixture-cases__row">
      <div class="fixture-cases__narrow">
        <MDropdown
          v-model="readonlySingle"
          :messages="messages"
          :items="fruit"
          item-title="name"
          item-value="id"
          readonly
          clearable
          label="Read-only, clearable"
          data-test="readonly-clearable"
        />
      </div>
      <div class="fixture-cases__narrow">
        <MDropdown
          v-model="readonlyMultiple"
          :messages="messages"
          :items="fruit"
          item-title="name"
          item-value="id"
          readonly
          multiple
          clearable
          label="Read-only, multiple"
          data-test="readonly-multiple"
        />
      </div>
    </div>

    <h2>In a wrapping flex row</h2>
    <div class="fixture-cases__flex">
      <div class="fixture-cases__flex-item">
        <MDropdown
          v-model="flexMultiple"
          :messages="messages"
          :items="fruit"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          multiple
          label="In a flex row"
          data-test="in-flex"
        />
      </div>
      <div class="fixture-cases__flex-auto">
        <MDropdown
          v-model="autoMultiple"
          :messages="messages"
          :items="fruit"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          multiple
          label="Sized by content"
          data-test="in-flex-auto"
        />
      </div>
      <button
        type="button"
        data-test="in-flex-sibling"
      >
        Sibling
      </button>
    </div>

    <h2>Near the bottom of the page</h2>
    <div class="fixture-cases__narrow">
      <MDropdown
        v-model="bottom"
        :messages="messages"
        :items="many"
        item-title="name"
        item-value="id"
        label="Opens near the bottom edge"
        data-test="bottom"
      />
    </div>

    <div class="fixture-cases__spacer" />
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MDropdown from '#kit/components/ui/dropdown/index.vue'
import type { MDropdownVariant } from '#kit/components/ui/dropdown/props'

// The kit ships no copy of its own: the app names the controls and states.
const messages = { clear: 'Clear selection', loading: 'Loading options', empty: 'No options' }

const fruit = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Blueberry' },
  { id: 4, name: 'Cherry' },
  { id: 5, name: 'Damson' },
  { id: 6, name: 'Elderberry' },
]

const longRows = [
  { id: 1, name: 'Express overnight delivery with signature on receipt' },
  { id: 2, name: 'Standard ground shipping, five to seven working days' },
  { id: 3, name: 'Collect from the nearest pickup point after notification' },
  { id: 4, name: 'Same-day courier within the city limits' },
]

const sentence = 'Deliver to the loading dock behind the north warehouse gate before noon on weekdays'.split(' ')
const edgeRows = sentence.map((_, index) => ({ id: index + 1, name: sentence.slice(0, index + 1).join(' ') })).slice(3)

const many = Array.from({ length: 40 }, (_, index) => ({ id: index + 1, name: `Option ${index + 1}` }))

const variants: MDropdownVariant[] = ['filled', 'outlined']

const compactChips = reactive<Record<string, number[]>>({ filled: [1, 2, 4], outlined: [1, 2, 4] })
const compactEmpty = reactive<Record<string, number[]>>({ filled: [], outlined: [] })
const longMultiple = ref<number[]>([])
const edgeMultiple = ref<number[]>([])
const readonlySingle = ref(3)
const readonlyMultiple = ref([1, 4])
const flexMultiple = ref<number[]>([1])
const autoMultiple = ref<number[]>([1])
const bottom = ref<number>()
</script>

<style lang="scss">
.fixture-cases {
  display: grid;
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 16rem;
  }

  &__narrow {
    width: 280rem;
  }

  // The orders dashboard's filter row: an item that may grow and wraps.
  &__flex {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12rem 16rem;
    max-width: 720rem;
  }

  &__flex-item {
    flex: 1 1 280rem;
    max-width: 420rem;
  }

  &__flex-auto {
    flex: 0 1 auto;
  }

  &__spacer {
    height: 1200rem;
  }
}
</style>
