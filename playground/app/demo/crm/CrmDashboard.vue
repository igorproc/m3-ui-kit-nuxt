<template>
  <div class="crm">
    <MLayout>
      <MLayoutHeader>
        <CrmAppBar
          v-model:query="store.filters.query"
          :compact="compact"
          @open-drawer="drawerOpen = true"
          @search="store.tab.value = 'deals'"
        />
      </MLayoutHeader>

      <CrmNavRail
        :section="section"
        :items="railItems"
        :expanded="expanded"
        @select="select"
      />

      <MLayoutMain>
        <div class="crm__main">
          <CrmPageHeader
            :title="sectionLabel"
            :hotkeys="hotkeys"
          />
          <CrmSalesView v-if="section === 'deals' || section === 'tasks'" />
          <CrmSectionStub
            v-else
            :label="sectionLabel"
            :deals-link="linkTo('deals')"
          />
        </div>
      </MLayoutMain>
    </MLayout>

    <!-- Outside MLayout on purpose: MLayoutMain is a size container, which
         makes it the containing block of `position: fixed` descendants. -->
    <MButtonExtendedFab
      class="crm__fab"
      @click="store.newDealOpen.value = true"
    >
      <template #prepend>
        <MIcon :name="ICONS.add" />
      </template>
      Новая сделка
    </MButtonExtendedFab>

    <CrmNavDrawer
      v-model="drawerOpen"
      :items="navEntries"
      :section="section"
      :link-to="linkTo"
    />
    <CrmDealSheet />
    <CrmNewDealDialog />
    <MSnackbar
      v-model="store.snackbar.open.value"
      :label="store.snackbar.label.value"
      :action-label="store.snackbar.canUndo.value ? 'Отменить' : ''"
      @action="store.snackbar.undo"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MNavigationRailItem } from '#kit/components/ui/navigation-rail/props'
import { useBreakpoint } from '#kit/composables/useBreakpoint'
import { ICONS } from '#kit/shared/constants/icons'
import { countLabel } from './data/crmFormat'
import { isOpenDeal } from './data/crmLookup'
import { CRM_SECTIONS } from './data/crmTypes'
import { useCrmHotkeys } from './composables/useCrmHotkeys'
import { useCrmSection } from './composables/useCrmSection'
import { provideCrmStore } from './composables/useCrmStore'
import CrmSalesView from './CrmSalesView.vue'
import CrmDealSheet from './details/CrmDealSheet.vue'
import CrmNewDealDialog from './new-deal/CrmNewDealDialog.vue'
import CrmAppBar from './shell/CrmAppBar.vue'
import CrmNavDrawer from './shell/CrmNavDrawer.vue'
import type { CrmNavEntry } from './shell/CrmNavDrawer.vue'
import CrmNavRail from './shell/CrmNavRail.vue'
import CrmPageHeader from './shell/CrmPageHeader.vue'
import CrmSectionStub from './shell/CrmSectionStub.vue'

const store = provideCrmStore()
const { section, sectionLabel, linkTo, select } = useCrmSection()
const { less } = useBreakpoint()

// Window classes of M3: compact < 768 ≤ medium < 1200 ≤ expanded.
const compact = computed(() => less.value.tabletXs)
const expanded = computed(() => !less.value.desktopXs)
const drawerOpen = ref(false)

const navEntries = computed<CrmNavEntry[]>(() => {
  const open = store.deals.value.filter(isOpenDeal).length
  const overdue = store.overdueTasks.value.length

  return CRM_SECTIONS.map((item) => {
    if (item.id === 'deals') return { ...item, badge: open, badgeLabel: `открытых: ${open}` }
    if (item.id === 'tasks' && overdue) return { ...item, badge: overdue, badgeLabel: `просрочено: ${overdue}` }
    return { ...item }
  })
})

const railItems = computed<MNavigationRailItem[]>(() => navEntries.value.map(item => ({
  id: item.id,
  icon: item.icon,
  label: item.label,
  badge: item.badge,
})))

watch(section, (value) => {
  if (value === 'tasks') store.tab.value = 'tasks'
}, { immediate: true })

const hotkeys = useCrmHotkeys({
  enabled: () => !store.sheetOpen.value && !store.newDealOpen.value && !drawerOpen.value,
  focusSearch: () => document.querySelector<HTMLInputElement>('[data-crm-search]')?.focus(),
  newDeal: () => {
    store.newDealOpen.value = true
  },
})

useHead({
  meta: [{ name: 'description', content: `Демо CRM: ${countLabel(store.deals.value.length, ['сделка', 'сделки', 'сделок'])} в воронке` }],
})
</script>

<style lang="scss">
@use 'sass:map';

.crm {
  &__main {
    display: grid;
    gap: spacing(24);
    padding: spacing(24);
  }

  &__fab {
    position: fixed;
    inset-block-end: spacing(24);
    inset-inline-end: spacing(24);
    z-index: z(header);
  }

  @include media-max(map.get($breakpoints, 'mobile')) {
    &__main {
      gap: spacing(16);
      padding: spacing(16);
    }

    &__fab {
      inset-block-end: spacing(16);
      inset-inline-end: spacing(16);
    }
  }
}
</style>
