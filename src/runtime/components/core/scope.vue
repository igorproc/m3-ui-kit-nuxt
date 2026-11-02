<script lang="ts" setup>
// Client-only modal runtime host. Loading presentation is intentionally NOT
// rendered here: it belongs to the <MApp> `loading` slot (see docs/architecture.md). Without
// a slot, no progress UI is drawn.
//
// The overlay host carries the app-level announcement regions as its first
// child: surfaces teleported here write into them (`useLiveRegion`), and they
// are already in the document before the first message.
import LiveRegion from '#kit/components/fragments/live-region/index.vue'
</script>

<template>
  <div
    id="ui-overlay-host"
    class="ui-app__overlay-host"
  >
    <LiveRegion />
  </div>

  <core-global-container />
</template>
