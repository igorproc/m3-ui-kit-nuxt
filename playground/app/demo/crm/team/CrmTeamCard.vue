<template>
  <MCard
    variant="filled"
    class="crm-team"
    title="Команда"
    subtitle="Выполнение плана квартала и оценка лидов"
    :heading-level="2"
  >
    <MList aria-label="Рейтинг менеджеров">
      <MListItem
        v-for="(member, index) in leaderboard"
        :key="member.id"
        :overline="`${index + 1} место · ${member.role}`"
        :headline="member.name"
        :supporting-text="`${formatCompactMoney(member.won)} из ${formatCompactMoney(member.quota)}`"
        :lines="3"
      >
        <template #leading>
          <MAvatar
            :name="member.name"
            alt=""
          />
        </template>

        <template #trailing>
          <span class="crm-team__stats">
            <span class="crm-team__quota">
              <MProgressCircular
                :value="Math.min(member.percent, 100)"
                size="small"
                :aria-label="`План: ${member.name}`"
                :aria-valuetext="`${member.percent} % плана`"
              />
              <span aria-hidden="true">{{ member.percent }} %</span>
            </span>
            <MRating
              :model-value="member.score"
              readonly
              :aria-label="`Оценка лидов: ${member.name}`"
              :aria-valuetext="`${member.score} из 5`"
            />
          </span>
        </template>
      </MListItem>
    </MList>
  </MCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCompactMoney } from '../data/crmFormat'
import { CRM_OWNERS } from '../data/crmSeed'
import { useCrmStore } from '../composables/useCrmStore'

const store = useCrmStore()

/** Won before the demo's deals start, so the plan is not empty at quarter start. */
const CARRIED_OVER_SHARE = 0.35

const leaderboard = computed(() => CRM_OWNERS
  .map((owner) => {
    const won = store.deals.value
      .filter(deal => deal.ownerId === owner.id && deal.status === 'won')
      .reduce((sum, deal) => sum + deal.amount, owner.quota * CARRIED_OVER_SHARE)
    return { ...owner, won, percent: Math.round((won / owner.quota) * 100) }
  })
  .sort((left, right) => right.percent - left.percent))
</script>

<style lang="scss">
.crm-team {
  &__stats {
    display: grid;
    justify-items: end;
    gap: spacing(4);
  }

  &__quota {
    display: inline-flex;
    align-items: center;
    gap: spacing(8);
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;

    @include typescale('label-medium');
  }
}
</style>
