<script setup lang="ts">
import type { LayoutItem } from '~/composables/useLayout'

const schema: LayoutItem[] = [
  { id: 'app-bar', area: 'header', sizeToken: '--ui-app-bar-height-center-aligned' },
  { id: 'navigation-drawer', area: 'left', sizeToken: '--ui-navigation-rail-width-expanded' }
]
</script>

<template>
  <m-layout class="layout-youtube" :schema="schema">
    <m-layout-header>
      <slot name="header" />
    </m-layout-header>

    <m-layout-aside position="left">
      <slot name="sidebar" />
    </m-layout-aside>

    <m-layout-main>
      <slot />
    </m-layout-main>
  </m-layout>
</template>
