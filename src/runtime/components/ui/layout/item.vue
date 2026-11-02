<template>
  <div
    class="m-layout-item"
    :class="{ 'm-layout-item--main': kind === 'main', 'm-layout-item--scroll': isScroller }"
    :tabindex="isScroller ? 0 : undefined"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
// Универсальная зона для кастомного контента в гриде лейаута.
// `force` — escape-hatch: регистрируется даже если parent-check не прошёл
// (например внутри renderless-обёртки вроде Transition)
interface Props {
  id?: string
  kind: LayoutKind
  sizeToken?: string
  sticky?: boolean
  force?: boolean
  order?: number
}

const props = defineProps<Props>()

const { layoutItemStyles, layoutItemAttrs, isScroller } = useLayoutItem({
  id: props.id,
  kind: computed(() => props.kind),
  sizeToken: computed(() => props.sizeToken),
  sticky: computed(() => props.sticky),
  force: props.force,
  order: computed(() => props.order),
})
</script>

<style lang="scss">
// Same contract as `m-layout-main`: a grid item that may shrink below its
// content, and the layout's scroller only in full-height mode.
.m-layout-item {
  &--main {
    min-width: 0;
    min-height: 0;
    overflow-x: clip;
  }

  &--scroll {
    overflow: auto;
    scrollbar-gutter: stable;

    &:focus-visible {
      @include focus-ring(inset);
    }
  }
}
</style>
