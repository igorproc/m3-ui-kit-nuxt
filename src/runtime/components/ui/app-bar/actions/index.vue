<template>
  <div class="ui-app-bar__actions">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useAppBarContext } from '#kit/composables/app-bar/useAppBar'

// Trailing region (action icon buttons / overflow). Enforces an `<MAppBar>`
// ancestor — its `grid-area` is only meaningful inside the bar's grid.
useAppBarContext()
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/app-bar/index' as *;

.ui-app-bar__actions {
  grid-area: #{g($actions, 'grid-name')};
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: g($actions, 'gap');
  margin-inline-start: g($actions, 'margin');
}
</style>
