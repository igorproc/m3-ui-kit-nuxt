<template>
  <div class="crm-deals">
    <div class="crm-deals__bar">
      <MToolbar
        v-if="selected.length"
        class="crm-deals__bulk"
        role="toolbar"
        aria-label="Действия с выбранными сделками"
      >
        <span class="crm-deals__count">
          {{ countLabel(selected.length, ['сделка выбрана', 'сделки выбраны', 'сделок выбрано']) }}
        </span>
        <CrmReassignMenu @choose="reassignSelected" />
        <MButton
          variant="text"
          density="compact"
          @click="selected = []"
        >
          Снять выделение
        </MButton>
      </MToolbar>

      <template v-else>
        <p class="crm-deals__range">
          {{ rangeText }}
        </p>
        <MButton
          variant="text"
          density="compact"
          :disabled="loading"
          @click="refresh"
        >
          <template #prepend>
            <MIcon name="outline-refresh" />
          </template>
          Обновить
        </MButton>
      </template>
    </div>

    <MTable
      v-model:sort="sort"
      v-model:selected-rows="selected"
      class="crm-deals__table"
      caption="Сделки"
      density="compact"
      :columns="columns"
      :data="pageRows"
      selectable
      select-all-label="Выбрать все сделки на странице"
      :loading="loading"
      :error="error"
      :status-text="statusText"
      @row-click="row => store.openDeal(row.id)"
      @retry="retry"
    >
      <template #cell-title="{ row }">
        <MButton
          variant="text"
          density="compact"
          @click="store.openDeal(row.id)"
        >
          {{ row.title }}
        </MButton>
      </template>

      <template #cell-owner="{ row }">
        <span class="crm-deals__owner">
          <MAvatar
            :name="row.owner"
            alt=""
            density="compact"
          />
          {{ row.owner }}
        </span>
      </template>

      <template #empty>
        <div class="crm-deals__message">
          <span>Под выбранные фильтры не попала ни одна сделка.</span>
          <MButton
            variant="text"
            density="compact"
            @click="store.resetFilters"
          >
            Сбросить фильтры
          </MButton>
        </div>
      </template>

      <template #error="{ error: message, retry: retryLoad }">
        <div class="crm-deals__message">
          <span>{{ message }}</span>
          <MButton
            variant="text"
            density="compact"
            @click="retryLoad"
          >
            Повторить
          </MButton>
        </div>
      </template>
    </MTable>

    <div class="crm-deals__footer">
      <MDropdown
        :messages="CRM_SELECT_MESSAGES"
        class="crm-deals__size"
        :model-value="pageSize"
        :items="PAGE_SIZE_ITEMS"
        item-value="id"
        label="Строк на странице"
        variant="outlined"
        density="compact"
        @update:model-value="onPageSize"
      />
      <CrmDealsPager
        v-model="page"
        :length="pageCount"
        :disabled="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { countLabel } from '../data/crmFormat'
import { CRM_SELECT_MESSAGES } from '../data/crmSelectMessages'
import { CRM_PAGE_SIZES, useCrmDealsTable } from '../composables/useCrmDealsTable'
import { useCrmStore } from '../composables/useCrmStore'
import CrmDealsPager from './CrmDealsPager.vue'
import CrmReassignMenu from './CrmReassignMenu.vue'

const PAGE_SIZE_ITEMS = CRM_PAGE_SIZES.map(size => ({ id: size, label: String(size) }))

const store = useCrmStore()
const {
  columns,
  sort,
  page,
  pageCount,
  pageSize,
  pageRows,
  range,
  selected,
  statusText,
  loading,
  error,
  refresh,
  retry,
  setPageSize,
  reassignSelected,
} = useCrmDealsTable(store)

const rangeText = computed(() => (range.value.total
  ? `${range.value.start}–${range.value.end} из ${range.value.total}`
  : 'Нет сделок'))

function onPageSize(value: unknown) {
  if (typeof value === 'number') setPageSize(value)
}
</script>

<style lang="scss">
.crm-deals {
  display: grid;
  gap: spacing(12);
  min-width: 0;

  &__bar,
  &__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: spacing(12);
    min-height: spacing(48);
  }

  &__range,
  &__count {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;

    @include typescale('label-large');
  }

  &__bulk {
    flex: 1 1 auto;
    gap: spacing(12);
  }

  &__owner {
    display: inline-flex;
    align-items: center;
    gap: spacing(8);
  }

  &__message {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: spacing(12);
  }

  &__size {
    width: 200rem;
  }
}
</style>
