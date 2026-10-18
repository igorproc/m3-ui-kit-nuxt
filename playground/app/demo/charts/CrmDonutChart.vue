<template>
  <figure class="crm-donut-chart">
    <svg
      class="crm-donut-chart__svg"
      viewBox="0 0 160 160"
      role="img"
      :aria-label="summary"
    >
      <circle
        class="crm-donut-chart__track"
        cx="80"
        cy="80"
        :r="RADIUS"
      />
      <g
        v-for="arc in arcs"
        :key="arc.id"
      >
        <title>{{ arc.title }}</title>
        <circle
          class="crm-donut-chart__arc"
          cx="80"
          cy="80"
          :r="RADIUS"
          :style="{ stroke: roleColor(arc.role) }"
          :stroke-dasharray="arc.dash"
          :stroke-dashoffset="arc.offset"
        />
      </g>
      <text
        class="crm-donut-chart__value"
        x="80"
        y="78"
        text-anchor="middle"
      >{{ centerValue }}</text>
      <text
        class="crm-donut-chart__caption"
        x="80"
        y="98"
        text-anchor="middle"
      >{{ centerLabel }}</text>
    </svg>

    <figcaption class="crm-donut-chart__legend">
      <span
        v-for="segment in segments"
        :key="segment.id"
        class="crm-donut-chart__key"
      >
        <span
          class="crm-donut-chart__swatch"
          :style="{ backgroundColor: roleColor(segment.role) }"
          aria-hidden="true"
        />
        {{ segment.label }} — {{ segment.value }}
      </span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { roleColor } from './crmChartGeometry'

export interface CrmDonutChartSegment {
  id: string
  label: string
  value: number
  role: 'primary' | 'secondary' | 'tertiary' | 'error'
}

const props = defineProps<{
  segments: CrmDonutChartSegment[]
  summary: string
  /** Large figure in the hole. */
  centerValue: string
  centerLabel: string
}>()

const RADIUS = 60
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Surface gap between touching segments, in user units along the ring. */
const GAP = 2

const arcs = computed(() => {
  const total = props.segments.reduce((sum, segment) => sum + segment.value, 0)
  if (!total) return []

  const visible = props.segments.filter(segment => segment.value > 0)
  const gap = visible.length > 1 ? GAP : 0
  let start = 0

  return visible.map((segment) => {
    const length = (segment.value / total) * CIRCUMFERENCE
    const arc = {
      id: segment.id,
      role: segment.role,
      // Starts at twelve o'clock: the circle's own start is at three.
      offset: CIRCUMFERENCE / 4 - start,
      dash: `${Math.max(0, length - gap)} ${CIRCUMFERENCE - Math.max(0, length - gap)}`,
      title: `${segment.label}: ${segment.value}`,
    }
    start += length
    return arc
  })
})
</script>

<style lang="scss">
.crm-donut-chart {
  display: grid;
  justify-items: center;
  gap: spacing(12);
  margin: 0;

  &__svg {
    display: block;
    width: min(100%, 200rem);
    height: auto;
    direction: ltr;
  }

  &__track,
  &__arc {
    fill: none;
    stroke-width: 18;
  }

  &__track {
    stroke: var(--md-sys-color-surface-container-highest);
  }

  &__value {
    font-size: 28px;
    font-weight: 500;
    fill: var(--md-sys-color-on-surface);
  }

  &__caption {
    font-size: 11px;
    fill: var(--md-sys-color-on-surface-variant);
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
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
    width: spacing(12);
    height: spacing(12);
    border-radius: var(--sys-shape-corner-full);
  }

  @include forced-colors {
    &__arc {
      stroke: CanvasText;
    }
  }
}
</style>
