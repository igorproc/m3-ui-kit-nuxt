<template>
  <div
    class="m-layout-item"
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
  kind?: LayoutKind
  /** @deprecated v1 — use `kind` */
  area?: LayoutArea
  sizeToken?: string
  sticky?: boolean
  force?: boolean
}

const props = defineProps<Props>()

const { layoutItemStyles } = useLayoutItem({
  id: props.id,
  kind: computed(() => props.kind),
  area: props.area,
  sizeToken: computed(() => props.sizeToken),
  sticky: computed(() => props.sticky),
  force: props.force,
})
</script>
