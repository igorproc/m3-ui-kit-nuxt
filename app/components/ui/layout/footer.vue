<template>
  <footer
    class="m-layout-footer"
    :class="{ 'm-layout-footer--sticky': sticky }"
    :style="layoutItemStyles"
  >
    <slot />
  </footer>
</template>

<script setup lang="ts">
// Нижняя зона лейаута. Мульти-инстанс (auto-id), порядок задаёт DOM.
// По умолчанию — классический футер в потоке; sticky прибивает к низу
// viewport (строка грида резервирует место, нужен размер)
interface Props {
  sticky?: boolean
  sizeToken?: string
}

const props = withDefaults(defineProps<Props>(), {
  sticky: false,
  sizeToken: undefined,
})

const { layoutItemStyles } = useLayoutItem({
  kind: 'bottom',
  sizeToken: computed(() => props.sizeToken),
  sticky: computed(() => props.sticky),
})
</script>

<style lang="scss">
.m-layout-footer {
  &--sticky {
    z-index: z(header);
  }
}
</style>
