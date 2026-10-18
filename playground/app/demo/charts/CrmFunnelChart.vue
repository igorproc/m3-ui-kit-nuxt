<template>
  <figure class="crm-funnel-chart">
    <svg
      class="crm-funnel-chart__svg"
      :viewBox="`0 0 ${WIDTH} ${height}`"
      role="img"
      :aria-label="summary"
    >
      <g
        v-for="(row, index) in rows"
        :key="row.id"
        :transform="`translate(0 ${index * ROW_HEIGHT})`"
      >
        <title>{{ row.title }}</title>
        <text
          class="crm-funnel-chart__label"
          :x="0"
          :y="ROW_HEIGHT / 2"
          dominant-baseline="middle"
        >{{ row.label }}</text>
        <path
          class="crm-funnel-chart__bar"
          :d="horizontalBarPath(LABEL_WIDTH, (ROW_HEIGHT - BAR_HEIGHT) / 2, row.width, BAR_HEIGHT)"
        />
        <text
          class="crm-funnel-chart__value"
          :x="LABEL_WIDTH + row.width + 8"
          :y="ROW_HEIGHT / 2"
          dominant-baseline="middle"
        >{{ row.valueText }}</text>
      </g>
    </svg>

    <table class="crm-funnel-chart__table">
      <caption>{{ caption }}</caption>
      <thead>
        <tr>
          <th scope="col">
            Этап
          </th>
          <th scope="col">
            Сделок
          </th>
          <th scope="col">
            Конверсия из предыдущего этапа
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="step in steps"
          :key="step.id"
        >
          <th scope="row">
            {{ step.label }}
          </th>
          <td>{{ step.count }}</td>
          <td>{{ step.conversion === null ? '—' : `${step.conversion} %` }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { horizontalBarPath } from './crmChartGeometry'

export interface CrmFunnelChartStep {
  id: string
  label: string
  count: number
  /** Share of the previous step, %; `null` for the first one. */
  conversion: number | null
}

const props = defineProps<{
  steps: CrmFunnelChartStep[]
  /** Spoken summary of the whole chart. */
  summary: string
  /** Caption of the data table that backs the chart for assistive technology. */
  caption: string
}>()

const WIDTH = 400
const ROW_HEIGHT = 36
const BAR_HEIGHT = 20
const LABEL_WIDTH = 116
const VALUE_ROOM = 76

const height = computed(() => props.steps.length * ROW_HEIGHT)
const max = computed(() => Math.max(1, ...props.steps.map(step => step.count)))

const rows = computed(() => props.steps.map((step) => {
  const conversion = step.conversion === null ? '' : ` · ${step.conversion} %`
  return {
    id: step.id,
    label: step.label,
    width: (step.count / max.value) * (WIDTH - LABEL_WIDTH - VALUE_ROOM),
    valueText: `${step.count}${conversion}`,
    title: `${step.label}: ${step.count}${conversion}`,
  }
}))
</script>

<style lang="scss">
.crm-funnel-chart {
  margin: 0;

  &__svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;

    // Chart geometry is drawn left to right; an RTL page must not flip the text anchors.
    direction: ltr;
  }

  &__label,
  &__value {
    font-size: 12px;
    fill: var(--md-sys-color-on-surface-variant);
  }

  &__value {
    font-variant-numeric: tabular-nums;
    fill: var(--md-sys-color-on-surface);
  }

  &__bar {
    fill: var(--md-sys-color-primary);
  }

  &__table {
    @include sr-only;
  }

  @include forced-colors {
    &__bar {
      fill: CanvasText;
    }
  }
}
</style>
