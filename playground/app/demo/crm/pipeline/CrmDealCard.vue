<template>
  <MCard
    variant="outlined"
    class="crm-deal-card"
    :title="company"
    :subtitle="deal.title"
    :heading-level="4"
  >
    <p class="crm-deal-card__amount">
      {{ formatMoney(deal.amount) }}
    </p>

    <p class="crm-deal-card__owner">
      <MAvatar
        :name="owner.name"
        alt=""
        density="compact"
      />
      {{ owner.name }}
    </p>

    <div
      v-if="deal.tags.length"
      class="crm-deal-card__tags"
    >
      <!-- A standalone filter chip toggles but does not expose aria-pressed,
           so the state is passed through as an attribute. -->
      <MChip
        v-for="tag in deal.tags"
        :key="tag"
        type="filter"
        :model-value="store.filters.tags.includes(tag)"
        :aria-pressed="String(store.filters.tags.includes(tag))"
        @update:model-value="store.toggleTag(tag)"
      >
        {{ tagLabel(tag) }}
      </MChip>
    </div>

    <p
      class="crm-deal-card__age"
      :class="{ 'crm-deal-card__age--stale': stale }"
    >
      <MIcon :name="stale ? 'outline-warning-amber' : 'outline-schedule'" />
      {{ ageText }}
    </p>

    <template #actions>
      <MButton
        variant="tonal"
        density="compact"
        :aria-label="`Открыть сделку «${deal.title}», ${company}`"
        @click="store.openDeal(deal.id)"
      >
        Открыть
      </MButton>
      <CrmMoveMenu :deal="deal" />
    </template>
  </MCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CRM_TODAY, countLabel, daysBetween, formatMoney } from '../data/crmFormat'
import { companyName, findOwner, isOpenDeal } from '../data/crmLookup'
import { tagLabel } from '../data/crmTypes'
import type { CrmDeal } from '../data/crmTypes'
import { useCrmStore } from '../composables/useCrmStore'
import CrmMoveMenu from './CrmMoveMenu.vue'

/** A deal that sat in one stage this long is flagged as stuck. */
const STALE_AFTER_DAYS = 21

const props = defineProps<{
  deal: CrmDeal
}>()

const store = useCrmStore()

const company = computed(() => companyName(props.deal.companyId))
const owner = computed(() => findOwner(props.deal.ownerId))
const days = computed(() => daysBetween(props.deal.stageSince, CRM_TODAY))
const stale = computed(() => isOpenDeal(props.deal) && days.value > STALE_AFTER_DAYS)
const ageText = computed(() => {
  const age = `${countLabel(days.value, ['день', 'дня', 'дней'])} на этапе`
  return stale.value ? `${age} — сделка застряла` : age
})
</script>

<style lang="scss">
.crm-deal-card {
  height: 100%;

  &__amount {
    margin: 0;
    color: var(--md-sys-color-on-surface);
    font-variant-numeric: tabular-nums;

    @include typescale('title-large');
  }

  &__owner,
  &__age {
    display: flex;
    align-items: center;
    gap: spacing(8);
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('body-medium');
  }

  &__age--stale {
    color: var(--md-sys-color-error);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: spacing(8);
  }
}
</style>
