<script setup lang="ts">
import type { LayoutItem } from '~/app/composables/useLayout'

const schema: LayoutItem[] = [
  { id: 'app-bar', area: 'header', sizeToken: '--ui-app-bar-height-center-aligned' },
  { id: 'navigation-rail', area: 'left', sizeToken: '--ui-navigation-rail-width' },
  { id: 'layout-footer', area: 'footer', sizeToken: '--m3-layout-footer-height' },
]
</script>

<template>
  <m-layout class="layout-default" :schema="schema">
    <m-layout-header>
      <slot name="header" />
    </m-layout-header>

    <m-layout-aside position="left">
      <slot name="aside-left" />
    </m-layout-aside>

    <m-layout-main>
      <slot />
    </m-layout-main>

    <m-layout-footer>
      <slot name="footer" />
    </m-layout-footer>
  </m-layout>
</template>
