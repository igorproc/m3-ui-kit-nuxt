<template>
  <span
    ref="root"
    class="ui-loading"
    :class="[
      `ui-loading--${type}`,
      `ui-loading--${size}`,
      { 'ui-loading--inline': inline },
    ]"
    role="status"
    :aria-label="ariaLabel"
  >
    <!-- Classic Circular Spinner -->
    <span
      v-if="type === 'circular'"
      class="ui-loading__spinner"
    >
      <span class="ui-loading__left">
        <span class="ui-loading__circle"></span>
      </span>

      <span class="ui-loading__right">
        <span class="ui-loading__circle"></span>
      </span>
    </span>

    <!-- M3 Expressive Morphing Shape -->
    <m-shape
      v-else-if="type === 'expressive'"
      class="ui-loading__expressive"
      :name="currentShape"
      :sequence="expressiveSequence"
      :transition="transition"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useReducedMotion } from '#kit/composables/useReducedMotion'
import { useTimer } from '#kit/composables/useTimer'
import { resolveTransition } from '#kit/utils/motion'
import { mLoadingProps } from './props'
import type { M3ShapeName } from '#kit/assets/icon/shapes'

// Loaded only for the expressive type: the shape paths and the morph weigh far
// more than the circular spinner, which every loading button renders.
const MShape = defineAsyncComponent(() => import('#kit/components/ui/shape/index.vue'))

const props = defineProps(mLoadingProps)

// Checked in the DOM: a host usually hides the indicator through a wrapper
// (`aria-hidden` on a button's spinner slot), which no prop or attr reveals.
if (import.meta.dev) {
  const root = useTemplateRef<HTMLElement>('root')

  onMounted(() => {
    const el = root.value
    if (!el || props.ariaLabel || el.hasAttribute('aria-labelledby') || el.closest('[aria-hidden="true"]')) return

    console.warn('[m-loading] has no accessible name: pass `aria-label`, or hide it with `aria-hidden="true"` when its host announces being busy itself.')
  })
}

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

// The cycle waits exactly as long as the morph takes to settle, plus the
// transition's own rest. A hardcoded interval either clips the morph or leaves
// the shape sitting still for the remainder, which reads as a stutter.
const transition = computed(() => resolveTransition(props.transition))

// Reduced motion slows the cycle (the morph itself turns calm in MShape), as it
// slows the circular spinner — `$reduced` in the loading tokens.
const REDUCED_SLOWDOWN = 2
const reducedMotion = useReducedMotion()

const cycle = useTimer(() => {
  currentShapeIndex.value
    = (currentShapeIndex.value + 1) % expressiveSequence.length
}, {
  duration: () => (transition.value.duration + transition.value.hold) * (reducedMotion.value ? REDUCED_SLOWDOWN : 1),
  repeat: true,
})

function runCycle(type: string) {
  if (type === 'expressive') cycle.start()
  else cycle.stop()
}

// The cycle is a browser timer: it starts once mounted, never during a server
// render, which has no unmount to stop it.
onMounted(() => runCycle(props.type))
watch(() => props.type, runCycle)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/loading' as t;

.ui-loading {
  $prefix: 'md-loading';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  contain: strict;
  content-visibility: auto;
  color: g($t, 'spinner.color');

  @each $size in ('small', 'medium', 'large') {
    &--#{$size} {
      width: g($t, 'size.#{$size}');
      height: g($t, 'size.#{$size}');

      .ui-loading__circle {
        border-width: g($t, 'thickness.#{$size}');
      }
    }
  }

  // Inside a line of text or a control the indicator takes the surrounding
  // font size and colour, so a host sizes and tints it like an icon.
  &--inline {
    width: 1em;
    height: 1em;
    vertical-align: g($t, 'inline.align');
    color: inherit;

    .ui-loading__circle {
      border-width: g($t, 'thickness.inline');
    }
  }

  // 3. linear-rotate wrapper
  &--circular {
    animation: linear infinite ui-loading-linear-rotate;
    animation-duration: g($t, 'motion.loop.turn');
  }

  &__spinner,
  &__left,
  &__right,
  &__circle,
  &__expressive {
    position: absolute;
    inset: 0;
  }

  // The expressive indicator's rotation rides on the morph itself (each
  // transition carries its own turn), so no CSS rotation is layered on top.
  &__expressive {
    display: block;
  }

  // 2. rotate-arc spinner
  &__spinner {
    animation: infinite both ui-loading-rotate-arc;
    animation-duration: g($t, 'motion.loop.cycle');
    animation-timing-function: g($t, 'motion.easing');
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
    border-style: solid;
    border-color: currentcolor currentcolor transparent transparent;
    animation: ui-loading-expand-arc;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
    animation-duration: g($t, 'motion.loop.arc');
    animation-timing-function: g($t, 'motion.easing');
  }

  &__left &__circle {
    transform: rotate(135deg);
    inset: 0 -100% 0 0;
  }

  &__right &__circle {
    transform: rotate(100deg);
    inset: 0 0 0 -100%;
    animation-delay: g($t, 'motion.loop.offset');
  }

  @media (prefers-reduced-motion: reduce) {
    &--circular {
      animation-duration: g($t, 'motion.reduced.turn');
    }

    &__spinner {
      animation-duration: g($t, 'motion.reduced.cycle');
    }

    &__circle {
      animation-duration: g($t, 'motion.reduced.arc');
    }

    &__right &__circle {
      animation-delay: g($t, 'motion.reduced.offset');
    }
  }

  // The arc is two coloured border sides beside two transparent ones; pinned,
  // so forcing cannot recolour the transparent pair into a closed ring.
  @include forced-colors {
    &__circle {
      forced-color-adjust: none;
      border-color: Highlight Highlight transparent transparent;
    }

    &__expressive {
      forced-color-adjust: none;
      color: Highlight;
    }
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
