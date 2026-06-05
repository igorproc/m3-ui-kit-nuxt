<template>
  <div
    ref="thumbRef"
    class="ui-slider-thumb"
    :class="[
      { 'ui-slider-thumb--vertical': orientation === 'vertical' },
      { 'ui-slider-thumb--dragging': isDragging },
      { 'ui-slider-thumb--disabled': disabled },
      { 'ui-slider-thumb--readonly': readonly },
    ]"
    role="slider"
    :tabindex="disabled ? -1 : 0"
    :aria-valuenow="value"
    :aria-valuemin="valueMin"
    :aria-valuemax="valueMax"
    :aria-orientation="ariaOrientation || orientation"
    :aria-disabled="disabled ? 'true' : undefined"
    :aria-readonly="readonly ? 'true' : undefined"
    :aria-label="ariaLabel"
    :aria-labelledby="ariaLabelledby"
    :aria-valuetext="ariaValuetext || String(value)"
    :data-state="isDragging ? 'dragging' : 'idle'"
    :style="positionStyle"
    @pointerdown="onPointerdown"
    @keydown="onKeydown"
  >
    <div class="ui-slider-thumb__state-layer" />

    <div class="ui-slider-thumb__knob" />

    <div
      v-if="showValue"
      class="ui-slider-thumb__value-label"
    >
      <span class="ui-slider-thumb__value-text">
        <slot
          name="value"
          :value="value"
        >
          {{ value }}
        </slot>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  value: number
  pct: number
  showValue?: boolean
  disabled?: boolean
  readonly?: boolean
  orientation?: 'horizontal' | 'vertical'
  ariaOrientation?: 'horizontal' | 'vertical'
  isDragging?: boolean
  ariaLabel?: string
  ariaLabelledby?: string
  ariaValuetext?: string
  valueMin?: number
  valueMax?: number
}

const props = withDefaults(defineProps<Props>(), {
  showValue: false,
  disabled: false,
  readonly: false,
  orientation: 'horizontal',
  ariaOrientation: undefined,
  isDragging: false,
  ariaLabel: undefined,
  ariaLabelledby: undefined,
  ariaValuetext: undefined,
  valueMin: 0,
  valueMax: 100,
})

const emit = defineEmits<{
  (e: 'pointerdown', event: PointerEvent, thumbEl: HTMLElement): void
  (e: 'keydown', event: KeyboardEvent): void
}>()

const thumbRef = ref<HTMLElement | null>(null)

const positionStyle = computed(() => {
  const isVertical = props.orientation === 'vertical'
  return {
    [isVertical ? 'bottom' : 'left']: `calc(${props.pct}% - 24rem)`,
    'touch-action': 'none',
  }
})

const onPointerdown = (e: PointerEvent) => {
  if (props.disabled || props.readonly) {
    return
  }

  if (thumbRef.value) {
    emit('pointerdown', e, thumbRef.value)
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (props.disabled || props.readonly) {
    return
  }

  emit('keydown', e)
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/slider/thumb/index' as t;

$prefix: 'ui-slider-thumb';

.ui-slider-thumb {
  $t: material-map(t.$tokens, $prefix);

  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48rem;
  height: 48rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  z-index: 2;
  box-sizing: border-box;

  &--vertical {
    top: auto;
    left: 50%;
    transform: translateX(-50%);
  }

  &--disabled {
    cursor: default;
    pointer-events: none;
  }

  &--readonly {
    cursor: default;
  }

  // Thumb Knob
  &__knob {
    width: g($t, 'size');
    height: g($t, 'size');
    border-radius: var(--sys-shape-corner-full, 50%);
    background-color: g($t, 'color');
    box-shadow: g($t, 'elevation.shadow');
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
    z-index: 2;
  }

  // Ripple / Hover State Layer
  &__state-layer {
    position: absolute;
    width: g($t, 'state.layer.size');
    height: g($t, 'state.layer.size');
    border-radius: 50%;
    background-color: g($t, 'color');
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    z-index: 1;
  }

  &:hover &__state-layer {
    opacity: g($t, 'state.layer.hover.opacity');
  }

  &:focus-visible &__state-layer,
  &--dragging &__state-layer {
    opacity: g($t, 'state.layer.pressed.opacity');
  }

  // Pin Value Label Tooltip
  &__value-label {
    position: absolute;
    bottom: 34rem; // Positioned above knob
    left: 50%;
    transform: translateX(-50%) scale(0);
    transform-origin: bottom center;
    display: flex;
    align-items: center;
    justify-content: center;
    width: g($t, 'tooltip.width');
    height: g($t, 'tooltip.height');
    z-index: 3;
    pointer-events: none;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      width: g($t, 'tooltip.width');
      height: g($t, 'tooltip.width'); // matches width to make a circle
      background-color: g($t, 'tooltip.background');
      border-radius: 50% 50% 0; // sharp point at bottom-right
      transform: rotate(45deg); // rotate to position point at bottom-center
      z-index: -1;
    }
  }

  &__value-text {
    position: relative;
    top: -4rem; // raise text inside balloon
    color: g($t, 'tooltip.color');

    @include apply-typography(g($t, 'tooltip.typography'));
  }

  // CSS active triggers for tooltip
  &:hover &__value-label,
  &:focus-visible &__value-label,
  &--dragging &__value-label {
    transform: translateX(-50%) scale(1);
  }

  // Adjust Tooltip for vertical orientation
  &--vertical &__value-label {
    inset: 50% 34rem auto auto; // Left side visually
    transform: translateY(-50%) scale(0);
    transform-origin: center right;

    &::before {
      border-radius: 50% 50% 50% 0; // rotate point to right center
      transform: rotate(-45deg);
    }
  }

  &--vertical &__value-text {
    top: 0;
    left: -4rem;
  }

  &--vertical:hover &__value-label,
  &--vertical:focus-visible &__value-label,
  &--vertical--dragging &__value-label {
    transform: translateY(-50%) scale(1);
  }

  // Rotate tooltip text back so it is upright when container is rotated
  .ui-slider-root--vertical &__value-text {
    transform: rotate(90deg);
  }
}
</style>
