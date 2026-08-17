<script lang="ts" setup>
// Client-only modal runtime host. Loading presentation is intentionally NOT
// rendered here: it belongs to the <MApp> `loading` slot (see app.md). Without
// a slot, no progress UI is drawn.
</script>

<template>
  <div
    id="ui-overlay-host"
    class="ui-app__overlay-host"
  />

  <core-global-container />
</template>
