<template>
  <li class="ui-file-upload__item">
    <MIcon name="round-insert-drive-file" />

    <div class="ui-file-upload__item-content">
      <strong>{{ entry.file.name }}</strong>
      <span>{{ formatFileSize(entry.file.size) }} · {{ entry.status }}</span>

      <MProgressLinear
        v-if="entry.status === 'uploading'"
        :indeterminate="entry.progress === null"
        :value="entry.progress ?? 0"
        :aria-label="`Uploading ${entry.file.name}`"
      />

      <span
        v-if="entry.status === 'error'"
        role="alert"
      >Upload failed</span>
    </div>

    <div class="ui-file-upload__item-actions">
      <MButtonIcon
        v-if="entry.status === 'queued'"
        type="button"
        aria-label="Start upload"
        @click="ctx.start(entry.id)"
      >
        <MIcon name="round-upload" />
      </MButtonIcon>

      <MButtonIcon
        v-if="entry.status === 'uploading'"
        type="button"
        aria-label="Cancel upload"
        @click="ctx.cancel(entry.id)"
      >
        <MIcon name="round-stop" />
      </MButtonIcon>

      <MButtonIcon
        v-if="entry.status === 'error' || entry.status === 'cancelled'"
        type="button"
        aria-label="Retry upload"
        @click="ctx.retry(entry.id)"
      >
        <MIcon name="round-refresh" />
      </MButtonIcon>

      <MButtonIcon
        type="button"
        aria-label="Remove file"
        :disabled="entry.status === 'uploading'"
        @click="ctx.remove(entry.id)"
      >
        <MIcon name="round-close" />
      </MButtonIcon>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { FileUploadEntry } from '~/composables/file-upload/useFileUploadQueue'
import MButtonIcon from '~/components/ui/button/icon/index.vue'
import MIcon from '~/components/ui/icon/index.vue'
import MProgressLinear from '~/components/ui/progress/linear/index.vue'
import { useFileUploadContext } from '~/composables/file-upload/context'
import { formatFileSize } from '~~/shared/utils/file'

defineProps<{ entry: FileUploadEntry }>()
const ctx = useFileUploadContext()
</script>
