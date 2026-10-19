<template>
  <section class="fixture-cases">
    <h1>MAutocomplete — edge cases</h1>

    <h2>Minimum length with a hint</h2>
    <div class="fixture-cases__narrow">
      <MAutocomplete
        :messages="messages"
        :items="cities"
        item-title="name"
        item-value="id"
        :min-search-length="2"
        label="With a hint"
        data-test="hint"
      >
        <template #hint="{ missing }">
          <p class="fixture-cases__hint">
            Type {{ missing }} more
          </p>
        </template>
      </MAutocomplete>
    </div>

    <h2>Read-only</h2>
    <div class="fixture-cases__row">
      <div class="fixture-cases__narrow">
        <MAutocomplete
          v-model="readonlySingle"
          :messages="messages"
          :items="cities"
          item-title="name"
          item-value="id"
          readonly
          clearable
          label="Read-only, clearable"
          data-test="readonly-clearable"
        />
      </div>
      <div class="fixture-cases__narrow">
        <MAutocomplete
          v-model="readonlyMultiple"
          :messages="messages"
          :items="cities"
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

    <h2>Compact with chips</h2>
    <div class="fixture-cases__narrow">
      <MAutocomplete
        v-model="compactChips"
        :messages="messages"
        :items="cities"
        item-title="name"
        item-value="id"
        density="compact"
        multiple
        clearable
        label="Compact chips"
        data-test="compact-chips"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MAutocomplete from '#kit/components/ui/autocomplete/index.vue'

// The kit ships no copy of its own: the app names the controls and states.
const messages = { clear: 'Clear selection', toggle: 'Toggle options', loading: 'Loading options', empty: 'No options', noResults: 'No results' }

const cities = [
  { id: 1, name: 'Amsterdam' },
  { id: 2, name: 'Berlin' },
  { id: 3, name: 'Bern' },
  { id: 4, name: 'Copenhagen' },
  { id: 5, name: 'Dublin' },
  { id: 6, name: 'Edinburgh' },
]

const readonlySingle = ref(2)
const readonlyMultiple = ref([1, 4])
const compactChips = ref([1, 2, 4])
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

  &__hint {
    margin: 0;
    padding: 16rem;
  }
}
</style>
