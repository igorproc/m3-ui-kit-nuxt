<template>
  <div
    ref="trackRef"
    class="ui-slider-track"
    :class="[
      { 'ui-slider-track--vertical': orientation === 'vertical' },
      { 'ui-slider-track--disabled': disabled },
      { 'ui-slider-track--readonly': readonly },
      { 'ui-slider-track--discrete': discrete },
    ]"
    :style="cssVars"
  >
    <div
      v-if="discrete && tickCount > 0"
      class="ui-slider-track__tickmarks"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
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

const trackRef = ref<HTMLElement | null>(null)

const cssVars = computed(() => ({
  '--ui-slider-tick-count': props.tickCount,
}))

defineExpose({ element: trackRef })
</script>

<style lang="scss">
@use 'sass:map';
@use '~/assets/stylesheet/components/slider/track/index' as t;

$prefix: 'ui-slider-track';

.ui-slider-track {
  $t: material-map(t.$tokens, $prefix);

  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  pointer-events: auto;
  cursor: pointer;
  touch-action: none;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: g($t, 'height');
    border-radius: g($t, 'border.radius');
    background-color: g($t, 'background.color');
  }

  &--disabled {
    cursor: default;
    opacity: 0.38;
  }

  &--readonly {
    cursor: default;
  }

  &--vertical {
    flex-direction: column;
    justify-content: center;
    width: g($t, 'height');
    height: 100%;
    left: 50%;
    transform: translateX(-50%);

    &::before {
      left: 50%;
      transform: translateX(-50%);
      top: 0;
      bottom: 0;
      width: g($t, 'height');
      height: 100%;
    }
  }

  // Ticks for Discrete Slider
  &__tickmarks {
    position: absolute;
    left: 0;
    right: 0;
    height: g($t, 'height');
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
    width: g($t, 'height');
    height: 100%;
    top: 0;
    bottom: 0;

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
