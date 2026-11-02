<template>
  <div
    class="ui-progress ui-progress--circular"
    :class="[
      `ui-progress--density-${density}`,
      `ui-progress--${shape}`,
      {
        'ui-progress--indeterminate': indeterminate,
        'ui-progress--started': !indeterminate && percent > 0,
        'ui-progress--labelled': !!$slots.default,
      },
    ]"
    v-bind="rootAttrs()"
  >
    <svg
      ref="control"
      class="ui-progress__svg"
      :viewBox="viewBox"
      v-bind="controlAttrs(progressbarAttrs())"
    >
      <path
        v-if="showTrack && trackLength > 0"
        class="ui-progress__svg-track"
        :d="circularPath"
        :stroke-width="strokeWidth"
        :stroke-dasharray="trackDashArray"
        :stroke-dashoffset="trackDashOffset"
      />
      <path
        class="ui-progress__svg-value"
        :d="circularPath"
        :stroke-width="strokeWidth"
        :stroke-dasharray="totalPathLength"
        :stroke-dashoffset="dashOffset"
      />
    </svg>

    <span
      v-if="$slots.default"
      :id="labelId"
      class="ui-progress__label"
    >
      <slot />
    </span>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useProgress } from '#kit/composables/progress/useProgress'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useProgressbar } from '#kit/utils/progress/useProgressbar'
import { useProgressNameWarning } from '#kit/utils/progress/useProgressNameWarning'
import { mProgressLeafProps } from '../props'

defineOptions({ inheritAttrs: false })

const props = defineProps(mProgressLeafProps)
const { rootAttrs, controlAttrs } = useControlAttrs()

const control = shallowRef<SVGSVGElement | null>(null)
useProgressNameWarning(control, () => props.ariaLabel)

const {
  valueNow,
  percent,
  viewBox,
  strokeWidth,
  circularPath,
  totalPathLength,
  dashOffset,
  trackLength,
  trackDashArray,
  trackDashOffset,
} = useProgress(props)

const { labelId, progressbarAttrs } = useProgressbar(props, valueNow)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/progress' as t;

.ui-progress {
  $prefix: 'md-progress';
  $t: material-map(t.$tokens, $prefix);

  contain: layout style;
  display: inline-flex;
  vertical-align: middle;

  &--circular {
    align-items: center;
    gap: g($t, 'circular.label.gap');
  }

  @each $step in ('compact', 'default', 'comfortable') {
    &--circular.ui-progress--density-#{$step} &__svg {
      width: g($t, 'circular.density.#{$step}.size');
      height: g($t, 'circular.density.#{$step}.size');
    }
  }

  &__svg {
    flex-shrink: 0;
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
    stroke: g($t, 'circular.track.color');
    transition:
      stroke-dasharray g($t, 'motion.value.duration') g($t, 'motion.value.easing'),
      stroke-dashoffset g($t, 'motion.value.duration') g($t, 'motion.value.easing');
  }

  &__svg-value {
    stroke: g($t, 'circular.spinner.color');
    transition: stroke-dashoffset g($t, 'motion.value.duration') g($t, 'motion.value.easing');
  }

  &--circular:not(&--started, &--indeterminate) &__svg-value {
    visibility: hidden;
  }

  // Circular Indeterminate
  &--circular.ui-progress--indeterminate &__svg {
    animation: ui-progress-circular-rotate g($t, 'motion.loop.rotate') linear infinite;
  }

  &--circular.ui-progress--indeterminate &__svg-value {
    animation: ui-progress-circular-dash g($t, 'motion.loop.dash') ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &--circular.ui-progress--indeterminate &__svg {
      animation-duration: g($t, 'motion.reduced.rotate');
    }

    &--circular.ui-progress--indeterminate &__svg-value {
      animation-duration: g($t, 'motion.reduced.dash');
    }
  }

  // Track and value differ only by theme colour; forced colors either keep
  // those themed strokes or flatten both to one colour, so name the two roles.
  @include forced-colors {
    &__svg-track { stroke: CanvasText; }
    &__svg-value { stroke: Highlight; }
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
