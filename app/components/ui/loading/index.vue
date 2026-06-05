<template>
  <span
    class="ui-loading"
    :class="[
      `ui-loading--${variant}`,
      `ui-loading--${size}`,
      { 'ui-loading--inline': inline },
    ]"
    role="status"
    :aria-label="ariaLabel"
  >
    <!-- Classic Circular Spinner -->
    <div
      v-if="variant === 'circular'"
      class="ui-loading__spinner"
    >
      <div class="ui-loading__left">
        <div class="ui-loading__circle"></div>
      </div>

      <div class="ui-loading__right">
        <div class="ui-loading__circle"></div>
      </div>
    </div>

    <!-- M3 Expressive Morphing Shape -->
    <m-shape
      v-else-if="variant === 'expressive'"
      class="ui-loading__expressive"
      :name="currentShape"
      :sequence="expressiveSequence"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTimer } from '~/composables/useTimer'
import MShape from '~/components/ui/shape/index.vue'
import type { M3ShapeName } from '~/assets/icon/shapes'

type LoadingVariant = 'circular' | 'expressive'
type LoadingSize = 'small' | 'medium' | 'large'

interface Props {
  variant?: LoadingVariant
  size?: LoadingSize
  inline?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'circular',
  size: 'medium',
  inline: false,
  ariaLabel: 'Loading',
})

// Sequence of shapes for the Expressive Loading Indicator
const expressiveSequence: M3ShapeName[] = [
  'circle',
  'flower',
  'puffyDiamond',
  '4LeafClover',
  'square',
  'sunny',
  'ghostIsh',
  'hexagon',
  'heart',
]

const currentShapeIndex = ref(0)

const currentShape = computed(() =>
  expressiveSequence[currentShapeIndex.value] ?? 'circle',
)

const cycle = useTimer(() => {
  currentShapeIndex.value
    = (currentShapeIndex.value + 1) % expressiveSequence.length
}, { duration: 1000, repeat: true })

watch(() => props.variant, (variant) => {
  if (variant === 'expressive') {
    cycle.start()
  } else {
    cycle.stop()
  }
}, { immediate: true })
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/loading' as t;

$arc-duration: 1333ms;
$cycle-duration: calc(4 * $arc-duration);
$linear-rotate-duration: calc($arc-duration * 360 / 306);
$indeterminate-easing: cubic-bezier(0.4, 0, 0.2, 1);

.ui-loading {
  $prefix: 'md-loading';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  contain: strict;
  content-visibility: auto;

  &--small {
    width: g($t, 'size-small');
    height: g($t, 'size-small');

    --ui-loading-thickness: 3rem;
  }

  &--medium {
    width: g($t, 'size-medium');
    height: g($t, 'size-medium');

    --ui-loading-thickness: 4rem;
  }

  &--large {
    width: g($t, 'size-large');
    height: g($t, 'size-large');

    --ui-loading-thickness: 5rem;
  }

  &--inline {
    vertical-align: middle;
  }

  // 3. linear-rotate wrapper
  &--circular {
    animation: linear infinite ui-loading-linear-rotate;
    animation-duration: $linear-rotate-duration;
  }

  &--expressive {
    animation: linear infinite ui-loading-linear-rotate;
    animation-duration: 4s; // M3 slow rotation for expressive shapes
    color: g($t, 'spinner-color');
  }

  &__spinner,
  &__left,
  &__right,
  &__circle,
  &__expressive {
    position: absolute;
    inset: 0;
  }

  &__expressive {
    color: g($t, 'spinner-color');
    display: block;
  }

  // 2. rotate-arc spinner
  &__spinner {
    animation: infinite both ui-loading-rotate-arc;
    animation-duration: $cycle-duration;
    animation-timing-function: $indeterminate-easing;
  }

  &__left {
    overflow: hidden;
    inset: 0 50% 0 0;
  }

  &__right {
    overflow: hidden;
    inset: 0 0 0 50%;
  }

  // 1. expand-arc circles
  &__circle {
    box-sizing: border-box;
    border-radius: 50%;
    border: solid var(--ui-loading-thickness);
    border-color: g($t, 'spinner-color') g($t, 'spinner-color') transparent transparent;
    animation: ui-loading-expand-arc;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
    animation-duration: $arc-duration, $cycle-duration;
    animation-timing-function: $indeterminate-easing;
  }

  &__left &__circle {
    transform: rotate(135deg);
    inset: 0 -100% 0 0;
  }

  &__right &__circle {
    transform: rotate(100deg);
    inset: 0 0 0 -100%;
    animation-delay: calc(-0.5 * $arc-duration), 0ms;
  }
}

@keyframes ui-loading-expand-arc {
  0% {
    transform: rotate(265deg);
  }

  50% {
    transform: rotate(130deg);
  }

  100% {
    transform: rotate(265deg);
  }
}

@keyframes ui-loading-rotate-arc {
  12.5% {
    transform: rotate(135deg);
  }

  25% {
    transform: rotate(270deg);
  }

  37.5% {
    transform: rotate(405deg);
  }

  50% {
    transform: rotate(540deg);
  }

  62.5% {
    transform: rotate(675deg);
  }

  75% {
    transform: rotate(810deg);
  }

  87.5% {
    transform: rotate(945deg);
  }

  100% {
    transform: rotate(1080deg);
  }
}

@keyframes ui-loading-linear-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
