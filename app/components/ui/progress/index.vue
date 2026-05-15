<template>
  <div
    v-if="variant === 'linear'"
    class="ui-progress ui-progress--linear"
    :class="{ 'ui-progress--indeterminate': indeterminate }"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="indeterminate ? undefined : clampedValue"
    :aria-label="ariaLabel"
  >
    <div
      v-if="!indeterminate"
      class="ui-progress__inactive-track"
    ></div>
    <div
      class="ui-progress__bar ui-progress__primary-bar"
      :style="indeterminate ? '' : { transform: `scaleX(${clampedValue / 100})` }"
    >
      <div class="ui-progress__bar-inner"></div>
    </div>
    <div
      v-if="indeterminate"
      class="ui-progress__bar ui-progress__secondary-bar"
    >
      <div class="ui-progress__bar-inner"></div>
    </div>
  </div>

  <div
    v-else
    class="ui-progress ui-progress--circular"
    :class="{ 'ui-progress--indeterminate': indeterminate }"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="indeterminate ? undefined : clampedValue"
    :aria-label="ariaLabel"
  >
    <div
      v-if="indeterminate"
      class="ui-progress__spinner"
    >
      <div class="ui-progress__left">
        <div class="ui-progress__circle"></div>
      </div>
      <div class="ui-progress__right">
        <div class="ui-progress__circle"></div>
      </div>
    </div>

    <svg
      v-else
      class="ui-progress__svg"
      viewBox="0 0 48 48"
    >
      <circle
        class="ui-progress__svg-track"
        cx="24"
        cy="24"
        r="20"
      />
      <circle
        class="ui-progress__svg-value"
        cx="24"
        cy="24"
        r="20"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ProgressVariant = 'linear' | 'circular'

interface Props {
  variant?: ProgressVariant
  value?: number
  indeterminate?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'linear',
  value: 0,
  indeterminate: false,
  ariaLabel: 'Progress',
})

const clampedValue = computed(() =>
  Math.min(100, Math.max(0, props.value ?? 0)),
)

const circumference = 2 * Math.PI * 20

const dashOffset = computed(
  () => circumference * (1 - clampedValue.value / 100),
)
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/progress' as v;

$linear-determinate-duration: 250ms;
$linear-determinate-easing: cubic-bezier(0.4, 0, 0.6, 1);
$linear-indeterminate-duration: 2s;

$circular-arc-duration: 1333ms;
$circular-cycle-duration: calc(4 * $circular-arc-duration);
$circular-linear-rotate-duration: calc($circular-arc-duration * 360 / 306);
$circular-indeterminate-easing: cubic-bezier(0.4, 0, 0.2, 1);

.ui-progress {
  contain: strict;
  content-visibility: auto;

  // --- LINEAR ---
  &--linear {
    position: relative;
    width: 100%;
    height: v.$linear-height;
    border-radius: 999rem;
    overflow: hidden;
    display: flex;
    align-items: center;
    direction: ltr;

    // RTL support
    :dir(rtl) & {
      transform: scaleX(-1);
    }
  }

  &__inactive-track,
  &__bar,
  &__bar-inner {
    position: absolute;
  }

  &__inactive-track {
    background: v.$linear-track-bg;
    inset: 0;
  }

  &__bar {
    width: 100%;
    height: 100%;
    transform-origin: left center;
    transition: transform $linear-determinate-duration $linear-determinate-easing;
  }

  &__bar-inner {
    inset: 0;
    background: v.$linear-bar-bg;
  }

  &--linear.ui-progress--indeterminate &__bar {
    transition: none;
  }

  &--linear.ui-progress--indeterminate &__primary-bar {
    left: -145.167%;
    animation: linear infinite $linear-indeterminate-duration ui-progress-primary-translate;
  }

  &--linear.ui-progress--indeterminate &__primary-bar > &__bar-inner {
    animation: linear infinite $linear-indeterminate-duration ui-progress-primary-scale;
  }

  &--linear.ui-progress--indeterminate &__secondary-bar {
    left: -54.8889%;
    animation: linear infinite $linear-indeterminate-duration ui-progress-secondary-translate;
  }

  &--linear.ui-progress--indeterminate &__secondary-bar > &__bar-inner {
    animation: linear infinite $linear-indeterminate-duration ui-progress-secondary-scale;
  }

  // --- CIRCULAR ---
  &--circular {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: v.$circular-size;
    height: v.$circular-size;
    position: relative;
  }

  &--circular.ui-progress--indeterminate {
    animation: linear infinite ui-progress-linear-rotate;
    animation-duration: $circular-linear-rotate-duration;
  }

  &__spinner,
  &__left,
  &__right,
  &__circle,
  &__svg {
    position: absolute;
    inset: 0;
  }

  &__svg {
    transform: rotate(-90deg);
  }

  &__svg-track,
  &__svg-value {
    fill: none;
    stroke-width: v.$circular-svg-stroke-width;
  }

  &__svg-track {
    stroke: v.$circular-svg-track-bg;
  }

  &__svg-value {
    stroke: v.$circular-spinner-bg;
    transition: stroke-dashoffset $linear-determinate-duration $linear-determinate-easing;
  }

  &__spinner {
    animation: infinite both ui-progress-rotate-arc;
    animation-duration: $circular-cycle-duration;
    animation-timing-function: $circular-indeterminate-easing;
  }

  &__left {
    overflow: hidden;
    inset: 0 50% 0 0;
  }

  &__right {
    overflow: hidden;
    inset: 0 0 0 50%;
  }

  &__circle {
    box-sizing: border-box;
    border-radius: 50%;
    border: solid v.$circular-spinner-border-width;
    border-color: v.$circular-spinner-bg v.$circular-spinner-bg transparent transparent;
    animation: ui-progress-expand-arc;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
    animation-duration: $circular-arc-duration, $circular-cycle-duration;
    animation-timing-function: $circular-indeterminate-easing;
  }

  &__left &__circle {
    transform: rotate(135deg);
    inset: 0 -100% 0 0;
  }

  &__right &__circle {
    transform: rotate(100deg);
    inset: 0 0 0 -100%;
    animation-delay: calc(-0.5 * $circular-arc-duration), 0ms;
  }
}

// --- LINEAR KEYFRAMES ---
@keyframes ui-progress-primary-translate {
  0% { transform: translateX(0px); }
  20% { animation-timing-function: cubic-bezier(0.5, 0, 0.701732, 0.495819); transform: translateX(0px); }
  59.15% { animation-timing-function: cubic-bezier(0.302435, 0.381352, 0.55, 0.956352); transform: translateX(83.6714%); }
  100% { transform: translateX(200.611%); }
}

@keyframes ui-progress-primary-scale {
  0% { transform: scaleX(0.08); }
  36.65% { animation-timing-function: cubic-bezier(0.334731, 0.12482, 0.785844, 1); transform: scaleX(0.08); }
  69.15% { animation-timing-function: cubic-bezier(0.06, 0.11, 0.6, 1); transform: scaleX(0.661479); }
  100% { transform: scaleX(0.08); }
}

@keyframes ui-progress-secondary-translate {
  0% { animation-timing-function: cubic-bezier(0.15, 0, 0.515058, 0.409685); transform: translateX(0px); }
  25% { animation-timing-function: cubic-bezier(0.31033, 0.284058, 0.8, 0.733712); transform: translateX(37.6519%); }
  48.35% { animation-timing-function: cubic-bezier(0.4, 0.627035, 0.6, 0.902026); transform: translateX(84.3862%); }
  100% { transform: translateX(160.278%); }
}

@keyframes ui-progress-secondary-scale {
  0% { animation-timing-function: cubic-bezier(0.205028, 0.057051, 0.57661, 0.453971); transform: scaleX(0.08); }
  19.15% { animation-timing-function: cubic-bezier(0.152313, 0.196432, 0.648374, 1.00432); transform: scaleX(0.457104); }
  44.15% { animation-timing-function: cubic-bezier(0.257759, -0.003163, 0.211762, 1.38179); transform: scaleX(0.72796); }
  100% { transform: scaleX(0.08); }
}

// --- CIRCULAR KEYFRAMES ---
@keyframes ui-progress-expand-arc {
  0% { transform: rotate(265deg); }
  50% { transform: rotate(130deg); }
  100% { transform: rotate(265deg); }
}

@keyframes ui-progress-rotate-arc {
  12.5% { transform: rotate(135deg); }
  25% { transform: rotate(270deg); }
  37.5% { transform: rotate(405deg); }
  50% { transform: rotate(540deg); }
  62.5% { transform: rotate(675deg); }
  75% { transform: rotate(810deg); }
  87.5% { transform: rotate(945deg); }
  100% { transform: rotate(1080deg); }
}

@keyframes ui-progress-linear-rotate {
  to { transform: rotate(360deg); }
}
</style>
