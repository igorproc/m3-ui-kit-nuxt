<template>
  <m-layout class="wf-side-navigation">
    <m-layout-aside
      sticky
      size-token="56rem"
    >
      <div class="wf-side-navigation__rail">
        <div
          v-for="n in 6"
          :key="n"
          class="wf-side-navigation__avatar"
          :class="{ 'wf-side-navigation__avatar--primary': n === 1 }"
        />
      </div>
    </m-layout-aside>

    <m-layout-main>
      <!--  -->
    </m-layout-main>
  </m-layout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
</script>

<style lang="scss">
.wf-side-navigation {
  background-color: var(--md-sys-color-surface);

  &__rail {
    height: 100%;
    padding-block-start: 16rem;
    background-color: var(--md-sys-color-surface-container);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__avatar {
    width: 20rem;
    height: 20rem;
    margin-block-end: 36rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-outline-variant);

    &--primary {
      width: 36rem;
      height: 36rem;
      background-color: var(--md-sys-color-outline);
    }
  }
}
</style>
