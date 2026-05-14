<script setup lang="ts">
// Layout Footer area component
const { layoutItemStyles } = useLayoutItem({
  id: 'layout-footer',
  area: 'footer',
})

// Provide area context for children
provideLayoutArea('footer')
</script>

<template>
  <footer
    class="m-layout-footer"
    :style="layoutItemStyles"
  >
    <slot />
  </footer>
</template>
