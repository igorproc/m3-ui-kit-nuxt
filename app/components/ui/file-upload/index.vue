<template>
  <div class="ui-file-upload">
    <MFileInput
      ref="picker"
      :model-value="model"
      :accept="accept"
      :multiple="multiple"
      :max-files="maxFiles"
      :max-size="maxSize"
      :disabled="disabled"
      :readonly="readonly"
      @select="files => addFiles(files, 'picker')"
      @reject="onReject"
    />
    <slot
      name="dropzone"
      :open-picker="openPicker"
      :add-files="addFiles"
    >
      <FileUploadDropzone />
    </slot>
    <slot
      name="list"
      :entries="queue.entries.value"
    >
      <FileUploadList>
        <template
          v-if="$slots.item"
          #item="state"
        >
          <slot
            name="item"
            v-bind="state"
          />
        </template>
        <template
          v-if="$slots.empty"
          #empty
        >
          <slot name="empty" />
        </template>
      </FileUploadList>
    </slot>
    <slot
      name="actions"
      :start="queue.start"
      :entries="queue.entries.value"
    >
      <MButton
        v-if="queue.entries.value.some(entry => entry.status === 'queued')"
        type="button"
        :disabled="disabled || readonly || !upload"
        @click="queue.start()"
      >
        Start uploads
      </MButton>
    </slot>
    <div
      v-if="lastRejection"
      class="ui-file-upload__rejection"
      role="alert"
    >
      <slot
        name="rejection"
        :rejection="lastRejection"
      >
        {{ lastRejection.file.name }} was rejected
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TResult = unknown">
import type { FileRejection } from '~~/shared/utils/file'
import type { FileUploadEntry } from '~/composables/file-upload/useFileUploadQueue'
import MButton from '~/components/ui/button/index.vue'
import MFileInput from '~/components/ui/file-input/index.vue'
import FileUploadDropzone from '~/components/fragments/file-upload/Dropzone.vue'
import FileUploadList from '~/components/fragments/file-upload/List.vue'
import { createFilePolicy } from '~~/shared/utils/file'
import { provideFileUploadContext } from '~/composables/file-upload/context'
import { useFileUploadQueue } from '~/composables/file-upload/useFileUploadQueue'
import { mFileUploadProps } from './props'

const props = defineProps(mFileUploadProps)
const model = defineModel<File[]>({ default: () => [] })
const emit = defineEmits<{
  (event: 'add', files: File[]): void
  (event: 'reject', rejection: FileRejection): void
  (event: 'start' | 'progress' | 'success' | 'error' | 'cancel', entry: FileUploadEntry<TResult>): void
  (event: 'remove', file: File): void
  (event: 'complete'): void
}>()

const picker = ref<{ open: () => void }>()
const lastRejection = ref<FileRejection>()
const policy = computed(() => createFilePolicy({
  accept: props.accept,
  maxFiles: props.maxFiles === undefined ? undefined : Math.max(0, props.maxFiles - model.value.length),
  maxSize: props.maxSize,
}))
const queue = useFileUploadQueue<TResult>({
  upload: props.upload as ((file: File, context: Parameters<NonNullable<typeof props.upload>>[1]) => Promise<TResult>) | undefined,
  concurrency: () => props.concurrency,
  onStart: entry => emit('start', entry),
  onProgress: entry => emit('progress', entry),
  onSuccess: entry => emit('success', entry),
  onError: entry => emit('error', entry),
  onCancel: entry => emit('cancel', entry),
  onComplete: () => emit('complete'),
})

function openPicker() {
  if (!props.disabled && !props.readonly) picker.value?.open()
}

function onReject(rejection: FileRejection) {
  lastRejection.value = rejection
  emit('reject', rejection)
}

function addFiles(files: readonly File[], _source: 'picker' | 'drop') {
  if (props.disabled || props.readonly) return
  const result = policy.value.evaluate(files)
  result.rejected.forEach(onReject)
  const accepted = props.multiple ? result.accepted : result.accepted.slice(0, 1)
  if (!accepted.length) return
  const added = queue.add(accepted)
  if (!added.length) return
  model.value = [...model.value, ...added.map(entry => entry.file)]
  emit('add', added.map(entry => entry.file))
  if (props.autoStart) queue.start()
}

function remove(id: string) {
  const entry = queue.entries.value.find(item => item.id === id)
  if (!entry) return
  queue.remove(id)
  model.value = model.value.filter(file => file !== entry.file)
  emit('remove', entry.file)
}

provideFileUploadContext({
  entries: queue.entries,
  disabled: computed(() => props.disabled),
  readonly: computed(() => props.readonly),
  accept: computed(() => props.accept),
  addFiles,
  openPicker,
  start: queue.start,
  cancel: queue.cancel,
  retry: queue.retry,
  remove,
  reject: onReject,
})

watch(model, (files) => {
  queue.add(files)
}, { immediate: true })

defineExpose({ entries: queue.entries, start: queue.start, cancel: queue.cancel, retry: queue.retry, remove })
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/file-upload' as t;

.ui-file-upload {
  $t: material-map(t.$tokens, 'md-file-upload');

  display: flex;
  flex-direction: column;
  gap: g($t, 'root-gap');

  &__dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: g($t, 'dropzone-min-height');
    padding: g($t, 'dropzone-padding');
    gap: g($t, 'dropzone-gap');
    border: 1rem dashed g($t, 'dropzone-outline');
    border-radius: g($t, 'dropzone-shape');

    &--dragging {
      border-color: g($t, 'dropzone-dragging-outline');
      background: g($t, 'dropzone-dragging-container');
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: g($t, 'list-gap');
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: g($t, 'item-gap');
    padding: g($t, 'item-padding');
    border-radius: g($t, 'item-shape');
    background: g($t, 'item-container');
    color: g($t, 'item-color');
  }

  &__item-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    > span { color: g($t, 'item-meta-color'); }
  }

  &__item-actions { display: flex; }
}
</style>
