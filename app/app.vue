<script setup lang="ts">
// Initialize the theme store to apply global HTML attributes and dynamic CSS
const themeStore = useThemeStore()
</script>

<template>
  <div>
    <!--
      Attach layer for teleported floating surfaces (menus, dropdowns,
      split-button overflows). Rendered first and outside <client-only> so
      the target exists in the SSR markup and is mounted before any <m-menu>
      teleports into it. Carries no transform/filter so `position: fixed`
      children resolve against the viewport (no containing-block trap →
      no scroll lag, no left-edge snap).
    -->
    <div
      id="ui-overlay-host"
      class="ui-overlay-host"
    />

    <NuxtRouteAnnouncer />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <client-only>
      <core-scope />
    </client-only>
  </div>
</template>

<style lang="scss">
.ui-overlay-host {
  position: fixed;
  inset: 0;

  // Pass-through layer: only the actual surfaces capture pointer events.
  pointer-events: none;
  z-index: z('dialog');

  > * {
    pointer-events: auto;
  }
}
</style>
