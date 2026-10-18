<template>
  <li
    ref="root"
    class="ui-file-upload__item"
    :class="`ui-file-upload__item--${entry.status}`"
  >
    <MIcon
      :name="STATUS_ICON[entry.status]"
      class="ui-file-upload__item-icon"
      aria-hidden="true"
    />

    <div class="ui-file-upload__item-content">
      <!-- The stem shortens, the extension stays: "a_very_long_na….pdf". -->
      <span
        class="ui-file-upload__item-name"
        :title="entry.file.name"
      >
        <span class="ui-file-upload__item-stem">{{ name.stem }}</span>
        <span class="ui-file-upload__item-extension">{{ name.extension }}</span>
      </span>

      <span class="ui-file-upload__item-meta">
        {{ meta }}
      </span>

      <MProgressLinear
        v-if="entry.status === 'uploading'"
        :indeterminate="entry.progress === null"
        :value="entry.progress ?? 0"
        :aria-label="entry.file.name"
      />
    </div>

    <div class="ui-file-upload__item-actions">
      <MButtonIcon
        v-if="entry.status === 'queued'"
        type="button"
        class="ui-file-upload__action--start"
        :aria-label="names.start"
        :disabled="inactive || !canUpload"
        @click="act(() => ctx.start(entry.id), 'cancel')"
      >
        <MIcon :name="ICONS.upload" />
      </MButtonIcon>

      <MButtonIcon
        v-if="entry.status === 'uploading'"
        type="button"
        class="ui-file-upload__action--cancel"
        :aria-label="names.cancel"
        :disabled="inactive"
        @click="act(() => ctx.cancel(entry.id), 'retry')"
      >
        <MIcon :name="ICONS.stop" />
      </MButtonIcon>

      <MButtonIcon
        v-if="entry.status === 'error' || entry.status === 'cancelled'"
        type="button"
        class="ui-file-upload__action--retry"
        :aria-label="names.retry"
        :disabled="inactive || !canUpload"
        @click="act(() => ctx.retry(entry.id), 'cancel')"
      >
        <MIcon :name="ICONS.refresh" />
      </MButtonIcon>

      <MButtonIcon
        type="button"
        class="ui-file-upload__action--remove"
        :aria-label="names.remove"
        :disabled="inactive || entry.status === 'uploading'"
        @click="emit('remove')"
      >
        <MIcon :name="ICONS.close" />
      </MButtonIcon>
    </div>
  </li>
</template>

<script setup lang="ts">
/**
 * One row of the upload queue: status glyph, name, size and status words,
 * progress while uploading, and the actions the status allows.
 *
 * An action that swaps its own button for another (start → cancel) hands focus
 * to the new one, so the keyboard never drops to the page. Removal is the
 * list's to resolve: it knows which row comes next.
 */
import type { FileUploadEntry, FileUploadStatus } from '#kit/composables/file-upload/useFileUploadQueue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MProgressLinear from '#kit/components/ui/progress/linear/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { useFileUploadContext } from '#kit/composables/file-upload/context'
import { formatFileSize } from '#kit/shared/utils/file'
import { actionName, splitFileName } from './upload'

const props = defineProps<{ entry: FileUploadEntry, canUpload: boolean }>()
const emit = defineEmits<{ (event: 'remove'): void }>()

const ctx = useFileUploadContext()
const root = ref<HTMLElement | null>(null)

// Status is told by a glyph and in words as well as in colour.
const STATUS_ICON: Record<FileUploadStatus, string> = {
  queued: ICONS.schedule,
  uploading: ICONS.upload,
  success: ICONS.checkCircle,
  error: ICONS.error,
  cancelled: ICONS.close,
}

const inactive = computed(() => ctx.disabled.value || ctx.readonly.value)
const name = computed(() => splitFileName(props.entry.file.name))

const meta = computed(() => {
  const messages = ctx.messages.value
  const progress = props.entry.status === 'uploading' && props.entry.progress !== null
    ? `${Math.round(props.entry.progress)}%`
    : undefined
  const reason = props.entry.status === 'error' ? messages.error?.(props.entry.error) : undefined

  return [formatFileSize(props.entry.file.size), messages.status?.[props.entry.status], progress, reason]
    .filter(Boolean)
    .join(' · ')
})

const names = computed(() => {
  const messages = ctx.messages.value
  const file = props.entry.file.name
  return {
    start: actionName(messages.start, file),
    cancel: actionName(messages.cancel, file),
    retry: actionName(messages.retry, file),
    remove: actionName(messages.remove, file),
  }
})

function act(action: () => void, next: 'cancel' | 'retry') {
  const hadFocus = root.value?.contains(document.activeElement) ?? false
  action()
  if (!hadFocus) return

  nextTick(() => {
    const target = root.value?.querySelector<HTMLElement>(`.ui-file-upload__action--${next}`)
      ?? root.value?.querySelector<HTMLElement>('.ui-file-upload__action--remove')
    target?.focus()
  })
}
</script>
