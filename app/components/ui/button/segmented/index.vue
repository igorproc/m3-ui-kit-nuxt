<template>
  <div class="ui-segmented-button-group">
    <slot />
  </div>
</template>

<script setup lang="ts">
// This component should provide context for active states to its children
</script>

<style lang="scss">
.ui-segmented-button-group {
  display: inline-flex;
  align-items: stretch;
  border-radius: var(--sys-shape-corner-full, 100vmax);
  border: 1rem solid var(--color-outline);
  overflow: hidden;

  // The inner buttons must have transparent borders or rely on the parent wrapper
  // and have dividers between them
  .ui-button {
    border: none;
    border-radius: 0;

    &:not(:last-child) {
      border-right: 1rem solid var(--color-outline);
    }

    &.ui-button--outlined {
      border: none; // Override outlined button borders
      &:not(:last-child) {
        border-right: 1rem solid var(--color-outline);
      }
    }
  }
}
</style>
