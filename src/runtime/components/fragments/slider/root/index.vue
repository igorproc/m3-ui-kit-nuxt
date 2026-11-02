<template>
  <div
    class="ui-slider-root"
    :class="[
      `ui-slider-root--${density}`,
      { 'ui-slider-root--vertical': orientation === 'vertical' },
      { 'ui-slider-root--dragging': isDragging },
      { 'ui-slider-root--disabled': disabled },
      { 'ui-slider-root--readonly': readonly },
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  orientation?: 'horizontal' | 'vertical'
  density?: 'default' | 'comfortable'
  isDragging?: boolean
  disabled?: boolean
  readonly?: boolean
}

withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  density: 'default',
  isDragging: false,
  disabled: false,
  readonly: false,
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/slider' as t;

.ui-slider-root {
  $t: material-map(t.$tokens, 'md-slider');

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  inline-size: 100%;

  &--vertical {
    align-items: center;
    inline-size: auto;
  }
}
</style>
