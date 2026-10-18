<template>
  <MCard
    class="orders-kpi"
    variant="outlined"
    :title="kpi.label"
    :heading-level="3"
  >
    <p class="orders-kpi__value">
      {{ kpi.value }}
    </p>

    <div class="orders-kpi__delta">
      <span
        class="orders-kpi__change"
        :class="`orders-kpi__change--${tone}`"
      >
        <MIcon :name="TREND_ICONS[kpi.trend]" />
        <span class="orders-kpi__hidden">{{ trendWord }}</span>
        {{ deltaText }}
      </span>

      <MTooltip :text="kpi.explanation">
        <MButtonIcon
          density="compact"
          :aria-label="`Как считается изменение: ${kpi.label}`"
        >
          <MIcon name="ic:outline-info" />
        </MButtonIcon>
      </MTooltip>
    </div>

    <SparklineChart
      :values="kpi.series"
      :label="sparklineLabel"
      :tone="tone === 'bad' ? 'error' : 'primary'"
    />
  </MCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SparklineChart from '~/demo/charts/SparklineChart.vue'
import { signedPercent } from './data/format'
import type { Kpi, KpiTrend } from './useOrdersMetrics'

const props = defineProps<{
  kpi: Kpi
  /** Formatted last value of the series, for the chart's text alternative. */
  lastValue: string
}>()

const TREND_ICONS: Record<KpiTrend, string> = {
  up: 'ic:outline-trending-up',
  down: 'ic:outline-trending-down',
  flat: 'ic:outline-trending-flat',
}

const tone = computed(() => (props.kpi.trend === 'flat' ? 'neutral' : props.kpi.positive ? 'good' : 'bad'))
const deltaText = computed(() => (props.kpi.delta === null ? 'нет данных для сравнения' : signedPercent.format(props.kpi.delta)))
const trendWord = computed(() => ({ up: 'Рост', down: 'Снижение', flat: 'Без изменений' })[props.kpi.trend])
const sparklineLabel = computed(() => `${props.kpi.seriesLabel}. Последний день: ${props.lastValue}.`)
</script>

<style lang="scss">
.orders-kpi {
  &__value {
    margin: 0;
    color: var(--md-sys-color-on-surface);
    font-variant-numeric: tabular-nums;

    @include typescale('headline-small');
  }

  &__delta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: spacing(8);
  }

  &__change {
    display: inline-flex;
    align-items: center;
    gap: spacing(4);
    font-variant-numeric: tabular-nums;

    @include typescale('label-large');

    &--good {
      color: var(--md-sys-color-success);
    }

    &--bad {
      color: var(--md-sys-color-error);
    }

    &--neutral {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  &__hidden {
    @include sr-only;
  }
}
</style>
