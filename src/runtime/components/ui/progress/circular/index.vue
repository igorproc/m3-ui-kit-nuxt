<template>
  <div
    class="ui-progress ui-progress--circular"
    :class="[
      `ui-progress--${size}`,
      {
        'ui-progress--indeterminate': indeterminate,
        'ui-progress--expressive': expressive,
      },
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

    <slot />
  </div>
</template>

<script setup lang="ts">
import { useProgress } from '#kit/composables/progress/useProgress'
import { mProgressLeafProps } from '../props'

const props = defineProps(mProgressLeafProps)

const {
  clampedValue,
  strokeWidth,
  circularPath,
  totalPathLength,
  dashOffset,
} = useProgress({
  get variant() {
    return 'circular' as const
  },
  get value() {
    return props.value
  },
  get indeterminate() {
    return props.indeterminate
  },
  get size() {
    return props.size
  },
  get expressive() {
    return props.expressive
  },
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/progress' as t;

.ui-progress {
  $prefix: 'md-progress';
  $t: material-map(t.$tokens, $prefix);

  contain: content;
  display: inline-flex;
  vertical-align: middle;

  &--circular {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &.ui-progress--small {
      width: g($t, 'circular-size-small');
      height: g($t, 'circular-size-small');
    }

    &.ui-progress--medium {
      width: g($t, 'circular-size-medium');
      height: g($t, 'circular-size-medium');
    }

    &.ui-progress--large {
      width: g($t, 'circular-size-large');
      height: g($t, 'circular-size-large');
    }
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
    stroke: g($t, 'circular-track-color');
  }

  &__svg-value {
    stroke: g($t, 'circular-spinner-color');
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
