<template>
  <div class="ui-live-region">
    <div
      class="ui-live-region__polite"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    />
    <div
      class="ui-live-region__assertive"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Private: the announcement regions of one layer — the overlay host or an
 * open modal. They are in the document before any message, so writing a
 * message into them is announced, which a region mounted together with its
 * text is not reliably. Messages go through `useLiveRegion`.
 */
</script>

<style lang="scss">
.ui-live-region {
  @include sr-only;
}
</style>
