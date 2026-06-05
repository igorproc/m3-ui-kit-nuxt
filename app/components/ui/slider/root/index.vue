<template>
  <div
    class="ui-slider-root"
    :class="[
      { 'ui-slider-root--vertical': orientation === 'vertical' },
      { 'ui-slider-root--dragging': isDragging },
      { 'ui-slider-root--disabled': disabled },
      { 'ui-slider-root--readonly': readonly },
    ]"
    :data-orientation="orientation"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  orientation?: 'horizontal' | 'vertical'
  isDragging?: boolean
  disabled?: boolean
  readonly?: boolean
}

withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  isDragging: false,
  disabled: false,
  readonly: false,
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/slider/root/index' as t;

$prefix: 'ui-slider-root';

.ui-slider-root {
  $t: material-map(t.$tokens, $prefix);

  width: 100%;
  display: flex;
  flex-direction: column;
  gap: g($t, 'gap');
  position: relative;
  box-sizing: border-box;

  &--dragging * {
    transition: none !important;
  }

  &--vertical {
    align-items: center;
    height: 100%;
    width: g($t, 'height');
  }

  &__label {
    color: g($t, 'label.color');

    @include apply-typography(g($t, 'label.typography'));
  }
}
</style>
