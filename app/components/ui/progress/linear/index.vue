<template>
  <div
    class="ui-progress ui-progress--linear"
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
    <div
      v-if="showTrack"
      class="ui-progress__track"
    >
      <svg
        v-if="expressive"
        class="ui-progress__wave"
        preserveAspectRatio="none"
      >
        <path
          :d="linearWavePath"
          class="ui-progress__wavetrack"
        />
      </svg>
    </div>

    <!-- Active Bar -->
    <div
      class="ui-progress__bar ui-progress__primary-bar"
      :style="indeterminate ? '' : { transform: `scaleX(${clampedValue / 100})` }"
    >
      <div
        v-if="!expressive"
        class="ui-progress__bar-inner"
      ></div>
      <svg
        v-else
        class="ui-progress__wave"
        preserveAspectRatio="none"
      >
        <path
          :d="linearWavePath"
          class="ui-progress__waveactive"
        />
      </svg>
    </div>

    <div
      v-if="indeterminate && !expressive"
      class="ui-progress__bar ui-progress__secondary-bar"
    >
      <div class="ui-progress__bar-inner"></div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { useProgress } from '~/composables/progress/useProgress'
import { mProgressLeafProps } from '../props'

const props = defineProps(mProgressLeafProps)

const { clampedValue, linearWavePath } = useProgress({
  get variant() {
    return 'linear' as const
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
@use '~/assets/stylesheet/components/progress' as t;

.ui-progress {
  $prefix: 'md-progress';
  $t: material-map(t.$tokens, $prefix);

  contain: content;
  display: inline-flex;
  vertical-align: middle;

  &--linear {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 999rem;
    background: transparent;

    &.ui-progress--small {
      height: g($t, 'linear-height-small');
    }

    &.ui-progress--medium {
      height: g($t, 'linear-height-medium');
    }

    &.ui-progress--large {
      height: g($t, 'linear-height-large');
    }

    &.ui-progress--expressive {
      height: auto;
      min-height: 12rem;
      overflow: visible; // Allow waves to breathe
    }
  }

  &__track {
    position: absolute;
    inset: 0;
    background: g($t, 'linear-track-color');
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
    background: g($t, 'linear-bar-color');
    border-radius: inherit;
  }

  // Linear Expressive (Wave)
  &--linear.ui-progress--expressive {
    background: none;
    border-radius: 0;

    .ui-progress__track {
      background: none;
    }

    .ui-progress__wave {
      width: 100%;
      height: 24rem;
      overflow: visible;
    }

    .ui-progress__wavetrack {
      fill: none;
      stroke: g($t, 'linear-track-color');
      stroke-width: 4;
      stroke-linecap: round;
    }

    .ui-progress__waveactive {
      fill: none;
      stroke: g($t, 'linear-bar-color');
      stroke-width: 6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    &.ui-progress--indeterminate .ui-progress__waveactive {
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
}

// --- KEYFRAMES ---
@keyframes ui-progress-linear-wave-move {
  from { transform: translateX(0); }
  to { transform: translateX(-40rem); }
}

@keyframes ui-progress-linear-primary {
  0% { transform: translateX(0); }

  20% {
    transform: translateX(0);
    animation-timing-function: cubic-bezier(0.5, 0, 0.7, 0.5);
  }

  59% {
    transform: translateX(83.6%);
    animation-timing-function: cubic-bezier(0.3, 0.4, 0.5, 0.9);
  }

  100% { transform: translateX(200.6%); }
}

@keyframes ui-progress-linear-primary-scale {
  0% { transform: scaleX(0.08); }

  36% {
    transform: scaleX(0.08);
    animation-timing-function: cubic-bezier(0.3, 0.1, 0.8, 1);
  }

  69% {
    transform: scaleX(0.66);
    animation-timing-function: cubic-bezier(0.1, 0.1, 0.6, 1);
  }

  100% { transform: scaleX(0.08); }
}

@keyframes ui-progress-linear-secondary {
  0% {
    transform: translateX(0);
    animation-timing-function: cubic-bezier(0.1, 0, 0.5, 0.4);
  }

  25% {
    transform: translateX(37.6%);
    animation-timing-function: cubic-bezier(0.3, 0.3, 0.8, 0.7);
  }

  48% {
    transform: translateX(84.3%);
    animation-timing-function: cubic-bezier(0.4, 0.6, 0.6, 0.9);
  }

  100% { transform: translateX(160.2%); }
}

@keyframes ui-progress-linear-secondary-scale {
  0% {
    transform: scaleX(0.08);
    animation-timing-function: cubic-bezier(0.2, 0.1, 0.6, 0.5);
  }

  19% {
    transform: scaleX(0.45);
    animation-timing-function: cubic-bezier(0.2, 0.2, 0.6, 1);
  }

  44% {
    transform: scaleX(0.72);
    animation-timing-function: cubic-bezier(0.3, 0, 0.2, 1.4);
  }

  100% { transform: scaleX(0.08); }
}
</style>
