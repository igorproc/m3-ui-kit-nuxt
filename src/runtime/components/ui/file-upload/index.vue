<template>
  <div
    class="ui-file-upload"
    role="group"
    :aria-labelledby="label ? labelId : undefined"
    :aria-describedby="hint ? hintId : undefined"
    :aria-disabled="disabled || undefined"
  >
    <p
      v-if="label"
      :id="labelId"
      class="ui-file-upload__label"
    >
      {{ label }}
      <span
        v-if="required"
        class="ui-file-upload__required"
        aria-hidden="true"
      >*</span>
    </p>

    <!-- The one picker: the dropzone's button opens it, the queue shows what
         was chosen. It holds every file of the model, so `required` and a
         form see what the control holds. -->
    <input
      ref="picker"
      class="ui-file-upload__picker"
      type="file"
      tabindex="-1"
      aria-hidden="true"
      :accept="accept"
      :multiple="multiple"
      :required="required"
      :disabled="disabled || readonly"
      @change="onPick"
    >

    <slot
      name="dropzone"
      :open-picker="openPicker"
      :add-files="addFiles"
    >
      <FileUploadDropzone />
    </slot>

    <!-- Mounted once and kept: a region that appears with its text is not
         reliably announced. -->
    <p
      class="ui-file-upload__rejection"
      role="alert"
    >
      <template v-if="lastRejection">
        <MIcon
          :name="ICONS.error"
          class="ui-file-upload__rejection-icon"
          aria-hidden="true"
        />
        <slot
          name="rejection"
          :rejection="lastRejection"
        >
          {{ rejectionText }}
        </slot>
      </template>
    </p>

    <slot
      name="list"
      :entries="queue.entries.value"
    >
      <FileUploadList :can-upload="canUpload">
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
      <!-- There while the queue has rows, off when nothing waits: finishing
           the uploads does not pull the page up. With auto-start nothing ever
           waits for it, so it is not offered. -->
      <MButton
        v-if="messages.startAll && !autoStart && queue.entries.value.length"
        type="button"
        class="ui-file-upload__start"
        :disabled="disabled || readonly || !canUpload || !hasQueued"
        @click="queue.start()"
      >
        {{ messages.startAll }}
      </MButton>
    </slot>

    <span
      class="ui-file-upload__status"
      role="status"
    >{{ announcement }}</span>
  </div>
</template>

<script setup lang="ts" generic="TResult = unknown">
import { onBeforeUnmount, onMounted } from 'vue'
import type { FileRejection } from '#kit/shared/utils/file'
import type { FileUploadEntry, FileUploadEvent, FileUploadQueue } from '#kit/composables/file-upload/useFileUploadQueue'
import MButton from '#kit/components/ui/button/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import FileUploadDropzone from '#kit/components/fragments/file-upload/Dropzone.vue'
import FileUploadList from '#kit/components/fragments/file-upload/List.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { createFilePolicy, syncInputFiles } from '#kit/shared/utils/file'
import { provideFileUploadContext } from '#kit/utils/file-upload/context'
import { useFileUploadQueue } from '#kit/composables/file-upload/useFileUploadQueue'
import { mFileUploadProps } from './props'
import type { MFileUploadSlots } from './props'

const props = defineProps(mFileUploadProps)
const model = defineModel<File[]>({ default: () => [] })
const emit = defineEmits<{
  (event: 'add', files: File[]): void
  (event: 'reject', rejection: FileRejection): void
  (event: 'start' | 'progress' | 'success' | 'error' | 'cancel', entry: FileUploadEntry<TResult>): void
  (event: 'remove', file: File): void
  (event: 'complete'): void
}>()
defineSlots<MFileUploadSlots>()

const labelId = useId()
const hintId = useId()
const picker = ref<HTMLInputElement | null>(null)
const lastRejection = ref<FileRejection>()
const announcement = ref('')

// One evaluation, against what is left of `maxFiles` once the model's files count.
const policy = computed(() => createFilePolicy({
  accept: props.accept,
  maxFiles: props.maxFiles === undefined ? undefined : Math.max(0, props.maxFiles - model.value.length),
  maxSize: props.maxSize,
}))

// The app's queue outlives this component; without one, the component keeps
// its own for as long as it is mounted.
const queue: FileUploadQueue<TResult> = (props.queue as FileUploadQueue<TResult> | undefined) ?? useFileUploadQueue<TResult>({
  upload: props.upload as ((file: File, context: Parameters<NonNullable<typeof props.upload>>[1]) => Promise<TResult>) | undefined,
  concurrency: () => props.concurrency,
})
const canUpload = computed(() => queue.canUpload)

// Every status change is said once, through one region that already exists:
// "contract.pdf · Uploaded". Silent without a status word to say.
function onQueueEvent(event: FileUploadEvent, entry?: FileUploadEntry<TResult>) {
  if (event === 'complete') {
    emit('complete')
    return
  }
  if (!entry) return
  if (event !== 'progress') {
    const word = props.messages.status?.[entry.status]
    if (word) announcement.value = `${entry.file.name} · ${word}`
  }
  emit(event, entry)
}

const unsubscribe = queue.subscribe(onQueueEvent)
onBeforeUnmount(unsubscribe)

// A file read back through reactive state may come wrapped in a proxy where
// the DOM `File` has no string tag of its own (test DOMs); identity is the
// file underneath.
const sameFile = (left: File, right: File) => toRaw(left) === toRaw(right)

const hasQueued = computed(() => queue.entries.value.some(entry => entry.status === 'queued'))

const rejectionText = computed(() => {
  const rejection = lastRejection.value
  if (!rejection) return ''
  const reasons = rejection.reasons.map(reason => props.messages.reject?.[reason]).filter(Boolean)
  return reasons.length ? `${rejection.file.name}: ${reasons.join(', ')}` : rejection.file.name
})

function openPicker() {
  if (!props.disabled && !props.readonly) picker.value?.click()
}

function onReject(rejection: FileRejection) {
  lastRejection.value = rejection
  emit('reject', rejection)
}

// Uploads run in the browser only: on the server nothing starts, so the HTML
// shows the rows waiting and the client takes it from there once mounted.
const mounted = ref(false)

function startNew(added: readonly FileUploadEntry<TResult>[]) {
  if (added.length && props.autoStart && mounted.value) queue.start()
}

function addFiles(files: readonly File[]) {
  if (props.disabled || props.readonly) return
  const result = policy.value.evaluate(files)
  result.rejected.forEach(onReject)
  const accepted = props.multiple ? result.accepted : result.accepted.slice(0, 1)
  if (!accepted.length) return
  if (!result.rejected.length) lastRejection.value = undefined
  const added = queue.add(accepted)
  if (!added.length) return
  model.value = [...model.value, ...added.map(entry => entry.file)]
  emit('add', added.map(entry => entry.file))
  startNew(added)
}

function syncPicker() {
  if (import.meta.client && picker.value) syncInputFiles(picker.value, model.value.map(file => toRaw(file)))
}

function onPick() {
  addFiles([...picker.value?.files ?? []])
  // A refused pick leaves the model as it was; the picker goes back to it.
  syncPicker()
}

function remove(id: string) {
  const entry = queue.entries.value.find(item => item.id === id)
  if (!entry) return
  queue.remove(id)
  model.value = model.value.filter(file => !sameFile(file, entry.file))
  emit('remove', entry.file)
}

provideFileUploadContext({
  entries: queue.entries,
  disabled: computed(() => props.disabled),
  readonly: computed(() => props.readonly),
  accept: computed(() => props.accept),
  label: computed(() => props.label),
  hint: computed(() => props.hint),
  hintId: computed(() => props.hint ? hintId : undefined),
  messages: computed(() => props.messages),
  addFiles,
  openPicker,
  start: queue.start,
  cancel: queue.cancel,
  retry: queue.retry,
  remove,
  reject: onReject,
})

// The model and the queue are one list seen twice: files written into the
// model join the queue (and start, with `autoStart`), files taken out of it —
// `v-model = []` included — leave it.
watch(model, (files) => {
  for (const entry of queue.entries.value) {
    if (!files.some(file => sameFile(file, entry.file))) queue.remove(entry.id)
  }
  startNew(queue.add(files))
}, { immediate: true })

watch([model, picker], syncPicker, { flush: 'post' })

onMounted(() => {
  mounted.value = true
  if (props.autoStart && hasQueued.value) queue.start()
})

if (import.meta.dev && !props.label) {
  console.warn('[m-file-upload] has no accessible name: pass `label`.')
}

defineExpose({ entries: queue.entries, start: queue.start, cancel: queue.cancel, retry: queue.retry, remove })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/file-upload' as t;
@use '#kit/assets/stylesheet/components/file-upload/parts' as parts;

.ui-file-upload {
  $t: material-map(t.$tokens, 'm-file-upload');

  display: flex;
  flex-direction: column;
  gap: g($t, 'root.gap');
  min-width: 0;

  &__label {
    margin: 0;
    color: g($t, 'label.color');

    @include typescale(g($t, 'label.typography'));
  }

  &__required {
    color: g($t, 'label.required.color');
  }

  // Reserved even while empty, right under the dropzone the refusal is about.
  &__rejection {
    display: flex;
    align-items: center;
    gap: g($t, 'rejection.gap');
    min-height: g($t, 'rejection.min-height');
    margin: 0;
    color: g($t, 'rejection.color');
    overflow-wrap: anywhere;

    @include typescale(g($t, 'rejection.typography'));
  }

  &__rejection-icon {
    flex: 0 0 auto;
    font-size: g($t, 'rejection.icon.size');
  }

  &__status {
    @include sr-only;
  }

  @include parts.dropzone($t);
  @include parts.queue($t);
}
</style>
