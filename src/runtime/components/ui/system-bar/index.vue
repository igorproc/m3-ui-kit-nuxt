<template>
  <div
    class="ui-system-bar"
    :class="{ 'ui-system-bar--anchored': isLayoutChild }"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
// Тонкий статус-бар (m3-like, аналог v-system-bar). Первый уровень m-layout →
// top-зона; внутри m-layout-header — вклад высоты (стек с m-app-bar суммируется)
import { mSystemBarProps } from './props'

const props = defineProps(mSystemBarProps)

const { layoutItemStyles, layoutItemAttrs, isLayoutChild } = useLayoutItem({
  kind: 'top',
  sizeToken: '--ui-system-bar-height',
  sticky: computed(() => props.sticky),
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/system-bar/index' as t;

.ui-system-bar {
  $t: material-map(t.$tokens, 'ui-system-bar');

  @at-root :root {
    --ui-system-bar-height: #{g($t, 'container-height')};
  }

  display: flex;
  align-items: center;
  gap: g($t, 'container-gap');
  height: var(--ui-system-bar-height);
  padding-inline: g($t, 'container-padding-inline');
  background-color: g($t, 'container-color');
  color: g($t, 'container-text-color');

  @include typescale(g($t, 'container-typography'));

  .ui-icon {
    font-size: g($t, 'icon-size');
  }

  &--anchored {
    z-index: z(header);
  }
}
</style>
