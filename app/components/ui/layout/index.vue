<template>
  <div
    class="ui-layout"
    :style="layoutStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { createLayout } from '../../../composables/useLayout'

const { layoutStyles } = createLayout()
</script>

<style lang="scss">
.ui-layout {
  position: relative;
  overflow: hidden;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
</style>
