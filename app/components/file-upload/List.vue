<template>
  <ul
    v-if="ctx.entries.value.length"
    class="ui-file-upload__list"
    aria-label="Upload queue"
  >
    <slot
      v-for="entry in ctx.entries.value"
      :key="entry.id"
      name="item"
      :entry="entry"
      :start="() => ctx.start(entry.id)"
      :cancel="() => ctx.cancel(entry.id)"
      :retry="() => ctx.retry(entry.id)"
      :remove="() => ctx.remove(entry.id)"
    >
      <FileUploadItem :entry="entry" />
    </slot>
  </ul>
  <slot
    v-else
    name="empty"
  >
    <p class="ui-file-upload__empty">
      No files selected
    </p>
  </slot>
</template>

<script setup lang="ts">
import FileUploadItem from './Item.vue'
import { useFileUploadContext } from '~/composables/file-upload/context'

const ctx = useFileUploadContext()
</script>
