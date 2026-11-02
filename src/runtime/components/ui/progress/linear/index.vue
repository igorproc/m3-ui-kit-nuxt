<template>
  <div
    class="ui-progress ui-progress--linear"
    :class="[
      `ui-progress--density-${density}`,
      `ui-progress--${shape}`,
      {
        'ui-progress--indeterminate': indeterminate,
        'ui-progress--started': !indeterminate && percent > 0,
        'ui-progress--labelled': !!$slots.default,
      },
    ]"
    :style="indeterminate ? undefined : { '--ui-progress-value': `${percent}%` }"
    v-bind="rootAttrs()"
  >
    <!-- Mirrored as a whole in RTL; the label beside it is not. -->
    <div
      ref="control"
      class="ui-progress__indicator"
      v-bind="controlAttrs(progressbarAttrs())"
    >
      <template v-if="shape === 'wavy'">
        <div
          v-if="showTrack && !indeterminate"
          class="ui-progress__track"
        />
        <div class="ui-progress__wave" />
      </template>

      <template v-else>
        <div
          v-if="showTrack"
          class="ui-progress__track"
        />
        <div
          class="ui-progress__bar ui-progress__primary-bar"
          :style="indeterminate ? undefined : { transform: `scaleX(${percent / 100})` }"
        >
          <div class="ui-progress__bar-inner" />
        </div>
        <div
          v-if="indeterminate"
          class="ui-progress__bar ui-progress__secondary-bar"
        >
          <div class="ui-progress__bar-inner" />
        </div>
      </template>
    </div>

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

const control = shallowRef<HTMLElement | null>(null)
useProgressNameWarning(control, () => props.ariaLabel)

const { valueNow, percent } = useProgress(props)

const { labelId, progressbarAttrs } = useProgressbar(props, valueNow)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/progress' as t;

$t: material-map(t.$tokens, 'md-progress');

.ui-progress {
  &--linear {
    display: inline-flex;
    align-items: center;
    gap: g($t, 'linear.label.gap');
    width: 100%;
    vertical-align: middle;
    contain: layout style;
  }

  &--linear.ui-progress--labelled {
    flex-direction: column;
    align-items: stretch;
  }

  // Drawn left to right inside; RTL mirrors the whole box, not its parts.
  &__indicator {
    position: relative;
    flex: 1 1 auto;
    overflow: hidden;
    border-radius: g($t, 'linear.shape');
    direction: ltr;

    &:dir(rtl) {
      scale: -1 1;
    }
  }

  @each $step in ('compact', 'default', 'comfortable') {
    &--linear.ui-progress--density-#{$step} &__indicator {
      height: g($t, 'linear.density.#{$step}.thickness');
    }

    &--wavy.ui-progress--density-#{$step} &__indicator {
      height: g($t, 'wave.density.#{$step}.height');
    }

    &--density-#{$step} &__wave {
      mask-image: g($t, 'wave.density.#{$step}.mask.determinate');
    }

    &--indeterminate.ui-progress--density-#{$step} &__wave {
      mask-image: g($t, 'wave.density.#{$step}.mask.indeterminate');
    }
  }

  &--wavy &__indicator {
    border-radius: g($t, 'wave.shape');
  }

  // `--ui-progress-value` is the share done, written by the component.
  &__track {
    position: absolute;
    inset: 0;
    background: g($t, 'linear.track.color');
    border-radius: g($t, 'linear.shape');
  }

  &--wavy &__track {
    inset-block: g($t, 'wave.track.inset');
  }

  // M3 2024: once the bar has started, the track begins a gap after it and
  // ends in a stop indicator.
  &--started &__track {
    clip-path: inset(0 0 0 g($t, 'linear.track.start'));
    transition: clip-path g($t, 'motion.value.duration') g($t, 'motion.value.easing');
  }

  &--linear:not(&--indeterminate) &__track::after {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-end: 0;
    aspect-ratio: 1;
    border-radius: inherit;
    background: g($t, 'linear.bar.color');
  }

  &__bar {
    position: absolute;
    inset: 0;
    transform-origin: left center;
    transition: transform g($t, 'motion.value.duration') g($t, 'motion.value.easing');
  }

  &__bar-inner {
    position: absolute;
    inset: 0;
    background: g($t, 'linear.bar.color');
    border-radius: inherit;
  }

  // One tileable period of the wave, painted by a mask in the bar's colour.
  &__wave {
    position: absolute;
    inset: 0;
    background: g($t, 'linear.bar.color');
    mask-repeat: repeat-x;
    mask-size: g($t, 'wave.period.determinate') 100%;
    clip-path: inset(0 calc(100% - var(--ui-progress-value, 100%)) 0 0);
    transition: clip-path g($t, 'motion.value.duration') g($t, 'motion.value.easing');
  }

  &--indeterminate &__wave {
    mask-size: g($t, 'wave.period.indeterminate') 100%;
    animation: ui-progress-linear-wave-move g($t, 'motion.loop.wave') linear infinite;
  }

  // Linear Indeterminate
  &--indeterminate &__primary-bar {
    left: -145.167%;
    transition: none;
    animation: ui-progress-linear-primary g($t, 'motion.loop.linear') infinite linear;
  }

  &--indeterminate &__primary-bar &__bar-inner {
    animation: ui-progress-linear-primary-scale g($t, 'motion.loop.linear') infinite linear;
  }

  &--indeterminate &__secondary-bar {
    left: -54.8889%;
    transition: none;
    animation: ui-progress-linear-secondary g($t, 'motion.loop.linear') infinite linear;
  }

  &--indeterminate &__secondary-bar &__bar-inner {
    animation: ui-progress-linear-secondary-scale g($t, 'motion.loop.linear') infinite linear;
  }

  &__label {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  @media (prefers-reduced-motion: reduce) {
    &--indeterminate &__wave {
      animation-duration: g($t, 'motion.reduced.wave');
    }

    &--indeterminate &__bar,
    &--indeterminate &__bar &__bar-inner {
      animation-duration: g($t, 'motion.reduced.linear');
    }
  }

  // Track and bar are bare backgrounds, which forced colors paint as Canvas:
  // the track becomes an edge, the bar a Highlight fill.
  @include forced-colors {
    &__track {
      border: 1px solid CanvasText;
    }

    &__bar-inner,
    &__wave {
      forced-color-adjust: none;
      background: Highlight;
    }
  }
}

// --- KEYFRAMES ---
@keyframes ui-progress-linear-wave-move {
  to { mask-position: calc(-1 * #{g($t, 'wave.period.indeterminate')}) 0; }
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
