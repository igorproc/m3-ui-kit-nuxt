<template>
  <div class="ui-app-bar__nav">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useAppBarContext } from '~/composables/app-bar/useAppBar'

// Leading region (nav/back icon button). Enforces an `<MAppBar>` ancestor —
// its `grid-area` is only meaningful inside the bar's grid.
useAppBarContext()
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/app-bar/index' as *;

.ui-app-bar__nav {
  grid-area: #{g($nav, 'grid-name')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: g($nav, 'min-width');
  min-height: g($nav, 'min-height');
  margin-inline-end: g($nav, 'margin');
}
</style>
