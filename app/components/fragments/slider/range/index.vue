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
  const span = props.end - props.start

  // Unitless start/span let the inner tickmarks element re-derive the FULL track
  // width from its `span%` container, so the active dot grid lands exactly on the
  // inactive track grid (the range's `overflow:hidden` clips it to the fill).
  const shared = {
    '--ui-slider-range-start': props.start,
    '--ui-slider-range-span': span,
    '--ui-slider-tick-count': props.tickCount,
  }

  if (isVertical) {
    return {
      ...shared,
      bottom: `${props.start}%`,
      height: `${span}%`,
    }
  }

  return {
    ...shared,
    left: `${props.start}%`,
    width: `${span}%`,
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

  &__tickmarks {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--ui-slider-range-start) / var(--ui-slider-range-span) * -100%);
    width: calc(100% * 100 / var(--ui-slider-range-span));
    pointer-events: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0 4rem;
      background-image: radial-gradient(
        circle at 2rem center,
        g($t, 'tickmarks.color') 2rem,
        transparent 2rem
      );
      background-size: calc(100% / var(--ui-slider-tick-count)) 100%;
    }
  }

  &--vertical &__tickmarks {
    inset: auto 0 calc(var(--ui-slider-range-start) / var(--ui-slider-range-span) * -100%);
    width: auto;
    height: calc(100% * 100 / var(--ui-slider-range-span));

    &::before {
      inset: 4rem 0;
      background-image: radial-gradient(
        circle at center 2rem,
        g($t, 'tickmarks.color') 2rem,
        transparent 2rem
      );
      background-size: 100% calc(100% / var(--ui-slider-tick-count));
    }
  }
}
</style>
