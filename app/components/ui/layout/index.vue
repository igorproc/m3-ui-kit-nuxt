<template>
  <div
    class="m-layout"
    :class="{ 'm-layout--full-height': fullHeight }"
    :style="layoutStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  fullHeight?: boolean
}

withDefaults(defineProps<Props>(), {
  fullHeight: false,
})

const { layoutStyles } = createLayout()

/**
 * Отдельные computed на каждый диапазон: в стилях к ним привязан v-bind() внутри своего @media,
 * браузер выбирает сетку по ширине viewport без ожидания клиентского JS — дружелюбно к SSR и CLS.
 * Строки совпадают с $breakpoints (abstracts/_variables.scss + material-kit merge).
 */
const mobileGridTemplateAreas = computed(
  () => '"header" "main" "footer"',
)

const tabletGridTemplateAreas = computed(
  () => '"header header" "left main" "footer footer"',
)

const desktopGridTemplateAreas = computed(
  () => '"header header header" "left main right" "footer footer footer"',
)
</script>

<style lang="scss">
.m-layout {
  display: grid;
  min-height: 100dvh;
  contain: layout style;
  grid-template-rows:
    var(--m3-layout-header-height, 0px)
    minmax(0, 1fr)
    var(--m3-layout-footer-height, 0px);

  /* mobile-first: header / main / footer; left & right — вне потока (drawer/overlay), см. rail/drawer */
  grid-template-areas: v-bind(mobileGridTemplateAreas);
  grid-template-columns: minmax(0, 1fr);

  /* tablet: две колонки, без колонки right в сетке */
  @include media-distance(map.get($breakpoints, 'tablet-xs'), map.get($breakpoints, 'desktop-xs')) {
    grid-template-areas: v-bind(tabletGridTemplateAreas);
    grid-template-columns:
      var(--m3-layout-left-width, 0px)
      minmax(0, 1fr);
  }

  /* desktop: три колонки */
  @include media-min(map.get($breakpoints, 'desktop-xs')) {
    grid-template-areas: v-bind(desktopGridTemplateAreas);
    grid-template-columns:
      var(--m3-layout-left-width, 0px)
      minmax(0, 1fr)
      var(--m3-layout-right-width, 0px);
  }

  &--full-height {
    height: 100dvh;
    overflow: hidden;
  }
}
</style>
