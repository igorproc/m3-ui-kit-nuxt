<template>
  <section
    class="fixture-tabs"
    data-test="tabs-fixture"
  >
    <h1>MTabs — matrix</h1>

    <h2 id="tabs-preset-heading">
      Preset non-first tab
    </h2>
    <MTabs
      v-model="preset"
      :items="items"
      aria-labelledby="tabs-preset-heading"
      data-test="preset"
    >
      <template #default="{ value }">
        <p data-test="preset-panel">
          Panel {{ value }}
        </p>
      </template>
    </MTabs>
    <p>
      Model: <span data-test="preset-model">{{ preset }}</span>
    </p>

    <h2 id="tabs-route-heading">
      Tab in the URL
    </h2>
    <MTabs
      v-model="routeTab"
      :items="items"
      aria-labelledby="tabs-route-heading"
      data-test="route"
    >
      <template #panels>
        <MTabPanel
          v-for="item in items"
          :key="item.value"
          :value="item.value"
        >
          <p>Route panel {{ item.label }}</p>
        </MTabPanel>
      </template>
    </MTabs>

    <h2 id="tabs-slotted-heading">
      Slotted tabs, the last one preset
    </h2>
    <MTabs
      v-model="slotted"
      aria-labelledby="tabs-slotted-heading"
      data-test="slotted"
    >
      <template #tabs>
        <MTab
          v-for="item in items"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
      </template>
    </MTabs>

    <h2>Tabs without panels</h2>
    <MTabs
      :items="items"
      aria-label="Tabs without panels"
      data-test="bare"
    />

    <h2>One-letter labels</h2>
    <MTabs
      :items="shortItems"
      layout="scrollable"
      aria-label="One-letter tabs"
      data-test="short"
    />

    <h2>Icon over label, with badges</h2>
    <MTabs
      v-model="stacked"
      :items="iconItems"
      aria-label="Mailboxes"
      data-test="stacked"
    />

    <h2>Secondary</h2>
    <MTabs
      v-model="secondary"
      :items="iconItems"
      hierarchy="secondary"
      aria-label="Secondary mailboxes"
      data-test="secondary"
    />

    <h2>Scrollable, the last tab preset</h2>
    <div class="fixture-tabs__narrow">
      <MTabs
        v-model="scrolled"
        :items="manyItems"
        layout="scrollable"
        aria-label="Months"
        data-test="scrollable"
      />
    </div>

    <h2>Fixed, too many tabs for the card</h2>
    <div class="fixture-tabs__narrow">
      <MTabs
        :items="manyItems.slice(0, 6)"
        aria-label="Months in a card"
        data-test="fixed-narrow"
      />
    </div>

    <h2 id="tabs-routes-heading">
      Tabs that lead to pages
    </h2>
    <MTabs
      :items="routeItems"
      aria-labelledby="tabs-routes-heading"
      data-test="routes"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MTabs from '#kit/components/ui/tabs/index.vue'
import MTab from '#kit/components/ui/tabs/tab/index.vue'
import MTabPanel from '#kit/components/ui/tabs/panel/index.vue'
import type { MTabItem } from '#kit/components/ui/tabs/props'
import type { TabValue } from '#kit/composables/tabs/useTabs'

const items: MTabItem[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
]

const iconItems: MTabItem[] = [
  { value: 'inbox', label: 'Inbox', icon: 'outline-inbox', badge: 3, badgeLabel: '3 unread' },
  { value: 'sent', label: 'Sent', icon: 'outline-send' },
  { value: 'drafts', label: 'Drafts', icon: 'outline-drafts', badge: true, badgeLabel: 'New drafts' },
  { value: 'spam', label: 'Spam', icon: 'outline-report', disabled: true },
]

const shortItems: MTabItem[] = [
  { value: 'i', label: 'I' },
  { value: 'x', label: 'X' },
]

const manyItems: MTabItem[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  .map(month => ({ value: month.toLowerCase(), label: month }))

const routeItems: MTabItem[] = [
  { value: 'tabs', label: 'Tabs', to: '/tabs/matrix' },
  { value: 'pagination', label: 'Pagination', to: '/pagination/matrix' },
]

const stacked = ref<TabValue | null>('inbox')
const secondary = ref<TabValue | null>('sent')
const scrolled = ref<TabValue | null>('december')
const preset = ref<TabValue | null>('two')
const slotted = ref<TabValue | null>('three')

// The tab lives in `?tab=`: opening the page with it must keep it, and the
// first tab written back into an empty model must land in the URL.
const route = useRoute()
const router = useRouter()
const routeTab = computed<TabValue | null>({
  get: () => (typeof route.query.tab === 'string' ? route.query.tab : null),
  set: (value) => {
    router.replace({ query: { ...route.query, tab: value === null ? undefined : String(value) } })
  },
})
</script>

<style lang="scss">
.fixture-tabs {
  display: grid;
  gap: 16rem;
  max-width: 640rem;

  &__narrow {
    max-width: 280rem;
    border: 1rem solid var(--md-sys-color-outline-variant);
  }
}
</style>
