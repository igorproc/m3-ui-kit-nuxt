<template>
  <div class="crm-funnel-tab">
    <h2 class="crm-funnel-tab__title">
      Аналитика за период: {{ periodLabel.toLocaleLowerCase('ru-RU') }}
    </h2>

    <div class="crm-funnel-tab__insights">
      <MCard
        variant="filled"
        title="Конверсия по этапам"
        :heading-level="3"
        subtitle="Сколько сделок дошло до этапа"
      >
        <CrmFunnelChart
          :steps="pipeline.funnel.value"
          :summary="`Воронка: ${pipeline.funnelSummary.value}`"
          caption="Конверсия по этапам воронки"
        />
      </MCard>

      <MCard
        variant="filled"
        title="Прогноз выручки"
        :heading-level="3"
        :subtitle="`Во взвешенной воронке ${formatCompactMoney(pipeline.weightedPipeline.value)}`"
      >
        <CrmAreaChart
          :series="FORECAST_SERIES"
          :rows="forecastRows"
          :today-index="todayIndex"
          :summary="pipeline.forecastSummary.value"
          caption="Выручка нарастающим итогом: факт и прогноз"
          :format-value="formatCompactMoney"
          :format-label="formatShortDate"
        />

        <template #actions>
          <!-- MTooltip puts aria-describedby on its own wrapper, not on the
               focused button, so the explanation is also wired up here. -->
          <MTooltip :text="WEIGHTED_HINT">
            <MButtonIcon
              aria-label="Как считается прогноз"
              :aria-describedby="hintId"
            >
              <MIcon name="outline-info" />
            </MButtonIcon>
          </MTooltip>
          <span
            :id="hintId"
            class="crm-funnel-tab__hint"
          >{{ WEIGHTED_HINT }}</span>
        </template>
      </MCard>

      <MCard
        variant="filled"
        title="Выигрыши и потери"
        :heading-level="3"
        subtitle="Закрытые за период сделки"
      >
        <CrmDonutChart
          :segments="pipeline.donut.value"
          :summary="donutSummary"
          :center-value="`${pipeline.winRate.value} %`"
          center-label="доля выигрышей"
        />
      </MCard>
    </div>

    <h2 class="crm-funnel-tab__title">
      Доска сделок
    </h2>
    <CrmPipelineBoard :columns="pipeline.columns.value" />
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import CrmAreaChart from '../../charts/CrmAreaChart.vue'
import type { CrmAreaChartRow, CrmAreaChartSeries } from '../../charts/CrmAreaChart.vue'
import CrmDonutChart from '../../charts/CrmDonutChart.vue'
import CrmFunnelChart from '../../charts/CrmFunnelChart.vue'
import { formatCompactMoney, formatShortDate } from '../data/crmFormat'
import { CRM_PERIODS } from '../data/crmTypes'
import { useCrmPipeline } from '../composables/useCrmPipeline'
import { useCrmStore } from '../composables/useCrmStore'
import CrmPipelineBoard from './CrmPipelineBoard.vue'

const FORECAST_SERIES: CrmAreaChartSeries[] = [
  { id: 'actual', label: 'Выиграно', role: 'primary' },
  { id: 'forecast', label: 'Прогноз', role: 'tertiary' },
]

const WEIGHTED_HINT = 'Взвешенная воронка — сумма открытых сделок, умноженная на вероятность выигрыша каждой.'

const store = useCrmStore()
const hintId = useId()
const pipeline = useCrmPipeline(store)

const periodLabel = computed(() => CRM_PERIODS.find(period => period.value === store.filters.period)?.label ?? '')

const forecastRows = computed<CrmAreaChartRow[]>(() => pipeline.forecast.value.map(point => ({
  label: point.date,
  values: { actual: point.actual, forecast: point.forecast },
})))

const todayIndex = computed(() => pipeline.forecast.value.findIndex(point => point.actual !== null && point.forecast !== null))

const donutSummary = computed(() => {
  const [won, lost] = pipeline.donut.value
  return `Выиграно ${won?.value ?? 0}, проиграно ${lost?.value ?? 0}, доля выигрышей ${pipeline.winRate.value} %`
})
</script>

<style lang="scss">
.crm-funnel-tab {
  display: grid;
  gap: spacing(16);

  &__title {
    margin: 0;
    color: var(--md-sys-color-on-surface);

    @include typescale('title-large');
  }

  &__hint {
    @include sr-only;
  }

  &__insights {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280rem, 1fr));
    align-items: stretch;
    gap: spacing(16);
  }
}
</style>
