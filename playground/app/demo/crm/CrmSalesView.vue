<template>
  <div class="crm-sales">
    <div class="crm-sales__primary">
      <MTabs
        v-model="tab"
        :items="TABS"
      >
        <template #panels>
          <MTabsPanel value="funnel">
            <CrmFunnelTab />
          </MTabsPanel>
          <MTabsPanel value="deals">
            <CrmDealsTab />
          </MTabsPanel>
          <MTabsPanel value="tasks">
            <CrmTasksTab />
          </MTabsPanel>
        </template>
      </MTabs>
    </div>

    <aside
      class="crm-sales__aside"
      aria-label="Команда"
    >
      <CrmTeamCard />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MTabItem } from '#kit/components/ui/tabs/props'
import type { TabValue } from '#kit/composables/tabs/useTabs'
import type { CrmTab } from './data/crmTypes'
import { formatInteger } from './data/crmFormat'
import { useCrmStore } from './composables/useCrmStore'
import CrmDealsTab from './deals/CrmDealsTab.vue'
import CrmFunnelTab from './pipeline/CrmFunnelTab.vue'
import CrmTasksTab from './tasks/CrmTasksTab.vue'
import CrmTeamCard from './team/CrmTeamCard.vue'

const store = useCrmStore()

const TAB_VALUES: readonly CrmTab[] = ['funnel', 'deals', 'tasks']

const TABS = computed<MTabItem[]>(() => [
  { value: 'funnel', label: 'Воронка', icon: 'outline-view-kanban' },
  { value: 'deals', label: `Сделки (${formatInteger(store.visibleDeals.value.length)})`, icon: 'outline-table-rows' },
  { value: 'tasks', label: 'Задачи', icon: 'outline-checklist' },
])

const tab = computed<TabValue | null>({
  get: () => store.tab.value,
  set: (value) => {
    const next = TAB_VALUES.find(item => item === value)
    if (next) store.tab.value = next
  },
})
</script>

<style lang="scss">
@use 'sass:map';

.crm-sales {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: spacing(24);

  &__primary {
    min-width: 0;
  }

  @include media-min(map.get($breakpoints, 'desktop-xs')) {
    grid-template-columns: minmax(0, 1fr) 380rem;
  }
}
</style>
