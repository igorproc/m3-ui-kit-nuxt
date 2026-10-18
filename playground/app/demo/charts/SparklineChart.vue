<template>
  <svg
    class="sparkline-chart"
    :class="`sparkline-chart--${tone}`"
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    preserveAspectRatio="none"
    role="img"
    :aria-label="label"
  >
    <path
      class="sparkline-chart__area"
      :d="areaPath"
    />
    <path
      class="sparkline-chart__line"
      :d="linePath"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  values: number[]
  /** Text alternative: what the line shows and where it ends. */
  label: string
  /** Colour role of the line; the fill is the same role, faded. */
  tone?: 'primary' | 'tertiary' | 'error'
}>(), {
  tone: 'primary',
})

const WIDTH = 120
const HEIGHT = 32
const INSET = 2

const points = computed(() => {
  const values = props.values.length > 1 ? props.values : [props.values[0] ?? 0, props.values[0] ?? 0]
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const step = WIDTH / (values.length - 1)

  return values.map((value, index) => ({
    x: index * step,
    y: HEIGHT - INSET - ((value - min) / span) * (HEIGHT - INSET * 2),
  }))
})

const linePath = computed(() => points.value.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' '))
const areaPath = computed(() => `${linePath.value} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`)
</script>

<style lang="scss">
.sparkline-chart {
  display: block;
  width: 100%;
  height: 40rem;
  overflow: visible;

  &__line {
    fill: none;
    stroke: var(--sparkline-color);
    stroke-width: 2rem;
    stroke-linejoin: round;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  &__area {
    fill: color-mix(in srgb, var(--sparkline-color) 16%, transparent);
    stroke: none;
  }

  &--primary {
    --sparkline-color: var(--md-sys-color-primary);
  }

  &--tertiary {
    --sparkline-color: var(--md-sys-color-tertiary);
  }

  &--error {
    --sparkline-color: var(--md-sys-color-error);
  }

  @include forced-colors {
    &__line {
      stroke: CanvasText;
    }

    &__area {
      fill: none;
    }
  }
}
</style>
