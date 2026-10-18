<template>
  <div class="crm-deal-overview">
    <CrmInlineEdit
      kind="text"
      label="Название"
      :model-value="deal.title"
      @update:model-value="value => rename(String(value))"
    />
    <CrmInlineEdit
      kind="money"
      label="Сумма"
      :model-value="deal.amount"
      @update:model-value="value => reprice(Number(value))"
    />

    <MDivider />

    <MSlider
      :model-value="deal.probability"
      label="Вероятность выигрыша, %"
      :min="0"
      :max="100"
      :step="5"
      show-value
      discrete
      @update:model-value="setProbability"
    />

    <MSwitch
      :model-value="deal.reminders"
      label="Напоминания о следующем шаге"
      @update:model-value="value => store.updateDeal(deal.id, { reminders: value })"
    />

    <MDivider />

    <dl class="crm-deal-overview__facts">
      <div
        v-for="fact in facts"
        :key="fact.label"
        class="crm-deal-overview__fact"
      >
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatLongDate, formatMoney } from '../data/crmFormat'
import { companyName, findOwner } from '../data/crmLookup'
import { CRM_PRIORITIES, stageLabel, tagLabel } from '../data/crmTypes'
import type { CrmDeal } from '../data/crmTypes'
import { useCrmStore } from '../composables/useCrmStore'
import CrmInlineEdit from './CrmInlineEdit.vue'

const props = defineProps<{
  deal: CrmDeal
}>()

const store = useCrmStore()

const facts = computed(() => [
  { label: 'Компания', value: companyName(props.deal.companyId) },
  { label: 'Этап', value: stageLabel(props.deal.status) },
  { label: 'Ответственный', value: findOwner(props.deal.ownerId).name },
  { label: 'Контакт', value: props.deal.contact || '—' },
  { label: 'Приоритет', value: CRM_PRIORITIES.find(item => item.value === props.deal.priority)?.label ?? '—' },
  { label: 'Закрытие', value: formatLongDate(props.deal.closeDate) },
  { label: 'Метки', value: props.deal.tags.map(tagLabel).join(', ') || '—' },
])

function rename(title: string) {
  store.updateDeal(props.deal.id, { title }, {
    title: 'Название изменено',
    text: title,
    icon: 'outline-edit',
    color: 'secondary',
    status: 'Изменение',
  })
}

function reprice(amount: number) {
  store.updateDeal(props.deal.id, { amount }, {
    title: 'Сумма изменена',
    text: formatMoney(amount),
    icon: 'outline-attach-money',
    color: 'tertiary',
    status: 'Изменение',
  })
}

function setProbability(value: number | number[]) {
  const probability = Array.isArray(value) ? value[0] ?? 0 : value
  store.updateDeal(props.deal.id, { probability })
}
</script>

<style lang="scss">
.crm-deal-overview {
  display: grid;
  gap: spacing(16);

  &__facts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200rem, 1fr));
    gap: spacing(12) spacing(24);
    margin: 0;
  }

  &__fact {
    display: grid;
    gap: spacing(2);

    dt {
      color: var(--md-sys-color-on-surface-variant);

      @include typescale('label-medium');
    }

    dd {
      margin: 0;
      color: var(--md-sys-color-on-surface);

      @include typescale('body-large');
    }
  }
}
</style>
