<script setup lang="ts">
// Generic wrapper for custom content that needs to be positioned in the layout grid
interface Props {
  id: string
  area?: LayoutArea
  sizeToken?: string
}

const props = defineProps<Props>()

const { layoutItemStyles } = useLayoutItem({
  id: props.id,
  area: props.area,
  sizeToken: props.sizeToken,
})
</script>

<template>
  <div
    class="m-layout-item"
    :style="layoutItemStyles"
  >
    <slot />
  </div>
</template>
