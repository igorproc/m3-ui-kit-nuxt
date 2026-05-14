<template>
  <div
    v-if="variant === 'linear'"
    class="ui-progress ui-progress--linear"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="indeterminate ? undefined : clampedValue"
    :aria-label="ariaLabel"
  >
    <div
      v-if="indeterminate"
      class="ui-progress__bar ui-progress__bar--indeterminate"
    />
    <div
      v-else
      class="ui-progress__bar"
      :style="{ width: `${clampedValue}%` }"
    />
  </div>

  <div
    v-else
    class="ui-progress ui-progress--circular"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="indeterminate ? undefined : clampedValue"
    :aria-label="ariaLabel"
  >
    <span
      v-if="indeterminate"
      class="ui-progress__spinner ui-progress__spinner--indeterminate"
    />

    <svg
      v-else
      class="ui-progress__spinner"
      viewBox="0 0 48 48"
    >
      <circle
        class="ui-progress__circle ui-progress__circle--track"
        cx="24"
        cy="24"
        r="20"
      />
      <circle
        class="ui-progress__circle ui-progress__circle--value"
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

.ui-progress {
  &--linear {
    position: relative;
    width: 100%;
    height: v.$linear-height;
    border-radius: 999rem;
    overflow: hidden;
    background-color: v.$linear-track-bg;
  }

  &__bar {
    position: absolute;
    inset-block: 0;
    left: 0;
    background-color: v.$linear-bar-bg;
    transition: width var(--sys-motion-duration-medium-2)
      var(--sys-motion-easing-standard);

    &--indeterminate {
      width: 40%;
      animation:
        ui-progress-linear-indeterminate var(--sys-motion-duration-long-2)
        var(--sys-motion-easing-standard) infinite;
    }
  }

  &--circular {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: v.$circular-size;
    height: v.$circular-size;
  }

  &__spinner {
    width: 100%;
    height: 100%;

    &--indeterminate {
      border-radius: var(--sys-shape-corner-full);
      border-width: v.$circular-spinner-border-width;
      border-style: solid;
      border-color: v.$circular-track-bg;
      border-top-color: v.$circular-spinner-bg;
      animation:
        ui-progress-circular-indeterminate
        var(--sys-motion-duration-medium-2)
        var(--sys-motion-easing-standard) infinite;
    }
  }

  &__circle {
    fill: none;
    stroke-width: v.$circular-svg-stroke-width;
    transform-origin: center;
    transform: rotate(-90deg);

    &--track {
      stroke: v.$circular-svg-track-bg;
    }

    &--value {
      stroke: v.$circular-spinner-bg;
      transition: stroke-dashoffset var(--sys-motion-duration-medium-2)
        var(--sys-motion-easing-standard);
    }
  }
}

@keyframes ui-progress-linear-indeterminate {
  0% {
    transform: translateX(-100%);
  }

  50% {
    transform: translateX(50%);
  }

  100% {
    transform: translateX(100%);
  }
}

@keyframes ui-progress-circular-indeterminate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
