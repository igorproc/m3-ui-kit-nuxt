<template>
  <header class="crm-page-header">
    <MBreadcrumbs
      :items="crumbs"
      aria-label="Навигационная цепочка"
      divider="/"
    />

    <div class="crm-page-header__title-row">
      <h1 class="crm-page-header__title">
        {{ title }}
      </h1>
      <p class="crm-page-header__hotkeys">
        <span class="crm-page-header__hotkey">
          <MHotkey
            :hotkey="hotkeys.search"
            aria-label="Клавиша «косая черта»"
          />
          поиск
        </span>
        <span class="crm-page-header__hotkey">
          <MHotkey
            :hotkey="hotkeys.newDeal"
            aria-label="Клавиша N"
          />
          новая сделка
        </span>
      </p>
    </div>

    <div class="crm-page-header__filters">
      <MButtonSegmented
        :model-value="store.filters.period"
        :items="PERIOD_ITEMS"
        aria-label="Период"
        @update:model-value="onPeriod"
      />
      <CrmOwnerFilter v-model="store.filters.owners" />
      <MButton
        v-if="store.hasFilters.value"
        variant="text"
        @click="store.resetFilters"
      >
        <template #prepend>
          <MIcon :name="ICONS.close" />
        </template>
        Сбросить фильтры
      </MButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MBreadcrumbItem } from '#kit/components/ui/breadcrumbs/props'
import type { MSegmentedItem } from '#kit/components/ui/button/segmented/props'
import { ICONS } from '#kit/shared/constants/icons'
import type { HotkeyPresentation } from '#kit/shared/types/hotkey'
import { CRM_PERIODS, isCrmPeriod } from '../data/crmTypes'
import { useCrmStore } from '../composables/useCrmStore'
import CrmOwnerFilter from './CrmOwnerFilter.vue'

const props = defineProps<{
  title: string
  hotkeys: { search: HotkeyPresentation, newDeal: HotkeyPresentation }
}>()

const PERIOD_ITEMS: MSegmentedItem[] = CRM_PERIODS.map(period => ({ value: period.value, label: period.label }))

const store = useCrmStore()

const crumbs = computed<MBreadcrumbItem[]>(() => [
  { title: 'Витрина компонентов', to: '/' },
  { title: 'CRM' },
  { title: props.title, current: true },
])

function onPeriod(value: unknown) {
  if (isCrmPeriod(value)) store.filters.period = value
}
</script>

<style lang="scss">
.crm-page-header {
  display: grid;
  gap: spacing(12);

  &__title-row,
  &__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: spacing(12) spacing(24);
  }

  &__title-row {
    justify-content: space-between;
  }

  &__title {
    margin: 0;
    color: var(--md-sys-color-on-surface);

    @include typescale('headline-medium');
  }

  &__hotkeys {
    display: flex;
    flex-wrap: wrap;
    gap: spacing(16);
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('body-small');
  }

  &__hotkey {
    display: inline-flex;
    align-items: center;
    gap: spacing(8);
  }
}
</style>
