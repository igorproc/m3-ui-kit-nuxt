<template>
  <MSheet
    v-model="store.sheetOpen.value"
    :aria-labelledby="titleId"
  >
    <!-- MSheet neither caps its height nor scrolls: a tall sheet would grow
         past the top of the viewport, so the content scrolls itself. -->
    <div
      v-if="deal"
      class="crm-deal-sheet"
    >
      <header class="crm-deal-sheet__header">
        <MBreadcrumbs
          :items="crumbs"
          aria-label="Расположение сделки"
          divider="/"
        />
        <div class="crm-deal-sheet__heading">
          <h2
            :id="titleId"
            class="crm-deal-sheet__title"
          >
            {{ deal.title }}
          </h2>
          <MButtonIcon
            aria-label="Закрыть карточку сделки"
            @click="store.sheetOpen.value = false"
          >
            <MIcon :name="ICONS.close" />
          </MButtonIcon>
        </div>
        <p class="crm-deal-sheet__meta">
          {{ deal.id }} · {{ formatMoney(deal.amount) }} · {{ stageLabel(deal.status) }}
        </p>
      </header>

      <MTabs
        v-model="tab"
        :items="TABS"
      >
        <template #panels>
          <MTabsPanel value="overview">
            <CrmDealOverview :deal="deal" />
          </MTabsPanel>
          <MTabsPanel value="activity">
            <CrmDealActivity :deal-id="deal.id" />
          </MTabsPanel>
          <MTabsPanel value="files">
            <CrmDealFiles
              :deal-id="deal.id"
              :queue="uploads.queueFor(deal.id)"
            />
          </MTabsPanel>
        </template>
      </MTabs>
    </div>
  </MSheet>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import type { MTabItem } from '#kit/components/ui/tabs/props'
import type { MBreadcrumbItem } from '#kit/components/ui/breadcrumbs/props'
import { ICONS } from '#kit/shared/constants/icons'
import { formatMoney } from '../data/crmFormat'
import { companyName } from '../data/crmLookup'
import { stageLabel } from '../data/crmTypes'
import { useCrmStore } from '../composables/useCrmStore'
import { useCrmDealUploads } from '../composables/useCrmDealUploads'
import CrmDealActivity from './CrmDealActivity.vue'
import CrmDealFiles from './CrmDealFiles.vue'
import CrmDealOverview from './CrmDealOverview.vue'

const TABS: MTabItem[] = [
  { value: 'overview', label: 'Обзор', icon: 'outline-info' },
  { value: 'activity', label: 'Активность', icon: 'outline-history' },
  { value: 'files', label: 'Файлы', icon: 'outline-attach-file' },
]

const store = useCrmStore()
const uploads = useCrmDealUploads()
const titleId = useId()
const tab = ref<string | number | null>('overview')

const deal = computed(() => store.sheetDeal.value)

// MBreadcrumbs only navigates by route, so the trail is text: the sheet itself
// is not a page.
const crumbs = computed<MBreadcrumbItem[]>(() => [
  { title: 'Сделки' },
  { title: deal.value ? companyName(deal.value.companyId) : '' },
  { title: deal.value?.title ?? '', current: true },
])

watch(() => store.sheetDealId.value, () => {
  tab.value = 'overview'
})
</script>

<style lang="scss">
.crm-deal-sheet {
  display: grid;
  gap: spacing(16);
  max-height: calc(100dvh - 120rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-inline: spacing(8);

  &__header {
    display: grid;
    gap: spacing(8);
  }

  &__heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: spacing(12);
  }

  &__title {
    margin: 0;
    color: var(--md-sys-color-on-surface);

    @include typescale('headline-small');
  }

  &__meta {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;

    @include typescale('body-medium');
  }
}
</style>
