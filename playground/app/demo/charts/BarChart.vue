<template>
  <div class="bar-chart">
    <!-- Drawn for the eye; the table below carries the same figures for assistive technology. -->
    <svg
      class="bar-chart__plot"
      :viewBox="`0 0 ${bars.length * SLOT} ${HEIGHT}`"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        v-for="ratio in GRID"
        :key="ratio"
        class="bar-chart__grid"
        x1="0"
        :x2="bars.length * SLOT"
        :y1="HEIGHT - ratio * PLOT"
        :y2="HEIGHT - ratio * PLOT"
      />
      <rect
        v-for="(bar, index) in bars"
        :key="bar.key"
        class="bar-chart__bar"
        :class="{ 'bar-chart__bar--accent': bar.accent }"
        :x="index * SLOT + GAP / 2"
        :y="HEIGHT - barHeight(bar.value)"
        :width="SLOT - GAP"
        :height="barHeight(bar.value)"
      >
        <title>{{ bar.label }}: {{ bar.valueText }}</title>
      </rect>
    </svg>

    <div
      class="bar-chart__axis"
      :style="{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }"
      aria-hidden="true"
    >
      <span
        v-for="(bar, index) in bars"
        :key="bar.key"
        class="bar-chart__tick"
      >{{ index % labelEvery === 0 || bar.accent ? bar.tick : '' }}</span>
    </div>

    <table class="bar-chart__table">
      <caption>{{ caption }}</caption>
      <thead>
        <tr>
          <th scope="col">
            {{ labelHeader }}
          </th>
          <th scope="col">
            {{ valueHeader }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="bar in bars"
          :key="bar.key"
        >
          <th scope="row">
            {{ bar.label }}
          </th>
          <td>{{ bar.valueText }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Bar {
  key: string
  /** Full label for the data table and the hover title. */
  label: string
  /** Short axis label. */
  tick: string
  value: number
  valueText: string
  /** Drawn in the accent role (e.g. today). */
  accent?: boolean
}

const props = withDefaults(defineProps<{
  bars: Bar[]
  /** Caption of the data table that stands in for the chart. */
  caption: string
  labelHeader: string
  valueHeader: string
  /** Most axis labels that fit before they thin out. */
  maxTicks?: number
}>(), {
  maxTicks: 8,
})

const SLOT = 10
const GAP = 3
const HEIGHT = 100
const PLOT = 94
const GRID = [0.25, 0.5, 0.75, 1]

const max = computed(() => Math.max(1, ...props.bars.map(bar => bar.value)))
const labelEvery = computed(() => Math.max(1, Math.ceil(props.bars.length / props.maxTicks)))

const barHeight = (value: number) => (value / max.value) * PLOT
</script>

<style lang="scss">
.bar-chart {
  display: grid;
  gap: spacing(8);

  &__plot {
    display: block;
    width: 100%;
    height: 160rem;
  }

  &__grid {
    stroke: var(--md-sys-color-outline-variant);
    stroke-width: 1rem;
    vector-effect: non-scaling-stroke;
  }

  &__bar {
    fill: var(--md-sys-color-primary);

    &--accent {
      fill: var(--md-sys-color-tertiary);
    }
  }

  &__axis {
    display: grid;
    color: var(--md-sys-color-on-surface-variant);
    text-align: center;

    @include typescale('label-small');
  }

  &__tick {
    overflow: visible;
    white-space: nowrap;
  }

  &__table {
    @include sr-only;
  }

  @include forced-colors {
    &__bar {
      fill: CanvasText;

      &--accent {
        fill: Highlight;
      }
    }
  }
}
</style>
