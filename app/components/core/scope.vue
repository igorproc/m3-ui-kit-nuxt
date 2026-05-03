<script lang="ts" setup>
const { progress } = useLoadingIndicator({ throttle: 0, duration: 5e100 })
</script>

<template>
  <section class="app-common-scope">
    <core-global-container />

    <ui-progress
      :value="progress"
      class="app-common-scope__indicator"
    />
  </section>
</template>

<style lang="scss">
.app-common-scope {
  & &__indicator {
    position: fixed;
    top: 0;
    z-index: z('dialog');
    background-color: transparent;
  }
}
</style>
