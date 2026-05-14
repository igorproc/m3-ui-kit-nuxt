<script setup lang="ts">
import type { LayoutItem } from '~/composables/useLayout'

const schema: LayoutItem[] = [
  { id: 'app-bar', area: 'header', sizeToken: '--ui-app-bar-height-center-aligned' },
  { id: 'layout-footer', area: 'footer', sizeToken: '--m3-layout-footer-height' },
]
</script>

<template>
  <m-layout class="layout-primetime" :schema="schema">
    <m-layout-header>
      <slot name="header" />
    </m-layout-header>

    <m-layout-main>
      <slot />
    </m-layout-main>

    <m-layout-footer>
      <slot name="footer" />
    </m-layout-footer>
  </m-layout>
</template>
