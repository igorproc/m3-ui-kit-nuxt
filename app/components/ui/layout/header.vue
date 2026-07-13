<template>
  <header
    class="m-layout-header"
    :class="{ 'm-layout-header--sticky': sticky }"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <slot />
  </header>
</template>

<script setup lang="ts">
// Верхняя зона лейаута. Мульти-инстанс (auto-id): каждый header — своя строка
// сетки, приоритет задаёт order или DOM. Размер — явный sizeToken или вклад детей
// (m-app-bar / m-system-bar внутри)
interface Props {
  /** Прибить к верху viewport (строка грида резервирует место) */
  sticky?: boolean
  sizeToken?: string
  order?: number
}

const props = withDefaults(defineProps<Props>(), {
  sticky: true,
  sizeToken: undefined,
  order: undefined,
})

const { layoutItemStyles, layoutItemAttrs } = useLayoutItem({
  kind: 'top',
  sizeToken: computed(() => props.sizeToken),
  sticky: computed(() => props.sticky),
  order: computed(() => props.order),
})
</script>

<style lang="scss">
.m-layout-header {
  &--sticky {
    z-index: z(header);
  }
}
</style>
