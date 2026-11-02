<template>
  <main
    class="m-layout-main"
    :class="{ 'm-layout-main--scroll': isScroller, 'm-layout-main--container': container }"
    :tabindex="isScroller ? 0 : undefined"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <slot />
  </main>
</template>

<script setup lang="ts">
// Контентная зона — остаточный прямоугольник после выкраивания краёв.
// Скроллится сама только в full-height-режиме; там же она tab-stop, чтобы
// скролл был доступен с клавиатуры, даже когда внутри нечего фокусировать
interface Props {
  order?: number
  /** Size container `main-content` for `@container` queries; it also becomes the containing block of `position: fixed` inside. */
  container?: boolean
}

const props = defineProps<Props>()

const { layoutItemStyles, layoutItemAttrs, isScroller } = useLayoutItem({
  kind: 'main',
  order: computed(() => props.order),
})
</script>

<style lang="scss">
.m-layout-main {
  min-width: 0;
  min-height: 0;

  // Page-scroll mode: the document scrolls. `clip` cuts wide content without
  // making main a scroll container, so `position: sticky` inside still sticks.
  overflow-x: clip;

  &--scroll {
    overflow: auto;
    scrollbar-gutter: stable;

    &:focus-visible {
      @include focus-ring(inset);
    }
  }

  &--container {
    container: main-content / inline-size;
  }
}
</style>
