<template>
  <MLayout>
    <MSystemBar data-test="layout-system-bar">
      You are offline. Changes made on this device are kept locally and will sync with the shared workspace as soon as the connection comes back; until then other reviewers will not see your latest edits, comments or uploaded files
      <template #append>
        <MIcon :name="ICONS.cloud" />
      </template>
    </MSystemBar>

    <MAppBar
      title="Workspace"
      data-test="layout-app-bar"
    />

    <MLayoutItem kind="main">
      <p>Page content under the pinned bars.</p>
    </MLayoutItem>
  </MLayout>
</template>

<script setup lang="ts">
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutItem from '#kit/components/ui/layout/item.vue'
import MSystemBar from '#kit/components/ui/system-bar/index.vue'
import MAppBar from '#kit/components/ui/app-bar/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
</script>
