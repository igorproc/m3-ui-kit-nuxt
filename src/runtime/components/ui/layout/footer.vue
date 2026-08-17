<template>
  <footer
    class="m-layout-footer"
    :class="{ 'm-layout-footer--sticky': sticky }"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <slot />
  </footer>
</template>

<script setup lang="ts">
// Нижняя зона лейаута. Мульти-инстанс (auto-id), приоритет задаёт order или DOM.
// По умолчанию — классический футер в потоке; sticky прибивает к низу
// viewport (строка грида резервирует место, нужен размер)
interface Props {
  sticky?: boolean
  sizeToken?: string
  order?: number
}

const props = withDefaults(defineProps<Props>(), {
  sticky: false,
  sizeToken: undefined,
  order: undefined,
})

const { layoutItemStyles, layoutItemAttrs } = useLayoutItem({
  kind: 'bottom',
  sizeToken: computed(() => props.sizeToken),
  sticky: computed(() => props.sticky),
  order: computed(() => props.order),
})
</script>

<style lang="scss">
.m-layout-footer {
  &--sticky {
    z-index: z(header);
  }
}
</style>
