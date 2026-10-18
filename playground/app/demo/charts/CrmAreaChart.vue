<template>
  <figure class="crm-area-chart">
    <svg
      class="crm-area-chart__svg"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      role="img"
      :aria-label="summary"
    >
      <g
        v-for="tick in ticks"
        :key="tick.value"
      >
        <line
          class="crm-area-chart__grid"
          :x1="PAD_START"
          :x2="WIDTH - PAD_END"
          :y1="tick.y"
          :y2="tick.y"
        />
        <text
          class="crm-area-chart__axis"
          :x="PAD_START - 8"
          :y="tick.y"
          text-anchor="end"
          dominant-baseline="middle"
        >{{ tick.text }}</text>
      </g>

      <line
        v-if="todayX !== null"
        class="crm-area-chart__today"
        :x1="todayX"
        :x2="todayX"
        :y1="PAD_TOP"
        :y2="baseline"
      />

      <g
        v-for="line in drawn"
        :key="line.id"
        class="crm-area-chart__series"
        :style="{ '--crm-series-color': roleColor(line.role) }"
      >
        <path
          class="crm-area-chart__area"
          :d="areaPath(line.points, baseline)"
        />
        <path
          class="crm-area-chart__line"
          :d="linePath(line.points)"
        />
        <g
          v-for="point in line.points"
          :key="point.x"
        >
          <title>{{ point.title }}</title>
          <circle
            class="crm-area-chart__dot"
            :cx="point.x"
            :cy="point.y"
            r="4"
          />
        </g>
      </g>

      <text
        v-for="label in xLabels"
        :key="label.x"
        class="crm-area-chart__axis"
        :x="label.x"
        :y="HEIGHT - 4"
        :text-anchor="label.anchor"
      >{{ label.text }}</text>
    </svg>

    <figcaption class="crm-area-chart__legend">
      <span
        v-for="item in seriesList"
        :key="item.id"
        class="crm-area-chart__key"
      >
        <span
          class="crm-area-chart__swatch"
          :style="{ backgroundColor: roleColor(item.role) }"
          aria-hidden="true"
        />
        {{ item.label }}
      </span>
    </figcaption>

    <table class="crm-area-chart__table">
      <caption>{{ caption }}</caption>
      <thead>
        <tr>
          <th scope="col">
            Дата
          </th>
          <th
            v-for="item in seriesList"
            :key="item.id"
            scope="col"
          >
            {{ item.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in rows"
          :key="index"
        >
          <th scope="row">
            {{ formatLabel(row.label) }}
          </th>
          <td
            v-for="item in seriesList"
            :key="item.id"
          >
            {{ row.values[item.id] === null || row.values[item.id] === undefined ? '—' : formatValue(row.values[item.id]!) }}
          </td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { areaPath, linePath, niceCeiling, roleColor } from './crmChartGeometry'
import type { ChartPoint } from './crmChartGeometry'

export interface CrmAreaChartSeries {
  id: string
  label: string
  /** M3 colour role of the line and its wash. */
  role: 'primary' | 'secondary' | 'tertiary'
}

export interface CrmAreaChartRow {
  /** Raw x value, turned into text by `formatLabel`. */
  label: string
  /** `null` where the series has no value (the forecast before today). */
  values: Record<string, number | null>
}

const props = defineProps<{
  series: CrmAreaChartSeries[]
  rows: CrmAreaChartRow[]
  summary: string
  caption: string
  formatValue: (value: number) => string
  formatLabel: (label: string) => string
  /** Index of the row to mark as today. */
  todayIndex?: number
}>()

const WIDTH = 400
const HEIGHT = 200
const PAD_START = 56
const PAD_END = 12
const PAD_TOP = 8
const PAD_BOTTOM = 24

const baseline = HEIGHT - PAD_BOTTOM
const seriesList = computed(() => props.series)

const max = computed(() => niceCeiling(Math.max(0, ...props.rows.flatMap(row => Object.values(row.values).filter((value): value is number => value !== null)))))

const xOf = (index: number) => {
  const span = Math.max(1, props.rows.length - 1)
  return PAD_START + (index / span) * (WIDTH - PAD_START - PAD_END)
}
const yOf = (value: number) => baseline - (value / max.value) * (baseline - PAD_TOP)

const ticks = computed(() => [0, 0.5, 1].map(share => ({
  value: share,
  y: yOf(max.value * share),
  text: props.formatValue(max.value * share),
})))

interface DrawnPoint extends ChartPoint {
  title: string
}

const drawn = computed(() => props.series.map(series => ({
  ...series,
  points: props.rows.flatMap((row, index): DrawnPoint[] => {
    const value = row.values[series.id]
    if (value === null || value === undefined) return []
    return [{ x: xOf(index), y: yOf(value), title: `${props.formatLabel(row.label)} · ${series.label}: ${props.formatValue(value)}` }]
  }),
})))

const todayX = computed(() => (props.todayIndex === undefined || props.todayIndex < 0 ? null : xOf(props.todayIndex)))

const xLabels = computed(() => {
  const last = props.rows.length - 1
  const indexes = [...new Set([0, props.todayIndex ?? 0, last])].filter(index => index >= 0)
  return indexes.map((index) => {
    const row = props.rows[index]
    const anchor: 'start' | 'middle' | 'end' = index === 0 ? 'start' : index === last ? 'end' : 'middle'
    return { x: xOf(index), anchor, text: row ? props.formatLabel(row.label) : '' }
  })
})
</script>

<style lang="scss">
.crm-area-chart {
  display: grid;
  gap: spacing(8);
  margin: 0;

  &__svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;

    // Chart geometry is drawn left to right; an RTL page must not flip the text anchors.
    direction: ltr;
  }

  &__grid {
    stroke: var(--md-sys-color-outline-variant);
    stroke-width: 1;
  }

  &__today {
    stroke: var(--md-sys-color-outline);
    stroke-width: 1;
  }

  &__axis {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    fill: var(--md-sys-color-on-surface-variant);
  }

  &__area {
    fill: var(--crm-series-color);
    fill-opacity: 0.12;
  }

  &__line {
    fill: none;
    stroke: var(--crm-series-color);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__dot {
    fill: var(--crm-series-color);
    stroke: var(--md-sys-color-surface-container-highest);
    stroke-width: 2;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: spacing(16);
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('label-medium');
  }

  &__key {
    display: inline-flex;
    align-items: center;
    gap: spacing(8);
  }

  &__swatch {
    width: spacing(16);
    height: spacing(4);
    border-radius: var(--sys-shape-corner-full);
  }

  &__table {
    @include sr-only;
  }

  @include forced-colors {
    &__line {
      stroke: CanvasText;
    }

    &__dot {
      fill: CanvasText;
    }
  }
}
</style>
