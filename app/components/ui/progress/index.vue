<template>
  <div
    v-if="variant === 'linear'"
    class="ui-progress ui-progress--linear"
    :class="[
      `ui-progress--${size}`,
      {
        'ui-progress--indeterminate': indeterminate,
        'ui-progress--expressive': expressive
      }
    ]"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="indeterminate ? undefined : clampedValue"
    :aria-label="ariaLabel"
  >
    <div
      v-if="showTrack"
      class="ui-progress__track"
    >
      <svg v-if="expressive" class="ui-progress__wave-svg" preserveAspectRatio="none">
        <path :d="linearWavePath" class="ui-progress__wave-path-track" />
      </svg>
    </div>

    <!-- Active Bar -->
    <div
      class="ui-progress__bar ui-progress__primary-bar"
      :style="indeterminate ? '' : { transform: `scaleX(${clampedValue / 100})` }"
    >
      <div v-if="!expressive" class="ui-progress__bar-inner"></div>
      <svg v-else class="ui-progress__wave-svg" preserveAspectRatio="none">
        <path :d="linearWavePath" class="ui-progress__wave-path-active" />
      </svg>
    </div>

    <div
      v-if="indeterminate && !expressive"
      class="ui-progress__bar ui-progress__secondary-bar"
    >
      <div class="ui-progress__bar-inner"></div>
    </div>
  </div>

  <div
    v-else
    class="ui-progress ui-progress--circular"
    :class="[
      `ui-progress--${size}`,
      {
        'ui-progress--indeterminate': indeterminate,
        'ui-progress--expressive': expressive
      }
    ]"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="indeterminate ? undefined : clampedValue"
    :aria-label="ariaLabel"
  >
    <svg
      class="ui-progress__svg"
      viewBox="0 0 48 48"
    >
      <!-- Track -->
      <path
        v-if="showTrack"
        class="ui-progress__svg-track"
        :d="circularPath"
        :stroke-width="strokeWidth"
      />
      <!-- Active Value -->
      <path
        class="ui-progress__svg-value"
        :d="circularPath"
        :stroke-width="strokeWidth"
        :stroke-dasharray="totalPathLength"
        :stroke-dashoffset="dashOffset"
        :stroke-linecap="expressive || indeterminate ? 'round' : 'butt'"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ProgressVariant = 'linear' | 'circular'
type ProgressSize = 'small' | 'medium' | 'large'

interface Props {
  variant?: ProgressVariant
  value?: number
  indeterminate?: boolean
  size?: ProgressSize
  showTrack?: boolean
  ariaLabel?: string
  expressive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'linear',
  value: 0,
  indeterminate: false,
  size: 'medium',
  showTrack: true,
  ariaLabel: 'Progress',
  expressive: false,
})

const clampedValue = computed(() =>
  Math.min(100, Math.max(0, props.value ?? 0)),
)

// --- SHARED GEOMETRY ---
const radius = 18
const strokeWidth = computed(() => {
  const base = props.size === 'small' ? 3 : (props.size === 'large' ? 4 : 4)
  return props.expressive ? base * 1.5 : base
})

// --- CIRCULAR LOGIC ---
const circularPath = computed(() => {
  if (!props.expressive) {
    // Standard circle path (easier for dasharray than <circle> when combined with expressive paths)
    return `M 24, 24 m -${radius}, 0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`
  }
  
  // Wavy circle path
  const waves = 10
  const amplitude = props.size === 'small' ? 1.5 : 2
  const points = 120
  let d = ''
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    const r = radius + Math.sin(angle * waves) * amplitude
    const x = 24 + r * Math.cos(angle)
    const y = 24 + r * Math.sin(angle)
    d += (i === 0 ? 'M ' : 'L ') + x + ' ' + y
  }
  return d
})

// Approximate length for dasharray
const totalPathLength = computed(() => {
  if (!props.expressive) return 2 * Math.PI * radius
  // Wavy path is longer. Rough correction factor based on amplitude/waves
  return 2 * Math.PI * radius * 1.15
})

const dashOffset = computed(() => {
  if (props.indeterminate) return totalPathLength.value * 0.25
  return totalPathLength.value * (1 - clampedValue.value / 100)
})

// --- LINEAR LOGIC ---
const linearWavePath = computed(() => {
  const width = 1000 // Large enough to cover container
  const waveLength = 20
  const amplitude = props.size === 'small' ? 2 : 4
  let d = `M 0 ${amplitude}`
  for (let x = 0; x <= width; x += waveLength) {
    d += ` Q ${x + waveLength / 4} ${0}, ${x + waveLength / 2} ${amplitude}`
    d += ` Q ${x + (3 * waveLength) / 4} ${amplitude * 2}, ${x + waveLength} ${amplitude}`
  }
  return d
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/progress' as v;

.ui-progress {
  contain: content;
  display: inline-flex;
  vertical-align: middle;

  // --- LINEAR ---
  &--linear {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 999rem;
    background: transparent;

    &.ui-progress--small { height: v.$linear-height-small; }
    &.ui-progress--medium { height: v.$linear-height-medium; }
    &.ui-progress--large { height: v.$linear-height-large; }
    
    &.ui-progress--expressive {
      height: auto;
      min-height: 12rem;
      overflow: visible; // Allow waves to breathe
    }
  }

  &__track {
    position: absolute;
    inset: 0;
    background: v.$linear-track-bg;
    border-radius: inherit;
  }

  &__bar {
    position: absolute;
    inset: 0;
    transform-origin: left center;
    transition: transform 400ms var(--sys-motion-easing-emphasized);
  }

  &__bar-inner {
    position: absolute;
    inset: 0;
    background: v.$linear-bar-bg;
    border-radius: inherit;
  }

  // Linear Expressive (Wave)
  &--linear.ui-progress--expressive {
    background: none;
    border-radius: 0;

    .ui-progress__track {
      background: none;
    }

    .ui-progress__wave-svg {
      width: 100%;
      height: 24rem;
      overflow: visible;
    }

    .ui-progress__wave-path-track {
      fill: none;
      stroke: v.$linear-track-bg;
      stroke-width: 4;
      stroke-linecap: round;
    }

    .ui-progress__wave-path-active {
      fill: none;
      stroke: v.$linear-bar-bg;
      stroke-width: 6;
      stroke-linecap: round;
      stroke-linejoin: round;
      // In expressive mode, the bar itself is a full-width SVG and we clip its container
    }
    
    &.ui-progress--indeterminate .ui-progress__wave-path-active {
      animation: ui-progress-linear-wave-move 1s linear infinite;
    }
  }

  // Linear Indeterminate
  &--linear.ui-progress--indeterminate:not(.ui-progress--expressive) &__bar {
    transition: none;
  }

  &--linear.ui-progress--indeterminate:not(.ui-progress--expressive) &__primary-bar {
    left: -145.167%;
    animation: ui-progress-linear-primary 2s infinite linear;
  }

  &--linear.ui-progress--indeterminate:not(.ui-progress--expressive) &__primary-bar &__bar-inner {
    animation: ui-progress-linear-primary-scale 2s infinite linear;
  }

  &--linear.ui-progress--indeterminate:not(.ui-progress--expressive) &__secondary-bar {
    left: -54.8889%;
    animation: ui-progress-linear-secondary 2s infinite linear;
  }

  &--linear.ui-progress--indeterminate:not(.ui-progress--expressive) &__secondary-bar &__bar-inner {
    animation: ui-progress-linear-secondary-scale 2s infinite linear;
  }

  // --- CIRCULAR ---
  &--circular {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &.ui-progress--small { width: v.$circular-size-small; height: v.$circular-size-small; }
    &.ui-progress--medium { width: v.$circular-size-medium; height: v.$circular-size-medium; }
    &.ui-progress--large { width: v.$circular-size-large; height: v.$circular-size-large; }
  }

  &__svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    overflow: visible; // Waves can exceed viewBox slightly
  }

  &__svg-track,
  &__svg-value {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__svg-track {
    stroke: v.$circular-track-bg;
  }

  &__svg-value {
    stroke: v.$circular-spinner-bg;
    transition: stroke-dashoffset 400ms var(--sys-motion-easing-emphasized);
  }

  // Circular Indeterminate
  &--circular.ui-progress--indeterminate &__svg {
    animation: ui-progress-circular-rotate 2s linear infinite;
  }

  &--circular.ui-progress--indeterminate &__svg-value {
    animation: ui-progress-circular-dash 1.5s ease-in-out infinite;
  }
}

// --- KEYFRAMES ---
@keyframes ui-progress-linear-wave-move {
  from { transform: translateX(0); }
  to { transform: translateX(-40rem); } // Negative of two wave cycles
}

@keyframes ui-progress-linear-primary {
  0% { transform: translateX(0); }
  20% { transform: translateX(0); animation-timing-function: cubic-bezier(0.5, 0, 0.7, 0.5); }
  59% { transform: translateX(83.6%); animation-timing-function: cubic-bezier(0.3, 0.4, 0.5, 0.9); }
  100% { transform: translateX(200.6%); }
}

@keyframes ui-progress-linear-primary-scale {
  0% { transform: scaleX(0.08); }
  36% { transform: scaleX(0.08); animation-timing-function: cubic-bezier(0.3, 0.1, 0.8, 1); }
  69% { transform: scaleX(0.66); animation-timing-function: cubic-bezier(0.1, 0.1, 0.6, 1); }
  100% { transform: scaleX(0.08); }
}

@keyframes ui-progress-linear-secondary {
  0% { transform: translateX(0); animation-timing-function: cubic-bezier(0.1, 0, 0.5, 0.4); }
  25% { transform: translateX(37.6%); animation-timing-function: cubic-bezier(0.3, 0.3, 0.8, 0.7); }
  48% { transform: translateX(84.3%); animation-timing-function: cubic-bezier(0.4, 0.6, 0.6, 0.9); }
  100% { transform: translateX(160.2%); }
}

@keyframes ui-progress-linear-secondary-scale {
  0% { transform: scaleX(0.08); animation-timing-function: cubic-bezier(0.2, 0.1, 0.6, 0.5); }
  19% { transform: scaleX(0.45); animation-timing-function: cubic-bezier(0.2, 0.2, 0.6, 1); }
  44% { transform: scaleX(0.72); animation-timing-function: cubic-bezier(0.3, 0, 0.2, 1.4); }
  100% { transform: scaleX(0.08); }
}

@keyframes ui-progress-circular-rotate {
  100% { transform: rotate(270deg); }
}

@keyframes ui-progress-circular-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124;
  }
}
</style>
