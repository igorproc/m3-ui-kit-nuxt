<template>
  <div
    class="ui-system-bar"
    :class="{ 'ui-system-bar--anchored': isLayoutChild }"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <span
      v-if="$slots.prepend"
      class="ui-system-bar__prepend"
    >
      <slot name="prepend" />
    </span>

    <span
      v-if="$slots.default"
      class="ui-system-bar__text"
    >
      <slot />
    </span>

    <span
      v-if="$slots.append"
      class="ui-system-bar__append"
    >
      <slot name="append" />
    </span>
  </div>
</template>

<script setup lang="ts">
// Тонкий статус-бар (m3-like, аналог v-system-bar). Первый уровень m-layout →
// top-зона; внутри m-layout-header — вклад высоты (стек с m-app-bar суммируется)
import { computed } from 'vue'
import { useLayoutItem } from '#kit/composables/useLayout'
import { mSystemBarProps } from './props'
import type { MSystemBarSlots } from './props'

const props = defineProps(mSystemBarProps)

defineSlots<MSystemBarSlots>()

const { layoutItemStyles, layoutItemAttrs, isLayoutChild } = useLayoutItem({
  kind: 'top',
  sizeToken: '--ui-system-bar-height',
  sticky: computed(() => props.sticky),
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/system-bar/index' as t;

.ui-system-bar {
  $t: material-map(t.$tokens, 'md-system-bar');

  @at-root :root {
    --ui-system-bar-height: #{g($t, 'container.height')};
  }

  display: flex;
  align-items: center;
  gap: g($t, 'container.gap');
  min-width: 0;
  min-height: var(--ui-system-bar-height);
  padding-inline: g($t, 'container.padding.inline');
  background-color: g($t, 'container.color');
  color: g($t, 'container.text.color');

  @include typescale(g($t, 'container.typography'));

  @include forced-colors {
    border-block-end: 1px solid CanvasText;
  }

  &__prepend,
  &__append {
    display: flex;
    flex: none;
    align-items: center;
    gap: g($t, 'container.gap');
    font-size: g($t, 'icon.size');
  }

  &__append {
    margin-inline-start: auto;
  }

  &__text {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--anchored {
    z-index: z(header);
  }
}
</style>
