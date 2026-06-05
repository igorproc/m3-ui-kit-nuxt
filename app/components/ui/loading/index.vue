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
    <UiShape
      v-else-if="variant === 'expressive'"
      :name="expressiveSequence[currentShapeIndex]"
      class="ui-loading__expressive"
    />
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import UiShape from '~/components/ui/shape/index.vue'
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
let shapeInterval: any

const startExpressiveLoop = () => {
  if (shapeInterval) clearInterval(shapeInterval)
  shapeInterval = setInterval(() => {
    currentShapeIndex.value = (currentShapeIndex.value + 1) % expressiveSequence.length
  }, 1000) // Morph every 1 second
}

watch(() => props.variant, (newVal) => {
  if (newVal === 'expressive') {
    startExpressiveLoop()
  } else if (shapeInterval) {
    clearInterval(shapeInterval)
  }
})

onMounted(() => {
  if (props.variant === 'expressive') {
    startExpressiveLoop()
  }
})

onBeforeUnmount(() => {
  if (shapeInterval) clearInterval(shapeInterval)
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/loading' as v;

$arc-duration: 1333ms;
$cycle-duration: calc(4 * $arc-duration);
$linear-rotate-duration: calc($arc-duration * 360 / 306);
$indeterminate-easing: cubic-bezier(0.4, 0, 0.2, 1);

.ui-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  contain: strict;
  content-visibility: auto;

  &--small {
    width: v.$size-small;
    height: v.$size-small;

    --ui-loading-thickness: 3rem;
  }

  &--medium {
    width: v.$size-medium;
    height: v.$size-medium;

    --ui-loading-thickness: 4rem;
  }

  &--large {
    width: v.$size-large;
    height: v.$size-large;

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
    color: v.$spinner-color;
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
    color: var(--color-primary);
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
    border-color: v.$spinner-color v.$spinner-color transparent transparent;
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
