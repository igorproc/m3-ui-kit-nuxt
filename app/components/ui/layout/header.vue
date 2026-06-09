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
// сетки, порядок задаёт DOM. Размер — явный sizeToken или вклад детей
// (m-app-bar / m-system-bar внутри)
interface Props {
  /** Прибить к верху viewport (строка грида резервирует место) */
  sticky?: boolean
  sizeToken?: string
}

const props = withDefaults(defineProps<Props>(), {
  sticky: true,
  sizeToken: undefined,
})

const { layoutItemStyles, layoutItemAttrs } = useLayoutItem({
  kind: 'top',
  sizeToken: computed(() => props.sizeToken),
  sticky: computed(() => props.sticky),
})
</script>

<style lang="scss">
.m-layout-header {
  &--sticky {
    z-index: z(header);
  }
}
</style>
