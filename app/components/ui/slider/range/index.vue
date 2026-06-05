<template>
  <div
    class="ui-slider-range"
    :class="[
      { 'ui-slider-range--vertical': orientation === 'vertical' },
      { 'ui-slider-range--disabled': disabled },
      { 'ui-slider-range--readonly': readonly },
    ]"
    :style="cssVars"
  >
    <div
      v-if="discrete && tickCount > 0"
      class="ui-slider-range__tickmarks"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  start: number
  end: number
  discrete?: boolean
  tickCount?: number
  disabled?: boolean
  readonly?: boolean
  orientation?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
  discrete: false,
  tickCount: 0,
  disabled: false,
  readonly: false,
  orientation: 'horizontal',
})

const cssVars = computed(() => {
  const isVertical = props.orientation === 'vertical'

  if (isVertical) {
    return {
      'bottom': `${props.start}%`,
      'height': `${props.end - props.start}%`,
      '--ui-slider-range-start-raw': `${props.start}%`,
      '--ui-slider-tick-count': props.tickCount,
    }
  }

  return {
    'left': `${props.start}%`,
    'width': `${props.end - props.start}%`,
    '--ui-slider-range-start-raw': `${props.start}%`,
    '--ui-slider-tick-count': props.tickCount,
  }
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/slider/range/index' as t;

$prefix: 'ui-slider-range';

.ui-slider-range {
  $t: material-map(t.$tokens, $prefix);

  position: absolute;
  height: g($t, 'height');
  border-radius: g($t, 'border.radius');
  background-color: g($t, 'background.color');
  pointer-events: none;
  overflow: hidden;
  top: 50%;
  transform: translateY(-50%);
  box-sizing: border-box;

  &--vertical {
    top: auto;
    left: 50%;
    transform: translateX(-50%);
    width: g($t, 'height');
    height: auto;
    border-radius: g($t, 'border.radius');
  }

  &--disabled {
    opacity: 0.38;
  }

  // Active tickmarks inside range container
  &__tickmarks {
    position: absolute;
    left: calc(-1 * var(--ui-slider-range-start-raw));
    width: 100vw;
    height: 100%;
    pointer-events: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(
        circle at 2rem center,
        color-mix(in srgb, var(--color-on-primary, #fff) 38%, transparent) 2rem,
        transparent 2rem
      );
      background-size: calc(100% / var(--ui-slider-tick-count)) 100%;
    }
  }

  &--vertical &__tickmarks {
    left: 0;
    bottom: calc(-1 * var(--ui-slider-range-start-raw));
    width: 100%;
    height: 100vh;

    &::before {
      background-image: radial-gradient(
        circle at center 2rem,
        color-mix(in srgb, var(--color-on-primary, #fff) 38%, transparent) 2rem,
        transparent 2rem
      );
      background-size: 100% calc(100% / var(--ui-slider-tick-count));
    }
  }
}
</style>
