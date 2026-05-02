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
.ui-progress {
  &--linear {
    position: relative;
    width: 100%;
    height: 4rem;
    border-radius: 999rem;
    overflow: hidden;
    background-color: color-mix(
      in srgb,
      var(--color-on-surface) 8%,
      transparent
    );
  }

  &__bar {
    position: absolute;
    inset-block: 0;
    left: 0;
    background-color: var(--color-primary);
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
    width: 40rem;
    height: 40rem;
  }

  &__spinner {
    width: 100%;
    height: 100%;

    &--indeterminate {
      border-radius: var(--sys-shape-corner-full);
      border-width: 3rem;
      border-style: solid;
      border-color: color-mix(in srgb, var(--color-primary) 16%, transparent);
      border-top-color: var(--color-primary);
      animation:
        ui-progress-circular-indeterminate
        var(--sys-motion-duration-medium-2)
        var(--sys-motion-easing-standard) infinite;
    }
  }

  &__circle {
    fill: none;
    stroke-width: 4;
    transform-origin: center;
    transform: rotate(-90deg);

    &--track {
      stroke: color-mix(
        in srgb,
        var(--color-on-surface) 12%,
        transparent
      );
    }

    &--value {
      stroke: var(--color-primary);
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
