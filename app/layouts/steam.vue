<script setup lang="ts">
import type { LayoutItem } from '~/composables/useLayout'

const schema: LayoutItem[] = [
  { id: 'layout-header', area: 'header', sizeToken: '--m3-layout-header-height' },
  { id: 'layout-aside-left', area: 'left', sizeToken: '--m3-layout-drawer-width' },
  { id: 'layout-aside-right', area: 'right', sizeToken: '--m3-layout-drawer-width' },
]
</script>

<template>
  <m-layout
    full-height
    class="layout-steam"
    :schema="schema"
  >
    <m-layout-header>
      <slot name="header" />
    </m-layout-header>

    <m-layout-aside position="left">
      <slot name="sidebar" />
    </m-layout-aside>

    <m-layout-main>
      <slot />
    </m-layout-main>

    <m-layout-aside position="right">
      <slot name="friends" />
    </m-layout-aside>
  </m-layout>
</template>
