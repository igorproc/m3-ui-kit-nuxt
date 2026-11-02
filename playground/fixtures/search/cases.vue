<template>
  <section class="fixture-cases">
    <h1>MSearch — edge cases</h1>

    <label for="consumer-search">Archive</label>
    <MSearch
      id="consumer-search"
      v-model="query"
      aria-label="Search the archive"
      :messages="{ clear: 'Clear the query' }"
      data-test="with-id"
      @clear="clears++"
    />
    <output data-test="clears">{{ clears }}</output>

    <h2>Docked view from items</h2>
    <MSearch
      v-model="city"
      aria-label="Search cities"
      placeholder="City"
      :items="cities"
      item-value="id"
      :messages="messages"
      data-test="docked"
      @select="chosen = String($event)"
      @submit="submitted = $event"
    />
    <output data-test="chosen">{{ chosen }}</output>
    <output data-test="submitted">{{ submitted }}</output>

    <h2>Grouped results</h2>
    <MSearch
      v-model="deal"
      aria-label="Search deals"
      placeholder="Deals and companies"
      :messages="messages"
      data-test="grouped"
    >
      <MSearchList
        v-if="!deal && recent.length"
        title="Recent"
      >
        <MSearchListItem
          v-for="entry in recent"
          :key="entry"
          :headline="entry"
          removable
          @remove="recent = recent.filter(item => item !== entry)"
        >
          <template #leading>
            <MIcon :name="ICONS.history" />
          </template>
        </MSearchListItem>
      </MSearchList>
      <MSearchList title="Deals">
        <MSearchListItem
          v-for="row in matchingDeals"
          :key="row.id"
          :value="row.id"
          :headline="row.title"
          :supporting-text="row.client"
        />
      </MSearchList>
    </MSearch>
    <output data-test="recent">{{ recent.join(', ') }}</output>

    <h2>Inline view</h2>
    <MSearch
      v-model="inline"
      view="inline"
      aria-label="Search cities inline"
      :items="cities"
      :messages="messages"
      data-test="inline"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MSearch from '#kit/components/ui/search/index.vue'
import MSearchList from '#kit/components/ui/search/list/index.vue'
import MSearchListItem from '#kit/components/ui/search/list/item/index.vue'
import { ICONS } from '#kit/shared/constants/icons'

const messages = { clear: 'Clear the query', noResults: 'Nothing found', loading: 'Loading results' }

const cities = [
  { id: 1, title: 'Zürich' },
  { id: 2, title: 'Zagreb' },
  { id: 3, title: 'Berlin' },
  { id: 4, title: 'Bern' },
  { id: 5, title: 'Bergen' },
  { id: 6, title: 'Bordeaux' },
  { id: 7, title: 'Bologna' },
  { id: 8, title: 'Bratislava' },
]

const deals = [
  { id: 'd1', title: 'Invoice #4821', client: 'Acme Corp' },
  { id: 'd2', title: 'Invoice #4790', client: 'Northwind' },
  { id: 'd3', title: 'Renewal 2026', client: 'Globex' },
]

const query = ref('material')
const clears = ref(0)
const city = ref('')
const chosen = ref('')
const submitted = ref('')
const deal = ref('')
const recent = ref(['acme renewal', 'invoices march'])
const inline = ref('b')

const matchingDeals = computed(() => (deal.value
  ? deals.filter(row => row.title.toLowerCase().includes(deal.value.toLowerCase()))
  : deals))
</script>

<style lang="scss">
.fixture-cases {
  display: grid;
  gap: 16rem;
  max-width: 720rem;
}
</style>
