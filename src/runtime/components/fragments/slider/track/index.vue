<template>
  <div
    class="ui-slider-track"
    :class="[
      `ui-slider-track--${density}`,
      {
        'ui-slider-track--vertical': orientation === 'vertical',
        'ui-slider-track--disabled': disabled,
        'ui-slider-track--readonly': readonly,
        'ui-slider-track--dragging': isDragging,
      },
    ]"
    :style="segmentVars"
  >
    <!-- Segments of the track, cut around the handle. -->
    <span
      v-if="twoSided"
      class="ui-slider-track__segment ui-slider-track__segment--inactive ui-slider-track__segment--start"
    />
    <span
      class="ui-slider-track__segment ui-slider-track__segment--active"
      :class="{ 'ui-slider-track__segment--from-edge': !twoSided }"
    >
      <span
        v-if="$slots.icon"
        class="ui-slider-track__icon ui-slider-track__icon--active"
        aria-hidden="true"
      >
        <slot name="icon" />
      </span>
    </span>
    <span class="ui-slider-track__segment ui-slider-track__segment--inactive ui-slider-track__segment--end">
      <!-- The same icon, clipped to the inactive side: it reads on either colour. -->
      <span
        v-if="$slots.icon"
        class="ui-slider-track__icon ui-slider-track__icon--inactive"
        aria-hidden="true"
      >
        <slot name="icon" />
      </span>
    </span>

    <!-- A discrete track ends in ticks of its own: no stop indicators then. -->
    <template v-if="!ticks.length">
      <span
        v-if="twoSided"
        class="ui-slider-track__stop ui-slider-track__stop--start"
      />
      <span class="ui-slider-track__stop ui-slider-track__stop--end" />
    </template>

    <span
      v-for="tick in ticks"
      :key="tick.position"
      class="ui-slider-track__tick"
      :class="{ 'ui-slider-track__tick--active': tick.active }"
      :style="{ '--ui-slider-tick': `${tick.position}%` }"
    />

    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * The track of `<MSlider>`: the inactive and active segments cut around the
 * handles, the stop indicators at the inactive ends, the tick marks of a
 * discrete slider and the inset icon. Geometry is two percentages (`start`,
 * `end`) and whether each end is a handle (cut) or the scale itself.
 */
import { computed } from 'vue'

interface Props {
  /** Start and end of the active track, in % of the scale. */
  start: number
  end: number
  /** Which ends of the active track stand at a handle. */
  startCut: boolean
  endCut: boolean
  /** Tick positions (%), for a discrete slider. */
  tickPositions?: number[]
  density?: 'default' | 'comfortable'
  disabled?: boolean
  readonly?: boolean
  orientation?: 'horizontal' | 'vertical'
  /** A thumb is being dragged: the segments and ticks follow it without easing. */
  isDragging?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tickPositions: () => [],
  density: 'default',
  disabled: false,
  readonly: false,
  orientation: 'horizontal',
  isDragging: false,
})

/** A range or a centered slider has inactive track on both sides. */
const twoSided = computed(() => props.start > 0 || props.startCut)

// Runtime bridge: positions are known only from the value (D2).
const segmentVars = computed(() => ({
  '--ui-slider-start': `${props.start}%`,
  '--ui-slider-end': `${props.end}%`,
  '--ui-slider-end-n': props.end,
  '--ui-slider-start-cut': props.startCut ? 1 : 0,
  '--ui-slider-end-cut': props.endCut ? 1 : 0,
}))

const ticks = computed(() => props.tickPositions.map(position => ({
  position,
  active: position >= props.start && position <= props.end,
})))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/slider' as t;

$start: 'var(--ui-slider-start)';
$end: 'var(--ui-slider-end)';
$start-cut: 'var(--ui-slider-start-cut)';
$end-cut: 'var(--ui-slider-end-cut)';

.ui-slider-track {
  $t: material-map(t.$tokens, 'md-slider');
  $cut: g($t, 'track.cut');
  $inner: g($t, 'track.inner-corner');

  position: absolute;
  inset: 0;
  container-type: inline-size;
  cursor: pointer;
  box-sizing: border-box;

  &--disabled,
  &--readonly {
    cursor: default;
  }

  &--dragging &__segment,
  &--dragging &__tick {
    transition: none;
  }

  &__segment {
    position: absolute;
    inset-block: 0;
    margin-block: auto;
    overflow: hidden;
    transition: background-color g($t, 'motion.duration') g($t, 'motion.easing');

    &--inactive {
      background-color: g($t, 'track.inactive');
    }

    &--active {
      background-color: g($t, 'track.active');
      inset-inline: calc(#{$start} + #{$start-cut} * #{$cut}) calc(100% - #{$end} + #{$end-cut} * #{$cut});
    }

    &--start {
      inset-inline: 0 calc(100% - #{$start} + #{$start-cut} * #{$cut});
    }

    &--end {
      inset-inline: calc(#{$end} + #{$end-cut} * #{$cut}) 0;
    }
  }

  @each $density in (default, comfortable) {
    &--#{$density} &__segment {
      block-size: g($t, 'density.#{$density}.track');
      border-radius: $inner;
    }

    // Corners at the ends of the scale are the track's own; inside, 2.
    &--#{$density} &__segment--start,
    &--#{$density} &__segment--from-edge {
      border-start-start-radius: g($t, 'density.#{$density}.corner');
      border-end-start-radius: g($t, 'density.#{$density}.corner');
    }

    &--#{$density} &__segment--end {
      border-start-end-radius: g($t, 'density.#{$density}.corner');
      border-end-end-radius: g($t, 'density.#{$density}.corner');
    }

    // A tick at an end of the scale stays inside the rounded corner.
    &--#{$density} &__tick {
      inset-inline-start: clamp(#{g($t, 'density.#{$density}.corner')}, var(--ui-slider-tick), calc(100% - #{g($t, 'density.#{$density}.corner')}));
    }

    &--vertical.ui-slider-track--#{$density} &__tick {
      inset-inline-start: 0;
      bottom: clamp(#{g($t, 'density.#{$density}.corner')}, var(--ui-slider-tick), calc(100% - #{g($t, 'density.#{$density}.corner')}));
    }

    // The stop's centre stands one corner in from the end.
    &--#{$density} &__stop--start {
      inset-inline-start: calc(#{g($t, 'density.#{$density}.corner')} - #{g($t, 'stop.size')} / 2);
    }

    &--#{$density} &__stop--end {
      inset-inline-end: calc(#{g($t, 'density.#{$density}.corner')} - #{g($t, 'stop.size')} / 2);
    }
  }

  &__stop,
  &__tick {
    position: absolute;
    inset-block: 0;
    margin-block: auto;
    border-radius: var(--sys-shape-corner-full);
    pointer-events: none;
  }

  &__stop {
    inline-size: g($t, 'stop.size');
    block-size: g($t, 'stop.size');
    background-color: g($t, 'stop.color');
  }

  &__tick {
    inline-size: g($t, 'tick.size');
    block-size: g($t, 'tick.size');
    translate: -50% 0;
    transition: background-color g($t, 'motion.duration') g($t, 'motion.easing');
    background-color: g($t, 'tick.inactive');

    &--active {
      background-color: g($t, 'tick.active');
    }

    &:dir(rtl) {
      translate: 50% 0;
    }
  }

  // The inset icon (comfortable): one copy per side, each clipped by its
  // segment, both standing at the track's start.
  &__icon {
    position: absolute;
    inset-block: 0;
    display: inline-flex;
    align-items: center;
    font-size: g($t, 'icon.size');

    &--active {
      inset-inline-start: g($t, 'icon.inset');
      color: g($t, 'icon.active');
    }

    &--inactive {
      // Back to the track's start from the segment's own: `cqi` is the track (a size container).
      inset-inline-start: calc(#{g($t, 'icon.inset')} - var(--ui-slider-end-n) * 1cqi - #{$end-cut} * #{$cut});
      color: g($t, 'icon.inactive');
    }
  }

  &--disabled &__segment--active,
  &--disabled &__stop {
    background-color: g($t, 'disabled.active');
  }

  &--disabled &__segment--inactive {
    background-color: g($t, 'disabled.inactive');
  }

  &--disabled &__tick {
    background-color: g($t, 'disabled.tick.inactive');
  }

  &--disabled &__tick--active {
    background-color: g($t, 'disabled.tick.active');
  }

  // Vertical: the value grows upwards, so the "start" is the bottom.
  &--vertical &__segment {
    inset-block: auto;
    inset-inline: 0;
    margin-block: 0;
    margin-inline: auto;

    &--active {
      bottom: calc(#{$start} + #{$start-cut} * #{$cut});
      top: calc(100% - #{$end} + #{$end-cut} * #{$cut});
    }

    &--start {
      bottom: 0;
      top: calc(100% - #{$start} + #{$start-cut} * #{$cut});
    }

    &--end {
      bottom: calc(#{$end} + #{$end-cut} * #{$cut});
      top: 0;
    }
  }

  @each $density in (default, comfortable) {
    &--vertical.ui-slider-track--#{$density} &__segment {
      block-size: auto;
      inline-size: g($t, 'density.#{$density}.track');
      border-radius: $inner;
    }

    &--vertical.ui-slider-track--#{$density} &__segment--start,
    &--vertical.ui-slider-track--#{$density} &__segment--from-edge {
      border-end-start-radius: g($t, 'density.#{$density}.corner');
      border-end-end-radius: g($t, 'density.#{$density}.corner');
    }

    &--vertical.ui-slider-track--#{$density} &__segment--end {
      border-start-start-radius: g($t, 'density.#{$density}.corner');
      border-start-end-radius: g($t, 'density.#{$density}.corner');
    }

    &--vertical.ui-slider-track--#{$density} &__stop--start {
      inset-inline-start: 0;
      bottom: calc(#{g($t, 'density.#{$density}.corner')} - #{g($t, 'stop.size')} / 2);
    }

    &--vertical.ui-slider-track--#{$density} &__stop--end {
      inset-inline-end: 0;
      top: calc(#{g($t, 'density.#{$density}.corner')} - #{g($t, 'stop.size')} / 2);
    }
  }

  &--vertical &__stop,
  &--vertical &__tick {
    inset-block: auto;
    inset-inline: 0;
    margin-block: 0;
    margin-inline: auto;
  }

  &--vertical &__tick {
    translate: 0 50%;
  }

  // The track is only a tone; forced colors would leave nothing to aim at.
  @include forced-colors {
    &__segment--inactive {
      border: 1px solid CanvasText;
    }

    &__segment--active,
    &__stop,
    &__tick {
      background-color: Highlight;
    }

    &--disabled &__segment--inactive {
      border-color: GrayText;
    }

    &--disabled &__segment--active,
    &--disabled &__stop,
    &--disabled &__tick {
      background-color: GrayText;
    }
  }
}
</style>
